import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createRentalAgreement, getAllRentalAgreements, deleteRentalAgreement, initDatabase } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Initialize database tables if they don't exist
    await initDatabase();
    
    const body = await request.json();
    const { property_name, property_address, check_in_date, check_out_date, rental_terms, total_amount, host_email, logo, expires_in_days } = body;

    if (!property_name || !property_address || !check_in_date || !check_out_date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const id = uuidv4();
    let link_expires_at;
    if (expires_in_days) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + parseInt(expires_in_days));
      link_expires_at = expiryDate.toISOString();
    }

    const agreement = await createRentalAgreement({
      id,
      property_name,
      property_address,
      check_in_date,
      check_out_date,
      rental_terms: rental_terms || '',
      total_amount: total_amount || undefined,
      host_email: host_email || undefined,
      logo: logo || undefined,
      created_at: new Date().toISOString(),
      link_expires_at,
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    const agreementLink = `${baseUrl}/rental-agreement/${id}`;

    return NextResponse.json({
      success: true,
      agreement,
      link: agreementLink,
    });
  } catch (error) {
    console.error('Error creating rental agreement:', error);
    return NextResponse.json(
      { error: 'Failed to create rental agreement' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await initDatabase();
    const agreements = await getAllRentalAgreements();
    return NextResponse.json({ agreements });
  } catch (error) {
    console.error('Error fetching rental agreements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rental agreements' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await initDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Agreement ID is required' },
        { status: 400 }
      );
    }

    const success = await deleteRentalAgreement(id);
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Rental agreement deleted successfully',
      });
    } else {
      return NextResponse.json(
        { error: 'Rental agreement not found' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error deleting rental agreement:', error);
    return NextResponse.json(
      { error: 'Failed to delete rental agreement' },
      { status: 500 }
    );
  }
}

