import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const sampleGigs = [
  {
    id: 'gig-1',
    title: "I will build shopify ecommerce website, redesign online store",
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
    category: "Programming & Tech",
    subcategory: "Website Development",
    tags: ["Shopify", "E-commerce", "Website", "Design"],
    images: [
      "https://picsum.photos/seed/gig1/800/600",
      "https://picsum.photos/seed/gig2/800/600", 
      "https://picsum.photos/seed/gig3/800/600"
    ],
    freelancerId: "freelancer-1",
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
    totalOrders: 1542,
    status: 'active'
  },
  {
    id: 'gig-2',
    title: "I will create professional logo design for your business",
    description: `I will create a professional, modern, and unique logo design for your business that will help you stand out from the competition.

What you get:
• Unique and original design
• High-resolution files
• Multiple file formats (AI, EPS, PDF, PNG, JPG)
• Color and black & white versions
• Unlimited revisions until you're satisfied
• Commercial use rights
• Fast delivery

My design process:
1. Research your industry and competitors
2. Create initial concepts
3. Refine based on your feedback
4. Deliver final files

I have over 5 years of experience in logo design and have worked with hundreds of satisfied clients worldwide.`,
    category: "Design & Creative",
    subcategory: "Logo Design",
    tags: ["Logo", "Branding", "Design", "Creative"],
    images: [
      "https://picsum.photos/seed/logo1/800/600",
      "https://picsum.photos/seed/logo2/800/600",
      "https://picsum.photos/seed/logo3/800/600"
    ],
    freelancerId: "freelancer-2",
    packages: {
      basic: {
        name: "Basic Logo",
        price: 150000,
        description: "1 logo concept + 3 revisions + PNG/JPG files",
        deliveryTime: "3 days",
        revisions: 3,
        features: [
          "1 logo concept",
          "3 revisions",
          "PNG & JPG files",
          "Basic color variations"
        ]
      },
      standard: {
        name: "Professional Logo",
        price: 300000,
        description: "3 logo concepts + 5 revisions + All file formats + Social media kit",
        deliveryTime: "5 days",
        revisions: 5,
        features: [
          "3 logo concepts",
          "5 revisions",
          "All file formats (AI, EPS, PDF, PNG, JPG)",
          "Color & B&W versions",
          "Social media kit"
        ]
      },
      premium: {
        name: "Complete Brand Package",
        price: 500000,
        description: "5 logo concepts + Unlimited revisions + Complete brand identity + Stationery design",
        deliveryTime: "7 days",
        revisions: "Unlimited",
        features: [
          "5 logo concepts",
          "Unlimited revisions",
          "Complete brand identity",
          "Business card design",
          "Letterhead design",
          "Brand guidelines"
        ]
      }
    },
    rating: 4.8,
    totalReviews: 287,
    totalOrders: 324,
    status: 'active'
  }
];

const sampleFreelancers = [
  {
    id: 'freelancer-1',
    name: "Fillinx Sol",
    username: "fillinxsol",
    email: "fillinx@example.com",
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
  {
    id: 'freelancer-2',
    name: "Maya Design",
    username: "mayadesign",
    email: "maya@example.com",
    profileImage: "https://picsum.photos/seed/freelancer2/150/150",
    isVerified: true,
    isTopRated: false,
    isOnline: true,
    rating: 4.8,
    totalReviews: 287,
    totalOrders: 324,
    memberSince: "Jan 2019",
    location: "Indonesia",
    languages: ["English", "Indonesian"],
    responseTime: "2 hours",
    lastDelivery: "1 day",
    bio: "Professional graphic designer with 5+ years of experience in logo design and branding. I help businesses create memorable brand identities that connect with their target audience.",
    skills: ["Logo Design", "Branding", "Graphic Design", "Brand Identity", "Print Design"],
    clients: [
      { name: "Local Restaurant Chain", category: "Food & Beverage", logo: "https://picsum.photos/seed/client2/100/50" }
    ]
  }
];

const sampleReviews = [
  {
    gigId: 'gig-1',
    freelancerId: 'freelancer-1',
    clientId: 'client-1',
    rating: 5,
    comment: "If I could give 10 stars, I would! Fillinx Sol went above and beyond building my Shopify website. The entire experience was smooth, professional, and honestly better than I could have imagined. His responsiveness was lightning-fast, he paid attention to every detail, and he truly exceeded all my expectations....",
    orderPrice: "200-400",
    projectDuration: "3 weeks",
    hasFiles: true,
    helpfulVotes: { yes: 5, no: 0 },
    user: {
      name: "georgeschmld935",
      country: "Canada",
      avatar: "https://picsum.photos/seed/user1/50/50"
    }
  }
];

export async function populateGigsData() {
  try {
    console.log('Starting to populate gigs data...');
    
    // Add freelancers to users collection
    for (const freelancer of sampleFreelancers) {
      await setDoc(doc(db, 'users', freelancer.id), {
        ...freelancer,
        role: 'freelancer',
        isFreelancer: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`Added freelancer: ${freelancer.name}`);
    }
    
    // Add gigs
    for (const gig of sampleGigs) {
      await setDoc(doc(db, 'gigs', gig.id), {
        ...gig,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`Added gig: ${gig.title}`);
    }
    
    // Add reviews
    for (const review of sampleReviews) {
      await addDoc(collection(db, 'reviews'), {
        ...review,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`Added review for gig: ${review.gigId}`);
    }
    
    console.log('Successfully populated gigs data!');
  } catch (error) {
    console.error('Error populating gigs data:', error);
  }
}

// Run this function to populate data
// populateGigsData(); 