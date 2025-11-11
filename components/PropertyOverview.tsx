'use client'

import Image from 'next/image'
import { CheckCircle, Users, Bed, Bath, Wifi, Car, Waves } from 'lucide-react'
import { propertyData } from '@/data/property'

export default function PropertyOverview() {
  return (
    <section id="overview" className="section-padding bg-gray-50">
      <div className="container-max">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 font-serif">
            Property Overview
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {propertyData.overview.summary}
          </p>
        </div>

        {/* Property Highlights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          <div className="bg-white p-6 rounded-lg shadow-sm text-center">
            <Users className="w-8 h-8 text-primary-600 mx-auto mb-3" />
            <div className="text-2xl font-bold text-gray-900 mb-1">22</div>
            <div className="text-sm text-gray-600">Guests</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm text-center">
            <Bed className="w-8 h-8 text-primary-600 mx-auto mb-3" />
            <div className="text-2xl font-bold text-gray-900 mb-1">10</div>
            <div className="text-sm text-gray-600">Bedrooms</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm text-center">
            <Bath className="w-8 h-8 text-primary-600 mx-auto mb-3" />
            <div className="text-2xl font-bold text-gray-900 mb-1">8</div>
            <div className="text-sm text-gray-600">Bathrooms</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm text-center">
            <Waves className="w-8 h-8 text-primary-600 mx-auto mb-3" />
            <div className="text-2xl font-bold text-gray-900 mb-1">Pool</div>
            <div className="text-sm text-gray-600">& Spa</div>
          </div>
        </div>

        {/* Property Images */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {propertyData.overview.images.map((image, index) => (
            <div key={index} className="group cursor-pointer">
              <div className="relative overflow-hidden rounded-lg shadow-lg">
                <Image
                  src={image.src}
                  alt={image.alt}
                  width={400}
                  height={300}
                  className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300"></div>
              </div>
              {image.caption && (
                <p className="text-sm text-gray-600 mt-3 text-center">
                  {image.caption}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Key Features */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center font-serif">
            Key Features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {propertyData.overview.highlights.map((feature, index) => (
              <div key={index} className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-700">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
