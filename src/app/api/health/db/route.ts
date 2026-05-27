import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';

import { assertDatabaseConfigured, db } from '@/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const startedAt = Date.now();

  try {
    assertDatabaseConfigured();
    await db.execute(sql`select 1 as ok`);

    return NextResponse.json({
      ok: true,
      provider: 'neon',
      latencyMs: Date.now() - startedAt,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        provider: 'neon',
        latencyMs: Date.now() - startedAt,
        error: (error as Error).message,
      },
      { status: 503 },
    );
  }
}
