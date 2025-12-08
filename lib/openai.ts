/**
 * OpenAI client configuration
 * Handles LLM API calls for multi-agent orchestration
 */

import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.warn('OpenAI API key not configured. LLM features will not work.');
}

export const openai = apiKey ? new OpenAI({ apiKey }) : null;

// Agent types
export enum AgentType {
  INTAKE = 'intake',
  SUMMARY = 'summary',
  RECOMMENDATION = 'recommendation',
  BOOKING = 'booking',
}

export interface AgentMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

