export default function StructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "VacationRental",
    "name": "Spellbound Haven",
    "description": "Luxury 10-bedroom Disney vacation rental at Windsor Island Resort, Orlando. Perfect for family gatherings and multigenerational trips. Sleeps 20 guests with private pool and themed bedrooms.",
    "url": "https://spellboundhaven.com",
    "image": "https://spellboundhaven.com/images/hero/hero.jpg",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Orlando",
      "addressRegion": "FL",
      "addressCountry": "US",
      "streetAddress": "Windsor Island Resort"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "28.2639",
      "longitude": "-81.6081"
    },
    "telephone": "",
    "email": "spellboundhaven.disney@gmail.com",
    "priceRange": "$450-$1000",
    "amenityFeature": [
      {
        "@type": "LocationFeatureSpecification",
        "name": "Private Pool",
        "value": true
      },
      {
        "@type": "LocationFeatureSpecification",
        "name": "Hot Tub",
        "value": true
      },
      {
        "@type": "LocationFeatureSpecification",
        "name": "WiFi",
        "value": true
      },
      {
        "@type": "LocationFeatureSpecification",
        "name": "Game Room",
        "value": true
      },
      {
        "@type": "LocationFeatureSpecification",
        "name": "Themed Bedrooms",
        "value": true
      }
    ],
    "numberOfRooms": 10,
    "numberOfBedrooms": 10,
    "numberOfBathroomsTotal": 8,
    "occupancy": {
      "@type": "QuantitativeValue",
      "maxValue": 20
    },
    "petsAllowed": false,
    "checkInTime": "16:00",
    "checkOutTime": "10:00",
    "starRating": {
      "@type": "Rating",
      "ratingValue": "5",
      "bestRating": "5"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "5.0",
      "reviewCount": "6"
    },
    "sameAs": [
      "https://www.facebook.com/spellboundhaven.disney",
      "https://www.instagram.com/spellboundhaven",
      "https://airbnb.com/h/spellbound-haven"
    ]
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

