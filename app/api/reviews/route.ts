import { NextRequest, NextResponse } from 'next/server';
import { getAllReviews } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Public endpoint to fetch reviews for the website
export async function GET(request: NextRequest) {
  try {
    const reviews = await getAllReviews();
    
    return NextResponse.json({
      success: true,
      reviews
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch reviews',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

