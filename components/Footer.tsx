'use client'

import { Facebook, Instagram, Home, Mail, MessageCircle, MapPin, BookOpen } from 'lucide-react'
import { propertyData } from '@/data/property'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  const quickLinks = [
    { name: 'Home', href: '#home' },
    { name: 'Overview', href: '#overview' },
    { name: 'Gallery', href: '#gallery' },
    { name: 'Amenities', href: '#amenities' },
    { name: 'Availability', href: '#availability' },
    { name: 'Reviews', href: '#reviews' },
    { name: 'Contact', href: '#contact' },
  ]

  const policies = [
    { name: 'House Rules', href: '/policies#house-rules' },
    { name: 'Cancellation Policy', href: '/policies#cancellation-policy' },
    { name: 'Security Deposit', href: '/policies#damage-security' },
    { name: 'Parking', href: '/policies#parking' },
  ]

  return (
    <footer className="bg-gray-900 text-white">
      <div className="container-max">
        {/* Main Footer Content */}
        <div className="py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Brand Section */}
            <div className="lg:col-span-1">
              <h3 className="text-2xl font-bold font-serif mb-4">
                Spellbound Haven
              </h3>
              <p className="text-gray-300 mb-6">
                Your gateway to paradise. Experience luxury, comfort, and unforgettable memories at our Disney themed family villa.
              </p>
              
              {/* Social Media */}
              <div className="flex space-x-4">
                <a
                  href="https://www.facebook.com/spellboundhaven.disney"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-800 hover:bg-primary-600 p-2 rounded-lg transition-colors duration-200"
                  aria-label="Facebook"
                >
                  <Facebook className="w-5 h-5" />
                </a>
                <a
                  href="https://www.instagram.com/spellboundhaven"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-800 hover:bg-primary-600 p-2 rounded-lg transition-colors duration-200"
                  aria-label="Instagram"
                >
                  <Instagram className="w-5 h-5" />
                </a>
                <a
                  href="https://airbnb.com/h/spellbound-haven"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-gray-800 hover:bg-primary-600 p-2 rounded-lg transition-colors duration-200"
                  aria-label="Airbnb"
                >
                  <Home className="w-5 h-5" />
                </a>
                <a
                  href="/blog"
                  className="bg-gray-800 hover:bg-primary-600 p-2 rounded-lg transition-colors duration-200"
                  aria-label="Blog"
                >
                  <BookOpen className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                {quickLinks.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-gray-300 hover:text-white transition-colors duration-200"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Policies */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Policies</h4>
              <ul className="space-y-2">
                {policies.map((policy) => (
                  <li key={policy.name}>
                    <a
                      href={policy.href}
                      className="text-gray-300 hover:text-white transition-colors duration-200"
                    >
                      {policy.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="text-lg font-semibold mb-4">Contact Info</h4>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-primary-400 flex-shrink-0" />
                  <a
                    href={`mailto:${propertyData.contact.email}`}
                    className="text-gray-300 hover:text-white transition-colors duration-200"
                  >
                    {propertyData.contact.email}
                  </a>
                </div>
                
                <div className="flex items-center space-x-3">
                  <MessageCircle className="w-5 h-5 text-primary-400 flex-shrink-0" />
                  <a
                    href="https://m.me/spellboundhaven.disney"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:text-white transition-colors duration-200"
                  >
                    Facebook Messenger
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Newsletter Signup */}
        <div className="border-t border-gray-800 py-8">
          <div className="text-center px-4">
            <h4 className="text-xl font-semibold mb-4">Stay Updated</h4>
            <p className="text-gray-300 mb-6">
              Subscribe to our newsletter for special offers and vacation tips
            </p>
            <div className="max-w-md mx-auto flex flex-col sm:flex-row gap-4">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-200 whitespace-nowrap">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 py-6 px-4">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 text-center md:text-left">
            <div className="text-gray-400 text-sm">
              © {currentYear} Spellbound Haven. All rights reserved.
            </div>
            
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
              <MapPin className="w-4 h-4 text-primary-400 flex-shrink-0" />
              <span className="break-words">{propertyData.contact.address}</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
