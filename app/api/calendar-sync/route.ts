import { NextRequest, NextResponse } from 'next/server';
import * as ical from 'node-ical';
import { createDateBlock, getAllDateBlocks, updateCalendarSync, getLastCalendarSync, getAllCalendarSyncs, initDatabase } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    await initDatabase();
    
    const body = await request.json();
    const { source, icalUrl } = body;

    if (!source || !icalUrl) {
      return NextResponse.json(
        { error: 'Missing source or icalUrl' },
        { status: 400 }
      );
    }

    const sourceName = source.toLowerCase(); // 'airbnb' or 'vrbo'
    console.log(`[${sourceName.toUpperCase()}] Starting sync from: ${icalUrl}`);

    // Fetch and parse iCal feed
    const events = await ical.async.fromURL(icalUrl);
    
    // Get existing date blocks to avoid duplicates (check ALL sources, not just current one)
    const existingBlocks = await getAllDateBlocks();
    const existingRanges = new Set(
      existingBlocks.map((block: any) => `${block.start_date}_${block.end_date}`)
    );
    
    // Extract booked dates from iCal
    const bookedDates: Array<{ start: string; end: string; summary: string }> = [];
    
    for (const event of Object.values(events)) {
      if (event.type === 'VEVENT' && event.start && event.end) {
        const startDate = new Date(event.start);
        const endDate = new Date(event.end);
        
        // Format dates as YYYY-MM-DD
        const start = startDate.toISOString().split('T')[0];
        const end = endDate.toISOString().split('T')[0];
        
        const rangeKey = `${start}_${end}`;
        
        // Only add if not already in database
        if (!existingRanges.has(rangeKey)) {
          bookedDates.push({
            start,
            end,
            summary: event.summary || `${sourceName} booking`
          });
        }
      }
    }

    // Create date blocks for new bookings
    let syncedCount = 0;
    for (const booking of bookedDates) {
      try {
        await createDateBlock({
          start_date: booking.start,
          end_date: booking.end,
          reason: `${sourceName.charAt(0).toUpperCase() + sourceName.slice(1)}: ${booking.summary}`
        });
        syncedCount++;
      } catch (error) {
        console.error(`[${sourceName.toUpperCase()}] Error creating date block:`, error);
      }
    }
    
    console.log(`[${sourceName.toUpperCase()}] Created ${syncedCount} new blocks`);

    // Update sync record
    await updateCalendarSync(sourceName, icalUrl, 'success', syncedCount);

    // Revalidate the availability cache
    revalidatePath('/api/availability', 'page');
    console.log(`[${sourceName.toUpperCase()}] Sync completed. Cache revalidated.`);

    return NextResponse.json({
      success: true,
      message: `Synced ${syncedCount} ${sourceName} bookings`,
      bookedDates
    });
  } catch (error) {
    console.error('[SYNC] Error:', error);
    
    // Try to update sync status to failure
    try {
      const body = await request.json();
      if (body.source && body.icalUrl) {
        await updateCalendarSync(body.source, body.icalUrl, 'failure', 0);
      }
    } catch (updateError) {
      console.error('[SYNC] Failed to update sync status:', updateError);
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to sync calendar', 
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await initDatabase();
    const syncs = await getAllCalendarSyncs();
    
    return NextResponse.json({
      success: true,
      syncs
    });
  } catch (error) {
    console.error('Error fetching calendar syncs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calendar syncs' },
      { status: 500 }
    );
  }
}

