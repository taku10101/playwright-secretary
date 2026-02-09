import { useEffect, useState, useCallback } from 'react';
import { ServiceConfig } from '@/lib/config/services';

interface UseServicesReturn {
  services: ServiceConfig[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useServices(): UseServicesReturn {
  const [services, setServices] = useState<ServiceConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/services');

      if (!response.ok) {
        throw new Error(`Failed to fetch services: ${response.statusText}`);
      }

      const data = await response.json();
      setServices(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      console.error('Failed to load services:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  return {
    services,
    loading,
    error,
    refetch: fetchServices,
  };
}
