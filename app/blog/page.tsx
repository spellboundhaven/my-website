import Link from 'next/link'
import { ArrowLeft, Calendar, Clock } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog | Disney Vacation Tips & Windsor Island Resort Guide | Spellbound Haven',
  description: 'Expert tips for Disney family vacations, Windsor Island Resort guides, and multigenerational trip planning. Learn how to make the most of your Orlando vacation.',
  keywords: 'Disney vacation tips, Windsor Island Resort guide, Orlando vacation planning, Disney family vacation advice, multigenerational Disney trips',
}

const blogPosts = [
  {
    id: 'top-10-things-windsor-island-resort',
    title: 'Top 10 Things to Do at Windsor Island Resort Orlando',
    excerpt: 'Discover the best amenities and activities at Windsor Island Resort. From lazy rivers to mini golf, learn how to make the most of your vacation rental stay.',
    date: 'January 12, 2025',
    readTime: '7 min read',
    category: 'Resort Guide',
  },
  {
    id: 'save-money-disney-vacation',
    title: 'How to Save Money on Your Disney Family Vacation',
    excerpt: 'Expert tips to save thousands on your Disney vacation. Learn how vacation rentals, meal planning, and smart ticket strategies cut costs for large families.',
    date: 'January 11, 2025',
    readTime: '9 min read',
    category: 'Budget Tips',
  },
  {
    id: 'disney-family-vacation-guide',
    title: 'Ultimate Guide to Planning a Disney Family Vacation',
    excerpt: 'Everything you need to know about planning the perfect Disney family vacation, from choosing accommodation to navigating the parks with multiple generations.',
    date: 'January 10, 2025',
    readTime: '8 min read',
    category: 'Disney Tips',
  },
  {
    id: 'windsor-island-resort-guide',
    title: 'Why Windsor Island Resort is Perfect for Large Family Gatherings',
    excerpt: 'Discover why Windsor Island Resort in Orlando has become the top choice for families visiting Walt Disney World®. Learn about amenities, location benefits, and more.',
    date: 'January 8, 2025',
    readTime: '6 min read',
    category: 'Resort Guide',
  },
  {
    id: 'multigenerational-disney-trip-planning',
    title: 'Planning a Multigenerational Disney Trip: A Complete Guide',
    excerpt: 'Tips and strategies for planning a successful Disney vacation with grandparents, parents, and kids. Make everyone happy with these expert recommendations.',
    date: 'January 5, 2025',
    readTime: '10 min read',
    category: 'Family Travel',
  },
]

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container-max py-6">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="container-max py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 font-serif text-center">
            Disney Vacation Tips & Guides
          </h1>
          <p className="text-xl text-gray-600 text-center mb-12">
            Expert advice for planning your perfect Disney family vacation at Windsor Island Resort
          </p>
          
          {/* Blog Posts Grid */}
          <div className="space-y-8">
            {blogPosts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.id}`}
                className="block bg-white rounded-lg shadow-sm p-8 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                  <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full font-medium">
                    {post.category}
                  </span>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {post.date}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {post.readTime}
                  </div>
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 mb-3 hover:text-primary-600 transition-colors">
                  {post.title}
                </h2>
                
                <p className="text-gray-600 mb-4">
                  {post.excerpt}
                </p>
                
                <span className="text-primary-600 font-medium hover:text-primary-700">
                  Read more →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

