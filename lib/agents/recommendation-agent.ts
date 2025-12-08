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
- preferredLocation: city, state, or region (extract any location mentioned)
- insuranceCarrier: insurance company name (e.g., Aetna, Blue Cross, Cigna, UnitedHealthcare, Medicaid, Medicare)
- insurancePlan: specific plan name if mentioned
- inNetworkOnly: true if they say "in-network only" or "in-network", false if they prefer cash pay
- acceptsCashPay: true if they say "cash pay", "self-pay", "cash", or are open to paying out of pocket
- acceptsNewPatientsOnly: true if they want only doctors "accepting new patients", false otherwise

IMPORTANT: 
- If they say "in-network only", set inNetworkOnly=true and acceptsCashPay=false
- If they say "cash pay" or "self-pay", set acceptsCashPay=true and inNetworkOnly=false
- If they're open to either, set both appropriately based on context

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
  
  // Determine which question to ask next (sequential approach)
  const questionIndex = mergedPreferences.currentQuestionIndex ?? 0;
  const questions = [
    { 
      key: 'preferredLocation', 
      question: 'What is your preferred location? (Please provide city, state, or region)' 
    },
    { 
      key: 'insuranceCarrier', 
      question: 'What is your insurance carrier? (e.g., Aetna, Blue Cross Blue Shield, Cigna, UnitedHealthcare)' 
    },
    { 
      key: 'insurancePlan', 
      question: 'What is your insurance plan name? (If you\'re not sure, you can skip this)' 
    },
    { 
      key: 'paymentPreference', 
      question: 'Do you prefer in-network providers only, or are you open to cash pay?' 
    },
    { 
      key: 'acceptsNewPatientsOnly', 
      question: 'Do you want to see only psychiatrists who are currently accepting new patients?' 
    },
  ];

  // Check which questions have been answered
  const hasLocation = !!mergedPreferences.preferredLocation;
  const hasInsurance = !!mergedPreferences.insuranceCarrier;
  const hasPaymentPreference = mergedPreferences.acceptsCashPay !== undefined || mergedPreferences.inNetworkOnly !== undefined;
  const hasNewPatientsPreference = mergedPreferences.acceptsNewPatientsOnly !== undefined;

  // Determine if we have enough info to filter
  // Minimum: location OR (insurance + payment preference)
  const hasEnoughInfo = (hasLocation || (hasInsurance && hasPaymentPreference)) && hasNewPatientsPreference;

  if (hasEnoughInfo) {
    // All preferences collected - filter psychiatrists
    const psychiatrists = await filterPsychiatrists(mergedPreferences as RecommendationPreferences);
    
    return {
      message: psychiatrists.length > 0
        ? `I found ${psychiatrists.length} psychiatrist(s) matching your preferences. Please review them below.`
        : `I couldn't find any psychiatrists matching your exact preferences. Would you like to adjust your criteria?`,
      psychiatrists,
      preferences: { ...mergedPreferences, currentQuestionIndex: questions.length } as RecommendationPreferences,
    };
  }

  // Determine next question to ask based on what's missing
  let nextQuestionIndex = questionIndex;
  let nextQuestion = questions[questionIndex].question;

  if (questionIndex === 0 && !hasLocation) {
    nextQuestionIndex = 0;
    nextQuestion = questions[0].question;
  } else if (questionIndex <= 1 && !hasInsurance) {
    nextQuestionIndex = 1;
    nextQuestion = questions[1].question;
  } else if (questionIndex <= 2 && hasInsurance && !mergedPreferences.insurancePlan) {
    // Insurance plan is optional, ask but allow skip
    nextQuestionIndex = 2;
    nextQuestion = questions[2].question;
  } else if (questionIndex <= 3 && !hasPaymentPreference) {
    nextQuestionIndex = 3;
    nextQuestion = questions[3].question;
  } else if (questionIndex <= 4 && !hasNewPatientsPreference) {
    nextQuestionIndex = 4;
    nextQuestion = questions[4].question;
  }

  // Ask ONE question at a time (sequential approach)
  const systemPrompt = `You are a psychiatric referral agent. Your role is to collect patient preferences for finding a psychiatrist.

IMPORTANT: Ask ONLY ONE question at a time. Be friendly and concise.

Current question to ask: "${nextQuestion}"

Wait for the patient's response before asking the next question.`;

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

    const assistantMessage = response.choices[0]?.message?.content || nextQuestion;
    
    return {
      message: assistantMessage,
      psychiatrists: [],
      preferences: { 
        ...mergedPreferences, 
        currentQuestionIndex: nextQuestionIndex 
      } as RecommendationPreferences,
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

