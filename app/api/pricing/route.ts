import { NextRequest, NextResponse } from 'next/server';
import { getPriceForDate } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    // Calculate total price for the date range
    let totalPrice = 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const nights: { date: string; price: number }[] = [];

    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const price = await getPriceForDate(dateStr);
      totalPrice += price;
      nights.push({ date: dateStr, price });
    }

    return NextResponse.json({
      success: true,
      totalPrice,
      nights,
      nightCount: nights.length
    });
  } catch (error) {
    console.error('Error calculating pricing:', error);
    return NextResponse.json(
      { error: 'Failed to calculate pricing' },
      { status: 500 }
    );
  }
}

