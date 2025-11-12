'use client'

import { useState, useEffect } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { DollarSign } from 'lucide-react'

interface AvailabilityDate {
  date: string
  available: boolean
  price: number
  minimum_stay: number
  reason?: string
}

export default function AvailabilityCalendar() {
  const [availability, setAvailability] = useState<Record<string, AvailabilityDate>>({})
  const [loading, setLoading] = useState(false)
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())

  // Inquiry form state
  const [formData, setFormData] = useState({
    checkIn: '',
    checkOut: '',
    guests: '2',
    name: '',
    email: '',
    phone: '',
    notes: ''
  })

  // Fetch availability for the current month
  useEffect(() => {
    fetchAvailability(currentMonth)
  }, [currentMonth])

  const fetchAvailability = async (date: Date) => {
    setLoading(true)
    try {
      const year = date.getFullYear()
      const month = date.getMonth()
      // Get first day of current month, then go back 7 days to catch previous month dates shown in calendar
      const firstDay = new Date(year, month, 1)
      const startDate = new Date(firstDay.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      // Get first day of NEXT month, then go forward 7 days to catch next month dates shown in calendar
      const lastDay = new Date(year, month + 1, 1)
      const endDate = new Date(lastDay.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      console.log(`Fetching availability for ${startDate} to ${endDate}`)

      const response = await fetch(`/api/availability?startDate=${startDate}&endDate=${endDate}`)
      const data = await response.json()

      if (data.success) {
        console.log(`Loaded ${data.availability.length} days for ${startDate}`)
        const availabilityMap: Record<string, AvailabilityDate> = {}
        data.availability.forEach((item: AvailabilityDate) => {
          availabilityMap[item.date] = item
        })
        setAvailability(availabilityMap)
      }
    } catch (error) {
      console.error('Error fetching availability:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  const isDateAvailable = (date: Date) => {
    const dateStr = formatDate(date)
    return availability[dateStr]?.available ?? true
  }

  const isDateBooked = (date: Date) => {
    const dateStr = formatDate(date)
    return availability[dateStr]?.available === false
  }

  const isCheckoutDate = (date: Date) => {
    const dateStr = formatDate(date)
    const prevDay = new Date(date)
    prevDay.setDate(prevDay.getDate() - 1)
    const prevDayStr = formatDate(prevDay)
    
    // Checkout date: Today is available (for new bookings), but yesterday was blocked
    // Guest checks out in morning, so morning is still occupied (left), afternoon is available (right)
    const todayAvailable = availability[dateStr]?.available ?? true
    const yesterdayAvailable = availability[prevDayStr]?.available ?? true
    
    return todayAvailable && !yesterdayAvailable
  }

  const isCheckinDate = (date: Date) => {
    const dateStr = formatDate(date)
    const prevDay = new Date(date)
    prevDay.setDate(prevDay.getDate() - 1)
    const prevDayStr = formatDate(prevDay)
    
    // Checkin date: Today is blocked, but yesterday was available
    // Guest checks in afternoon, so morning is available (left), evening is occupied (right)
    const todayAvailable = availability[dateStr]?.available ?? true
    const yesterdayAvailable = availability[prevDayStr]?.available ?? true
    
    return !todayAvailable && yesterdayAvailable
  }

  const tileClassName = ({ date }: { date: Date }) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (date < today) {
      return 'text-gray-400 cursor-not-allowed'
    }
    
    // Check for checkin date first (first blocked day after available period)
    // Shows: left white (morning available), right grey (evening occupied)
    if (isCheckinDate(date)) {
      return 'checkin-date text-gray-700'
    }
    
    // Check for checkout date (first available day after blocked period)  
    // Shows: left grey (morning occupied), right white (afternoon available)
    if (isCheckoutDate(date)) {
      return 'checkout-date text-gray-700'
    }
    
    if (isDateBooked(date)) {
      return 'bg-gray-100 text-gray-600 cursor-not-allowed'
    }
    
    if (isDateAvailable(date)) {
      return 'bg-white text-gray-900'
    }
    
    return ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.checkIn || !formData.checkOut || !formData.name || !formData.email || !formData.phone) {
      alert('Please fill in all required fields')
      return
    }
    
    setLoading(true)
    
    try {
      // Submit booking inquiry
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          check_in_date: formData.checkIn,
          check_out_date: formData.checkOut,
          guest_name: formData.name,
          guest_email: formData.email,
          guest_phone: formData.phone,
          guests_count: parseInt(formData.guests),
          total_price: 0, // Will be calculated manually by host
          notes: formData.notes
        })
      })

      const data = await response.json()

      if (data.success) {
        alert('Your inquiry has been sent! We\'ll contact you within 24 hours to confirm availability and provide a personalized quote.')
        // Reset form
        setFormData({
          checkIn: '',
          checkOut: '',
          guests: '2',
          name: '',
          email: '',
          phone: '',
          notes: ''
        })
      } else {
        throw new Error(data.error || 'Failed to submit inquiry')
      }
    } catch (error) {
      console.error('Error submitting inquiry:', error)
      alert('An error occurred. Please try again or contact us directly.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="availability" className="section-padding bg-white">
      <style jsx>{`
        /* Booked dates: Full grey block */
        :global(.react-calendar__tile.bg-gray-100) {
          background-color: #f3f4f6 !important;
        }
        
        /* Available dates: White */
        :global(.react-calendar__tile.bg-white) {
          background-color: #ffffff !important;
        }
        
        /* Checkout date: Left half light grey (still occupied), right half white (available) */
        :global(.checkout-date) {
          background: linear-gradient(to bottom right, #f3f4f6 50%, #ffffff 50%) !important;
          position: relative;
        }
        
        /* Checkin date: Left half white (available), right half light grey (occupied) */
        :global(.checkin-date) {
          background: linear-gradient(to bottom right, #ffffff 50%, #f3f4f6 50%) !important;
          position: relative;
        }
      `}</style>
      <div className="container-max">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 font-serif">
            Availability & Pricing
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Check availability and send us an inquiry to book your perfect stay
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Calendar - View Only */}
          <div className="bg-gray-50 rounded-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 font-serif">
              View Availability
            </h3>
            
            <div className="mb-6">
              <Calendar
                value={currentMonth}
                tileClassName={tileClassName}
                onActiveStartDateChange={({ activeStartDate }) => {
                  if (activeStartDate) {
                    setCurrentMonth(activeStartDate)
                  }
                }}
                className="w-full"
              />
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-white border border-gray-300 rounded"></div>
                <span>Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded"></div>
                <span>Booked</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border border-gray-300 rounded" style={{background: 'linear-gradient(to bottom right, #f3f4f6 50%, #ffffff 50%)'}}></div>
                <span>Check-out Day</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border border-gray-300 rounded" style={{background: 'linear-gradient(to bottom right, #ffffff 50%, #f3f4f6 50%)'}}></div>
                <span>Check-in Day</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded"></div>
                <span>Past Dates</span>
              </div>
            </div>
          </div>

          {/* Booking Inquiry Form */}
          <div className="bg-white border border-gray-200 rounded-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 font-serif">
              Send Us a Message
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Check-in Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.checkIn}
                    onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Check-out Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.checkOut}
                    onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Guests */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Guests *
                </label>
                <select
                  value={formData.guests}
                  onChange={(e) => setFormData({ ...formData, guests: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {Array.from({ length: 20 }, (_, i) => i + 1).map(num => (
                    <option key={num} value={num}>{num} {num === 1 ? 'Guest' : 'Guests'}</option>
                  ))}
                </select>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="John Doe"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="john@example.com"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="(555) 123-4567"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message / Special Requests (Optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={3}
                  placeholder="Any special requests, questions, or additional information..."
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  📧 <strong>What happens next?</strong><br />
                  We'll receive your inquiry and contact you within 24 hours to confirm availability and provide a personalized quote.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-6 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold transition-colors disabled:bg-gray-400"
              >
                {loading ? 'Sending...' : 'Send Inquiry'}
              </button>
            </form>
          </div>
        </div>

        {/* Pricing Information */}
        <div className="mt-16 bg-gray-50 rounded-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center font-serif">
            Pricing Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600 mb-2">$450</div>
              <div className="text-gray-600 mb-1">Standard Rate</div>
              <div className="text-sm text-gray-500">Per night</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600 mb-2">$600</div>
              <div className="text-gray-600 mb-1">Peak Season</div>
              <div className="text-sm text-gray-500">Per night</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600 mb-2">$1,000</div>
              <div className="text-gray-600 mb-1">Holiday Rate</div>
              <div className="text-sm text-gray-500">Per night</div>
            </div>
          </div>
          <p className="text-center text-sm text-gray-600 mt-6">
            *Prices shown are for reference only. Actual price will be based on seasonality.
          </p>
        </div>
      </div>
    </section>
  )
}
