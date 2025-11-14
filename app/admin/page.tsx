'use client'

import { useState, useEffect } from 'react'
import { CalendarIcon, Users, Ban, Settings, Star, FileText } from 'lucide-react'

interface Booking {
  id: number
  check_in_date: string
  check_out_date: string
  guest_name: string
  guest_email: string
  guest_phone: string
  guests_count: number
  total_price: number
  status: string
  payment_method?: string
  payment_status?: string
  notes?: string
  created_at: string
}

interface DateBlock {
  id: number
  start_date: string
  end_date: string
  reason: string
  created_at: string
}

interface Review {
  id: number
  name: string
  rating: number
  date: string
  location?: string
  comment: string
  created_at: string
}

interface Invoice {
  id: number
  invoice_number: string
  booking_id?: number
  guest_name: string
  guest_email: string
  check_in_date: string
  check_out_date: string
  accommodation_cost: number
  cleaning_fee: number
  tax_amount: number
  additional_fees: number
  additional_fees_description?: string
  total_amount: number
  payment_method: string
  status: 'draft' | 'sent' | 'paid' | 'cancelled'
  notes?: string
  sent_at?: string
  created_at: string
}

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [activeTab, setActiveTab] = useState<'bookings' | 'calendar' | 'reviews' | 'invoices' | 'settings'>('bookings')
  
  const [bookings, setBookings] = useState<Booking[]>([])
  const [dateBlocks, setDateBlocks] = useState<DateBlock[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(false)
  
  const [airbnbUrl, setAirbnbUrl] = useState('')
  const [lastSync, setLastSync] = useState<{ last_synced: string; ical_url: string } | null>(null)

  // Check authentication on mount
  useEffect(() => {
    const authToken = localStorage.getItem('admin_auth_spellbound')
    if (authToken === 'authenticated') {
      setIsAuthenticated(true)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      fetchAdminData()
      fetchLastSync()
    }
  }, [isAuthenticated, activeTab])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    const correctPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123'
    
    if (password === correctPassword) {
      localStorage.setItem('admin_auth_spellbound', 'authenticated')
      setIsAuthenticated(true)
      setAuthError('')
    } else {
      setAuthError('Incorrect password')
      setPassword('')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_auth_spellbound')
    setIsAuthenticated(false)
    setPassword('')
  }

  const fetchAdminData = async () => {
    try {
      const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123'
      const response = await fetch('/api/admin', {
        headers: {
          'Authorization': `Bearer ${adminPassword}`
        }
      })
      const data = await response.json()
      
      if (data.success) {
        setBookings(data.bookings || [])
        setDateBlocks(data.blocks || [])
        setReviews(data.reviews || [])
        setInvoices(data.invoices || [])
      }
    } catch (error) {
      console.error('Error fetching admin data:', error)
    }
  }

  const fetchLastSync = async () => {
    try {
      const response = await fetch('/api/airbnb-sync')
      const data = await response.json()
      if (data.success && data.lastSync) {
        setLastSync(data.lastSync)
        setAirbnbUrl(data.lastSync.ical_url || '')
      }
    } catch (error) {
      console.error('Error fetching last sync:', error)
    }
  }

  const handleSyncAirbnb = async () => {
    if (!airbnbUrl) {
      alert('Please enter Airbnb iCal URL')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/airbnb-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'sync',
          icalUrl: airbnbUrl
        })
      })

      const data = await response.json()
      
      if (data.success) {
        alert(`✅ Successfully synced ${data.bookedDates.length} Airbnb bookings!`)
        fetchAdminData()
        fetchLastSync()
      } else {
        // Show the actual error details from the API
        const errorMsg = data.details || data.error || 'Failed to sync Airbnb calendar'
        alert(`❌ Sync Failed:\n\n${errorMsg}\n\nPlease check:\n• Your iCal URL is correct\n• The URL is accessible\n• You have internet connection`)
        console.error('Sync error details:', data)
      }
    } catch (error) {
      console.error('Error syncing Airbnb:', error)
      alert(`❌ Network Error:\n\n${error instanceof Error ? error.message : 'An error occurred while syncing'}\n\nPlease check your internet connection and try again.`)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBlock = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    setLoading(true)
    try {
      const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123'
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminPassword}`
        },
        body: JSON.stringify({
          action: 'createBlock',
          data: {
            start_date: formData.get('start_date'),
            end_date: formData.get('end_date'),
            reason: formData.get('reason')
          }
        })
      })

      const data = await response.json()
      
      if (data.success) {
        alert('Date block created successfully!')
        fetchAdminData()
        e.currentTarget.reset()
      }
    } catch (error) {
      console.error('Error creating block:', error)
      alert('Failed to create date block')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteBlock = async (id: number) => {
    if (!confirm('Delete this date block?')) return

    setLoading(true)
    try {
      const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123'
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminPassword}`
        },
        body: JSON.stringify({
          action: 'deleteBlock',
          data: { id }
        })
      })

      const data = await response.json()
      
      if (data.success) {
        alert('Date block deleted!')
        fetchAdminData()
      }
    } catch (error) {
      console.error('Error deleting block:', error)
      alert('Failed to delete date block')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateReview = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    setLoading(true)
    try {
      const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123'
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminPassword}`
        },
        body: JSON.stringify({
          action: 'createReview',
          data: {
            name: formData.get('name'),
            rating: parseInt(formData.get('rating') as string),
            date: formData.get('date'),
            location: formData.get('location') || null,
            comment: formData.get('comment')
          }
        })
      })

      const data = await response.json()
      
      if (data.success) {
        alert('Review added successfully!')
        fetchAdminData()
        e.currentTarget.reset()
      }
    } catch (error) {
      console.error('Error creating review:', error)
      alert('Failed to create review')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteReview = async (id: number) => {
    if (!confirm('Delete this review?')) return

    setLoading(true)
    try {
      const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123'
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminPassword}`
        },
        body: JSON.stringify({
          action: 'deleteReview',
          data: { id }
        })
      })

      const data = await response.json()
      
      if (data.success) {
        alert('Review deleted!')
        fetchAdminData()
      }
    } catch (error) {
      console.error('Error deleting review:', error)
      alert('Failed to delete review')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateBookingStatus = async (id: number, status: string) => {
    setLoading(true)
    try {
      const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123'
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminPassword}`
        },
        body: JSON.stringify({
          action: 'updateBooking',
          data: {
            id,
            updates: { status }
          }
        })
      })

      const data = await response.json()
      
      if (data.success) {
        alert('Booking status updated!')
        fetchAdminData()
      }
    } catch (error) {
      console.error('Error updating booking:', error)
      alert('Failed to update booking')
    } finally {
      setLoading(false)
    }
  }

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Spellbound Haven Admin</h1>
            <p className="text-gray-600">Enter your password to access the dashboard</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter admin password"
                autoFocus
              />
            </div>
            
            {authError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {authError}
              </div>
            )}
            
            <button
              type="submit"
              className="w-full py-3 px-6 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-md transition duration-200"
            >
              Login
            </button>
          </form>
          
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Default password: admin123</p>
            <p className="mt-1">Change this with NEXT_PUBLIC_ADMIN_PASSWORD env var</p>
          </div>
        </div>
      </div>
    )
  }

  // Admin dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold">Spellbound Haven Admin</h1>
                <p className="text-purple-100 mt-1">Manage bookings, availability, and inquiries</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-purple-700 hover:bg-purple-800 rounded-lg text-sm font-medium transition"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('bookings')}
                className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'bookings'
                    ? 'border-b-2 border-purple-600 text-purple-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Users className="w-4 h-4" />
                Bookings ({bookings.length})
              </button>
              <button
                onClick={() => setActiveTab('calendar')}
                className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'calendar'
                    ? 'border-b-2 border-purple-600 text-purple-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Ban className="w-4 h-4" />
                Date Blocks ({dateBlocks.length})
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'reviews'
                    ? 'border-b-2 border-purple-600 text-purple-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Star className="w-4 h-4" />
                Reviews ({reviews.length})
              </button>
              <button
                onClick={() => setActiveTab('invoices')}
                className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'invoices'
                    ? 'border-b-2 border-purple-600 text-purple-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <FileText className="w-4 h-4" />
                Invoices ({invoices.length})
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'settings'
                    ? 'border-b-2 border-purple-600 text-purple-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Bookings Tab */}
            {activeTab === 'bookings' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">All Bookings</h2>
                <div className="overflow-x-auto">
                  {bookings.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No bookings yet</p>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Guest</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Check-in / Check-out</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Contact</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Guests</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Total</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Payment</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {bookings.map((booking) => (
                          <tr key={booking.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div className="font-medium text-gray-900">{booking.guest_name}</div>
                              {booking.notes && (
                                <div className="text-xs text-gray-500 mt-1">{booking.notes}</div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              <div>{booking.check_in_date}</div>
                              <div className="text-xs text-gray-500">to {booking.check_out_date}</div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              <div>{booking.guest_email}</div>
                              <div className="text-xs">{booking.guest_phone}</div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{booking.guests_count}</td>
                            <td className="px-4 py-3 text-sm font-semibold text-gray-900">${booking.total_price}</td>
                            <td className="px-4 py-3 text-sm">
                              <div className="space-y-1">
                                <div className="text-gray-600">{booking.payment_method || 'N/A'}</div>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                  booking.payment_status === 'paid'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {booking.payment_status || 'pending'}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <select
                                value={booking.status}
                                onChange={(e) => handleUpdateBookingStatus(booking.id, e.target.value)}
                                className={`text-xs px-2 py-1 rounded font-medium border ${
                                  booking.status === 'confirmed'
                                    ? 'bg-green-100 text-green-800 border-green-300'
                                    : booking.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                                    : booking.status === 'cancelled'
                                    ? 'bg-red-100 text-red-800 border-red-300'
                                    : 'bg-blue-100 text-blue-800 border-blue-300'
                                }`}
                              >
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="completed">Completed</option>
                              </select>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <button
                                onClick={() => {
                                  if (confirm(`Delete booking for ${booking.guest_name}?`)) {
                                    // Delete booking logic
                                  }
                                }}
                                className="text-red-600 hover:text-red-800 font-medium"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* Date Blocks Tab */}
            {activeTab === 'calendar' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Block Dates</h2>
                  <form onSubmit={handleCreateBlock} className="bg-gray-50 rounded-lg p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Start Date
                        </label>
                        <input
                          type="date"
                          name="start_date"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          End Date
                        </label>
                        <input
                          type="date"
                          name="end_date"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Reason
                        </label>
                        <input
                          type="text"
                          name="reason"
                          required
                          placeholder="e.g., Maintenance"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition disabled:bg-gray-400"
                    >
                      Block Dates
                    </button>
                  </form>

                  <div className="space-y-3">
                    {dateBlocks.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No date blocks</p>
                    ) : (
                      dateBlocks.map((block) => (
                        <div key={block.id} className="bg-white border border-gray-200 rounded-lg p-4 flex justify-between items-center">
                          <div>
                            <div className="font-medium text-gray-900">
                              {block.start_date} to {block.end_date}
                            </div>
                            <div className="text-sm text-gray-600">{block.reason}</div>
                          </div>
                          <button
                            onClick={() => handleDeleteBlock(block.id)}
                            className="text-red-600 hover:text-red-800 font-medium text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Manage Reviews</h2>
                  <form onSubmit={handleCreateReview} className="bg-gray-50 rounded-lg p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Guest Name *
                        </label>
                        <input
                          type="text"
                          name="name"
                          required
                          placeholder="John Doe"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Rating *
                        </label>
                        <select
                          name="rating"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="5">5 Stars</option>
                          <option value="4">4 Stars</option>
                          <option value="3">3 Stars</option>
                          <option value="2">2 Stars</option>
                          <option value="1">1 Star</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Date * (e.g., "June 2025")
                        </label>
                        <input
                          type="text"
                          name="date"
                          required
                          placeholder="June 2025"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Location (optional)
                        </label>
                        <input
                          type="text"
                          name="location"
                          placeholder="New York, New York"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Review Comment *
                      </label>
                      <textarea
                        name="comment"
                        required
                        rows={4}
                        placeholder="Write the guest's review here..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition disabled:bg-gray-400"
                    >
                      Add Review
                    </button>
                  </form>

                  <div className="space-y-3">
                    {reviews.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No reviews yet</p>
                    ) : (
                      reviews.map((review) => (
                        <div key={review.id} className="bg-white border border-gray-200 rounded-lg p-6">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold text-gray-900 text-lg">{review.name}</h3>
                                <div className="flex">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-4 h-4 ${
                                        i < review.rating
                                          ? 'text-yellow-400 fill-current'
                                          : 'text-gray-300'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <span>{review.date}</span>
                                {review.location && (
                                  <>
                                    <span>•</span>
                                    <span>{review.location}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteReview(review.id)}
                              className="text-red-600 hover:text-red-800 font-medium text-sm"
                            >
                              Delete
                            </button>
                          </div>
                          <p className="text-gray-700">{review.comment}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Invoices Tab */}
            {activeTab === 'invoices' && (
              <div className="space-y-8">
                {/* Create Invoice Form */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Create Invoice</h2>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        
                        const accommodationCost = parseFloat(formData.get('accommodation_cost') as string) || 0;
                        const cleaningFee = parseFloat(formData.get('cleaning_fee') as string) || 0;
                        const taxAmount = parseFloat(formData.get('tax_amount') as string) || 0;
                        const additionalFees = parseFloat(formData.get('additional_fees') as string) || 0;
                        const totalAmount = accommodationCost + cleaningFee + taxAmount + additionalFees;

                        const invoiceData = {
                          guest_name: formData.get('guest_name'),
                          guest_email: formData.get('guest_email'),
                          check_in_date: formData.get('check_in_date'),
                          check_out_date: formData.get('check_out_date'),
                          accommodation_cost: accommodationCost,
                          cleaning_fee: cleaningFee,
                          tax_amount: taxAmount,
                          additional_fees: additionalFees,
                          additional_fees_description: formData.get('additional_fees_description'),
                          total_amount: totalAmount,
                          payment_method: formData.get('payment_method'),
                          notes: formData.get('notes'),
                        };

                        try {
                          setLoading(true);
                          const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';
                          const response = await fetch('/api/invoices', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${adminPassword}`
                            },
                            body: JSON.stringify({
                              action: 'create',
                              data: invoiceData
                            })
                          });

                          const result = await response.json();
                          
                          if (result.success) {
                            alert('Invoice created successfully!');
                            e.currentTarget.reset();
                            fetchAdminData();
                          } else {
                            alert('Failed to create invoice: ' + (result.error || 'Unknown error'));
                          }
                        } catch (error) {
                          console.error('Error creating invoice:', error);
                          alert('Error creating invoice. Please try again.');
                        } finally {
                          setLoading(false);
                        }
                      }}
                      className="space-y-6"
                    >
                      {/* Guest Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Guest Name *
                          </label>
                          <input
                            type="text"
                            name="guest_name"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Guest Email *
                          </label>
                          <input
                            type="email"
                            name="guest_email"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      </div>

                      {/* Stay Dates */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Check-in Date *
                          </label>
                          <input
                            type="date"
                            name="check_in_date"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Check-out Date *
                          </label>
                          <input
                            type="date"
                            name="check_out_date"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      </div>

                      {/* Costs */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Accommodation Cost * ($)
                          </label>
                          <input
                            type="number"
                            name="accommodation_cost"
                            step="0.01"
                            min="0"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Cleaning Fee ($)
                          </label>
                          <input
                            type="number"
                            name="cleaning_fee"
                            step="0.01"
                            min="0"
                            defaultValue="0"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tax Amount ($)
                          </label>
                          <input
                            type="number"
                            name="tax_amount"
                            step="0.01"
                            min="0"
                            defaultValue="0"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Additional Fees ($)
                          </label>
                          <input
                            type="number"
                            name="additional_fees"
                            step="0.01"
                            min="0"
                            defaultValue="0"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Additional Fees Description
                        </label>
                        <input
                          type="text"
                          name="additional_fees_description"
                          placeholder="e.g., Pool heating, Late checkout"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>

                      {/* Payment Method */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Payment Method *
                        </label>
                        <select
                          name="payment_method"
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="">Select payment method</option>
                          <option value="Zelle">Zelle</option>
                          <option value="Venmo">Venmo</option>
                          <option value="Cash App">Cash App</option>
                          <option value="Bank Transfer">Bank Transfer</option>
                          <option value="Check">Check</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      {/* Notes */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Notes
                        </label>
                        <textarea
                          name="notes"
                          rows={3}
                          placeholder="Additional information or payment instructions..."
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400"
                      >
                        {loading ? 'Creating...' : 'Create Invoice'}
                      </button>
                    </form>
                  </div>
                </div>

                {/* Invoice List */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">All Invoices</h2>
                  <div className="overflow-x-auto">
                    {invoices.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No invoices yet</p>
                    ) : (
                      <table className="w-full">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Invoice #</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Guest</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Dates</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Total</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoices.map((invoice) => (
                            <tr key={invoice.id} className="border-b border-gray-200 hover:bg-gray-50">
                              <td className="px-4 py-4 text-sm text-gray-900 font-mono">
                                {invoice.invoice_number}
                              </td>
                              <td className="px-4 py-4">
                                <div className="text-sm font-medium text-gray-900">{invoice.guest_name}</div>
                                <div className="text-sm text-gray-500">{invoice.guest_email}</div>
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-600">
                                {new Date(invoice.check_in_date).toLocaleDateString()} -<br/>
                                {new Date(invoice.check_out_date).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-4 text-sm font-semibold text-gray-900">
                                ${Number(invoice.total_amount).toFixed(2)}
                              </td>
                              <td className="px-4 py-4">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                                  invoice.status === 'sent' ? 'bg-blue-100 text-blue-800' :
                                  invoice.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {invoice.status.toUpperCase()}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-sm">
                                <div className="flex gap-2">
                                  {invoice.status === 'draft' && (
                                    <button
                                      onClick={async () => {
                                        if (!confirm('Send this invoice to spellboundhaven.disney@gmail.com?')) return;
                                        try {
                                          setLoading(true);
                                          const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';
                                          const response = await fetch('/api/invoices', {
                                            method: 'POST',
                                            headers: {
                                              'Content-Type': 'application/json',
                                              'Authorization': `Bearer ${adminPassword}`
                                            },
                                            body: JSON.stringify({
                                              action: 'send',
                                              id: invoice.id,
                                              data: { send_to_guest: false }
                                            })
                                          });

                                          const result = await response.json();
                                          
                                          if (result.success) {
                                            alert('Invoice sent successfully to your email!');
                                            fetchAdminData();
                                          } else {
                                            alert('Failed to send invoice: ' + (result.error || 'Unknown error'));
                                          }
                                        } catch (error) {
                                          console.error('Error sending invoice:', error);
                                          alert('Error sending invoice. Please try again.');
                                        } finally {
                                          setLoading(false);
                                        }
                                      }}
                                      className="text-blue-600 hover:text-blue-800 font-medium"
                                    >
                                      Send
                                    </button>
                                  )}
                                  <button
                                    onClick={async () => {
                                      if (!confirm('Delete this invoice?')) return;
                                      try {
                                        setLoading(true);
                                        const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';
                                        const response = await fetch('/api/invoices', {
                                          method: 'POST',
                                          headers: {
                                            'Content-Type': 'application/json',
                                            'Authorization': `Bearer ${adminPassword}`
                                          },
                                          body: JSON.stringify({
                                            action: 'delete',
                                            id: invoice.id
                                          })
                                        });

                                        const result = await response.json();
                                        
                                        if (result.success) {
                                          alert('Invoice deleted successfully!');
                                          fetchAdminData();
                                        } else {
                                          alert('Failed to delete invoice: ' + (result.error || 'Unknown error'));
                                        }
                                      } catch (error) {
                                        console.error('Error deleting invoice:', error);
                                        alert('Error deleting invoice. Please try again.');
                                      } finally {
                                        setLoading(false);
                                      }
                                    }}
                                    className="text-red-600 hover:text-red-800 font-medium"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Airbnb Calendar Sync</h2>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">⏰</span>
                        <h3 className="font-semibold text-green-800">Automatic Daily Sync Enabled</h3>
                      </div>
                      <p className="text-sm text-green-700">
                        Your Airbnb calendar syncs automatically once per day at midnight (00:00 UTC) via Vercel Cron.
                        New bookings from Airbnb will be blocked on your website automatically!
                      </p>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Airbnb iCal URL
                      </label>
                      <input
                        type="url"
                        value={airbnbUrl}
                        onChange={(e) => setAirbnbUrl(e.target.value)}
                        placeholder="https://www.airbnb.com/calendar/ical/..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Get this URL from your Airbnb listing's availability settings
                      </p>
                    </div>
                    
                    <button
                      onClick={handleSyncAirbnb}
                      disabled={loading || !airbnbUrl}
                      className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition disabled:bg-gray-400"
                    >
                      {loading ? 'Syncing...' : 'Manual Sync Now'}
                    </button>

                    {lastSync && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <div className="text-sm">
                          <div className="font-medium text-blue-800 mb-1">Last Sync Status:</div>
                          <div className="text-blue-700">
                            🕐 {new Date(lastSync.last_synced).toLocaleString()}
                          </div>
                          <div className="text-xs text-blue-600 mt-2">
                            Next automatic sync: Tomorrow at midnight (00:00 UTC)
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">Environment Variables</h2>
                  <div className="bg-gray-50 rounded-lg p-6 space-y-3 text-sm">
                    <div>
                      <div className="font-medium text-gray-700">Required Environment Variables:</div>
                      <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600">
                        <li><code className="bg-gray-200 px-2 py-0.5 rounded">POSTGRES_URL</code> - Neon database URL</li>
                        <li><code className="bg-gray-200 px-2 py-0.5 rounded">RESEND_API_KEY</code> - Resend API key for emails</li>
                        <li><code className="bg-gray-200 px-2 py-0.5 rounded">HOST_EMAIL</code> - Your email for notifications</li>
                        <li><code className="bg-gray-200 px-2 py-0.5 rounded">NEXT_PUBLIC_ADMIN_PASSWORD</code> - Admin dashboard password</li>
                        <li><code className="bg-gray-200 px-2 py-0.5 rounded">CRON_SECRET</code> - Secret for Vercel Cron (generate with: openssl rand -base64 32)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

