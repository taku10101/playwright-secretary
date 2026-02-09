import { useCallback } from 'react';

interface UseServiceDeleteProps {
  onSuccess: () => void;
}

interface UseServiceDeleteReturn {
  deleteService: (id: string) => Promise<void>;
}

export function useServiceDelete({ onSuccess }: UseServiceDeleteProps): UseServiceDeleteReturn {
  const deleteService = useCallback(
    async (id: string) => {
      if (!confirm('このサービスを削除しますか?')) return;

      try {
        const response = await fetch(`/api/services/configure?id=${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          alert('サービスが削除されました');
          onSuccess();
        } else {
          const error = await response.json();
          alert(`エラー: ${error.error}`);
        }
      } catch (error) {
        console.error('Failed to delete service:', error);
        alert('サービスの削除に失敗しました');
      }
    },
    [onSuccess]
  );

  return { deleteService };
}
