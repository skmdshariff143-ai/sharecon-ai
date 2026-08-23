import { NextRequest, NextResponse } from 'next/server';
import {
  AnalyzeExceptionRequestBodySchema,
  analyzeExceptionWithGemini,
} from '@/lib/ai/analyst';
import { ReconciliationRecord } from '@/types/reconciliation';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: 'Malformed JSON payload. Expected valid JSON request body.',
      },
      { status: 400 }
    );
  }

  const parsed = AnalyzeExceptionRequestBodySchema.safeParse(body);

  if (!parsed.success) {
    const errorDetails = parsed.error.issues.map(
      (issue) => `${issue.path.join('.') || 'root'}: ${issue.message}`
    );

    return NextResponse.json(
      {
        success: false,
        error: 'Invalid reconciliation record structure.',
        issues: errorDetails,
      },
      { status: 400 }
    );
  }

  try {
    const analysis = await analyzeExceptionWithGemini(
      parsed.data.record as unknown as ReconciliationRecord
    );
    return NextResponse.json({ success: true, analysis });
  } catch (error: unknown) {
    console.error('Exception analysis API error:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      {
        success: false,
        error: 'Unable to complete exception analysis.',
      },
      { status: 500 }
    );
  }
}
