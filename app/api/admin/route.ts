import { NextRequest, NextResponse } from 'next/server';
import {
  getAllBookings,
  getAllDateBlocks,
  createDateBlock,
  deleteDateBlock,
  getAllPricingRules,
  createPricingRule,
  deletePricingRule,
  updateBooking,
  deleteBooking
} from '@/lib/db';

function verifyAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  
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
    const searchParams = request.nextUrl.searchParams;
    const resource = searchParams.get('resource');

    if (resource === 'bookings') {
      const bookings = await getAllBookings();
      return NextResponse.json({ success: true, bookings });
    }

    if (resource === 'blocks') {
      const blocks = await getAllDateBlocks();
      return NextResponse.json({ success: true, blocks });
    }

    if (resource === 'pricing') {
      const rules = await getAllPricingRules();
      return NextResponse.json({ success: true, rules });
    }

    // Return all data for dashboard
    const [bookings, blocks, rules] = await Promise.all([
      getAllBookings(),
      getAllDateBlocks(),
      getAllPricingRules()
    ]);

    return NextResponse.json({
      success: true,
      bookings,
      blocks,
      rules
    });
  } catch (error) {
    console.error('Error fetching admin data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
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
    const { action, data } = body;

    if (action === 'createBlock') {
      const block = await createDateBlock(data);
      return NextResponse.json({ success: true, block });
    }

    if (action === 'deleteBlock') {
      const success = await deleteDateBlock(data.id);
      return NextResponse.json({ success });
    }

    if (action === 'createPricing') {
      const rule = await createPricingRule(data);
      return NextResponse.json({ success: true, rule });
    }

    if (action === 'deletePricing') {
      const success = await deletePricingRule(data.id);
      return NextResponse.json({ success });
    }

    if (action === 'updateBooking') {
      const booking = await updateBooking(data.id, data.updates);
      return NextResponse.json({ success: true, booking });
    }

    if (action === 'deleteBooking') {
      const success = await deleteBooking(data.id);
      return NextResponse.json({ success });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error performing admin action:', error);
    return NextResponse.json(
      { error: 'Failed to perform action' },
      { status: 500 }
    );
  }
}

