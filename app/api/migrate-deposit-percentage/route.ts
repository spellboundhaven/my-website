import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const password = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';

    if (!authHeader || authHeader !== `Bearer ${password}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if column exists
    const columnCheck = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'invoices' AND column_name = 'initial_deposit_percentage';
    `;

    if (columnCheck.rowCount === 0) {
      // Add the column if it doesn't exist
      await sql`
        ALTER TABLE invoices
        ADD COLUMN initial_deposit_percentage INTEGER DEFAULT 30;
      `;
      return NextResponse.json({ 
        success: true, 
        message: 'Successfully added initial_deposit_percentage column to invoices table! Default is 30%.' 
      });
    } else {
      return NextResponse.json({ 
        success: true, 
        message: 'initial_deposit_percentage column already exists.' 
      });
    }
  } catch (error) {
    console.error('Error migrating initial_deposit_percentage column:', error);
    return NextResponse.json(
      { 
        error: 'Failed to migrate initial_deposit_percentage column', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

