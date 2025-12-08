import { NextRequest } from 'next/server';
import { BookingAgent } from '@/agents/booking-agent';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { userResponse, clinicalSummary, patientInfo, selectedPsychiatrist } = await req.json();

    if (userResponse === undefined || userResponse === null) {
      return new Response(JSON.stringify({ error: 'User response is required' }), {
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

    const agent = new BookingAgent(apiKey);
    const result = await agent.processBookingRequest(
      String(userResponse),
      clinicalSummary || '',
      patientInfo || {},
      selectedPsychiatrist || {}
    );

    // Stream the response
    const stream = new ReadableStream({
      async start(controller) {
        const words = result.response.split(' ');
        for (let i = 0; i < words.length; i++) {
          const chunk = i === 0 ? words[i] : ' ' + words[i];
          controller.enqueue(new TextEncoder().encode(chunk));
          await new Promise(resolve => setTimeout(resolve, 30));
        }
        // If email was generated, append it as JSON
        if (result.email) {
          const emailJson = '\n\n' + JSON.stringify(result.email, null, 2);
          controller.enqueue(new TextEncoder().encode(emailJson));
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
    console.error('Error in booking API:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
