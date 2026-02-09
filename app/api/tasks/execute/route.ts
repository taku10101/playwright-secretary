/**
 * Task execution API endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { serviceExecutor } from '@/lib/playwright/service-executor';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request
    if (!body.serviceId || !body.actionId) {
      return NextResponse.json(
        { error: 'Missing required fields: serviceId, actionId' },
        { status: 400 }
      );
    }

    // Execute task
    const result = await serviceExecutor.executeTask({
      serviceId: body.serviceId,
      actionId: body.actionId,
      parameters: body.parameters || {},
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Task execution error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
