import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Sparkles, 
  TrendingUp, 
  Tag, 
  Activity,
  Loader2,
  CheckCircle2,
  Upload,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { PageTransition } from '@/components/PageTransition';
import { StatCard } from '@/components/StatCard';
import { CategoryBadge } from '@/components/CategoryBadge';
import { usePredictions } from '@/hooks/usePredictions';
import { PredictionResult, TicketCategory, ticketCategories } from '@/utils/mockData';
import { useAuth } from '@/context/AuthContext';
import { predictBatchTickets, submitPredictionFeedback, triggerRetrain } from '@/lib/api';

const DashboardPage: React.FC = () => {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [isPredicting, setIsPredicting] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [predictionMeta, setPredictionMeta] = useState<{ requestId?: string; plainExplanation?: string; modelVersion?: string; confidenceStatus?: string; quality?: { score: number; issues: string[]; is_acceptable: boolean } } | null>(null);
  const [overrideCategory, setOverrideCategory] = useState<TicketCategory>('Incident');
  const [reviewMessage, setReviewMessage] = useState('');
  const [bulkReport, setBulkReport] = useState<{ total: number; successful: number; model_version?: string } | null>(null);
  const [isUploadingCsv, setIsUploadingCsv] = useState(false);
  const [isRetraining, setIsRetraining] = useState(false);
  const { predict, getStats, error, appendReviewedPrediction } = usePredictions();
  const { user } = useAuth();

  const stats = getStats();

  const handlePredict = async () => {
    if (!subject.trim() || !description.trim()) return;
    
    setIsPredicting(true);
    setResult(null);
    
    try {
      const prediction = await predict(subject, description, user?.id);
      setResult(prediction);
      setOverrideCategory(prediction.category);
      setPredictionMeta({
        requestId: (prediction as any).requestId,
        plainExplanation: (prediction as any).plainExplanation,
        modelVersion: (prediction as any).modelVersion,
        confidenceStatus: (prediction as any).confidenceStatus,
        quality: (prediction as any).quality,
      });
    } finally {
      setIsPredicting(false);
    }
  };

  const handleAcceptPrediction = async () => {
    if (!result || !predictionMeta?.requestId) return;
    setReviewMessage('');
    try {
      await submitPredictionFeedback({
        predictionId: predictionMeta.requestId,
        correctCategory: result.category,
        comments: 'Accepted by agent',
        userId: user?.id,
        userRole: user?.role || 'agent',
      });
      setReviewMessage('Prediction accepted and feedback logged.');
    } catch {
      setReviewMessage('Could not submit acceptance feedback right now.');
    }
  };

  const handleOverridePrediction = async () => {
    if (!result || !predictionMeta?.requestId) return;
    setReviewMessage('');
    try {
      await submitPredictionFeedback({
        predictionId: predictionMeta.requestId,
        correctCategory: overrideCategory,
        comments: `Overridden from ${result.category} to ${overrideCategory}`,
        userId: user?.id,
        userRole: user?.role || 'agent',
      });
      appendReviewedPrediction({
        subject,
        body: description,
        category: overrideCategory,
        confidence: result.confidence,
      });
      setReviewMessage(`Prediction overridden to ${overrideCategory} and saved.`);
    } catch {
      setReviewMessage('Could not submit override feedback right now.');
    }
  };

  const handleCsvUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingCsv(true);
    setBulkReport(null);
    try {
      const csvText = await file.text();
      const lines = csvText.split(/\r?\n/).filter(Boolean);
      if (lines.length <= 1) {
        setReviewMessage('CSV must include headers and at least one row.');
        return;
      }

      const header = lines[0].split(',').map((item) => item.trim().toLowerCase());
      const subjectIndex = header.indexOf('subject');
      const descriptionIndex = header.indexOf('description');
      if (subjectIndex === -1 || descriptionIndex === -1) {
        setReviewMessage('CSV headers must include subject and description.');
        return;
      }

      const tickets = lines.slice(1).map((line) => {
        const columns = line.split(',');
        return {
          subject: (columns[subjectIndex] || '').trim(),
          description: (columns[descriptionIndex] || '').trim(),
        };
      }).filter((item) => item.subject && item.description);

      if (tickets.length === 0) {
        setReviewMessage('No valid ticket rows found in CSV.');
        return;
      }

      const batchResult = await predictBatchTickets({
        tickets,
        userId: user?.id,
        userRole: user?.role || 'agent',
      });

      setBulkReport({
        total: batchResult.total,
        successful: batchResult.successful,
        model_version: batchResult.model_version,
      });
      setReviewMessage('Bulk prediction completed. You can export history from the History page.');
    } catch {
      setReviewMessage('Bulk prediction failed. Please check CSV format and try again.');
    } finally {
      setIsUploadingCsv(false);
      event.target.value = '';
    }
  };

  const handleTriggerRetrain = async () => {
    setIsRetraining(true);
    setReviewMessage('');
    try {
      const response = await triggerRetrain({ reason: 'manual_dashboard_request', minFeedbackRecords: 10 }, user?.id, user?.role || 'agent');
      setReviewMessage(`Retraining queued: ${response.candidate_model_version}`);
    } catch (err: any) {
      setReviewMessage(err?.response?.data?.detail || 'Retraining could not be triggered.');
    } finally {
      setIsRetraining(false);
    }
  };

  const resetForm = () => {
    setSubject('');
    setDescription('');
    setResult(null);
    setPredictionMeta(null);
    setReviewMessage('');
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <Navbar />
        
        <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {/* Header */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">Classify support tickets with AI-powered predictions</p>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              title="Total Predictions"
              value={stats.totalPredictions}
              icon={Activity}
              delay={0.1}
            />
            <StatCard
              title="Most Common Category"
              value={stats.mostCommonCategory}
              icon={Tag}
              delay={0.2}
            />
            <StatCard
              title="Last Prediction"
              value={stats.lastPredictionCategory}
              icon={Brain}
              delay={0.3}
            />
            <StatCard
              title="Unique Categories"
              value={stats.uniqueCategories}
              icon={TrendingUp}
              delay={0.4}
            />
          </div>

          {/* Main Content */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Input Section */}
            <motion.div
              className="glass-card p-6 lg:p-8"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
                  <Brain className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Ticket Classifier</h2>
                  <p className="text-sm text-muted-foreground">Enter ticket details below</p>
                </div>
              </div>

              <div className="space-y-4">
                {error && (
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-200 text-sm text-amber-900 dark:text-amber-100">
                    {error}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-2">Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g., Can't login to my account"
                    className="input-glass"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Ticket Body</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the issue in detail..."
                    rows={5}
                    className="input-glass resize-none"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handlePredict}
                    disabled={isPredicting || !subject.trim() || !description.trim()}
                    className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed animate-glow-pulse"
                  >
                    {isPredicting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Predict Category
                      </>
                    )}
                  </button>
                  {(subject || description || result) && (
                    <button
                      onClick={resetForm}
                      className="btn-secondary px-4"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="pt-2 border-t border-border/60 space-y-3">
                  <label className="block text-sm font-medium">Bulk CSV Upload (subject,description)</label>
                  <div className="flex items-center gap-3">
                    <label className="btn-secondary px-4 py-2 cursor-pointer inline-flex items-center gap-2">
                      {isUploadingCsv ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      Upload CSV
                      <input type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} />
                    </label>
                    {bulkReport && (
                      <span className="text-sm text-muted-foreground">
                        {bulkReport.successful}/{bulkReport.total} successful • Model {bulkReport.model_version || 'N/A'}
                      </span>
                    )}
                  </div>
                </div>

                {user?.role === 'admin' && (
                  <div className="pt-2 border-t border-border/60">
                    <button
                      onClick={handleTriggerRetrain}
                      disabled={isRetraining}
                      className="btn-secondary w-full flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isRetraining ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                      Trigger Retraining
                    </button>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Results Section */}
            <motion.div
              className="glass-card p-6 lg:p-8"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                  <Activity className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Prediction Results</h2>
                  <p className="text-sm text-muted-foreground">AI classification output</p>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {isPredicting ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-16"
                  >
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full border-4 border-primary/20" />
                      <motion.div
                        className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-primary"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                    </div>
                    <p className="mt-4 text-muted-foreground">Analyzing ticket content...</p>
                  </motion.div>
                ) : result ? (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    {/* Primary Result */}
                    <div className="p-6 rounded-xl bg-primary/5 border border-primary/20">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Predicted Category</p>
                          <CategoryBadge category={result.category} size="lg" />
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground mb-1">Confidence</p>
                          <p className="text-2xl font-bold text-green-500">
                            {(result.confidence * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-green-500">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>
                          {predictionMeta?.confidenceStatus === 'needs_review' ? 'Needs manual review' : 'High confidence prediction'}
                        </span>
                      </div>
                    </div>

                    {predictionMeta && (
                      <div className="p-4 rounded-xl bg-secondary/40 border border-border space-y-2">
                        <p className="text-sm font-medium">Why this category</p>
                        <p className="text-sm text-muted-foreground">{predictionMeta.plainExplanation || 'Explanation unavailable.'}</p>
                        <p className="text-xs text-muted-foreground">
                          Model: {predictionMeta.modelVersion || 'N/A'} • Quality score: {predictionMeta.quality?.score ?? 'N/A'}
                        </p>
                      </div>
                    )}

                    {result && predictionMeta?.requestId && (
                      <div className="p-4 rounded-xl border border-border space-y-3">
                        <p className="text-sm font-medium flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4" /> Human-in-the-loop review
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <button onClick={handleAcceptPrediction} className="btn-secondary flex-1">
                            Accept Prediction
                          </button>
                          <div className="flex-1 flex gap-2">
                            <select
                              value={overrideCategory}
                              onChange={(e) => setOverrideCategory(e.target.value as TicketCategory)}
                              className="input-glass"
                            >
                              {ticketCategories.map((category) => (
                                <option key={category} value={category}>{category}</option>
                              ))}
                            </select>
                            <button onClick={handleOverridePrediction} className="btn-primary whitespace-nowrap">
                              Override
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {reviewMessage && (
                      <div className="p-3 rounded-lg bg-secondary/40 text-sm text-muted-foreground border border-border">
                        {reviewMessage}
                      </div>
                    )}

                    {/* Top 3 Categories */}
                    <div>
                      <p className="text-sm font-medium mb-3">Top 3 Predictions</p>
                      <div className="space-y-2">
                        {result.topCategories.map((item, index) => (
                          <motion.div
                            key={item.category}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center gap-3"
                          >
                            <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs font-medium">
                              {index + 1}
                            </span>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium">{item.category}</span>
                                <span className="text-sm text-muted-foreground">
                                  {(item.score * 100).toFixed(1)}%
                                </span>
                              </div>
                              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                                <motion.div
                                  className="h-full rounded-full gradient-bg"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${item.score * 100}%` }}
                                  transition={{ duration: 0.5, delay: index * 0.1 + 0.2 }}
                                />
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-16 text-center"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
                      <Brain className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">
                      Enter ticket details and click "Predict Category" to see AI predictions
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </main>
      </div>
    </PageTransition>
  );
};

export default DashboardPage;
