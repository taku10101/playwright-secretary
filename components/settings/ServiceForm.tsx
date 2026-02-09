import { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ServiceType } from '@/lib/config/services';

interface ServiceFormProps {
  serviceType: ServiceType;
  serviceName: string;
  workspace: string;
  onServiceTypeChange: (type: ServiceType) => void;
  onServiceNameChange: (name: string) => void;
  onWorkspaceChange: (workspace: string) => void;
  onSubmit: (e: FormEvent) => void;
}

export function ServiceForm({
  serviceType,
  serviceName,
  workspace,
  onServiceTypeChange,
  onServiceNameChange,
  onWorkspaceChange,
  onSubmit,
}: ServiceFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="type">サービスタイプ</Label>
        <Select value={serviceType} onValueChange={(v) => onServiceTypeChange(v as ServiceType)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="gmail">Gmail</SelectItem>
            <SelectItem value="slack">Slack</SelectItem>
            <SelectItem value="notion">Notion</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">サービス名</Label>
        <Input
          id="name"
          placeholder="例: 個人用Gmail"
          value={serviceName}
          onChange={(e) => onServiceNameChange(e.target.value)}
          required
        />
      </div>

      {serviceType === 'slack' && (
        <div className="space-y-2">
          <Label htmlFor="workspace">ワークスペース</Label>
          <Input
            id="workspace"
            placeholder="例: my-workspace"
            value={workspace}
            onChange={(e) => onWorkspaceChange(e.target.value)}
            required
          />
        </div>
      )}

      <Button type="submit" className="w-full">
        サービスを追加
      </Button>
    </form>
  );
}
