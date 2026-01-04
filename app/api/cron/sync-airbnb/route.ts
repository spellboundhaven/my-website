import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import ical from 'node-ical';
import { createDateBlock, getLastCalendarSync, updateCalendarSync, deleteAllAirbnbBlocks, getAllDateBlocks } from '@/lib/db';

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
        
        // Get existing blocks to avoid duplicates
        const existingBlocks = await getAllDateBlocks();
        const existingRanges = new Set(
          existingBlocks
            .filter((block: any) => block.reason.toLowerCase().includes(source))
            .map((block: any) => `${block.start_date}_${block.end_date}`)
        );
        
        // Extract booked dates from iCal
        const bookedDates: { start: string; end: string; summary: string }[] = [];
        
        for (const event of Object.values(events)) {
          if (event.type === 'VEVENT' && event.start && event.end) {
            const start = new Date(event.start);
            const end = new Date(event.end);
            
            const startStr = start.toISOString().split('T')[0];
            const endStr = end.toISOString().split('T')[0];
            const rangeKey = `${startStr}_${endStr}`;
            
            if (!existingRanges.has(rangeKey)) {
              bookedDates.push({
                start: startStr,
                end: endStr,
                summary: event.summary || `${source} Booking`
              });
            }
          }
        }

        console.log(`[CRON] Found ${bookedDates.length} new ${source.toUpperCase()} bookings`);

        // Create new blocks for each booked date range
        let syncedCount = 0;
        for (const booking of bookedDates) {
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
        
        totalSynced += syncedCount;
        console.log(`[CRON] Created ${syncedCount} new ${source.toUpperCase()} blocks`);

        // Update sync record
        await updateCalendarSync(source, icalUrl, 'success', syncedCount);
        
        results.push({ 
          source, 
          status: 'success', 
          bookingsSynced: syncedCount,
          message: `Synced ${syncedCount} bookings`
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

