'use client'

import { propertyData } from '@/data/property'

export default function Contact() {
  return (
    <section id="contact" className="section-padding bg-white">
      <div className="container-max">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 font-serif">
            Contact Us
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Ready to book your stay or have questions? We're here to help make your vacation perfect
          </p>
        </div>

        {/* Contact Options */}
        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="text-center bg-gray-50 rounded-lg p-8">
              <div className="text-5xl mb-4">📧</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Email</h3>
              <p className="text-gray-600 text-sm mb-4">
                Detailed responses within 24 hours
              </p>
              <a 
                href={`mailto:${propertyData.contact.email}`} 
                className="text-primary-600 hover:text-primary-700 font-medium break-all"
              >
                {propertyData.contact.email}
              </a>
            </div>
            
            <div className="text-center bg-gray-50 rounded-lg p-8">
              <div className="text-5xl mb-4">💬</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Facebook Messenger</h3>
              <p className="text-gray-600 text-sm mb-4">
                Quick responses for urgent inquiries
              </p>
              <a 
                href="https://m.me/spellboundhaven.disney"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Message us
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
