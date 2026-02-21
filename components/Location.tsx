'use client'

import { Castle, Clapperboard, Fish, ShoppingBag, Plane, ShoppingCart } from 'lucide-react'

const distances = [
  { name: 'Walt Disney World®', distance: '9 miles', icon: Castle },
  { name: 'Universal Studios®', distance: '22 miles', icon: Clapperboard },
  { name: 'SeaWorld®', distance: '17 miles', icon: Fish },
  { name: 'Shopping Outlet', distance: '12 miles', icon: ShoppingBag },
  { name: 'Orlando Airport', distance: '29 miles', icon: Plane },
  { name: 'Supermarket', distance: '½ mile', icon: ShoppingCart },
]

export default function Location() {
  return (
    <section id="location" className="section-padding bg-white">
      <div className="container-max">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 font-serif">
            Location
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Centrally located near Orlando's top attractions
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 max-w-5xl mx-auto">
          {distances.map((item) => (
            <div key={item.name} className="text-center group">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-primary-50 flex items-center justify-center group-hover:bg-primary-100 transition-colors">
                <item.icon className="w-7 h-7 text-primary-600" />
              </div>
              <p className="font-semibold text-gray-900 text-sm leading-tight mb-1">{item.name}</p>
              <p className="text-primary-600 font-bold text-lg">{item.distance}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
