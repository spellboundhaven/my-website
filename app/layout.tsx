import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Spellbound Haven - Luxury Vacation Rental',
  description: 'Experience the magic of Spellbound Haven, a luxurious vacation rental offering breathtaking views, premium amenities, and unforgettable memories.',
  keywords: 'vacation rental, luxury accommodation, holiday home, resort, Spellbound Haven',
  authors: [{ name: 'Spellbound Haven' }],
  openGraph: {
    title: 'Spellbound Haven - Luxury Vacation Rental',
    description: 'Experience the magic of Spellbound Haven, a luxurious vacation rental offering breathtaking views, premium amenities, and unforgettable memories.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}


