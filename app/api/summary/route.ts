/**
 * API route for generating structured clinical summaries
 * Extracts structured summary from conversation history
 */

import { NextRequest, NextResponse } from 'next/server';
import { extractStructuredSummary } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid request: messages array required' },
        { status: 400 }
      );
    }

    const summary = await extractStructuredSummary(messages);

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Summary API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary. Please try again.' },
      { status: 500 }
    );
  }
}

