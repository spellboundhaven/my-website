# Spellbound Haven - Booking System Setup

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# Database (Neon Postgres)
# Get this from your Neon console: https://console.neon.tech
POSTGRES_URL=

# Email (Resend)
# Get this from Resend: https://resend.com/api-keys
RESEND_API_KEY=
HOST_EMAIL=your-email@example.com  # Email where booking inquiries will be sent

# Admin Dashboard
NEXT_PUBLIC_ADMIN_PASSWORD=your-secure-password

# App Configuration
NEXT_PUBLIC_BASE_URL=https://yourdomain.com

# Airbnb Calendar iCal URL (optional - can be set in admin dashboard)
AIRBNB_ICAL_URL=

# Cron Secret (for automatic Airbnb sync)
# Generate a random string: openssl rand -base64 32
CRON_SECRET=
```

## Initial Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Initialize Database

The database tables will be created automatically when you first access any API route that uses the database. To manually initialize:

```bash
# Start the dev server
npm run dev

# Visit any page to trigger database initialization
```

### 3. Configure Resend Email

1. Go to [Resend Dashboard](https://resend.com)
2. Add and verify your domain (e.g., `spellboundhaven.com`)
3. Update the email `from` address in API routes to match your verified domain
4. Copy your API key to `RESEND_API_KEY`

## Features

### Admin Dashboard (`/admin`)

Access the admin dashboard at `/admin` with your `NEXT_PUBLIC_ADMIN_PASSWORD`.

**Features:**
- View all bookings with status management
- Block dates for maintenance or personal use
- Create pricing rules for different seasons/holidays
- Sync Airbnb calendar automatically
- View payment status and guest details

### Booking Flow

1. **Guest selects dates** on the availability calendar
2. **Guest views pricing** for selected dates
3. **Guest fills out inquiry form** with contact information and optional message
4. **Inquiry email sent** to host (you) with all guest details
5. **Host responds** directly to guest via email to confirm availability and discuss payment
6. **Payment handled** manually (Zelle, Venmo, bank transfer, etc.) outside the website
7. **Host marks booking** as confirmed in the admin dashboard

### Airbnb Calendar Sync

**Automatic Daily Sync (Recommended):**

The system automatically syncs your Airbnb calendar once per day at midnight (00:00 UTC) using Vercel Cron Jobs.

1. Go to your Airbnb listing
2. Copy the calendar iCal URL from Settings → Availability
3. Paste it in the admin dashboard → Settings → Airbnb Calendar Sync
4. Click "Sync Now" for the first sync
5. **The calendar will auto-sync daily at midnight!** ⏰

**How it works:**
- Vercel Cron automatically calls `/api/cron/sync-airbnb` once per day at midnight UTC
- New Airbnb bookings are automatically blocked on your website
- No manual syncing needed!
- Check the admin dashboard for last sync time

**Manual Sync:**
You can still manually sync anytime in the admin dashboard if needed.

**Airbnb URL location:**
- Go to your listing on Airbnb
- Click "Availability"
- Scroll down to "Availability settings"
- Click "Export calendar"
- Copy the "Calendar Address (iCal URL)"

Example:
```
https://www.airbnb.com/calendar/ical/974522329669113361.ics?s=...
```

## API Routes

- `GET /api/availability?startDate=...&endDate=...` - Get availability for date range
- `GET /api/pricing?startDate=...&endDate=...` - Calculate pricing for date range
- `POST /api/bookings` - Submit a booking inquiry (sends email to host)
- `POST /api/airbnb-sync` - Manually sync Airbnb calendar
- `GET /api/cron/sync-airbnb` - Automatic Airbnb sync (called by Vercel Cron)
- `GET/POST /api/admin` - Admin operations (requires auth)

## Database Schema

### Bookings Table
- `id` - Auto-increment primary key
- `check_in_date` - Check-in date
- `check_out_date` - Check-out date
- `guest_name` - Guest full name
- `guest_email` - Guest email
- `guest_phone` - Guest phone
- `guests_count` - Number of guests
- `total_price` - Estimated total price
- `status` - inquiry | confirmed | cancelled | completed
- `payment_method` - manual | airbnb
- `payment_status` - pending | paid | refunded
- `notes` - Guest message or special requests
- `source` - website | airbnb | manual
- `created_at` - Timestamp

### Date Blocks Table
- `id` - Auto-increment primary key
- `start_date` - Block start date
- `end_date` - Block end date
- `reason` - Reason for blocking (e.g., "Maintenance", "Airbnb: Guest Name")
- `created_at` - Timestamp

### Pricing Rules Table
- `id` - Auto-increment primary key
- `start_date` - Rule start date
- `end_date` - Rule end date
- `price_per_night` - Price per night
- `minimum_stay` - Minimum nights required
- `rule_type` - standard | peak | holiday
- `created_at` - Timestamp

### Airbnb Sync Table
- `id` - Auto-increment primary key
- `last_synced` - Last sync timestamp
- `ical_url` - Airbnb iCal URL
- `sync_status` - success | failure

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com) and import your repository
3. Add all environment variables in Vercel project settings
4. Deploy!

### Connect Your Squarespace Domain

1. In Vercel, go to Project → Settings → Domains
2. Add your Squarespace domain (e.g., `spellboundhaven.com`)
3. Vercel will provide DNS records
4. In Squarespace:
   - Go to Settings → Domains → [Your Domain] → DNS Settings
   - Add the DNS records provided by Vercel:
     - Type: `A`, Host: `@`, Value: `76.76.21.21`
     - Type: `CNAME`, Host: `www`, Value: `cname.vercel-dns.com`

## Testing

### Test Booking Inquiries

1. Select dates on your calendar
2. Fill out the inquiry form with your email
3. Submit and verify you receive the inquiry email

### Test Airbnb Sync

Create a test booking in your Airbnb calendar, then sync in the admin dashboard to verify it blocks the dates correctly.

## Support

For questions or issues, contact the development team or refer to:
- [Next.js Documentation](https://nextjs.org/docs)
- [Resend Documentation](https://resend.com/docs)
- [Neon Documentation](https://neon.tech/docs)
- [Vercel Cron Documentation](https://vercel.com/docs/cron-jobs)

