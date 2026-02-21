import { sql } from '@vercel/postgres';
import { v4 as uuidv4 } from 'uuid';

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

export interface AvailabilityDate {
  date: string;
  available: boolean;
  reason?: string;
}

export interface Review {
  id?: number;
  name: string;
  rating: number;
  date: string;
  location?: string;
  comment: string;
  created_at?: string;
}

export interface Invoice {
  id?: number;
  invoice_number: string;
  booking_id?: number;
  guest_name: string;
  guest_email: string;
  check_in_date: string;
  check_out_date: string;
  accommodation_cost: number;
  cleaning_fee: number;
  tax_amount: number;
  additional_fees: number;
  additional_fees_description?: string;
  total_amount: number;
  payment_method: string;
  payment_status?: 'unpaid' | 'partial_paid' | 'all_paid';
  amount_paid?: number;
  initial_deposit_percentage?: number; // Deprecated, keeping for backward compatibility
  status: 'draft' | 'sent' | 'paid' | 'cancelled';
  notes?: string;
  sent_at?: string;
  created_at?: string;
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

    // Create calendar_sync table for tracking syncs from multiple sources
    await sql`
      CREATE TABLE IF NOT EXISTS calendar_sync (
        id SERIAL PRIMARY KEY,
        source TEXT NOT NULL,
        ical_url TEXT NOT NULL,
        last_synced TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        sync_status TEXT DEFAULT 'success',
        bookings_synced INTEGER DEFAULT 0
      )
    `;

    // Migrate data from old airbnb_sync table if it exists
    try {
      await sql`
        INSERT INTO calendar_sync (source, ical_url, last_synced, sync_status)
        SELECT 'airbnb' as source, ical_url, last_synced, sync_status
        FROM airbnb_sync
        WHERE NOT EXISTS (
          SELECT 1 FROM calendar_sync WHERE source = 'airbnb'
        )
        LIMIT 1
      `;
    } catch (migrateError) {
      // Migration might fail if airbnb_sync doesn't exist or calendar_sync already has data
      console.log('Note: Calendar sync migration skipped (may already be done)');
    }

    // Create reviews table
    await sql`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        date TEXT NOT NULL,
        location TEXT,
        comment TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create invoices table
    await sql`
      CREATE TABLE IF NOT EXISTS invoices (
        id SERIAL PRIMARY KEY,
        invoice_number TEXT UNIQUE NOT NULL,
        booking_id INTEGER REFERENCES bookings(id),
        guest_name TEXT NOT NULL,
        guest_email TEXT NOT NULL,
        check_in_date DATE NOT NULL,
        check_out_date DATE NOT NULL,
        accommodation_cost DECIMAL(10, 2) NOT NULL,
        cleaning_fee DECIMAL(10, 2) DEFAULT 0,
        tax_amount DECIMAL(10, 2) DEFAULT 0,
        additional_fees DECIMAL(10, 2) DEFAULT 0,
        additional_fees_description TEXT,
        total_amount DECIMAL(10, 2) NOT NULL,
        payment_method TEXT NOT NULL,
        payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial_paid', 'all_paid')),
        amount_paid DECIMAL(10, 2) DEFAULT 0,
        initial_deposit_percentage INTEGER DEFAULT 30,
        status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'cancelled')),
        notes TEXT,
        sent_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Initialize rental agreement tables
    await initRentalAgreementTables();

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

// Check if a date range overlaps with any existing blocks
export async function hasOverlappingDateBlock(startDate: string, endDate: string): Promise<boolean> {
  const result = await sql`
    SELECT EXISTS (
      SELECT 1 FROM date_blocks
      WHERE (
        -- New range starts before existing ends AND new range ends after existing starts
        (${startDate} < end_date AND ${endDate} > start_date)
      )
    ) as exists
  `;
  return result.rows[0]?.exists || false;
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

export async function deleteAllAirbnbBlocks(): Promise<number> {
  const result = await sql`
    DELETE FROM date_blocks WHERE reason LIKE 'Airbnb:%'
  `;
  return result.rowCount || 0;
}

export async function deleteBufferBlocks(): Promise<number> {
  const result = await sql`
    DELETE FROM date_blocks
    WHERE reason ILIKE '%not available%' OR reason ILIKE '%blocked%'
  `;
  return result.rowCount || 0;
}

export async function cleanupPastDateBlocks(): Promise<number> {
  const today = getCurrentESTDate();
  const result = await sql`
    DELETE FROM date_blocks WHERE end_date < ${today}
  `;
  return result.rowCount || 0;
}

export async function removeDuplicateDateBlocks(): Promise<number> {
  // Strategy: Find all overlapping blocks and keep only the oldest one from each group
  // This handles both exact duplicates AND overlapping date ranges
  
  console.log('[CLEANUP] Starting comprehensive duplicate block removal...');
  
  // Step 1: Find all overlapping block pairs
  const overlaps = await sql`
    SELECT 
      b1.id as id1,
      b2.id as id2,
      b1.start_date as start1,
      b1.end_date as end1,
      b2.start_date as start2,
      b2.end_date as end2,
      b1.created_at as created1,
      b2.created_at as created2
    FROM date_blocks b1
    JOIN date_blocks b2 ON b1.id < b2.id
    WHERE (
      -- Blocks overlap if start1 < end2 AND start2 < end1
      b1.start_date < b2.end_date AND b2.start_date < b1.end_date
    )
    ORDER BY b1.id, b2.id
  `;
  
  if (overlaps.rows.length === 0) {
    console.log('[CLEANUP] No overlapping blocks found');
    return 0;
  }
  
  console.log(`[CLEANUP] Found ${overlaps.rows.length} overlapping block pairs`);
  
  // Step 2: Build groups of overlapping blocks using union-find
  const parent = new Map<number, number>();
  const rank = new Map<number, number>();
  
  function find(x: number): number {
    if (!parent.has(x)) {
      parent.set(x, x);
      rank.set(x, 0);
      return x;
    }
    if (parent.get(x) !== x) {
      parent.set(x, find(parent.get(x)!));
    }
    return parent.get(x)!;
  }
  
  function union(x: number, y: number): void {
    const px = find(x);
    const py = find(y);
    if (px === py) return;
    
    const rx = rank.get(px) || 0;
    const ry = rank.get(py) || 0;
    
    if (rx < ry) {
      parent.set(px, py);
    } else if (rx > ry) {
      parent.set(py, px);
    } else {
      parent.set(py, px);
      rank.set(px, rx + 1);
    }
  }
  
  // Union all overlapping blocks
  for (const row of overlaps.rows) {
    union(row.id1, row.id2);
  }
  
  // Group blocks by their root parent
  const groups = new Map<number, number[]>();
  const allIds = new Set<number>();
  
  for (const row of overlaps.rows) {
    allIds.add(row.id1);
    allIds.add(row.id2);
  }
  
  // Convert Set to Array for iteration
  for (const id of Array.from(allIds)) {
    const root = find(id);
    if (!groups.has(root)) {
      groups.set(root, []);
    }
    groups.get(root)!.push(id);
  }
  
  console.log(`[CLEANUP] Found ${groups.size} groups of overlapping blocks`);
  
  // Step 3: For each group, keep the oldest and delete the rest
  let totalDeleted = 0;
  
  // Convert Map entries to Array for iteration
  for (const [root, ids] of Array.from(groups.entries())) {
    if (ids.length <= 1) continue;
    
    // Get full details for all blocks in this group
    // Use IN clause instead of ANY() for compatibility with Vercel Postgres
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(', ');
    const groupDetails = await sql.query(
      `SELECT id, start_date, end_date, reason, created_at
       FROM date_blocks
       WHERE id IN (${placeholders})
       ORDER BY created_at ASC, id ASC`,
      ids
    );
    
    // Keep the oldest (first created), delete the rest
    const toKeep = groupDetails.rows[0];
    const toDelete = groupDetails.rows.slice(1);
    
    console.log(`[CLEANUP] Group: Keeping block ${toKeep.id} (${toKeep.start_date} to ${toKeep.end_date}), deleting ${toDelete.length} duplicate(s)`);
    
    for (const block of toDelete) {
      await sql`DELETE FROM date_blocks WHERE id = ${block.id}`;
      totalDeleted++;
      console.log(`[CLEANUP]   Deleted block ${block.id}: ${block.start_date} to ${block.end_date} (${block.reason})`);
    }
  }
  
  console.log(`[CLEANUP] Cleanup complete. Deleted ${totalDeleted} overlapping/duplicate blocks`);
  return totalDeleted;
}

// Check if a date is available
export async function isDateAvailable(date: string): Promise<boolean> {
  // Check for bookings (only confirmed and pending, NOT inquiries)
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
  
  // Calculate the booking window limit (12 months from today)
  // Last available date = today + 12 months - 1 day
  // Example: Jan 1, 2025 → Dec 31, 2025 (not Jan 1, 2026)
  const today = new Date();
  const maxBookingDate = new Date(today);
  maxBookingDate.setMonth(maxBookingDate.getMonth() + 12);
  maxBookingDate.setDate(maxBookingDate.getDate() - 1); // Subtract 1 day
  const maxBookingDateStr = toESTDate(maxBookingDate);
  
  // Get all bookings in range
  // Using >= for check_out_date to catch bookings ending on the first day of range
  // Note: Only include confirmed and pending bookings, NOT inquiries
  const bookings = await sql`
    SELECT check_in_date, check_out_date FROM bookings
    WHERE status IN ('confirmed', 'pending')
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
  
  // Generate availability for each date
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = toESTDate(d);
    
    // Check if date is beyond 12-month booking window
    const isBeyondBookingWindow = dateStr > maxBookingDateStr;
    
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
    
    // Determine availability and reason
    let reason: string | undefined;
    if (isBeyondBookingWindow) {
      reason = 'Not available yet (beyond 12-month booking window)';
    } else if (block) {
      reason = block.reason;
    }
    
    availability.push({
      date: dateStr,
      available: !isBooked && !block && !isBeyondBookingWindow,
      reason: reason
    });
  }
  
  return availability;
}

// Calendar sync operations
export async function updateCalendarSync(source: string, icalUrl: string, status: string, bookingsSynced: number = 0): Promise<void> {
  await sql`
    INSERT INTO calendar_sync (source, ical_url, sync_status, last_synced, bookings_synced)
    VALUES (${source}, ${icalUrl}, ${status}, ${new Date().toISOString()}, ${bookingsSynced})
    ON CONFLICT (id) DO UPDATE
    SET ical_url = ${icalUrl},
        sync_status = ${status},
        last_synced = ${new Date().toISOString()},
        bookings_synced = ${bookingsSynced}
  `;
}

export async function getLastCalendarSync(source: string): Promise<{ last_synced: string; ical_url: string; bookings_synced: number } | null> {
  const result = await sql`
    SELECT last_synced, ical_url, bookings_synced 
    FROM calendar_sync
    WHERE source = ${source}
    ORDER BY last_synced DESC
    LIMIT 1
  `;
  return (result.rows[0] as { last_synced: string; ical_url: string; bookings_synced: number }) || null;
}

export async function getAllCalendarSyncs(): Promise<Array<{ source: string; last_synced: string; ical_url: string; sync_status: string; bookings_synced: number }>> {
  const result = await sql`
    SELECT source, last_synced, ical_url, sync_status, bookings_synced
    FROM calendar_sync
    ORDER BY source, last_synced DESC
  `;
  return result.rows as Array<{ source: string; last_synced: string; ical_url: string; sync_status: string; bookings_synced: number }>;
}

// Legacy support - keep these for backward compatibility
export async function updateAirbnbSync(icalUrl: string, status: string): Promise<void> {
  await updateCalendarSync('airbnb', icalUrl, status);
}

export async function getLastAirbnbSync(): Promise<{ last_synced: string; ical_url: string } | null> {
  const result = await getLastCalendarSync('airbnb');
  if (!result) return null;
  return { last_synced: result.last_synced, ical_url: result.ical_url };
}

// Review operations
export async function createReview(review: Review): Promise<Review> {
  const result = await sql`
    INSERT INTO reviews (name, rating, date, location, comment)
    VALUES (${review.name}, ${review.rating}, ${review.date}, ${review.location || null}, ${review.comment})
    RETURNING *
  `;
  return result.rows[0] as Review;
}

export async function getAllReviews(): Promise<Review[]> {
  const result = await sql`
    SELECT * FROM reviews
    ORDER BY TO_DATE(date, 'Month YYYY') DESC
  `;
  return result.rows as Review[];
}

export async function getReview(id: number): Promise<Review | null> {
  const result = await sql`
    SELECT * FROM reviews WHERE id = ${id}
  `;
  return (result.rows[0] as Review) || null;
}

export async function updateReview(id: number, updates: Partial<Review>): Promise<Review | null> {
  const fields = [];
  const values = [];
  
  if (updates.name !== undefined) {
    fields.push('name');
    values.push(updates.name);
  }
  if (updates.rating !== undefined) {
    fields.push('rating');
    values.push(updates.rating);
  }
  if (updates.date !== undefined) {
    fields.push('date');
    values.push(updates.date);
  }
  if (updates.location !== undefined) {
    fields.push('location');
    values.push(updates.location);
  }
  if (updates.comment !== undefined) {
    fields.push('comment');
    values.push(updates.comment);
  }
  
  if (fields.length === 0) return null;
  
  const setClause = fields.map((field, i) => `${field} = $${i + 2}`).join(', ');
  
  const result = await sql.query(
    `UPDATE reviews SET ${setClause} WHERE id = $1 RETURNING *`,
    [id, ...values]
  );
  
  return (result.rows[0] as Review) || null;
}

export async function deleteReview(id: number): Promise<boolean> {
  const result = await sql`
    DELETE FROM reviews WHERE id = ${id}
  `;
  return result.rowCount ? result.rowCount > 0 : false;
}

// Invoice functions
export async function createInvoice(invoice: Omit<Invoice, 'id' | 'created_at'>): Promise<Invoice> {
  const result = await sql`
    INSERT INTO invoices (
      invoice_number, booking_id, guest_name, guest_email,
      check_in_date, check_out_date, accommodation_cost,
      cleaning_fee, tax_amount, additional_fees, additional_fees_description,
      total_amount, payment_method, payment_status, amount_paid, initial_deposit_percentage, status, notes, sent_at
    )
    VALUES (
      ${invoice.invoice_number}, ${invoice.booking_id || null}, ${invoice.guest_name}, ${invoice.guest_email},
      ${invoice.check_in_date}, ${invoice.check_out_date}, ${invoice.accommodation_cost},
      ${invoice.cleaning_fee}, ${invoice.tax_amount}, ${invoice.additional_fees}, ${invoice.additional_fees_description || null},
      ${invoice.total_amount}, ${invoice.payment_method}, ${invoice.payment_status}, ${invoice.amount_paid || 0}, ${invoice.initial_deposit_percentage || 30}, ${invoice.status}, ${invoice.notes || null}, ${invoice.sent_at || null}
    )
    RETURNING *
  `;
  return result.rows[0] as Invoice;
}

export async function getAllInvoices(): Promise<Invoice[]> {
  const result = await sql`
    SELECT * FROM invoices
    ORDER BY created_at DESC
  `;
  return result.rows as Invoice[];
}

export async function getInvoice(id: number): Promise<Invoice | null> {
  const result = await sql`
    SELECT * FROM invoices WHERE id = ${id}
  `;
  return result.rows[0] as Invoice || null;
}

export async function updateInvoice(id: number, updates: Partial<Invoice>): Promise<Invoice> {
  const invoice = await getInvoice(id);
  if (!invoice) throw new Error('Invoice not found');

  const result = await sql`
    UPDATE invoices
    SET
      guest_name = ${updates.guest_name ?? invoice.guest_name},
      guest_email = ${updates.guest_email ?? invoice.guest_email},
      check_in_date = ${updates.check_in_date ?? invoice.check_in_date},
      check_out_date = ${updates.check_out_date ?? invoice.check_out_date},
      accommodation_cost = ${updates.accommodation_cost ?? invoice.accommodation_cost},
      cleaning_fee = ${updates.cleaning_fee ?? invoice.cleaning_fee},
      tax_amount = ${updates.tax_amount ?? invoice.tax_amount},
      additional_fees = ${updates.additional_fees ?? invoice.additional_fees},
      additional_fees_description = ${updates.additional_fees_description ?? invoice.additional_fees_description},
      total_amount = ${updates.total_amount ?? invoice.total_amount},
      payment_method = ${updates.payment_method ?? invoice.payment_method},
      payment_status = ${updates.payment_status ?? invoice.payment_status},
      amount_paid = ${updates.amount_paid ?? invoice.amount_paid ?? 0},
      initial_deposit_percentage = ${updates.initial_deposit_percentage ?? invoice.initial_deposit_percentage ?? 30},
      status = ${updates.status ?? invoice.status},
      notes = ${updates.notes ?? invoice.notes},
      sent_at = ${updates.sent_at ?? invoice.sent_at}
    WHERE id = ${id}
    RETURNING *
  `;
  return result.rows[0] as Invoice;
}

export async function deleteInvoice(id: number): Promise<boolean> {
  const result = await sql`
    DELETE FROM invoices WHERE id = ${id}
  `;
  return result.rowCount ? result.rowCount > 0 : false;
}

export async function generateInvoiceNumber(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `INV-${year}${month}`;
  
  // Get the highest sequence number for this month
  const result = await sql`
    SELECT invoice_number
    FROM invoices
    WHERE invoice_number LIKE ${`${prefix}-%`}
    ORDER BY invoice_number DESC
    LIMIT 1
  `;
  
  let sequence = 1;
  if (result.rows.length > 0) {
    const lastInvoice = result.rows[0].invoice_number;
    const lastSequence = parseInt(lastInvoice.split('-')[2] || '0');
    sequence = lastSequence + 1;
  }
  
  const sequenceStr = String(sequence).padStart(4, '0');
  return `${prefix}-${sequenceStr}`;
}

// ============================================
// RENTAL AGREEMENT TYPES AND FUNCTIONS
// ============================================

export interface RentalAgreement {
  id: string;
  property_name: string;
  property_address: string;
  check_in_date: string;
  check_out_date: string;
  rental_terms: string;
  total_amount?: string;
  security_deposit?: string;
  host_email?: string;
  logo?: string;
  created_at: string;
  link_expires_at?: string;
}

export interface Vehicle {
  license_plate: string;
  make: string;
  model: string;
  color: string;
}

export interface AdditionalAdult {
  name: string;
}

export interface RentalSubmission {
  id?: number;
  agreement_id: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  guest_address?: string;
  num_adults: number;
  num_children: number;
  additional_adults?: AdditionalAdult[];
  vehicles?: Vehicle[];
  security_deposit_authorized: boolean;
  electronic_signature_agreed: boolean;
  signature_data: string;
  check_in_date?: string;
  check_out_date?: string;
  view_token?: string;
  submitted_at?: string;
}

export interface RentalTermsTemplate {
  id: string;
  name: string;
  content: string;
  created_at: string;
  last_updated: string;
}

// Initialize rental agreement database tables
export async function initRentalAgreementTables() {
  try {
    // Create rental agreements table
    await sql`
      CREATE TABLE IF NOT EXISTS rental_agreements (
        id TEXT PRIMARY KEY,
        property_name TEXT NOT NULL,
        property_address TEXT NOT NULL,
        check_in_date TEXT NOT NULL,
        check_out_date TEXT NOT NULL,
        rental_terms TEXT,
        total_amount TEXT,
        host_email TEXT,
        logo TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        link_expires_at TIMESTAMP
      )
    `;

    // Create rental submissions table
    await sql`
      CREATE TABLE IF NOT EXISTS rental_submissions (
        id SERIAL PRIMARY KEY,
        agreement_id TEXT NOT NULL,
        guest_name TEXT NOT NULL,
        guest_email TEXT NOT NULL,
        guest_phone TEXT NOT NULL,
        guest_address TEXT,
        num_adults INTEGER DEFAULT 0,
        num_children INTEGER DEFAULT 0,
        additional_adults JSONB,
        vehicles JSONB,
        security_deposit_authorized BOOLEAN DEFAULT FALSE,
        electronic_signature_agreed BOOLEAN DEFAULT FALSE,
        signature_data TEXT NOT NULL,
        check_in_date TEXT,
        check_out_date TEXT,
        view_token TEXT UNIQUE,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create rental terms templates table
    await sql`
      CREATE TABLE IF NOT EXISTS rental_terms_templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Add total_amount column if it doesn't exist (for existing databases)
    try {
      await sql`
        ALTER TABLE rental_agreements 
        ADD COLUMN IF NOT EXISTS total_amount TEXT
      `;
    } catch (alterError) {
      console.log('Note: total_amount column may already exist');
    }

    // Add security_deposit column if it doesn't exist (for existing databases)
    try {
      await sql`
        ALTER TABLE rental_agreements 
        ADD COLUMN IF NOT EXISTS security_deposit TEXT
      `;
    } catch (alterError) {
      console.log('Note: security_deposit column may already exist');
    }

    console.log('Rental agreement database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing rental agreement database tables:', error);
    throw error;
  }
}

// Rental Agreement operations
export async function createRentalAgreement(agreement: RentalAgreement): Promise<RentalAgreement> {
  const result = await sql`
    INSERT INTO rental_agreements (
      id, property_name, property_address, check_in_date, check_out_date,
      rental_terms, total_amount, security_deposit, host_email, logo, created_at, link_expires_at
    )
    VALUES (
      ${agreement.id},
      ${agreement.property_name},
      ${agreement.property_address},
      ${agreement.check_in_date},
      ${agreement.check_out_date},
      ${agreement.rental_terms || ''},
      ${agreement.total_amount || null},
      ${agreement.security_deposit || null},
      ${agreement.host_email || null},
      ${agreement.logo || null},
      ${agreement.created_at},
      ${agreement.link_expires_at || null}
    )
    RETURNING *
  `;
  return result.rows[0] as RentalAgreement;
}

export async function getRentalAgreement(id: string): Promise<RentalAgreement | undefined> {
  const result = await sql`
    SELECT * FROM rental_agreements WHERE id = ${id}
  `;
  return result.rows[0] as RentalAgreement | undefined;
}

export async function getAllRentalAgreements(): Promise<RentalAgreement[]> {
  const result = await sql`
    SELECT * FROM rental_agreements ORDER BY created_at DESC
  `;
  return result.rows as RentalAgreement[];
}

export async function deleteRentalAgreement(id: string): Promise<boolean> {
  const result = await sql`
    DELETE FROM rental_agreements WHERE id = ${id}
  `;
  return result.rowCount ? result.rowCount > 0 : false;
}

// Rental Submission operations
export async function createRentalSubmission(submission: RentalSubmission): Promise<RentalSubmission> {
  // Generate a unique view token
  const viewToken = uuidv4();
  
  const result = await sql`
    INSERT INTO rental_submissions (
      agreement_id, guest_name, guest_email, guest_phone, guest_address,
      num_adults, num_children, additional_adults, vehicles, security_deposit_authorized,
      electronic_signature_agreed, signature_data, check_in_date, check_out_date, view_token, submitted_at
    )
    VALUES (
      ${submission.agreement_id},
      ${submission.guest_name},
      ${submission.guest_email},
      ${submission.guest_phone},
      ${submission.guest_address || null},
      ${submission.num_adults || 0},
      ${submission.num_children || 0},
      ${JSON.stringify(submission.additional_adults || [])},
      ${JSON.stringify(submission.vehicles || [])},
      ${submission.security_deposit_authorized || false},
      ${submission.electronic_signature_agreed || false},
      ${submission.signature_data},
      ${submission.check_in_date || null},
      ${submission.check_out_date || null},
      ${viewToken},
      ${submission.submitted_at || new Date().toISOString()}
    )
    RETURNING *
  `;
  const row = result.rows[0];
  // Parse JSON back to arrays
  if (row.additional_adults && typeof row.additional_adults === 'string') {
    row.additional_adults = JSON.parse(row.additional_adults);
  }
  if (row.vehicles && typeof row.vehicles === 'string') {
    row.vehicles = JSON.parse(row.vehicles);
  }
  return row as RentalSubmission;
}

export async function getRentalSubmissionsByAgreement(agreementId: string): Promise<RentalSubmission[]> {
  const result = await sql`
    SELECT * FROM rental_submissions
    WHERE agreement_id = ${agreementId}
    ORDER BY submitted_at DESC
  `;
  // Parse JSON for each row
  return result.rows.map(row => ({
    ...row,
    additional_adults: typeof row.additional_adults === 'string' ? JSON.parse(row.additional_adults) : row.additional_adults,
    vehicles: typeof row.vehicles === 'string' ? JSON.parse(row.vehicles) : row.vehicles
  })) as RentalSubmission[];
}

export async function getAllRentalSubmissions(): Promise<RentalSubmission[]> {
  const result = await sql`
    SELECT * FROM rental_submissions ORDER BY check_in_date DESC, submitted_at DESC
  `;
  // Parse JSON for each row
  return result.rows.map(row => ({
    ...row,
    additional_adults: typeof row.additional_adults === 'string' ? JSON.parse(row.additional_adults) : row.additional_adults,
    vehicles: typeof row.vehicles === 'string' ? JSON.parse(row.vehicles) : row.vehicles
  })) as RentalSubmission[];
}

export async function getRentalSubmissionByViewToken(viewToken: string): Promise<RentalSubmission | null> {
  const result = await sql`
    SELECT * FROM rental_submissions WHERE view_token = ${viewToken}
  `;
  if (result.rows.length === 0) return null;
  
  const row = result.rows[0];
  // Parse JSON
  if (row.additional_adults && typeof row.additional_adults === 'string') {
    row.additional_adults = JSON.parse(row.additional_adults);
  }
  if (row.vehicles && typeof row.vehicles === 'string') {
    row.vehicles = JSON.parse(row.vehicles);
  }
  return row as RentalSubmission;
}

export async function deleteRentalSubmission(id: number): Promise<boolean> {
  const result = await sql`
    DELETE FROM rental_submissions WHERE id = ${id}
  `;
  return result.rowCount ? result.rowCount > 0 : false;
}

// Rental Terms Template operations
export async function saveRentalTemplate(name: string, content: string): Promise<RentalTermsTemplate> {
  // Check if template exists
  const existing = await sql`
    SELECT * FROM rental_terms_templates WHERE name = ${name}
  `;

  if (existing.rows.length > 0) {
    // Update existing
    const result = await sql`
      UPDATE rental_terms_templates
      SET content = ${content}, last_updated = ${new Date().toISOString()}
      WHERE name = ${name}
      RETURNING *
    `;
    return result.rows[0] as RentalTermsTemplate;
  } else {
    // Insert new
    const id = Date.now().toString();
    const now = new Date().toISOString();
    const result = await sql`
      INSERT INTO rental_terms_templates (id, name, content, created_at, last_updated)
      VALUES (${id}, ${name}, ${content}, ${now}, ${now})
      RETURNING *
    `;
    return result.rows[0] as RentalTermsTemplate;
  }
}

export async function loadRentalTemplate(id: string): Promise<RentalTermsTemplate | null> {
  const result = await sql`
    SELECT * FROM rental_terms_templates WHERE id = ${id}
  `;
  return (result.rows[0] as RentalTermsTemplate) || null;
}

export async function getAllRentalTemplates(): Promise<RentalTermsTemplate[]> {
  const result = await sql`
    SELECT * FROM rental_terms_templates ORDER BY last_updated DESC
  `;
  return result.rows as RentalTermsTemplate[];
}

export async function deleteRentalTemplate(id: string): Promise<boolean> {
  const result = await sql`
    DELETE FROM rental_terms_templates WHERE id = ${id}
  `;
  return result.rowCount ? result.rowCount > 0 : false;
}


