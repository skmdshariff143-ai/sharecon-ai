import { NextRequest, NextResponse } from 'next/server';
import { ReconciliationRecord } from '@/types/reconciliation';
import { analyzeExceptionWithGemini } from '@/lib/ai/analyst';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const record = body.record as ReconciliationRecord;

    if (!record || !record.recordId || !record.payment) {
      return NextResponse.json(
        { error: 'Invalid reconciliation record payload' },
        { status: 400 }
      );
    }

    const analysis = await analyzeExceptionWithGemini(record);
    return NextResponse.json({ success: true, analysis });
  } catch (error: unknown) {
    console.error('Exception analysis API error:', error);
    return NextResponse.json(
      { error: 'Internal exception analysis error' },
      { status: 500 }
    );
  }
}
