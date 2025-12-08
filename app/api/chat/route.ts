/**
 * API route for multi-agent chat conversations
 * Handles POST requests for chat messages and routes to appropriate agent
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateAgentResponse } from '@/lib/openai';
import { AgentRole } from '@/lib/store';

export async function POST(request: NextRequest) {
  try {
    const { messages, agentRole } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid request: messages array required' },
        { status: 400 }
      );
    }

    if (!agentRole || !['intake', 'summary', 'recommendation', 'booking'].includes(agentRole)) {
      return NextResponse.json(
        { error: 'Invalid agent role' },
        { status: 400 }
      );
    }

    const response = await generateAgentResponse(messages, agentRole as AgentRole);

    return NextResponse.json({ message: response });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response. Please check your API configuration.' },
      { status: 500 }
    );
  }
}

