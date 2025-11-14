import { NextRequest, NextResponse } from 'next/server';
import { 
  cleanupPastDateBlocks, 
  removeDuplicateDateBlocks,
  deleteAllAirbnbBlocks 
} from '@/lib/db';

export const dynamic = 'force-dynamic';

function verifyAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';
  
  if (!authHeader || authHeader !== `Bearer ${adminPassword}`) {
    return false;
  }
  
  return true;
}

export async function POST(request: NextRequest) {
  if (!verifyAuth(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'remove-duplicates') {
      const count = await removeDuplicateDateBlocks();
      return NextResponse.json({
        success: true,
        message: `Removed ${count} duplicate date blocks`,
        count
      });
    }

    if (action === 'cleanup-past') {
      const count = await cleanupPastDateBlocks();
      return NextResponse.json({
        success: true,
        message: `Cleaned up ${count} past date blocks`,
        count
      });
    }

    if (action === 'clear-airbnb') {
      const count = await deleteAllAirbnbBlocks();
      return NextResponse.json({
        success: true,
        message: `Cleared ${count} Airbnb blocks`,
        count
      });
    }

    if (action === 'full-cleanup') {
      const duplicates = await removeDuplicateDateBlocks();
      const past = await cleanupPastDateBlocks();
      
      return NextResponse.json({
        success: true,
        message: `Full cleanup complete: ${duplicates} duplicates + ${past} past blocks removed`,
        duplicates,
        past,
        total: duplicates + past
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error cleaning up date blocks:', error);
    return NextResponse.json(
      { 
        error: 'Failed to cleanup date blocks',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

