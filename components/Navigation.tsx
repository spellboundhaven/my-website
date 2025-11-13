'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Menu, X } from 'lucide-react'

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)

  const navItems = [
    { name: 'Home', href: '#home' },
    { name: 'Overview', href: '#overview' },
    { name: 'Gallery', href: '#gallery' },
    { name: 'Amenities', href: '#amenities' },
    { name: 'Availability', href: '#availability' },
    { name: 'Reviews', href: '#reviews' },
    { name: 'Blog', href: '/blog' },
    { name: 'Contact', href: '#contact' },
  ]

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-sm shadow-sm">
      <div className="container-max">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <a href="#home" className="flex items-center gap-3">
              <Image
                src="/icon.png"
                alt="Spellbound Haven Logo"
                width={40}
                height={40}
                className="w-10 h-10"
              />
              <h1 className="text-2xl font-bold text-primary-600 font-serif">
                Spellbound Haven
              </h1>
            </a>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              {navItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-gray-700 hover:text-primary-600 px-3 py-2 text-sm font-medium transition-colors duration-200"
                >
                  {item.name}
                </a>
              ))}
            </div>
          </div>

          {/* CTA Button */}
          <div className="hidden md:block">
            <a
              href="#availability"
              className="btn-primary"
            >
              Book Now
            </a>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 hover:text-primary-600 focus:outline-none focus:text-primary-600"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
              {navItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-gray-700 hover:text-primary-600 block px-3 py-2 text-base font-medium transition-colors duration-200"
                  onClick={() => setIsOpen(false)}
                >
                  {item.name}
                </a>
              ))}
              <div className="pt-4">
                <a
                  href="#availability"
                  className="btn-primary w-full text-center block"
                  onClick={() => setIsOpen(false)}
                >
                  Book Now
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}


