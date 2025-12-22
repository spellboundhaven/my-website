'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react'

interface Review {
  id: number
  name: string
  rating: number
  date: string
  location?: string
  comment: string
}

export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const reviewsPerPage = 4

  useEffect(() => {
    fetchReviews()
  }, [])

  const fetchReviews = async () => {
    try {
      const response = await fetch('/api/reviews')
      const data = await response.json()
      if (data.success) {
        setReviews(data.reviews || [])
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 5

  const totalPages = Math.ceil(reviews.length / reviewsPerPage)
  const startIndex = currentPage * reviewsPerPage
  const endIndex = startIndex + reviewsPerPage
  const currentReviews = reviews.slice(startIndex, endIndex)

  const nextPage = () => {
    setCurrentPage((prev) => (prev + 1) % totalPages)
  }

  const prevPage = () => {
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages)
  }

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
            <div className="text-gray-500">
              "Perfect for large families and multigenerational vacations near Disney Orlando!"
            </div>
          </div>
        </div>

        {/* Reviews Carousel */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No reviews yet. Be the first to stay!</p>
          </div>
        ) : (
          <div className="relative mb-16">
            {/* Navigation Buttons */}
            {totalPages > 1 && (
              <>
                <button
                  onClick={prevPage}
                  className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-4 lg:-translate-x-12 z-10 bg-white hover:bg-gray-50 rounded-full p-3 transition-all duration-200 shadow-lg hover:scale-110"
                  aria-label="Previous reviews"
                >
                  <ChevronLeft className="w-6 h-6 text-gray-800" />
                </button>
                
                <button
                  onClick={nextPage}
                  className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-4 lg:translate-x-12 z-10 bg-white hover:bg-gray-50 rounded-full p-3 transition-all duration-200 shadow-lg hover:scale-110"
                  aria-label="Next reviews"
                >
                  <ChevronRight className="w-6 h-6 text-gray-800" />
                </button>
              </>
            )}

            {/* Reviews Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {currentReviews.map((review) => (
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

            {/* Page Indicators */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                {[...Array(totalPages)].map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPage(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-200 ${
                      index === currentPage
                        ? 'bg-primary-600 w-8'
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                    aria-label={`Go to page ${index + 1}`}
                  />
                ))}
              </div>
            )}

            {/* Page Counter */}
            {totalPages > 1 && (
              <p className="text-center text-sm text-gray-500 mt-4">
                Showing {startIndex + 1}-{Math.min(endIndex, reviews.length)} of {reviews.length} reviews
              </p>
            )}
          </div>
        )}

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
