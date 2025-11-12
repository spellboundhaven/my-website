# Deployment Checklist for Spellbound Haven

## Pre-Deployment

### 1. Environment Variables Setup
- [ ] Set up Neon Postgres database
- [ ] Get POSTGRES_URL from Neon console
- [ ] Create Resend account and verify domain
- [ ] Get RESEND_API_KEY from Resend
- [ ] Set HOST_EMAIL for notifications (where booking inquiries will be sent)
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

### 3. Domain Setup (Squarespace)

#### In Vercel:
- [ ] Go to Project → Settings → Domains
- [ ] Add your Squarespace domain

#### In Squarespace:
- [ ] Go to Settings → Domains → [Your Domain]
- [ ] Click "Advanced Settings" → "DNS Settings"
- [ ] Add A record: Host: `@`, Value: `76.76.21.21`
- [ ] Add CNAME record: Host: `www`, Value: `cname.vercel-dns.com`
- [ ] Wait for DNS propagation (5 minutes - 48 hours)

### 4. Resend Email Setup
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

#### Booking Inquiry:
- [ ] Select dates on the calendar
- [ ] Verify pricing displays correctly
- [ ] Click "Request to Book"
- [ ] Fill out inquiry form with your email
- [ ] Submit the form
- [ ] Verify success message appears
- [ ] Check HOST_EMAIL inbox for inquiry notification
- [ ] Verify inquiry shows in admin dashboard as "inquiry" status
- [ ] Test replying to guest email

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
- [ ] Check that sensitive env vars are not in code
- [ ] Test that admin dashboard requires password
- [ ] Verify email addresses are correct (HOST_EMAIL)
- [ ] Verify CRON_SECRET is set and secure

## Monitoring

### Set Up Alerts
- [ ] Check email inbox daily for booking inquiries
- [ ] Regularly check admin dashboard for new inquiries
- [ ] Monitor Vercel analytics for errors
- [ ] Respond to inquiries within 24 hours

### Regular Maintenance
- [ ] Airbnb calendar syncs automatically daily at midnight
- [ ] Review bookings and update statuses (inquiry → confirmed → completed)
- [ ] Update pricing rules seasonally
- [ ] Respond to booking inquiries promptly via email
- [ ] Mark confirmed bookings in admin dashboard

## Troubleshooting

### Emails Not Sending
- Verify RESEND_API_KEY is correct
- Check that domain is verified in Resend
- Update `from` addresses to match verified domain
- Check HOST_EMAIL is set correctly
- Check Vercel logs for errors

### Booking Inquiries Not Received
- Verify HOST_EMAIL environment variable is set
- Check spam/junk folder
- Test with your own email first
- Check Vercel function logs for errors
- Verify RESEND_API_KEY is valid

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
✅ Booking inquiry form working
✅ Email notifications sending to HOST_EMAIL
✅ Admin dashboard functional
✅ Airbnb calendar syncing automatically daily
✅ Domain connected and SSL active
✅ All environment variables set
✅ Initial pricing rules created
✅ Can respond to inquiries via email

## Support Resources

- Vercel Support: https://vercel.com/support
- Resend Support: https://resend.com/support
- Neon Support: https://neon.tech/docs
- Vercel Cron Jobs: https://vercel.com/docs/cron-jobs
- Your Airbnb listing: https://www.airbnb.com/rooms/974522329669113361

---

**Note:** Keep this checklist updated as you make changes to the system!

