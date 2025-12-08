/**
 * Supabase client configuration
 * Handles database connections for clinical summaries, psychiatrists, and bookings
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not configured. Some features may not work.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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

