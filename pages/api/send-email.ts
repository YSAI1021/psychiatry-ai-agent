/**
 * Serverless function to send emails with clinical summary attachments
 * Handles email sending via email service (mock implementation ready for production)
 */

import { NextApiRequest, NextApiResponse } from 'next';

interface SendEmailRequest {
  to: string;
  subject: string;
  body: string;
  attachmentText?: string;
  attachmentFileName?: string;
}

interface SendEmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SendEmailResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.',
    });
  }

  try {
    const { to, subject, body, attachmentText, attachmentFileName }: SendEmailRequest = req.body;

    // Validate required fields
    if (!to || !subject || !body) {
      console.error('[API] Missing required fields:', { to: !!to, subject: !!subject, body: !!body });
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to, subject, and body are required.',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      console.error('[API] Invalid email format:', to);
      return res.status(400).json({
        success: false,
        error: 'Invalid email address format.',
      });
    }

    // Mock email sending (in production, integrate with SendGrid, Nodemailer, Resend, etc.)
    console.log('[API] Mock email send:', {
      to,
      subject,
      bodyLength: body.length,
      hasAttachment: !!attachmentText,
      attachmentFileName,
    });

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // In production, use an email service:
    // Example with SendGrid:
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // const msg = {
    //   to,
    //   from: process.env.FROM_EMAIL,
    //   subject,
    //   text: body,
    //   html: body.replace(/\n/g, '<br>'),
    //   attachments: attachmentText ? [{
    //     content: Buffer.from(attachmentText).toString('base64'),
    //     filename: attachmentFileName || 'clinical-summary.txt',
    //     type: 'text/plain',
    //     disposition: 'attachment',
    //   }] : [],
    // };
    // await sgMail.send(msg);

    // Mock success response
    const messageId = `mock-${Date.now()}@psconnect.example.com`;

    return res.status(200).json({
      success: true,
      messageId,
    });
  } catch (error: any) {
    console.error('[API] Error sending email:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });

    return res.status(500).json({
      success: false,
      error: 'Failed to send email. Please try again later.',
    });
  }
}


