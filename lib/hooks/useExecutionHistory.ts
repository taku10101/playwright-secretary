import { useEffect, useState, useCallback } from 'react';
import { ExecutionResult } from '@/lib/config/services';

interface UseExecutionHistoryReturn {
  history: ExecutionResult[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useExecutionHistory(): UseExecutionHistoryReturn {
  const [history, setHistory] = useState<ExecutionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/tasks/history');

      if (!response.ok) {
        throw new Error(`Failed to fetch history: ${response.statusText}`);
      }

      const data = await response.json();
      setHistory(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    history,
    loading,
    error,
    refetch: fetchHistory,
  };
}
