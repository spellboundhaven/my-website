'use client'

import { Phone, Mail } from 'lucide-react'
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
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
              <div className="text-5xl mb-4">📞</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Phone</h3>
              <p className="text-gray-600 text-sm mb-4">
                Speak directly with our team
              </p>
              <a 
                href={`tel:${propertyData.contact.phone}`} 
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                {propertyData.contact.phone}
              </a>
            </div>
            
            <div className="text-center bg-gray-50 rounded-lg p-8">
              <div className="text-5xl mb-4">📱</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">WhatsApp</h3>
              <p className="text-gray-600 text-sm mb-4">
                Quick responses for urgent inquiries
              </p>
              <a 
                href={`https://wa.me/${propertyData.contact.phone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Chat with us
              </a>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-12 text-center bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Phone className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-blue-900">Availability</span>
            </div>
            <p className="text-blue-800">{propertyData.contact.hours}</p>
          </div>

          <div className="mt-6 text-center bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Mail className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-blue-900">Location</span>
            </div>
            <p className="text-blue-800 mb-2">{propertyData.contact.address}</p>
            <p className="text-sm text-blue-700 mb-3">
              Just 9 miles from Disney World - approximately 15 minutes by car
            </p>
            <a 
              href="https://www.google.com/maps/search/?api=1&query=Windsor+Island+Resort+Orlando+FL"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-primary-600 hover:text-primary-700 font-medium text-sm"
            >
              View on Google Maps →
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
