import { NextRequest } from 'next/server';
import { IntakeAgent } from '@/agents/intake-agent';
import { ConversationState } from '@/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { message, state } = await req.json();

    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'OpenAI API key not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const agent = new IntakeAgent(apiKey);
    const conversationState: ConversationState = state || {
      messages: [],
      currentAgent: 'intake',
      topicsDiscussed: new Set(),
      intakeComplete: false,
      summaryGenerated: false,
      phq9Completed: false,
    };

    // Restore topics discussed
    if (conversationState.topicsDiscussed) {
      const topics = Array.isArray(conversationState.topicsDiscussed)
        ? new Set(conversationState.topicsDiscussed)
        : conversationState.topicsDiscussed instanceof Set
        ? conversationState.topicsDiscussed
        : new Set();
      agent['topicsDiscussed'] = topics;
    }

    // Restore conversation history
    if (conversationState.messages) {
      agent['conversationHistory'] = conversationState.messages.filter(
        msg => msg.role !== 'system'
      );
    }

    const result = await agent.processMessage(message, conversationState);

    // Create a readable stream for the response
    const stream = new ReadableStream({
      async start(controller) {
        // Stream the response word by word for better UX
        const words = result.response.split(' ');
        for (let i = 0; i < words.length; i++) {
          const chunk = i === 0 ? words[i] : ' ' + words[i];
          controller.enqueue(new TextEncoder().encode(chunk));
          await new Promise(resolve => setTimeout(resolve, 30)); // Small delay for streaming effect
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in intake API:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
