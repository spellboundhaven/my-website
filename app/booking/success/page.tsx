'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle } from 'lucide-react'
import Link from 'next/link'

function BookingSuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (sessionId) {
      // Verify the session (optional)
      setTimeout(() => {
        setLoading(false)
      }, 1000)
    } else {
      setError(true)
      setLoading(false)
    }
  }, [sessionId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Confirming your booking...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Booking Error</h1>
          <p className="text-gray-600 mb-6">
            We couldn't verify your booking. Please contact us for assistance.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition"
          >
            Return Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full">
        <div className="text-center mb-8">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Booking Confirmed! 🎉</h1>
          <p className="text-gray-600">
            Thank you for choosing Spellbound Haven!
          </p>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">What's Next?</h2>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start">
              <span className="text-purple-600 font-bold mr-3">1.</span>
              <span>You'll receive a confirmation email with your booking details shortly</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-600 font-bold mr-3">2.</span>
              <span>Check-in instructions will be sent 24 hours before your arrival</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-600 font-bold mr-3">3.</span>
              <span>Access codes, parking info, and resort passes will be provided</span>
            </li>
            <li className="flex items-start">
              <span className="text-purple-600 font-bold mr-3">4.</span>
              <span>If you have any questions, we're here to help!</span>
            </li>
          </ul>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-yellow-800 mb-2">Important Information:</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Check-in time: 4:00 PM</li>
            <li>• Check-out time: 10:00 AM</li>
            <li>• Minimum 3-night stay required</li>
            <li>• Maximum 22 guests</li>
          </ul>
        </div>

        <div className="text-center">
          <Link
            href="/"
            className="inline-block px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition"
          >
            Return to Homepage
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-600">
          <p>Need help? Contact us at:</p>
          <p className="font-medium text-gray-800 mt-1">spellboundhaven.disney@gmail.com</p>
        </div>
      </div>
    </div>
  )
}

export default function BookingSuccess() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <BookingSuccessContent />
    </Suspense>
  )
}

