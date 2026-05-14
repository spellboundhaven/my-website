'use client'

import { Facebook, Instagram, Mail, MessageCircle, MapPin, BookOpen } from 'lucide-react'
import { propertyData } from '@/data/property'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  const quickLinks = [
    { name: 'Home', href: '#home' },
    { name: 'Overview', href: '#overview' },
    { name: 'Gallery', href: '#gallery' },
    { name: 'Amenities', href: '#amenities' },
    { name: 'Location', href: '#location' },
    { name: 'Availability', href: '#availability' },
    { name: 'Reviews', href: '#reviews' },
  ]

  const policies = [
    { name: 'House Rules', href: '/policies#house-rules' },
    { name: 'Cancellation Policy', href: '/policies#cancellation-policy' },
    { name: 'Damage Protection', href: '/policies#damage-protection' },
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
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.5 16.572c-.328.738-.89 1.31-1.566 1.665-.39.205-.82.32-1.264.35-.29.02-.584-.01-.87-.08a6.47 6.47 0 0 1-1.8-.82 14.258 14.258 0 0 1-1.998-1.63 14.258 14.258 0 0 1-1.998 1.63 6.47 6.47 0 0 1-1.8.82c-.286.07-.58.1-.87.08a3.269 3.269 0 0 1-1.264-.35 3.2 3.2 0 0 1-1.566-1.665c-.328-.738-.394-1.556-.186-2.356.14-.545.4-1.073.752-1.6.352-.528.796-1.052 1.316-1.572.78-.78 1.664-1.535 2.54-2.198a25.345 25.345 0 0 1 1.65-1.138c.236-.15.444-.276.62-.377.175-.1.32-.174.43-.223a.96.96 0 0 1 .376-.082.96.96 0 0 1 .376.082c.11.05.255.123.43.223.176.1.384.228.62.377.472.3 1.04.692 1.65 1.138.876.663 1.76 1.418 2.54 2.198.52.52.964 1.044 1.316 1.572.353.527.613 1.055.753 1.6.208.8.142 1.618-.187 2.356z" />
                  </svg>
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
                    Email Us
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
                    Message Us
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 py-6 px-4">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 text-center md:text-left">
            <div className="text-gray-400 text-sm">
              © {currentYear} Spellbound Haven LLC. All rights reserved.
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
