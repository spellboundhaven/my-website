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
    adults: '2',
    children: '0',
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
    // Format date in EST timezone without timezone conversion
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
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
    const compareDate = new Date(date)
    compareDate.setHours(0, 0, 0, 0)
    
    const isToday = compareDate.getTime() === today.getTime()
    
    // Block all dates up to and including today (no same-day check-in)
    if (compareDate <= today) {
      return 'bg-blue-50 text-gray-400 cursor-not-allowed'
    }
    
    // Check for checkin date first (first blocked day after available period)
    // Shows: left white (morning available), right grey (evening occupied)
    if (isCheckinDate(date)) {
      return isToday ? 'checkin-date text-blue-600 font-semibold' : 'checkin-date text-gray-700'
    }
    
    // Check for checkout date (first available day after blocked period)  
    // Shows: left grey (morning occupied), right white (afternoon available)
    if (isCheckoutDate(date)) {
      return isToday ? 'checkout-date text-blue-600 font-semibold' : 'checkout-date text-gray-700'
    }
    
    if (isDateBooked(date)) {
      return 'bg-gray-100 text-gray-600 cursor-not-allowed'
    }
    
    if (isDateAvailable(date)) {
      return isToday ? 'bg-white text-blue-600 font-semibold' : 'bg-white text-gray-900'
    }
    
    return ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.checkIn || !formData.checkOut || !formData.name || !formData.email || !formData.phone) {
      alert('Please fill in all required fields')
      return
    }
    
    const totalGuests = parseInt(formData.adults) + parseInt(formData.children)
    
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
          guests_count: totalGuests,
          total_price: 0, // Will be calculated manually by host
          notes: `Adults: ${formData.adults}, Children: ${formData.children}${formData.notes ? '\n' + formData.notes : ''}`
        })
      })

      const data = await response.json()

      if (data.success) {
        alert('Your inquiry has been sent! We\'ll contact you within 24 hours to confirm availability and provide a personalized quote.')
        // Reset form
        setFormData({
          checkIn: '',
          checkOut: '',
          adults: '2',
          children: '0',
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
        
        /* Past dates: Light blue */
        :global(.react-calendar__tile.bg-blue-50) {
          background-color: #eff6ff !important;
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
            Check Availability
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            View our calendar and send us an inquiry to book your perfect stay
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Calendar - View Only */}
          <div className="bg-gray-50 rounded-lg p-4 sm:p-6 lg:p-8">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 font-serif">
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
                calendarType="US"
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
                <div className="w-4 h-4 bg-blue-50 border border-blue-200 rounded"></div>
                <span>Past Dates</span>
              </div>
            </div>
          </div>

          {/* Booking Inquiry Form */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 lg:p-8">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 font-serif">
              Send Us a Message
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Check-in Date *
                  </label>
                  <input
                    type="date"
                    required
                    min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                    value={formData.checkIn}
                    onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Check-out Date *
                  </label>
                  <input
                    type="date"
                    required
                    min={formData.checkIn || new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                    value={formData.checkOut}
                    onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
                  />
                </div>
              </div>

              {/* Adults and Children */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Adults *
                  </label>
                  <select
                    value={formData.adults}
                    onChange={(e) => setFormData({ ...formData, adults: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
                  >
                    {Array.from({ length: 20 }, (_, i) => i + 1).map(num => (
                      <option key={num} value={num}>{num} {num === 1 ? 'Adult' : 'Adults'}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Children
                  </label>
                  <select
                    value={formData.children}
                    onChange={(e) => setFormData({ ...formData, children: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
                  >
                    {Array.from({ length: 11 }, (_, i) => i).map(num => (
                      <option key={num} value={num}>{num} {num === 1 ? 'Child' : 'Children'}</option>
                    ))}
                  </select>
                </div>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
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
      </div>
    </section>
  )
}
