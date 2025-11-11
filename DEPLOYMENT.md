# Deployment Checklist for Spellbound Haven

## Pre-Deployment

### 1. Environment Variables Setup
- [ ] Set up Neon Postgres database
- [ ] Get POSTGRES_URL from Neon console
- [ ] Create Resend account and verify domain
- [ ] Get RESEND_API_KEY from Resend
- [ ] Set HOST_EMAIL for notifications
- [ ] Create Stripe account
- [ ] Get STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET
- [ ] Set NEXT_PUBLIC_ADMIN_PASSWORD (change from default!)
- [ ] Set NEXT_PUBLIC_BASE_URL to your domain
- [ ] Set CRON_SECRET (generate with: `openssl rand -base64 32`)

### 2. Initial Pricing Setup
After deployment, go to `/admin` and set up:
- [ ] Default pricing rule (e.g., $450/night, standard rate)
- [ ] Peak season pricing (if applicable)
- [ ] Holiday pricing (if applicable)

### 3. Airbnb Integration
- [ ] Get your Airbnb iCal URL from listing settings
- [ ] Add it in admin dashboard → Settings
- [ ] Run initial sync
- [ ] Set up periodic sync (manually or via cron)

## Deployment to Vercel

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit with booking system"
git branch -M main
git remote add origin your-repo-url
git push -u origin main
```

### 2. Import to Vercel
- [ ] Go to https://vercel.com
- [ ] Click "Add New Project"
- [ ] Import your GitHub repository
- [ ] Add all environment variables
- [ ] Deploy

### 3. Configure Stripe Webhook
After deployment:
- [ ] Go to Stripe Dashboard → Webhooks
- [ ] Add endpoint: `https://yourdomain.com/api/stripe/webhook`
- [ ] Select event: `checkout.session.completed`
- [ ] Copy webhook secret to Vercel env vars
- [ ] Redeploy if needed

### 4. Domain Setup (Squarespace)

#### In Vercel:
- [ ] Go to Project → Settings → Domains
- [ ] Add your Squarespace domain

#### In Squarespace:
- [ ] Go to Settings → Domains → [Your Domain]
- [ ] Click "Advanced Settings" → "DNS Settings"
- [ ] Add A record: Host: `@`, Value: `76.76.21.21`
- [ ] Add CNAME record: Host: `www`, Value: `cname.vercel-dns.com`
- [ ] Wait for DNS propagation (5 minutes - 48 hours)

### 5. Resend Email Setup
- [ ] Verify your domain in Resend
- [ ] Update API routes if needed (change `from` email addresses)
- [ ] Send test booking to verify emails work

## Post-Deployment Testing

### 1. Test Availability Calendar
- [ ] Visit your homepage
- [ ] Scroll to availability section
- [ ] Select dates and verify pricing loads
- [ ] Check calendar colors (available/booked)

### 2. Test Booking Flow

#### Stripe Payment:
- [ ] Select dates
- [ ] Choose "Credit Card" payment
- [ ] Fill out booking form
- [ ] Use test card: 4242 4242 4242 4242
- [ ] Verify redirect to success page
- [ ] Check admin dashboard for booking
- [ ] Verify confirmation emails received

#### Zelle Payment:
- [ ] Select dates
- [ ] Choose "Zelle" payment
- [ ] Fill out booking form
- [ ] Verify booking created as "pending"
- [ ] Check email for Zelle instructions
- [ ] Manually confirm in admin dashboard

### 3. Test Admin Dashboard
- [ ] Login to `/admin`
- [ ] Verify all bookings show up
- [ ] Create a date block
- [ ] Create a pricing rule
- [ ] Sync Airbnb calendar (if applicable)
- [ ] Update booking status

### 4. Test Airbnb Sync
- [ ] Create a test booking in Airbnb
- [ ] Go to admin → Settings
- [ ] Click "Sync Now"
- [ ] Verify dates are blocked on your calendar
- [ ] Check date blocks tab for Airbnb booking

## Security Checklist

- [ ] Change NEXT_PUBLIC_ADMIN_PASSWORD from default
- [ ] Verify Stripe is in live mode (not test mode)
- [ ] Check that sensitive env vars are not in code
- [ ] Test that admin dashboard requires password
- [ ] Verify email addresses are correct
- [ ] Check that Stripe webhook secret is correct

## Monitoring

### Set Up Alerts
- [ ] Monitor Stripe dashboard for payments
- [ ] Check email inbox for booking notifications
- [ ] Regularly check admin dashboard
- [ ] Monitor Vercel analytics for errors

### Regular Maintenance
- [ ] Sync Airbnb calendar weekly (or set up automation)
- [ ] Review bookings and update statuses
- [ ] Update pricing rules seasonally
- [ ] Respond to booking inquiries promptly

## Troubleshooting

### Emails Not Sending
- Verify RESEND_API_KEY is correct
- Check that domain is verified in Resend
- Update `from` addresses to match verified domain
- Check Vercel logs for errors

### Stripe Payments Failing
- Verify STRIPE_SECRET_KEY is correct
- Check webhook endpoint is accessible
- Verify STRIPE_WEBHOOK_SECRET matches Stripe dashboard
- Test with Stripe test cards first

### Database Connection Issues
- Verify POSTGRES_URL is correct
- Check Neon dashboard for database status
- Review Vercel function logs

### Calendar Not Loading
- Check browser console for errors
- Verify API routes are working
- Check database has pricing rules
- Ensure dates are not in the past

## Success Criteria

✅ Booking system deployed and accessible
✅ Stripe payments working
✅ Email notifications sending
✅ Admin dashboard functional
✅ Airbnb calendar syncing
✅ Domain connected and SSL active
✅ All environment variables set
✅ Initial pricing rules created

## Support Resources

- Vercel Support: https://vercel.com/support
- Stripe Support: https://support.stripe.com
- Resend Support: https://resend.com/support
- Neon Support: https://neon.tech/docs
- Your Airbnb listing: https://www.airbnb.com/rooms/974522329669113361

---

**Note:** Keep this checklist updated as you make changes to the system!

