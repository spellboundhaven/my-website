'use client'

import { useState, useEffect } from 'react'
import { CalendarIcon, Users, DollarSign, Ban, Settings } from 'lucide-react'

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

interface PricingRule {
  id: number
  start_date: string
  end_date: string
  price_per_night: number
  minimum_stay: number
  rule_type: string
  created_at: string
}

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [activeTab, setActiveTab] = useState<'bookings' | 'calendar' | 'pricing' | 'settings'>('bookings')
  
  const [bookings, setBookings] = useState<Booking[]>([])
  const [dateBlocks, setDateBlocks] = useState<DateBlock[]>([])
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([])
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
        setPricingRules(data.rules || [])
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
        alert(`Successfully synced ${data.bookedDates.length} Airbnb bookings!`)
        fetchAdminData()
        fetchLastSync()
      } else {
        alert('Failed to sync Airbnb calendar')
      }
    } catch (error) {
      console.error('Error syncing Airbnb:', error)
      alert('An error occurred while syncing')
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

  const handleCreatePricing = async (e: React.FormEvent<HTMLFormElement>) => {
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
          action: 'createPricing',
          data: {
            start_date: formData.get('start_date'),
            end_date: formData.get('end_date'),
            price_per_night: parseFloat(formData.get('price_per_night') as string),
            minimum_stay: parseInt(formData.get('minimum_stay') as string),
            rule_type: formData.get('rule_type')
          }
        })
      })

      const data = await response.json()
      
      if (data.success) {
        alert('Pricing rule created successfully!')
        fetchAdminData()
        e.currentTarget.reset()
      }
    } catch (error) {
      console.error('Error creating pricing:', error)
      alert('Failed to create pricing rule')
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePricing = async (id: number) => {
    if (!confirm('Delete this pricing rule?')) return

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
          action: 'deletePricing',
          data: { id }
        })
      })

      const data = await response.json()
      
      if (data.success) {
        alert('Pricing rule deleted!')
        fetchAdminData()
      }
    } catch (error) {
      console.error('Error deleting pricing:', error)
      alert('Failed to delete pricing rule')
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
                <p className="text-purple-100 mt-1">Manage bookings, calendar, and pricing</p>
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
                onClick={() => setActiveTab('pricing')}
                className={`px-6 py-3 font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'pricing'
                    ? 'border-b-2 border-purple-600 text-purple-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                Pricing Rules ({pricingRules.length})
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

            {/* Pricing Tab */}
            {activeTab === 'pricing' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Pricing Rules</h2>
                  <form onSubmit={handleCreatePricing} className="bg-gray-50 rounded-lg p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                          Price/Night
                        </label>
                        <input
                          type="number"
                          name="price_per_night"
                          required
                          placeholder="450"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Min Stay
                        </label>
                        <input
                          type="number"
                          name="minimum_stay"
                          required
                          defaultValue={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Type
                        </label>
                        <select
                          name="rule_type"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="standard">Standard</option>
                          <option value="peak">Peak</option>
                          <option value="holiday">Holiday</option>
                        </select>
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition disabled:bg-gray-400"
                    >
                      Create Pricing Rule
                    </button>
                  </form>

                  <div className="space-y-3">
                    {pricingRules.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No pricing rules</p>
                    ) : (
                      pricingRules.map((rule) => (
                        <div key={rule.id} className="bg-white border border-gray-200 rounded-lg p-4 flex justify-between items-center">
                          <div className="flex-1 grid grid-cols-4 gap-4">
                            <div>
                              <div className="text-xs text-gray-500">Date Range</div>
                              <div className="font-medium text-gray-900 text-sm">
                                {rule.start_date} to {rule.end_date}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500">Price/Night</div>
                              <div className="font-semibold text-purple-600">${rule.price_per_night}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500">Min Stay</div>
                              <div className="font-medium text-gray-900">{rule.minimum_stay} nights</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500">Type</div>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                rule.rule_type === 'holiday'
                                  ? 'bg-red-100 text-red-800'
                                  : rule.rule_type === 'peak'
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {rule.rule_type}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDeletePricing(rule.id)}
                            className="ml-4 text-red-600 hover:text-red-800 font-medium text-sm"
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

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Airbnb Calendar Sync</h2>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">⏰</span>
                        <h3 className="font-semibold text-green-800">Automatic Hourly Sync Enabled</h3>
                      </div>
                      <p className="text-sm text-green-700">
                        Your Airbnb calendar syncs automatically every hour via Vercel Cron.
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
                            Next automatic sync: {new Date(new Date(lastSync.last_synced).getTime() + 3600000).toLocaleString()}
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
                        <li><code className="bg-gray-200 px-2 py-0.5 rounded">STRIPE_SECRET_KEY</code> - Stripe secret key</li>
                        <li><code className="bg-gray-200 px-2 py-0.5 rounded">STRIPE_WEBHOOK_SECRET</code> - Stripe webhook secret</li>
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

