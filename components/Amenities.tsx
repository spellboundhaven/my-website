'use client'

import { useState } from 'react'
import { propertyData } from '@/data/property'

export default function Amenities() {
  const [activeTab, setActiveTab] = useState('house')

  return (
    <section id="amenities" className="section-padding bg-gray-50">
      <div className="container-max">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 font-serif">
            Amenities
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover all the luxurious amenities that make Spellbound Haven the perfect large family vacation destination
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-12">
          <div className="bg-white rounded-lg p-2 shadow-sm">
            <button
              onClick={() => setActiveTab('house')}
              className={`px-8 py-3 rounded-md font-medium transition-colors duration-200 ${
                activeTab === 'house'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-700 hover:text-primary-600'
              }`}
            >
              House Amenities
            </button>
            <button
              onClick={() => setActiveTab('resort')}
              className={`px-8 py-3 rounded-md font-medium transition-colors duration-200 ${
                activeTab === 'resort'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-700 hover:text-primary-600'
              }`}
            >
              Resort Amenities
            </button>
          </div>
        </div>

        {/* Amenities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {activeTab === 'house' 
            ? propertyData.houseAmenities.map((amenity, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
                  <div className="text-4xl mb-4 text-center">{amenity.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 text-center">
                    {amenity.name}
                  </h3>
                  <p className="text-gray-600 text-center">
                    {amenity.description}
                  </p>
                </div>
              ))
            : propertyData.resortAmenities.map((amenity, index) => (
                <div key={index} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
                  <div className="text-4xl mb-4 text-center">{amenity.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 text-center">
                    {amenity.name}
                  </h3>
                  <p className="text-gray-600 text-center">
                    {amenity.description}
                  </p>
                </div>
              ))
          }
        </div>

        {/* Additional Information */}
        <div className="mt-16 bg-white rounded-lg shadow-sm p-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 font-serif">
              Additional Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-3xl mb-3">🕐</div>
                <h4 className="font-semibold text-gray-900 mb-2">Check-in/Check-out</h4>
                <p className="text-gray-600 text-sm">
                  Check-in: 4:00 PM<br />
                  Check-out: 11:00 AM
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-3">🚫</div>
                <h4 className="font-semibold text-gray-900 mb-2">House Rules</h4>
                <p className="text-gray-600 text-sm">
                  No smoking indoors<br />
                  No pets allowed<br />
                  No parties or events
                </p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-3">📞</div>
                <h4 className="font-semibold text-gray-900 mb-2">24/7 Support</h4>
                <p className="text-gray-600 text-sm">
                  On-site concierge<br />
                  Emergency contact<br />
                  Maintenance support
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}


