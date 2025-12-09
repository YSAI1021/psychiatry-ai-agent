import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { INTAKE_AGENT_SYSTEM_PROMPT } from '@/lib/agents/intake-agent';

/**
 * Chat API Route
 * 
 * Handles streaming chat responses from GPT-4 for the intake agent.
 * Uses OpenAI's streaming API to provide real-time responses.
 */

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build conversation with system prompt
    const conversationMessages = [
      { role: 'system' as const, content: INTAKE_AGENT_SYSTEM_PROMPT },
      ...messages,
    ];

    // Create streaming response
    const stream = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: conversationMessages,
      stream: true,
      temperature: 0.7,
    });

    // Create a readable stream for the response
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to process chat request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

