/**
 * Supabase client configuration
 * Handles database operations for summaries, test metadata, and bookings
 */

import { createClient } from '@supabase/supabase-js';
import { ClinicalSummary } from './store';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Only create client if valid URL is provided (during build, this prevents errors)
export const supabase = supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co'
  ? createClient(supabaseUrl, supabaseKey)
  : null as any; // Type assertion to prevent build errors, but functions will check for null

/**
 * Save clinical summary to Supabase
 * Stores structured data (not raw chat transcripts) for clinician review
 */
export async function saveSummary(
  summary: ClinicalSummary,
  metadata?: {
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
        summary_data: summary,
        triage_level: summary.triageLevel,
        test_mode: metadata?.testMode || false,
        user_rating: metadata?.userRating,
        comments: metadata?.comments,
        duration_seconds: metadata?.duration,
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
 * In a real app, this would query a psychiatrists table
 */
export async function getPsychiatrists() {
  try {
    // For now, return mock data structure
    // In production, this would query: supabase.from('psychiatrists').select('*')
    return [];
  } catch (error) {
    console.error('Error fetching psychiatrists:', error);
    return [];
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

