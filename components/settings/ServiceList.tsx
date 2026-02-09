import { Button } from '@/components/ui/button';
import { ServiceConfig } from '@/lib/config/services';

interface ServiceListProps {
  services: ServiceConfig[];
  loading: boolean;
  onDelete: (id: string) => void;
}

function ServiceItem({ service, onDelete }: { service: ServiceConfig; onDelete: (id: string) => void }) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div>
        <h3 className="font-semibold">{service.name}</h3>
        <p className="text-sm text-gray-600">
          タイプ: {service.type} | ステータス: {service.enabled ? '有効' : '無効'}
        </p>
      </div>
      <Button variant="destructive" size="sm" onClick={() => onDelete(service.id)}>
        削除
      </Button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-8 text-gray-500">
      まだサービスが登録されていません
    </div>
  );
}

function LoadingState() {
  return <div className="text-center py-8">読み込み中...</div>;
}

export function ServiceList({ services, loading, onDelete }: ServiceListProps) {
  if (loading) {
    return <LoadingState />;
  }

  if (services.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-4">
      {services.map((service) => (
        <ServiceItem key={service.id} service={service} onDelete={onDelete} />
      ))}
    </div>
  );
}
