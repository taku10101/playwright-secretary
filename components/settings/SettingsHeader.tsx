import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function SettingsHeader() {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold">設定</h1>
        <p className="text-gray-600 mt-2">サービス接続と認証情報の管理</p>
      </div>
      <Link href="/dashboard">
        <Button variant="outline">ダッシュボードに戻る</Button>
      </Link>
    </div>
  );
}
