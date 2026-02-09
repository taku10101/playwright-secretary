/**
 * Service configuration API endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { ConfigStorage } from '@/lib/config/storage';
import { ServiceConfig } from '@/lib/config/services';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Partial<ServiceConfig>;

    // Validate request
    if (!body.type || !body.name) {
      return NextResponse.json(
        { error: 'Missing required fields: type, name' },
        { status: 400 }
      );
    }

    // Create or update service config
    const service: ServiceConfig = {
      id: body.id || `${body.type}-${Date.now()}`,
      type: body.type,
      name: body.name,
      enabled: body.enabled !== undefined ? body.enabled : true,
      credentials: body.credentials || {},
      settings: body.settings || {},
      createdAt: body.createdAt || new Date(),
      updatedAt: new Date(),
    };

    await ConfigStorage.saveService(service);

    return NextResponse.json(service);
  } catch (error) {
    console.error('Service configuration error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required parameter: id' },
        { status: 400 }
      );
    }

    await ConfigStorage.deleteService(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Service deletion error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
