/**
 * Database Seeding Script
 * 
 * Seeds the database with realistic data for:
 * - Users (freelancers and clients)
 * - Freelancer profiles
 * - Gigs with proper packages
 * - Reviews and ratings
 */

import { 
  collection, 
  doc, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config.js';
import { COLLECTIONS } from '../utils/constants.js';

// Sample freelancer data
const freelancers = [
  {
    uid: 'freelancer_001',
    email: 'ahmad.designer@example.com',
    username: 'ahmad_designer',
    displayName: 'Ahmad Fauzi',
    phoneNumber: '+6281234567890',
    gender: 'Male',
    location: 'jakarta',
    bio: 'UI/UX Designer berpengalaman 5+ tahun dalam membuat desain yang user-friendly dan modern. Spesialisasi dalam mobile app design dan web interface. Telah menangani 200+ project untuk startup dan perusahaan besar.',
    profilePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
    isFreelancer: true,
    roles: ['freelancer'],
    emailVerified: true,
    isActive: true,
    skills: ['UI/UX Design', 'Figma', 'Adobe XD', 'Prototype', 'User Research'],
    experienceLevel: 'expert',
    hourlyRate: 150000,
    availability: 'full-time',
    portfolioLinks: ['https://dribbble.com/ahmad-designer', 'https://behance.net/ahmaddesigner'],
    rating: 4.9,
    totalReviews: 89,
    completedProjects: 156,
    tier: 'gold', // bronze, silver, gold, platinum
    education: [
      {
        degree: 'S1 Desain Komunikasi Visual',
        institution: 'Institut Teknologi Bandung',
        year: '2015-2019'
      }
    ],
    certifications: [
      {
        name: 'Google UX Design Certificate',
        issuer: 'Google',
        year: '2021'
      },
      {
        name: 'Adobe Certified Expert',
        issuer: 'Adobe',
        year: '2020'
      }
    ]
  },
  {
    uid: 'freelancer_002',
    email: 'sari.developer@example.com',
    username: 'sari_dev',
    displayName: 'Sari Dewi',
    phoneNumber: '+6281234567891',
    gender: 'Female',
    location: 'bandung',
    bio: 'Full-stack developer dengan keahlian React, Node.js, dan database management. Passionate about creating scalable web applications dan RESTful APIs. Always updated dengan teknologi terbaru.',
    profilePhoto: 'https://images.unsplash.com/photo-1494790108755-2616c47b2ee8?w=400&h=400&fit=crop&crop=face',
    isFreelancer: true,
    roles: ['freelancer'],
    emailVerified: true,
    isActive: true,
    skills: ['React', 'Node.js', 'MongoDB', 'Express.js', 'JavaScript', 'TypeScript', 'REST API'],
    experienceLevel: 'expert',
    hourlyRate: 200000,
    availability: 'part-time',
    portfolioLinks: ['https://github.com/sari-dev', 'https://saridev.portfolio.com'],
    rating: 4.8,
    totalReviews: 67,
    completedProjects: 98,
    tier: 'platinum',
    education: [
      {
        degree: 'S1 Teknik Informatika',
        institution: 'Universitas Gadjah Mada',
        year: '2016-2020'
      }
    ],
    certifications: [
      {
        name: 'AWS Certified Developer',
        issuer: 'Amazon Web Services',
        year: '2022'
      }
    ]
  },
  {
    uid: 'freelancer_003',
    email: 'budi.writer@example.com',
    username: 'budi_writer',
    displayName: 'Budi Santoso',
    phoneNumber: '+6281234567892',
    gender: 'Male',
    location: 'surabaya',
    bio: 'Content writer dan copywriter profesional dengan pengalaman menulis untuk berbagai industri. Spesialisasi dalam SEO content, product description, dan marketing copy yang engaging.',
    profilePhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
    isFreelancer: true,
    roles: ['freelancer'],
    emailVerified: true,
    isActive: true,
    skills: ['Content Writing', 'Copywriting', 'SEO', 'Blog Writing', 'Product Description'],
    experienceLevel: 'intermediate',
    hourlyRate: 75000,
    availability: 'full-time',
    portfolioLinks: ['https://budiwriter.medium.com', 'https://budiwriter.contently.com'],
    rating: 4.7,
    totalReviews: 45,
    completedProjects: 78,
    tier: 'silver',
    education: [
      {
        degree: 'S1 Sastra Indonesia',
        institution: 'Universitas Airlangga',
        year: '2017-2021'
      }
    ],
    certifications: [
      {
        name: 'Google Analytics Certified',
        issuer: 'Google',
        year: '2022'
      }
    ]
  }
];

// Sample client data
const clients = [
  {
    uid: 'client_001',
    email: 'startup@techco.com',
    username: 'techco_startup',
    displayName: 'TechCo Startup',
    phoneNumber: '+6281234567893',
    location: 'jakarta',
    bio: 'Startup teknologi yang fokus pada solusi digital untuk UMKM Indonesia.',
    profilePhoto: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop',
    isFreelancer: false,
    roles: ['client'],
    emailVerified: true,
    isActive: true,
    companyName: 'TechCo Indonesia',
    industry: 'Technology'
  },
  {
    uid: 'client_002',
    email: 'marketing@fashionbrand.com',
    username: 'fashion_brand',
    displayName: 'Fashion Brand Co',
    phoneNumber: '+6281234567894',
    location: 'bandung',
    bio: 'Brand fashion lokal yang ingin go digital dan meningkatkan online presence.',
    profilePhoto: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=400&fit=crop',
    isFreelancer: false,
    roles: ['client'],
    emailVerified: true,
    isActive: true,
    companyName: 'Fashion Brand Indonesia',
    industry: 'Fashion & Retail'
  }
];

// Sample gigs data
const gigs = [
  {
    id: 'gig_001',
    freelancerId: 'freelancer_001',
    title: 'Desain UI/UX untuk Mobile App Modern dan User-Friendly',
    description: 'Saya akan membuat desain UI/UX yang stunning dan user-friendly untuk aplikasi mobile Anda. Dengan pengalaman 5+ tahun di bidang design, saya telah membantu 200+ client menciptakan aplikasi yang tidak hanya cantik tapi juga mudah digunakan.\n\nApa yang Anda dapatkan:\n• Research & analisis user behavior\n• Wireframe dan user flow\n• High-fidelity mockup\n• Interactive prototype\n• Design system & style guide\n• Handoff untuk developer\n\nSaya menggunakan tools terbaru seperti Figma dan Adobe XD untuk memastikan hasil yang profesional dan pixel-perfect.',
    category: 'Design & Creative',
    subcategory: 'UI/UX Design',
    tags: ['ui', 'ux', 'mobile app', 'figma', 'prototype'],
    images: [
      'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1576153192396-180ecef2a715?w=800&h=600&fit=crop'
    ],
    packages: {
      basic: {
        name: 'UI Design Only',
        description: 'Desain interface untuk 5 screens utama',
        price: 750000,
        deliveryTime: 5,
        revisions: 2,
        features: [
          '5 screens UI design',
          'Basic style guide',
          'Source file (Figma)',
          'PNG exports'
        ]
      },
      standard: {
        name: 'UI/UX Complete',
        description: 'Paket lengkap UI/UX untuk aplikasi Anda',
        price: 1500000,
        deliveryTime: 10,
        revisions: 3,
        features: [
          '10 screens UI design',
          'UX research & wireframe',
          'Interactive prototype',
          'Complete style guide',
          'Source file (Figma)',
          'All format exports'
        ]
      },
      premium: {
        name: 'Full App Design',
        description: 'Desain lengkap dengan semua features',
        price: 2500000,
        deliveryTime: 14,
        revisions: 5,
        features: [
          'Unlimited screens',
          'Complete UX research',
          'Advanced prototype',
          'Design system',
          'Developer handoff',
          'Source file (Figma)',
          'All format exports',
          '30 days support'
        ]
      }
    },
    isActive: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    rating: 4.9,
    totalOrders: 89,
    inQueue: 3
  },
  {
    id: 'gig_002',
    freelancerId: 'freelancer_002',
    title: 'Pengembangan Website Full-Stack dengan React & Node.js',
    description: 'Saya akan membangun website full-stack yang powerful dan scalable menggunakan teknologi terdepan. Dengan pengalaman sebagai full-stack developer, saya siap mewujudkan ide digital Anda menjadi kenyataan.\n\nTeknologi yang saya gunakan:\n• Frontend: React.js, Next.js, TypeScript\n• Backend: Node.js, Express.js\n• Database: MongoDB, PostgreSQL\n• Hosting: AWS, Vercel, Heroku\n\nSetiap project dilengkapi dengan:\n• Clean & maintainable code\n• Responsive design\n• SEO optimization\n• Security best practices\n• Documentation lengkap',
    category: 'Programming & Tech',
    subcategory: 'Web Development',
    tags: ['react', 'nodejs', 'fullstack', 'mongodb', 'api'],
    images: [
      'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=800&h=600&fit=crop'
    ],
    packages: {
      basic: {
        name: 'Landing Page',
        description: 'Website landing page responsive',
        price: 1000000,
        deliveryTime: 7,
        revisions: 2,
        features: [
          'Responsive landing page',
          'Contact form',
          'Basic SEO',
          'Mobile optimized',
          'Source code'
        ]
      },
      standard: {
        name: 'Business Website',
        description: 'Website lengkap untuk bisnis',
        price: 2500000,
        deliveryTime: 14,
        revisions: 3,
        features: [
          'Multi-page website',
          'Admin panel',
          'Database integration',
          'Contact & forms',
          'SEO optimized',
          'Mobile responsive',
          'Source code',
          'Documentation'
        ]
      },
      premium: {
        name: 'Full Web App',
        description: 'Aplikasi web full-featured',
        price: 5000000,
        deliveryTime: 21,
        revisions: 5,
        features: [
          'Complete web application',
          'User authentication',
          'Admin dashboard',
          'API development',
          'Database design',
          'Payment integration',
          'Hosting setup',
          'Source code',
          'Complete documentation',
          '60 days support'
        ]
      }
    },
    isActive: true,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
    rating: 4.8,
    totalOrders: 67,
    inQueue: 2
  },
  {
    id: 'gig_003',
    freelancerId: 'freelancer_003',
    title: 'Content Writing SEO-Friendly untuk Website dan Blog',
    description: 'Saya akan membuat konten berkualitas tinggi yang tidak hanya engaging untuk pembaca tapi juga SEO-friendly untuk meningkatkan ranking di Google. Sebagai content writer berpengalaman, saya memahami cara membuat konten yang converts.\n\nKeahlian saya meliputi:\n• SEO content writing\n• Blog articles & posts\n• Product descriptions\n• Website copy\n• Social media content\n• Email marketing copy\n\nSetiap konten yang saya buat:\n• SEO optimized dengan keyword research\n• Original dan bebas plagiarism\n• Engaging dan mudah dibaca\n• CTA yang effective\n• Sesuai brand voice Anda',
    category: 'Writing & Translation',
    subcategory: 'Content Writing',
    tags: ['seo', 'content writing', 'blog', 'copywriting', 'article'],
    images: [
      'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=600&fit=crop'
    ],
    packages: {
      basic: {
        name: 'Blog Article',
        description: '1 artikel blog SEO-optimized',
        price: 200000,
        deliveryTime: 3,
        revisions: 2,
        features: [
          '1 artikel (800-1000 kata)',
          'SEO keyword research',
          'Meta description',
          'Plagiarism check',
          'Basic editing'
        ]
      },
      standard: {
        name: 'Content Package',
        description: 'Paket konten untuk website',
        price: 750000,
        deliveryTime: 7,
        revisions: 3,
        features: [
          '5 artikel blog (800+ kata)',
          'SEO optimization',
          'Meta descriptions',
          'Internal linking',
          'Keyword research',
          'Content calendar',
          'Plagiarism check'
        ]
      },
      premium: {
        name: 'Complete Content',
        description: 'Paket lengkap content strategy',
        price: 1500000,
        deliveryTime: 14,
        revisions: 5,
        features: [
          '10 artikel blog (1000+ kata)',
          'Complete SEO audit',
          'Content strategy',
          'Social media posts',
          'Email sequences',
          'Meta descriptions',
          'Keyword research',
          'Content calendar',
          'Performance tracking',
          '30 days revision'
        ]
      }
    },
    isActive: true,
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-08'),
    rating: 4.7,
    totalOrders: 45,
    inQueue: 1
  }
];

// Sample reviews data
const reviews = [
  // Reviews for Ahmad (UI/UX Designer)
  {
    id: 'review_001',
    gigId: 'gig_001',
    freelancerId: 'freelancer_001',
    clientId: 'client_001',
    orderId: 'order_001',
    rating: 5,
    comment: 'Hasil kerja Ahmad luar biasa! Desain UI/UX nya sangat modern dan user-friendly. Komunikasi lancar dan selalu responsive. Highly recommended!',
    createdAt: new Date('2024-01-20'),
    helpful: 12
  },
  {
    id: 'review_002',
    gigId: 'gig_001',
    freelancerId: 'freelancer_001',
    clientId: 'client_002',
    orderId: 'order_002',
    rating: 5,
    comment: 'Desainer yang sangat profesional. Prototype yang dibuat sangat detail dan mudah dipahami oleh developer. Pasti akan order lagi!',
    createdAt: new Date('2024-01-18'),
    helpful: 8
  },
  {
    id: 'review_003',
    gigId: 'gig_001',
    freelancerId: 'freelancer_001',
    clientId: 'client_001',
    orderId: 'order_003',
    rating: 4,
    comment: 'Kualitas desain bagus, tapi ada sedikit delay di timeline. Overall satisfied dengan hasil akhirnya.',
    createdAt: new Date('2024-01-15'),
    helpful: 3
  },
  // Reviews for Sari (Developer)
  {
    id: 'review_004',
    gigId: 'gig_002',
    freelancerId: 'freelancer_002',
    clientId: 'client_001',
    orderId: 'order_004',
    rating: 5,
    comment: 'Website yang dibangun Sari sangat berkualitas. Code nya clean, dokumentasi lengkap, dan performance excellent. Worth every penny!',
    createdAt: new Date('2024-01-22'),
    helpful: 15
  },
  {
    id: 'review_005',
    gigId: 'gig_002',
    freelancerId: 'freelancer_002',
    clientId: 'client_002',
    orderId: 'order_005',
    rating: 5,
    comment: 'Sangat puas dengan hasil web development nya. Sari sangat detail dan always deliver on time. Recommended developer!',
    createdAt: new Date('2024-01-19'),
    helpful: 9
  },
  // Reviews for Budi (Writer)
  {
    id: 'review_006',
    gigId: 'gig_003',
    freelancerId: 'freelancer_003',
    clientId: 'client_001',
    orderId: 'order_006',
    rating: 5,
    comment: 'Konten yang ditulis Budi sangat berkualitas dan SEO-friendly. Website traffic kami meningkat setelah menggunakan artikel dari Budi.',
    createdAt: new Date('2024-01-21'),
    helpful: 7
  },
  {
    id: 'review_007',
    gigId: 'gig_003',
    freelancerId: 'freelancer_003',
    clientId: 'client_002',
    orderId: 'order_007',
    rating: 4,
    comment: 'Writing style nya bagus dan sesuai dengan brand voice kami. Deliverynya on time. Good job!',
    createdAt: new Date('2024-01-17'),
    helpful: 4
  }
];

/**
 * Seed users (freelancers and clients)
 */
export const seedUsers = async () => {
  console.log('🌱 Seeding users...');
  
  try {
    // Seed freelancers
    for (const freelancer of freelancers) {
      // Create user document
      await setDoc(doc(db, COLLECTIONS.USERS, freelancer.uid), {
        uid: freelancer.uid,
        email: freelancer.email,
        username: freelancer.username,
        displayName: freelancer.displayName,
        phoneNumber: freelancer.phoneNumber,
        gender: freelancer.gender,
        location: freelancer.location,
        bio: freelancer.bio,
        profilePhoto: freelancer.profilePhoto,
        isFreelancer: freelancer.isFreelancer,
        roles: freelancer.roles,
        emailVerified: freelancer.emailVerified,
        isActive: freelancer.isActive,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Create freelancer profile
      await setDoc(doc(db, COLLECTIONS.FREELANCER_PROFILES, freelancer.uid), {
        userId: freelancer.uid,
        skills: freelancer.skills,
        experienceLevel: freelancer.experienceLevel,
        hourlyRate: freelancer.hourlyRate,
        availability: freelancer.availability,
        portfolioLinks: freelancer.portfolioLinks,
        rating: freelancer.rating,
        totalReviews: freelancer.totalReviews,
        completedProjects: freelancer.completedProjects,
        tier: freelancer.tier,
        education: freelancer.education,
        certifications: freelancer.certifications,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log(`✅ Created freelancer: ${freelancer.displayName}`);
    }
    
    // Seed clients
    for (const client of clients) {
      // Create user document
      await setDoc(doc(db, COLLECTIONS.USERS, client.uid), {
        uid: client.uid,
        email: client.email,
        username: client.username,
        displayName: client.displayName,
        phoneNumber: client.phoneNumber,
        location: client.location,
        bio: client.bio,
        profilePhoto: client.profilePhoto,
        isFreelancer: client.isFreelancer,
        roles: client.roles,
        emailVerified: client.emailVerified,
        isActive: client.isActive,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Create client profile
      await setDoc(doc(db, COLLECTIONS.CLIENT_PROFILES, client.uid), {
        userId: client.uid,
        companyName: client.companyName,
        industry: client.industry,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log(`✅ Created client: ${client.displayName}`);
    }
    
    console.log('✅ Users seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    throw error;
  }
};

/**
 * Seed gigs
 */
export const seedGigs = async () => {
  console.log('🌱 Seeding gigs...');
  
  try {
    for (const gig of gigs) {
      await setDoc(doc(db, COLLECTIONS.GIGS, gig.id), {
        ...gig,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log(`✅ Created gig: ${gig.title}`);
    }
    
    console.log('✅ Gigs seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding gigs:', error);
    throw error;
  }
};

/**
 * Seed reviews
 */
export const seedReviews = async () => {
  console.log('🌱 Seeding reviews...');
  
  try {
    for (const review of reviews) {
      await setDoc(doc(db, COLLECTIONS.REVIEWS, review.id), {
        ...review,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log(`✅ Created review for gig: ${review.gigId}`);
    }
    
    console.log('✅ Reviews seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding reviews:', error);
    throw error;
  }
};

/**
 * Seed all data
 */
export const seedAllData = async () => {
  console.log('🌱 Starting database seeding...');
  
  try {
    await seedUsers();
    await seedGigs();
    await seedReviews();
    
    console.log('🎉 All data seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  }
};

// Export individual data for testing
export { freelancers, clients, gigs, reviews }; 