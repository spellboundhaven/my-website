'use client'

import { ArrowDown, Calendar, MapPin, Star } from 'lucide-react'
import { propertyData } from '@/data/property'

export default function Hero() {
  return (
    <section id="home" className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${propertyData.hero.backgroundImage})`,
        }}
      >
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 font-serif">
          {propertyData.hero.title}
        </h1>
        <p className="text-xl md:text-2xl mb-8 text-gray-200">
          {propertyData.hero.subtitle}
        </p>
        <p className="text-lg mb-12 text-gray-300 max-w-2xl mx-auto">
          {propertyData.description}
        </p>
        
        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
          <a
            href="#availability"
            className="bg-white text-primary-600 hover:bg-gray-100 font-semibold py-4 px-8 rounded-lg text-lg transition-colors duration-200 shadow-lg"
          >
            {propertyData.hero.cta}
          </a>
          <a
            href="#overview"
            className="border-2 border-white text-white hover:bg-white hover:text-primary-600 font-semibold py-4 px-8 rounded-lg text-lg transition-colors duration-200"
          >
            Explore Property
          </a>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
          <div className="text-center">
            <div className="flex justify-center mb-2">
              <Star className="w-6 h-6 text-yellow-400 fill-current" />
              <Star className="w-6 h-6 text-yellow-400 fill-current" />
              <Star className="w-6 h-6 text-yellow-400 fill-current" />
              <Star className="w-6 h-6 text-yellow-400 fill-current" />
              <Star className="w-6 h-6 text-yellow-400 fill-current" />
            </div>
            <p className="text-sm font-medium">5.0 Rating</p>
          </div>
          <div className="text-center">
            <Calendar className="w-6 h-6 mx-auto mb-2" />
            <p className="text-sm font-medium">Available Year-Round</p>
          </div>
          <div className="text-center">
            <MapPin className="w-6 h-6 mx-auto mb-2" />
            <p className="text-sm font-medium">Near Disney World</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold mb-1">20</div>
            <p className="text-sm font-medium">Sleeps Up To</p>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <ArrowDown className="w-6 h-6 text-white" />
      </div>
    </section>
  )
}
