'use client'

import { useState, useEffect } from 'react'
import { CalendarIcon, Users, Ban, Settings, Star, FileText } from 'lucide-react'

// Helper function to format dates consistently (EST timezone, YYYY-MM-DD format)
function formatDateForDisplay(date: string | Date): string {
  if (typeof date === 'string') {
    // If it's an ISO timestamp string (e.g., "2026-01-17T00:00:00.000Z")
    if (date.includes('T')) {
      return date.split('T')[0]; // Extract just the date portion (YYYY-MM-DD)
    }
    // If it's already in YYYY-MM-DD format
    return date;
  }
  // If it's a Date object, extract just the date portion in local timezone
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

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
  payment_status?: 'unpaid' | 'initial_deposit_paid' | 'all_paid'
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

  const handleDeleteBooking = async (id: number) => {
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
          action: 'deleteBooking',
          data: { id }
        })
      })

      const data = await response.json()
      
      if (data.success) {
        alert('Inquiry deleted!')
        fetchAdminData()
      } else {
        alert('Failed to delete inquiry')
      }
    } catch (error) {
      console.error('Error deleting inquiry:', error)
      alert('Failed to delete inquiry')
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
                Inquiries ({bookings.length})
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
                <h2 className="text-2xl font-bold text-gray-800 mb-6">All Inquiries</h2>
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
                              <div>{formatDateForDisplay(booking.check_in_date)}</div>
                              <div className="text-xs text-gray-500">to {formatDateForDisplay(booking.check_out_date)}</div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              <div>{booking.guest_email}</div>
                              <div className="text-xs">{booking.guest_phone}</div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{booking.guests_count}</td>
                            <td className="px-4 py-3 text-sm">
                              <button
                                onClick={() => {
                                  if (confirm(`Delete inquiry from ${booking.guest_name}?`)) {
                                    handleDeleteBooking(booking.id);
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
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Block Dates</h2>
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          if (!confirm('Remove all duplicate date blocks?')) return;
                          try {
                            setLoading(true);
                            const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';
                            const response = await fetch('/api/cleanup-blocks', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${adminPassword}`
                              },
                              body: JSON.stringify({ action: 'remove-duplicates' })
                            });
                            const result = await response.json();
                            if (result.success) {
                              alert(result.message);
                              fetchAdminData();
                            } else {
                              alert('Error: ' + result.error);
                            }
                          } catch (error) {
                            console.error('Error:', error);
                            alert('Failed to remove duplicates');
                          } finally {
                            setLoading(false);
                          }
                        }}
                        disabled={loading}
                        className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded-lg font-medium transition disabled:bg-gray-400"
                      >
                        Remove Duplicates
                      </button>
                      <button
                        onClick={async () => {
                          if (!confirm('Clean up all past date blocks?')) return;
                          try {
                            setLoading(true);
                            const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';
                            const response = await fetch('/api/cleanup-blocks', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${adminPassword}`
                              },
                              body: JSON.stringify({ action: 'cleanup-past' })
                            });
                            const result = await response.json();
                            if (result.success) {
                              alert(result.message);
                              fetchAdminData();
                            } else {
                              alert('Error: ' + result.error);
                            }
                          } catch (error) {
                            console.error('Error:', error);
                            alert('Failed to cleanup past blocks');
                          } finally {
                            setLoading(false);
                          }
                        }}
                        disabled={loading}
                        className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded-lg font-medium transition disabled:bg-gray-400"
                      >
                        Clean Up Past
                      </button>
                      <button
                        onClick={async () => {
                          if (!confirm('Full cleanup: Remove duplicates AND past blocks?')) return;
                          try {
                            setLoading(true);
                            const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';
                            const response = await fetch('/api/cleanup-blocks', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${adminPassword}`
                              },
                              body: JSON.stringify({ action: 'full-cleanup' })
                            });
                            const result = await response.json();
                            if (result.success) {
                              alert(result.message);
                              fetchAdminData();
                            } else {
                              alert('Error: ' + result.error);
                            }
                          } catch (error) {
                            console.error('Error:', error);
                            alert('Failed to run full cleanup');
                          } finally {
                            setLoading(false);
                          }
                        }}
                        disabled={loading}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg font-medium transition disabled:bg-gray-400"
                      >
                        Full Cleanup
                      </button>
                    </div>
                  </div>
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
                              {formatDateForDisplay(block.start_date)} to {formatDateForDisplay(block.end_date)}
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
                        const form = e.currentTarget;
                        const formData = new FormData(form);
                        
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
                          payment_status: formData.get('payment_status'),
                          initial_deposit_percentage: formData.get('initial_deposit_percentage'),
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
                            form.reset();
                            fetchAdminData();
                          } else {
                            const errorMsg = result.details || result.error || 'Unknown error';
                            alert('Failed to create invoice: ' + errorMsg);
                          }
                        } catch (error) {
                          console.error('Error creating invoice:', error);
                          const errorMsg = error instanceof Error ? error.message : String(error);
                          alert('Error creating invoice: ' + errorMsg);
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

                      {/* Tax Calculator */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <h3 className="text-lg font-semibold text-blue-900 mb-4">💡 Calculate from Total Amount</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Total Amount (including tax) ($)
                            </label>
                            <input
                              type="number"
                              id="total_with_tax"
                              step="0.01"
                              min="0"
                              placeholder="e.g., 2060"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <button
                              type="button"
                              onClick={() => {
                                const form = document.querySelector('form') as HTMLFormElement;
                                const totalWithTax = parseFloat((document.getElementById('total_with_tax') as HTMLInputElement).value || '0');
                                const cleaningFee = parseFloat((form.elements.namedItem('cleaning_fee') as HTMLInputElement).value || '400');
                                const additionalFees = parseFloat((form.elements.namedItem('additional_fees') as HTMLInputElement).value || '0');
                                
                                if (totalWithTax > 0) {
                                  // Calculate: Total = (Accommodation + Cleaning + Additional) × 1.12
                                  // So: (Accommodation + Cleaning + Additional) = Total / 1.12
                                  const subtotal = totalWithTax / 1.12;
                                  const accommodationCost = subtotal - cleaningFee - additionalFees;
                                  const taxAmount = totalWithTax - subtotal;
                                  
                                  // Fill in the form fields
                                  (form.elements.namedItem('accommodation_cost') as HTMLInputElement).value = accommodationCost.toFixed(2);
                                  (form.elements.namedItem('tax_amount') as HTMLInputElement).value = taxAmount.toFixed(2);
                                  
                                  alert(`Calculated:\nAccommodation: $${accommodationCost.toFixed(2)}\nCleaning Fee: $${cleaningFee.toFixed(2)}\nAdditional Fees: $${additionalFees.toFixed(2)}\nTax (12%): $${taxAmount.toFixed(2)}\nTotal: $${totalWithTax.toFixed(2)}`);
                                } else {
                                  alert('Please enter a total amount');
                                }
                              }}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition"
                            >
                              Calculate from Total
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                          Enter your total amount (with tax), and we'll calculate the accommodation cost and tax (12%) for you.
                        </p>
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
                            defaultValue="400"
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

                      {/* Payment Method & Payment Status */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Payment Status *
                          </label>
                          <select
                            name="payment_status"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="unpaid">Unpaid</option>
                            <option value="initial_deposit_paid">Initial Deposit Paid</option>
                            <option value="all_paid">All Paid</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Initial Deposit (%)
                          </label>
                          <input
                            type="number"
                            name="initial_deposit_percentage"
                            min="0"
                            max="100"
                            defaultValue="30"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="30"
                          />
                        </div>
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
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Payment Status</th>
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
                                {formatDateForDisplay(invoice.check_in_date)} -<br/>
                                {formatDateForDisplay(invoice.check_out_date)}
                              </td>
                              <td className="px-4 py-4 text-sm font-semibold text-gray-900">
                                ${Number(invoice.total_amount).toFixed(2)}
                              </td>
                              <td className="px-4 py-4">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  invoice.payment_status === 'all_paid' ? 'bg-green-100 text-green-800' :
                                  invoice.payment_status === 'initial_deposit_paid' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {String(invoice.payment_status || 'unpaid').replace(/_/g, ' ').toUpperCase()}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-sm">
                                <div className="flex gap-2">
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
                                  <button
                                    onClick={async () => {
                                      try {
                                        setLoading(true);
                                        
                                        // Dynamically import jspdf and html2canvas
                                        const { default: jsPDF } = await import('jspdf');
                                        const { default: html2canvas } = await import('html2canvas');
                                        
                                        // Fetch the invoice HTML
                                        const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';
                                        const response = await fetch(`/api/invoices/${invoice.id}/html`, {
                                          headers: {
                                            'Authorization': `Bearer ${adminPassword}`
                                          }
                                        });
                                        
                                        if (!response.ok) {
                                          throw new Error('Failed to fetch invoice');
                                        }
                                        
                                        const html = await response.text();
                                        
                                        // Create a temporary container
                                        const container = document.createElement('div');
                                        container.style.position = 'absolute';
                                        container.style.left = '-9999px';
                                        container.style.width = '800px';
                                        container.style.padding = '20px 0';
                                        container.innerHTML = html;
                                        document.body.appendChild(container);
                                        
                                        // Wait for content to render
                                        await new Promise(resolve => setTimeout(resolve, 100));
                                        
                                        // Convert to canvas with lower scale for smaller file size
                                        const canvas = await html2canvas(container, {
                                          scale: 1.5,
                                          useCORS: true,
                                          logging: false,
                                          windowHeight: container.scrollHeight + 100,
                                          height: container.scrollHeight + 100
                                        });
                                        
                                        // Remove temporary container
                                        document.body.removeChild(container);
                                        
                                        // Create PDF
                                        const pdf = new jsPDF({
                                          orientation: 'portrait',
                                          unit: 'mm',
                                          format: 'a4'
                                        });
                                        
                                        const margin = 10; // 10mm margin on all sides
                                        const pageWidth = 210; // A4 width in mm
                                        const pageHeight = 297; // A4 height in mm
                                        const imgWidth = pageWidth - (margin * 2); // Width with margins
                                        const imgHeight = (canvas.height * imgWidth) / canvas.width;
                                        
                                        // Use JPEG for better compression
                                        const imgData = canvas.toDataURL('image/jpeg', 0.85);
                                        
                                        // If content is taller than one page, split into multiple pages
                                        const availableHeight = pageHeight - (margin * 2);
                                        let heightLeft = imgHeight;
                                        let position = margin; // Start with top margin
                                        
                                        // First page
                                        pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight);
                                        heightLeft -= availableHeight;
                                        
                                        // Add more pages if needed
                                        while (heightLeft > 0) {
                                          position = margin - (imgHeight - heightLeft);
                                          pdf.addPage();
                                          pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight);
                                          heightLeft -= availableHeight;
                                        }
                                        
                                        pdf.save(`Invoice-${invoice.invoice_number}.pdf`);
                                        
                                      } catch (error) {
                                        console.error('Error downloading invoice:', error);
                                        alert('Error downloading invoice. Please try again.');
                                      } finally {
                                        setLoading(false);
                                      }
                                    }}
                                    className="text-green-600 hover:text-green-800 font-medium"
                                  >
                                    Download
                                  </button>
                                  <button
                                    onClick={() => {
                                      const newStatus = prompt(
                                        `Update payment status for ${invoice.invoice_number}\n\nEnter:\n1 = Unpaid\n2 = Initial Deposit Paid\n3 = All Paid`,
                                        invoice.payment_status === 'all_paid' ? '3' : 
                                        invoice.payment_status === 'initial_deposit_paid' ? '2' : '1'
                                      );
                                      
                                      if (!newStatus) return;
                                      
                                      const statusMap: { [key: string]: string } = {
                                        '1': 'unpaid',
                                        '2': 'initial_deposit_paid',
                                        '3': 'all_paid'
                                      };
                                      
                                      const paymentStatus = statusMap[newStatus];
                                      
                                      if (!paymentStatus) {
                                        alert('Invalid selection. Please enter 1, 2, or 3.');
                                        return;
                                      }
                                      
                                      (async () => {
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
                                              action: 'update',
                                              id: invoice.id,
                                              data: { payment_status: paymentStatus }
                                            })
                                          });

                                          const result = await response.json();
                                          
                                          if (result.success) {
                                            alert('Payment status updated successfully!');
                                            fetchAdminData();
                                          } else {
                                            alert('Failed to update: ' + (result.error || 'Unknown error'));
                                          }
                                        } catch (error) {
                                          console.error('Error updating invoice:', error);
                                          alert('Error updating invoice. Please try again.');
                                        } finally {
                                          setLoading(false);
                                        }
                                      })();
                                    }}
                                    className="text-purple-600 hover:text-purple-800 font-medium"
                                  >
                                    Edit
                                  </button>
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

