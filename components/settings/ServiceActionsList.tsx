import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ActionDefinition {
  id: string;
  name: string;
  description: string;
  parameters: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
}

interface ServiceActionsListProps {
  serviceType: string;
}

export function ServiceActionsList({ serviceType }: ServiceActionsListProps) {
  const [actions, setActions] = useState<ActionDefinition[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!serviceType) return;

    const fetchActions = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/services/actions?type=${serviceType}`);
        if (response.ok) {
          const data = await response.json();
          setActions(data.actions);
        }
      } catch (error) {
        console.error('Failed to fetch actions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActions();
  }, [serviceType]);

  if (loading) {
    return <div className="text-sm text-gray-500">読み込み中...</div>;
  }

  if (actions.length === 0) {
    return null;
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-lg">利用可能な操作</CardTitle>
        <CardDescription>このサービスで実行できる操作一覧</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {actions.map((action) => (
            <div key={action.id} className="border-l-2 border-blue-500 pl-3">
              <h4 className="font-semibold text-sm">{action.name}</h4>
              <p className="text-xs text-gray-600 mt-1">{action.description}</p>
              <div className="mt-2">
                <p className="text-xs font-medium text-gray-700">パラメータ:</p>
                <ul className="text-xs text-gray-600 mt-1 space-y-1">
                  {action.parameters.map((param) => (
                    <li key={param.name}>
                      • <span className="font-mono">{param.name}</span>
                      {param.required && <span className="text-red-500">*</span>}
                      : {param.description}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
