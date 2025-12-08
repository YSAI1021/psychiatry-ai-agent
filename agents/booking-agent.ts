import OpenAI from 'openai';
import { Message, PatientInfo, Psychiatrist, BookingEmail } from '@/types';

export class BookingAgent {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  async generateBookingEmail(
    clinicalSummary: string,
    patientInfo: PatientInfo,
    psychiatrist: Psychiatrist
  ): Promise<BookingEmail> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a booking agent that generates professional emails for patients to contact psychiatrists.

Generate a professional, warm email that:
1. Introduces the patient briefly
2. Summarizes their concerns professionally
3. Includes the clinical summary in a clear format
4. Requests an appointment
5. Is respectful and appropriate

Return JSON in this format:
{
  "to": "psychiatrist-email@example.com",
  "subject": "Appointment Request - [Patient Name]",
  "body": "Full email body text"
}`,
          },
          {
            role: 'user',
            content: `Patient Information:
Name: ${patientInfo.name || 'Not provided'}
DOB: ${patientInfo.dob || 'Not provided'}
Phone: ${patientInfo.phone || 'Not provided'}
Email: ${patientInfo.email || 'Not provided'}

Clinical Summary:
${clinicalSummary}

Psychiatrist: ${psychiatrist.name}, ${psychiatrist.credential}
Subspecialty: ${psychiatrist.subspecialty}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
        response_format: { type: 'json_object' },
      });

      const content = completion.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(content);

      // Construct full email with patient info embedded
      const fullBody = `${parsed.body || ''}

---
Patient Information:
Name: ${patientInfo.name || 'Not provided'}
Date of Birth: ${patientInfo.dob || 'Not provided'}
Phone: ${patientInfo.phone || 'Not provided'}
Email: ${patientInfo.email || 'Not provided'}
Emergency Contact: ${patientInfo.emergencyContact || 'Not provided'}

Clinical Summary:
${clinicalSummary}`;

      return {
        to: parsed.to || `${psychiatrist.name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        subject: parsed.subject || `Appointment Request - ${patientInfo.name || 'New Patient'}`,
        body: fullBody,
      };
    } catch (error) {
      console.error('Error generating booking email:', error);
      // Return fallback email
      return {
        to: `${psychiatrist.name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        subject: `Appointment Request - ${patientInfo.name || 'New Patient'}`,
        body: `Dear Dr. ${psychiatrist.name.split(' ').pop()},

I hope this email finds you well. I am writing to request an appointment for a psychiatric consultation.

Patient Information:
Name: ${patientInfo.name || 'Not provided'}
Date of Birth: ${patientInfo.dob || 'Not provided'}
Phone: ${patientInfo.phone || 'Not provided'}
Email: ${patientInfo.email || 'Not provided'}

Clinical Summary:
${clinicalSummary}

I would appreciate the opportunity to schedule an appointment at your earliest convenience.

Thank you for your consideration.

Best regards,
${patientInfo.name || 'Patient'}`,
      };
    }
  }

  async processBookingRequest(
    userResponse: string,
    clinicalSummary: string,
    patientInfo: PatientInfo,
    psychiatrist: Psychiatrist
  ): Promise<{ response: string; email?: BookingEmail }> {
    const lowerResponse = userResponse.toLowerCase();

    if (lowerResponse.includes('yes') || lowerResponse.includes('sure') || lowerResponse.includes('ok')) {
      const email = await this.generateBookingEmail(clinicalSummary, patientInfo, psychiatrist);
      return {
        response: "I've prepared an email for you. Please review it below and feel free to edit before sending.",
        email,
      };
    }

    return {
      response: 'No problem. You can contact the psychiatrist directly when you\'re ready.',
    };
  }
}
