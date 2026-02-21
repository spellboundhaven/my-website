'use client'

import Image from 'next/image'
import { Users, Bed, Bath, Waves, Home, Gamepad2, Baby, Shirt } from 'lucide-react'
import { propertyData } from '@/data/property'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Home, Bed, Waves, Gamepad2, Baby, WashingMachine: Shirt,
}

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
            <div className="text-2xl font-bold text-gray-900 mb-1">20</div>
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
            <a
              key={index}
              href="#gallery"
              className="group cursor-pointer block"
              onClick={(e) => {
                e.preventDefault()
                if (image.galleryId) {
                  window.dispatchEvent(new CustomEvent('navigate-gallery', { detail: image.galleryId }))
                }
                document.getElementById('gallery')?.scrollIntoView({ behavior: 'smooth' })
              }}
            >
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
            </a>
          ))}
        </div>

        {/* Key Features */}
        <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center font-serif">
          Key Features
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {propertyData.overview.featureGroups.map((group) => {
            const Icon = iconMap[group.icon] || Home
            return (
              <div key={group.title} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-primary-600" />
                  </div>
                  <h4 className="font-bold text-gray-900">{group.title}</h4>
                </div>
                <ul className="space-y-2">
                  {group.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-primary-400 mt-1">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
