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

    // Create airbnb_sync table for tracking last sync
    await sql`
      CREATE TABLE IF NOT EXISTS airbnb_sync (
        id SERIAL PRIMARY KEY,
        last_synced TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ical_url TEXT,
        sync_status TEXT DEFAULT 'success'
      )
    `;

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
        status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'cancelled')),
        notes TEXT,
        sent_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    
    availability.push({
      date: dateStr,
      available: !isBooked && !block,
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
      total_amount, payment_method, status, notes, sent_at
    )
    VALUES (
      ${invoice.invoice_number}, ${invoice.booking_id || null}, ${invoice.guest_name}, ${invoice.guest_email},
      ${invoice.check_in_date}, ${invoice.check_out_date}, ${invoice.accommodation_cost},
      ${invoice.cleaning_fee}, ${invoice.tax_amount}, ${invoice.additional_fees}, ${invoice.additional_fees_description || null},
      ${invoice.total_amount}, ${invoice.payment_method}, ${invoice.status}, ${invoice.notes || null}, ${invoice.sent_at || null}
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
  
  // Get count of invoices this month
  const result = await sql`
    SELECT COUNT(*) as count
    FROM invoices
    WHERE invoice_number LIKE ${`INV-${year}${month}%`}
  `;
  
  const count = parseInt(result.rows[0].count || '0') + 1;
  const sequence = String(count).padStart(4, '0');
  
  return `INV-${year}${month}-${sequence}`;
}

