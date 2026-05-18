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
    SELECT start_date, end_date, reason, revenue
    FROM date_blocks
    WHERE end_date > ${yearStart}
      AND start_date < ${yearEnd}
      AND reason NOT ILIKE '%not available%'
      AND reason NOT ILIKE '%blocked%'
      AND reason NOT ILIKE '%maintenance%'
    ORDER BY start_date ASC
  `;

  const blocks = result.rows;

  function classifySource(reason: string): 'airbnb' | 'vrbo' | 'direct' {
    const r = reason.toLowerCase();
    if (r.startsWith('airbnb')) return 'airbnb';
    if (r.startsWith('vrbo')) return 'vrbo';
    return 'direct';
  }

  const monthlyData = [];
  const today = new Date();

  const sourceTotals = { airbnb: 0, vrbo: 0, direct: 0 };
  const sourceBookings = { airbnb: 0, vrbo: 0, direct: 0 };
  const sourceRevenue = { airbnb: 0, vrbo: 0, direct: 0 };

  const countedBookings = new Set<string>();

  for (let month = 1; month <= 12; month++) {
    const daysInMonth = getDaysInMonth(year, month);
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 1);

    let occupiedDays = 0;
    let monthRevenue = 0;
    const monthSources = { airbnb: 0, vrbo: 0, direct: 0 };

    for (const block of blocks) {
      const blockStart = new Date(block.start_date);
      const blockEnd = new Date(block.end_date);
      const days = countOccupiedDays(blockStart, blockEnd, monthStart, monthEnd);
      if (days > 0) {
        const source = classifySource(block.reason);
        monthSources[source] += days;
        occupiedDays += days;

        const blockKey = `${block.start_date}-${block.end_date}-${block.reason}`;
        if (!countedBookings.has(blockKey)) {
          countedBookings.add(blockKey);
          sourceBookings[source]++;
          const rev = parseFloat(block.revenue) || 0;
          sourceRevenue[source] += rev;
        }

        // Apportion revenue to this month based on nights overlap
        const totalBlockDays = countOccupiedDays(blockStart, blockEnd, blockStart, blockEnd);
        if (totalBlockDays > 0) {
          const rev = parseFloat(block.revenue) || 0;
          monthRevenue += (rev / totalBlockDays) * days;
        }
      }
    }

    occupiedDays = Math.min(occupiedDays, daysInMonth);

    sourceTotals.airbnb += monthSources.airbnb;
    sourceTotals.vrbo += monthSources.vrbo;
    sourceTotals.direct += monthSources.direct;

    const isFutureMonth = year > today.getFullYear() ||
      (year === today.getFullYear() && month > today.getMonth() + 1);

    monthlyData.push({
      month,
      monthName: new Date(year, month - 1).toLocaleString('en-US', { month: 'short' }),
      daysInMonth,
      occupiedDays,
      occupancyRate: Math.round((occupiedDays / daysInMonth) * 100),
      isFuture: isFutureMonth,
      airbnb: monthSources.airbnb,
      vrbo: monthSources.vrbo,
      direct: monthSources.direct,
      revenue: Math.round(monthRevenue * 100) / 100,
    });
  }

  const totalDays = monthlyData.reduce((sum, m) => sum + m.daysInMonth, 0);
  const totalOccupied = monthlyData.reduce((sum, m) => sum + m.occupiedDays, 0);

  // Calculate remaining open nights from today through end of year
  let remainingDays = 0;
  let remainingBooked = 0;
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  if (year === today.getFullYear()) {
    const yearEndDate = new Date(year, 11, 31);
    remainingDays = Math.ceil((yearEndDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));

    for (const block of blocks) {
      const blockStart = new Date(block.start_date);
      const blockEnd = new Date(block.end_date);
      remainingBooked += countOccupiedDays(blockStart, blockEnd, todayDate, new Date(year + 1, 0, 1));
    }
    remainingBooked = Math.min(remainingBooked, remainingDays);
  } else if (year > today.getFullYear()) {
    remainingDays = totalDays;
    remainingBooked = totalOccupied;
  }

  const remainingOpenNights = Math.max(0, remainingDays - remainingBooked);

  return NextResponse.json({
    year,
    months: monthlyData,
    yearlyOccupancyRate: Math.round((totalOccupied / totalDays) * 100),
    totalOccupiedDays: totalOccupied,
    totalDays,
    remainingOpenNights,
    remainingDays,
    bySource: {
      nights: sourceTotals,
      bookings: sourceBookings,
      revenue: sourceRevenue,
    },
    totalRevenue: sourceRevenue.airbnb + sourceRevenue.vrbo + sourceRevenue.direct,
  });
}
