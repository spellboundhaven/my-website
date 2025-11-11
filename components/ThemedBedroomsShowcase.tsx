'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'

const themedBedrooms = [
  {
    name: "Mario Bros",
    image: "/images/rooms/themed/70.jpg",
    description: "Classic Nintendo adventure awaits"
  },
  {
    name: "Star Wars",
    image: "/images/rooms/themed/60.jpg", 
    description: "May the Force be with your dreams"
  },
  {
    name: "Encanto",
    image: "/images/rooms/themed/44.jpg",
    description: "Magical Colombian-inspired wonderland"
  },
  {
    name: "Harry Potter",
    image: "/images/rooms/themed/30.jpg",
    description: "Wizarding world magic comes alive"
  }
]

export default function ThemedBedroomsShowcase() {
  return (
    <section className="section-padding bg-gradient-to-br from-primary-50 to-white">
      <div className="container-max">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 font-serif"
          >
            Magical Themed Bedrooms
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-gray-600 max-w-3xl mx-auto mb-8"
          >
            Your kids will love sleeping in their favorite fantasy worlds! Each themed bedroom is carefully designed with authentic details and comfortable accommodations.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {themedBedrooms.map((bedroom, index) => (
            <motion.div
              key={bedroom.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={bedroom.image}
                  alt={`${bedroom.name} Themed Bedroom`}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-2xl font-bold text-white mb-1 font-serif">
                    {bedroom.name}
                  </h3>
                  <p className="text-white/90 text-sm">
                    {bedroom.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center"
        >
          <a 
            href="#gallery" 
            className="inline-flex items-center px-8 py-4 bg-primary-600 text-white font-semibold rounded-full hover:bg-primary-700 transition-colors duration-200 shadow-lg hover:shadow-xl"
          >
            View All Room Photos
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </motion.div>
      </div>
    </section>
  )
}

