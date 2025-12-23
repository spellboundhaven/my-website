export interface PropertyImage {
  src: string
  alt: string
  caption?: string
}

export interface Room {
  name: string
  description: string
  images: PropertyImage[]
  floorPlan?: string
}

export interface Amenity {
  name: string
  description: string
  icon: string
}

export interface Review {
  id: string
  name: string
  rating: number
  date: string
  location?: string
  comment: string
}

export interface Pricing {
  date: string
  price: number
  available: boolean
  minimumStay?: number
}

export const propertyData = {
  name: "Spellbound Haven",
  tagline: "Where Magic Meets Luxury",
  description: "Embark on an enchanting Disney adventure by reserving your stay at Spellbound Haven, where the magic never ends! Our luxurious 10-bedroom, 8-bathroom home, located in the heart of Windsor Island Resort, promises an unforgettable getaway just 9 miles from Disney World.",
  
  hero: {
    title: "Welcome to Spellbound Haven",
    subtitle: "Your Gateway to Disney Magic",
    backgroundImage: "/images/hero/hero.jpg", // Local image example
    cta: "Book Your Stay"
  },

  overview: {
    summary: "Designed to accommodate a maximum of 20 guests, Spellbound Haven ensures comfort and convenience for every member of your party. Located just 9 miles from Disney World, this property features custom-built kids-themed bedrooms, a Marvel arcade game room, private pool and spa, and access to Windsor Island Resort amenities.",
    highlights: [
      "10 Bedrooms, 8 Bathrooms",
      "5 King Master Suites",
      "9 miles to Disney World",
      "Custom-built kids-themed bedrooms",
      "Private heated pool with hot tub",
      "Marvel arcade game room",
      "Windsor Island Resort amenities",
      "Spectrum TV package with high-speed WiFi (990mbps)",
      "Baby and kids friendly amenities",
      "Free parking with resort pass for up to 3 vehicles"
    ],
    images: [
      {
        src: "/images/rooms/livingroom/4.jpg",
        alt: "Spacious living room",
        caption: "Cozy living room"
      },
      {
        src: "/images/amenities/21.jpg",
        alt: "Marvel arcade game room",
        caption: "Marvel arcade game room"
      },     
      {
        src: "/images/rooms/loft/1.jpg",
        alt: "Entertainment Loft",
        caption: "Cozy entertainment loft space"
      }
    ]
  },

  rooms: [
    {
      name: "Outdoor Pool Area",
      description: "Private pool and spa area with outdoor dining, lounge chairs, and hot tub perfect for starlit evenings.",
      images: [
        {
          src: "/images/rooms/outdoor/2.jpg",
          alt: "Outdoor Pool Area"
        },
        {
          src: "/images/rooms/outdoor/101.jpg",
          alt: "Pool Deck"
        },
        {
          src: "/images/rooms/outdoor/105.jpg",
          alt: "Outdoor Paradise"
        }
      ]
    },
    {
      name: "First Floor - Living Room",
      description: "Spacious living room with comfortable seating, smart TV, and perfect for relaxation and socializing.",
      images: [
        {
          src: "/images/rooms/livingroom/3.jpg",
          alt: "First Floor Living Room"
        },
        {
          src: "/images/rooms/livingroom/4.jpg",
          alt: "Living Room Seating Area"
        },
        {
          src: "/images/rooms/livingroom/5.jpg",
          alt: "Living Room Seating Area"
        },
        {
          src: "/images/rooms/livingroom/6.jpg",
          alt: "Living Room Seating Area"
        },
        {
          src: "/images/rooms/livingroom/7.jpg",
          alt: "Living Room Seating Area"
        },
        {
          src: "/images/rooms/livingroom/8.jpg",
          alt: "Living Room Seating Area"
        }
      ]
    },
    {
      name: "First Floor - Kitchen",
      description: "Fully equipped modern kitchen with large dining table, premium appliances, and everything needed for family meals.",
      images: [
        {
          src: "/images/rooms/kitchen/13.jpg",
          alt: "Modern Kitchen"
        },
        {
          src: "/images/rooms/kitchen/6.jpg",
          alt: "Kitchen Dining Area"
        },
        {
          src: "/images/rooms/kitchen/4.jpg",
          alt: "Kitchen Appliances"
        }
      ]
    },
    {
      name: "First Floor - Marvel Arcade Game Room",
      description: "Thrilling Marvel game room featuring basketball machine, Fast and Furious racing game, skeeball machine, and air hockey table.",
      images: [
        {
          src: "/images/amenities/20.jpg",
          alt: "Marvel Arcade Game Room"
        },
        {
          src: "/images/amenities/21.jpg",
          alt: "Marvel Arcade Game Room"
        },
        {
          src: "/images/amenities/22.jpg",
          alt: "Marvel Arcade Game Room"
        }
      ]
    },
    {
      name: "First Floor - King Master Suite 1",
      description: "Downstairs king master bedroom with ensuite bathroom featuring walk-in shower and separate tub.",
      images: [
        {
          src: "/images/rooms/master/16.jpg",
          alt: "First Floor King Master Suite 1"
        },
        {
          src: "/images/rooms/master/17.jpg",
          alt: "First Floor King Master Suite 1"
        },
        {
          src: "/images/rooms/master/18.jpg",
          alt: "First Floor King Master Suite 1"
        },
      ]
    },
    {
      name: "First Floor - Two Doubles Room",
      description: "Downstairs bedroom with 2 queen beds and ensuite bathroom with walk-in shower.",
      images: [
        {
          src: "/images/rooms/master/26.jpg",
          alt: "First Floor Two Doubles Room"
        },
        {
          src: "/images/rooms/master/27.jpg",
          alt: "First Floor Two Doubles Room"
        },
        {
          src: "/images/rooms/master/28.jpg",
          alt: "First Floor Two Doubles Room"
        }
      ]
    },
    {
      name: "First Floor - Laundry Room",
      description: "Convenient laundry room with full-size washer and dryer for all your laundry needs during your stay.",
      images: [
        {
          src: "/images/rooms/laundry/14.jpg",
          alt: "Washer and Dryer"
        },
        {
          src: "/images/rooms/laundry/15.jpg",
          alt: "Laundry Room"
        }
      ]
    },
    {
      name: "Second Floor - Mario Bros Themed Bedroom",
      description: "Upstairs Mario Bros themed bunkbed bedroom with attached shared bathroom.",
      images: [
        {
          src: "/images/rooms/themed/70.jpg",
          alt: "Mario Bros Themed Bedroom"
        },
        {
          src: "/images/rooms/themed/71.jpg",
          alt: "Mario Bros Themed Bedroom"
        },
        {
          src: "/images/rooms/themed/72.jpg",
          alt: "Mario Bros Themed Bedroom"
        }
      ]
    },
    {
      name: "Second Floor - Star Wars Themed Bedroom",
      description: "Upstairs Star Wars themed bunkbed bedroom with attached shared bathroom.",
      images: [
        {
          src: "/images/rooms/themed/60.jpg",
          alt: "Star Wars Themed Bedroom"
        },
        {
          src: "/images/rooms/themed/61.jpg",
          alt: "Star Wars Themed Bedroom"
        },
        {
          src: "/images/rooms/themed/62.jpg",
          alt: "Star Wars Themed Bedroom"
        },
        {
          src: "/images/rooms/themed/63.jpg",
          alt: "Star Wars Themed Bedroom"
        },
        {
          src: "/images/rooms/themed/64.jpg",
          alt: "Star Wars Themed Bedroom"
        },
      ]
    },
    {
      name: "Second Floor - Encanto Themed Bedroom",
      description: "Upstairs Encanto themed bedroom with 2 twin beds and attached shared bathroom.",
      images: [
        {
          src: "/images/rooms/themed/44.jpg",
          alt: "Encanto Themed Bedroom"
        },
        {
          src: "/images/rooms/themed/45.jpg",
          alt: "Encanto Themed Bedroom"
        },
        {
          src: "/images/rooms/themed/46.jpg",
          alt: "Encanto Themed Bedroom"
        }
      ]
    },
    {
      name: "Second Floor - Harry Potter Themed Bedroom",
      description: "Upstairs Harry Potter themed bunkbed bedroom with ensuite bathroom.",
      images: [
        {
          src: "/images/rooms/themed/30.jpg",
          alt: "Harry Potter Themed Bedroom"
        },
        {
          src: "/images/rooms/themed/31.jpg",
          alt: "Harry Potter Themed Bedroom"
        },
        {
          src: "/images/rooms/themed/32.jpg",
          alt: "Harry Potter Themed Bedroom"
        },
        {
          src: "/images/rooms/themed/33.jpg",
          alt: "Harry Potter Themed Bedroom"
        },
        {
          src: "/images/rooms/themed/34.jpg",
          alt: "Harry Potter Themed Bedroom"
        },
      ]
    },
    {
      name: "Second Floor - King Master Suite 2",
      description: "Upstairs king master bedroom with ensuite bathroom.",
      images: [
        {
          src: "/images/rooms/master/40.jpg",
          alt: "Second Floor King Master Suite 2"
        },
        {
          src: "/images/rooms/master/41.jpg",
          alt: "Second Floor King Master Suite 2"
        },
        {
          src: "/images/rooms/master/42.jpg",
          alt: "Second Floor King Master Suite 2"
        },
      ]
    },
    {
      name: "Second Floor - King Master Suite 3",
      description: "Upstairs king master bedroom with attached shared bathroom.",
      images: [
        {
          src: "/images/rooms/master/51.jpg",
          alt: "Second Floor King Master Suite 3"
        },
        {
          src: "/images/rooms/master/52.jpg",
          alt: "Second Floor King Master Suite 3"
        },
        {
          src: "/images/rooms/master/53.jpg",
          alt: "Second Floor King Master Suite 3"
        }
      ]
    },
    {
      name: "Second Floor - King Master Suite 4",
      description: "Upstairs king master bedroom with ensuite bathroom.",
      images: [
        {
          src: "/images/rooms/master/65.jpg",
          alt: "Second Floor King Master Suite 4"
        },
        {
          src: "/images/rooms/master/66.jpg",
          alt: "Second Floor King Master Suite 4"
        },
        {
          src: "/images/rooms/master/67.jpg",
          alt: "Second Floor King Master Suite 4"
        },
      ]
    },
    {
      name: "Second Floor - King Master Suite 5",
      description: "Upstairs king master bedroom with ensuite bathroom.",
      images: [
        {
          src: "/images/rooms/master/73.jpg",
          alt: "Second Floor King Master Suite 5"
        },
        {
          src: "/images/rooms/master/74.jpg",
          alt: "Second Floor King Master Suite 5"
        },
        {
          src: "/images/rooms/master/75.jpg",
          alt: "Second Floor King Master Suite 5"
        }
      ]
    },
    {
      name: "Second Floor - Entertainment Loft",
      description: "Enchanting entertainment loft with smart TV, plush couches, shuffleboard, and pool tables.",
      images: [
        {
          src: "/images/rooms/loft/83.jpg",
          alt: "Entertainment Loft"
        },
        {
          src: "/images/rooms/loft/1.jpg",
          alt: "Entertainment Loft"
        },
        {
          src: "/images/rooms/loft/82.jpg",
          alt: "Entertainment Loft"
        }
      ]
    },
    {
      name: "Windsor Island Resort Amenities",
      description: "Exclusive resort facilities including resort-style pool, lazy river, water slides, mini-golf, sports courts, and more.",
      images: [
        {
          src: "/images/rooms/resort/121.jpeg",
          alt: "Resort Pool"
        },
        {
          src: "/images/rooms/resort/122.jpeg",
          alt: "Water Slides"
        },
        {
          src: "/images/rooms/resort/123.jpeg",
          alt: "Lazy River"
        },
        {
          src: "/images/rooms/resort/124.jpg",
          alt: "Pool Side Bar"
        },
        {
          src: "/images/rooms/resort/125.jpg",
          alt: "Hot Tub"
        },
        {
          src: "/images/rooms/resort/126.jpg",
          alt: "Kid's Splash Pool"
        },
        {
          src: "/images/rooms/resort/127.jpg",
          alt: "Arcade Room"
        },
        {
          src: "/images/rooms/resort/128.jpg",
          alt: "Mini Golf"
        },
        {
          src: "/images/rooms/resort/129.jpg",
          alt: "Basketball Court"
        },
        {
          src: "/images/rooms/resort/130.jpg",
          alt: "Fitness Gym"
        },
        {
          src: "/images/rooms/resort/131.jpg",
          alt: "Gym Equipment"
        }
      ]
    }
  ] as Room[],

  houseAmenities: [
    {
      name: "Private Pool & Spa",
      description: "Delightful private pool available for heating, with soothing hot tub perfect for starlit evenings",
      icon: "🏊‍♀️"
    },
    {
      name: "Marvel Arcade Game Room",
      description: "Thrilling game room with basketball machine, Fast and Furious racing game, skeeball, and air hockey",
      icon: "🎮"
    },
    {
      name: "Fully Stocked Kitchen",
      description: "Modern kitchen with 12-seat dining table, regular coffee machine, Keurig, and 4 bar stools",
      icon: "👨‍🍳"
    },
    {
      name: "High-Speed WiFi",
      description: "High-speed Wi-Fi at 400mbps+ throughout the entire home with Spectrum TV Select services",
      icon: "📶"
    },
    {
      name: "Smart TVs Everywhere",
      description: "Flat-screen Smart TV in each bedroom, plus living room and entertainment loft TVs",
      icon: "📺"
    },
    {
      name: "Free Parking",
      description: "Free parking with resort pass available at clubhouse upon arrival",
      icon: "🚗"
    },
    {
      name: "Outdoor Patio",
      description: "Six-person dining set, 4 lounge chairs, cozy seating area, and hot tub",
      icon: "🍽️"
    },
    {
      name: "Laundry Facilities",
      description: "Washer and dryer ready to handle your laundry needs",
      icon: "🧺"
    },
    {
      name: "Themed Bedrooms",
      description: "Custom-built kids-themed bedrooms: Mario Bros, Star Wars, Encanto, and Harry Potter",
      icon: "🏰"
    },
    {
      name: "Entertainment Loft",
      description: "Cozy hangout area with smart TV, shuffleboard, pool tables, and versatile seating",
      icon: "🛋️"
    },
    {
      name: "Essential Start-Up Kit",
      description: "Includes basic kitchen cookware, toilet paper, soap, shampoo, conditioner, and more",
      icon: "🧴"
    },
    {
      name: "Baby Essentials",
      description: "Pack 'N Play, baby high chair, and plastic dinnerware available",
      icon: "👶"
    }
  ] as Amenity[],

  resortAmenities: [
    {
      name: "Windsor Island Resort Pool",
      description: "Resort-style pool with complimentary access via community cards",
      icon: "🏊‍♀️"
    },
    {
      name: "Lazy River",
      description: "Leisurely moments at the resort's lazy river",
      icon: "🌊"
    },
    {
      name: "Kids Water Park",
      description: "Let the little ones splash in the kids' water park",
      icon: "👶"
    },
    {
      name: "Water Slides",
      description: "Take thrilling rides down the resort's water slides",
      icon: "🎢"
    },
    {
      name: "Mini-Golf Course",
      description: "Test your skills on the resort's mini-golf course",
      icon: "⛳"
    },
    {
      name: "Sand Volleyball Court",
      description: "Join in on friendly matches on the sand volleyball court",
      icon: "🏐"
    },
    {
      name: "Basketball Court",
      description: "Shoot some hoops on the resort's basketball court",
      icon: "🏀"
    },
    {
      name: "Pickleball Court",
      description: "Enjoy friendly matches on the resort's pickleball court",
      icon: "🏓"
    },
    {
      name: "Kids Playground",
      description: "Safe and fun playground area for children to play and explore",
      icon: "🛝"
    }
  ] as Amenity[],

  reviews: [
    {
      id: "1",
      name: "Jeanette",
      rating: 5,
      date: "June 2025",
      comment: "We had an amazing time at this house for our family reunion! It was the perfect space to make memories we'll never forget. The home was spacious and comfortable, with a great game room and a beautiful pool that the kids enjoyed every single day. Highly recommend for large family gatherings!"
    },
    {
      id: "2",
      name: "Elisha",
      rating: 5,
      date: "April 2025",
      comment: "Very clean and everything worked. We will definitely be back"
    },
    {
      id: "3",
      name: "Ashley",
      rating: 5,
      date: "August 2025",
      location: "New York, New York",
      comment: "What a house. My family loved it. We surprised the kids and they freaked out with the arcade in the home and the private pool. The rooms and slides were so cool, kids slept in a different one each night. It is the perfect location and close to Orlando and all the parks. Rooms were clean and spacious. We used the community amenities one day, but it was a little more crowded than we liked. We had all we absolutely needed. We highly recommend and would stay again."
    },
    {
      id: "4",
      name: "Holly",
      rating: 5,
      date: "August 2024",
      location: "Cedar Rapids, Iowa",
      comment: "The place looked just like the pictures. I was worried it was going to be small but it was very spacious. We had 15 people, including 9 kids and you couldn't tell at all. We were able to get in and out of the entrance easily. We didn't use the club house/water slides at all, so wouldn't be able to judge that. It always seemed busy and limited parking near there so you would want to get there early in the day to park in order to use them. We would definitely book this place again if we do another Florida vacation."
    },
    {
      id: "5",
      name: "Brent",
      rating: 5,
      date: "July 2024",
      comment: "This home was absolutely perfect for our extended family to all meet up together from different states. Each bedroom had plenty of space. The kids' themed rooms were such a huge hit with our kids as they had so much fun hanging out with the fun lights and slides. The game room was also great for both the kids and adults! The home is not private from neighboring houses or those directly behind us, but we still used the pool as well as the resort pools. Our younger kids had a blast in the splash pad area. Unfortunately, the bigger slides were closed during our week stay. The home had a pack-n-play, stroller on hand, and a high chair (IYKYK)!"
    },
    {
      id: "6",
      name: "Kristine",
      rating: 5,
      date: "June 2024",
      location: "Dickinson, Texas",
      comment: "We had a wonderful stay at this property. The house was exactly as it was advertised and perfect for our family. The kids loved the slide bunk beds and the gameroom."
    }
  ] as Review[],

  contact: {
    phone: "+1 (555) 123-4567",
    email: "spellboundhaven.disney@gmail.com",
    address: "Windsor Island Resort, Orlando, FL",
    hours: "Available 24/7 for bookings"
  }
}

export const samplePricing: Pricing[] = [
  { date: "2024-02-01", price: 450, available: true, minimumStay: 3 },
  { date: "2024-02-02", price: 450, available: true, minimumStay: 3 },
  { date: "2024-02-03", price: 450, available: true, minimumStay: 3 },
  { date: "2024-02-04", price: 450, available: true, minimumStay: 3 },
  { date: "2024-02-05", price: 450, available: true, minimumStay: 3 },
  { date: "2024-02-06", price: 450, available: true, minimumStay: 3 },
  { date: "2024-02-07", price: 450, available: true, minimumStay: 3 },
  { date: "2024-02-08", price: 500, available: true, minimumStay: 3 },
  { date: "2024-02-09", price: 500, available: true, minimumStay: 3 },
  { date: "2024-02-10", price: 500, available: true, minimumStay: 3 },
  { date: "2024-02-11", price: 500, available: true, minimumStay: 3 },
  { date: "2024-02-12", price: 500, available: true, minimumStay: 3 },
  { date: "2024-02-13", price: 500, available: true, minimumStay: 3 },
  { date: "2024-02-14", price: 600, available: false, minimumStay: 3 },
  { date: "2024-02-15", price: 600, available: false, minimumStay: 3 },
  { date: "2024-02-16", price: 600, available: false, minimumStay: 3 },
  { date: "2024-02-17", price: 600, available: false, minimumStay: 3 },
  { date: "2024-02-18", price: 500, available: true, minimumStay: 3 },
  { date: "2024-02-19", price: 500, available: true, minimumStay: 3 },
  { date: "2024-02-20", price: 500, available: true, minimumStay: 3 },
  { date: "2024-02-21", price: 500, available: true, minimumStay: 3 },
  { date: "2024-02-22", price: 500, available: true, minimumStay: 3 },
  { date: "2024-02-23", price: 500, available: true, minimumStay: 3 },
  { date: "2024-02-24", price: 500, available: true, minimumStay: 3 },
  { date: "2024-02-25", price: 500, available: true, minimumStay: 3 },
  { date: "2024-02-26", price: 500, available: true, minimumStay: 3 },
  { date: "2024-02-27", price: 500, available: true, minimumStay: 3 },
  { date: "2024-02-28", price: 500, available: true, minimumStay: 3 },
  { date: "2024-02-29", price: 500, available: true, minimumStay: 3 }
]
