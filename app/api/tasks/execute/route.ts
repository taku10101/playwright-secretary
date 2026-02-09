/**
 * Task execution API endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { taskExecutor } from '@/lib/playwright/executor';
import { TaskExecutionRequest } from '@/lib/config/services';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as TaskExecutionRequest;

    // Validate request
    if (!body.serviceId || !body.action) {
      return NextResponse.json(
        { error: 'Missing required fields: serviceId, action' },
        { status: 400 }
      );
    }

    // Execute task
    const result = await taskExecutor.executeTask(body);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Task execution error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
