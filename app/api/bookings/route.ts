import { NextRequest, NextResponse } from 'next/server';
import { createBooking, getAllBookings, updateBooking, deleteBooking, getBooking, isDateAvailable } from '@/lib/db';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      check_in_date,
      check_out_date,
      guest_name,
      guest_email,
      guest_phone,
      guests_count,
      total_price,
      payment_method,
      notes
    } = body;

    // Validate required fields
    if (!check_in_date || !check_out_date || !guest_name || !guest_email || !guest_phone || !guests_count || !total_price) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if dates are available
    const start = new Date(check_in_date);
    const end = new Date(check_out_date);
    
    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const available = await isDateAvailable(dateStr);
      
      if (!available) {
        return NextResponse.json(
          { error: `Date ${dateStr} is not available` },
          { status: 400 }
        );
      }
    }

    // Create booking
    const booking = await createBooking({
      check_in_date,
      check_out_date,
      guest_name,
      guest_email,
      guest_phone,
      guests_count,
      total_price,
      status: 'pending',
      payment_method,
      payment_status: 'pending',
      notes,
      source: 'website'
    });

    // Send email notification
    try {
      if (process.env.RESEND_API_KEY && process.env.HOST_EMAIL) {
        await resend.emails.send({
          from: 'Spellbound Haven <noreply@spellboundhaven.com>',
          to: process.env.HOST_EMAIL,
          subject: `New Booking Request - ${guest_name}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #4f46e5;">New Booking Request</h1>
              <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h2>Guest Information</h2>
                <p><strong>Name:</strong> ${guest_name}</p>
                <p><strong>Email:</strong> ${guest_email}</p>
                <p><strong>Phone:</strong> ${guest_phone}</p>
                <p><strong>Guests:</strong> ${guests_count}</p>
              </div>
              <div style="background-color: #eef2ff; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h2>Booking Details</h2>
                <p><strong>Check-in:</strong> ${check_in_date}</p>
                <p><strong>Check-out:</strong> ${check_out_date}</p>
                <p><strong>Total:</strong> $${total_price}</p>
                <p><strong>Payment Method:</strong> ${payment_method || 'Not specified'}</p>
              </div>
              ${notes ? `<div style="background-color: #fffbeb; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h2>Notes</h2>
                <p>${notes}</p>
              </div>` : ''}
            </div>
          `
        });
      }
    } catch (emailError) {
      console.error('Error sending email:', emailError);
      // Don't fail the booking if email fails
    }

    return NextResponse.json({
      success: true,
      booking
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (id) {
      const booking = await getBooking(parseInt(id));
      if (!booking) {
        return NextResponse.json(
          { error: 'Booking not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        booking
      });
    }

    const bookings = await getAllBookings();
    return NextResponse.json({
      success: true,
      bookings
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    const booking = await updateBooking(parseInt(id), updates);

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      booking
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    return NextResponse.json(
      { error: 'Failed to update booking' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    const success = await deleteBooking(parseInt(id));

    if (!success) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true
    });
  } catch (error) {
    console.error('Error deleting booking:', error);
    return NextResponse.json(
      { error: 'Failed to delete booking' },
      { status: 500 }
    );
  }
}

