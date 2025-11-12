'use client'

import Image from 'next/image'
import { Star, Quote } from 'lucide-react'
import { propertyData } from '@/data/property'

export default function Reviews() {
  const reviews = propertyData.reviews
  const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length

  return (
    <section id="reviews" className="section-padding bg-gray-50">
      <div className="container-max">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 font-serif">
            Guest Reviews
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Hear what our guests have to say about their magical stay at Spellbound Haven
          </p>
        </div>

        {/* Overall Rating */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-16">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-8 h-8 ${
                    i < Math.floor(averageRating)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <div className="text-4xl font-bold text-gray-900 mb-2">
              {averageRating.toFixed(1)}
            </div>
            <div className="text-lg text-gray-600 mb-4">
              Based on {reviews.length} guest reviews
            </div>
            <div className="text-gray-500">
              "Perfect for Disney family vacations"
            </div>
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
              <div className="mb-4">
                <div className="font-semibold text-gray-900 mb-1">{review.name}</div>
                {review.location && (
                  <div className="text-sm text-gray-500 mb-2">{review.location}</div>
                )}
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < review.rating
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-sm text-gray-500">
                    {review.date}
                  </span>
                </div>
              </div>
              
              <div className="relative">
                <Quote className="absolute -top-2 -left-2 w-8 h-8 text-primary-200" />
                <p className="text-gray-700 italic pl-6">
                  "{review.comment}"
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Review Statistics */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center font-serif">
            What Guests Love Most
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-3">🏰</div>
              <div className="font-semibold text-gray-900 mb-1">Disney Access</div>
              <div className="text-sm text-gray-600">Just 9 miles to Disney World</div>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">🏊‍♀️</div>
              <div className="font-semibold text-gray-900 mb-1">Private Pool</div>
              <div className="text-sm text-gray-600">Pool and spa access</div>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">🎮</div>
              <div className="font-semibold text-gray-900 mb-1">Game Room</div>
              <div className="text-sm text-gray-600">Marvel arcade games</div>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">✨</div>
              <div className="font-semibold text-gray-900 mb-1">Cleanliness</div>
              <div className="text-sm text-gray-600">Immaculate condition</div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <h3 className="text-2xl font-bold text-gray-900 mb-4 font-serif">
            Ready to Experience Spellbound Haven?
          </h3>
          <p className="text-gray-600 mb-8">
            Join our satisfied guests and create your own magical memories
          </p>
          <a
            href="#availability"
            className="btn-primary text-lg px-8 py-4"
          >
            Book Your Stay Now
          </a>
        </div>
      </div>
    </section>
  )
}
