import { NextRequest, NextResponse } from 'next/server';
import { getRentalAgreement, initDatabase } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await initDatabase();
    const agreement = await getRentalAgreement(params.id);

    if (!agreement) {
      return NextResponse.json(
        { error: 'Rental agreement not found' },
        { status: 404 }
      );
    }

    // Check if link has expired
    if (agreement.link_expires_at) {
      const expiryDate = new Date(agreement.link_expires_at);
      if (expiryDate < new Date()) {
        return NextResponse.json(
          { error: 'This rental agreement link has expired' },
          { status: 410 }
        );
      }
    }

    return NextResponse.json({ agreement });
  } catch (error) {
    console.error('Error fetching rental agreement:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rental agreement' },
      { status: 500 }
    );
  }
}

