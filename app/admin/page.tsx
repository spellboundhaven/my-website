'use client'

import { useState, useEffect } from 'react'
import { CalendarIcon, Users, Ban, Settings, Star, FileText, FileSignature, Download } from 'lucide-react'
import dynamic from 'next/dynamic'
import jsPDF from 'jspdf'
import { cleanHtml } from '@/lib/utils'

const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), { ssr: false })

// Helper function to format dates consistently (EST timezone, YYYY-MM-DD format)
function formatDateForDisplay(date: string | Date): string {
  if (typeof date === 'string') {
    // If it's an ISO timestamp string (e.g., "2026-01-17T00:00:00.000Z")
    if (date.includes('T')) {
      return date.split('T')[0]; // Extract just the date portion (YYYY-MM-DD)
    }
    // If it's already in YYYY-MM-DD format
    return date;
  }
  // If it's a Date object, extract just the date portion in local timezone
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface Booking {
  id: number
  check_in_date: string
  check_out_date: string
  guest_name: string
  guest_email: string
  guest_phone: string
  guests_count: number
  total_price: number
  status: string
  payment_method?: string
  payment_status?: string
  notes?: string
  created_at: string
}

interface DateBlock {
  id: number
  start_date: string
  end_date: string
  reason: string
  created_at: string
}

interface Review {
  id: number
  name: string
  rating: number
  date: string
  location?: string
  comment: string
  created_at: string
}

interface Invoice {
  id: number
  invoice_number: string
  booking_id?: number
  guest_name: string
  guest_email: string
  check_in_date: string
  check_out_date: string
  accommodation_cost: number
  cleaning_fee: number
  tax_amount: number
  additional_fees: number
  additional_fees_description?: string
  total_amount: number
  payment_method: string
  payment_status?: 'unpaid' | 'partial_paid' | 'all_paid'
  amount_paid?: number
  status: 'draft' | 'sent' | 'paid' | 'cancelled'
  notes?: string
  sent_at?: string
  created_at: string
}

interface RentalAgreement {
  id: string
  property_name: string
  property_address: string
  check_in_date: string
  check_out_date: string
  rental_terms: string
  total_amount?: string
  host_email?: string
  logo?: string
  created_at: string
  link_expires_at?: string
}

interface Vehicle {
  license_plate: string
  make: string
  model: string
  color: string
}

interface AdditionalAdult {
  name: string
}

interface RentalSubmission {
  id: number
  agreement_id: string
  guest_name: string
  guest_email: string
  guest_phone: string
  guest_address?: string
  num_adults: number
  num_children: number
  additional_adults?: AdditionalAdult[]
  vehicles?: Vehicle[]
  security_deposit_authorized: boolean
  electronic_signature_agreed: boolean
  signature_data: string
  check_in_date?: string
  check_out_date?: string
  view_token?: string
  submitted_at: string
}

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [activeTab, setActiveTab] = useState<'bookings' | 'calendar' | 'reviews' | 'invoices' | 'rental-agreements' | 'settings'>('bookings')
  
  const [bookings, setBookings] = useState<Booking[]>([])
  const [dateBlocks, setDateBlocks] = useState<DateBlock[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [rentalAgreements, setRentalAgreements] = useState<RentalAgreement[]>([])
  const [rentalSubmissions, setRentalSubmissions] = useState<RentalSubmission[]>([])
  const [loading, setLoading] = useState(true)
  
  const [airbnbUrl, setAirbnbUrl] = useState('')
  const [vrboUrl, setVrboUrl] = useState('')
  const [lastSync, setLastSync] = useState<{ last_synced: string; ical_url: string } | null>(null)
  const [vrboLastSync, setVrboLastSync] = useState<{ last_synced: string; ical_url: string } | null>(null)

  // Rental agreement state
  const [rentalAgreementTab, setRentalAgreementTab] = useState<'create' | 'view'>('create')
  const [rentalFormData, setRentalFormData] = useState({
    property_name: 'Spellbound Haven',
    property_address: '4449 Kaipo Rd, Davenport, FL 33897',
    check_in_date: '',
    check_out_date: '',
    rental_terms: '',
    total_amount: '',
    security_deposit: '',
    host_email: 'spellboundhaven.disney@gmail.com',
    logo: '',
    expires_in_days: '30',
  })
  const [createdRentalLink, setCreatedRentalLink] = useState<string | null>(null)
  const [copiedLink, setCopiedLink] = useState<string | null>(null)
  const [templates, setTemplates] = useState<Array<{id: string, name: string, content: string, last_updated: string}>>([])
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [templateMessage, setTemplateMessage] = useState<string | null>(null)

  // Check authentication on mount
  useEffect(() => {
    const authToken = localStorage.getItem('admin_auth_spellbound')
    if (authToken === 'authenticated') {
      setIsAuthenticated(true)
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      fetchAdminData()
      fetchLastSync()
      if (activeTab === 'rental-agreements') {
        fetchRentalAgreements()
        fetchRentalSubmissions()
        if (rentalAgreementTab === 'create') {
          loadRentalTemplates()
          // Load saved logo from localStorage
          const savedLogo = localStorage.getItem('last_uploaded_logo')
          if (savedLogo && !rentalFormData.logo) {
            setRentalFormData(prev => ({ ...prev, logo: savedLogo }))
          }
        }
      }
    }
  }, [isAuthenticated, activeTab, rentalAgreementTab])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    const correctPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123'
    
    if (password === correctPassword) {
      localStorage.setItem('admin_auth_spellbound', 'authenticated')
      setIsAuthenticated(true)
      setAuthError('')
    } else {
      setAuthError('Incorrect password')
      setPassword('')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_auth_spellbound')
    setIsAuthenticated(false)
    setPassword('')
  }

  const fetchAdminData = async () => {
    try {
      const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123'
      const response = await fetch('/api/admin', {
        headers: {
          'Authorization': `Bearer ${adminPassword}`
        }
      })
      const data = await response.json()
      
      if (data.success) {
        setBookings(data.bookings || [])
        setDateBlocks(data.blocks || [])
        setReviews(data.reviews || [])
        setInvoices(data.invoices || [])
      }
    } catch (error) {
      console.error('Error fetching admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLastSync = async () => {
    try {
      const response = await fetch('/api/calendar-sync')
      const data = await response.json()
      if (data.success) {
        // Find Airbnb sync
        const airbnbSync = data.syncs?.find((s: any) => s.source === 'airbnb')
        if (airbnbSync) {
          setLastSync({ last_synced: airbnbSync.last_synced, ical_url: airbnbSync.ical_url })
          setAirbnbUrl(airbnbSync.ical_url || '')
        }
        // Find VRBO sync
        const vrboSync = data.syncs?.find((s: any) => s.source === 'vrbo')
        if (vrboSync) {
          setVrboLastSync({ last_synced: vrboSync.last_synced, ical_url: vrboSync.ical_url })
          setVrboUrl(vrboSync.ical_url || '')
        }
      }
    } catch (error) {
      console.error('Error fetching last sync:', error)
    }
  }

  const handleSyncAirbnb = async () => {
    if (!airbnbUrl) {
      alert('Please enter Airbnb iCal URL')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/calendar-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: 'airbnb',
          icalUrl: airbnbUrl
        })
      })

      const data = await response.json()
      
      if (data.success) {
        alert(`✅ Successfully synced ${data.bookedDates?.length || 0} Airbnb bookings!`)
        fetchAdminData()
        fetchLastSync()
      } else {
        const errorMsg = data.details || data.error || 'Failed to sync Airbnb calendar'
        alert(`❌ Sync Failed:\n\n${errorMsg}\n\nPlease check:\n• Your iCal URL is correct\n• The URL is accessible\n• You have internet connection`)
        console.error('Sync error details:', data)
      }
    } catch (error) {
      console.error('Error syncing Airbnb:', error)
      alert(`❌ Network Error:\n\n${error instanceof Error ? error.message : 'An error occurred while syncing'}\n\nPlease check your internet connection and try again.`)
    } finally {
      setLoading(false)
    }
  }

  const handleSyncVrbo = async () => {
    if (!vrboUrl) {
      alert('Please enter VRBO iCal URL')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/calendar-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: 'vrbo',
          icalUrl: vrboUrl
        })
      })

      const data = await response.json()
      
      if (data.success) {
        alert(`✅ Successfully synced ${data.bookedDates?.length || 0} VRBO bookings!`)
        fetchAdminData()
        fetchLastSync()
      } else {
        const errorMsg = data.details || data.error || 'Failed to sync VRBO calendar'
        alert(`❌ Sync Failed:\n\n${errorMsg}\n\nPlease check:\n• Your iCal URL is correct\n• The URL is accessible\n• You have internet connection`)
        console.error('Sync error details:', data)
      }
    } catch (error) {
      console.error('Error syncing VRBO:', error)
      alert(`❌ Network Error:\n\n${error instanceof Error ? error.message : 'An error occurred while syncing'}\n\nPlease check your internet connection and try again.`)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBlock = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    setLoading(true)
    try {
      const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123'
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminPassword}`
        },
        body: JSON.stringify({
          action: 'createBlock',
          data: {
            start_date: formData.get('start_date'),
            end_date: formData.get('end_date'),
            reason: formData.get('reason')
          }
        })
      })

      const data = await response.json()
      
      if (data.success) {
        alert('Date block created successfully!')
        fetchAdminData()
        e.currentTarget.reset()
      }
    } catch (error) {
      console.error('Error creating block:', error)
      alert('Failed to create date block')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteBooking = async (id: number) => {
    setLoading(true)
    try {
      const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123'
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminPassword}`
        },
        body: JSON.stringify({
          action: 'deleteBooking',
          data: { id }
        })
      })

      const data = await response.json()
      
      if (data.success) {
        alert('Inquiry deleted!')
        fetchAdminData()
      } else {
        alert('Failed to delete inquiry')
      }
    } catch (error) {
      console.error('Error deleting inquiry:', error)
      alert('Failed to delete inquiry')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteBlock = async (id: number) => {
    if (!confirm('Delete this date block?')) return

    setLoading(true)
    try {
      const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123'
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminPassword}`
        },
        body: JSON.stringify({
          action: 'deleteBlock',
          data: { id }
        })
      })

      const data = await response.json()
      
      if (data.success) {
        alert('Date block deleted!')
        fetchAdminData()
      }
    } catch (error) {
      console.error('Error deleting block:', error)
      alert('Failed to delete date block')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateReview = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    
    setLoading(true)
    try {
      const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123'
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminPassword}`
        },
        body: JSON.stringify({
          action: 'createReview',
          data: {
            name: formData.get('name'),
            rating: parseInt(formData.get('rating') as string),
            date: formData.get('date'),
            location: formData.get('location') || null,
            comment: formData.get('comment')
          }
        })
      })

      const data = await response.json()
      
      if (data.success) {
        alert('Review added successfully!')
        fetchAdminData()
        form.reset()
      } else {
        alert(`Failed to create review: ${data.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error creating review:', error)
      alert(`Failed to create review: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteReview = async (id: number) => {
    if (!confirm('Delete this review?')) return

    setLoading(true)
    try {
      const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123'
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminPassword}`
        },
        body: JSON.stringify({
          action: 'deleteReview',
          data: { id }
        })
      })

      const data = await response.json()
      
      if (data.success) {
        alert('Review deleted!')
        fetchAdminData()
      }
    } catch (error) {
      console.error('Error deleting review:', error)
      alert('Failed to delete review')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateBookingStatus = async (id: number, status: string) => {
    setLoading(true)
    try {
      const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123'
      const response = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminPassword}`
        },
        body: JSON.stringify({
          action: 'updateBooking',
          data: {
            id,
            updates: { status }
          }
        })
      })

      const data = await response.json()
      
      if (data.success) {
        alert('Booking status updated!')
        fetchAdminData()
      }
    } catch (error) {
      console.error('Error updating booking:', error)
      alert('Failed to update booking')
    } finally {
      setLoading(false)
    }
  }

  // Rental Agreement functions
  const fetchRentalAgreements = async () => {
    try {
      const response = await fetch('/api/rental-agreements')
      const data = await response.json()
      setRentalAgreements(data.agreements || [])
    } catch (error) {
      console.error('Error fetching rental agreements:', error)
    }
  }

  const fetchRentalSubmissions = async () => {
    try {
      const response = await fetch('/api/rental-submissions')
      const data = await response.json()
      setRentalSubmissions(data.submissions || [])
    } catch (error) {
      console.error('Error fetching rental submissions:', error)
    }
  }

  const loadRentalTemplates = async () => {
    try {
      const response = await fetch('/api/rental-template')
      const data = await response.json()
      setTemplates(data.templates || [])
    } catch (error) {
      console.error('Error loading rental templates:', error)
    }
  }

  const handleCreateRentalAgreement = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Sanitize rental terms to remove invisible characters and soft hyphens
      const sanitizedRentalTerms = rentalFormData.rental_terms
        .replace(/\u00AD/g, '') // Remove soft hyphens
        .replace(/\u200B/g, '') // Remove zero-width spaces
        .replace(/\u200C/g, '') // Remove zero-width non-joiners
        .replace(/\u200D/g, '') // Remove zero-width joiners
        .replace(/\uFEFF/g, '') // Remove zero-width no-break spaces
      
      const response = await fetch('/api/rental-agreements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...rentalFormData,
          rental_terms: sanitizedRentalTerms
        }),
      })

      const data = await response.json()
      if (data.success) {
        setCreatedRentalLink(data.link)
        setRentalFormData({
          property_name: 'Spellbound Haven',
          property_address: '4449 Kaipo Rd, Davenport, FL 33897',
          host_email: 'spellboundhaven.disney@gmail.com',
          check_in_date: '',
          check_out_date: '',
          rental_terms: '',
          total_amount: '',
          security_deposit: '',
          logo: '',
          expires_in_days: '30',
        })
      }
    } catch (error) {
      console.error('Error creating rental agreement:', error)
      alert('Failed to create rental agreement')
    } finally {
      setLoading(false)
    }
  }

  const downloadRentalAgreementAsPDF = async () => {
    if (!rentalFormData.property_name || !rentalFormData.check_in_date || !rentalFormData.check_out_date) {
      alert('Please fill in required fields: Property Name, Check-in Date, and Check-out Date')
      return
    }

    try {
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      const margin = 20
      const maxWidth = pageWidth - (margin * 2)
      let yPosition = margin

      // Helper function to check if we need a new page
      const checkNewPage = (spaceNeeded: number) => {
        if (yPosition + spaceNeeded > pageHeight - margin) {
          doc.addPage()
          yPosition = margin
          return true
        }
        return false
      }

      // Helper function to add text with word wrap
      const addWrappedText = (text: string, x: number, fontSize: number, fontStyle: 'normal' | 'bold' = 'normal', lineHeight: number = 5) => {
        doc.setFont('helvetica', fontStyle)
        doc.setFontSize(fontSize)
        const lines = doc.splitTextToSize(text, maxWidth - (x - margin))
        
        for (const line of lines) {
          checkNewPage(lineHeight)
          doc.text(line, x, yPosition)
          yPosition += lineHeight
        }
      }

      // Add logo if available
      if (rentalFormData.logo) {
        try {
          // Load image to get natural dimensions
          const img = new Image()
          img.src = rentalFormData.logo
          await new Promise((resolve) => {
            img.onload = resolve
          })
          
          // Calculate dimensions while preserving aspect ratio
          const maxWidth = 60
          const maxHeight = 30
          const aspectRatio = img.naturalWidth / img.naturalHeight
          
          let imgWidth = maxWidth
          let imgHeight = maxWidth / aspectRatio
          
          // If height exceeds max, scale by height instead
          if (imgHeight > maxHeight) {
            imgHeight = maxHeight
            imgWidth = maxHeight * aspectRatio
          }
          
          doc.addImage(rentalFormData.logo, 'PNG', margin, yPosition, imgWidth, imgHeight)
          yPosition += imgHeight + 10
        } catch (error) {
          console.error('Error adding logo to PDF:', error)
        }
      }

      // Title
      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      doc.text('RENTAL AGREEMENT', pageWidth / 2, yPosition, { align: 'center' })
      yPosition += 15

      // Property Information
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('Property Information', margin, yPosition)
      yPosition += 8

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      
      // Parse dates correctly without timezone issues
      const parseDate = (dateStr: string) => {
        const [year, month, day] = dateStr.split('-').map(Number)
        return new Date(year, month - 1, day)
      }
      
      const checkInDate = parseDate(rentalFormData.check_in_date)
      const checkOutDate = parseDate(rentalFormData.check_out_date)
      
      doc.text(`Property: ${rentalFormData.property_name}`, margin, yPosition)
      yPosition += 6
      doc.text(`Address: ${rentalFormData.property_address}`, margin, yPosition)
      yPosition += 6
      doc.text(`Check-in: ${checkInDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, margin, yPosition)
      yPosition += 6
      doc.text(`Check-out: ${checkOutDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`, margin, yPosition)
      yPosition += 6

      if (rentalFormData.total_amount) {
        doc.text(`Total Amount: ${rentalFormData.total_amount}`, margin, yPosition)
        yPosition += 6
      }

      if (rentalFormData.security_deposit) {
        doc.text(`Security Deposit: $${rentalFormData.security_deposit}`, margin, yPosition)
        yPosition += 6
      }

      yPosition += 10

      // Rental Terms with HTML parsing
      if (rentalFormData.rental_terms) {
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text('Terms and Conditions', margin, yPosition)
        yPosition += 8

        // Parse HTML and preserve structure
        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = rentalFormData.rental_terms
        
        const processNode = (node: Node, indent: number = 0) => {
          if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent?.trim()
            if (text) {
              addWrappedText(text, margin + indent, 10, 'normal', 5)
            }
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as HTMLElement
            const tagName = element.tagName.toLowerCase()
            
            if (tagName === 'h1') {
              yPosition += 3
              addWrappedText(element.textContent || '', margin, 14, 'bold', 7)
              yPosition += 2
            } else if (tagName === 'h2') {
              yPosition += 2
              addWrappedText(element.textContent || '', margin, 12, 'bold', 6)
              yPosition += 1
            } else if (tagName === 'h3') {
              yPosition += 2
              addWrappedText(element.textContent || '', margin, 11, 'bold', 6)
              yPosition += 1
            } else if (tagName === 'p') {
              const text = element.textContent?.trim()
              if (text) {
                addWrappedText(text, margin, 10, 'normal', 5)
                yPosition += 2
              }
            } else if (tagName === 'ul' || tagName === 'ol') {
              const items = element.querySelectorAll('li')
              items.forEach((li, index) => {
                const bullet = tagName === 'ul' ? '•' : `${index + 1}.`
                const text = li.textContent?.trim()
                if (text) {
                  checkNewPage(5)
                  doc.setFont('helvetica', 'normal')
                  doc.setFontSize(10)
                  doc.text(bullet, margin + 5, yPosition)
                  const lines = doc.splitTextToSize(text, maxWidth - 15)
                  for (const line of lines) {
                    checkNewPage(5)
                    doc.text(line, margin + 12, yPosition)
                    yPosition += 5
                  }
                }
              })
              yPosition += 2
            } else if (tagName === 'strong' || tagName === 'b') {
              const text = element.textContent?.trim()
              if (text) {
                addWrappedText(text, margin, 10, 'bold', 5)
              }
            } else {
              // Process child nodes for other elements
              element.childNodes.forEach(child => processNode(child, indent))
            }
          }
        }
        
        tempDiv.childNodes.forEach(node => processNode(node))
      }

      // Add signature section on new page or at bottom
      if (yPosition > pageHeight - 80) {
        doc.addPage()
        yPosition = margin
      } else {
        yPosition += 15
      }

      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('Guest Signature', margin, yPosition)
      yPosition += 10

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.text('Guest Name: _______________________________', margin, yPosition)
      yPosition += 10
      doc.text('Guest Email: _______________________________', margin, yPosition)
      yPosition += 10
      doc.text('Guest Phone: _______________________________', margin, yPosition)
      yPosition += 15
      doc.text('Signature: _______________________________', margin, yPosition)
      yPosition += 10
      doc.text('Date: _______________________________', margin, yPosition)

      // Save the PDF
      const fileName = `Rental_Agreement_${rentalFormData.property_name.replace(/\s+/g, '_')}_${rentalFormData.check_in_date}.pdf`
      doc.save(fileName)
      
      alert('PDF downloaded successfully!')
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate PDF. Please try again.')
    }
  }

  const handleDeleteRentalAgreement = async (agreementId: string, propertyName: string) => {
    if (!confirm(`Are you sure you want to delete the rental agreement for "${propertyName}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/rental-agreements?id=${agreementId}`, {
        method: 'DELETE',
      })

      const data = await response.json()
      if (data.success) {
        fetchRentalAgreements()
      } else {
        alert('Failed to delete rental agreement')
      }
    } catch (error) {
      console.error('Error deleting rental agreement:', error)
      alert('Failed to delete rental agreement')
    }
  }

  const handleDeleteRentalSubmission = async (submissionId: number, guestName: string) => {
    if (!confirm(`Are you sure you want to delete the submission from "${guestName}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/rental-submissions?id=${submissionId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        alert('Failed to delete submission')
        return
      }

      const data = await response.json()
      if (data.success) {
        fetchRentalSubmissions()
      } else {
        alert('Failed to delete submission')
      }
    } catch (error) {
      console.error('Error deleting rental submission:', error)
      alert('Failed to delete rental submission')
    }
  }

  const copyToClipboard = (link: string) => {
    navigator.clipboard.writeText(link)
    setCopiedLink(link)
    setTimeout(() => setCopiedLink(null), 2000)
  }

  const getRentalAgreementLink = (agreementId: string) => {
    return `${window.location.origin}/rental-agreement/${agreementId}`
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Logo file size must be less than 2MB')
        return
      }
      
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file')
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        const logoData = reader.result as string
        setRentalFormData(prev => ({ ...prev, logo: logoData }))
        localStorage.setItem('last_uploaded_logo', logoData)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeLogo = () => {
    setRentalFormData(prev => ({ ...prev, logo: '' }))
    localStorage.removeItem('last_uploaded_logo')
  }

  const openSaveDialog = () => {
    if (!rentalFormData.rental_terms) {
      alert('Please enter rental terms before saving as template')
      return
    }
    setShowSaveDialog(true)
    setTemplateName('')
  }

  const saveAsTemplate = async () => {
    if (!templateName.trim()) {
      alert('Please enter a template name')
      return
    }

    try {
      const response = await fetch('/api/rental-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: templateName.trim(),
          content: rentalFormData.rental_terms,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setTemplateMessage('✓ Template saved successfully!')
        setShowSaveDialog(false)
        setTemplateName('')
        loadRentalTemplates()
        setTimeout(() => setTemplateMessage(null), 3000)
      }
    } catch (error) {
      console.error('Error saving template:', error)
      alert('Failed to save template')
    }
  }

  const loadTemplateContent = async (templateId: string) => {
    try {
      const response = await fetch(`/api/rental-template?id=${templateId}`)
      const data = await response.json()
      
      if (data.template) {
        setRentalFormData(prev => ({ ...prev, rental_terms: data.template.content }))
        setTemplateMessage(`✓ Loaded "${data.template.name}"`)
        setTimeout(() => setTemplateMessage(null), 2000)
      }
    } catch (error) {
      console.error('Error loading template:', error)
      alert('Failed to load template')
    }
  }

  const deleteTemplate = async (templateId: string, templateName: string) => {
    if (!confirm(`Delete template "${templateName}"?`)) {
      return
    }

    try {
      const response = await fetch('/api/rental-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete',
          id: templateId,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setTemplateMessage('✓ Template deleted')
        loadRentalTemplates()
        setTimeout(() => setTemplateMessage(null), 2000)
      }
    } catch (error) {
      console.error('Error deleting template:', error)
      alert('Failed to delete template')
    }
  }

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Spellbound Haven Admin</h1>
            <p className="text-gray-600">Enter your password to access the dashboard</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter admin password"
                autoFocus
              />
            </div>
            
            {authError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {authError}
              </div>
            )}
            
            <button
              type="submit"
              className="w-full py-3 px-6 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-md transition duration-200"
            >
              Login
            </button>
          </form>
          
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Default password: admin123</p>
            <p className="mt-1">Change this with NEXT_PUBLIC_ADMIN_PASSWORD env var</p>
          </div>
        </div>
      </div>
    )
  }

  // Admin dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold">Spellbound Haven Admin</h1>
                <p className="text-purple-100 mt-1">Manage bookings, availability, and inquiries</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-purple-700 hover:bg-purple-800 rounded-lg text-sm font-medium transition"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 overflow-x-auto scrollbar-hide">
            <div className="flex min-w-max">
              <button
                onClick={() => setActiveTab('bookings')}
                className={`px-3 sm:px-6 py-3 font-medium transition-colors flex items-center gap-1 sm:gap-2 whitespace-nowrap text-sm sm:text-base ${
                  activeTab === 'bookings'
                    ? 'border-b-2 border-purple-600 text-purple-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Users className="w-4 h-4" />
                <span className="hidden xs:inline">Inquiries</span>
                <span className="xs:hidden">Inq.</span>
                <span className="hidden sm:inline">({bookings.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('calendar')}
                className={`px-3 sm:px-6 py-3 font-medium transition-colors flex items-center gap-1 sm:gap-2 whitespace-nowrap text-sm sm:text-base ${
                  activeTab === 'calendar'
                    ? 'border-b-2 border-purple-600 text-purple-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Ban className="w-4 h-4" />
                <span className="hidden xs:inline">Date Blocks</span>
                <span className="xs:hidden">Dates</span>
                <span className="hidden sm:inline">({dateBlocks.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`px-3 sm:px-6 py-3 font-medium transition-colors flex items-center gap-1 sm:gap-2 whitespace-nowrap text-sm sm:text-base ${
                  activeTab === 'reviews'
                    ? 'border-b-2 border-purple-600 text-purple-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Star className="w-4 h-4" />
                <span>Reviews</span>
                <span className="hidden sm:inline">({reviews.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('invoices')}
                className={`px-3 sm:px-6 py-3 font-medium transition-colors flex items-center gap-1 sm:gap-2 whitespace-nowrap text-sm sm:text-base ${
                  activeTab === 'invoices'
                    ? 'border-b-2 border-purple-600 text-purple-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Invoices</span>
                <span className="hidden sm:inline">({invoices.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('rental-agreements')}
                className={`px-3 sm:px-6 py-3 font-medium transition-colors flex items-center gap-1 sm:gap-2 whitespace-nowrap text-sm sm:text-base ${
                  activeTab === 'rental-agreements'
                    ? 'border-b-2 border-purple-600 text-purple-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <FileSignature className="w-4 h-4" />
                <span className="hidden sm:inline">Rental Agreements</span>
                <span className="sm:hidden">Rentals</span>
                <span className="hidden sm:inline">({rentalAgreements.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-3 sm:px-6 py-3 font-medium transition-colors flex items-center gap-1 sm:gap-2 whitespace-nowrap text-sm sm:text-base ${
                  activeTab === 'settings'
                    ? 'border-b-2 border-purple-600 text-purple-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>
            </div>
          </div>

          <div className="p-3 sm:p-6">
            {/* Bookings Tab */}
            {activeTab === 'bookings' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-6">All Inquiries</h2>
                <div className="overflow-x-auto">
                  {loading ? (
                    <p className="text-gray-500 text-center py-8">Loading inquiries...</p>
                  ) : bookings.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No inquiries yet</p>
                  ) : (
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Guest</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Check-in / Check-out</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Contact</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Guests</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {bookings.map((booking) => (
                          <tr key={booking.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div className="font-medium text-gray-900">{booking.guest_name}</div>
                              {booking.notes && (
                                <div className="text-xs text-gray-500 mt-1">{booking.notes}</div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              <div>{formatDateForDisplay(booking.check_in_date)}</div>
                              <div className="text-xs text-gray-500">to {formatDateForDisplay(booking.check_out_date)}</div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              <div>{booking.guest_email}</div>
                              <div className="text-xs">{booking.guest_phone}</div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{booking.guests_count}</td>
                            <td className="px-4 py-3 text-sm">
                              <button
                                onClick={() => {
                                  if (confirm(`Delete inquiry from ${booking.guest_name}?`)) {
                                    handleDeleteBooking(booking.id);
                                  }
                                }}
                                className="text-red-600 hover:text-red-800 font-medium"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* Date Blocks Tab */}
            {activeTab === 'calendar' && (
              <div className="space-y-8">
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Block Dates</h2>
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          if (!confirm('Remove all duplicate date blocks?')) return;
                          try {
                            setLoading(true);
                            const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';
                            const response = await fetch('/api/cleanup-blocks', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${adminPassword}`
                              },
                              body: JSON.stringify({ action: 'remove-duplicates' })
                            });
                            const result = await response.json();
                            if (result.success) {
                              alert(result.message);
                              fetchAdminData();
                            } else {
                              alert('Error: ' + result.error);
                            }
                          } catch (error) {
                            console.error('Error:', error);
                            alert('Failed to remove duplicates');
                          } finally {
                            setLoading(false);
                          }
                        }}
                        disabled={loading}
                        className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded-lg font-medium transition disabled:bg-gray-400"
                      >
                        Remove Duplicates
                      </button>
                      <button
                        onClick={async () => {
                          if (!confirm('Clean up all past date blocks?')) return;
                          try {
                            setLoading(true);
                            const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';
                            const response = await fetch('/api/cleanup-blocks', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${adminPassword}`
                              },
                              body: JSON.stringify({ action: 'cleanup-past' })
                            });
                            const result = await response.json();
                            if (result.success) {
                              alert(result.message);
                              fetchAdminData();
                            } else {
                              alert('Error: ' + result.error);
                            }
                          } catch (error) {
                            console.error('Error:', error);
                            alert('Failed to cleanup past blocks');
                          } finally {
                            setLoading(false);
                          }
                        }}
                        disabled={loading}
                        className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded-lg font-medium transition disabled:bg-gray-400"
                      >
                        Clean Up Past
                      </button>
                      <button
                        onClick={async () => {
                          if (!confirm('Full cleanup: Remove duplicates AND past blocks?')) return;
                          try {
                            setLoading(true);
                            const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';
                            const response = await fetch('/api/cleanup-blocks', {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${adminPassword}`
                              },
                              body: JSON.stringify({ action: 'full-cleanup' })
                            });
                            const result = await response.json();
                            if (result.success) {
                              alert(result.message);
                              fetchAdminData();
                            } else {
                              alert('Error: ' + result.error);
                            }
                          } catch (error) {
                            console.error('Error:', error);
                            alert('Failed to run full cleanup');
                          } finally {
                            setLoading(false);
                          }
                        }}
                        disabled={loading}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg font-medium transition disabled:bg-gray-400"
                      >
                        Full Cleanup
                      </button>
                    </div>
                  </div>
                  <form onSubmit={handleCreateBlock} className="bg-gray-50 rounded-lg p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Start Date
                        </label>
                        <input
                          type="date"
                          name="start_date"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          End Date
                        </label>
                        <input
                          type="date"
                          name="end_date"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Reason
                        </label>
                        <input
                          type="text"
                          name="reason"
                          required
                          placeholder="e.g., Maintenance"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition disabled:bg-gray-400"
                    >
                      Block Dates
                    </button>
                  </form>

                  <div className="space-y-3">
                    {loading ? (
                      <p className="text-gray-500 text-center py-8">Loading date blocks...</p>
                    ) : dateBlocks.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No date blocks</p>
                    ) : (
                      dateBlocks.map((block) => (
                        <div key={block.id} className="bg-white border border-gray-200 rounded-lg p-4 flex justify-between items-center">
                          <div>
                            <div className="font-medium text-gray-900">
                              {formatDateForDisplay(block.start_date)} to {formatDateForDisplay(block.end_date)}
                            </div>
                            <div className="text-sm text-gray-600">{block.reason}</div>
                          </div>
                          <button
                            onClick={() => handleDeleteBlock(block.id)}
                            className="text-red-600 hover:text-red-800 font-medium text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Reviews Tab */}
            {activeTab === 'reviews' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Manage Reviews</h2>
                  <form onSubmit={handleCreateReview} className="bg-gray-50 rounded-lg p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Guest Name *
                        </label>
                        <input
                          type="text"
                          name="name"
                          required
                          placeholder="John Doe"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Rating *
                        </label>
                        <select
                          name="rating"
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                          <option value="5">5 Stars</option>
                          <option value="4">4 Stars</option>
                          <option value="3">3 Stars</option>
                          <option value="2">2 Stars</option>
                          <option value="1">1 Star</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Date * (e.g., "June 2025")
                        </label>
                        <input
                          type="text"
                          name="date"
                          required
                          placeholder="June 2025"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Location (optional)
                        </label>
                        <input
                          type="text"
                          name="location"
                          placeholder="New York, New York"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Review Comment *
                      </label>
                      <textarea
                        name="comment"
                        required
                        rows={4}
                        placeholder="Write the guest's review here..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition disabled:bg-gray-400"
                    >
                      Add Review
                    </button>
                  </form>

                  <div className="space-y-3">
                    {loading ? (
                      <p className="text-gray-500 text-center py-8">Loading reviews...</p>
                    ) : reviews.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No reviews yet</p>
                    ) : (
                      reviews.map((review) => (
                        <div key={review.id} className="bg-white border border-gray-200 rounded-lg p-6">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold text-gray-900 text-lg">{review.name}</h3>
                                <div className="flex">
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
                                </div>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <span>{review.date}</span>
                                {review.location && (
                                  <>
                                    <span>•</span>
                                    <span>{review.location}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => handleDeleteReview(review.id)}
                              className="text-red-600 hover:text-red-800 font-medium text-sm"
                            >
                              Delete
                            </button>
                          </div>
                          <p className="text-gray-700">{review.comment}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Invoices Tab */}
            {activeTab === 'invoices' && (
              <div className="space-y-8">
                {/* Create Invoice Form */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Create Invoice</h2>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const form = e.currentTarget;
                        const formData = new FormData(form);
                        
                        const accommodationCost = parseFloat(formData.get('accommodation_cost') as string) || 0;
                        const cleaningFee = parseFloat(formData.get('cleaning_fee') as string) || 0;
                        const taxAmount = parseFloat(formData.get('tax_amount') as string) || 0;
                        const additionalFees = parseFloat(formData.get('additional_fees') as string) || 0;
                        const totalAmount = accommodationCost + cleaningFee + taxAmount + additionalFees;

                        const invoiceData = {
                          guest_name: formData.get('guest_name'),
                          guest_email: formData.get('guest_email'),
                          check_in_date: formData.get('check_in_date'),
                          check_out_date: formData.get('check_out_date'),
                          accommodation_cost: accommodationCost,
                          cleaning_fee: cleaningFee,
                          tax_amount: taxAmount,
                          additional_fees: additionalFees,
                          additional_fees_description: formData.get('additional_fees_description'),
                          total_amount: totalAmount,
                          payment_method: formData.get('payment_method'),
                          payment_status: formData.get('payment_status'),
                          amount_paid: formData.get('amount_paid'),
                          notes: formData.get('notes'),
                        };

                        try {
                          setLoading(true);
                          const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';
                          const response = await fetch('/api/invoices', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${adminPassword}`
                            },
                            body: JSON.stringify({
                              action: 'create',
                              data: invoiceData
                            })
                          });

                          const result = await response.json();
                          
                          if (result.success) {
                            alert('Invoice created successfully!');
                            form.reset();
                            fetchAdminData();
                          } else {
                            const errorMsg = result.details || result.error || 'Unknown error';
                            alert('Failed to create invoice: ' + errorMsg);
                          }
                        } catch (error) {
                          console.error('Error creating invoice:', error);
                          const errorMsg = error instanceof Error ? error.message : String(error);
                          alert('Error creating invoice: ' + errorMsg);
                        } finally {
                          setLoading(false);
                        }
                      }}
                      className="space-y-6"
                    >
                      {/* Guest Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Guest Name *
                          </label>
                          <input
                            type="text"
                            name="guest_name"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Guest Email *
                          </label>
                          <input
                            type="email"
                            name="guest_email"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      </div>

                      {/* Stay Dates */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Check-in Date *
                          </label>
                          <input
                            type="date"
                            name="check_in_date"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Check-out Date *
                          </label>
                          <input
                            type="date"
                            name="check_out_date"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      </div>

                      {/* Tax Calculator */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <h3 className="text-lg font-semibold text-blue-900 mb-4">💡 Calculate from Total Amount</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Total Amount (including tax) ($)
                            </label>
                            <input
                              type="number"
                              id="total_with_tax"
                              step="0.01"
                              min="0"
                              placeholder="e.g., 2060"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <button
                              type="button"
                              onClick={() => {
                                const form = document.querySelector('form') as HTMLFormElement;
                                const totalWithTax = parseFloat((document.getElementById('total_with_tax') as HTMLInputElement).value || '0');
                                const cleaningFee = parseFloat((form.elements.namedItem('cleaning_fee') as HTMLInputElement).value || '400');
                                const additionalFees = parseFloat((form.elements.namedItem('additional_fees') as HTMLInputElement).value || '0');
                                
                                if (totalWithTax > 0) {
                                  // Calculate: Total = (Accommodation + Cleaning + Additional) × 1.12
                                  // So: (Accommodation + Cleaning + Additional) = Total / 1.12
                                  const subtotal = totalWithTax / 1.12;
                                  const accommodationCost = subtotal - cleaningFee - additionalFees;
                                  const taxAmount = totalWithTax - subtotal;
                                  
                                  // Fill in the form fields
                                  (form.elements.namedItem('accommodation_cost') as HTMLInputElement).value = accommodationCost.toFixed(2);
                                  (form.elements.namedItem('tax_amount') as HTMLInputElement).value = taxAmount.toFixed(2);
                                  
                                  alert(`Calculated:\nAccommodation: $${accommodationCost.toFixed(2)}\nCleaning Fee: $${cleaningFee.toFixed(2)}\nAdditional Fees: $${additionalFees.toFixed(2)}\nTax (12%): $${taxAmount.toFixed(2)}\nTotal: $${totalWithTax.toFixed(2)}`);
                                } else {
                                  alert('Please enter a total amount');
                                }
                              }}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition"
                            >
                              Calculate from Total
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                          Enter your total amount (with tax), and we'll calculate the accommodation cost and tax (12%) for you.
                        </p>
                      </div>

                      {/* Costs */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Accommodation Cost * ($)
                          </label>
                          <input
                            type="number"
                            name="accommodation_cost"
                            step="0.01"
                            min="0"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Cleaning Fee ($)
                          </label>
                          <input
                            type="number"
                            name="cleaning_fee"
                            step="0.01"
                            min="0"
                            defaultValue="400"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tax Amount ($)
                          </label>
                          <input
                            type="number"
                            name="tax_amount"
                            step="0.01"
                            min="0"
                            defaultValue="0"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Additional Fees ($)
                          </label>
                          <input
                            type="number"
                            name="additional_fees"
                            step="0.01"
                            min="0"
                            defaultValue="0"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Additional Fees Description
                        </label>
                        <input
                          type="text"
                          name="additional_fees_description"
                          placeholder="e.g., Pool heating, Late checkout"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>

                      {/* Payment Method & Payment Status */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Payment Method *
                          </label>
                          <select
                            name="payment_method"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="">Select payment method</option>
                            <option value="Stripe">Stripe</option>
                            <option value="Wise">Wise</option>
                            <option value="Zelle">Zelle</option>
                            <option value="Venmo">Venmo</option>
                            <option value="Cash App">Cash App</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="Check">Check</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Payment Status *
                          </label>
                          <select
                            name="payment_status"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            <option value="unpaid">Unpaid</option>
                            <option value="partial_paid">Partially Paid</option>
                            <option value="all_paid">All Paid</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Amount Paid ($)
                          </label>
                          <input
                            type="number"
                            name="amount_paid"
                            min="0"
                            step="0.01"
                            defaultValue="0"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="0.00"
                          />
                        </div>
                      </div>

                      {/* Notes */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Notes
                        </label>
                        <textarea
                          name="notes"
                          rows={3}
                          placeholder="Additional information or payment instructions..."
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400"
                      >
                        {loading ? 'Creating...' : 'Create Invoice'}
                      </button>
                    </form>
                  </div>
                </div>

                {/* Invoice List */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">All Invoices</h2>
                  <div className="overflow-x-auto">
                    {loading ? (
                      <p className="text-gray-500 text-center py-8">Loading invoices...</p>
                    ) : invoices.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No invoices yet</p>
                    ) : (
                      <table className="w-full">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Invoice #</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Guest</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Dates</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Total</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Payment Status</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoices.map((invoice) => (
                            <tr key={invoice.id} className="border-b border-gray-200 hover:bg-gray-50">
                              <td className="px-4 py-4 text-sm text-gray-900 font-mono">
                                {invoice.invoice_number}
                              </td>
                              <td className="px-4 py-4">
                                <div className="text-sm font-medium text-gray-900">{invoice.guest_name}</div>
                                <div className="text-sm text-gray-500">{invoice.guest_email}</div>
                              </td>
                              <td className="px-4 py-4 text-sm text-gray-600">
                                {formatDateForDisplay(invoice.check_in_date)} -<br/>
                                {formatDateForDisplay(invoice.check_out_date)}
                              </td>
                              <td className="px-4 py-4 text-sm font-semibold text-gray-900">
                                ${Number(invoice.total_amount).toFixed(2)}
                              </td>
                              <td className="px-4 py-4">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  invoice.payment_status === 'all_paid' ? 'bg-green-100 text-green-800' :
                                  invoice.payment_status === 'partial_paid' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {String(invoice.payment_status || 'unpaid').replace(/_/g, ' ').toUpperCase()}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-sm">
                                <div className="flex gap-2">
                                  <button
                                    onClick={async () => {
                                      if (!confirm('Send this invoice to spellboundhaven.disney@gmail.com?')) return;
                                        try {
                                          setLoading(true);
                                          const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';
                                          const response = await fetch('/api/invoices', {
                                            method: 'POST',
                                            headers: {
                                              'Content-Type': 'application/json',
                                              'Authorization': `Bearer ${adminPassword}`
                                            },
                                            body: JSON.stringify({
                                              action: 'send',
                                              id: invoice.id,
                                              data: { send_to_guest: false }
                                            })
                                          });

                                          const result = await response.json();
                                          
                                          if (result.success) {
                                            alert('Invoice sent successfully to your email!');
                                            fetchAdminData();
                                          } else {
                                            alert('Failed to send invoice: ' + (result.error || 'Unknown error'));
                                          }
                                        } catch (error) {
                                          console.error('Error sending invoice:', error);
                                          alert('Error sending invoice. Please try again.');
                                        } finally {
                                          setLoading(false);
                                        }
                                      }}
                                      className="text-blue-600 hover:text-blue-800 font-medium"
                                    >
                                      Send
                                    </button>
                                  <button
                                    onClick={async () => {
                                      if (!confirm(`Send this invoice to guest email (${invoice.guest_email})?`)) return;
                                        try {
                                          setLoading(true);
                                          const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';
                                          const response = await fetch('/api/invoices', {
                                            method: 'POST',
                                            headers: {
                                              'Content-Type': 'application/json',
                                              'Authorization': `Bearer ${adminPassword}`
                                            },
                                            body: JSON.stringify({
                                              action: 'send',
                                              id: invoice.id,
                                              data: { send_to_guest: true }
                                            })
                                          });

                                          const result = await response.json();
                                          
                                          if (result.success) {
                                            alert(`Invoice sent successfully to ${invoice.guest_email}!`);
                                            fetchAdminData();
                                          } else {
                                            alert('Failed to send invoice: ' + (result.error || 'Unknown error'));
                                          }
                                        } catch (error) {
                                          console.error('Error sending invoice:', error);
                                          alert('Error sending invoice. Please try again.');
                                        } finally {
                                          setLoading(false);
                                        }
                                      }}
                                      className="text-purple-600 hover:text-purple-800 font-medium"
                                    >
                                      Send to Guest
                                    </button>
                                  <button
                                    onClick={async () => {
                                      try {
                                        setLoading(true);
                                        
                                        // Dynamically import jspdf and html2canvas
                                        const { default: jsPDF } = await import('jspdf');
                                        const { default: html2canvas } = await import('html2canvas');
                                        
                                        // Fetch the invoice HTML
                                        const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';
                                        const response = await fetch(`/api/invoices/${invoice.id}/html`, {
                                          headers: {
                                            'Authorization': `Bearer ${adminPassword}`
                                          }
                                        });
                                        
                                        if (!response.ok) {
                                          throw new Error('Failed to fetch invoice');
                                        }
                                        
                                        const html = await response.text();
                                        
                                        // Create a temporary container
                                        const container = document.createElement('div');
                                        container.style.position = 'absolute';
                                        container.style.left = '-9999px';
                                        container.style.width = '800px';
                                        container.style.padding = '20px 0';
                                        container.innerHTML = html;
                                        document.body.appendChild(container);
                                        
                                        // Wait for content to render
                                        await new Promise(resolve => setTimeout(resolve, 100));
                                        
                                        // Convert to canvas with lower scale for smaller file size
                                        const canvas = await html2canvas(container, {
                                          scale: 1.5,
                                          useCORS: true,
                                          logging: false,
                                          windowHeight: container.scrollHeight + 100,
                                          height: container.scrollHeight + 100
                                        });
                                        
                                        // Remove temporary container
                                        document.body.removeChild(container);
                                        
                                        // Create PDF
                                        const pdf = new jsPDF({
                                          orientation: 'portrait',
                                          unit: 'mm',
                                          format: 'a4'
                                        });
                                        
                                        const margin = 10; // 10mm margin on all sides
                                        const pageWidth = 210; // A4 width in mm
                                        const pageHeight = 297; // A4 height in mm
                                        const imgWidth = pageWidth - (margin * 2); // Width with margins
                                        const imgHeight = (canvas.height * imgWidth) / canvas.width;
                                        
                                        // Use JPEG for better compression
                                        const imgData = canvas.toDataURL('image/jpeg', 0.85);
                                        
                                        // If content is taller than one page, split into multiple pages
                                        const availableHeight = pageHeight - (margin * 2);
                                        let heightLeft = imgHeight;
                                        let position = margin; // Start with top margin
                                        
                                        // First page
                                        pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight);
                                        heightLeft -= availableHeight;
                                        
                                        // Add more pages if needed
                                        while (heightLeft > 0) {
                                          position = margin - (imgHeight - heightLeft);
                                          pdf.addPage();
                                          pdf.addImage(imgData, 'JPEG', margin, position, imgWidth, imgHeight);
                                          heightLeft -= availableHeight;
                                        }
                                        
                                        pdf.save(`Invoice-${invoice.invoice_number}.pdf`);
                                        
                                      } catch (error) {
                                        console.error('Error downloading invoice:', error);
                                        alert('Error downloading invoice. Please try again.');
                                      } finally {
                                        setLoading(false);
                                      }
                                    }}
                                    className="text-green-600 hover:text-green-800 font-medium"
                                  >
                                    Download
                                  </button>
                                  <button
                                    onClick={() => {
                                      const newStatus = prompt(
                                        `Update payment status for ${invoice.invoice_number}\n\nEnter:\n1 = Unpaid\n2 = Partially Paid\n3 = All Paid`,
                                        invoice.payment_status === 'all_paid' ? '3' : 
                                        invoice.payment_status === 'partial_paid' ? '2' : '1'
                                      );
                                      
                                      if (!newStatus) return;
                                      
                                      const statusMap: { [key: string]: string } = {
                                        '1': 'unpaid',
                                        '2': 'partial_paid',
                                        '3': 'all_paid'
                                      };
                                      
                                      const paymentStatus = statusMap[newStatus];
                                      
                                      if (!paymentStatus) {
                                        alert('Invalid selection. Please enter 1, 2, or 3.');
                                        return;
                                      }
                                      
                                      (async () => {
                                        try {
                                          setLoading(true);
                                          const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';
                                          const response = await fetch('/api/invoices', {
                                            method: 'POST',
                                            headers: {
                                              'Content-Type': 'application/json',
                                              'Authorization': `Bearer ${adminPassword}`
                                            },
                                            body: JSON.stringify({
                                              action: 'update',
                                              id: invoice.id,
                                              data: { payment_status: paymentStatus }
                                            })
                                          });

                                          const result = await response.json();
                                          
                                          if (result.success) {
                                            alert('Payment status updated successfully!');
                                            fetchAdminData();
                                          } else {
                                            alert('Failed to update: ' + (result.error || 'Unknown error'));
                                          }
                                        } catch (error) {
                                          console.error('Error updating invoice:', error);
                                          alert('Error updating invoice. Please try again.');
                                        } finally {
                                          setLoading(false);
                                        }
                                      })();
                                    }}
                                    className="text-purple-600 hover:text-purple-800 font-medium"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={async () => {
                                      if (!confirm('Delete this invoice?')) return;
                                      try {
                                        setLoading(true);
                                        const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';
                                        const response = await fetch('/api/invoices', {
                                          method: 'POST',
                                          headers: {
                                            'Content-Type': 'application/json',
                                            'Authorization': `Bearer ${adminPassword}`
                                          },
                                          body: JSON.stringify({
                                            action: 'delete',
                                            id: invoice.id
                                          })
                                        });

                                        const result = await response.json();
                                        
                                        if (result.success) {
                                          alert('Invoice deleted successfully!');
                                          fetchAdminData();
                                        } else {
                                          alert('Failed to delete invoice: ' + (result.error || 'Unknown error'));
                                        }
                                      } catch (error) {
                                        console.error('Error deleting invoice:', error);
                                        alert('Error deleting invoice. Please try again.');
                                      } finally {
                                        setLoading(false);
                                      }
                                    }}
                                    className="text-red-600 hover:text-red-800 font-medium"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Rental Agreements Tab */}
            {activeTab === 'rental-agreements' && (
              <div>
                {/* Sub-tabs */}
                <div className="border-b border-gray-200 mb-6">
                  <div className="flex">
                    <button
                      onClick={() => setRentalAgreementTab('create')}
                      className={`px-6 py-3 font-medium transition-colors ${
                        rentalAgreementTab === 'create'
                          ? 'border-b-2 border-indigo-600 text-indigo-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Create New Agreement
                    </button>
                    <button
                      onClick={() => setRentalAgreementTab('view')}
                      className={`px-6 py-3 font-medium transition-colors ${
                        rentalAgreementTab === 'view'
                          ? 'border-b-2 border-indigo-600 text-indigo-600'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      View Agreements & Submissions
                    </button>
                  </div>
                </div>

                {/* Create Agreement Sub-tab */}
                {rentalAgreementTab === 'create' && (
                  <div className="max-w-2xl mx-auto">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Create New Rental Agreement Link</h2>

                    <form onSubmit={handleCreateRentalAgreement} className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Property Name *
                        </label>
                        <input
                          type="text"
                          name="property_name"
                          required
                          value={rentalFormData.property_name}
                          onChange={(e) => setRentalFormData(prev => ({ ...prev, property_name: e.target.value }))}
                          placeholder="e.g., Spellbound Haven"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Property Address *
                        </label>
                        <input
                          type="text"
                          name="property_address"
                          required
                          value={rentalFormData.property_address}
                          onChange={(e) => setRentalFormData(prev => ({ ...prev, property_address: e.target.value }))}
                          placeholder="123 Main St, City, State 12345"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Host Email *
                        </label>
                        <input
                          type="email"
                          name="host_email"
                          required
                          value={rentalFormData.host_email}
                          onChange={(e) => setRentalFormData(prev => ({ ...prev, host_email: e.target.value }))}
                          placeholder="your-email@example.com"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          You'll receive an email notification when guests sign the agreement
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Check-in Date *
                          </label>
                          <input
                            type="date"
                            name="check_in_date"
                            required
                            value={rentalFormData.check_in_date}
                            onChange={(e) => setRentalFormData(prev => ({ ...prev, check_in_date: e.target.value }))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Check-out Date *
                          </label>
                          <input
                            type="date"
                            name="check_out_date"
                            required
                            value={rentalFormData.check_out_date}
                            onChange={(e) => setRentalFormData(prev => ({ ...prev, check_out_date: e.target.value }))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Total Amount for Stay
                        </label>
                        <input
                          type="text"
                          name="total_amount"
                          value={rentalFormData.total_amount}
                          onChange={(e) => setRentalFormData(prev => ({ ...prev, total_amount: e.target.value }))}
                          placeholder="$2,500.00"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          Optional: Include dollar sign (e.g., $2,500.00) - will be displayed on the agreement
                        </p>
                      </div>

                      <div>
                        <label className="flex items-center cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            checked={rentalFormData.security_deposit !== ''}
                            onChange={(e) => setRentalFormData(prev => ({ ...prev, security_deposit: e.target.checked ? '500' : '' }))}
                            className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm font-medium text-gray-700">Require Security Deposit</span>
                        </label>
                        {rentalFormData.security_deposit !== '' && (
                          <div className="ml-7">
                            <label className="block text-xs text-gray-500 mb-1">Amount ($)</label>
                            <input
                              type="text"
                              name="security_deposit"
                              value={rentalFormData.security_deposit}
                              onChange={(e) => setRentalFormData(prev => ({ ...prev, security_deposit: e.target.value }))}
                              placeholder="500"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                              Default: $500. Guest will be asked to authorize this refundable deposit.
                            </p>
                          </div>
                        )}
                        {rentalFormData.security_deposit === '' && (
                          <p className="ml-7 text-xs text-gray-500">
                            No security deposit will be required (e.g., for VRBO guests)
                          </p>
                        )}
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-sm font-medium text-gray-700">
                            Rental Terms & Conditions
                          </label>
                          <button
                            type="button"
                            onClick={openSaveDialog}
                            className="text-xs px-3 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded font-medium transition"
                          >
                            Save as Template
                          </button>
                        </div>

                        {/* Saved Templates */}
                        {templates.length > 0 && (
                          <div className="mb-2 p-3 bg-blue-50 rounded border border-blue-200">
                            <p className="text-xs font-medium text-blue-800 mb-2">Saved Templates:</p>
                            <div className="space-y-1">
                              {templates.map((template) => (
                                <div key={template.id} className="flex items-center justify-between text-xs bg-white p-2 rounded">
                                  <span className="font-medium text-gray-700">{template.name}</span>
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => loadTemplateContent(template.id)}
                                      className="text-blue-600 hover:text-blue-800 font-medium"
                                    >
                                      Load
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => deleteTemplate(template.id, template.name)}
                                      className="text-red-600 hover:text-red-800 font-medium"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {templateMessage && (
                          <div className="mb-2 text-xs text-green-600 font-medium">
                            {templateMessage}
                          </div>
                        )}

                        {/* Save Template Dialog */}
                        {showSaveDialog && (
                          <div className="mb-2 p-3 bg-green-50 rounded border border-green-200">
                            <p className="text-xs font-medium text-green-800 mb-2">Save Template As:</p>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={templateName}
                                onChange={(e) => setTemplateName(e.target.value)}
                                placeholder="e.g., Standard House Rules"
                                className="flex-1 px-3 py-1 text-sm border border-green-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault()
                                    saveAsTemplate()
                                  }
                                }}
                              />
                              <button
                                type="button"
                                onClick={saveAsTemplate}
                                className="text-xs px-3 py-1 bg-green-600 text-white hover:bg-green-700 rounded font-medium"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setShowSaveDialog(false)}
                                className="text-xs px-3 py-1 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded font-medium"
                              >
                                Cancel
                              </button>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">If a template with this name exists, it will be updated.</p>
                          </div>
                        )}

                        <RichTextEditor
                          value={rentalFormData.rental_terms}
                          onChange={(value) => setRentalFormData(prev => ({ ...prev, rental_terms: value }))}
                          placeholder="Enter any specific terms, house rules, or conditions..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Logo (Optional)
                        </label>
                        <p className="text-xs text-gray-500 mb-2">Upload a logo to display in the top right corner of the agreement form (max 2MB)</p>
                        {rentalFormData.logo ? (
                          <div className="space-y-2">
                            <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 flex items-center justify-between">
                              <img 
                                src={rentalFormData.logo} 
                                alt="Logo preview" 
                                className="h-16 w-auto object-contain"
                              />
                              <button
                                type="button"
                                onClick={removeLogo}
                                className="text-sm text-red-600 hover:text-red-800 font-medium"
                              >
                                Remove Logo
                              </button>
                            </div>
                          </div>
                        ) : (
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                          />
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Link Expires In
                        </label>
                        <select
                          name="expires_in_days"
                          value={rentalFormData.expires_in_days}
                          onChange={(e) => setRentalFormData(prev => ({ ...prev, expires_in_days: e.target.value }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                          <option value="">Never</option>
                          <option value="1">1 day</option>
                          <option value="3">3 days</option>
                          <option value="7">7 days</option>
                          <option value="14">14 days</option>
                          <option value="30">30 days</option>
                        </select>
                      </div>

                      <div className="flex gap-3">
                        <button
                          type="submit"
                          disabled={loading}
                          className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center gap-2"
                        >
                          <FileSignature className="w-5 h-5" />
                          {loading ? 'Creating...' : 'Create Agreement Link'}
                        </button>
                        <button
                          type="button"
                          onClick={downloadRentalAgreementAsPDF}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center gap-2"
                        >
                          <Download className="w-5 h-5" />
                          Download as PDF
                        </button>
                      </div>
                    </form>

                    {/* Success Modal */}
                    {createdRentalLink && (
                      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                          <div className="text-center mb-6">
                            <div className="text-green-500 text-5xl mb-3">✓</div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-2">Agreement Created!</h3>
                            <p className="text-gray-600">Your rental agreement link is ready to share</p>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Agreement Link
                              </label>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={createdRentalLink}
                                  readOnly
                                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded text-sm"
                                />
                                <button
                                  onClick={() => copyToClipboard(createdRentalLink)}
                                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium whitespace-nowrap"
                                >
                                  {copiedLink === createdRentalLink ? '✓ Copied!' : 'Copy'}
                                </button>
                              </div>
                              <p className="text-xs text-gray-500 mt-2">Share this link with your guest</p>
                            </div>

                            <button
                              onClick={() => setCreatedRentalLink(null)}
                              className="w-full py-3 px-6 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-lg transition duration-200"
                            >
                              Close
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* View Agreements & Submissions Sub-tab */}
                {rentalAgreementTab === 'view' && (
                  <div className="space-y-8">
                    {/* Agreements Section */}
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800 mb-4">All Rental Agreements</h2>
                      <div className="space-y-4">
                        {rentalAgreements.length === 0 ? (
                          <p className="text-gray-500 text-center py-8">No rental agreements created yet</p>
                        ) : (
                          rentalAgreements.map((agreement) => (
                            <div key={agreement.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h3 className="font-semibold text-lg text-gray-800">{agreement.property_name}</h3>
                                  <p className="text-sm text-gray-600">{agreement.property_address}</p>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {formatDateForDisplay(agreement.check_in_date)} - {formatDateForDisplay(agreement.check_out_date)}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-2">
                                    Created: {new Date(agreement.created_at).toLocaleString()}
                                  </p>
                                  {agreement.link_expires_at && (
                                    <p className="text-xs text-orange-600 mt-1">
                                      Expires: {new Date(agreement.link_expires_at).toLocaleString()}
                                    </p>
                                  )}
                                  {agreement.rental_terms && (
                                    <details className="mt-3">
                                      <summary className="text-sm font-medium text-indigo-600 cursor-pointer hover:text-indigo-800">
                                        View Rental Terms
                                      </summary>
                                      <div 
                                        className="mt-2 prose prose-sm prose-gray max-w-none bg-white p-3 rounded border border-gray-200"
                                        dangerouslySetInnerHTML={{ __html: cleanHtml(agreement.rental_terms) }}
                                      />
                                    </details>
                                  )}
                                </div>
                                <div className="ml-4 flex flex-col gap-2">
                                  <button
                                    onClick={() => copyToClipboard(getRentalAgreementLink(agreement.id))}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium text-sm whitespace-nowrap"
                                  >
                                    {copiedLink === getRentalAgreementLink(agreement.id) ? 'Copied!' : 'Copy Link'}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteRentalAgreement(agreement.id, agreement.property_name)}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium text-sm whitespace-nowrap"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Submissions Section */}
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800 mb-4">Guest Submissions</h2>
                      <div className="overflow-x-auto">
                        {rentalSubmissions.length === 0 ? (
                          <p className="text-gray-500 text-center py-8">No submissions yet</p>
                        ) : (
                          <table className="w-full">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Guest Name</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Check-in / Check-out</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Contact</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Guests</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Vehicles</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Authorizations</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Submitted</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">View</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">View Link</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {rentalSubmissions.map((submission) => (
                                <tr key={submission.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 text-sm text-gray-800">{submission.guest_name}</td>
                                  <td className="px-4 py-3 text-sm text-gray-600">
                                    <div className="space-y-1">
                                      <div className="font-medium">{submission.check_in_date ? formatDateForDisplay(submission.check_in_date) : 'N/A'}</div>
                                      <div className="text-xs text-gray-500">to {submission.check_out_date ? formatDateForDisplay(submission.check_out_date) : 'N/A'}</div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-600">
                                    <div className="space-y-1">
                                      <div>{submission.guest_email}</div>
                                      <div className="text-xs">{submission.guest_phone}</div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-600">
                                    <div className="space-y-1">
                                      <div>{submission.num_adults} Adult{submission.num_adults !== 1 ? 's' : ''}</div>
                                      <div>{submission.num_children} Child{submission.num_children !== 1 ? 'ren' : ''}</div>
                                      {submission.additional_adults && submission.additional_adults.length > 0 && (
                                        <div className="mt-1 text-xs text-gray-500">
                                          <span className="font-medium">Additional:</span>{' '}
                                          {submission.additional_adults.map(a => a.name).join(', ')}
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-600">
                                    {submission.vehicles && submission.vehicles.length > 0 ? (
                                      <details className="cursor-pointer">
                                        <summary className="text-indigo-600 hover:text-indigo-800 font-medium">
                                          {submission.vehicles.length} Vehicle{submission.vehicles.length !== 1 ? 's' : ''}
                                        </summary>
                                        <div className="mt-2 space-y-2 bg-gray-50 p-2 rounded text-xs">
                                          {submission.vehicles.map((vehicle, idx) => (
                                            <div key={idx} className="border-b border-gray-200 pb-1 last:border-0">
                                              <div><strong>Plate:</strong> {vehicle.license_plate || 'N/A'}</div>
                                              <div><strong>Make/Model:</strong> {vehicle.make || 'N/A'} {vehicle.model || ''}</div>
                                              <div><strong>Color:</strong> {vehicle.color || 'N/A'}</div>
                                            </div>
                                          ))}
                                        </div>
                                      </details>
                                    ) : (
                                      <span className="text-gray-400">None</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-600">
                                    <div className="space-y-1">
                                      <div>
                                        {submission.security_deposit_authorized ? (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                            ✓ Deposit
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                            ✗ Deposit
                                          </span>
                                        )}
                                      </div>
                                      <div>
                                        {submission.electronic_signature_agreed ? (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                            ✓ E-Sign
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                            ✗ E-Sign
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-600">
                                    {new Date(submission.submitted_at).toLocaleString()}
                                  </td>
                                  <td className="px-4 py-3">
                                    <a
                                      href={`/rental-submission/${submission.view_token}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                                    >
                                      View Agreement
                                    </a>
                                  </td>
                                  <td className="px-4 py-3">
                                    <button
                                      onClick={() => {
                                        const viewLink = `${window.location.origin}/rental-submission/${submission.view_token}`
                                        navigator.clipboard.writeText(viewLink)
                                        alert('View link copied to clipboard!')
                                      }}
                                      className="text-sm text-green-600 hover:text-green-800 font-medium"
                                    >
                                      Copy Link
                                    </button>
                                  </td>
                                  <td className="px-4 py-3">
                                    <button
                                      onClick={() => handleDeleteRentalSubmission(submission.id!, submission.guest_name)}
                                      className="text-sm text-red-600 hover:text-red-800 font-medium"
                                    >
                                      Delete
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Airbnb Calendar Sync</h2>
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">⏰</span>
                        <h3 className="font-semibold text-green-800">Automatic Daily Sync Enabled</h3>
                      </div>
                      <p className="text-sm text-green-700">
                        Your Airbnb calendar syncs automatically once per day at midnight (00:00 UTC) via Vercel Cron.
                        New bookings from Airbnb will be blocked on your website automatically!
                      </p>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Airbnb iCal URL
                      </label>
                      <input
                        type="url"
                        value={airbnbUrl}
                        onChange={(e) => setAirbnbUrl(e.target.value)}
                        placeholder="https://www.airbnb.com/calendar/ical/..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Get this URL from your Airbnb listing's availability settings
                      </p>
                    </div>
                    
                    <button
                      onClick={handleSyncAirbnb}
                      disabled={loading || !airbnbUrl}
                      className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition disabled:bg-gray-400"
                    >
                      {loading ? 'Syncing...' : 'Manual Sync Now'}
                    </button>

                    {lastSync && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <div className="text-sm">
                          <div className="font-medium text-blue-800 mb-1">Last Airbnb Sync:</div>
                          <div className="text-blue-700">
                            🕐 {new Date(lastSync.last_synced).toLocaleString()}
                          </div>
                          <div className="text-xs text-blue-600 mt-2">
                            Next automatic sync: Tomorrow at midnight (00:00 UTC)
                          </div>
                        </div>
                      </div>
                    )}

                    {/* VRBO Calendar Sync */}
                    <div className="mt-8 pt-8 border-t border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">VRBO Calendar Sync</h3>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          VRBO iCal URL
                        </label>
                        <input
                          type="url"
                          value={vrboUrl}
                          onChange={(e) => setVrboUrl(e.target.value)}
                          placeholder="https://www.vrbo.com/icalendar/..."
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Get this URL from your VRBO listing's calendar export settings
                        </p>
                      </div>
                      
                      <button
                        onClick={handleSyncVrbo}
                        disabled={loading || !vrboUrl}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:bg-gray-400"
                      >
                        {loading ? 'Syncing...' : 'Manual Sync VRBO Now'}
                      </button>

                      {vrboLastSync && (
                        <div className="mt-4 p-3 bg-green-50 rounded-lg">
                          <div className="text-sm">
                            <div className="font-medium text-green-800 mb-1">Last VRBO Sync:</div>
                            <div className="text-green-700">
                              🕐 {new Date(vrboLastSync.last_synced).toLocaleString()}
                            </div>
                            <div className="text-xs text-green-600 mt-2">
                              Next automatic sync: Tomorrow at midnight (00:00 UTC)
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">Environment Variables</h2>
                  <div className="bg-gray-50 rounded-lg p-6 space-y-3 text-sm">
                    <div>
                      <div className="font-medium text-gray-700">Required Environment Variables:</div>
                      <ul className="list-disc list-inside mt-2 space-y-1 text-gray-600">
                        <li><code className="bg-gray-200 px-2 py-0.5 rounded">POSTGRES_URL</code> - Neon database URL</li>
                        <li><code className="bg-gray-200 px-2 py-0.5 rounded">RESEND_API_KEY</code> - Resend API key for emails</li>
                        <li><code className="bg-gray-200 px-2 py-0.5 rounded">HOST_EMAIL</code> - Your email for notifications</li>
                        <li><code className="bg-gray-200 px-2 py-0.5 rounded">NEXT_PUBLIC_ADMIN_PASSWORD</code> - Admin dashboard password</li>
                        <li><code className="bg-gray-200 px-2 py-0.5 rounded">CRON_SECRET</code> - Secret for Vercel Cron (generate with: openssl rand -base64 32)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

