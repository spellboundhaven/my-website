import { NextRequest, NextResponse } from 'next/server';
import ical from 'node-ical';
import { createDateBlock, updateAirbnbSync, getLastAirbnbSync, getAllDateBlocks } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { icalUrl, action } = body;

    if (action === 'sync' && icalUrl) {
      // Fetch and parse iCal feed
      const events = await ical.async.fromURL(icalUrl);
      
      // Extract booked dates from iCal
      const bookedDates: { start: string; end: string; summary: string }[] = [];
      
      for (const event of Object.values(events)) {
        if (event.type === 'VEVENT' && event.start && event.end) {
          const start = new Date(event.start);
          const end = new Date(event.end);
          
          bookedDates.push({
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0],
            summary: event.summary || 'Airbnb Booking'
          });
        }
      }

      // Get existing Airbnb blocks
      const existingBlocks = await getAllDateBlocks();
      const airbnbBlocks = existingBlocks.filter(b => b.reason.startsWith('Airbnb:'));

      // Create new blocks for each booked date range
      for (const booking of bookedDates) {
        // Check if this date range already exists
        const exists = airbnbBlocks.some(
          b => b.start_date === booking.start && b.end_date === booking.end
        );

        if (!exists) {
          await createDateBlock({
            start_date: booking.start,
            end_date: booking.end,
            reason: `Airbnb: ${booking.summary}`
          });
        }
      }

      // Update sync record
      await updateAirbnbSync(icalUrl, 'success');

      return NextResponse.json({
        success: true,
        message: `Synced ${bookedDates.length} Airbnb bookings`,
        bookedDates
      });
    }

    if (action === 'getLastSync') {
      const lastSync = await getLastAirbnbSync();
      return NextResponse.json({
        success: true,
        lastSync
      });
    }

    return NextResponse.json(
      { error: 'Invalid action or missing icalUrl' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error syncing Airbnb calendar:', error);
    return NextResponse.json(
      { error: 'Failed to sync Airbnb calendar', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const lastSync = await getLastAirbnbSync();
    return NextResponse.json({
      success: true,
      lastSync
    });
  } catch (error) {
    console.error('Error getting last sync:', error);
    return NextResponse.json(
      { error: 'Failed to get last sync' },
      { status: 500 }
    );
  }
}

