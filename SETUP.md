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
HOST_EMAIL=your-email@example.com

# Stripe Payments
# Get these from Stripe Dashboard: https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Admin Dashboard
NEXT_PUBLIC_ADMIN_PASSWORD=your-secure-password

# App Configuration
NEXT_PUBLIC_BASE_URL=https://yourdomain.com

# Airbnb Calendar iCal URL (optional - can be set in admin dashboard)
AIRBNB_ICAL_URL=
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

### 3. Set Up Stripe Webhook

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Enter your webhook URL: `https://yourdomain.com/api/stripe/webhook`
4. Select event: `checkout.session.completed`
5. Copy the signing secret and add it to `STRIPE_WEBHOOK_SECRET`

For local development, use [Stripe CLI](https://stripe.com/docs/stripe-cli):

```bash
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### 4. Configure Resend Email

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
2. **Guest chooses payment method:**
   - Credit Card (Stripe) - Immediate payment
   - Zelle - Manual payment with instructions sent via email
3. **Guest fills out contact form**
4. **Payment processing:**
   - **Stripe:** Redirects to Stripe checkout, payment confirmed automatically
   - **Zelle:** Booking created as "pending", admin manually confirms after receiving payment
5. **Confirmation emails sent** to both guest and host

### Airbnb Calendar Sync

1. Go to your Airbnb listing
2. Copy the calendar iCal URL from Settings → Availability
3. Paste it in the admin dashboard → Settings → Airbnb Calendar Sync
4. Click "Sync Now" to import booked dates
5. Set up a cron job or manually sync regularly

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
- `POST /api/bookings` - Create a new booking
- `POST /api/stripe/checkout` - Create Stripe checkout session
- `POST /api/stripe/webhook` - Handle Stripe payment confirmations
- `POST /api/airbnb-sync` - Sync Airbnb calendar
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
- `total_price` - Total booking price
- `status` - pending | confirmed | cancelled | completed
- `payment_method` - stripe | zelle
- `payment_status` - pending | paid | refunded
- `stripe_session_id` - Stripe checkout session ID
- `notes` - Special requests
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

### Test Stripe Payments (Development)

Use Stripe test card numbers:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Expiry: Any future date (e.g., `12/34`)
- CVC: Any 3 digits (e.g., `123`)

### Test Airbnb Sync

Create a test booking in your Airbnb calendar, then sync in the admin dashboard to verify it blocks the dates correctly.

## Support

For questions or issues, contact the development team or refer to:
- [Next.js Documentation](https://nextjs.org/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [Resend Documentation](https://resend.com/docs)
- [Neon Documentation](https://neon.tech/docs)

