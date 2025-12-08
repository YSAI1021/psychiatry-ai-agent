/**
 * Recommendation Agent
 * 
 * Responsibilities:
 * - Asks about patient preferences:
 *   - Preferred location
 *   - Insurance carrier and plan
 *   - In-network only or accepts cash pay
 *   - Accepting new patients only
 * - Filters psychiatrists from database based on preferences
 * - Displays filtered results in clear card format
 */

import { openai } from '../openai';
import { RecommendationPreferences } from '../store';
import { supabase, Psychiatrist } from '../supabase';

export interface RecommendationAgentResponse {
  message: string;
  psychiatrists: Psychiatrist[];
  preferences: RecommendationPreferences;
}

/**
 * Filter psychiatrists based on patient preferences
 */
export async function filterPsychiatrists(
  preferences: RecommendationPreferences
): Promise<Psychiatrist[]> {
  try {
    // Build query
    let query = supabase.from('psychiatrists').select('*');

    // Filter by accepting new patients
    if (preferences.acceptsNewPatientsOnly) {
      query = query.eq('accepts_new_patients', true);
    }

    // Filter by location (case-insensitive partial match)
    if (preferences.preferredLocation) {
      query = query.ilike('location', `%${preferences.preferredLocation}%`);
    }

    // Filter by insurance carrier
    if (preferences.insuranceCarrier) {
      // Check if carrier is in the insurance_carriers array
      query = query.contains('insurance_carriers', [preferences.insuranceCarrier]);
    }

    // Filter by in-network only
    if (preferences.inNetworkOnly && preferences.insuranceCarrier) {
      query = query.contains('in_network_carriers', [preferences.insuranceCarrier]);
    }

    // Filter by cash pay acceptance
    if (preferences.acceptsCashPay !== undefined) {
      query = query.eq('accepts_cash_pay', preferences.acceptsCashPay);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error filtering psychiatrists:', error);
      // Return mock data for development
      return getMockPsychiatrists();
    }

    return (data as Psychiatrist[]) || [];
  } catch (error) {
    console.error('Error in filterPsychiatrists:', error);
    // Return mock data for development
    return getMockPsychiatrists();
  }
}

/**
 * Extract preferences from conversation using LLM
 */
async function extractPreferences(
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<Partial<RecommendationPreferences>> {
  if (!openai) {
    return {};
  }

  const extractionPrompt = `Based on the conversation, extract patient preferences for finding a psychiatrist. Look for:
- preferredLocation: city, state, or region
- insuranceCarrier: insurance company name
- insurancePlan: specific plan name if mentioned
- inNetworkOnly: true if they want in-network only
- acceptsNewPatientsOnly: true if they only want doctors accepting new patients
- acceptsCashPay: true if they're open to cash payment

Return only JSON with fields found. Use boolean true/false, not strings.

Conversation:
${conversationHistory.map(m => `${m.role}: ${m.content}`).join('\n')}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Extract patient preferences from conversation and return only valid JSON.',
        },
        {
          role: 'user',
          content: extractionPrompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 300,
      response_format: { type: 'json_object' },
    });

    const extracted = JSON.parse(response.choices[0]?.message?.content || '{}');
    return extracted as Partial<RecommendationPreferences>;
  } catch (error) {
    console.error('Error extracting preferences:', error);
    return {};
  }
}

/**
 * Generate recommendation agent response
 */
export async function generateRecommendationResponse(
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  currentPreferences: Partial<RecommendationPreferences>
): Promise<RecommendationAgentResponse> {
  if (!openai) {
    throw new Error('OpenAI client not configured');
  }

  // Extract preferences from conversation
  const extractedPrefs = await extractPreferences(conversationHistory);
  const mergedPreferences = { ...currentPreferences, ...extractedPrefs };

  // Check if we have enough preferences to filter
  const hasEnoughInfo = 
    (mergedPreferences.preferredLocation || mergedPreferences.acceptsCashPay !== undefined) &&
    (mergedPreferences.insuranceCarrier || mergedPreferences.acceptsCashPay === true);

  if (hasEnoughInfo) {
    // Filter psychiatrists
    const psychiatrists = await filterPsychiatrists(mergedPreferences as RecommendationPreferences);
    
    return {
      message: psychiatrists.length > 0
        ? `I found ${psychiatrists.length} psychiatrist(s) matching your preferences. Please review them below.`
        : `I couldn't find any psychiatrists matching your exact preferences. Would you like to adjust your criteria?`,
      psychiatrists,
      preferences: mergedPreferences as RecommendationPreferences,
    };
  }

  // Ask for more information
  const systemPrompt = `You are a psychiatric referral agent. Your role is to collect patient preferences for finding a psychiatrist.

Ask about:
1. Preferred location (city, state, or region)
2. Insurance carrier and plan name
3. Whether they require in-network only or if they can pay cash
4. Whether they only want psychiatrists accepting new patients

Keep questions concise and friendly. Once you have enough information, I'll provide filtered results.`;

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...conversationHistory,
  ];

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      temperature: 0.7,
      max_tokens: 200,
    });

    return {
      message: response.choices[0]?.message?.content || 'Please provide your preferences for finding a psychiatrist.',
      psychiatrists: [],
      preferences: mergedPreferences as RecommendationPreferences,
    };
  } catch (error) {
    console.error('Error generating recommendation response:', error);
    throw error;
  }
}

/**
 * Mock psychiatrist data for development/testing
 */
export function getMockPsychiatrists(): Psychiatrist[] {
  return [
    {
      id: '1',
      name: 'Dr. Sarah Johnson',
      specialty: 'General Psychiatry, Anxiety Disorders',
      location: 'New Haven, CT',
      insurance_carriers: ['Aetna', 'Blue Cross Blue Shield', 'UnitedHealthcare'],
      in_network_carriers: ['Aetna', 'Blue Cross Blue Shield'],
      accepts_new_patients: true,
      accepts_cash_pay: true,
      email: 's.johnson@example.com',
      phone: '(203) 555-0101',
    },
    {
      id: '2',
      name: 'Dr. Michael Chen',
      specialty: 'Mood Disorders, Depression',
      location: 'New Haven, CT',
      insurance_carriers: ['Blue Cross Blue Shield', 'Cigna'],
      in_network_carriers: ['Blue Cross Blue Shield'],
      accepts_new_patients: true,
      accepts_cash_pay: false,
      email: 'm.chen@example.com',
      phone: '(203) 555-0102',
    },
    {
      id: '3',
      name: 'Dr. Emily Rodriguez',
      specialty: 'Trauma, PTSD',
      location: 'Hartford, CT',
      insurance_carriers: ['Aetna', 'UnitedHealthcare', 'Medicaid'],
      in_network_carriers: ['Aetna', 'Medicaid'],
      accepts_new_patients: false,
      accepts_cash_pay: true,
      email: 'e.rodriguez@example.com',
      phone: '(860) 555-0103',
    },
  ];
}

