'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { ExecutionHistoryTable } from '@/components/dashboard/ExecutionHistoryTable';
import { LoadingState } from '@/components/dashboard/LoadingState';
import { useExecutionHistory } from '@/lib/hooks/useExecutionHistory';

export default function DashboardPage() {
  const { history, loading } = useExecutionHistory();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <DashboardHeader />

      <Card>
        <CardHeader>
          <CardTitle>実行履歴</CardTitle>
          <CardDescription>最近実行されたタスクの一覧</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingState />
          ) : (
            <ExecutionHistoryTable history={history} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
