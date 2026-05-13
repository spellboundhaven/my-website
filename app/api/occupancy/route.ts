import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

function verifyAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';
  return authHeader === `Bearer ${adminPassword}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function countOccupiedDays(
  blockStart: Date,
  blockEnd: Date,
  monthStart: Date,
  monthEnd: Date
): number {
  const overlapStart = blockStart > monthStart ? blockStart : monthStart;
  const overlapEnd = blockEnd < monthEnd ? blockEnd : monthEnd;

  if (overlapStart >= overlapEnd) return 0;

  const diffMs = overlapEnd.getTime() - overlapStart.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export async function GET(request: NextRequest) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

  const yearStart = `${year}-01-01`;
  const yearEnd = `${year + 1}-01-01`;

  const result = await sql`
    SELECT start_date, end_date, reason
    FROM date_blocks
    WHERE end_date > ${yearStart}
      AND start_date < ${yearEnd}
      AND reason NOT ILIKE '%not available%'
      AND reason NOT ILIKE '%blocked%'
      AND reason NOT ILIKE '%maintenance%'
    ORDER BY start_date ASC
  `;

  const blocks = result.rows;

  const monthlyData = [];
  const today = new Date();

  for (let month = 1; month <= 12; month++) {
    const daysInMonth = getDaysInMonth(year, month);
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 1);

    let occupiedDays = 0;

    for (const block of blocks) {
      const blockStart = new Date(block.start_date);
      const blockEnd = new Date(block.end_date);
      occupiedDays += countOccupiedDays(blockStart, blockEnd, monthStart, monthEnd);
    }

    occupiedDays = Math.min(occupiedDays, daysInMonth);

    const isFutureMonth = year > today.getFullYear() ||
      (year === today.getFullYear() && month > today.getMonth() + 1);

    monthlyData.push({
      month,
      monthName: new Date(year, month - 1).toLocaleString('en-US', { month: 'short' }),
      daysInMonth,
      occupiedDays,
      occupancyRate: Math.round((occupiedDays / daysInMonth) * 100),
      isFuture: isFutureMonth,
    });
  }

  const totalDays = monthlyData.reduce((sum, m) => sum + m.daysInMonth, 0);
  const totalOccupied = monthlyData.reduce((sum, m) => sum + m.occupiedDays, 0);

  return NextResponse.json({
    year,
    months: monthlyData,
    yearlyOccupancyRate: Math.round((totalOccupied / totalDays) * 100),
    totalOccupiedDays: totalOccupied,
    totalDays,
  });
}
