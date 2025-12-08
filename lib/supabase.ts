/**
 * Supabase client configuration
 * Handles database connections for clinical summaries, psychiatrists, and bookings
 * Gracefully handles missing credentials to prevent build-time errors
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create Supabase client only if credentials are available
// This prevents build-time errors when env vars are not set
let supabaseInstance: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    console.warn('Failed to create Supabase client:', error);
  }
} else {
  console.warn('Supabase credentials not configured. Some features may not work.');
}

// Export a safe wrapper that handles missing client
export const supabase = supabaseInstance || {
  from: () => ({
    select: () => ({ data: null, error: { message: 'Supabase not configured' } }),
    insert: () => ({ data: null, error: { message: 'Supabase not configured' } }),
    update: () => ({ eq: () => ({ error: { message: 'Supabase not configured' } }) }),
    ilike: () => ({ data: null, error: { message: 'Supabase not configured' } }),
    contains: () => ({ data: null, error: { message: 'Supabase not configured' } }),
    eq: () => ({ data: null, error: { message: 'Supabase not configured' } }),
  }),
} as any;

// Database types
export interface ClinicalSummary {
  id?: string;
  created_at?: string;
  summary_text: string;
  phq9_score: number;
  patient_age?: number;
  patient_gender?: string;
  metadata?: Record<string, any>;
}

export interface Psychiatrist {
  id: string;
  name: string;
  specialty: string;
  location: string;
  insurance_carriers: string[];
  in_network_carriers: string[];
  accepts_new_patients: boolean;
  email?: string;
  phone?: string;
  accepts_cash_pay: boolean;
}

export interface Booking {
  id?: string;
  created_at?: string;
  psychiatrist_id: string;
  psychiatrist_name: string;
  email_content: string;
  patient_email?: string;
  status: 'draft' | 'sent' | 'cancelled';
}

