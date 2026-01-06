import { sql } from '@vercel/postgres';

async function migrateAmountPaid() {
  try {
    console.log('Starting migration to add amount_paid column...');

    // Check if the column already exists
    const columnCheck = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'invoices' AND column_name = 'amount_paid';
    `;

    if (columnCheck.rowCount === 0) {
      // Add the amount_paid column if it doesn't exist
      await sql`
        ALTER TABLE invoices
        ADD COLUMN amount_paid DECIMAL(10, 2) DEFAULT 0;
      `;
      console.log('✅ Successfully added amount_paid column to invoices table!');
    } else {
      console.log('✅ amount_paid column already exists.');
    }

    // Update the payment_status check constraint to include 'partial_paid'
    console.log('Updating payment_status constraint...');
    
    // Drop the old constraint
    await sql`
      ALTER TABLE invoices
      DROP CONSTRAINT IF EXISTS invoices_payment_status_check;
    `;
    
    // Add the new constraint with 'partial_paid'
    await sql`
      ALTER TABLE invoices
      ADD CONSTRAINT invoices_payment_status_check 
      CHECK (payment_status IN ('unpaid', 'partial_paid', 'all_paid'));
    `;
    
    console.log('✅ Successfully updated payment_status constraint!');

    // Migrate existing data: convert 'initial_deposit_paid' to 'partial_paid'
    console.log('Migrating existing payment status values...');
    
    const updateResult = await sql`
      UPDATE invoices
      SET payment_status = 'partial_paid'
      WHERE payment_status = 'initial_deposit_paid';
    `;
    
    console.log(`✅ Updated ${updateResult.rowCount || 0} invoice(s) from 'initial_deposit_paid' to 'partial_paid'`);

    // Migrate amount_paid values from percentage for existing invoices
    console.log('Calculating amount_paid from initial_deposit_percentage for existing invoices...');
    
    const calculateResult = await sql`
      UPDATE invoices
      SET amount_paid = CASE
        WHEN payment_status = 'all_paid' THEN total_amount
        WHEN payment_status = 'partial_paid' AND initial_deposit_percentage IS NOT NULL 
          THEN total_amount * (initial_deposit_percentage / 100.0)
        ELSE 0
      END
      WHERE amount_paid = 0 OR amount_paid IS NULL;
    `;
    
    console.log(`✅ Calculated amount_paid for ${calculateResult.rowCount || 0} existing invoice(s)`);

    console.log('\n🎉 Migration completed successfully!');
    console.log('\nSummary:');
    console.log('- Added amount_paid column');
    console.log('- Updated payment_status constraint');
    console.log('- Migrated existing payment status values');
    console.log('- Calculated amount_paid from percentage for existing invoices');
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

migrateAmountPaid();

