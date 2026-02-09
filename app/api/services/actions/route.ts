/**
 * Service actions list API endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { getService } from '@/lib/services';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceType = searchParams.get('type');

    if (!serviceType) {
      return NextResponse.json(
        { error: 'Missing required parameter: type' },
        { status: 400 }
      );
    }

    const service = getService(serviceType);
    if (!service) {
      return NextResponse.json(
        { error: `Service not found: ${serviceType}` },
        { status: 404 }
      );
    }

    // Return action definitions
    const actions = service.actions.map(action => ({
      id: action.id,
      name: action.name,
      description: action.description,
      parameters: action.parameters,
    }));

    return NextResponse.json({
      serviceId: service.id,
      serviceName: service.name,
      actions,
    });
  } catch (error) {
    console.error('Actions fetch error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
