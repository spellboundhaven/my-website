import { sql } from '@vercel/postgres';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function addTotalAmountColumn() {
  try {
    console.log('Adding total_amount column to rental_agreements table...');
    
    await sql`
      ALTER TABLE rental_agreements 
      ADD COLUMN IF NOT EXISTS total_amount TEXT
    `;
    
    console.log('✓ Successfully added total_amount column');
    
    // Verify the column was added
    const result = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'rental_agreements' 
      AND column_name = 'total_amount'
    `;
    
    if (result.rows.length > 0) {
      console.log('✓ Column verified in database schema');
    } else {
      console.log('⚠ Column may already exist or there was an issue');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error adding column:', error);
    process.exit(1);
  }
}

addTotalAmountColumn();

