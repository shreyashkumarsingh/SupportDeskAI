import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  PredictionResult, 
  HistoryItem, 
  generateMockPrediction 
} from '@/utils/mockData';
import { predictTicket } from '@/lib/api';

export const usePredictions = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load history scoped to current user (empty for new users)
    if (!user?.id) {
      setHistory([]);
      setIsLoading(false);
      return;
    }

    const userHistoryKey = `supportdesk_history_${user.id}`;
    const storedHistory = localStorage.getItem(userHistoryKey);
    if (storedHistory) {
      const parsed = JSON.parse(storedHistory);
      setHistory(parsed.map((item: HistoryItem) => ({
        ...item,
        timestamp: new Date(item.timestamp),
      })));
    } else {
      // Start with empty history for new users
      setHistory([]);
    }
    setIsLoading(false);
  }, [user?.id]);

  const predict = useCallback(
    async (subject: string, body: string, userId?: string | null): Promise<PredictionResult> => {
      setError(null);
      try {
        const result = await predictTicket({ subject, body, userId });

        const newHistoryItem: HistoryItem = {
          id: crypto.randomUUID(),
          timestamp: new Date(),
          subject,
          body,
          category: result.category,
          confidence: result.confidence,
        };

        setHistory(prev => {
          const updated = [newHistoryItem, ...prev];
          if (user?.id) {
            const userHistoryKey = `supportdesk_history_${user.id}`;
            localStorage.setItem(userHistoryKey, JSON.stringify(updated));
          }
          return updated;
        });

        return result;
      } catch (err) {
        // Fallback to local heuristic to keep UX responsive
        const fallback = generateMockPrediction(subject, body);
        setError('Live prediction failed. Showing offline estimate.');

        const newHistoryItem: HistoryItem = {
          id: crypto.randomUUID(),
          timestamp: new Date(),
          subject,
          body,
          category: fallback.category,
          confidence: fallback.confidence,
        };

        setHistory(prev => {
          const updated = [newHistoryItem, ...prev];
          if (user?.id) {
            const userHistoryKey = `supportdesk_history_${user.id}`;
            localStorage.setItem(userHistoryKey, JSON.stringify(updated));
          }
          return updated;
        });

        return fallback;
      }
    },
    []
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
    if (user?.id) {
      const userHistoryKey = `supportdesk_history_${user.id}`;
      localStorage.removeItem(userHistoryKey);
    }
  }, [user?.id]);

  const getStats = useCallback(() => {
    if (history.length === 0) {
      return {
        totalPredictions: 0,
        mostCommonCategory: 'N/A',
        lastPredictionCategory: 'N/A',
        uniqueCategories: 0,
      };
    }

    const categoryCounts = history.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostCommonCategory = Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)[0][0];

    return {
      totalPredictions: history.length,
      mostCommonCategory,
      lastPredictionCategory: history[0]?.category || 'N/A',
      uniqueCategories: Object.keys(categoryCounts).length,
    };
  }, [history]);

  return {
    history,
    isLoading,
    error,
    predict,
    clearHistory,
    getStats,
  };
};
