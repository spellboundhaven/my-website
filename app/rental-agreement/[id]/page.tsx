'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import SignaturePad from '@/components/SignaturePad'
import { formatDateForDisplay } from '@/lib/utils'
import RichTextContent from '@/components/RichTextContent'

interface Agreement {
  id: string
  property_name: string
  property_address: string
  check_in_date: string
  check_out_date: string
  rental_terms: string
  total_amount?: string
  security_deposit?: string
  logo?: string
}

export default function RentalAgreementForm() {
  const params = useParams()
  const router = useRouter()
  const agreementId = params.id as string

  const [agreement, setAgreement] = useState<Agreement | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const [formData, setFormData] = useState({
    guest_first_name: '',
    guest_last_name: '',
    guest_email: '',
    guest_phone: '',
    guest_address: '',
    num_adults: '',
    num_children: '',
    additional_adults: [{ first_name: '', last_name: '' }],
    vehicles: [{ license_plate: '', make: '', model: '', color: '' }],
    security_deposit_authorized: false,
    electronic_signature_agreed: false,
    signature: '',
  })

  useEffect(() => {
    fetchAgreement()
  }, [agreementId])

  const fetchAgreement = async () => {
    try {
      const response = await fetch(`/api/rental-agreements/${agreementId}`)
      if (!response.ok) {
        if (response.status === 404) {
          setError('Agreement not found')
        } else if (response.status === 410) {
          setError('This agreement link has expired')
        } else {
          setError('Failed to load agreement')
        }
        setLoading(false)
        return
      }
      const data = await response.json()
      setAgreement(data.agreement)
      setLoading(false)
    } catch (err) {
      setError('Failed to load agreement')
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleVehicleChange = (index: number, field: string, value: string) => {
    const newVehicles = [...formData.vehicles]
    newVehicles[index] = { ...newVehicles[index], [field]: value }
    setFormData(prev => ({ ...prev, vehicles: newVehicles }))
  }

  const addVehicle = () => {
    if (formData.vehicles.length < 5) {
      setFormData(prev => ({
        ...prev,
        vehicles: [...prev.vehicles, { license_plate: '', make: '', model: '', color: '' }]
      }))
    }
  }

  const removeVehicle = (index: number) => {
    if (formData.vehicles.length > 1) {
      setFormData(prev => ({
        ...prev,
        vehicles: prev.vehicles.filter((_, i) => i !== index)
      }))
    }
  }

  const handleAdditionalAdultChange = (index: number, field: string, value: string) => {
    const newAdults = [...formData.additional_adults]
    newAdults[index] = { ...newAdults[index], [field]: value }
    setFormData(prev => ({ ...prev, additional_adults: newAdults }))
  }

  const addAdditionalAdult = () => {
    if (formData.additional_adults.length < 20) {
      setFormData(prev => ({
        ...prev,
        additional_adults: [...prev.additional_adults, { first_name: '', last_name: '' }]
      }))
    }
  }

  const removeAdditionalAdult = (index: number) => {
    if (formData.additional_adults.length > 1) {
      setFormData(prev => ({
        ...prev,
        additional_adults: prev.additional_adults.filter((_, i) => i !== index)
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    if (!formData.signature) {
      setError('Please provide your signature')
      setSubmitting(false)
      return
    }

    if (agreement?.security_deposit && !formData.security_deposit_authorized) {
      setError('Please authorize the security deposit to continue')
      setSubmitting(false)
      return
    }

    if (!formData.electronic_signature_agreed) {
      setError('Please agree to sign the agreement electronically')
      setSubmitting(false)
      return
    }

    try {
      const response = await fetch('/api/rental-submissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agreement_id: agreementId,
          guest_name: `${formData.guest_first_name} ${formData.guest_last_name}`.trim(),
          guest_email: formData.guest_email,
          guest_phone: formData.guest_phone,
          guest_address: formData.guest_address,
          num_adults: parseInt(formData.num_adults),
          num_children: parseInt(formData.num_children),
          additional_adults: formData.additional_adults
            .filter(a => a.first_name.trim() || a.last_name.trim())
            .map(a => ({ name: `${a.first_name} ${a.last_name}`.trim() })),
          vehicles: formData.vehicles.filter(v => v.license_plate || v.make || v.model || v.color),
          security_deposit_authorized: formData.security_deposit_authorized,
          electronic_signature_agreed: formData.electronic_signature_agreed,
          signature_data: formData.signature,
          check_in_date: agreement?.check_in_date,
          check_out_date: agreement?.check_out_date,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit agreement')
      }

      setSubmitted(true)
    } catch (err) {
      setError('Failed to submit agreement. Please try again.')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading agreement...</p>
        </div>
      </div>
    )
  }

  if (error && !agreement) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-green-500 text-5xl mb-4">✓</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Agreement Signed!</h1>
          <p className="text-gray-600 mb-6">
            Thank you for signing the rental agreement. Your submission has been received and confirmation emails have been sent to both you and the host.
          </p>
          <p className="text-sm text-gray-500">
            Please check your email for a copy of the signed agreement. You can now close this window.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-800">Rental Agreement</h1>
              <p className="text-gray-600 mt-2">Please review and sign the rental agreement below</p>
            </div>
            {agreement?.logo && (
              <div className="ml-4">
                <img 
                  src={agreement.logo} 
                  alt="Property logo" 
                  className="h-24 w-auto max-w-[300px] object-contain"
                />
              </div>
            )}
          </div>
          <div className="mb-8"></div>

          {/* Property Information */}
          <div className="bg-indigo-50 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Property Information</h2>
            <div className="space-y-2">
              <p><span className="font-medium">Property:</span> {agreement?.property_name}</p>
              <p><span className="font-medium">Address:</span> {agreement?.property_address}</p>
              <p><span className="font-medium">Check-in:</span> {formatDateForDisplay(agreement?.check_in_date || '')}</p>
              <p><span className="font-medium">Check-out:</span> {formatDateForDisplay(agreement?.check_out_date || '')}</p>
              {agreement?.total_amount && (
                <p><span className="font-medium">Total Amount:</span> {agreement.total_amount}</p>
              )}
            </div>
            {agreement?.rental_terms && (
              <div className="mt-4 pt-4 border-t border-indigo-200">
                <p className="font-medium mb-2">Rental Terms:</p>
                <RichTextContent html={agreement.rental_terms} className="text-sm text-gray-700" />
              </div>
            )}
          </div>

          {/* Guest Information Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Guest Information</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="guest_first_name"
                      required
                      value={formData.guest_first_name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="guest_last_name"
                      required
                      value={formData.guest_last_name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="guest_email"
                    required
                    value={formData.guest_email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="guest_phone"
                    required
                    value={formData.guest_phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Home Address *
                  </label>
                  <input
                    type="text"
                    name="guest_address"
                    required
                    value={formData.guest_address}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Number of Adults *
                    </label>
                    <input
                      type="number"
                      name="num_adults"
                      required
                      min="1"
                      value={formData.num_adults}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Number of Children *
                    </label>
                    <input
                      type="number"
                      name="num_children"
                      required
                      min="0"
                      value={formData.num_children}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Additional Adults */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Adult Names (Optional)
                  </label>
                  <p className="text-xs text-gray-500 mb-3">Add names of other adults staying at the property (up to 20)</p>
                  <div className="space-y-3">
                    {formData.additional_adults.map((adult, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={adult.first_name}
                          onChange={(e) => handleAdditionalAdultChange(index, 'first_name', e.target.value)}
                          placeholder="First name"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                        <input
                          type="text"
                          value={adult.last_name}
                          onChange={(e) => handleAdditionalAdultChange(index, 'last_name', e.target.value)}
                          placeholder="Last name"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                        {formData.additional_adults.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeAdditionalAdult(index)}
                            className="text-sm text-red-600 hover:text-red-800 px-2 whitespace-nowrap"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    {formData.additional_adults.length < 20 && (
                      <button
                        type="button"
                        onClick={addAdditionalAdult}
                        className="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-indigo-500 hover:text-indigo-600 transition duration-200"
                      >
                        + Add Another Adult
                      </button>
                    )}
                  </div>
                </div>

                {/* Vehicle Information */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vehicle Information (Optional)
                  </label>
                  <p className="text-xs text-gray-500 mb-3">Add up to 5 vehicles</p>
                  <div className="space-y-4">
                    {formData.vehicles.map((vehicle, index) => (
                      <div key={index} className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="text-sm font-medium text-gray-700">Vehicle {index + 1}</h4>
                          {formData.vehicles.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeVehicle(index)}
                              className="text-sm text-red-600 hover:text-red-800"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              License Plate
                            </label>
                            <input
                              type="text"
                              value={vehicle.license_plate}
                              onChange={(e) => handleVehicleChange(index, 'license_plate', e.target.value)}
                              placeholder="ABC-1234"
                              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Make
                            </label>
                            <input
                              type="text"
                              value={vehicle.make}
                              onChange={(e) => handleVehicleChange(index, 'make', e.target.value)}
                              placeholder="Toyota"
                              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Model
                            </label>
                            <input
                              type="text"
                              value={vehicle.model}
                              onChange={(e) => handleVehicleChange(index, 'model', e.target.value)}
                              placeholder="Camry"
                              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Color
                            </label>
                            <input
                              type="text"
                              value={vehicle.color}
                              onChange={(e) => handleVehicleChange(index, 'color', e.target.value)}
                              placeholder="Silver"
                              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    {formData.vehicles.length < 5 && (
                      <button
                        type="button"
                        onClick={addVehicle}
                        className="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-indigo-500 hover:text-indigo-600 transition duration-200"
                      >
                        + Add Another Vehicle
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Security Deposit Authorization */}
            {agreement?.security_deposit && (
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Security Deposit</h2>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <label className="flex items-start cursor-pointer">
                    <input
                      type="checkbox"
                      name="security_deposit_authorized"
                      required
                      checked={formData.security_deposit_authorized}
                      onChange={(e) => setFormData(prev => ({ ...prev, security_deposit_authorized: e.target.checked }))}
                      className="mt-1 h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="ml-3 text-gray-700">
                      I authorize the host to hold a refundable <strong>${agreement.security_deposit} security deposit</strong>. 
                      I understand this deposit will be refunded within <strong>5 days</strong> after checkout, 
                      provided there is no damage to the property. *
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Electronic Signature Agreement */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Electronic Signature Agreement</h2>
              <p className="text-sm text-gray-600 mb-3">
                I understand that my electronic signature has the same legal effect as a handwritten signature 
                and that by signing below, I agree to all terms and conditions of this Agreement.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <label className="flex items-start cursor-pointer">
                  <input
                    type="checkbox"
                    name="electronic_signature_agreed"
                    required
                    checked={formData.electronic_signature_agreed}
                    onChange={(e) => setFormData(prev => ({ ...prev, electronic_signature_agreed: e.target.checked }))}
                    className="mt-1 h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-3 text-gray-700">
                    I agree to sign this Rental Agreement electronically. *
                  </span>
                </label>
              </div>
            </div>

            {/* Signature */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Your Signature *</h2>
              <p className="text-sm text-gray-600 mb-4">
                By signing below, you agree to the terms and conditions of the rental agreement.
              </p>
              <SignaturePad onSignatureChange={(sig) => setFormData(prev => ({ ...prev, signature: sig }))} />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
            >
              {submitting ? 'Submitting...' : 'Sign Agreement'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

