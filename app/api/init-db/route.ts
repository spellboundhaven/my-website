import { NextRequest, NextResponse } from 'next/server';
import { initDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Simple password protection
    const authHeader = request.headers.get('authorization');
    const password = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';
    
    if (authHeader !== `Bearer ${password}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🚀 Starting database initialization...');
    await initDatabase();
    
    return NextResponse.json({
      success: true,
      message: 'Database tables created successfully! ✅'
    });
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    return NextResponse.json(
      { 
        error: 'Failed to initialize database', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

