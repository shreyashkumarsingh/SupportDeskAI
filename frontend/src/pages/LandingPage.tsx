import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  Zap, 
  BarChart3, 
  Brain, 
  TrendingUp,
  Clock,
  Target,
  Globe,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  Github,
  Twitter,
  Linkedin
} from 'lucide-react';
import { PageTransition, fadeInUp, staggerContainer } from '../components/PageTransition';

const features = [
  {
    icon: Clock,
    title: 'Automated Ticket Categorization',
    description: 'Instantly classify support tickets into predefined categories with high accuracy.',
  },
  {
    icon: BarChart3,
    title: 'Predictive Confidence Scores',
    description: 'Get confidence percentages and top 3 category suggestions for every prediction.',
  },
  {
    icon: Brain,
    title: 'No Training Needed',
    description: 'Just paste your ticket text — our ML models do the rest automatically.',
  },
  {
    icon: TrendingUp,
    title: 'Analytics Dashboard',
    description: 'Visualize trends and optimize your workflow with real-time analytics.',
  },
];

const metrics = [
  { value: '60%', label: 'Faster ticket triaging' },
  { value: '35%', label: 'Fewer misrouted tickets' },
  { value: '22%', label: 'SLA adherence improvement' },
  { value: '15+', label: 'Languages supported' },
];

const steps = [
  { step: 1, title: 'Enter Ticket Details', description: 'Paste the subject and body of any support ticket.' },
  { step: 2, title: 'AI Predicts Category', description: 'Our ML model analyzes and classifies in milliseconds.' },
  { step: 3, title: 'View Analytics', description: 'Track predictions and optimize your support workflow.' },
];

const LandingPage: React.FC = () => {
  return (
    <PageTransition>
      <div className="min-h-screen">
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 glass-card rounded-none border-b border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link to="/home" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-lg">
                  <span className="gradient-text">SupportDesk</span>
                  <span className="text-muted-foreground ml-1">AI</span>
                </span>
              </Link>
              <div className="flex items-center gap-3">
                <Link to="/login" className="btn-secondary">
                  Login
                </Link>
                <Link to="/signup" className="btn-primary flex items-center gap-2">
                  Get Started <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative pt-32 pb-20 overflow-hidden">
          <div className="absolute inset-0 mesh-background" />
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute -top-1/2 -right-1/4 w-[800px] h-[800px] rounded-full opacity-30"
              style={{ background: 'radial-gradient(circle, hsl(239 84% 67% / 0.3), transparent 70%)' }}
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 90, 0],
              }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className="absolute -bottom-1/2 -left-1/4 w-[600px] h-[600px] rounded-full opacity-20"
              style={{ background: 'radial-gradient(circle, hsl(262 83% 58% / 0.3), transparent 70%)' }}
              animate={{ 
                scale: [1.1, 1, 1.1],
                rotate: [0, -90, 0],
              }}
              transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
            />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              className="text-center max-w-4xl mx-auto"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              <motion.div variants={fadeInUp}>
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                  <Zap className="w-4 h-4" />
                  AI-Powered Support Automation
                </span>
              </motion.div>
              
              <motion.h1 
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6"
                variants={fadeInUp}
              >
                Instant AI-Powered{' '}
                <span className="gradient-text">Support Ticket</span>{' '}
                Classification
              </motion.h1>
              
              <motion.p 
                className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
                variants={fadeInUp}
              >
                Reduce resolution time, eliminate manual triaging, and boost support efficiency 
                with ML-powered insights that categorize tickets in milliseconds.
              </motion.p>
              
              <motion.div 
                className="flex flex-col sm:flex-row items-center justify-center gap-4"
                variants={fadeInUp}
              >
                <Link to="/signup" className="btn-primary text-lg px-8 py-4 flex items-center gap-2">
                  Start Free Trial <ArrowRight className="w-5 h-5" />
                </Link>
                <Link to="/login" className="btn-secondary text-lg px-8 py-4">
                  Login to Dashboard
                </Link>
              </motion.div>

              {/* Floating UI Preview */}
              <motion.div 
                className="mt-16 relative"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <div className="glass-card p-4 sm:p-8 rounded-2xl max-w-3xl mx-auto">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-destructive/60" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                    <div className="w-3 h-3 rounded-full bg-green-500/60" />
                    <span className="ml-4 text-sm text-muted-foreground">SupportDesk AI Dashboard</span>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50">
                      <div className="w-10 h-10 rounded-lg gradient-bg flex items-center justify-center flex-shrink-0">
                        <Brain className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="text-sm font-medium">Predicted Category</div>
                        <div className="text-lg font-bold gradient-text">Technical Support</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Confidence</div>
                        <div className="text-lg font-bold text-green-500">94.2%</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {['Technical Support', 'Bug Report', 'Feature Request'].map((cat, i) => (
                        <div key={cat} className="p-3 rounded-lg bg-secondary/30 text-center">
                          <div className="text-xs text-muted-foreground mb-1">#{i + 1}</div>
                          <div className="text-sm font-medium truncate">{cat}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-4 -right-4 -left-4 h-32 bg-gradient-to-t from-background to-transparent" />
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Everything you need for{' '}
                <span className="gradient-text">intelligent support</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Powerful features designed to streamline your support workflow and delight your customers.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  className="glass-card-hover p-6"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Metrics Section */}
        <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0 mesh-background opacity-50" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Real-World <span className="gradient-text">Impact</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Teams using SupportDesk AI see measurable improvements in their support operations.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {metrics.map((metric, index) => (
                <motion.div
                  key={metric.label}
                  className="glass-card p-8 text-center"
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <div className="text-4xl sm:text-5xl font-bold gradient-text mb-2">{metric.value}</div>
                  <p className="text-muted-foreground">{metric.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                How It <span className="gradient-text">Works</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Get started in three simple steps.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {steps.map((item, index) => (
                <motion.div
                  key={item.step}
                  className="relative"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.15 }}
                >
                  <div className="glass-card-hover p-8 h-full">
                    <div className="w-14 h-14 rounded-2xl gradient-bg flex items-center justify-center mb-6 text-2xl font-bold text-primary-foreground">
                      {item.step}
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                  {index < steps.length - 1 && (
                    <ChevronRight className="hidden md:block absolute top-1/2 -right-6 w-8 h-8 text-muted-foreground/30" />
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 relative overflow-hidden">
          <div className="absolute inset-0 gradient-bg opacity-10" />
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                Ready to supercharge your{' '}
                <span className="gradient-text">support workflow?</span>
              </h2>
              <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                Join thousands of teams already using SupportDesk AI to streamline their support operations.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/signup" className="btn-primary text-lg px-8 py-4 flex items-center gap-2">
                  Create Free Account <ArrowRight className="w-5 h-5" />
                </Link>
                <Link to="/login" className="btn-secondary text-lg px-8 py-4">
                  Login
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-lg">
                  <span className="gradient-text">SupportDesk</span>
                  <span className="text-muted-foreground ml-1">AI</span>
                </span>
              </div>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
                <a href="#" className="hover:text-foreground transition-colors">Terms</a>
                <a href="#" className="hover:text-foreground transition-colors">Contact</a>
              </div>
              <div className="flex items-center gap-4">
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Github className="w-5 h-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                  <Linkedin className="w-5 h-5" />
                </a>
              </div>
            </div>
            <div className="mt-8 text-center text-sm text-muted-foreground">
              © 2025 SupportDesk AI. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </PageTransition>
  );
};

export default LandingPage;
