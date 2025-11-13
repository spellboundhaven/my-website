import { sql } from '@vercel/postgres';

// Helper function to convert dates to EST timezone
function toESTDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  // Convert to EST (UTC-5) and format as YYYY-MM-DD
  const estDate = new Date(d.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  return estDate.toISOString().split('T')[0];
}

// Get current date in EST
function getCurrentESTDate(): string {
  return toESTDate(new Date());
}

export interface Booking {
  id?: number;
  check_in_date: string;
  check_out_date: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  guests_count: number;
  total_price: number;
  status: 'inquiry' | 'pending' | 'confirmed' | 'cancelled' | 'completed';
  payment_method?: 'manual' | 'airbnb';
  payment_status?: 'pending' | 'paid' | 'refunded';
  notes?: string;
  source?: 'website' | 'airbnb' | 'manual';
  created_at?: string;
}

export interface DateBlock {
  id?: number;
  start_date: string;
  end_date: string;
  reason: string;
  created_at?: string;
}

export interface PricingRule {
  id?: number;
  start_date: string;
  end_date: string;
  price_per_night: number;
  minimum_stay: number;
  rule_type: 'standard' | 'peak' | 'holiday';
  created_at?: string;
}

export interface AvailabilityDate {
  date: string;
  available: boolean;
  price: number;
  minimum_stay: number;
  reason?: string;
}

// Initialize database tables
export async function initDatabase() {
  try {
    // Create bookings table
    await sql`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        check_in_date DATE NOT NULL,
        check_out_date DATE NOT NULL,
        guest_name TEXT NOT NULL,
        guest_email TEXT NOT NULL,
        guest_phone TEXT NOT NULL,
        guests_count INTEGER NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        payment_method TEXT,
        payment_status TEXT DEFAULT 'pending',
        stripe_session_id TEXT,
        notes TEXT,
        source TEXT DEFAULT 'website',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create date_blocks table
    await sql`
      CREATE TABLE IF NOT EXISTS date_blocks (
        id SERIAL PRIMARY KEY,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        reason TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create pricing_rules table
    await sql`
      CREATE TABLE IF NOT EXISTS pricing_rules (
        id SERIAL PRIMARY KEY,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        price_per_night DECIMAL(10,2) NOT NULL,
        minimum_stay INTEGER DEFAULT 3,
        rule_type TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create airbnb_sync table for tracking last sync
    await sql`
      CREATE TABLE IF NOT EXISTS airbnb_sync (
        id SERIAL PRIMARY KEY,
        last_synced TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ical_url TEXT,
        sync_status TEXT DEFAULT 'success'
      )
    `;

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Booking operations
export async function createBooking(booking: Booking): Promise<Booking> {
  const result = await sql`
    INSERT INTO bookings (
      check_in_date, check_out_date, guest_name, guest_email, guest_phone,
      guests_count, total_price, status, payment_method, payment_status,
      notes, source, created_at
    )
    VALUES (
      ${booking.check_in_date},
      ${booking.check_out_date},
      ${booking.guest_name},
      ${booking.guest_email},
      ${booking.guest_phone},
      ${booking.guests_count},
      ${booking.total_price},
      ${booking.status},
      ${booking.payment_method || null},
      ${booking.payment_status || 'pending'},
      ${booking.notes || null},
      ${booking.source || 'website'},
      ${booking.created_at || new Date().toISOString()}
    )
    RETURNING *
  `;
  return result.rows[0] as Booking;
}

export async function getBooking(id: number): Promise<Booking | undefined> {
  const result = await sql`
    SELECT * FROM bookings WHERE id = ${id}
  `;
  return result.rows[0] as Booking | undefined;
}

export async function getAllBookings(): Promise<Booking[]> {
  const result = await sql`
    SELECT * FROM bookings ORDER BY check_in_date DESC
  `;
  return result.rows as Booking[];
}

export async function getUpcomingBookings(): Promise<Booking[]> {
  const today = getCurrentESTDate();
  const result = await sql`
    SELECT * FROM bookings 
    WHERE check_in_date >= ${today} 
    AND status IN ('confirmed', 'pending')
    ORDER BY check_in_date ASC
  `;
  return result.rows as Booking[];
}

export async function updateBooking(id: number, updates: Partial<Booking>): Promise<Booking | undefined> {
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined && key !== 'id') {
      fields.push(`${key} = $${paramCount}`);
      values.push(value);
      paramCount++;
    }
  });

  if (fields.length === 0) {
    return getBooking(id);
  }

  values.push(id);
  const query = `UPDATE bookings SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
  
  const result = await sql.query(query, values);
  return result.rows[0] as Booking | undefined;
}

export async function deleteBooking(id: number): Promise<boolean> {
  const result = await sql`
    DELETE FROM bookings WHERE id = ${id}
  `;
  return result.rowCount ? result.rowCount > 0 : false;
}

// Date block operations
export async function createDateBlock(block: DateBlock): Promise<DateBlock> {
  const result = await sql`
    INSERT INTO date_blocks (start_date, end_date, reason, created_at)
    VALUES (
      ${block.start_date},
      ${block.end_date},
      ${block.reason},
      ${block.created_at || new Date().toISOString()}
    )
    RETURNING *
  `;
  return result.rows[0] as DateBlock;
}

export async function getAllDateBlocks(): Promise<DateBlock[]> {
  const result = await sql`
    SELECT * FROM date_blocks ORDER BY start_date ASC
  `;
  return result.rows as DateBlock[];
}

export async function getActiveDateBlocks(): Promise<DateBlock[]> {
  const today = new Date().toISOString().split('T')[0];
  const result = await sql`
    SELECT * FROM date_blocks 
    WHERE end_date >= ${today}
    ORDER BY start_date ASC
  `;
  return result.rows as DateBlock[];
}

export async function deleteDateBlock(id: number): Promise<boolean> {
  const result = await sql`
    DELETE FROM date_blocks WHERE id = ${id}
  `;
  return result.rowCount ? result.rowCount > 0 : false;
}

// Pricing rule operations
export async function createPricingRule(rule: PricingRule): Promise<PricingRule> {
  const result = await sql`
    INSERT INTO pricing_rules (start_date, end_date, price_per_night, minimum_stay, rule_type, created_at)
    VALUES (
      ${rule.start_date},
      ${rule.end_date},
      ${rule.price_per_night},
      ${rule.minimum_stay},
      ${rule.rule_type},
      ${rule.created_at || new Date().toISOString()}
    )
    RETURNING *
  `;
  return result.rows[0] as PricingRule;
}

export async function getAllPricingRules(): Promise<PricingRule[]> {
  const result = await sql`
    SELECT * FROM pricing_rules ORDER BY start_date ASC
  `;
  return result.rows as PricingRule[];
}

export async function deletePricingRule(id: number): Promise<boolean> {
  const result = await sql`
    DELETE FROM pricing_rules WHERE id = ${id}
  `;
  return result.rowCount ? result.rowCount > 0 : false;
}

// Get pricing for a specific date
export async function getPriceForDate(date: string): Promise<number> {
  const result = await sql`
    SELECT price_per_night FROM pricing_rules
    WHERE start_date <= ${date} AND end_date >= ${date}
    ORDER BY 
      CASE rule_type
        WHEN 'holiday' THEN 1
        WHEN 'peak' THEN 2
        ELSE 3
      END
    LIMIT 1
  `;
  
  if (result.rows.length > 0) {
    return parseFloat(result.rows[0].price_per_night);
  }
  
  // Default price if no rule found
  return 450;
}

// Check if a date is available
export async function isDateAvailable(date: string): Promise<boolean> {
  // Check for bookings
  const bookingResult = await sql`
    SELECT COUNT(*) as count FROM bookings
    WHERE check_in_date <= ${date} 
    AND check_out_date > ${date}
    AND status IN ('confirmed', 'pending')
  `;
  
  if (parseInt(bookingResult.rows[0].count) > 0) {
    return false;
  }
  
  // Check for date blocks
  const blockResult = await sql`
    SELECT COUNT(*) as count FROM date_blocks
    WHERE start_date <= ${date} AND end_date >= ${date}
  `;
  
  return parseInt(blockResult.rows[0].count) === 0;
}

// Get availability for a date range
export async function getAvailabilityForRange(startDate: string, endDate: string): Promise<AvailabilityDate[]> {
  const availability: AvailabilityDate[] = [];
  
  // Get all bookings in range
  // Using >= for check_out_date to catch bookings ending on the first day of range
  const bookings = await sql`
    SELECT check_in_date, check_out_date FROM bookings
    WHERE status IN ('confirmed', 'pending', 'inquiry')
    AND check_in_date < ${endDate}
    AND check_out_date >= ${startDate}
  `;
  
  // Get all blocks in range
  // Note: We need >= to catch blocks that end exactly on the first day of the range
  // The per-date check (dateStr < blockEnd) will handle excluding checkout dates
  const blocks = await sql`
    SELECT start_date, end_date, reason FROM date_blocks
    WHERE start_date < ${endDate}
    AND end_date >= ${startDate}
  `;
  
  // Get all pricing rules
  const rules = await getAllPricingRules();
  
  // Generate availability for each date
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = toESTDate(d);
    
    // Check if date is booked
    const isBooked = bookings.rows.some((b: any) => {
      const checkIn = new Date(b.check_in_date).toISOString().split('T')[0];
      const checkOut = new Date(b.check_out_date).toISOString().split('T')[0];
      return dateStr >= checkIn && dateStr < checkOut;
    });
    
    // Check if date is blocked
    // Note: end_date is exclusive (checkout date), so we use < instead of <=
    const block = blocks.rows.find((bl: any) => {
      const blockStart = new Date(bl.start_date).toISOString().split('T')[0];
      const blockEnd = new Date(bl.end_date).toISOString().split('T')[0];
      return dateStr >= blockStart && dateStr < blockEnd;
    });
    
    // Get price for date
    const price = await getPriceForDate(dateStr);
    
    // Get minimum stay
    const rule = rules.find(r => dateStr >= r.start_date && dateStr <= r.end_date);
    const minimumStay = rule?.minimum_stay || 3;
    
    availability.push({
      date: dateStr,
      available: !isBooked && !block,
      price,
      minimum_stay: minimumStay,
      reason: block ? block.reason : undefined
    });
  }
  
  return availability;
}

// Airbnb sync operations
export async function updateAirbnbSync(icalUrl: string, status: string): Promise<void> {
  await sql`
    INSERT INTO airbnb_sync (ical_url, sync_status, last_synced)
    VALUES (${icalUrl}, ${status}, ${new Date().toISOString()})
  `;
}

export async function getLastAirbnbSync(): Promise<{ last_synced: string; ical_url: string } | null> {
  const result = await sql`
    SELECT last_synced, ical_url FROM airbnb_sync
    ORDER BY last_synced DESC
    LIMIT 1
  `;
  return (result.rows[0] as { last_synced: string; ical_url: string }) || null;
}

