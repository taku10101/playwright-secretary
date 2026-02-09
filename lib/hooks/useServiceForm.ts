import { useState, FormEvent, useCallback } from 'react';
import { ServiceConfig, ServiceType } from '@/lib/config/services';

interface UseServiceFormProps {
  onSuccess: () => void;
}

interface UseServiceFormReturn {
  serviceType: ServiceType;
  serviceName: string;
  workspace: string;
  setServiceType: (type: ServiceType) => void;
  setServiceName: (name: string) => void;
  setWorkspace: (workspace: string) => void;
  handleSubmit: (e: FormEvent) => Promise<void>;
  submitting: boolean;
}

export function useServiceForm({ onSuccess }: UseServiceFormProps): UseServiceFormReturn {
  const [serviceType, setServiceType] = useState<ServiceType>('gmail');
  const [serviceName, setServiceName] = useState('');
  const [workspace, setWorkspace] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();

      const serviceConfig: Partial<ServiceConfig> = {
        type: serviceType,
        name: serviceName,
        enabled: true,
        credentials: {},
        settings: serviceType === 'slack' ? { workspace } : {},
      };

      try {
        setSubmitting(true);
        const response = await fetch('/api/services/configure', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(serviceConfig),
        });

        if (response.ok) {
          alert('サービスが保存されました');
          setServiceName('');
          setWorkspace('');
          onSuccess();
        } else {
          const error = await response.json();
          alert(`エラー: ${error.error}`);
        }
      } catch (error) {
        console.error('Failed to save service:', error);
        alert('サービスの保存に失敗しました');
      } finally {
        setSubmitting(false);
      }
    },
    [serviceType, serviceName, workspace, onSuccess]
  );

  return {
    serviceType,
    serviceName,
    workspace,
    setServiceType,
    setServiceName,
    setWorkspace,
    handleSubmit,
    submitting,
  };
}
