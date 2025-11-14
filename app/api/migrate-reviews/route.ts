import { NextRequest, NextResponse } from 'next/server';
import { createReview } from '@/lib/db';

// One-time migration to add existing reviews to database
export async function POST(request: NextRequest) {
  try {
    // Simple password protection
    const authHeader = request.headers.get('authorization');
    const password = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';

    if (!authHeader || authHeader !== `Bearer ${password}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existingReviews = [
      {
        name: "Jeanette",
        rating: 5,
        date: "June 2025",
        comment: "We had an amazing time at this house for our family reunion! It was the perfect space to make memories we'll never forget. The home was spacious and comfortable, with a great game room and a beautiful pool that the kids enjoyed every single day. Highly recommend for large family gatherings!"
      },
      {
        name: "Elisha",
        rating: 5,
        date: "April 2025",
        comment: "Very clean and everything worked. We will definitely be back"
      },
      {
        name: "Ashley",
        rating: 5,
        date: "August 2025",
        location: "New York, New York",
        comment: "What a house. My family loved it. We surprised the kids and they freaked out with the arcade in the home and the private pool. The rooms and slides were so cool, kids slept in a different one each night. It is the perfect location and close to Orlando and all the parks. Rooms were clean and spacious. We used the community amenities one day, but it was a little more crowded than we liked. We had all we absolutely needed. We highly recommend and would stay again."
      },
      {
        name: "Holly",
        rating: 5,
        date: "August 2024",
        location: "Cedar Rapids, Iowa",
        comment: "The place looked just like the pictures. I was worried it was going to be small but it was very spacious. We had 15 people, including 9 kids and you couldn't tell at all. We were able to get in and out of the entrance easily. We didn't use the club house/water slides at all, so wouldn't be able to judge that. It always seemed busy and limited parking near there so you would want to get there early in the day to park in order to use them. We would definitely book this place again if we do another Florida vacation."
      },
      {
        name: "Brent",
        rating: 5,
        date: "July 2024",
        comment: "This home was absolutely perfect for our extended family to all meet up together from different states. Each bedroom had plenty of space. The kids' themed rooms were such a huge hit with our kids as they had so much fun hanging out with the fun lights and slides. The game room was also great for both the kids and adults! The home is not private from neighboring houses or those directly behind us, but we still used the pool as well as the resort pools. Our younger kids had a blast in the splash pad area. Unfortunately, the bigger slides were closed during our week stay. The home had a pack-n-play, stroller on hand, and a high chair (IYKYK)!"
      },
      {
        name: "Kristine",
        rating: 5,
        date: "June 2024",
        location: "Dickinson, Texas",
        comment: "We had a wonderful stay at this property. The house was exactly as it was advertised and perfect for our family. The kids loved the slide bunk beds and the gameroom."
      }
    ];

    const createdReviews = [];
    
    for (const review of existingReviews) {
      const created = await createReview(review);
      createdReviews.push(created);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully migrated ${createdReviews.length} reviews to database`,
      reviews: createdReviews
    });
  } catch (error) {
    console.error('Error migrating reviews:', error);
    return NextResponse.json(
      { 
        error: 'Failed to migrate reviews', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    );
  }
}

