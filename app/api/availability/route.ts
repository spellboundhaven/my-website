import { NextRequest, NextResponse } from 'next/server';
import { getAvailabilityForRange } from '@/lib/db';

// Revalidate availability data every 60 seconds so manual blocks appear quickly
export const revalidate = 60;

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

    const availability = await getAvailabilityForRange(startDate, endDate);

    return NextResponse.json(
      {
        success: true,
        availability
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30'
        }
      }
    );
  } catch (error) {
    console.error('Error fetching availability:', error);
    return NextResponse.json(
      { error: 'Failed to fetch availability' },
      { status: 500 }
    );
  }
}

