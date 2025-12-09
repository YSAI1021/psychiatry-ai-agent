import { NextRequest } from 'next/server';
import { IntakeAgent } from '@/agents/intake-agent';
import { TopicMemory } from '@/lib/memory';
import OpenAI from 'openai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { message, messages, memory } = await req.json();

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
    
    // Restore memory if provided
    let restoredMemory: TopicMemory | undefined;
    if (memory) {
      restoredMemory = {
        coveredTopics: new Set(memory.coveredTopics || []),
        lastQuestion: memory.lastQuestion || null,
        conversationHistory: memory.conversationHistory || [],
      };
    }

    // Process message and get response
    const result = await agent.processMessage(message, restoredMemory);

    // Stream the response word by word
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          const words = result.response.split(' ');
          for (let i = 0; i < words.length; i++) {
            const chunk = i === 0 ? words[i] : ' ' + words[i];
            controller.enqueue(encoder.encode(chunk));
            await new Promise(resolve => setTimeout(resolve, 30));
          }
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
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
