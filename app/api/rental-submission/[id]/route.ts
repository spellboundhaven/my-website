import { NextRequest, NextResponse } from 'next/server';
import { getRentalSubmissionByViewToken, getRentalAgreement, initDatabase } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initDatabase();
    const { id } = await params;
    const submission = await getRentalSubmissionByViewToken(id);

    if (!submission) {
      return NextResponse.json(
        { error: 'Rental submission not found' },
        { status: 404 }
      );
    }

    // Fetch the associated agreement
    const agreement = await getRentalAgreement(submission.agreement_id);

    if (!agreement) {
      return NextResponse.json(
        { error: 'Associated rental agreement not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      submission,
      agreement,
    });
  } catch (error) {
    console.error('Error fetching rental submission:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rental submission' },
      { status: 500 }
    );
  }
}

