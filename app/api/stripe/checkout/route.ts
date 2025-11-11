import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createBooking } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 503 }
      );
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-10-29.clover',
    });
    const body = await request.json();
    const {
      check_in_date,
      check_out_date,
      guest_name,
      guest_email,
      guest_phone,
      guests_count,
      total_price,
      notes
    } = body;

    // Validate required fields
    if (!check_in_date || !check_out_date || !guest_name || !guest_email || !guest_phone || !guests_count || !total_price) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate nights
    const checkIn = new Date(check_in_date);
    const checkOut = new Date(check_out_date);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Spellbound Haven Vacation Rental',
              description: `${nights} night${nights > 1 ? 's' : ''} | ${check_in_date} to ${check_out_date}`,
              images: [`${process.env.NEXT_PUBLIC_BASE_URL || 'https://spellboundhaven.com'}/images/hero/hero.jpg`],
            },
            unit_amount: Math.round(total_price * 100), // Stripe uses cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || request.headers.get('origin')}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || request.headers.get('origin')}/#availability`,
      customer_email: guest_email,
      metadata: {
        check_in_date,
        check_out_date,
        guest_name,
        guest_phone,
        guests_count: guests_count.toString(),
        notes: notes || '',
      },
    });

    // Create pending booking in database
    await createBooking({
      check_in_date,
      check_out_date,
      guest_name,
      guest_email,
      guest_phone,
      guests_count,
      total_price,
      status: 'pending',
      payment_method: 'stripe',
      payment_status: 'pending',
      stripe_session_id: session.id,
      notes,
      source: 'website'
    });

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url
    });
  } catch (error) {
    console.error('Error creating Stripe checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}

