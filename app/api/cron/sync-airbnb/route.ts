import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import ical from 'node-ical';
import { createDateBlock, getLastAirbnbSync, updateAirbnbSync, deleteAllAirbnbBlocks } from '@/lib/db';

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

    console.log('[CRON] Starting daily Airbnb calendar sync...');

    // Get the last saved iCal URL
    const lastSync = await getLastAirbnbSync();
    
    if (!lastSync || !lastSync.ical_url) {
      console.log('[CRON] No Airbnb iCal URL configured');
      return NextResponse.json({
        success: false,
        message: 'No Airbnb iCal URL configured'
      });
    }

    const icalUrl = lastSync.ical_url;
    console.log(`[CRON] Syncing from: ${icalUrl}`);

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

    console.log(`[CRON] Found ${bookedDates.length} bookings in Airbnb calendar`);

    // Clear all existing Airbnb blocks before syncing (prevents duplicates)
    const deletedCount = await deleteAllAirbnbBlocks();
    console.log(`[CRON] Cleared ${deletedCount} old Airbnb blocks`);

    // Create new blocks for each booked date range
    for (const booking of bookedDates) {
      await createDateBlock({
        start_date: booking.start,
        end_date: booking.end,
        reason: `Airbnb: ${booking.summary}`
      });
    }
    
    console.log(`[CRON] Created ${bookedDates.length} new Airbnb blocks`);

    // Update sync record
    await updateAirbnbSync(icalUrl, 'success');

    // Revalidate the availability cache to show updated data immediately
    revalidatePath('/api/availability', 'page');
    
    console.log(`[CRON] Sync completed. Blocks synced: ${bookedDates.length}`);
    console.log(`[CRON] Cache revalidated for availability API`);

    return NextResponse.json({
      success: true,
      message: `Synced ${bookedDates.length} Airbnb bookings`,
      blocksDeleted: deletedCount,
      blocksCreated: bookedDates.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[CRON] Error syncing Airbnb calendar:', error);
    
    // Try to update sync status to failure
    try {
      const lastSync = await getLastAirbnbSync();
      if (lastSync?.ical_url) {
        await updateAirbnbSync(lastSync.ical_url, 'failure');
      }
    } catch (updateError) {
      console.error('[CRON] Failed to update sync status:', updateError);
    }

    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to sync Airbnb calendar', 
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

