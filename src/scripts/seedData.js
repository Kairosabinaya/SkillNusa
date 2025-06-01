/**
 * Seed Data Script - Creates sample data using new standardized database structure
 * 
 * This script creates:
 * 1. Users with proper role management
 * 2. Client and Freelancer profiles (separate collections)
 * 3. Gigs with standardized structure
 * 4. Orders with proper status tracking
 * 5. Reviews with single source of truth for ratings
 * 6. Chats and messages with proper references
 * 7. Favorites with reference-only structure
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, addDoc, serverTimestamp, getDocs, query, where, updateDoc, deleteDoc } from 'firebase/firestore';
import { COLLECTIONS } from '../utils/constants.js';

// Firebase config (using environment variables or fallback)
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyBU5CpKkJfN-pGuQ8qxV3AG-Uj9LVeyCdM",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "skillnusa-fd614.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "skillnusa-fd614",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "skillnusa-fd614.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "706734048752",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:706734048752:web:219c57edb47247ca92c935",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sample data arrays
const sampleUsers = [
  {
    id: 'user_client_1',
    email: 'client1@example.com',
    username: 'client_andi',
    displayName: 'Andi Pratama',
    phoneNumber: '+6281234567890',
    profilePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face&auto=format',
    emailVerified: true,
    roles: ['client'],
    activeRole: 'client',
    isFreelancer: false,
    isActive: true,
    isOnline: false
  },
  {
    id: 'user_client_2',
    email: 'client2@example.com',
    username: 'client_sari',
    displayName: 'Sari Dewi',
    phoneNumber: '+6281234567891',
    profilePhoto: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=400&fit=crop&crop=face&auto=format',
    emailVerified: true,
    roles: ['client'],
    activeRole: 'client',
    isFreelancer: false,
    isActive: true,
    isOnline: true
  },
  {
    id: 'user_freelancer_1',
    email: 'freelancer1@example.com',
    username: 'freelancer_budi',
    displayName: 'Budi Santoso',
    phoneNumber: '+6281234567892',
    profilePhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face&auto=format',
    emailVerified: true,
    roles: ['client', 'freelancer'],
    activeRole: 'freelancer',
    isFreelancer: true,
    isActive: true,
    isOnline: true
  },
  {
    id: 'user_freelancer_2',
    email: 'freelancer2@example.com',
    username: 'freelancer_maya',
    displayName: 'Maya Sari',
    phoneNumber: '+6281234567893',
    profilePhoto: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face&auto=format',
    emailVerified: true,
    roles: ['client', 'freelancer'],
    activeRole: 'freelancer',
    isFreelancer: true,
    isActive: true,
    isOnline: false
  },
  {
    id: 'user_freelancer_3',
    email: 'freelancer3@example.com',
    username: 'freelancer_rudi',
    displayName: 'Rudi Hermawan',
    phoneNumber: '+6281234567894',
    profilePhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face&auto=format',
    emailVerified: true,
    roles: ['client', 'freelancer'],
    activeRole: 'freelancer',
    isFreelancer: true,
    isActive: true,
    isOnline: true
  }
];

const sampleClientProfiles = [
  {
    id: 'user_client_1',
    userId: 'user_client_1',
    gender: 'Male',
    dateOfBirth: '1990-05-15',
    location: 'Jakarta',
    bio: 'Entrepreneur yang membutuhkan jasa desain dan development untuk startup saya.',
    companyName: 'PT Teknologi Maju',
    industry: 'Technology',
    marketingEmails: false
  },
  {
    id: 'user_client_2',
    userId: 'user_client_2',
    gender: 'Female',
    dateOfBirth: '1988-12-03',
    location: 'Surabaya',
    bio: 'Marketing manager yang sering membutuhkan konten kreatif.',
    companyName: 'CV Kreatif Media',
    industry: 'Marketing',
    marketingEmails: true
  }
];

const sampleFreelancerProfiles = [
  {
    id: 'user_freelancer_1',
    userId: 'user_freelancer_1',
    gender: 'Male',
    dateOfBirth: '1992-08-20',
    location: 'Bandung',
    bio: 'Full-stack developer dengan pengalaman 5+ tahun dalam web development.',
    skills: [
      { skill: 'JavaScript', experienceLevel: 'Ahli' },
      { skill: 'React', experienceLevel: 'Ahli' },
      { skill: 'Node.js', experienceLevel: 'Menengah' },
      { skill: 'Python', experienceLevel: 'Menengah' }
    ],
    education: [
      {
        degree: 'S1 Teknik Informatika',
        university: 'Institut Teknologi Bandung',
        fieldOfStudy: 'Computer Science',
        graduationYear: '2015',
        country: 'Indonesia'
      }
    ],
    certifications: [
      {
        name: 'AWS Certified Developer',
        issuedBy: 'Amazon Web Services',
        year: '2022'
      }
    ],
    experienceLevel: 'expert',
    hourlyRate: 150000,
    availability: 'full-time',
    workingHours: '09:00 - 17:00 WIB',
    languages: ['id', 'en'],
    portfolioLinks: [
      'https://github.com/budisantoso',
      'https://budisantoso.dev'
    ],
    website: 'https://budisantoso.dev',
    rating: 0,
    totalReviews: 0,
    totalOrders: 8,
    completedProjects: 8
  },
  {
    id: 'user_freelancer_2',
    userId: 'user_freelancer_2',
    gender: 'Female',
    dateOfBirth: '1995-03-10',
    location: 'Yogyakarta',
    bio: 'UI/UX Designer yang passionate dalam menciptakan pengalaman pengguna yang luar biasa.',
    skills: [
      { skill: 'UI/UX Design', experienceLevel: 'Ahli' },
      { skill: 'Figma', experienceLevel: 'Ahli' },
      { skill: 'Adobe XD', experienceLevel: 'Menengah' },
      { skill: 'Prototyping', experienceLevel: 'Ahli' }
    ],
    education: [
      {
        degree: 'S1 Desain Komunikasi Visual',
        university: 'Institut Seni Budaya Indonesia',
        fieldOfStudy: 'Visual Communication Design',
        graduationYear: '2017',
        country: 'Indonesia'
      }
    ],
    certifications: [
      {
        name: 'Google UX Design Certificate',
        issuedBy: 'Google',
        year: '2021'
      }
    ],
    experienceLevel: 'expert',
    hourlyRate: 120000,
    availability: 'part-time',
    workingHours: '19:00 - 23:00 WIB',
    languages: ['id', 'en'],
    portfolioLinks: [
      'https://dribbble.com/mayasari',
      'https://behance.net/mayasari'
    ],
    website: 'https://mayasari.design',
    rating: 0,
    totalReviews: 0,
    totalOrders: 6,
    completedProjects: 6
  },
  {
    id: 'user_freelancer_3',
    userId: 'user_freelancer_3',
    gender: 'Male',
    dateOfBirth: '1993-11-25',
    location: 'Medan',
    bio: 'Content writer dan digital marketer dengan spesialisasi SEO.',
    skills: [
      { skill: 'Content Writing', experienceLevel: 'Ahli' },
      { skill: 'SEO', experienceLevel: 'Menengah' },
      { skill: 'Digital Marketing', experienceLevel: 'Menengah' },
      { skill: 'Social Media Management', experienceLevel: 'Ahli' }
    ],
    education: [
      {
        degree: 'S1 Ilmu Komunikasi',
        university: 'Universitas Sumatera Utara',
        fieldOfStudy: 'Communication Studies',
        graduationYear: '2016',
        country: 'Indonesia'
      }
    ],
    certifications: [
      {
        name: 'Google Analytics Certified',
        issuedBy: 'Google',
        year: '2020'
      }
    ],
    experienceLevel: 'intermediate',
    hourlyRate: 75000,
    availability: 'full-time',
    workingHours: '08:00 - 16:00 WIB',
    languages: ['id', 'en'],
    portfolioLinks: [
      'https://medium.com/@rudihermawan',
      'https://rudihermawan.com'
    ],
    website: 'https://rudihermawan.com',
    rating: 0,
    totalReviews: 0,
    totalOrders: 4,
    completedProjects: 4
  }
];

const sampleGigs = [
  {
    userId: 'user_freelancer_1',
    title: 'Pembuatan Website E-commerce Modern dengan React',
    description: 'Saya akan membuat website e-commerce yang modern dan responsif menggunakan React.js, Node.js, dan database MongoDB. Website akan dilengkapi dengan fitur keranjang belanja, payment gateway, dan admin panel.',
    category: 'Programming & Tech',
    subcategory: 'Website Development',
    tags: ['react', 'nodejs', 'ecommerce', 'mongodb', 'responsive'],
    images: [
      'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop'
    ],
    packages: {
      basic: {
        name: 'Landing Page',
        description: 'Landing page sederhana dengan 5 halaman',
        price: 2500000,
        deliveryTime: 7,
        revisions: 2,
        features: ['Responsive Design', 'Contact Form', 'SEO Basic']
      },
      standard: {
        name: 'E-commerce Basic',
        description: 'Website e-commerce dengan fitur dasar',
        price: 5000000,
        deliveryTime: 14,
        revisions: 3,
        features: ['Product Catalog', 'Shopping Cart', 'Payment Gateway', 'Admin Panel']
      },
      premium: {
        name: 'E-commerce Advanced',
        description: 'Website e-commerce lengkap dengan fitur advanced',
        price: 8500000,
        deliveryTime: 21,
        revisions: 5,
        features: ['Multi-vendor', 'Inventory Management', 'Analytics Dashboard', 'Mobile App']
      }
    },
    totalOrders: 8,
    inQueue: 2,
    isActive: true,
    status: 'active'
  },
  {
    userId: 'user_freelancer_2',
    title: 'Desain UI/UX untuk Aplikasi Mobile',
    description: 'Saya akan mendesain antarmuka pengguna yang menarik dan user-friendly untuk aplikasi mobile Anda. Termasuk wireframe, mockup, dan prototype interaktif.',
    category: 'Graphics & Design',
    subcategory: 'UI/UX Design',
    tags: ['ui', 'ux', 'mobile', 'figma', 'prototype'],
    images: [
      'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1559028006-448665bd7c7f?w=800&h=600&fit=crop'
    ],
    packages: {
      basic: {
        name: 'Wireframe',
        description: 'Wireframe untuk 5 screen utama',
        price: 1500000,
        deliveryTime: 5,
        revisions: 2,
        features: ['User Flow', 'Wireframe', 'Basic Prototype']
      },
      standard: {
        name: 'UI Design',
        description: 'Desain UI lengkap untuk aplikasi',
        price: 3000000,
        deliveryTime: 10,
        revisions: 3,
        features: ['High-fidelity Mockup', 'Design System', 'Interactive Prototype']
      },
      premium: {
        name: 'Complete UX/UI',
        description: 'Paket lengkap UX research dan UI design',
        price: 5500000,
        deliveryTime: 15,
        revisions: 4,
        features: ['User Research', 'Complete UI Kit', 'Usability Testing', 'Developer Handoff']
      }
    },
    totalOrders: 5,
    inQueue: 1,
    isActive: true,
    status: 'active'
  },
  {
    userId: 'user_freelancer_3',
    title: 'Penulisan Artikel SEO dan Content Marketing',
    description: 'Saya akan menulis artikel berkualitas tinggi yang SEO-friendly untuk website atau blog Anda. Artikel akan dioptimasi untuk meningkatkan ranking di search engine.',
    category: 'Writing & Translation',
    subcategory: 'Content Writing',
    tags: ['seo', 'content', 'article', 'blog', 'marketing'],
    images: [
      'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1542435503-956c469947f6?w=800&h=600&fit=crop'
    ],
    packages: {
      basic: {
        name: '1 Artikel',
        description: 'Satu artikel SEO 1000 kata',
        price: 300000,
        deliveryTime: 3,
        revisions: 2,
        features: ['Keyword Research', 'SEO Optimized', 'Plagiarism Free']
      },
      standard: {
        name: '5 Artikel',
        description: 'Lima artikel SEO dengan tema terkait',
        price: 1200000,
        deliveryTime: 7,
        revisions: 2,
        features: ['Content Strategy', 'Internal Linking', 'Meta Description']
      },
      premium: {
        name: '10 Artikel + Strategy',
        description: 'Paket lengkap content marketing',
        price: 2200000,
        deliveryTime: 14,
        revisions: 3,
        features: ['Content Calendar', 'Social Media Posts', 'Performance Report']
      }
    },
    totalOrders: 3,
    inQueue: 0,
    isActive: true,
    status: 'active'
  }
];

// Individual seeding functions
export const seedUsers = async () => {
  try {
    console.log('👥 Creating users...');
    for (const user of sampleUsers) {
      await setDoc(doc(db, COLLECTIONS.USERS, user.id), {
        ...user,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log(`✅ Created user: ${user.displayName}`);
    }
    
    console.log('👤 Creating client profiles...');
    for (const profile of sampleClientProfiles) {
      await setDoc(doc(db, COLLECTIONS.CLIENT_PROFILES, profile.id), {
        ...profile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log(`✅ Created client profile: ${profile.userId}`);
    }
    
    console.log('💼 Creating freelancer profiles...');
    for (const profile of sampleFreelancerProfiles) {
      await setDoc(doc(db, COLLECTIONS.FREELANCER_PROFILES, profile.id), {
        ...profile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log(`✅ Created freelancer profile: ${profile.userId}`);
    }
    
    console.log('✅ Users seeding completed!');
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    throw error;
  }
};

export const seedGigs = async () => {
  try {
    console.log('🎯 Creating gigs...');
    const gigIds = [];
    for (const gig of sampleGigs) {
      const gigRef = await addDoc(collection(db, COLLECTIONS.GIGS), {
        ...gig,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      gigIds.push(gigRef.id);
      console.log(`✅ Created gig: ${gig.title}`);
    }
    console.log('✅ Gigs seeding completed!');
    return gigIds;
  } catch (error) {
    console.error('❌ Error seeding gigs:', error);
    throw error;
  }
};

export const seedOrders = async () => {
  try {
    console.log('📦 Creating sample orders...');
    // Get existing gig IDs to create orders for them
    const gigsSnapshot = await getDocs(collection(db, COLLECTIONS.GIGS));
    const gigIds = gigsSnapshot.docs.map(doc => doc.id);
    
    if (gigIds.length === 0) {
      console.log('⚠️ No gigs found. Seeding some gigs first...');
      const newGigIds = await seedGigs();
      gigIds.push(...newGigIds);
    }
    
    // Create multiple orders to match the reviews we'll create
    const sampleOrders = [
      // Orders for user_freelancer_1 (5 orders to match 5 reviews)
      {
        orderNumber: 'ORD-20241120-001',
        clientId: 'user_client_1',
        freelancerId: 'user_freelancer_1',
        gigId: gigIds[0],
        packageType: 'standard',
        title: 'Website E-commerce untuk Toko Online',
        description: 'Website e-commerce dengan fitur dasar untuk toko online fashion',
        requirements: 'Butuh website untuk jualan baju online dengan payment gateway',
        price: 5000000,
        totalAmount: 5000000,
        platformFee: 500000,
        freelancerEarning: 4500000,
        deliveryTime: 14,
        revisions: 3,
        maxRevisions: 3,
        status: 'completed',
        paymentStatus: 'paid',
        paymentMethod: 'bank_transfer',
        progress: {
          percentage: 100,
          currentPhase: 'completed',
          phases: [
            { name: 'Menunggu Konfirmasi', completed: true, date: new Date('2024-11-20') },
            { name: 'Sedang Dikerjakan', completed: true, date: new Date('2024-11-21') },
            { name: 'Review Client', completed: true, date: new Date('2024-12-03') },
            { name: 'Selesai', completed: true, date: new Date('2024-12-05') }
          ]
        },
        deliveries: [{
          id: '1',
          message: 'Website sudah selesai dan siap untuk review',
          attachments: [{ name: 'website-demo.zip', url: 'https://example.com/demo.zip', size: 15000000, type: 'application/zip' }],
          deliveredAt: new Date('2024-12-03')
        }],
        revisionCount: 0,
        hasAttachments: true,
        deliveryMessage: 'Website sudah selesai dan siap untuk review',
        deliveredAt: new Date('2024-12-03'),
        completedAt: new Date('2024-12-05'),
        hasRating: true,
        ratedAt: new Date('2024-12-05'),
        timeline: {
          ordered: new Date('2024-11-20'),
          confirmed: new Date('2024-11-21'),
          completed: new Date('2024-12-05'),
          cancelled: null
        }
      },
      {
        orderNumber: 'ORD-20241115-002',
        clientId: 'user_client_2',
        freelancerId: 'user_freelancer_1',
        gigId: gigIds[0],
        packageType: 'premium',
        title: 'E-commerce Advanced dengan Multi-vendor',
        description: 'Website e-commerce lengkap dengan fitur advanced',
        requirements: 'Marketplace multi-vendor dengan analytics dashboard',
        price: 8500000,
        totalAmount: 8500000,
        platformFee: 850000,
        freelancerEarning: 7650000,
        deliveryTime: 21,
        revisions: 5,
        maxRevisions: 5,
        status: 'completed',
        paymentStatus: 'paid',
        paymentMethod: 'e_wallet',
        progress: { percentage: 100, currentPhase: 'completed', phases: [] },
        deliveries: [{ id: '1', message: 'Project completed successfully', attachments: [], deliveredAt: new Date('2024-11-30') }],
        revisionCount: 1,
        hasAttachments: false,
        deliveryMessage: 'Project completed successfully',
        deliveredAt: new Date('2024-11-30'),
        completedAt: new Date('2024-12-01'),
        hasRating: true,
        ratedAt: new Date('2024-12-01'),
        timeline: {
          ordered: new Date('2024-11-15'),
          confirmed: new Date('2024-11-16'),
          completed: new Date('2024-12-01'),
          cancelled: null
        }
      },
      {
        orderNumber: 'ORD-20241110-003',
        clientId: 'user_client_1',
        freelancerId: 'user_freelancer_1',
        gigId: gigIds[0],
        packageType: 'basic',
        title: 'Landing Page Sederhana',
        description: 'Landing page sederhana dengan 5 halaman',
        requirements: 'Landing page untuk company profile',
        price: 2500000,
        totalAmount: 2500000,
        platformFee: 250000,
        freelancerEarning: 2250000,
        deliveryTime: 7,
        revisions: 2,
        maxRevisions: 2,
        status: 'completed',
        paymentStatus: 'paid',
        paymentMethod: 'bank_transfer',
        progress: { percentage: 100, currentPhase: 'completed', phases: [] },
        deliveries: [{ id: '1', message: 'Landing page completed', attachments: [], deliveredAt: new Date('2024-11-16') }],
        revisionCount: 1,
        hasAttachments: false,
        deliveryMessage: 'Landing page completed',
        deliveredAt: new Date('2024-11-16'),
        completedAt: new Date('2024-11-17'),
        hasRating: true,
        ratedAt: new Date('2024-11-17'),
        timeline: {
          ordered: new Date('2024-11-10'),
          confirmed: new Date('2024-11-11'),
          completed: new Date('2024-11-17'),
          cancelled: null
        }
      },
      
      // Orders for user_freelancer_2 (4 orders to match 4 reviews)
      {
        orderNumber: 'ORD-20241125-004',
        clientId: 'user_client_1',
        freelancerId: 'user_freelancer_2',
        gigId: gigIds[1] || gigIds[0],
        packageType: 'premium',
        title: 'Complete UX/UI Design Package',
        description: 'Paket lengkap UX research dan UI design',
        requirements: 'Mobile app design dengan user research',
        price: 5500000,
        totalAmount: 5500000,
        platformFee: 550000,
        freelancerEarning: 4950000,
        deliveryTime: 15,
        revisions: 4,
        maxRevisions: 4,
        status: 'completed',
        paymentStatus: 'paid',
        paymentMethod: 'bank_transfer',
        progress: { percentage: 100, currentPhase: 'completed', phases: [] },
        deliveries: [{ id: '1', message: 'UI/UX design completed with prototypes', attachments: [], deliveredAt: new Date('2024-12-08') }],
        revisionCount: 0,
        hasAttachments: true,
        deliveryMessage: 'UI/UX design completed with prototypes',
        deliveredAt: new Date('2024-12-08'),
        completedAt: new Date('2024-12-09'),
        hasRating: true,
        ratedAt: new Date('2024-12-09'),
        timeline: {
          ordered: new Date('2024-11-25'),
          confirmed: new Date('2024-11-26'),
          completed: new Date('2024-12-09'),
          cancelled: null
        }
      },
      
      // Orders for user_freelancer_3 (4 orders to match 4 reviews)
      {
        orderNumber: 'ORD-20241118-005',
        clientId: 'user_client_2',
        freelancerId: 'user_freelancer_3',
        gigId: gigIds[2] || gigIds[0],
        packageType: 'standard',
        title: '5 Artikel SEO dengan Tema Terkait',
        description: 'Lima artikel SEO dengan tema terkait',
        requirements: 'Artikel SEO untuk website travel',
        price: 1200000,
        totalAmount: 1200000,
        platformFee: 120000,
        freelancerEarning: 1080000,
        deliveryTime: 7,
        revisions: 2,
        maxRevisions: 2,
        status: 'completed',
        paymentStatus: 'paid',
        paymentMethod: 'e_wallet',
        progress: { percentage: 100, currentPhase: 'completed', phases: [] },
        deliveries: [{ id: '1', message: 'All 5 SEO articles completed', attachments: [], deliveredAt: new Date('2024-11-24') }],
        revisionCount: 0,
        hasAttachments: false,
        deliveryMessage: 'All 5 SEO articles completed',
        deliveredAt: new Date('2024-11-24'),
        completedAt: new Date('2024-11-25'),
        hasRating: true,
        ratedAt: new Date('2024-11-25'),
        timeline: {
          ordered: new Date('2024-11-18'),
          confirmed: new Date('2024-11-19'),
          completed: new Date('2024-11-25'),
          cancelled: null
        }
      }
    ];
    
    const orderIds = [];
    for (const order of sampleOrders) {
      const orderRef = await addDoc(collection(db, COLLECTIONS.ORDERS), {
        ...order,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      orderIds.push(orderRef.id);
      console.log(`✅ Created order: ${order.orderNumber}`);
    }
    
    console.log('✅ Orders seeding completed!');
    return orderIds;
  } catch (error) {
    console.error('❌ Error seeding orders:', error);
    throw error;
  }
};

// Function to clear existing reviews to prevent duplicates
const clearExistingReviews = async () => {
  try {
    console.log('🧹 Clearing existing reviews...');
    const reviewsSnapshot = await getDocs(collection(db, COLLECTIONS.REVIEWS));
    
    for (const reviewDoc of reviewsSnapshot.docs) {
      await reviewDoc.ref.delete();
    }
    
    console.log(`✅ Cleared ${reviewsSnapshot.size} existing reviews`);
  } catch (error) {
    console.warn('⚠️ Error clearing reviews (may not exist yet):', error.message);
  }
};

export const seedReviews = async () => {
  try {
    console.log('⭐ Creating sample reviews...');
    
    // Clear existing reviews first
    await clearExistingReviews();
    
    // Get existing gigs and map them by title for consistent mapping
    const gigsSnapshot = await getDocs(collection(db, COLLECTIONS.GIGS));
    const gigsByTitle = {};
    
    gigsSnapshot.forEach((doc) => {
      const gigData = doc.data();
      gigsByTitle[gigData.title] = doc.id;
    });
    
    // Get existing orders
    const ordersSnapshot = await getDocs(collection(db, COLLECTIONS.ORDERS));
    const orderIds = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    if (orderIds.length === 0 || Object.keys(gigsByTitle).length === 0) {
      console.log('⚠️ No orders or gigs found. Creating dependencies first...');
      if (Object.keys(gigsByTitle).length === 0) await seedGigs();
      if (orderIds.length === 0) await seedOrders();
      
      // Re-fetch gigs after seeding
      const newGigsSnapshot = await getDocs(collection(db, COLLECTIONS.GIGS));
      newGigsSnapshot.forEach((doc) => {
        const gigData = doc.data();
        gigsByTitle[gigData.title] = doc.id;
      });
    }
    
    // Define fixed gig titles for consistent mapping
    const ecommerceGigId = gigsByTitle['Pembuatan Website E-commerce Modern dengan React'];
    const uiuxGigId = gigsByTitle['Desain UI/UX untuk Aplikasi Mobile'];
    const contentGigId = gigsByTitle['Penulisan Artikel SEO dan Content Marketing'];
    
    console.log('🔗 Gig mappings:');
    console.log(`📱 E-commerce Gig ID: ${ecommerceGigId}`);
    console.log(`🎨 UI/UX Gig ID: ${uiuxGigId}`);
    console.log(`✍️ Content Gig ID: ${contentGigId}`);
    
    // Create reviews with fixed gig assignments
    const sampleReviews = [
      // Reviews for E-commerce gig (user_freelancer_1)
      {
        orderId: orderIds[0]?.id || 'sample_order_1',
        gigId: ecommerceGigId || 'fallback_gig_1',
        freelancerId: 'user_freelancer_1',
        clientId: 'user_client_1',
        rating: 5,
        comment: 'Pekerjaan sangat memuaskan! Website e-commerce yang dibuat sesuai dengan ekspektasi dan delivery tepat waktu. Highly recommended!',
        helpful: 3,
        status: 'published',
        isVisible: true,
        isReported: false
      },
      {
        orderId: orderIds[1]?.id || 'sample_order_2',
        gigId: ecommerceGigId || 'fallback_gig_1',
        freelancerId: 'user_freelancer_1',
        clientId: 'user_client_2',
        rating: 5,
        comment: 'Excellent work on the e-commerce platform! The website exceeded my expectations. Great communication throughout the project.',
        helpful: 8,
        status: 'published',
        isVisible: true,
        isReported: false
      },
      {
        orderId: orderIds[2]?.id || 'sample_order_3',
        gigId: ecommerceGigId || 'fallback_gig_1',
        freelancerId: 'user_freelancer_1',
        clientId: 'user_client_1',
        rating: 4,
        comment: 'Good quality work on the landing page, delivered on time. The website looks professional and responsive.',
        helpful: 2,
        status: 'published',
        isVisible: true,
        isReported: false
      },
      
      // Review for UI/UX gig (user_freelancer_2)
      {
        orderId: orderIds[3]?.id || 'sample_order_4',
        gigId: uiuxGigId || 'fallback_gig_2',
        freelancerId: 'user_freelancer_2',
        clientId: 'user_client_1',
        rating: 5,
        comment: 'Amazing UI/UX design for mobile app! Maya really understood our vision and delivered exactly what we needed. The prototypes were excellent.',
        helpful: 7,
        status: 'published',
        isVisible: true,
        isReported: false
      },
      
      // Review for Content writing gig (user_freelancer_3)
      {
        orderId: orderIds[4]?.id || 'sample_order_5',
        gigId: contentGigId || 'fallback_gig_3',
        freelancerId: 'user_freelancer_3',
        clientId: 'user_client_2',
        rating: 5,
        comment: 'Excellent content writing! SEO-friendly articles that really improved our website traffic. Very professional approach to content marketing.',
        helpful: 9,
        status: 'published',
        isVisible: true,
        isReported: false
      }
    ];
    
    // Log which reviews will be created for which gigs
    console.log('📝 Creating reviews with fixed assignments:');
    sampleReviews.forEach((review, index) => {
      const gigTitle = Object.keys(gigsByTitle).find(title => gigsByTitle[title] === review.gigId);
      console.log(`   Review ${index + 1}: ${review.freelancerId} → "${gigTitle || 'Unknown Gig'}" (Rating: ${review.rating})`);
    });
    
    for (const review of sampleReviews) {
      await addDoc(collection(db, COLLECTIONS.REVIEWS), {
        ...review,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log(`✅ Created review for freelancer: ${review.freelancerId} (Rating: ${review.rating})`);
    }
    
    console.log('✅ Reviews seeding completed with fixed gig assignments!');
    
    // Now calculate and update freelancer ratings based on actual reviews
    await updateFreelancerRatings();
    
  } catch (error) {
    console.error('❌ Error seeding reviews:', error);
    throw error;
  }
};

// Function to calculate and update freelancer ratings dynamically
const updateFreelancerRatings = async () => {
  try {
    console.log('🔢 Calculating freelancer ratings from reviews...');
    
    // Get all freelancers
    const freelancersSnapshot = await getDocs(collection(db, COLLECTIONS.FREELANCER_PROFILES));
    
    for (const freelancerDoc of freelancersSnapshot.docs) {
      const freelancerId = freelancerDoc.id;
      
      // Get all reviews for this freelancer
      const reviewsQuery = query(
        collection(db, COLLECTIONS.REVIEWS),
        where('freelancerId', '==', freelancerId),
        where('status', '==', 'published')
      );
      const reviewsSnapshot = await getDocs(reviewsQuery);
      
      // Calculate rating
      let totalRating = 0;
      let reviewCount = 0;
      
      reviewsSnapshot.forEach(reviewDoc => {
        const review = reviewDoc.data();
        totalRating += review.rating || 0;
        reviewCount++;
      });
      
      const averageRating = reviewCount > 0 ? Math.round((totalRating / reviewCount) * 10) / 10 : 0;
      
      // Get completed orders count for this freelancer
      const ordersQuery = query(
        collection(db, COLLECTIONS.ORDERS),
        where('freelancerId', '==', freelancerId),
        where('status', '==', 'completed')
      );
      const ordersSnapshot = await getDocs(ordersQuery);
      const completedOrdersCount = ordersSnapshot.size;
      
      // Update freelancer profile with calculated data
      await updateDoc(doc(db, COLLECTIONS.FREELANCER_PROFILES, freelancerId), {
        rating: averageRating,
        totalReviews: reviewCount,
        totalOrders: completedOrdersCount,
        completedProjects: completedOrdersCount,
        updatedAt: serverTimestamp()
      });
      
      console.log(`✅ Updated ${freelancerId}: Rating ${averageRating} (${reviewCount} reviews, ${completedOrdersCount} orders)`);
    }
    
    console.log('✅ Freelancer ratings updated successfully!');
    
  } catch (error) {
    console.error('❌ Error updating freelancer ratings:', error);
    throw error;
  }
};

// Main seeding function that calls all individual functions
export const seedAllData = async () => {
  try {
    console.log('🌱 Starting complete database seeding with new structure...');
    
    await seedUsers();
    await seedGigs();
    await seedOrders();
    await seedReviews();
    
    // Create additional sample data
    console.log('💬 Creating sample chats...');
    const gigsSnapshot = await getDocs(collection(db, COLLECTIONS.GIGS));
    const gigIds = gigsSnapshot.docs.map(doc => doc.id);
    
    const ordersSnapshot = await getDocs(collection(db, COLLECTIONS.ORDERS));
    const orderIds = ordersSnapshot.docs.map(doc => doc.id);
    
    const sampleChats = [
      {
        participants: ['user_client_1', 'user_freelancer_1'],
        participantDetails: {
          'user_client_1': {
            displayName: 'Andi Pratama',
            profilePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face&auto=format',
            role: 'client'
          },
          'user_freelancer_1': {
            displayName: 'Budi Santoso',
            profilePhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face&auto=format',
            role: 'freelancer'
          }
        },
        gigId: gigIds[0] || 'sample_gig_1',
        orderId: orderIds[0] || 'sample_order_1',
        isActive: true,
        lastMessage: 'Terima kasih atas kerjasamanya!',
        lastMessageSender: 'user_client_1',
        lastMessageTime: serverTimestamp(),
        unreadCount: {
          'user_client_1': 0,
          'user_freelancer_1': 0
        }
      }
    ];
    
    const chatIds = [];
    for (const chat of sampleChats) {
      const chatRef = await addDoc(collection(db, COLLECTIONS.CHATS), {
        ...chat,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      chatIds.push(chatRef.id);
      console.log(`✅ Created chat between participants`);
    }
    
    // Create Sample Messages
    console.log('📨 Creating sample messages...');
    const sampleMessages = [
      {
        chatId: chatIds[0],
        senderId: 'user_client_1',
        content: 'Halo, saya tertarik dengan jasa pembuatan website e-commerce Anda',
        messageType: 'text',
        isRead: true,
        readAt: new Date('2024-11-15T10:30:00')
      },
      {
        chatId: chatIds[0],
        senderId: 'user_freelancer_1',
        content: 'Halo! Terima kasih atas minatnya. Bisa dijelaskan lebih detail kebutuhan websitenya?',
        messageType: 'text',
        isRead: true,
        readAt: new Date('2024-11-15T11:00:00')
      },
      {
        chatId: chatIds[0],
        senderId: 'user_client_1',
        content: 'Terima kasih atas kerjasamanya!',
        messageType: 'text',
        isRead: true,
        readAt: new Date('2024-11-30T15:00:00')
      }
    ];
    
    for (const message of sampleMessages) {
      await addDoc(collection(db, COLLECTIONS.MESSAGES), {
        ...message,
        createdAt: serverTimestamp()
      });
      console.log(`✅ Created message in chat`);
    }
    
    // Create Sample Favorites
    console.log('❤️ Creating sample favorites...');
    const sampleFavorites = [
      {
        userId: 'user_client_1',
        gigId: gigIds[1] || gigIds[0] || 'sample_gig_1'
      },
      {
        userId: 'user_client_2',
        gigId: gigIds[0] || 'sample_gig_1'
      }
    ];
    
    for (const favorite of sampleFavorites) {
      await addDoc(collection(db, COLLECTIONS.FAVORITES), {
        ...favorite,
        createdAt: serverTimestamp()
      });
      console.log(`✅ Created favorite for user: ${favorite.userId}`);
    }
    
    // Create Sample Notifications
    console.log('🔔 Creating sample notifications...');
    const sampleNotifications = [
      {
        userId: 'user_freelancer_1',
        type: 'order_update',
        message: 'Pesanan baru dari Andi Pratama untuk Website E-commerce',
        orderId: orderIds[0] || 'sample_order_1',
        read: true,
        readAt: new Date('2024-11-15T12:00:00')
      },
      {
        userId: 'user_client_1',
        type: 'order_delivered',
        message: 'Pesanan Anda telah diselesaikan oleh Budi Santoso',
        orderId: orderIds[0] || 'sample_order_1',
        read: true,
        readAt: new Date('2024-11-28T16:00:00')
      }
    ];
    
    for (const notification of sampleNotifications) {
      await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), {
        ...notification,
        createdAt: serverTimestamp()
      });
      console.log(`✅ Created notification for user: ${notification.userId}`);
    }
    
    console.log('🎉 Complete database seeding finished successfully!');
    console.log('📊 Summary:');
    console.log(`   • ${sampleUsers.length} users created`);
    console.log(`   • ${sampleClientProfiles.length} client profiles created`);
    console.log(`   • ${sampleFreelancerProfiles.length} freelancer profiles created`);
    console.log(`   • ${sampleGigs.length} gigs created`);
    console.log(`   • Sample orders, reviews, chats, messages, favorites, and notifications created`);
    
  } catch (error) {
    console.error('❌ Error in complete seeding:', error);
    throw error;
  }
};

// Seed function (keeping for backwards compatibility)
async function seedDatabase() {
  return await seedAllData();
}

// Export functions that SeedingPage.js expects
export { seedDatabase };

// Function to clear all existing data and reseed everything
export const reseedAllData = async () => {
  try {
    console.log('🔄 Starting complete reseed with data clearing...');
    
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    
    // Clear reviews first (they depend on orders and gigs)
    await clearExistingReviews();
    
    // Clear other collections as needed
    try {
      const collections = [
        COLLECTIONS.NOTIFICATIONS,
        COLLECTIONS.MESSAGES, 
        COLLECTIONS.CHATS,
        COLLECTIONS.FAVORITES,
        COLLECTIONS.ORDERS,
        COLLECTIONS.GIGS,
        COLLECTIONS.FREELANCER_PROFILES,
        COLLECTIONS.CLIENT_PROFILES
      ];
      
      for (const collectionName of collections) {
        const snapshot = await getDocs(collection(db, collectionName));
        console.log(`🧹 Clearing ${snapshot.size} documents from ${collectionName}...`);
        
        for (const doc of snapshot.docs) {
          await doc.ref.delete();
        }
      }
    } catch (error) {
      console.warn('⚠️ Some collections may not exist yet:', error.message);
    }
    
    console.log('✅ Data clearing completed!');
    
    // Now seed fresh data
    await seedAllData();
    
    console.log('🎉 Complete reseed finished successfully!');
    
  } catch (error) {
    console.error('❌ Error in complete reseed:', error);
    throw error;
  }
};