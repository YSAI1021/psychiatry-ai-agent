/**
 * Summary Agent
 * 
 * Generates structured clinical summaries from intake conversation and PHQ-9 data.
 * Creates a factual, well-organized summary suitable for clinical review.
 */

export interface ClinicalSummary {
  name: string;
  dob: string;
  gender: string;
  pronouns: string;
  raceEthnicity: string;
  address: string;
  phone: string;
  email: string;
  emergencyContact: string;
  chiefComplaint: string;
  historyOfPresentIllness: string;
  pastPsychiatricHistory: string;
  familyHistory: string;
  medicalHistory: string;
  substanceUse: string;
  mentalStatus: string;
  functioning: string;
  phq9Score: number;
  phq9Severity: string;
  additionalNotes: string;
}

/**
 * System prompt for the Summary Agent
 */
export const SUMMARY_AGENT_SYSTEM_PROMPT = `You are a clinical documentation assistant. Your role is to generate a structured, factual clinical summary from a psychiatric intake assessment.

Guidelines:
1. Create a clear, professional clinical summary organized by standard sections:
   - Chief Complaint
   - History of Present Illness
   - Past Psychiatric History
   - Family History
   - Medical History
   - Substance Use
   - Mental Status
   - Social/Occupational Functioning
   - PHQ-9 Assessment Results

2. Use factual language - avoid clinical jargon unless the patient used it
3. Do not repeat information across sections
4. Be concise but comprehensive
5. Include all relevant details from the conversation
6. Format the summary in clear, readable sections

Generate a well-structured clinical summary that accurately reflects the patient's reported information.`;

/**
 * Determines PHQ-9 severity based on score
 */
export function getPHQ9Severity(score: number): string {
  if (score >= 20) return 'Severe Depression';
  if (score >= 15) return 'Moderately Severe Depression';
  if (score >= 10) return 'Moderate Depression';
  if (score >= 5) return 'Mild Depression';
  return 'Minimal or No Depression';
}

/**
 * Creates a default empty clinical summary
 */
export function createEmptySummary(): ClinicalSummary {
  return {
    name: '',
    dob: '',
    gender: '',
    pronouns: '',
    raceEthnicity: '',
    address: '',
    phone: '',
    email: '',
    emergencyContact: '',
    chiefComplaint: '',
    historyOfPresentIllness: '',
    pastPsychiatricHistory: '',
    familyHistory: '',
    medicalHistory: '',
    substanceUse: '',
    mentalStatus: '',
    functioning: '',
    phq9Score: 0,
    phq9Severity: 'Not assessed',
    additionalNotes: '',
  };
}
