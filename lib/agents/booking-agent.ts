/**
 * Booking Agent
 * 
 * Responsibilities:
 * - Lets user select a psychiatrist from recommendations
 * - Generates a draft email to send to the chosen psychiatrist
 * - Includes:
 *   - Clinical summary
 *   - Patient availability/preferences
 *   - Contact information
 * - Allows patient to review and approve before sending
 * - Saves email content to Supabase (or sends via mock function)
 */

import { openai } from '../openai';
import { ClinicalSummary } from '../store';
import { Psychiatrist } from '../supabase';
import { supabase, Booking } from '../supabase';

export interface BookingAgentResponse {
  emailDraft: string;
  message: string;
}

/**
 * Generate email draft for psychiatrist referral
 */
export async function generateBookingEmail(
  psychiatrist: Psychiatrist,
  clinicalSummary: ClinicalSummary,
  patientAvailability?: string,
  patientContactInfo?: string
): Promise<BookingAgentResponse> {
  if (!openai) {
    throw new Error('OpenAI client not configured');
  }

  const prompt = `Generate a professional referral email to a psychiatrist. Include:

1. Subject line: "New Patient Referral - [Patient Initials/Age]"
2. Brief introduction explaining this is a referral from the PsyConnect platform
3. Clinical summary (from intake) - include this in the email body
4. Note that the full clinical summary is also attached as a text file
5. Patient availability/preferences for scheduling
6. Contact information for follow-up
7. Professional closing

Psychiatrist Information:
- Name: ${psychiatrist.name}
- Specialty: ${psychiatrist.specialty}
- Location: ${psychiatrist.location}
- Email: ${psychiatrist.email || 'Not provided'}

Clinical Summary:
${clinicalSummary.text}

Patient Availability: ${patientAvailability || 'Flexible'}
Contact Information: ${patientContactInfo || 'To be provided'}

Generate a professional, concise email suitable for a psychiatrist referral. The email should reference that a detailed clinical summary is attached.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a professional medical referral coordinator. Generate concise, professional referral emails.\n\nAGENT LANGUAGE STYLE: Use a simple, human, conversational tone. Avoid repeating information verbatim unless clarifying. Focus on helpful transitions and clear communication.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 600,
    });

    const emailDraft = response.choices[0]?.message?.content || 'Unable to generate email draft.';

    return {
      emailDraft,
      message: `I've generated an email draft for ${psychiatrist.name}. Please review it and let me know if you'd like any changes. Once approved, I can send it.`,
    };
  } catch (error) {
    console.error('Error generating booking email:', error);
    throw error;
  }
}

/**
 * Save booking to database
 */
export async function saveBooking(
  psychiatristId: string,
  psychiatristName: string,
  emailContent: string,
  patientEmail?: string
): Promise<Booking> {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        psychiatrist_id: psychiatristId,
        psychiatrist_name: psychiatristName,
        email_content: emailContent,
        patient_email: patientEmail,
        status: 'draft',
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving booking:', error);
      throw error;
    }

    return data as Booking;
  } catch (error) {
    console.error('Error in saveBooking:', error);
    // Return mock booking for development
    return {
      id: 'mock-' + Date.now(),
      psychiatrist_id: psychiatristId,
      psychiatrist_name: psychiatristName,
      email_content: emailContent,
      patient_email: patientEmail,
      status: 'draft',
      created_at: new Date().toISOString(),
    };
  }
}

/**
 * Update booking status (e.g., to 'sent')
 */
export async function updateBookingStatus(
  bookingId: string,
  status: 'draft' | 'sent' | 'cancelled'
): Promise<void> {
  try {
    const { error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', bookingId);

    if (error) {
      console.error('Error updating booking status:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in updateBookingStatus:', error);
    // Mock function - in production this would handle errors appropriately
  }
}

/**
 * Send email with optional attachment via serverless function
 * In production, this calls the /api/send-email endpoint which integrates with email service
 */
export async function sendEmail(
  to: string,
  subject: string,
  body: string,
  attachmentText?: string,
  attachmentFileName?: string
): Promise<boolean> {
  try {
    // Call serverless function to send email
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        subject,
        body,
        attachmentText,
        attachmentFileName: attachmentFileName || 'clinical-summary.txt',
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      console.error('[Booking Agent] Email send failed:', data.error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Booking Agent] Error sending email:', error);
    return false;
  }
}

