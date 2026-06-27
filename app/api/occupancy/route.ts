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
    SELECT start_date, end_date, reason, revenue, booking_date, season
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

  // Lead time analysis: days between booking_date and check-in (start_date)
  // for reservations whose check-in falls within the selected year.
  const leadTimes: number[] = [];
  const leadBySource: { airbnb: number[]; vrbo: number[]; direct: number[] } = {
    airbnb: [],
    vrbo: [],
    direct: [],
  };
  const leadBuckets = {
    '0-7': 0,
    '8-30': 0,
    '31-60': 0,
    '61-90': 0,
    '91-180': 0,
    '180+': 0,
  };
  const bucketKeys = ['0-7', '8-30', '31-60', '61-90', '91-180', '180+'] as const;
  type BucketKey = typeof bucketKeys[number];
  type SourceKey = 'airbnb' | 'vrbo' | 'direct';
  const emptyBuckets = (): Record<BucketKey, { nights: number; bookings: number; revenue: number }> => ({
    '0-7': { nights: 0, bookings: 0, revenue: 0 },
    '8-30': { nights: 0, bookings: 0, revenue: 0 },
    '31-60': { nights: 0, bookings: 0, revenue: 0 },
    '61-90': { nights: 0, bookings: 0, revenue: 0 },
    '91-180': { nights: 0, bookings: 0, revenue: 0 },
    '180+': { nights: 0, bookings: 0, revenue: 0 },
  });
  const bucketStatsBySource: Record<SourceKey, ReturnType<typeof emptyBuckets>> = {
    airbnb: emptyBuckets(),
    vrbo: emptyBuckets(),
    direct: emptyBuckets(),
  };
  let bookingsInYear = 0;
  let bookingsWithDate = 0;

  // Per-booking points for the Lead Time vs ADR scatter plot
  const scatter: {
    lead: number;
    adr: number;
    source: SourceKey;
    los: number;
    revenue: number;
    month: number;
  }[] = [];

  // Lead times grouped by arrival month for the monthly table
  const monthLeadTimes: Record<number, number[]> = {};
  for (let m = 1; m <= 12; m++) monthLeadTimes[m] = [];

  // Season x lead time bucket counts for the booking-pace heatmap
  const seasonKeys = ['peak', 'high', 'shoulder', 'low'] as const;
  type SeasonKey = typeof seasonKeys[number];
  const heatmapCounts: Record<SeasonKey, Record<BucketKey, number>> = {
    peak: { '0-7': 0, '8-30': 0, '31-60': 0, '61-90': 0, '91-180': 0, '180+': 0 },
    high: { '0-7': 0, '8-30': 0, '31-60': 0, '61-90': 0, '91-180': 0, '180+': 0 },
    shoulder: { '0-7': 0, '8-30': 0, '31-60': 0, '61-90': 0, '91-180': 0, '180+': 0 },
    low: { '0-7': 0, '8-30': 0, '31-60': 0, '61-90': 0, '91-180': 0, '180+': 0 },
  };
  const normalizeSeason = (s: any): SeasonKey | null => {
    const v = String(s || '').toLowerCase();
    return (seasonKeys as readonly string[]).includes(v) ? (v as SeasonKey) : null;
  };

  // Per-season aggregation of nights/revenue by channel x lead time bucket,
  // used to find each season's highest-ADR combo (MVP).
  const mvpAgg = new Map<string, { nights: number; revenue: number }>();

  const toDateOnly = (value: any): Date => {
    if (value instanceof Date) {
      return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
    }
    const str = String(value).split('T')[0];
    const [y, m, d] = str.split('-').map(Number);
    return new Date(Date.UTC(y, (m || 1) - 1, d || 1));
  };

  const bucketFor = (lead: number): BucketKey => {
    if (lead <= 7) return '0-7';
    if (lead <= 30) return '8-30';
    if (lead <= 60) return '31-60';
    if (lead <= 90) return '61-90';
    if (lead <= 180) return '91-180';
    return '180+';
  };

  for (const block of blocks) {
    const checkIn = toDateOnly(block.start_date);
    const startYear = checkIn.getUTCFullYear();
    if (startYear !== year) continue;

    bookingsInYear++;
    if (!block.booking_date) continue;

    const booked = toDateOnly(block.booking_date);
    const lead = Math.round((checkIn.getTime() - booked.getTime()) / (1000 * 60 * 60 * 24));
    if (isNaN(lead) || lead < 0) continue;

    bookingsWithDate++;
    leadTimes.push(lead);
    const source = classifySource(block.reason);
    leadBySource[source].push(lead);

    const bucket = bucketFor(lead);
    leadBuckets[bucket]++;

    const blockEnd = toDateOnly(block.end_date);
    const nights = Math.max(0, Math.round((blockEnd.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
    const revenue = parseFloat(block.revenue) || 0;
    bucketStatsBySource[source][bucket].nights += nights;
    bucketStatsBySource[source][bucket].bookings += 1;
    bucketStatsBySource[source][bucket].revenue += revenue;

    const arrivalMonth = checkIn.getUTCMonth() + 1;
    monthLeadTimes[arrivalMonth].push(lead);
    const seasonKey = normalizeSeason(block.season);
    if (seasonKey) {
      heatmapCounts[seasonKey][bucket] += 1;
      if (nights > 0 && revenue > 0) {
        const mk = `${seasonKey}|${source}|${bucket}`;
        const cur = mvpAgg.get(mk) || { nights: 0, revenue: 0 };
        cur.nights += nights;
        cur.revenue += revenue;
        mvpAgg.set(mk, cur);
      }
    }

    if (nights > 0 && revenue > 0) {
      scatter.push({
        lead,
        adr: Math.round(revenue / nights),
        source,
        los: nights,
        revenue: Math.round(revenue),
        month: arrivalMonth,
      });
    }
  }

  const heatmapMaxCount = Math.max(
    1,
    ...seasonKeys.flatMap((s) => bucketKeys.map((k) => heatmapCounts[s][k]))
  );
  const seasonLabels: Record<SeasonKey, string> = {
    peak: 'Peak', high: 'High', shoulder: 'Shoulder', low: 'Low',
  };
  type MvpEntry = { adr: number; source: SourceKey; bucket: BucketKey; nights: number; revenue: number };
  const mvpBySeason: Record<SeasonKey, MvpEntry | null> = {
    peak: null, high: null, shoulder: null, low: null,
  };
  for (const [key, v] of Array.from(mvpAgg.entries())) {
    if (v.nights <= 0) continue;
    const [s, src, b] = key.split('|') as [SeasonKey, SourceKey, BucketKey];
    const adr = Math.round(v.revenue / v.nights);
    if (adr <= 0) continue;
    const existing = mvpBySeason[s];
    if (!existing || adr > existing.adr) {
      mvpBySeason[s] = { adr, source: src, bucket: b, nights: v.nights, revenue: Math.round(v.revenue) };
    }
  }

  const heatmap = {
    buckets: bucketKeys as unknown as string[],
    maxCount: heatmapMaxCount,
    rows: seasonKeys.map((s) => {
      const counts = bucketKeys.map((k) => heatmapCounts[s][k]);
      return {
        season: s,
        seasonName: seasonLabels[s],
        counts,
        total: counts.reduce((sum, n) => sum + n, 0),
      };
    }),
  };

  const buildBreakdown = (src: SourceKey) =>
    bucketKeys.map((k) => {
      const s = bucketStatsBySource[src][k];
      return {
        bucket: k,
        nights: s.nights,
        bookings: s.bookings,
        revenue: Math.round(s.revenue * 100) / 100,
        avgLOS: s.bookings > 0 ? Math.round((s.nights / s.bookings) * 10) / 10 : 0,
        adr: s.nights > 0 ? Math.round(s.revenue / s.nights) : 0,
      };
    });
  const bucketBreakdownBySource = {
    airbnb: buildBreakdown('airbnb'),
    vrbo: buildBreakdown('vrbo'),
    direct: buildBreakdown('direct'),
  };

  const average = (arr: number[]) =>
    arr.length > 0 ? Math.round(arr.reduce((s, n) => s + n, 0) / arr.length) : 0;
  const median = (arr: number[]) => {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0
      ? sorted[mid]
      : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  };

  for (const m of monthlyData) {
    const arr = monthLeadTimes[m.month] || [];
    (m as typeof m & { avgLeadTime: number | null }).avgLeadTime =
      arr.length > 0 ? average(arr) : null;
  }

  const leadTime = {
    count: bookingsWithDate,
    bookingsInYear,
    coverage: bookingsInYear > 0 ? Math.round((bookingsWithDate / bookingsInYear) * 100) : 0,
    average: average(leadTimes),
    median: median(leadTimes),
    min: leadTimes.length > 0 ? Math.min(...leadTimes) : 0,
    max: leadTimes.length > 0 ? Math.max(...leadTimes) : 0,
    buckets: leadBuckets,
    bucketBreakdownBySource,
    scatter,
    heatmap,
    mvpBySeason,
    bySource: {
      airbnb: { count: leadBySource.airbnb.length, average: average(leadBySource.airbnb) },
      vrbo: { count: leadBySource.vrbo.length, average: average(leadBySource.vrbo) },
      direct: { count: leadBySource.direct.length, average: average(leadBySource.direct) },
    },
  };

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
    leadTime,
  });
}
