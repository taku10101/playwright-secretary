/**
 * Services list API endpoint
 */

import { NextResponse } from 'next/server';
import { ConfigStorage } from '@/lib/config/storage';

export async function GET() {
  try {
    const services = await ConfigStorage.loadServices();
    return NextResponse.json(services);
  } catch (error) {
    console.error('Services fetch error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
