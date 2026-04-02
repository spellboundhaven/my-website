import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import ical from 'node-ical';
import { createDateBlock, getLastCalendarSync, updateCalendarSync, hasOverlappingDateBlock, getDateBlocksBySource, deleteDateBlock } from '@/lib/db';

export const dynamic = 'force-dynamic';

// This API route will be triggered by Vercel Cron
// Configure in vercel.json to run daily at midnight (00:00 UTC)
export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel Cron
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[CRON] Starting daily calendar sync (Airbnb + VRBO)...');

    let totalSynced = 0;
    const results: any[] = [];

    // Sync both Airbnb and VRBO
    for (const source of ['airbnb', 'vrbo']) {
      try {
        const lastSync = await getLastCalendarSync(source);
        
        if (!lastSync || !lastSync.ical_url) {
          console.log(`[CRON] No ${source.toUpperCase()} iCal URL configured, skipping...`);
          results.push({ source, status: 'skipped', message: 'No iCal URL configured' });
          continue;
        }

        const icalUrl = lastSync.ical_url;
        console.log(`[CRON] Syncing ${source.toUpperCase()} from: ${icalUrl}`);

        // Fetch and parse iCal feed
        const events = await ical.async.fromURL(icalUrl);
        
        // Build set of current iCal date ranges
        const icalRanges: { start: string; end: string; summary: string }[] = [];
        
        for (const event of Object.values(events)) {
          if (event.type === 'VEVENT' && event.start && event.end) {
            const summary = (event.summary || '').toLowerCase();

            // Skip platform buffer/turnaround blocks (not real bookings)
            if (summary.includes('not available') || summary.includes('blocked')) {
              console.log(`[CRON] Skipping ${source.toUpperCase()} buffer block: "${event.summary}"`);
              continue;
            }

            const start = new Date(event.start);
            const end = new Date(event.end);
            
            const startStr = start.toISOString().split('T')[0];
            const endStr = end.toISOString().split('T')[0];
            
            icalRanges.push({
              start: startStr,
              end: endStr,
              summary: event.summary || `${source} Booking`
            });
          }
        }

        // Remove stale blocks: existing DB blocks for this source no longer in the iCal feed
        const existingBlocks = await getDateBlocksBySource(source);
        let removedCount = 0;
        for (const block of existingBlocks) {
          const blockStart = new Date(block.start_date).toISOString().split('T')[0];
          const blockEnd = new Date(block.end_date).toISOString().split('T')[0];
          
          const stillInFeed = icalRanges.some(r => r.start === blockStart && r.end === blockEnd);
          if (!stillInFeed) {
            await deleteDateBlock(block.id);
            removedCount++;
            console.log(`[CRON] Removed cancelled ${source.toUpperCase()} block: ${blockStart} to ${blockEnd}`);
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
                reason: `${source.charAt(0).toUpperCase() + source.slice(1)}: ${booking.summary}`
              });
              syncedCount++;
            } catch (error) {
              console.error(`[CRON] Error creating ${source} block:`, error);
            }
          }
        }
        
        totalSynced += syncedCount;
        console.log(`[CRON] ${source.toUpperCase()}: Added ${syncedCount} new, removed ${removedCount} cancelled blocks`);

        // Update sync record
        await updateCalendarSync(source, icalUrl, 'success', syncedCount);
        
        results.push({ 
          source, 
          status: 'success', 
          bookingsSynced: syncedCount,
          bookingsRemoved: removedCount,
          message: `Added ${syncedCount}, removed ${removedCount} bookings`
        });

      } catch (error) {
        console.error(`[CRON] Error syncing ${source.toUpperCase()}:`, error);
        results.push({ 
          source, 
          status: 'error', 
          message: error instanceof Error ? error.message : String(error)
        });
        
        // Update sync status to failure
        try {
          const lastSync = await getLastCalendarSync(source);
          if (lastSync?.ical_url) {
            await updateCalendarSync(source, lastSync.ical_url, 'failure', 0);
          }
        } catch (updateError) {
          console.error(`[CRON] Failed to update ${source} sync status:`, updateError);
        }
      }
    }

    // Revalidate the availability cache
    revalidatePath('/api/availability', 'page');
    
    console.log(`[CRON] Sync completed. Total bookings synced: ${totalSynced}`);
    console.log(`[CRON] Cache revalidated for availability API`);

    return NextResponse.json({
      success: true,
      message: `Daily sync completed. Total: ${totalSynced} bookings`,
      results,
      totalSynced,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[CRON] Error in daily sync:', error);

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to sync calendars', 
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

