import Hero from '@/components/Hero'
import ThemedBedroomsShowcase from '@/components/ThemedBedroomsShowcase'
import PropertyOverview from '@/components/PropertyOverview'
import Gallery from '@/components/Gallery'
import Amenities from '@/components/Amenities'
import AvailabilityCalendar from '@/components/AvailabilityCalendar'
import Reviews from '@/components/Reviews'
import Contact from '@/components/Contact'
import Footer from '@/components/Footer'
import Navigation from '@/components/Navigation'

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navigation />
      <Hero />
      <ThemedBedroomsShowcase />
      <PropertyOverview />
      <Gallery />
      <Amenities />
      <AvailabilityCalendar />
      <Reviews />
      <Contact />
      <Footer />
    </main>
  )
}

