import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { updateBooking, getBookingByStripeSession } from '@/lib/db';
import { Resend } from 'resend';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    // Update booking status
    const booking = await getBookingByStripeSession(session.id);
    
    if (booking && booking.id) {
      await updateBooking(booking.id, {
        status: 'confirmed',
        payment_status: 'paid'
      });

      // Send confirmation emails
      try {
        if (process.env.RESEND_API_KEY) {
          // Email to host
          if (process.env.HOST_EMAIL) {
            await resend.emails.send({
              from: 'Spellbound Haven <noreply@spellboundhaven.com>',
              to: process.env.HOST_EMAIL,
              subject: `✅ Booking Confirmed - ${booking.guest_name}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h1 style="color: #10b981;">✅ Booking Confirmed & Paid</h1>
                  <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
                    <h2>Guest Information</h2>
                    <p><strong>Name:</strong> ${booking.guest_name}</p>
                    <p><strong>Email:</strong> ${booking.guest_email}</p>
                    <p><strong>Phone:</strong> ${booking.guest_phone}</p>
                    <p><strong>Guests:</strong> ${booking.guests_count}</p>
                  </div>
                  <div style="background-color: #d1fae5; border-radius: 8px; padding: 20px; margin: 20px 0;">
                    <h2>Booking Details</h2>
                    <p><strong>Check-in:</strong> ${booking.check_in_date}</p>
                    <p><strong>Check-out:</strong> ${booking.check_out_date}</p>
                    <p><strong>Total Paid:</strong> $${booking.total_price}</p>
                    <p><strong>Payment Method:</strong> Credit Card (Stripe)</p>
                  </div>
                </div>
              `
            });
          }

          // Email to guest
          await resend.emails.send({
            from: 'Spellbound Haven <noreply@spellboundhaven.com>',
            to: booking.guest_email,
            subject: '🎉 Your Spellbound Haven Booking is Confirmed!',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h1 style="color: #4f46e5;">🎉 Booking Confirmed!</h1>
                <p>Dear ${booking.guest_name},</p>
                <p>Thank you for booking Spellbound Haven! Your payment has been received and your reservation is confirmed.</p>
                
                <div style="background-color: #eef2ff; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <h2>Your Booking Details</h2>
                  <p><strong>Property:</strong> Spellbound Haven</p>
                  <p><strong>Address:</strong> Windsor Island Resort, Orlando, FL</p>
                  <p><strong>Check-in:</strong> ${booking.check_in_date} (4:00 PM)</p>
                  <p><strong>Check-out:</strong> ${booking.check_out_date} (10:00 AM)</p>
                  <p><strong>Guests:</strong> ${booking.guests_count}</p>
                  <p><strong>Total Paid:</strong> $${booking.total_price}</p>
                </div>

                <div style="background-color: #fef3c7; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <h2>What's Next?</h2>
                  <ul style="line-height: 1.8;">
                    <li>You'll receive check-in instructions 24 hours before arrival</li>
                    <li>Access codes and parking information will be provided</li>
                    <li>Resort amenity passes available at check-in</li>
                  </ul>
                </div>

                <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <h2>Need Help?</h2>
                  <p>If you have any questions, please contact us:</p>
                  <p>📧 Email: ${process.env.HOST_EMAIL || 'info@spellboundhaven.com'}</p>
                </div>

                <p style="margin-top: 30px;">We can't wait to host you at Spellbound Haven!</p>
                <p><strong>The Spellbound Haven Team</strong></p>
              </div>
            `
          });
        }
      } catch (emailError) {
        console.error('Error sending confirmation emails:', emailError);
      }
    }
  }

  return NextResponse.json({ received: true });
}

