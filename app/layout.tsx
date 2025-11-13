import type { Metadata } from 'next'
import './globals.css'
import StructuredData from '@/components/StructuredData'

export const metadata: Metadata = {
  title: 'Spellbound Haven | Windsor Island Resort Vacation Rental Near Disney World | Orlando Family Villa',
  description: 'Luxury 10-bedroom Disney vacation rental at Windsor Island Resort, Orlando. Perfect for family gatherings & multigenerational trips. Sleeps 20. Private pool, themed bedrooms, 9 miles from Disney World.',
  keywords: 'Windsor Island Resort, Disney family vacation, Disney family gathering, Orlando vacation rental, Disney area vacation home, multigenerational Disney trip, large family vacation rental Orlando, Windsor Island vacation home, Disney World vacation rental, themed bedrooms Orlando, private pool vacation rental, Orlando family reunion house',
  authors: [{ name: 'Spellbound Haven' }],
  openGraph: {
    title: 'Spellbound Haven | Windsor Island Resort Disney Vacation Rental',
    description: 'Luxury 10-bedroom villa at Windsor Island Resort, Orlando. Perfect for Disney family gatherings. Sleeps 20, private pool, themed bedrooms, 9 miles from Disney.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Spellbound Haven',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Spellbound Haven | Windsor Island Resort Disney Vacation Rental',
    description: 'Luxury 10-bedroom villa perfect for Disney family gatherings at Windsor Island Resort, Orlando',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <StructuredData />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}


