import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function DashboardHeader() {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold">Playwright秘書プラットフォーム</h1>
        <p className="text-gray-600 mt-2">タスク実行履歴とステータス</p>
      </div>
      <Link href="/settings">
        <Button variant="outline">設定</Button>
      </Link>
    </div>
  );
}
