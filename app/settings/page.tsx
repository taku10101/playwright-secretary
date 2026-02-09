'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SettingsHeader } from '@/components/settings/SettingsHeader';
import { ServiceForm } from '@/components/settings/ServiceForm';
import { ServiceList } from '@/components/settings/ServiceList';
import { ServiceActionsList } from '@/components/settings/ServiceActionsList';
import { useServices } from '@/lib/hooks/useServices';
import { useServiceForm } from '@/lib/hooks/useServiceForm';
import { useServiceDelete } from '@/lib/hooks/useServiceDelete';

export default function SettingsPage() {
  const { services, loading, refetch } = useServices();
  const { deleteService } = useServiceDelete({ onSuccess: refetch });

  const {
    serviceType,
    serviceName,
    workspace,
    setServiceType,
    setServiceName,
    setWorkspace,
    handleSubmit,
  } = useServiceForm({ onSuccess: refetch });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <SettingsHeader />

      <Tabs defaultValue="add" className="w-full">
        <TabsList>
          <TabsTrigger value="add">サービスを追加</TabsTrigger>
          <TabsTrigger value="list">登録済みサービス</TabsTrigger>
        </TabsList>

        <TabsContent value="add">
          <Card>
            <CardHeader>
              <CardTitle>新しいサービスを追加</CardTitle>
              <CardDescription>Webサービスへの接続設定を行います</CardDescription>
            </CardHeader>
            <CardContent>
              <ServiceForm
                serviceType={serviceType}
                serviceName={serviceName}
                workspace={workspace}
                onServiceTypeChange={setServiceType}
                onServiceNameChange={setServiceName}
                onWorkspaceChange={setWorkspace}
                onSubmit={handleSubmit}
              />
              <ServiceActionsList serviceType={serviceType} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle>登録済みサービス</CardTitle>
              <CardDescription>現在設定されているサービスの一覧</CardDescription>
            </CardHeader>
            <CardContent>
              <ServiceList services={services} loading={loading} onDelete={deleteService} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
