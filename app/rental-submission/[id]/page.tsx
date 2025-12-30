'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { formatDateForDisplay } from '@/lib/utils'

interface Agreement {
  property_name: string
  property_address: string
  check_in_date: string
  check_out_date: string
  rental_terms: string
  total_amount?: string
  logo?: string
}

interface Vehicle {
  license_plate: string
  make: string
  model: string
  color: string
}

interface Submission {
  id: number
  agreement_id: string
  guest_name: string
  guest_email: string
  guest_phone: string
  guest_address?: string
  num_adults: number
  num_children: number
  vehicles?: Vehicle[]
  security_deposit_authorized: boolean
  electronic_signature_agreed: boolean
  signature_data: string
  check_in_date?: string
  check_out_date?: string
  submitted_at: string
}

export default function ViewRentalSubmission() {
  const params = useParams()
  const submissionId = params.id as string

  const [submission, setSubmission] = useState<Submission | null>(null)
  const [agreement, setAgreement] = useState<Agreement | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchSubmission()
  }, [submissionId])

  const fetchSubmission = async () => {
    try {
      const response = await fetch(`/api/rental-submission/${submissionId}`)
      if (!response.ok) {
        if (response.status === 404) {
          setError('Submission not found')
        } else {
          setError('Failed to load submission')
        }
        setLoading(false)
        return
      }
      const data = await response.json()
      setSubmission(data.submission)
      setAgreement(data.agreement)
      setLoading(false)
    } catch (err) {
      setError('Failed to load submission')
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (error || !submission || !agreement) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-orange-500 text-5xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Agreement Not Available</h1>
          <p className="text-gray-600 mb-4">
            {error || 'This signed agreement is no longer available.'}
          </p>
          <p className="text-sm text-gray-500">
            This submission has been removed by the host.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-800">Signed Rental Agreement</h1>
              <p className="text-gray-600 mt-2">Submitted on {new Date(submission.submitted_at).toLocaleString()}</p>
            </div>
            {agreement.logo && (
              <div className="ml-4">
                <img 
                  src={agreement.logo} 
                  alt="Property logo" 
                  className="h-24 w-auto max-w-[300px] object-contain"
                />
              </div>
            )}
          </div>

          {/* Property Information */}
          <div className="bg-indigo-50 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Property Information</h2>
            <div className="space-y-2">
              <p><span className="font-medium">Property:</span> {agreement.property_name}</p>
              <p><span className="font-medium">Address:</span> {agreement.property_address}</p>
              <p><span className="font-medium">Check-in:</span> {formatDateForDisplay(submission.check_in_date || agreement.check_in_date)}</p>
              <p><span className="font-medium">Check-out:</span> {formatDateForDisplay(submission.check_out_date || agreement.check_out_date)}</p>
              {agreement.total_amount && (
                <p><span className="font-medium">Total Amount:</span> {agreement.total_amount}</p>
              )}
            </div>
          </div>

          {/* Guest Information */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Guest Information</h2>
            <div className="space-y-2">
              <p><span className="font-medium">Name:</span> {submission.guest_name}</p>
              <p><span className="font-medium">Email:</span> {submission.guest_email}</p>
              <p><span className="font-medium">Phone:</span> {submission.guest_phone}</p>
              {submission.guest_address && (
                <p><span className="font-medium">Address:</span> {submission.guest_address}</p>
              )}
              <p><span className="font-medium">Guests:</span> {submission.num_adults} Adult(s), {submission.num_children} Child(ren)</p>
            </div>

            {/* Vehicle Information */}
            {submission.vehicles && submission.vehicles.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="font-medium mb-2">Vehicles:</p>
                <div className="space-y-2">
                  {submission.vehicles.map((vehicle, idx) => (
                    <div key={idx} className="text-sm bg-white p-3 rounded border border-gray-200">
                      <p><strong>Vehicle {idx + 1}:</strong></p>
                      <p>License Plate: {vehicle.license_plate || 'N/A'}</p>
                      <p>Make/Model: {vehicle.make || 'N/A'} {vehicle.model || ''}</p>
                      <p>Color: {vehicle.color || 'N/A'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Rental Terms */}
          {agreement.rental_terms && (
            <div className="bg-yellow-50 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Rental Terms & Conditions</h2>
              <div 
                className="text-sm text-gray-700 rental-terms-content"
                dangerouslySetInnerHTML={{ __html: agreement.rental_terms }}
              />
            </div>
          )}

          {/* Authorizations */}
          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Authorizations</h2>
            <div className="space-y-2">
              <p>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  submission.security_deposit_authorized ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {submission.security_deposit_authorized ? '✓' : '✗'} Security Deposit Authorized
                </span>
              </p>
              <p>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  submission.electronic_signature_agreed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {submission.electronic_signature_agreed ? '✓' : '✗'} Electronic Signature Agreement
                </span>
              </p>
            </div>
          </div>

          {/* Signature */}
          <div className="bg-green-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Guest Signature</h2>
            <div className="bg-white p-4 rounded border-2 border-gray-300">
              <img 
                src={submission.signature_data} 
                alt="Guest Signature" 
                className="max-w-full h-auto"
              />
            </div>
            <p className="text-xs text-gray-600 mt-3">
              Signed electronically on {new Date(submission.submitted_at).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              This electronic signature has the same legal effect as a handwritten signature.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

