# Spellbound Haven - Luxury Vacation Rental Website

A modern, responsive website for Spellbound Haven, a luxury vacation rental property. Built with Next.js, TypeScript, and Tailwind CSS.

## Features

- **Property Overview**: Detailed property information with high-quality images
- **Interactive Gallery**: Room-by-room photo gallery with modal lightbox
- **Amenities Showcase**: Separate sections for house and resort amenities
- **Availability Calendar**: Interactive booking calendar with pricing
- **Guest Reviews**: Customer testimonials and ratings display
- **Contact Form**: Comprehensive inquiry form with date selection
- **Responsive Design**: Optimized for all devices
- **Modern UI**: Clean, professional design with smooth animations

## Additional Features Included

- **Navigation**: Fixed header with smooth scrolling
- **Hero Section**: Eye-catching landing area with property highlights
- **Floor Plans**: Placeholder for interactive floor plan integration
- **Pricing Information**: Clear pricing tiers and policies
- **Social Media Integration**: Footer with social media links
- **Newsletter Signup**: Email subscription form
- **SEO Optimized**: Meta tags and structured data ready

## Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Calendar**: React Calendar
- **Image Optimization**: Next.js Image component
- **Deployment**: Ready for Google Cloud Platform

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd spellbound-haven-website
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

### Google Cloud Platform

1. **Build the project**:
```bash
npm run build
```

2. **Deploy to GCP**:
   - Use Google Cloud Run for serverless deployment
   - Or use Google App Engine for traditional hosting
   - Configure custom domain in GCP console

### Domain Configuration

1. **Update DNS settings** in your domain provider (Squarespace):
   - Add CNAME record pointing to your GCP deployment
   - Or configure A records with GCP IP addresses

2. **SSL Certificate**: GCP automatically provides SSL certificates

## Customization

### Property Data
Edit `data/property.ts` to update:
- Property information and descriptions
- Images and galleries
- Amenities lists
- Reviews and testimonials
- Contact information
- Pricing data

### Styling
- Modify `tailwind.config.js` for color schemes and fonts
- Update `app/globals.css` for custom styles
- Component-specific styles in individual component files

### Images
- Replace placeholder images with actual property photos
- Optimize images for web (WebP format recommended)
- Update image URLs in `data/property.ts`

## File Structure

```
spellbound-haven-website/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── Amenities.tsx
│   ├── AvailabilityCalendar.tsx
│   ├── Contact.tsx
│   ├── Footer.tsx
│   ├── Gallery.tsx
│   ├── Hero.tsx
│   ├── Navigation.tsx
│   ├── PropertyOverview.tsx
│   └── Reviews.tsx
├── data/
│   └── property.ts
├── public/
│   └── (static assets)
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

## Support

For questions or support, contact:
- Email: spellboundhaven.disney@gmail.com
- Phone: +1 (555) 123-4567

## License

This project is proprietary to Spellbound Haven. All rights reserved.


