/**
 * OpenAI API Integration
 * Handles multi-agent conversations with function calling support
 */

import OpenAI from 'openai';
import { AgentRole } from './store';
import { getAgentPrompt } from './agents';
import { ChatMessage } from './store';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

/**
 * Generate chat completion for specific agent
 * @param messages - Conversation history
 * @param agentRole - Current agent role
 * @returns Assistant response
 */
export async function generateAgentResponse(
  messages: ChatMessage[],
  agentRole: AgentRole
): Promise<string> {
  try {
    const systemPrompt = getAgentPrompt(agentRole);
    
    // Format messages for API (exclude system messages from array, add as system prompt)
    const apiMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...apiMessages,
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return response.choices[0]?.message?.content || 'I apologize, I encountered an error. Could you please rephrase that?';
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to generate response. Please check your API key and try again.');
  }
}

/**
 * Extract structured clinical summary using Summary Agent
 * @param messages - Full conversation history
 * @returns Structured ClinicalSummary object
 */
export async function extractStructuredSummary(
  messages: ChatMessage[]
): Promise<any> {
  const extractionPrompt = `Based on the following psychiatric intake conversation, extract and structure the clinical information into a comprehensive JSON summary following the DSM/psychiatric interview format.

Conversation:
${messages.map(m => `${m.role}: ${m.content}`).join('\n\n')}

Return ONLY valid JSON matching the clinical summary schema. Use empty strings, empty arrays, or null for missing information.`;

  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: getAgentPrompt('summary'),
        },
        { role: 'user', content: extractionPrompt },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const summaryText = response.choices[0]?.message?.content || '{}';
    return JSON.parse(summaryText);
  } catch (error) {
    console.error('Summary extraction error:', error);
    throw new Error('Failed to extract clinical summary. Please try again.');
  }
}

/**
 * Generate psychiatrist recommendations using Recommendation Agent
 * @param summary - Clinical summary
 * @param availablePsychiatrists - List of available psychiatrists
 * @returns Recommendation text
 */
export async function generateRecommendations(
  summary: any,
  availablePsychiatrists: any[]
): Promise<string> {
  const recommendationPrompt = `Based on the following clinical summary, recommend 3-5 psychiatrists from the available list.

Clinical Summary:
${JSON.stringify(summary, null, 2)}

Available Psychiatrists:
${JSON.stringify(availablePsychiatrists, null, 2)}

Provide recommendations with clear reasoning for each match.`;

  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: getAgentPrompt('recommendation'),
        },
        { role: 'user', content: recommendationPrompt },
      ],
      temperature: 0.5,
      max_tokens: 800,
    });

    return response.choices[0]?.message?.content || 'Unable to generate recommendations at this time.';
  } catch (error) {
    console.error('Recommendation generation error:', error);
    throw new Error('Failed to generate recommendations. Please try again.');
  }
}

