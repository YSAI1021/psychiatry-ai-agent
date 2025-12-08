/**
 * Chat API Route Handler
 * 
 * This route handles all agent interactions server-side to protect the OpenAI API key.
 * The client-side code calls this API instead of directly calling OpenAI.
 * 
 * Fixed Issues:
 * - Moved OpenAI calls from client-side to server-side (process.env is server-only)
 * - Added comprehensive error logging with console.error
 * - Added safe fallback responses for all error scenarios
 * - Validated message array format before sending to OpenAI
 * - Ensured proper role types (system, user, assistant)
 * - Model string uses consistent 'gpt-4o-mini' (matching working vercel-test endpoint)
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { AgentType } from '@/lib/openai';
import { generateIntakeResponse } from '@/lib/agents/intake-agent';
import { generateClinicalSummary } from '@/lib/agents/summary-agent';
import { generateRecommendationResponse } from '@/lib/agents/recommendation-agent';
import { generateBookingEmail } from '@/lib/agents/booking-agent';
import { IntakeData, ClinicalSummary, RecommendationPreferences } from '@/lib/store';
import { Psychiatrist } from '@/lib/supabase';

interface ChatRequest {
  agentType: AgentType;
  userMessage: string;
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  // Agent-specific context
  intakeData?: Partial<IntakeData>;
  clinicalSummary?: ClinicalSummary;
  recommendationPreferences?: Partial<RecommendationPreferences>;
  selectedPsychiatrist?: Psychiatrist;
}

interface ChatResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ChatResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.',
    });
  }

  try {
    const {
      agentType,
      userMessage,
      conversationHistory,
      intakeData,
      clinicalSummary,
      recommendationPreferences,
      selectedPsychiatrist,
    }: ChatRequest = req.body;

    // Validate required fields
    if (!agentType || !userMessage) {
      console.error('[API] Missing required fields:', { agentType, userMessage });
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: agentType and userMessage are required.',
      });
    }

    // Validate conversation history format
    if (!Array.isArray(conversationHistory)) {
      console.error('[API] Invalid conversationHistory format:', typeof conversationHistory);
      return res.status(400).json({
        success: false,
        error: 'conversationHistory must be an array.',
      });
    }

    // Validate message roles are valid
    const validRoles = ['user', 'assistant', 'system'];
    const invalidMessage = conversationHistory.find(
      (msg) => !validRoles.includes(msg.role) || !msg.content || typeof msg.content !== 'string'
    );
    if (invalidMessage) {
      console.error('[API] Invalid message format:', invalidMessage);
      return res.status(400).json({
        success: false,
        error: 'Invalid message format. Each message must have a valid role (user/assistant/system) and string content.',
      });
    }

    // Route to appropriate agent handler
    let result;
    switch (agentType) {
      case AgentType.INTAKE: {
        if (!intakeData) {
          console.error('[API] Missing intakeData for INTAKE agent');
          return res.status(400).json({
            success: false,
            error: 'intakeData is required for INTAKE agent.',
          });
        }
        try {
          result = await generateIntakeResponse(conversationHistory, intakeData);
        } catch (error: any) {
          console.error('[API] Intake agent error:', {
            message: error.message,
            stack: error.stack,
            name: error.name,
          });
          throw error;
        }
        break;
      }

      case AgentType.SUMMARY: {
        if (!intakeData) {
          console.error('[API] Missing intakeData for SUMMARY agent');
          return res.status(400).json({
            success: false,
            error: 'intakeData is required for SUMMARY agent.',
          });
        }
        try {
          // Convert Partial<IntakeData> to IntakeData (with defaults)
          const fullIntakeData: IntakeData = {
            completionPercentage: intakeData.completionPercentage ?? 0,
            ...intakeData,
          } as IntakeData;
          
          result = await generateClinicalSummary(fullIntakeData, conversationHistory);
        } catch (error: any) {
          console.error('[API] Summary agent error:', {
            message: error.message,
            stack: error.stack,
            name: error.name,
          });
          throw error;
        }
        break;
      }

      case AgentType.RECOMMENDATION: {
        try {
          result = await generateRecommendationResponse(
            conversationHistory,
            recommendationPreferences || {}
          );
        } catch (error: any) {
          console.error('[API] Recommendation agent error:', {
            message: error.message,
            stack: error.stack,
            name: error.name,
          });
          throw error;
        }
        break;
      }

      case AgentType.BOOKING: {
        if (!selectedPsychiatrist || !clinicalSummary) {
          console.error('[API] Missing required data for BOOKING agent:', {
            hasPsychiatrist: !!selectedPsychiatrist,
            hasSummary: !!clinicalSummary,
          });
          return res.status(400).json({
            success: false,
            error: 'selectedPsychiatrist and clinicalSummary are required for BOOKING agent.',
          });
        }
        try {
          result = await generateBookingEmail(
            selectedPsychiatrist,
            clinicalSummary
          );
        } catch (error: any) {
          console.error('[API] Booking agent error:', {
            message: error.message,
            stack: error.stack,
            name: error.name,
          });
          throw error;
        }
        break;
      }

      default: {
        console.error('[API] Unknown agent type:', agentType);
        return res.status(400).json({
          success: false,
          error: `Unknown agent type: ${agentType}`,
        });
      }
    }

    // Success response
    return res.status(200).json({
      success: true,
      message: 'Agent response generated successfully',
      data: result,
    });
  } catch (error: any) {
    // Comprehensive error logging
    console.error('[API] Chat handler error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code,
      status: error.status,
      // Log OpenAI-specific errors if present
      response: error.response?.data,
    });

    // Safe fallback response - never expose internal error details to client
    const errorMessage = error.message || 'An unexpected error occurred';
    
    // Check if it's an OpenAI API error
    if (error.response?.status) {
      console.error('[API] OpenAI API error:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
      });
      
      return res.status(500).json({
        success: false,
        error: 'The AI service encountered an error. Please try again in a moment.',
        // Include safe error details for debugging (remove in production if needed)
        message: process.env.NODE_ENV === 'development' 
          ? `OpenAI API error: ${error.response.status}` 
          : undefined,
      });
    }

    // Generic error response
    return res.status(500).json({
      success: false,
      error: 'I apologize, but I encountered an error processing your request. Please try again or refresh the page.',
      // Include safe error details for debugging (remove in production if needed)
      message: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
    });
  }
}

