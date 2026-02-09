/**
 * Task history API endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { ConfigStorage } from '@/lib/config/storage';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');

    const history = await ConfigStorage.getExecutionHistory(limit);

    return NextResponse.json(history);
  } catch (error) {
    console.error('History fetch error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
