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
            
            {/* 1. House Rules */}
            <section id="house-rules">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 font-serif">
                1. House Rules
              </h2>
              <ul className="space-y-4 text-gray-700">
                <li className="flex gap-3">
                  <span className="text-primary-600 font-bold">•</span>
                  <span>Max occupancy twenty (20) people.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary-600 font-bold">•</span>
                  <span><strong>Check in:</strong> 4:00 PM; <strong>Check out:</strong> 10:00 AM; Early checkin and late checkout are subject to availability and fees will be applied if available.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary-600 font-bold">•</span>
                  <span>No tampering with Wifi or other smart home devices.</span>
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
                  <span>Registered adult guests only.</span>
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

            {/* 2. Cancellation Policy */}
            <section id="cancellation-policy">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 font-serif">
                2. Cancellation Policy
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  Cancellations are subject to the policy stated on the booking platform (e.g., Airbnb or VRBO).
                </p>
                <p>
                  If this agreement is executed outside of those platforms, cancellations made <strong>at least 60 days before check-in</strong> will receive a full refund minus the processing fees. Cancellations made <strong>within 60 days are non-refundable</strong>.
                </p>
              </div>
            </section>

            <hr className="border-gray-200" />

            {/* 3. Property Damage Protection */}
            <section id="damage-protection">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 font-serif">
                3. Property Damage Protection
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>Guests are required to select one of the following options prior to check-in:</p>
                <ul className="space-y-3 ml-4">
                  <li className="flex gap-3">
                    <span className="text-primary-600 font-bold">•</span>
                    <span><strong>$39 non-refundable damage protection fee,</strong> which covers accidental damages up to $1,500; or</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary-600 font-bold">•</span>
                    <span><strong>$500 refundable security deposit,</strong> which will be returned after checkout provided no damage or excessive cleaning is identified.</span>
                  </li>
                </ul>
                <p>
                  If the security deposit option is selected, the deposit must be processed either at the time of booking or no later than seven (7) days prior to check-in. The deposit will be refunded within five (5) days after checkout, provided there are no damages, missing items, or violations of this Agreement.
                </p>
                <p>
                  The Guest remains responsible for any damages that exceed coverage limits or fall outside the selected protection option. The Owner reserves the right to request reimbursement for repairs, replacements, or excessive cleaning costs.
                </p>
              </div>
            </section>

            <hr className="border-gray-200" />

            {/* 4. Parking */}
            <section id="parking">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 font-serif">
                4. Parking
              </h2>
              <ul className="space-y-4 text-gray-700">
                <li className="flex gap-3">
                  <span className="text-primary-600 font-bold">•</span>
                  <span>Free parking is available for up to three (3) vehicles in the driveway. Additional vehicles may be approved on a case-by-case basis if requested in advance.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary-600 font-bold">•</span>
                  <span><strong>Designated parking only:</strong> Vehicles must be parked in the driveway or approved street spaces. Parking on the grass or along Kaipo Road is prohibited and may result in towing by the community at the vehicle owner&#39;s expense.</span>
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
                  <span><strong>Golf carts:</strong> Must be HOA-approved (driver&#39;s license and insurance submitted at least two weeks prior). Park only in the driveway. Unapproved or improperly parked carts are subject to towing. Please contact the Owner for approval.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-primary-600 font-bold">•</span>
                  <span className="font-semibold text-red-600"><strong>Towing:</strong> Any vehicle parked in violation of community rules is subject to immediate towing at the Guest&#39;s expense. The Owner is not responsible for any towing fees, damages, or citations.</span>
                </li>
              </ul>
            </section>

            <hr className="border-gray-200" />

            {/* 5. Pest Control */}
            <section id="pest-control">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 font-serif">
                5. Pest Control
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  Please note that Florida has a tropical climate and is a natural habitat for insects. Spellbound Haven works with A1 Pest Control to provide ongoing professional pest management. While encounters are rare, it is possible for insects to occasionally enter the home. If you encounter an insect and are uncomfortable addressing it yourself, please contact us and our hospitality team will be happy to assist.
                </p>
              </div>
            </section>

            <hr className="border-gray-200" />

            {/* 6. Liability and Indemnification */}
            <section id="liability">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 font-serif">
                6. Liability and Indemnification
              </h2>
              <div className="space-y-6 text-gray-700">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">a. Use of the Property</h3>
                  <p>The Guest acknowledges and agrees that they are responsible for the safety and well-being of all individuals within the vacation rental property during the rental period. The Guest shall take all reasonable precautions to prevent accidents and adhere to all guidelines and rules provided by the Property Owner or Manager.</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">b. Assumption of Risk</h3>
                  <p>The Guest voluntarily assumes all risks associated with the use of the property and its amenities, including but not limited to pools, hot tubs, slides, arcades, or any other recreational facilities. The Guest understands that these amenities may pose inherent risks and agrees to use them at their own risk.</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">c. Supervision of Children</h3>
                  <p>The Guest acknowledges that slides, pools, and other recreational facilities require vigilant supervision for children. The Guest is solely responsible for ensuring that children are supervised at all times while using such facilities.</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">d. Maintenance of Equipment</h3>
                  <p>The Property Owner or Manager will make reasonable efforts to maintain all equipment, including slides and pool equipment, in safe working condition. The Guest agrees to promptly report any damage or malfunction to ensure timely repairs.</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">e. Proper Use of Pool Equipment</h3>
                  <p>The Guest agrees to use all pool equipment — including pumps, filters, and cleaning apparatus — only as intended. Misuse or unauthorized alterations are strictly prohibited.</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">f. Proper Use of Arcade Games</h3>
                  <p>The Guest agrees to use all arcade games responsibly and only for their intended purpose. Misuse or tampering with equipment is strictly prohibited.</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">g. Indemnification</h3>
                  <p>The Guest agrees to indemnify and hold harmless the Property Owner, Manager, and their agents from any claims, liabilities, damages, or expenses arising out of the Guest&#39;s use of the property or its amenities.</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">h. Release of Liability</h3>
                  <p>The Guest releases the Property Owner, Manager, and their agents from any liability for personal injury, loss, or damage to personal property arising out of the Guest&#39;s use of the vacation rental property and its recreational facilities.</p>
                </div>
                <p className="font-semibold">
                  By signing this Agreement, the Guest acknowledges that they have read and understood this liability clause and agree to abide by its terms.
                </p>
              </div>
            </section>

            <hr className="border-gray-200" />

            {/* 7. Pets & Service Animals */}
            <section id="pets-service-animals">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 font-serif">
                7. Pets &amp; Service Animals
              </h2>
              <div className="space-y-4 text-gray-700">
                <p><strong>Pets are NOT allowed in this home.</strong></p>
                <p>Exceptions are made only for verified service animals as defined by law. Emotional support animals or non-service pets are not permitted.</p>
                <p>Guests with service animals must ensure the animal:</p>
                <ul className="space-y-3 ml-4">
                  <li className="flex gap-3">
                    <span className="text-primary-600 font-bold">•</span>
                    <span>Guests are asked to inform the host in advance if they are bringing a service animal.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary-600 font-bold">•</span>
                    <span>Remain off all furniture (beds, couches, chairs) at all times.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary-600 font-bold">•</span>
                    <span>Under the ADA, service animals must be harnessed, leashed, or tethered, unless these devices interfere with the service animal&#39;s work or the individual&#39;s disability prevents using these devices. In that case, the individual must maintain control of the animal through voice, signal, or other effective controls. The animal must be under control of the handler at all times therefore never left alone at any time.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary-600 font-bold">•</span>
                    <span>Guests are responsible for any damage caused by the service animal.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary-600 font-bold">•</span>
                    <span>Service animals must not disturb neighbors.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary-600 font-bold">•</span>
                    <span>Host may ask for a brief description of the service tasks for safety planning.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary-600 font-bold">•</span>
                    <span>Guests must promptly pick up and properly dispose any waste by the service animal.</span>
                  </li>
                </ul>
                <p className="font-semibold text-red-600">
                  If we discover a guest has misrepresented a pet as a service animal, we reserve the right to seek financial restitution, report fraudulent claims to government authorities and to evict the guest(s) without further notice. In the latter case, there will be no right to a refund for unused rent.
                </p>
                <p>Any violation of these rules may result in fees or claims against the security deposit and more.</p>
              </div>
            </section>

            <hr className="border-gray-200" />

            {/* 8. Governing Law */}
            <section id="governing-law">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 font-serif">
                8. Governing Law
              </h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  This Agreement shall be governed by and construed in accordance with the laws of the State of Florida. Any disputes arising under this Agreement shall be resolved in the appropriate court located in Polk County, Florida.
                </p>
              </div>
            </section>

            {/* Contact */}
            <div className="mt-12 bg-primary-50 border border-primary-200 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-primary-900 mb-2">
                Questions?
              </h3>
              <p className="text-primary-800">
                If you have any questions about our policies, please don&#39;t hesitate to{' '}
                <Link href="/#contact" className="font-semibold underline hover:text-primary-900">
                  contact us
                </Link>
                . We&#39;re here to help make your stay as smooth and enjoyable as possible.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

