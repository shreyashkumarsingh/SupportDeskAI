import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface MonitoringStats {
  total_predictions: number;
  avg_confidence: number;
  low_confidence_count: number;
  drift_detected: boolean;
  accuracy?: number;
  recent_prediction_distribution: Record<string, number>;
  confidence_range: {
    min: number;
    max: number;
    mean: number;
    std: number;
  };
  retraining_suggested: boolean;
  last_updated?: string;
}

interface MonitoringDashboardProps {
  stats: MonitoringStats | null;
  isLoading?: boolean;
  onRefresh?: () => void;
}

/**
 * Monitoring Dashboard Component
 * 
 * Displays real-time model performance metrics including:
 * - Prediction count and confidence trends
 * - Data drift detection status
 * - Accuracy metrics
 * - Category distribution
 * - Retraining recommendations
 * 
 * Props:
 * - stats: Monitoring statistics object
 * - isLoading: Loading state
 * - onRefresh: Callback to refresh data
 */
export const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({ 
  stats, 
  isLoading = false,
  onRefresh 
}) => {
  const [distributionData, setDistributionData] = useState<Array<{ name: string; value: number }>>([]);

  useEffect(() => {
    if (stats?.recent_prediction_distribution) {
      const data = Object.entries(stats.recent_prediction_distribution).map(([name, value]) => ({
        name,
        value: Math.round(value * 100)
      }));
      setDistributionData(data);
    }
  }, [stats]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Model Monitoring</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Loading monitoring data...</p>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Model Monitoring</CardTitle>
          <CardDescription>Real-time performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">No monitoring data available</p>
        </CardContent>
      </Card>
    );
  }

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

  return (
    <div className="w-full space-y-4">
      {/* Header with Alerts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Model Performance Monitoring</CardTitle>
              <CardDescription>
                {stats.last_updated && 
                  `Last updated: ${new Date(stats.last_updated).toLocaleTimeString()}`
                }
              </CardDescription>
            </div>
            {stats.drift_detected && (
              <Badge variant="destructive" className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Data Drift Detected
              </Badge>
            )}
            {stats.retraining_suggested && (
              <Badge variant="secondary" className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4" />
                Retraining Recommended
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Predictions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total_predictions.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">predictions processed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Confidence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{(stats.avg_confidence * 100).toFixed(1)}%</div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.avg_confidence > 0.8 ? (
                <span className="text-green-600 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Excellent
                </span>
              ) : stats.avg_confidence > 0.6 ? (
                <span className="text-yellow-600">Good</span>
              ) : (
                <span className="text-red-600 flex items-center gap-1">
                  <TrendingDown className="w-3 h-3" /> Needs review
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Low Confidence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {stats.low_confidence_count}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.total_predictions > 0 
                ? `${((stats.low_confidence_count / stats.total_predictions) * 100).toFixed(1)}%`
                : 'N/A'
              }
            </p>
          </CardContent>
        </Card>

        {stats.accuracy !== undefined && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Accuracy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${stats.accuracy > 0.9 ? 'text-green-600' : 'text-yellow-600'}`}>
                {(stats.accuracy * 100).toFixed(1)}%
              </div>
              <p className="text-xs text-gray-500 mt-1">from feedback</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Confidence Range Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Confidence Distribution</CardTitle>
          <CardDescription>Min, Max, and Standard Deviation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs font-semibold text-blue-900 mb-1">Minimum</p>
              <p className="text-2xl font-bold text-blue-700">
                {(stats.confidence_range.min * 100).toFixed(1)}%
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-xs font-semibold text-green-900 mb-1">Average</p>
              <p className="text-2xl font-bold text-green-700">
                {(stats.confidence_range.mean * 100).toFixed(1)}%
              </p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-xs font-semibold text-purple-900 mb-1">Maximum</p>
              <p className="text-2xl font-bold text-purple-700">
                {(stats.confidence_range.max * 100).toFixed(1)}%
              </p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
              <p className="text-xs font-semibold text-orange-900 mb-1">Std Dev</p>
              <p className="text-2xl font-bold text-orange-700">
                {(stats.confidence_range.std * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prediction Distribution */}
      {distributionData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Prediction Distribution</CardTitle>
            <CardDescription>Recent ticket category distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Alerts & Recommendations */}
      <div className="space-y-3">
        {stats.drift_detected && (
          <Card className="border-red-200 bg-red-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-red-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Data Drift Detected
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-red-800">
              <p>The input data distribution has changed significantly. Consider retraining the model with new data to maintain accuracy.</p>
            </CardContent>
          </Card>
        )}

        {stats.retraining_suggested && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-yellow-900 flex items-center gap-2">
                <TrendingDown className="w-5 h-5" />
                Model Retraining Recommended
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-yellow-800">
              <p>Model performance metrics suggest retraining is recommended. Review the feedback corrections and retrain when ready.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MonitoringDashboard;
