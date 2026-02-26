import { NextRequest, NextResponse } from 'next/server';
import { getCoreTeamSettings, updateCoreTeamSettings } from '@/lib/runtime-settings';

export async function GET() {
  return NextResponse.json(getCoreTeamSettings());
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const enabled = typeof body.enabled === 'boolean' ? body.enabled : undefined;

    let names: string[] | undefined;
    if (typeof body.names === 'string') {
      names = body.names
        .split(',')
        .map((n: string) => n.trim())
        .filter(Boolean);
    } else if (Array.isArray(body.names)) {
      names = body.names
        .map((n: unknown) => String(n).trim())
        .filter(Boolean);
    }

    const updated = updateCoreTeamSettings({ enabled, names });
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update core team settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
