'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { propertyData } from '@/data/property'

export default function Amenities() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // Find the Windsor Island Resort room
  const resortRoom = propertyData.rooms.find(room => room.name.includes('Windsor Island Resort'))
  const images = resortRoom?.images || []

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  return (
    <section id="amenities" className="section-padding bg-gray-50">
      <div className="container-max">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 font-serif">
            Windsor Island Resort Amenities
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {resortRoom?.description}
          </p>
        </div>

        {/* Carousel */}
        <div className="max-w-5xl mx-auto">
          <div className="relative bg-white rounded-lg shadow-lg overflow-hidden">
            {/* Image Container */}
            <div className={`relative w-full ${
              images[currentImageIndex]?.src.includes('playground.jpg')
                ? 'aspect-[16/11]'
                : 'aspect-video'
            }`}>
              {images.length > 0 && (
                <>
                  {/* Current Image */}
                  <Image
                    src={images[currentImageIndex].src}
                    alt={images[currentImageIndex].alt}
                    fill
                    className="object-cover"
                    priority={currentImageIndex === 0}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                    quality={75}
                    unoptimized={images[currentImageIndex].src.includes('122.jpeg') || images[currentImageIndex].src.includes('125.jpg')}
                  />
                  
                  {/* Preload Only Next Image using link tag */}
                  {images.length > 1 && (
                    <link
                      rel="prefetch"
                      href={images[(currentImageIndex + 1) % images.length].src}
                      as="image"
                    />
                  )}
                </>
              )}
              
              {/* Navigation Buttons */}
              <button
                onClick={prevImage}
                className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 z-10 bg-white/90 hover:bg-white rounded-full p-2 sm:p-3 transition-all duration-200 shadow-lg hover:scale-110"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-800" />
              </button>
              
              <button
                onClick={nextImage}
                className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 z-10 bg-white/90 hover:bg-white rounded-full p-2 sm:p-3 transition-all duration-200 shadow-lg hover:scale-110"
                aria-label="Next image"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-gray-800" />
              </button>
            </div>

            {/* Image Info */}
            <div className="bg-white px-6 py-4 text-center">
              <p className="text-lg font-medium text-gray-900 mb-1">
                {images[currentImageIndex]?.alt}
              </p>
              <p className="text-sm text-gray-600">
                {currentImageIndex + 1} of {images.length}
              </p>
            </div>
          </div>

          {/* Thumbnail Dots */}
          <div className="flex justify-center gap-2 mt-6">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`w-3 h-3 rounded-full transition-all duration-200 ${
                  index === currentImageIndex
                    ? 'bg-primary-600 w-8'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>

          {/* Keyboard Instructions */}
          <p className="text-center text-sm text-gray-500 mt-6">
            Use arrow buttons or swipe to navigate through resort amenities
          </p>
        </div>
      </div>
    </section>
  )
}
