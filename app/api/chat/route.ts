/**
 * API route for chat intake conversations
 * Handles POST requests for chat messages and returns AI responses
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateChatResponse } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid request: messages array required' },
        { status: 400 }
      );
    }

    // Filter out system messages for the API call
    const chatMessages = messages.filter(
      (m: { role: string }) => m.role !== 'system'
    ) as { role: 'user' | 'assistant'; content: string }[];

    const response = await generateChatResponse(chatMessages);

    return NextResponse.json({ message: response });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response. Please check your API configuration.' },
      { status: 500 }
    );
  }
}

