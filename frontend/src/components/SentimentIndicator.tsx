import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Smile, Frown, Meh } from 'lucide-react';

interface SentimentData {
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  score: number;
  is_negative: boolean;
}

interface UrgencyData {
  urgency_level: 'LOW' | 'MEDIUM' | 'HIGH';
  urgency_score: number;
  detected_signals: Record<string, number>;
}

interface SentimentIndicatorProps {
  sentiment?: SentimentData;
  urgency?: UrgencyData;
}

/**
 * Sentiment & Urgency Indicator Component
 * 
 * Displays customer sentiment and ticket urgency indicators.
 * Helps prioritize response and understand customer sentiment.
 * 
 * Props:
 * - sentiment: Sentiment analysis results
 * - urgency: Urgency detection results
 */
export const SentimentIndicator: React.FC<SentimentIndicatorProps> = ({ 
  sentiment, 
  urgency 
}) => {
  const getSentimentIcon = (sentiment_type?: string) => {
    switch (sentiment_type) {
      case 'POSITIVE':
        return <Smile className="w-6 h-6 text-green-500" />;
      case 'NEGATIVE':
        return <Frown className="w-6 h-6 text-red-500" />;
      default:
        return <Meh className="w-6 h-6 text-gray-400" />;
    }
  };

  const getSentimentColor = (sentiment_type?: string) => {
    switch (sentiment_type) {
      case 'POSITIVE':
        return 'bg-green-50 border-green-200';
      case 'NEGATIVE':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getUrgencyColor = (level?: string) => {
    switch (level) {
      case 'HIGH':
        return 'bg-red-50 border-red-200';
      case 'MEDIUM':
        return 'bg-yellow-50 border-yellow-200';
      case 'LOW':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getUrgencyTextColor = (level?: string) => {
    switch (level) {
      case 'HIGH':
        return 'text-red-900';
      case 'MEDIUM':
        return 'text-yellow-900';
      case 'LOW':
        return 'text-green-900';
      default:
        return 'text-gray-900';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
      {/* Sentiment Card */}
      <Card className={`border ${sentiment ? getSentimentColor(sentiment.sentiment) : 'bg-gray-50 border-gray-200'}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Customer Sentiment</CardTitle>
        </CardHeader>
        <CardContent>
          {sentiment ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getSentimentIcon(sentiment.sentiment)}
                  <div>
                    <p className="font-semibold">{sentiment.sentiment}</p>
                    <p className="text-xs text-gray-600">
                      Confidence: {(sentiment.score * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
                <Badge 
                  variant={sentiment.is_negative ? "destructive" : "default"}
                  className={
                    sentiment.sentiment === 'POSITIVE' 
                      ? 'bg-green-500 hover:bg-green-600' 
                      : sentiment.sentiment === 'NEGATIVE'
                      ? 'bg-red-500 hover:bg-red-600'
                      : 'bg-gray-500 hover:bg-gray-600'
                  }
                >
                  {sentiment.sentiment === 'POSITIVE' ? '😊' : 
                   sentiment.sentiment === 'NEGATIVE' ? '😞' : 
                   '😐'}
                </Badge>
              </div>
              
              {/* Sentiment Score Bar */}
              <div className="mt-2">
                <div className="text-xs font-semibold mb-1">Sentiment Score</div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      sentiment.sentiment === 'POSITIVE' 
                        ? 'bg-green-500' 
                        : sentiment.sentiment === 'NEGATIVE'
                        ? 'bg-red-500'
                        : 'bg-gray-400'
                    }`}
                    style={{ width: `${sentiment.score * 100}%` }}
                  />
                </div>
              </div>

              {/* Sentiment Interpretation */}
              <p className="text-xs text-gray-700 bg-white bg-opacity-50 p-2 rounded">
                {sentiment.is_negative 
                  ? "⚠️ Customer appears frustrated or dissatisfied. Prioritize this ticket."
                  : sentiment.sentiment === 'POSITIVE'
                  ? "✅ Customer has a positive tone. This may be a commendation or easy-to-resolve request."
                  : "neutral tone. Normal priority."
                }
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No sentiment data available</p>
          )}
        </CardContent>
      </Card>

      {/* Urgency Card */}
      <Card className={`border ${urgency ? getUrgencyColor(urgency.urgency_level) : 'bg-gray-50 border-gray-200'}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Ticket Urgency</CardTitle>
        </CardHeader>
        <CardContent>
          {urgency ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`font-semibold text-lg ${getUrgencyTextColor(urgency.urgency_level)}`}>
                    {urgency.urgency_level}
                  </p>
                  <p className="text-xs text-gray-600">
                    Score: {(urgency.urgency_score * 100).toFixed(1)}
                  </p>
                </div>
                {urgency.urgency_level === 'HIGH' && (
                  <AlertTriangle className="w-8 h-8 text-red-500 animate-pulse" />
                )}
              </div>

              {/* Urgency Score Bar */}
              <div className="mt-2">
                <div className="text-xs font-semibold mb-1">Urgency Score</div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      urgency.urgency_level === 'HIGH' 
                        ? 'bg-red-500' 
                        : urgency.urgency_level === 'MEDIUM'
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${urgency.urgency_score * 100}%` }}
                  />
                </div>
              </div>

              {/* Detected Signals */}
              {Object.keys(urgency.detected_signals).length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-semibold mb-2">Detected Signals:</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(urgency.detected_signals).map(([signal, count]) => (
                      count > 0 && (
                        <Badge 
                          key={signal} 
                          variant="secondary"
                          className="text-xs"
                        >
                          {signal} ({count})
                        </Badge>
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* Urgency Interpretation */}
              <p className="text-xs text-gray-700 bg-white bg-opacity-50 p-2 rounded">
                {urgency.urgency_level === 'HIGH'
                  ? "🔴 High priority - Needs immediate attention from a senior agent."
                  : urgency.urgency_level === 'MEDIUM'
                  ? "🟡 Medium priority - Should be addressed within standard timeframe."
                  : "🟢 Low priority - Can be scheduled normally or handled by junior staff."
                }
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No urgency data available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SentimentIndicator;
