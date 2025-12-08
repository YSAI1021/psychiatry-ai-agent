/**
 * API route for generating psychiatrist recommendations
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateRecommendations } from '@/lib/openai';
import { getPsychiatrists } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { summary } = await request.json();

    if (!summary) {
      return NextResponse.json(
        { error: 'Invalid request: summary required' },
        { status: 400 }
      );
    }

    const availablePsychiatrists = await getPsychiatrists();
    const recommendations = await generateRecommendations(summary, availablePsychiatrists);

    return NextResponse.json({ recommendations, psychiatrists: availablePsychiatrists });
  } catch (error) {
    console.error('Recommendations API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations. Please try again.' },
      { status: 500 }
    );
  }
}

