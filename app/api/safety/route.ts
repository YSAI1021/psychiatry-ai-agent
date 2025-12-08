/**
 * API route for safety risk detection
 * Analyzes conversation for safety concerns
 */

import { NextRequest, NextResponse } from 'next/server';
import { detectSafetyRisks } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid request: messages array required' },
        { status: 400 }
      );
    }

    const safetyAssessment = await detectSafetyRisks(messages);

    return NextResponse.json(safetyAssessment);
  } catch (error) {
    console.error('Safety API error:', error);
    return NextResponse.json(
      { error: 'Failed to assess safety risks. Please try again.' },
      { status: 500 }
    );
  }
}

