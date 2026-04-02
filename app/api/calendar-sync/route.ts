import { NextRequest, NextResponse } from 'next/server';
import * as ical from 'node-ical';
import { createDateBlock, hasOverlappingDateBlock, updateCalendarSync, getLastCalendarSync, getAllCalendarSyncs, getDateBlocksBySource, deleteDateBlock, initDatabase } from '@/lib/db';
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
    
    // Build set of current iCal date ranges for comparison
    const icalRanges: Array<{ start: string; end: string; summary: string }> = [];
    
    for (const event of Object.values(events)) {
      if (event.type === 'VEVENT' && event.start && event.end) {
        const summary = (event.summary || '').toLowerCase();

        // Skip platform buffer/turnaround blocks (not real bookings)
        if (summary.includes('not available') || summary.includes('blocked')) {
          console.log(`[${sourceName.toUpperCase()}] Skipping buffer block: "${event.summary}"`);
          continue;
        }

        const startDate = new Date(event.start);
        const endDate = new Date(event.end);
        
        const start = startDate.toISOString().split('T')[0];
        const end = endDate.toISOString().split('T')[0];
        
        icalRanges.push({
          start,
          end,
          summary: event.summary || `${sourceName} booking`
        });
      }
    }

    // Remove stale blocks: existing DB blocks for this source that are no longer in the iCal feed
    const existingBlocks = await getDateBlocksBySource(sourceName);
    let removedCount = 0;
    for (const block of existingBlocks) {
      const blockStart = new Date(block.start_date).toISOString().split('T')[0];
      const blockEnd = new Date(block.end_date).toISOString().split('T')[0];
      
      const stillInFeed = icalRanges.some(r => r.start === blockStart && r.end === blockEnd);
      if (!stillInFeed) {
        await deleteDateBlock(block.id);
        removedCount++;
        console.log(`[${sourceName.toUpperCase()}] Removed cancelled block: ${blockStart} to ${blockEnd}`);
      }
    }

    // Add new blocks that don't already exist
    let syncedCount = 0;
    for (const booking of icalRanges) {
      const hasOverlap = await hasOverlappingDateBlock(booking.start, booking.end);
      if (!hasOverlap) {
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
    }
    
    console.log(`[${sourceName.toUpperCase()}] Added ${syncedCount} new, removed ${removedCount} cancelled blocks`);

    // Update sync record
    await updateCalendarSync(sourceName, icalUrl, 'success', syncedCount);

    // Revalidate the availability cache
    revalidatePath('/api/availability', 'page');
    console.log(`[${sourceName.toUpperCase()}] Sync completed. Cache revalidated.`);

    return NextResponse.json({
      success: true,
      message: `Synced ${syncedCount} new, removed ${removedCount} cancelled ${sourceName} bookings`,
      added: syncedCount,
      removed: removedCount,
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

