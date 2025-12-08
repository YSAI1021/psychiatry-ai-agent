/**
 * Supabase client configuration
 * Handles database operations for summaries, session metadata, and bookings
 */

import { createClient } from '@supabase/supabase-js';
import { ClinicalSummary, Psychiatrist } from './store';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Only create client if valid URL is provided
export const supabase = supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co'
  ? createClient(supabaseUrl, supabaseKey)
  : null as any;

/**
 * Save clinical summary to Supabase
 * Stores structured data and PHQ-9 scores for clinician review
 */
export async function saveSummary(
  summary: ClinicalSummary,
  sessionMetadata?: {
    sessionId: string;
    testMode?: boolean;
    userRating?: number;
    comments?: string;
    duration?: number;
  }
) {
  if (!supabase) {
    throw new Error('Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment variables.');
  }

  try {
    const { data, error } = await supabase
      .from('clinical_summaries')
      .insert({
        session_id: sessionMetadata?.sessionId,
        summary_data: summary,
        phq9_score: summary.phq9?.totalScore || null,
        phq9_severity: summary.phq9?.severity || null,
        triage_level: summary.safetyConcerns.riskLevel,
        test_mode: sessionMetadata?.testMode || false,
        user_rating: sessionMetadata?.userRating,
        comments: sessionMetadata?.comments,
        duration_seconds: sessionMetadata?.duration,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving summary:', error);
    throw error;
  }
}

/**
 * Get available psychiatrists from Supabase
 * In production, this would query a psychiatrists table
 */
export async function getPsychiatrists(): Promise<Psychiatrist[]> {
  if (!supabase) {
    // Return mock data if Supabase not configured
    return require('./matching').MOCK_PSYCHIATRISTS;
  }

  try {
    const { data, error } = await supabase
      .from('psychiatrists')
      .select('*');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching psychiatrists:', error);
    // Fall back to mock data
    return require('./matching').MOCK_PSYCHIATRISTS;
  }
}

/**
 * Book appointment with psychiatrist
 */
export async function bookAppointment(
  psychiatristId: string,
  patientInfo: {
    name: string;
    email: string;
    phone?: string;
    preferredTime: string;
    summaryId?: string;
  }
) {
  if (!supabase) {
    throw new Error('Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment variables.');
  }

  try {
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        psychiatrist_id: psychiatristId,
        patient_name: patientInfo.name,
        patient_email: patientInfo.email,
        patient_phone: patientInfo.phone,
        preferred_time: patientInfo.preferredTime,
        summary_id: patientInfo.summaryId,
        status: 'pending',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error booking appointment:', error);
    throw error;
  }
}

