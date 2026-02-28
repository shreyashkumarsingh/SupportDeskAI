import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ExplanationFeature {
  feature: string;
  importance: number;
  value: number;
}

interface ExplanationProps {
  features: ExplanationFeature[];
  category: string;
  confidence: number;
}

/**
 * ExplanationCard Component
 * 
 * Displays SHAP-based feature importance explanation for predictions.
 * Shows which keywords/features most influenced the classification decision.
 * 
 * Props:
 * - features: Array of features with importance scores
 * - category: Predicted category
 * - confidence: Prediction confidence score
 */
export const ExplanationCard: React.FC<ExplanationProps> = ({ 
  features, 
  category, 
  confidence 
}) => {
  if (!features || features.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Prediction Explanation</CardTitle>
          <CardDescription>SHAP Feature Importance</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Explanation data not available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Prediction Explanation</span>
          <Badge variant="outline" className="ml-2">
            {(confidence * 100).toFixed(1)}% Confident
          </Badge>
        </CardTitle>
        <CardDescription>
          Top features that influenced the "{category}" classification
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bar Chart */}
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={features}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="feature" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis label={{ value: 'Importance Score', angle: -90, position: 'insideLeft' }} />
            <Tooltip 
              formatter={(value) => (typeof value === 'number' ? value.toFixed(4) : value)}
              contentStyle={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}
            />
            <Bar 
              dataKey="importance" 
              fill="#3b82f6" 
              name="Feature Importance"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>

        {/* Features List */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Top Contributing Features</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {features.map((feature, idx) => (
              <div 
                key={idx}
                className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200 hover:bg-gray-100 transition"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-900">{feature.feature}</p>
                  <div className="w-full bg-gray-200 rounded h-2 mt-1">
                    <div 
                      className="bg-blue-500 h-full rounded"
                      style={{ width: `${Math.min(100, feature.importance * 500)}%` }}
                    />
                  </div>
                </div>
                <div className="ml-3 text-right">
                  <p className="text-xs font-mono bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    {(feature.importance * 100).toFixed(2)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-900">
            <strong>What does this mean?</strong> The longer the bar, the more that feature 
            influenced the model's decision to classify this ticket as "{category}". 
            This helps verify if the prediction makes sense.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExplanationCard;
