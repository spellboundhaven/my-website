import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function PoliciesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container-max py-6">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="container-max py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8 font-serif text-center">
            Policies & Guidelines
          </h1>
          
          <div className="bg-white rounded-lg shadow-sm p-8 space-y-12">
            
            {/* House Rules */}
            <section id="house-rules">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 font-serif">
                House Rules
              </h2>
              <ul className="space-y-4 text-gray-700">
                <li className="flex gap-3">
                  <span className="text-primary-600 font-bold">•</span>
                  <span><strong>Max occupancy:</strong> Twenty (20) people.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary-600 font-bold">•</span>
                  <span><strong>Check-in:</strong> 4:00 PM | <strong>Check-out:</strong> 10:00 AM<br />
                  Early checkin and late checkout are subject to availability with a fee.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary-600 font-bold">•</span>
                  <span>No tampering with WiFi or other smart home devices.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary-600 font-bold">•</span>
                  <span>No smoking or vaping inside the home.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary-600 font-bold">•</span>
                  <span>No pets allowed.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary-600 font-bold">•</span>
                  <span>Up to three (3) vehicles only; additional vehicles may be approved upon request and subject to availability.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary-600 font-bold">•</span>
                  <span>Drugs are strictly prohibited.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary-600 font-bold">•</span>
                  <span>No parties or events without written permission.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary-600 font-bold">•</span>
                  <span>Registered guests only.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary-600 font-bold">•</span>
                  <span>Quiet hours are from 10:00 PM to 8:00 AM.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary-600 font-bold">•</span>
                  <span>Follow all posted pool safety guidelines.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary-600 font-bold">•</span>
                  <span className="font-semibold text-red-600">Violation of quiet hours, occupancy limits, or house rules may result in immediate termination of the stay without refund.</span>
                </li>
              </ul>
            </section>

            <hr className="border-gray-200" />

            {/* Cancellation Policy */}
            <section id="cancellation-policy">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 font-serif">
                Cancellation Policy
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  Cancellations are subject to the policy stated on the booking platform (e.g., Airbnb or VRBO).
                </p>
                <p>
                  If this agreement is executed outside of those platforms, cancellations made <strong>at least 60 days before check-in</strong> will receive a full refund minus processing fees and administrative fees. Cancellations made <strong>within 60 days are non-refundable</strong>.
                </p>
                <p>
                  <strong>Thanksgiving and Christmas bookings are non-refundable.</strong>
                </p>
              </div>
            </section>

            <hr className="border-gray-200" />

            {/* Security Deposit */}
            <section id="damage-security">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 font-serif">
                Security Deposit
              </h2>
              <ul className="space-y-4 text-gray-700">
                <li className="flex gap-3">
                  <span className="text-primary-600 font-bold">•</span>
                  <span>A security deposit is required and must be paid either at the time of booking or no later than seven (7) days prior to check-in.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary-600 font-bold">•</span>
                  <span>The security deposit will be refunded within five (5) days following check-out, provided there is no damage to the property and no violations of this Agreement.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary-600 font-bold">•</span>
                  <span>Guests are responsible for any damage to the property or its contents caused during their stay. The Owner reserves the right to withhold or charge for repairs, replacements, or excessive cleaning costs.</span>
                </li>
              </ul>
            </section>

            <hr className="border-gray-200" />

            {/* Parking */}
            <section id="parking">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 font-serif">
                Parking
              </h2>
              <ul className="space-y-4 text-gray-700">
                <li className="flex gap-3">
                  <span className="text-primary-600 font-bold">•</span>
                  <span>Free parking is available for up to three (3) vehicles in the driveway. Additional vehicles may be approved on a case-by-case basis if requested in advance.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary-600 font-bold">•</span>
                  <span><strong>Designated parking only:</strong> Vehicles must be parked in the driveway or approved street spaces. Parking on the grass or along Kaipo Road is prohibited and may result in towing by the community at the vehicle owner's expense.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary-600 font-bold">•</span>
                  <span><strong>Allowed parking:</strong> Driveway or designated street spaces only (follow street signs, park with the flow of traffic, and remain within 12 inches of the curb).</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary-600 font-bold">•</span>
                  <span><strong>Prohibited parking:</strong> Grass, sidewalks, lawns, blocking driveways, mailboxes, or fire lanes. No street parking on Kaipo Road.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary-600 font-bold">•</span>
                  <span><strong>Restricted vehicles:</strong> RVs, boats, trailers, campers, oversized vehicles, and ATVs are not permitted.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary-600 font-bold">•</span>
                  <span><strong>Golf carts:</strong> Must be HOA-approved (driver's license and insurance submitted at least two weeks prior). Park only in the driveway. Unapproved or improperly parked carts are subject to towing. Please contact the Owner for approval.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary-600 font-bold">•</span>
                  <span className="font-semibold text-red-600"><strong>Towing:</strong> Any vehicle parked in violation of community rules is subject to immediate towing at the Guest's expense. The Owner is not responsible for any towing fees, damages, or citations.</span>
                </li>
              </ul>
            </section>

            {/* Contact */}
            <div className="mt-12 bg-primary-50 border border-primary-200 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-primary-900 mb-2">
                Questions?
              </h3>
              <p className="text-primary-800">
                If you have any questions about our policies, please don't hesitate to{' '}
                <Link href="/#contact" className="font-semibold underline hover:text-primary-900">
                  contact us
                </Link>
                . We're here to help make your stay as smooth and enjoyable as possible.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

