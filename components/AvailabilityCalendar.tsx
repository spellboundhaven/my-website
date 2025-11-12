'use client'

import { useState, useEffect } from 'react'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { DollarSign, Calendar as CalendarIcon, Users, Clock } from 'lucide-react'

type CalendarValue = Date | null | [Date | null, Date | null]

interface AvailabilityDate {
  date: string
  available: boolean
  price: number
  minimum_stay: number
  reason?: string
}

export default function AvailabilityCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [checkIn, setCheckIn] = useState<Date | null>(null)
  const [checkOut, setCheckOut] = useState<Date | null>(null)
  const [guests, setGuests] = useState(2)
  const [availability, setAvailability] = useState<Record<string, AvailabilityDate>>({})
  const [loading, setLoading] = useState(false)
  const [totalPrice, setTotalPrice] = useState(0)
  const [showBookingForm, setShowBookingForm] = useState(false)
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())

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

  const getPriceForDate = (date: Date) => {
    const dateStr = formatDate(date)
    return availability[dateStr]?.price || 450
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
    return availability[dateStr]?.available && !availability[prevDayStr]?.available
  }

  const isCheckinDate = (date: Date) => {
    const dateStr = formatDate(date)
    const prevDay = new Date(date)
    prevDay.setDate(prevDay.getDate() - 1)
    const prevDayStr = formatDate(prevDay)
    
    // Check-in date: Today is blocked (guest is here), but yesterday was available
    // Guest checks in afternoon, so morning is available (left), evening is occupied (right)
    return !availability[dateStr]?.available && availability[prevDayStr]?.available
  }

  const tileClassName = ({ date }: { date: Date }) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (date < today) {
      return 'text-gray-400 cursor-not-allowed'
    }
    
    // Check for checkin date first (first blocked day after available period)
    // Shows: left green (morning available), right red (evening occupied)
    if (isCheckinDate(date)) {
      return 'checkin-date text-gray-700'
    }
    
    // Check for checkout date (first available day after blocked period)  
    // Shows: left red (morning occupied), right green (afternoon available)
    if (isCheckoutDate(date)) {
      return 'checkout-date text-gray-700 hover:bg-green-100'
    }
    
    if (isDateBooked(date)) {
      return 'bg-red-100 text-red-600 cursor-not-allowed'
    }
    
    if (isDateAvailable(date)) {
      return 'bg-green-50 text-green-700 hover:bg-green-100'
    }
    
    return ''
  }

  const handleDateClick = (value: CalendarValue) => {
    // Handle the case where value is null, an array (date range), or a single date
    if (!value || Array.isArray(value)) return
    
    const date = value as Date
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (date < today || isDateBooked(date)) {
      return
    }

    if (!checkIn || (checkIn && checkOut)) {
      setCheckIn(date)
      setCheckOut(null)
    } else if (checkIn && !checkOut) {
      if (date > checkIn) {
        setCheckOut(date)
      } else {
        setCheckIn(date)
        setCheckOut(null)
      }
    }
  }

  const handleBookNow = async (formData: any) => {
    if (!checkIn || !checkOut) return

    setLoading(true)
    
    try {
      // Submit booking inquiry
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          check_in_date: formatDate(checkIn),
          check_out_date: formatDate(checkOut),
          guest_name: formData.name,
          guest_email: formData.email,
          guest_phone: formData.phone,
          guests_count: guests,
          total_price: 0, // Will be calculated manually by host
          notes: formData.notes
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setShowBookingForm(false)
        alert(`Thank you for your inquiry! We've received your booking request and will contact you shortly at ${formData.email} to confirm availability and discuss payment details.`)
        // Reset form
        setCheckIn(null)
        setCheckOut(null)
        setGuests(2)
      } else {
        alert(data.error || 'Failed to submit inquiry. Please try again.')
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
        /* Checkout date: Left half light red (still occupied), right half white (available) */
        :global(.checkout-date) {
          background: linear-gradient(to bottom right, #fee2e2 50%, #ffffff 50%) !important;
          position: relative;
        }
        
        /* Checkin date: Left half white (available), right half light red (occupied) */
        :global(.checkin-date) {
          background: linear-gradient(to bottom right, #ffffff 50%, #fee2e2 50%) !important;
          position: relative;
        }
      `}</style>
      <div className="container-max">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 font-serif">
            Availability & Pricing
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Check availability and book your perfect stay at Spellbound Haven
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Calendar */}
          <div className="bg-gray-50 rounded-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 font-serif">
              Select Your Dates
            </h3>
            
            <div className="mb-6">
              <Calendar
                onChange={handleDateClick}
                value={selectedDate}
                tileClassName={tileClassName}
                tileDisabled={({ date }) => {
                  const today = new Date()
                  today.setHours(0, 0, 0, 0)
                  return date < today || isDateBooked(date)
                }}
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
                <div className="w-4 h-4 bg-green-50 border border-green-200 rounded"></div>
                <span>Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
                <span>Booked</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border border-gray-300 rounded" style={{background: 'linear-gradient(to bottom right, #fee2e2 50%, #ffffff 50%)'}}></div>
                <span>Check-out Day</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border border-gray-300 rounded" style={{background: 'linear-gradient(to bottom right, #ffffff 50%, #fee2e2 50%)'}}></div>
                <span>Check-in Day</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded"></div>
                <span>Past Dates</span>
              </div>
            </div>
          </div>

          {/* Booking Form */}
          <div className="bg-white border border-gray-200 rounded-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 font-serif">
              Booking Details
            </h3>

            {/* Selected Dates */}
            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-3">
                <CalendarIcon className="w-5 h-5 text-primary-600" />
                <div>
                  <div className="font-medium text-gray-900">Check-in</div>
                  <div className="text-gray-600">
                    {checkIn ? checkIn.toLocaleDateString() : 'Select check-in date'}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <CalendarIcon className="w-5 h-5 text-primary-600" />
                <div>
                  <div className="font-medium text-gray-900">Check-out</div>
                  <div className="text-gray-600">
                    {checkOut ? checkOut.toLocaleDateString() : 'Select check-out date'}
                  </div>
                </div>
              </div>
            </div>

            {/* Guests */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Guests
              </label>
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-primary-600" />
                <select
                  value={guests}
                  onChange={(e) => setGuests(Number(e.target.value))}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                    <option key={num} value={num}>{num} {num === 1 ? 'Guest' : 'Guests'}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Selected Dates Summary */}
            {checkIn && checkOut && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-blue-900 mb-2">Selected Dates</h4>
                <div className="text-sm text-blue-800">
                  <div className="flex justify-between mb-1">
                    <span>Nights:</span>
                    <span className="font-medium">{Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))}</span>
                  </div>
                  <p className="text-xs text-blue-700 mt-2">
                    💰 We'll send you a personalized quote including all taxes and fees
                  </p>
                </div>
              </div>
            )}

            {/* Request to Book Button */}
            {!showBookingForm && (
              <button
                onClick={() => setShowBookingForm(true)}
                disabled={!checkIn || !checkOut}
                className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors duration-200 ${
                  checkIn && checkOut
                    ? 'bg-primary-600 hover:bg-primary-700 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {checkIn && checkOut ? 'Request to Book' : 'Select Dates to Inquire'}
              </button>
            )}

            {/* Booking Inquiry Form */}
            {showBookingForm && (
              <BookingForm
                onSubmit={handleBookNow}
                onCancel={() => setShowBookingForm(false)}
                loading={loading}
              />
            )}

            {/* Additional Info */}
            <div className="mt-6 text-sm text-gray-600">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4" />
                <span>Minimum 3-night stay required</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                <span>Prices include all taxes and fees</span>
              </div>
            </div>
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

// Booking Inquiry Form Component
function BookingForm({
  onSubmit,
  onCancel,
  loading
}: {
  onSubmit: (data: any) => void
  onCancel: () => void
  loading: boolean
}) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
          We'll receive your inquiry and contact you within 24 hours to confirm availability and discuss payment options.
        </p>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2 px-4 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          disabled={loading}
        >
          Back
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold transition-colors disabled:bg-gray-400"
        >
          {loading ? 'Sending...' : 'Send Inquiry'}
        </button>
      </div>
    </form>
  )
}
