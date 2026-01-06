import { sql } from '@vercel/postgres';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function cleanupDuplicateBlocks() {
  try {
    console.log('🧹 Starting duplicate date blocks cleanup...\n');

    // Find duplicate blocks (same date range, different reasons)
    const duplicates = await sql`
      SELECT start_date, end_date, COUNT(*) as count, 
             ARRAY_AGG(id) as ids, 
             ARRAY_AGG(reason) as reasons
      FROM date_blocks
      GROUP BY start_date, end_date
      HAVING COUNT(*) > 1
      ORDER BY start_date
    `;

    if (duplicates.rows.length === 0) {
      console.log('✅ No duplicate blocks found! Your calendar is clean.');
      process.exit(0);
    }

    console.log(`Found ${duplicates.rows.length} sets of duplicate blocks:\n`);

    let totalDeleted = 0;

    for (const dup of duplicates.rows) {
      const ids = dup.ids as number[];
      const reasons = dup.reasons as string[];
      
      console.log(`📅 ${dup.start_date} to ${dup.end_date}`);
      console.log(`   Found ${dup.count} blocks:`);
      reasons.forEach((reason, idx) => {
        console.log(`   - [${ids[idx]}] ${reason}`);
      });

      // Keep the first one, delete the rest
      const toDelete = ids.slice(1);
      
      if (toDelete.length > 0) {
        // Delete each duplicate individually
        for (const id of toDelete) {
          await sql`DELETE FROM date_blocks WHERE id = ${id}`;
        }
        
        console.log(`   ✅ Kept block [${ids[0]}], deleted ${toDelete.length} duplicate(s)\n`);
        totalDeleted += toDelete.length;
      }
    }

    console.log(`\n🎉 Cleanup complete!`);
    console.log(`   - Removed ${totalDeleted} duplicate blocks`);
    console.log(`   - Kept ${duplicates.rows.length} unique date ranges`);

    // Show summary of remaining blocks
    const summary = await sql`
      SELECT 
        CASE 
          WHEN reason LIKE 'Airbnb%' THEN 'Airbnb'
          WHEN reason LIKE 'Vrbo%' THEN 'VRBO'
          ELSE 'Other'
        END as source,
        COUNT(*) as count
      FROM date_blocks
      GROUP BY source
      ORDER BY count DESC
    `;

    console.log(`\n📊 Current blocks by source:`);
    summary.rows.forEach(row => {
      console.log(`   ${row.source}: ${row.count} blocks`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error cleaning up duplicates:', error);
    process.exit(1);
  }
}

cleanupDuplicateBlocks();

