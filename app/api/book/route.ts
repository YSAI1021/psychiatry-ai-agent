/**
 * API route for booking appointments
 */

import { NextRequest, NextResponse } from 'next/server';
import { bookAppointment } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { psychiatristId, name, email, phone, preferredTime, summaryId } = body;

    if (!psychiatristId || !name || !email || !preferredTime) {
      return NextResponse.json(
        { error: 'Missing required fields: psychiatristId, name, email, preferredTime' },
        { status: 400 }
      );
    }

    const appointment = await bookAppointment(psychiatristId, {
      name,
      email,
      phone,
      preferredTime,
      summaryId,
    });

    return NextResponse.json({
      success: true,
      appointment,
      message: 'Appointment request submitted successfully',
    });
  } catch (error) {
    console.error('Booking API error:', error);
    return NextResponse.json(
      { error: 'Failed to book appointment. Please try again.' },
      { status: 500 }
    );
  }
}

