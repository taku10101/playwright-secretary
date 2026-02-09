import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ExecutionResult } from '@/lib/config/services';

interface ExecutionHistoryTableProps {
  history: ExecutionResult[];
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'completed':
      return 'text-green-600';
    case 'failed':
      return 'text-red-600';
    case 'running':
      return 'text-blue-600';
    default:
      return 'text-gray-600';
  }
}

function formatDate(date: Date | string): string {
  return new Date(date).toLocaleString();
}

export function ExecutionHistoryTable({ history }: ExecutionHistoryTableProps) {
  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        まだタスクが実行されていません
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>ステータス</TableHead>
          <TableHead>開始時刻</TableHead>
          <TableHead>完了時刻</TableHead>
          <TableHead>エラー</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {history.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-mono text-sm">{item.id}</TableCell>
            <TableCell>
              <span className={getStatusColor(item.status)}>{item.status}</span>
            </TableCell>
            <TableCell>{formatDate(item.startedAt)}</TableCell>
            <TableCell>
              {item.completedAt ? formatDate(item.completedAt) : '-'}
            </TableCell>
            <TableCell className="text-red-600 text-sm">
              {item.error || '-'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
