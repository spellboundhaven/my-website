import { NextRequest, NextResponse } from 'next/server';
import { getAllDateBlocks } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const blocks = await getAllDateBlocks();
    
    return NextResponse.json({
      success: true,
      count: blocks.length,
      blocks: blocks.slice(0, 20) // First 20 blocks for debugging
    });
  } catch (error) {
    console.error('Error fetching blocks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blocks', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

