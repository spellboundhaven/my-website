import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

function verifyAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';
  
  if (!authHeader || authHeader !== `Bearer ${adminPassword}`) {
    return false;
  }
  
  return true;
}

export async function GET(request: NextRequest) {
  if (!verifyAuth(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    // Add payment_status column if it doesn't exist
    await sql`
      ALTER TABLE invoices 
      ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid' 
      CHECK (payment_status IN ('unpaid', 'initial_deposit_paid', 'all_paid'))
    `;

    // Update any existing rows that might have NULL
    await sql`
      UPDATE invoices 
      SET payment_status = 'unpaid' 
      WHERE payment_status IS NULL
    `;

    return NextResponse.json({
      success: true,
      message: 'Successfully added payment_status column to invoices table!'
    });
  } catch (error) {
    console.error('Error adding payment_status column:', error);
    return NextResponse.json(
      { 
        error: 'Failed to add column',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

