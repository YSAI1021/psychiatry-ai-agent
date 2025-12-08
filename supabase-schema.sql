-- Psychiatry AI Agent - Supabase Database Schema
-- Run this SQL in your Supabase SQL editor to set up the required tables

-- Clinical Summaries Table
CREATE TABLE IF NOT EXISTS clinical_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  summary_text TEXT NOT NULL,
  phq9_score INTEGER NOT NULL,
  patient_age INTEGER,
  patient_gender TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Psychiatrists Directory Table
CREATE TABLE IF NOT EXISTS psychiatrists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  location TEXT NOT NULL,
  insurance_carriers TEXT[] DEFAULT ARRAY[]::TEXT[],
  in_network_carriers TEXT[] DEFAULT ARRAY[]::TEXT[],
  accepts_new_patients BOOLEAN DEFAULT true,
  accepts_cash_pay BOOLEAN DEFAULT false,
  email TEXT,
  phone TEXT
);

-- Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  psychiatrist_id UUID NOT NULL,
  psychiatrist_name TEXT NOT NULL,
  email_content TEXT NOT NULL,
  patient_email TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'cancelled'))
);

-- Insert Sample Psychiatrists Data
INSERT INTO psychiatrists (name, specialty, location, insurance_carriers, in_network_carriers, accepts_new_patients, accepts_cash_pay, email, phone) VALUES
  ('Dr. Sarah Johnson', 'General Psychiatry, Anxiety Disorders', 'New Haven, CT', 
   ARRAY['Aetna', 'Blue Cross Blue Shield', 'UnitedHealthcare'], 
   ARRAY['Aetna', 'Blue Cross Blue Shield'], 
   true, true, 's.johnson@example.com', '(203) 555-0101'),
  ('Dr. Michael Chen', 'Mood Disorders, Depression', 'New Haven, CT', 
   ARRAY['Blue Cross Blue Shield', 'Cigna'], 
   ARRAY['Blue Cross Blue Shield'], 
   true, false, 'm.chen@example.com', '(203) 555-0102'),
  ('Dr. Emily Rodriguez', 'Trauma, PTSD', 'Hartford, CT', 
   ARRAY['Aetna', 'UnitedHealthcare', 'Medicaid'], 
   ARRAY['Aetna', 'Medicaid'], 
   false, true, 'e.rodriguez@example.com', '(860) 555-0103'),
  ('Dr. James Wilson', 'Child and Adolescent Psychiatry', 'Stamford, CT', 
   ARRAY['Aetna', 'Blue Cross Blue Shield', 'Cigna', 'UnitedHealthcare'], 
   ARRAY['Aetna', 'Cigna'], 
   true, true, 'j.wilson@example.com', '(203) 555-0104'),
  ('Dr. Maria Garcia', 'Addiction Psychiatry', 'Bridgeport, CT', 
   ARRAY['Medicaid', 'Blue Cross Blue Shield'], 
   ARRAY['Medicaid'], 
   true, false, 'm.garcia@example.com', '(203) 555-0105');

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_psychiatrists_location ON psychiatrists(location);
CREATE INDEX IF NOT EXISTS idx_psychiatrists_accepts_new ON psychiatrists(accepts_new_patients);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_psychiatrist_id ON bookings(psychiatrist_id);
CREATE INDEX IF NOT EXISTS idx_clinical_summaries_created_at ON clinical_summaries(created_at);

-- Enable Row Level Security (RLS) if needed
-- ALTER TABLE clinical_summaries ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE psychiatrists ENABLE ROW LEVEL SECURITY;

-- Example RLS Policies (adjust based on your authentication requirements)
-- CREATE POLICY "Allow public read access to psychiatrists" ON psychiatrists
--   FOR SELECT USING (true);

-- CREATE POLICY "Allow public insert access to clinical_summaries" ON clinical_summaries
--   FOR INSERT WITH CHECK (true);

-- CREATE POLICY "Allow public insert access to bookings" ON bookings
--   FOR INSERT WITH CHECK (true);


