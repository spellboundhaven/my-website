'use client'

import { useState } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { propertyData } from '@/data/property'

export default function Gallery() {
  const [selectedRoom, setSelectedRoom] = useState(0)
  const [selectedImage, setSelectedImage] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedFloor, setSelectedFloor] = useState('outdoor')

  const rooms = propertyData.rooms
  
  // Group rooms by floor (excluding resort amenities - now in its own section)
  const roomsWithoutResort = rooms.filter(room => !room.name.includes('Windsor Island Resort'))
  const outdoorAreas = roomsWithoutResort.filter(room => room.name.includes('Outdoor') || room.name.includes('Pool'))
  const firstFloorRooms = roomsWithoutResort.filter(room => room.name.includes('First Floor') && !room.name.includes('Outdoor') && !room.name.includes('Pool'))
  const secondFloorRooms = roomsWithoutResort.filter(room => room.name.includes('Second Floor'))
  
  const getFilteredRooms = () => {
    switch(selectedFloor) {
      case 'first': return firstFloorRooms
      case 'second': return secondFloorRooms
      case 'outdoor': return outdoorAreas
      default: return outdoorAreas
    }
  }
  
  const filteredRooms = getFilteredRooms()

  // Function to handle floor selection and auto-select first room
  const handleFloorSelection = (floor: string) => {
    setSelectedFloor(floor)
    setSelectedRoom(0) // Always select the first room of the floor
    setSelectedImage(0) // Reset to first image
  }

  const openModal = (roomIndex: number, imageIndex: number) => {
    setSelectedRoom(roomIndex)
    setSelectedImage(imageIndex)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
  }

  const nextImage = () => {
    const currentRoom = filteredRooms[selectedRoom]
    if (currentRoom) {
      setSelectedImage((prev) => (prev + 1) % currentRoom.images.length)
    }
  }

  const prevImage = () => {
    const currentRoom = filteredRooms[selectedRoom]
    if (currentRoom) {
      setSelectedImage((prev) => (prev - 1 + currentRoom.images.length) % currentRoom.images.length)
    }
  }

  return (
    <section id="gallery" className="section-padding bg-white">
      <div className="container-max">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 font-serif">
            Gallery & Floor Plan
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Explore every corner of Spellbound Haven through our detailed gallery and floor plan
          </p>
        </div>

        {/* Floor Navigation */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <button
            onClick={() => handleFloorSelection('outdoor')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors duration-200 ${
              selectedFloor === 'outdoor'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Outdoor Areas
          </button>
          <button
            onClick={() => handleFloorSelection('first')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors duration-200 ${
              selectedFloor === 'first'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            First Floor
          </button>
          <button
            onClick={() => handleFloorSelection('second')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors duration-200 ${
              selectedFloor === 'second'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Second Floor
          </button>
          <button
            onClick={() => handleFloorSelection('floorplan')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors duration-200 ${
              selectedFloor === 'floorplan'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Floor Plan
          </button>
        </div>

        {/* Room Navigation - Only show if not floor plan */}
        {selectedFloor !== 'floorplan' && (
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {filteredRooms.map((room, index) => {
              return (
                <button
                  key={index}
                  onClick={() => setSelectedRoom(index)}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors duration-200 ${
                    selectedRoom === index
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {room.name.replace('First Floor - ', '').replace('Second Floor - ', '')}
                </button>
              )
            })}
          </div>
        )}

        {/* Floor Plan Display */}
        {selectedFloor === 'floorplan' ? (
          <div className="mb-12">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="text-center mb-6">
                  <h3 className="text-3xl font-bold text-gray-900 mb-4 font-serif">
                    Property Floor Plan
                  </h3>
                  <p className="text-lg text-gray-600">
                    Complete layout showing all 10 bedrooms, 8 bathrooms, and common areas
                  </p>
                </div>
                <div className="rounded-lg overflow-hidden">
                  <Image
                    src="/images/floorplan/floorplan.jpg"
                    alt="Spellbound Haven Floor Plan"
                    width={1811}
                    height={1898}
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Selected Room Display */
          <div className="mb-12">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-gray-900 mb-4 font-serif">
              {filteredRooms[selectedRoom]?.name}
            </h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {filteredRooms[selectedRoom]?.description}
            </p>
          </div>

          {/* Room Images Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRooms[selectedRoom]?.images.map((image, index) => (
              <div
                key={index}
                className="group cursor-pointer"
                onClick={() => openModal(selectedRoom, index)}
              >
                <div className="relative overflow-hidden rounded-lg shadow-lg">
                  <Image
                    src={image.src}
                    alt={image.alt}
                    width={400}
                    height={300}
                    className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="bg-white/90 rounded-full p-3">
                        <ChevronRight className="w-6 h-6 text-gray-800" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        )}
      </div>

      {/* Image Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="relative flex flex-col items-center">
            <button
              onClick={closeModal}
              className="absolute -top-12 right-0 z-10 bg-white/90 hover:bg-white rounded-full p-2 transition-colors duration-200"
            >
              <X className="w-6 h-6 text-gray-800" />
            </button>
            
            <div className="relative inline-block">
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-white/90 hover:bg-white rounded-full p-2 transition-colors duration-200"
              >
                <ChevronLeft className="w-6 h-6 text-gray-800" />
              </button>
              
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-white/90 hover:bg-white rounded-full p-2 transition-colors duration-200"
              >
                <ChevronRight className="w-6 h-6 text-gray-800" />
              </button>

              <Image
                src={filteredRooms[selectedRoom]?.images[selectedImage]?.src || ''}
                alt={filteredRooms[selectedRoom]?.images[selectedImage]?.alt || ''}
                width={800}
                height={600}
                className="max-w-[90vw] max-h-[75vh] w-auto h-auto object-contain rounded-lg"
              />
              
              <div className="bg-white rounded-b-lg px-6 py-3 text-center w-full">
                <p className="text-base font-medium text-gray-900 mb-1">
                  {filteredRooms[selectedRoom]?.images[selectedImage]?.alt || ''}
                </p>
                <p className="text-sm text-gray-600">
                  {selectedImage + 1} of {filteredRooms[selectedRoom]?.images.length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
