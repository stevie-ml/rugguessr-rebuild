import { NextRequest, NextResponse } from 'next/server';
import { validateWithLLM } from '@/lib/provenance';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, provenance, culture } = body;

    if (!title || !provenance) {
      return NextResponse.json(
        { error: 'title and provenance are required' },
        { status: 400 }
      );
    }

    const result = await validateWithLLM(title, provenance, culture);
    return NextResponse.json(result);
  } catch (err) {
    console.error('Validate provenance error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
