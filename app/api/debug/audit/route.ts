import { NextResponse } from 'next/server';
import { runAudit, formatReport } from '@/lib/debug/auditDistribution';

export const maxDuration = 300; // 5 minutes max

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const target = parseInt(searchParams.get('target') || '1000', 10);
  const perGame = parseInt(searchParams.get('perGame') || '10', 10);

  try {
    const result = await runAudit(target, perGame);
    const report = formatReport(result);

    // Print to server console
    console.log(report);

    return NextResponse.json({
      report,
      data: result,
    });
  } catch (err) {
    console.error('Audit error:', err);
    return NextResponse.json(
      { error: 'Audit failed', details: String(err) },
      { status: 500 }
    );
  }
}
