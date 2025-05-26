import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import gigService from '../services/gigService';
import reviewService from '../services/reviewService';
import firebaseService from '../services/firebaseService';

export default function GigDetail() {
  const { gigId } = useParams();
  const { currentUser } = useAuth();
  const [gig, setGig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState('basic');
  const [showFullDescription, setShowFullDescription] = useState(false);

  // Mock data - in real app, this would come from your database
  const mockGigData = {
    id: gigId,
    title: "I will build shopify ecommerce website, redesign online store",
    category: "Programming & Tech",
    subcategory: "Website Development",
    tags: ["Shopify", "E-commerce", "Website", "Design"],
    images: [
      "https://picsum.photos/seed/gig1/800/600",
      "https://picsum.photos/seed/gig2/800/600", 
      "https://picsum.photos/seed/gig3/800/600"
    ],
    description: `Luckily, you've landed to the right place. With an experience of over 10+ years in this field, we offer you exactly what your business demands and will make it stand out in the market.

We are enabling brands to exceed all online expectations through truly beautiful and high converting eCommerce and business websites since 2013.

Platforms that we use are:
• Shopify
• Shopify Plus
• Wordpress
• Squarespace
• Webflow
• Custom php

We provide the following services:
• Branded store setup
• Redesign existing store
• or any platform ecommerce store

Why us:
We study our client's business, choose the best platform and hand-pick the most suitable design according to our research!`,
    
    freelancer: {
      id: "freelancer1",
      name: "Fillinx Sol",
      username: "fillinxsol",
      profileImage: "https://picsum.photos/seed/freelancer1/150/150",
      isVerified: true,
      isTopRated: true,
      isOnline: true,
      rating: 4.9,
      totalReviews: 1234,
      totalOrders: 1542,
      memberSince: "Dec 2016",
      location: "Pakistan",
      languages: ["English", "Urdu"],
      responseTime: "1 hour",
      lastDelivery: "3 days",
      bio: "Fillinx Solutions is a leading Shopify & Shopify Plus design and development agency renowned for its top-notch e-commerce solutions. Expert in high converting e-commerce and business websites. Our team provides exceptional services with a focus on ecommerce & business website designs, each tailored to elevate brands and drive sales.",
      skills: ["Build a Website", "E-Commerce Development", "Software Development", "Website Development", "Website Builders & CMS", "Website Maintenance", "WordPress"],
      clients: [
        { name: "Unilever", category: "Food Products", logo: "https://picsum.photos/seed/client1/100/50" }
      ]
    },

    packages: {
      basic: {
        name: "Jack (Best for one product)",
        price: 195000,
        description: "Basic store + Free theme setup + Attractive Design. (Please contact before ordering)",
        deliveryTime: "7 days",
        revisions: 3,
        features: [
          "Store setup",
          "Responsive design", 
          "Free theme customization",
          "Basic SEO setup",
          "Contact form integration"
        ]
      },
      standard: {
        name: "Queen (Most Popular)",
        price: 395000,
        description: "Premium design + Advanced features + Product upload + Payment gateway setup",
        deliveryTime: "10 days", 
        revisions: 5,
        features: [
          "Everything in Basic",
          "Premium theme customization",
          "Up to 50 products upload",
          "Payment gateway setup",
          "Advanced SEO optimization",
          "Social media integration",
          "Analytics setup"
        ]
      },
      premium: {
        name: "King (Complete Solution)",
        price: 795000,
        description: "Complete ecommerce solution + Custom features + Marketing tools + Ongoing support",
        deliveryTime: "14 days",
        revisions: "Unlimited",
        features: [
          "Everything in Standard",
          "Custom design & development",
          "Unlimited products upload",
          "Advanced marketing tools",
          "Multi-language support",
          "Priority support",
          "1 month free maintenance"
        ]
      }
    },

    rating: 4.9,
    totalReviews: 1234,
    ratingBreakdown: {
      5: 1209,
      4: 15,
      3: 5,
      2: 2,
      1: 3
    },
    ratingCategories: {
      sellerCommunication: 5.0,
      qualityOfDelivery: 5.0,
      valueOfDelivery: 4.9
    },

    reviews: [
      {
        id: 1,
        user: {
          name: "georgeschmld935",
          country: "Canada",
          avatar: "https://picsum.photos/seed/user1/50/50"
        },
        rating: 5,
        date: "2 weeks ago",
        comment: "If I could give 10 stars, I would! Fillinx Sol went above and beyond building my Shopify website. The entire experience was smooth, professional, and honestly better than I could have imagined. His responsiveness was lightning-fast, he paid attention to every detail, and he truly exceeded all my expectations....",
        price: "200-400",
        duration: "3 weeks",
        hasFiles: true,
        helpful: { yes: 5, no: 0 }
      }
    ],

    faq: [
      {
        question: "Do you provide hosting?",
        answer: "Shopify provides hosting as part of their service. We'll help you set up your Shopify account and configure everything properly."
      },
      {
        question: "Can you migrate my existing website?",
        answer: "Yes, we can migrate your existing website to Shopify. This includes products, customer data, and order history."
      },
      {
        question: "Do you provide ongoing support?",
        answer: "Yes, we offer ongoing support and maintenance packages. Please contact us for more details."
      }
    ]
  };

  useEffect(() => {
    const loadGigData = async () => {
      setLoading(true);
      try {
        // Try to load real data from database
        const gigData = await gigService.getGig(`gig-${gigId}`);
        
        if (gigData) {
          // Load freelancer data
          const freelancerData = await firebaseService.getUser(gigData.freelancerId);
          
          // Load reviews
          const reviews = await reviewService.getGigReviews(gigData.id, { limit: 5 });
          
          // Combine data
          const completeGigData = {
            ...gigData,
            freelancer: freelancerData,
            reviews: reviews.map(review => ({
              ...review,
              date: new Date(review.createdAt?.seconds * 1000 || Date.now()).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              }) + ' ago'
            }))
          };
          
          setGig(completeGigData);
        } else {
          // Fallback to mock data if no real data found
          setGig(mockGigData);
        }
      } catch (error) {
        console.error('Error loading gig data:', error);
        // Fallback to mock data on error
        setGig(mockGigData);
      } finally {
        setLoading(false);
      }
    };

    loadGigData();
  }, [gigId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#010042] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading gig details...</p>
        </div>
      </div>
    );
  }

  if (!gig) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Gig not found</h2>
          <Link to="/" className="text-[#010042] hover:underline">
            Return to home
          </Link>
        </div>
      </div>
    );
  }

  const currentPackage = gig.packages[selectedPackage];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center space-x-2 text-sm text-gray-600">
            <Link to="/" className="hover:text-[#010042]">Home</Link>
            <span>•</span>
            <Link to="/browse" className="hover:text-[#010042]">{gig.category}</Link>
            <span>•</span>
            <span className="text-gray-900">{gig.subcategory}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Gig Details */}
          <div className="lg:col-span-2 space-y-8 order-2 lg:order-1">
            {/* Gig Title */}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                {gig.title}
              </h1>
              
              {/* Freelancer Info Bar */}
              <div className="flex items-center space-x-4 mb-6">
                <img
                  src={gig.freelancer.profileImage}
                  alt={gig.freelancer.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-gray-900">{gig.freelancer.name}</h3>
                    {gig.freelancer.isVerified && (
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        Vetted Pro
                      </span>
                    )}
                    {gig.freelancer.isTopRated && (
                      <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded">
                        Top Rated ⭐⭐⭐
                      </span>
                    )}
                    {gig.freelancer.isOnline && (
                      <span className="text-green-600 text-sm">● Online</span>
                    )}
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>⭐ {gig.freelancer.rating} ({gig.freelancer.totalReviews} reviews)</span>
                    <span>📦 {gig.freelancer.totalOrders} orders in queue</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Gig Images */}
            <div className="bg-white rounded-lg overflow-hidden">
              <div className="relative">
                <img
                  src={gig.images[0]}
                  alt={gig.title}
                  className="w-full h-96 object-cover"
                />
                <div className="absolute bottom-4 left-4 flex space-x-2">
                  {gig.images.map((_, index) => (
                    <div
                      key={index}
                      className="w-16 h-12 bg-black bg-opacity-50 rounded cursor-pointer border-2 border-transparent hover:border-white"
                    >
                      <img
                        src={gig.images[index]}
                        alt=""
                        className="w-full h-full object-cover rounded"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* About This Gig */}
            <div className="bg-white rounded-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">About this gig</h2>
              <div className="prose max-w-none">
                <div className={`${showFullDescription ? '' : 'line-clamp-6'}`}>
                  {gig.description.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-4 text-gray-700">
                      {paragraph}
                    </p>
                  ))}
                </div>
                <button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="text-[#010042] hover:underline font-medium"
                >
                  {showFullDescription ? 'Show less' : 'See more'}
                </button>
              </div>
            </div>

            {/* About This Freelancer */}
            <div className="bg-white rounded-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">About this freelancer</h2>
              
              <div className="flex items-start space-x-4 mb-6">
                <img
                  src={gig.freelancer.profileImage}
                  alt={gig.freelancer.name}
                  className="w-20 h-20 rounded-full object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-bold text-gray-900">{gig.freelancer.name}</h3>
                    {gig.freelancer.isVerified && (
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        Vetted Pro
                      </span>
                    )}
                    {gig.freelancer.isTopRated && (
                      <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded">
                        Top Rated ⭐⭐⭐
                      </span>
                    )}
                    {gig.freelancer.isOnline && (
                      <span className="inline-flex items-center text-green-600 text-sm">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                        Online
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">👥 Freelancer</span>
                    </div>
                    <div>
                      <span className="text-gray-600">👷 {gig.freelancer.totalOrders} employees</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 mt-2">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                      <span className="ml-1 font-medium">{gig.freelancer.rating}</span>
                      <span className="text-gray-500">({gig.freelancer.totalReviews.toLocaleString()})</span>
                    </div>
                  </div>
                </div>
                
                <button className="border border-gray-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition duration-200">
                  Contact us
                </button>
              </div>

              {/* Freelancer Description */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700 leading-relaxed">
                  {gig.freelancer.bio}
                </p>
              </div>

              {/* Vetted For */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Vetted for</h4>
                <div className="grid grid-cols-2 gap-3">
                  {gig.freelancer.skills.map((skill, index) => (
                    <div key={index} className="flex items-center">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-gray-700">{skill}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-6 text-sm">
                <div>
                  <div className="mb-4">
                    <span className="text-gray-600">From</span>
                    <div className="font-medium text-gray-900">{gig.freelancer.location}</div>
                  </div>
                  <div className="mb-4">
                    <span className="text-gray-600">Avg. response time</span>
                    <div className="font-medium text-gray-900">{gig.freelancer.responseTime}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Languages</span>
                    <div className="font-medium text-gray-900">{gig.freelancer.languages.join(', ')}</div>
                  </div>
                </div>
                
                <div>
                  <div className="mb-4">
                    <span className="text-gray-600">Member since</span>
                    <div className="font-medium text-gray-900">{gig.freelancer.memberSince}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Last delivery</span>
                    <div className="font-medium text-gray-900">{gig.freelancer.lastDelivery}</div>
                  </div>
                </div>
              </div>

              {/* Clients */}
              {gig.freelancer.clients && gig.freelancer.clients.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    Among our clients 
                    <svg className="w-4 h-4 ml-1 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </h4>
                  {gig.freelancer.clients.map((client, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <img src={client.logo} alt={client.name} className="w-8 h-8 object-contain" />
                      <div>
                        <div className="font-medium text-gray-900">{client.name}</div>
                        <div className="text-sm text-gray-500">{client.category}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reviews Section */}
            <div className="bg-white rounded-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Reviews</h2>
              
              {/* Reviews Summary */}
              <div className="flex items-start justify-between mb-8">
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    {gig.totalReviews.toLocaleString()} reviews for this Gig
                  </h3>
                  
                  {/* Rating Breakdown */}
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map(star => {
                      const count = gig.ratingBreakdown[star];
                      const percentage = (count / gig.totalReviews) * 100;
                      return (
                        <div key={star} className="flex items-center space-x-3">
                          <span className="text-sm font-medium w-12">{star} Stars</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-yellow-400 h-2 rounded-full" 
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600 w-8">({count})</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center mb-4">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                    <span className="ml-2 text-lg font-bold">{gig.rating}</span>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <h4 className="font-medium">Rating Breakdown</h4>
                    <div className="flex justify-between">
                      <span>Seller communication level</span>
                      <div className="flex items-center">
                        <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span>{gig.ratingCategories.sellerCommunication}</span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span>Quality of delivery</span>
                      <div className="flex items-center">
                        <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span>{gig.ratingCategories.qualityOfDelivery}</span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span>Value of delivery</span>
                      <div className="flex items-center">
                        <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span>{gig.ratingCategories.valueOfDelivery}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Search and Filter */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search reviews"
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option>Most relevant</option>
                    <option>Most recent</option>
                    <option>Highest rated</option>
                  </select>
                  
                  <label className="flex items-center text-sm">
                    <input type="checkbox" className="mr-2" />
                    Only show reviews with files (141)
                  </label>
                </div>
              </div>

              {/* Individual Reviews */}
              <div className="space-y-6">
                {gig.reviews.map(review => (
                  <div key={review.id} className="border-b border-gray-100 pb-6 last:border-b-0">
                    <div className="flex items-start space-x-4">
                      <img
                        src={review.user.avatar}
                        alt={review.user.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-medium text-gray-900">{review.user.name}</h4>
                          <img
                            src={`https://flagcdn.com/w20/${review.user.country.toLowerCase().slice(0, 2)}.png`}
                            alt={review.user.country}
                            className="w-4 h-3"
                          />
                          <span className="text-sm text-gray-500">{review.user.country}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2 mb-3">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <svg key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                            <span className="ml-1 font-medium">{review.rating}</span>
                          </div>
                          <span className="text-sm text-gray-500">• {review.date}</span>
                        </div>
                        
                        <p className="text-gray-700 mb-4 leading-relaxed">
                          {review.comment}
                          <button className="text-[#010042] hover:underline ml-1">See more</button>
                        </p>
                        
                        <div className="flex items-center space-x-6 text-sm text-gray-600 mb-4">
                          <div>
                            <span className="font-medium">Rp {review.price}</span>
                            <span className="ml-1">Price</span>
                          </div>
                          <div>
                            <span className="font-medium">{review.duration}</span>
                            <span className="ml-1">Duration</span>
                          </div>
                        </div>

                        {/* Seller Response */}
                        <div className="bg-blue-50 rounded-lg p-4 mb-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-medium">F</span>
                            </div>
                            <span className="font-medium text-gray-900">Seller's Response</span>
                            <button className="ml-auto">
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* Helpful buttons */}
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="text-gray-600">Helpful?</span>
                          <button className="flex items-center text-gray-600 hover:text-gray-900">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905 0 .905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                            </svg>
                            Yes
                          </button>
                          <button className="flex items-center text-gray-600 hover:text-gray-900">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v2a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                            </svg>
                            No
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* What People Loved Section */}
            <div className="bg-white rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">What people loved about this freelancer</h2>
                <button className="text-[#010042] hover:underline">See all reviews</button>
              </div>
              
              <div className="flex space-x-4">
                <button className="p-2 border border-gray-300 rounded-full hover:bg-gray-50">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <div className="flex-1 bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <img
                      src={gig.reviews[0].user.avatar}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-medium">{gig.reviews[0].user.name}</span>
                        <img
                          src={`https://flagcdn.com/w20/${gig.reviews[0].user.country.toLowerCase().slice(0, 2)}.png`}
                          alt=""
                          className="w-4 h-3"
                        />
                        <span className="text-sm text-gray-500">{gig.reviews[0].user.country}</span>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                          <span className="ml-1 text-sm">{gig.reviews[0].rating}</span>
                        </div>
                      </div>
                      <p className="text-gray-700">
                        If I could give 10 stars, I would! Fillinx Sol went above and beyond building my Shopify website. The entire experience was smooth, professional, and honestly...
                        <button className="text-[#010042] hover:underline ml-1">See more</button>
                      </p>
                      <p className="text-sm text-gray-500 mt-2">{gig.reviews[0].date}</p>
                    </div>
                  </div>
                </div>
                
                <button className="p-2 border border-gray-300 rounded-full hover:bg-gray-50">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Vetted by SkillNusa */}
            <div className="bg-white rounded-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Vetted by SkillNusa Pro</h2>
              <p className="text-gray-700">
                {gig.freelancer.name} was selected by the SkillNusa Pro team for their expertise.
              </p>
            </div>

            {/* FAQ Section */}
            {gig.faq && gig.faq.length > 0 && (
              <div className="bg-white rounded-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
                <div className="space-y-4">
                  {gig.faq.map((faq, index) => (
                    <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0">
                      <h3 className="font-medium text-gray-900 mb-2">{faq.question}</h3>
                      <p className="text-gray-700 text-sm">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Pricing & Order */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <div className="lg:sticky lg:top-8 space-y-6">
              {/* Package Selection */}
              <div className="bg-white rounded-lg border border-gray-200">
                {/* Package Tabs */}
                <div className="flex border-b">
                  {Object.entries(gig.packages).map(([key, pkg]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedPackage(key)}
                      className={`flex-1 px-4 py-3 text-sm font-medium text-center ${
                        selectedPackage === key
                          ? 'bg-gray-50 border-b-2 border-[#010042] text-[#010042]'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </button>
                  ))}
                </div>

                {/* Package Content */}
                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="font-semibold text-lg text-gray-900 mb-2">
                      {currentPackage.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      {currentPackage.description}
                    </p>
                    
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl font-bold text-gray-900">
                        Rp {currentPackage.price.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                        </svg>
                        {currentPackage.deliveryTime} delivery
                      </div>
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                        </svg>
                        {currentPackage.revisions} Revisions
                      </div>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-3">What's included</h4>
                    <ul className="space-y-2">
                      {currentPackage.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <svg className="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    {currentUser ? (
                      <>
                        <button className="w-full bg-[#010042] text-white py-3 px-4 rounded-lg font-semibold hover:bg-[#000030] transition duration-200">
                          Continue (Rp {currentPackage.price.toLocaleString('id-ID')})
                        </button>
                        <button className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition duration-200">
                          Contact Freelancer
                        </button>
                      </>
                    ) : (
                      <>
                        <Link to="/login" className="block w-full bg-[#010042] text-white py-3 px-4 rounded-lg font-semibold hover:bg-[#000030] transition duration-200 text-center">
                          Login to Order
                        </Link>
                        <Link to="/register" className="block w-full border border-[#010042] text-[#010042] py-3 px-4 rounded-lg font-medium hover:bg-[#010042] hover:text-white transition duration-200 text-center">
                          Sign Up
                        </Link>
                      </>
                    )}
                  </div>

                  {/* Need flexibility section */}
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-white text-sm font-medium">💡</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-1">Need flexibility when hiring?</h4>
                        <p className="text-sm text-gray-600 mb-3">
                          Hiring on an hourly basis is perfect for long-term projects, with easy automatic weekly payments.
                        </p>
                        <button className="text-blue-600 text-sm font-medium hover:underline">
                          Request an hourly offer
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 