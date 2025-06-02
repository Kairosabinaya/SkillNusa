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
import { allAdditionalGigs as additionalGigs, additionalReviews } from './additionalGigs.js';

// Sample freelancer data - expanded to 25 freelancers
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
    tier: 'gold',
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
    profilePhoto: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop&crop=face',
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
    portfolioLinks: ['https://budiwriter.medium.com'],
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
        name: 'Google Digital Marketing Certificate',
        issuer: 'Google',
        year: '2022'
      }
    ]
  },
  {
    uid: 'freelancer_004',
    email: 'lisa.graphic@example.com',
    username: 'lisa_graphic',
    displayName: 'Lisa Handayani',
    phoneNumber: '+6281234567893',
    gender: 'Female',
    location: 'jakarta',
    bio: 'Graphic designer dengan keahlian dalam logo design, branding, dan print design. Berpengalaman 4+ tahun membantu brand menciptakan identitas visual yang kuat dan memorable.',
    profilePhoto: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face',
    isFreelancer: true,
    roles: ['freelancer'],
    emailVerified: true,
    isActive: true,
    skills: ['Logo Design', 'Branding', 'Adobe Illustrator', 'Print Design', 'Brand Identity'],
    experienceLevel: 'intermediate',
    hourlyRate: 120000,
    availability: 'full-time',
    portfolioLinks: ['https://behance.net/lisahandayani', 'https://dribbble.com/lisa-graphic'],
    rating: 4.8,
    totalReviews: 34,
    completedProjects: 67,
    tier: 'gold',
    education: [
      {
        degree: 'S1 Desain Komunikasi Visual',
        institution: 'Universitas Trisakti',
        year: '2018-2022'
      }
    ],
    certifications: [
      {
        name: 'Adobe Certified Expert',
        issuer: 'Adobe',
        year: '2023'
      }
    ]
  },
  {
    uid: 'freelancer_005',
    email: 'andi.mobile@example.com',
    username: 'andi_mobile',
    displayName: 'Andi Pratama',
    phoneNumber: '+6281234567894',
    gender: 'Male',
    location: 'yogyakarta',
    bio: 'Mobile app developer spesialisasi Flutter dan React Native. Telah mengembangkan 50+ aplikasi mobile untuk startup dan enterprise. Expert dalam performance optimization dan user experience.',
    profilePhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face',
    isFreelancer: true,
    roles: ['freelancer'],
    emailVerified: true,
    isActive: true,
    skills: ['Flutter', 'React Native', 'Mobile App Development', 'iOS', 'Android'],
    experienceLevel: 'expert',
    hourlyRate: 180000,
    availability: 'part-time',
    portfolioLinks: ['https://github.com/andi-mobile', 'https://play.google.com/store/apps/developer?id=AndiPratama'],
    rating: 4.9,
    totalReviews: 28,
    completedProjects: 52,
    tier: 'platinum',
    education: [
      {
        degree: 'S1 Teknik Informatika',
        institution: 'Universitas Gadjah Mada',
        year: '2015-2019'
      }
    ],
    certifications: [
      {
        name: 'Flutter Developer Certificate',
        issuer: 'Google',
        year: '2021'
      }
    ]
  },
  {
    uid: 'freelancer_006',
    email: 'maya.digital@example.com',
    username: 'maya_digital',
    displayName: 'Maya Sari',
    phoneNumber: '+6281234567895',
    gender: 'Female',
    location: 'denpasar',
    bio: 'Digital marketing specialist dengan fokus pada SEO, social media marketing, dan Google Ads. Telah membantu 100+ bisnis meningkatkan online presence dan sales conversion.',
    profilePhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face',
    isFreelancer: true,
    roles: ['freelancer'],
    emailVerified: true,
    isActive: true,
    skills: ['SEO', 'Google Ads', 'Social Media Marketing', 'Content Marketing', 'Analytics'],
    experienceLevel: 'expert',
    hourlyRate: 140000,
    availability: 'full-time',
    portfolioLinks: ['https://mayasari.digital', 'https://linkedin.com/in/maya-sari-digital'],
    rating: 4.7,
    totalReviews: 56,
    completedProjects: 89,
    tier: 'gold',
    education: [
      {
        degree: 'S1 Manajemen Pemasaran',
        institution: 'Universitas Indonesia',
        year: '2016-2020'
      }
    ],
    certifications: [
      {
        name: 'Google Ads Certified',
        issuer: 'Google',
        year: '2022'
      }
    ]
  },
  {
    uid: 'freelancer_007',
    email: 'davi.video@example.com',
    username: 'davi_video',
    displayName: 'David Kurniawan',
    phoneNumber: '+6281234567896',
    gender: 'Male',
    location: 'medan',
    bio: 'Video editor dan motion graphics designer dengan pengalaman 6+ tahun. Spesialisasi dalam promotional videos, explainer animations, dan social media content. Creative storyteller yang passionate.',
    profilePhoto: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop&crop=face',
    isFreelancer: true,
    roles: ['freelancer'],
    emailVerified: true,
    isActive: true,
    skills: ['Video Editing', 'Motion Graphics', 'After Effects', 'Premiere Pro', 'Animation'],
    experienceLevel: 'expert',
    hourlyRate: 160000,
    availability: 'full-time',
    portfolioLinks: ['https://vimeo.com/davidkurniawan', 'https://youtube.com/c/DavidVideoCreator'],
    rating: 4.8,
    totalReviews: 42,
    completedProjects: 73,
    tier: 'gold',
    education: [
      {
        degree: 'S1 Broadcasting',
        institution: 'Institut Seni Budaya Indonesia',
        year: '2014-2018'
      }
    ],
    certifications: [
      {
        name: 'Adobe After Effects Certified',
        issuer: 'Adobe',
        year: '2020'
      }
    ]
  },
  {
    uid: 'freelancer_008',
    email: 'nina.data@example.com',
    username: 'nina_data',
    displayName: 'Nina Fitria',
    phoneNumber: '+6281234567897',
    gender: 'Female',
    location: 'jakarta',
    bio: 'Data scientist dan analyst dengan keahlian Python, R, dan machine learning. Membantu bisnis mengambil keputusan berdasarkan data dengan visualization dan predictive modeling.',
    profilePhoto: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop&crop=face',
    isFreelancer: true,
    roles: ['freelancer'],
    emailVerified: true,
    isActive: true,
    skills: ['Python', 'Data Analysis', 'Machine Learning', 'SQL', 'Tableau'],
    experienceLevel: 'expert',
    hourlyRate: 220000,
    availability: 'part-time',
    portfolioLinks: ['https://github.com/nina-data', 'https://kaggle.com/ninafitria'],
    rating: 4.9,
    totalReviews: 19,
    completedProjects: 35,
    tier: 'platinum',
    education: [
      {
        degree: 'S2 Data Science',
        institution: 'Institut Teknologi Bandung',
        year: '2019-2021'
      }
    ],
    certifications: [
      {
        name: 'TensorFlow Developer Certificate',
        issuer: 'Google',
        year: '2022'
      }
    ]
  },
  {
    uid: 'freelancer_009',
    email: 'riko.voice@example.com',
    username: 'riko_voice',
    displayName: 'Riko Permana',
    phoneNumber: '+6281234567898',
    gender: 'Male',
    location: 'bandung',
    bio: 'Voice over artist dan audio engineer dengan suara yang versatile. Berpengalaman dalam commercial voice overs, audiobook narration, dan podcast production. Professional home studio setup.',
    profilePhoto: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&h=400&fit=crop&crop=face',
    isFreelancer: true,
    roles: ['freelancer'],
    emailVerified: true,
    isActive: true,
    skills: ['Voice Over', 'Audio Editing', 'Podcast Production', 'Sound Design', 'Audacity'],
    experienceLevel: 'intermediate',
    hourlyRate: 100000,
    availability: 'full-time',
    portfolioLinks: ['https://soundcloud.com/riko-voice', 'https://anchor.fm/riko-permana'],
    rating: 4.6,
    totalReviews: 31,
    completedProjects: 48,
    tier: 'silver',
    education: [
      {
        degree: 'S1 Musik',
        institution: 'Institut Seni Budaya Indonesia',
        year: '2017-2021'
      }
    ],
    certifications: [
      {
        name: 'Pro Tools Certified User',
        issuer: 'Avid',
        year: '2022'
      }
    ]
  },
  {
    uid: 'freelancer_010',
    email: 'tina.business@example.com',
    username: 'tina_business',
    displayName: 'Tina Maharani',
    phoneNumber: '+6281234567899',
    gender: 'Female',
    location: 'surabaya',
    bio: 'Business consultant dan virtual assistant dengan pengalaman 8+ tahun. Membantu startup dan SME dalam business planning, market research, dan administrative tasks. MBA background.',
    profilePhoto: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=400&fit=crop&crop=face',
    isFreelancer: true,
    roles: ['freelancer'],
    emailVerified: true,
    isActive: true,
    skills: ['Business Planning', 'Market Research', 'Virtual Assistant', 'Project Management', 'Excel'],
    experienceLevel: 'expert',
    hourlyRate: 130000,
    availability: 'part-time',
    portfolioLinks: ['https://linkedin.com/in/tina-maharani', 'https://tinamaharani.business'],
    rating: 4.8,
    totalReviews: 47,
    completedProjects: 82,
    tier: 'gold',
    education: [
      {
        degree: 'S2 MBA',
        institution: 'Universitas Indonesia',
        year: '2018-2020'
      }
    ],
    certifications: [
      {
        name: 'Project Management Professional (PMP)',
        issuer: 'PMI',
        year: '2021'
      }
    ]
  },
  // NEW FREELANCERS (11-25)
  {
    uid: 'freelancer_011',
    email: 'eka.3d@example.com',
    username: 'eka_3d',
    displayName: 'Eka Pratama',
    phoneNumber: '+6281234567900',
    gender: 'Male',
    location: 'jakarta',
    bio: '3D Artist dan Animator dengan spesialisasi dalam architectural visualization dan product modeling. Berpengalaman 4+ tahun menggunakan Blender, 3ds Max, dan Cinema 4D.',
    profilePhoto: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop&crop=face',
    isFreelancer: true,
    roles: ['freelancer'],
    emailVerified: true,
    isActive: true,
    skills: ['3D Modeling', 'Blender', '3ds Max', 'Cinema 4D', 'Architectural Visualization'],
    experienceLevel: 'intermediate',
    hourlyRate: 170000,
    availability: 'full-time',
    portfolioLinks: ['https://artstation.com/ekapratama', 'https://behance.net/eka3d'],
    rating: 4.7,
    totalReviews: 32,
    completedProjects: 58,
    tier: 'gold',
    education: [
      {
        degree: 'S1 Desain Komunikasi Visual',
        institution: 'Institut Teknologi Bandung',
        year: '2018-2022'
      }
    ],
    certifications: [
      {
        name: 'Certified Blender Artist',
        issuer: 'Blender Foundation',
        year: '2023'
      }
    ]
  },
  {
    uid: 'freelancer_012',
    email: 'dina.photo@example.com',
    username: 'dina_photo',
    displayName: 'Dina Kusuma',
    phoneNumber: '+6281234567901',
    gender: 'Female',
    location: 'bandung',
    bio: 'Photographer dan photo editor profesional dengan keahlian dalam portrait, product, dan event photography. Spesialisasi dalam post-processing dan color grading.',
    profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face',
    isFreelancer: true,
    roles: ['freelancer'],
    emailVerified: true,
    isActive: true,
    skills: ['Photography', 'Photo Editing', 'Lightroom', 'Photoshop', 'Portrait Photography'],
    experienceLevel: 'expert',
    hourlyRate: 200000,
    availability: 'full-time',
    portfolioLinks: ['https://dinakusuma.photography', 'https://instagram.com/dinaphoto'],
    rating: 4.9,
    totalReviews: 67,
    completedProjects: 124,
    tier: 'platinum',
    education: [
      {
        degree: 'S1 Fotografi',
        institution: 'Institut Seni Budaya Indonesia',
        year: '2017-2021'
      }
    ],
    certifications: [
      {
        name: 'Adobe Certified Expert (Photoshop)',
        issuer: 'Adobe',
        year: '2022'
      }
    ]
  },
  {
    uid: 'freelancer_013',
    email: 'rio.blockchain@example.com',
    username: 'rio_blockchain',
    displayName: 'Rio Andriyanto',
    phoneNumber: '+6281234567902',
    gender: 'Male',
    location: 'jakarta',
    bio: 'Blockchain developer dengan expertise dalam smart contracts, DeFi applications, dan Web3 development. Berpengalaman dengan Solidity, Ethereum, dan Polygon.',
    profilePhoto: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?w=400&h=400&fit=crop&crop=face',
    isFreelancer: true,
    roles: ['freelancer'],
    emailVerified: true,
    isActive: true,
    skills: ['Blockchain', 'Solidity', 'Smart Contracts', 'Web3', 'DeFi'],
    experienceLevel: 'expert',
    hourlyRate: 300000,
    availability: 'part-time',
    portfolioLinks: ['https://github.com/rio-blockchain', 'https://riodev.web3'],
    rating: 4.8,
    totalReviews: 23,
    completedProjects: 35,
    tier: 'platinum',
    education: [
      {
        degree: 'S1 Teknik Informatika',
        institution: 'Universitas Indonesia',
        year: '2016-2020'
      }
    ],
    certifications: [
      {
        name: 'Certified Blockchain Developer',
        issuer: 'Ethereum Foundation',
        year: '2021'
      }
    ]
  },
  {
    uid: 'freelancer_014',
    email: 'sinta.translator@example.com',
    username: 'sinta_translator',
    displayName: 'Sinta Maharani',
    phoneNumber: '+6281234567903',
    gender: 'Female',
    location: 'yogyakarta',
    bio: 'Professional translator dengan keahlian bahasa Inggris, Jepang, dan Korea. Spesialisasi dalam technical translation, legal documents, dan literary works.',
    profilePhoto: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop&crop=face',
    isFreelancer: true,
    roles: ['freelancer'],
    emailVerified: true,
    isActive: true,
    skills: ['Translation', 'English', 'Japanese', 'Korean', 'Technical Writing'],
    experienceLevel: 'expert',
    hourlyRate: 120000,
    availability: 'full-time',
    portfolioLinks: ['https://sintamaharani.translate', 'https://proz.com/sintamaharani'],
    rating: 4.8,
    totalReviews: 89,
    completedProjects: 156,
    tier: 'gold',
    education: [
      {
        degree: 'S1 Sastra Jepang',
        institution: 'Universitas Gadjah Mada',
        year: '2015-2019'
      }
    ],
    certifications: [
      {
        name: 'JLPT N1 Certificate',
        issuer: 'Japan Foundation',
        year: '2020'
      }
    ]
  },
  {
    uid: 'freelancer_015',
    email: 'bayu.game@example.com',
    username: 'bayu_game',
    displayName: 'Bayu Setiyawan',
    phoneNumber: '+6281234567904',
    gender: 'Male',
    location: 'surabaya',
    bio: 'Game developer dengan spesialisasi Unity dan Unreal Engine. Telah mengembangkan 20+ games untuk mobile dan PC. Expert dalam game mechanics dan level design.',
    profilePhoto: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=400&fit=crop&crop=face',
    isFreelancer: true,
    roles: ['freelancer'],
    emailVerified: true,
    isActive: true,
    skills: ['Game Development', 'Unity', 'Unreal Engine', 'C#', 'Game Design'],
    experienceLevel: 'expert',
    hourlyRate: 250000,
    availability: 'full-time',
    portfolioLinks: ['https://bayusetiyawan.itch.io', 'https://github.com/bayu-game'],
    rating: 4.9,
    totalReviews: 41,
    completedProjects: 28,
    tier: 'platinum',
    education: [
      {
        degree: 'S1 Teknik Informatika',
        institution: 'Institut Teknologi Sepuluh Nopember',
        year: '2017-2021'
      }
    ],
    certifications: [
      {
        name: 'Unity Certified Developer',
        issuer: 'Unity Technologies',
        year: '2022'
      }
    ]
  },
  {
    uid: 'freelancer_016',
    email: 'lestari.fashion@example.com',
    username: 'lestari_fashion',
    displayName: 'Lestari Putri',
    phoneNumber: '+6281234567905',
    gender: 'Female',
    location: 'jakarta',
    bio: 'Fashion designer dan illustrator dengan fokus pada sustainable fashion dan traditional Indonesian motifs. Berpengalaman dalam fashion illustration dan pattern design.',
    profilePhoto: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=400&h=400&fit=crop&crop=face',
    isFreelancer: true,
    roles: ['freelancer'],
    emailVerified: true,
    isActive: true,
    skills: ['Fashion Design', 'Fashion Illustration', 'Pattern Design', 'Traditional Motifs', 'Sustainable Fashion'],
    experienceLevel: 'intermediate',
    hourlyRate: 140000,
    availability: 'full-time',
    portfolioLinks: ['https://lestariputri.fashion', 'https://behance.net/lestarifashion'],
    rating: 4.6,
    totalReviews: 38,
    completedProjects: 52,
    tier: 'silver',
    education: [
      {
        degree: 'S1 Fashion Design',
        institution: 'Universitas Trisakti',
        year: '2018-2022'
      }
    ],
    certifications: [
      {
        name: 'Sustainable Fashion Design Certificate',
        issuer: 'Fashion Institute',
        year: '2023'
      }
    ]
  },
  {
    uid: 'freelancer_017',
    email: 'fajar.cybersec@example.com',
    username: 'fajar_cybersec',
    displayName: 'Fajar Ramadhan',
    phoneNumber: '+6281234567906',
    gender: 'Male',
    location: 'bandung',
    bio: 'Cybersecurity specialist dengan fokus pada penetration testing, security auditing, dan vulnerability assessment. Certified Ethical Hacker dengan pengalaman 6+ tahun.',
    profilePhoto: 'https://images.unsplash.com/photo-1556157382-97eda2d62296?w=400&h=400&fit=crop&crop=face',
    isFreelancer: true,
    roles: ['freelancer'],
    emailVerified: true,
    isActive: true,
    skills: ['Cybersecurity', 'Penetration Testing', 'Security Auditing', 'Vulnerability Assessment', 'Ethical Hacking'],
    experienceLevel: 'expert',
    hourlyRate: 280000,
    availability: 'part-time',
    portfolioLinks: ['https://fajarramadhan.security', 'https://linkedin.com/in/fajar-cybersec'],
    rating: 4.9,
    totalReviews: 27,
    completedProjects: 43,
    tier: 'platinum',
    education: [
      {
        degree: 'S1 Teknik Informatika',
        institution: 'Institut Teknologi Bandung',
        year: '2015-2019'
      }
    ],
    certifications: [
      {
        name: 'Certified Ethical Hacker (CEH)',
        issuer: 'EC-Council',
        year: '2020'
      }
    ]
  },
  {
    uid: 'freelancer_018',
    email: 'wulan.interior@example.com',
    username: 'wulan_interior',
    displayName: 'Wulan Sari',
    phoneNumber: '+6281234567907',
    gender: 'Female',
    location: 'jakarta',
    bio: 'Interior designer dengan spesialisasi dalam residential dan commercial spaces. Menggunakan SketchUp, AutoCAD, dan 3D visualization untuk presentasi yang menarik.',
    profilePhoto: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=400&h=400&fit=crop&crop=face',
    isFreelancer: true,
    roles: ['freelancer'],
    emailVerified: true,
    isActive: true,
    skills: ['Interior Design', 'SketchUp', 'AutoCAD', '3D Visualization', 'Space Planning'],
    experienceLevel: 'intermediate',
    hourlyRate: 180000,
    availability: 'full-time',
    portfolioLinks: ['https://wulansari.interior', 'https://behance.net/wulaninterior'],
    rating: 4.7,
    totalReviews: 45,
    completedProjects: 67,
    tier: 'gold',
    education: [
      {
        degree: 'S1 Arsitektur Interior',
        institution: 'Universitas Trisakti',
        year: '2017-2021'
      }
    ],
    certifications: [
      {
        name: 'SketchUp Professional Certificate',
        issuer: 'Trimble Inc.',
        year: '2022'
      }
    ]
  },
  {
    uid: 'freelancer_019',
    email: 'hendra.music@example.com',
    username: 'hendra_music',
    displayName: 'Hendra Wijaya',
    phoneNumber: '+6281234567908',
    gender: 'Male',
    location: 'yogyakarta',
    bio: 'Music producer dan composer dengan spesialisasi dalam electronic music, film scoring, dan jingle production. Menggunakan Logic Pro, Ableton Live, dan Pro Tools.',
    profilePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
    isFreelancer: true,
    roles: ['freelancer'],
    emailVerified: true,
    isActive: true,
    skills: ['Music Production', 'Composing', 'Logic Pro', 'Ableton Live', 'Film Scoring'],
    experienceLevel: 'expert',
    hourlyRate: 200000,
    availability: 'full-time',
    portfolioLinks: ['https://soundcloud.com/hendrawijaya', 'https://spotify.com/artist/hendrawijaya'],
    rating: 4.8,
    totalReviews: 36,
    completedProjects: 54,
    tier: 'gold',
    education: [
      {
        degree: 'S1 Musik',
        institution: 'Institut Seni Budaya Indonesia',
        year: '2016-2020'
      }
    ],
    certifications: [
      {
        name: 'Ableton Live Certified Trainer',
        issuer: 'Ableton',
        year: '2021'
      }
    ]
  },
  {
    uid: 'freelancer_020',
    email: 'putri.legal@example.com',
    username: 'putri_legal',
    displayName: 'Putri Anggraini',
    phoneNumber: '+6281234567909',
    gender: 'Female',
    location: 'jakarta',
    bio: 'Legal consultant dengan spesialisasi dalam business law, contract drafting, dan intellectual property. Lulusan Fakultas Hukum UI dengan pengalaman 7+ tahun.',
    profilePhoto: 'https://images.unsplash.com/photo-1594736797933-d0d8cb87e6b3?w=400&h=400&fit=crop&crop=face',
    isFreelancer: true,
    roles: ['freelancer'],
    emailVerified: true,
    isActive: true,
    skills: ['Legal Consulting', 'Contract Drafting', 'Business Law', 'Intellectual Property', 'Legal Research'],
    experienceLevel: 'expert',
    hourlyRate: 350000,
    availability: 'part-time',
    portfolioLinks: ['https://putrianggraini.law', 'https://linkedin.com/in/putri-legal'],
    rating: 4.9,
    totalReviews: 52,
    completedProjects: 78,
    tier: 'platinum',
    education: [
      {
        degree: 'S1 Hukum',
        institution: 'Universitas Indonesia',
        year: '2013-2017'
      }
    ],
    certifications: [
      {
        name: 'Certified Legal Professional',
        issuer: 'Indonesian Bar Association',
        year: '2018'
      }
    ]
  },
  {
    uid: 'freelancer_021',
    email: 'aris.architect@example.com',
    username: 'aris_architect',
    displayName: 'Aris Munandar',
    phoneNumber: '+6281234567910',
    gender: 'Male',
    location: 'bandung',
    bio: 'Architect dengan spesialisasi dalam sustainable architecture dan green building design. Menggunakan Revit, ArchiCAD, dan teknik BIM untuk project management.',
    profilePhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
    isFreelancer: true,
    roles: ['freelancer'],
    emailVerified: true,
    isActive: true,
    skills: ['Architecture', 'Revit', 'ArchiCAD', 'BIM', 'Sustainable Design'],
    experienceLevel: 'expert',
    hourlyRate: 250000,
    availability: 'full-time',
    portfolioLinks: ['https://arismunandar.architect', 'https://behance.net/arisarchitect'],
    rating: 4.8,
    totalReviews: 29,
    completedProjects: 41,
    tier: 'platinum',
    education: [
      {
        degree: 'S1 Arsitektur',
        institution: 'Institut Teknologi Bandung',
        year: '2014-2018'
      }
    ],
    certifications: [
      {
        name: 'LEED Green Associate',
        issuer: 'US Green Building Council',
        year: '2020'
      }
    ]
  },
  {
    uid: 'freelancer_022',
    email: 'indah.nutrition@example.com',
    username: 'indah_nutrition',
    displayName: 'Indah Permata',
    phoneNumber: '+6281234567911',
    gender: 'Female',
    location: 'surabaya',
    bio: 'Nutritionist dan health coach dengan spesialisasi dalam meal planning, weight management, dan nutrition counseling. Registered Dietitian dengan pengalaman 5+ tahun.',
    profilePhoto: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=400&fit=crop&crop=face',
    isFreelancer: true,
    roles: ['freelancer'],
    emailVerified: true,
    isActive: true,
    skills: ['Nutrition Counseling', 'Meal Planning', 'Health Coaching', 'Weight Management', 'Diet Planning'],
    experienceLevel: 'expert',
    hourlyRate: 150000,
    availability: 'part-time',
    portfolioLinks: ['https://indahpermata.nutrition', 'https://instagram.com/indahnutrition'],
    rating: 4.9,
    totalReviews: 73,
    completedProjects: 128,
    tier: 'gold',
    education: [
      {
        degree: 'S1 Gizi',
        institution: 'Universitas Airlangga',
        year: '2016-2020'
      }
    ],
    certifications: [
      {
        name: 'Registered Dietitian',
        issuer: 'Persatuan Ahli Gizi Indonesia',
        year: '2021'
      }
    ]
  },
  {
    uid: 'freelancer_023',
    email: 'gani.devops@example.com',
    username: 'gani_devops',
    displayName: 'Gani Setiawan',
    phoneNumber: '+6281234567912',
    gender: 'Male',
    location: 'jakarta',
    bio: 'DevOps engineer dengan expertise dalam cloud infrastructure, CI/CD pipelines, dan containerization. Berpengalaman dengan AWS, Docker, Kubernetes, dan Terraform.',
    profilePhoto: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop&crop=face',
    isFreelancer: true,
    roles: ['freelancer'],
    emailVerified: true,
    isActive: true,
    skills: ['DevOps', 'AWS', 'Docker', 'Kubernetes', 'CI/CD'],
    experienceLevel: 'expert',
    hourlyRate: 280000,
    availability: 'full-time',
    portfolioLinks: ['https://github.com/gani-devops', 'https://ganisetiawan.cloud'],
    rating: 4.8,
    totalReviews: 34,
    completedProjects: 49,
    tier: 'platinum',
    education: [
      {
        degree: 'S1 Sistem Informasi',
        institution: 'Universitas Bina Nusantara',
        year: '2015-2019'
      }
    ],
    certifications: [
      {
        name: 'AWS Solutions Architect',
        issuer: 'Amazon Web Services',
        year: '2020'
      }
    ]
  },
  {
    uid: 'freelancer_024',
    email: 'sari.hr@example.com',
    username: 'sari_hr',
    displayName: 'Sari Handayani',
    phoneNumber: '+6281234567913',
    gender: 'Female',
    location: 'bandung',
    bio: 'HR consultant dengan spesialisasi dalam recruitment, employee training, dan organizational development. SHRM certified dengan pengalaman 8+ tahun di berbagai industri.',
    profilePhoto: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=400&fit=crop&crop=face',
    isFreelancer: true,
    roles: ['freelancer'],
    emailVerified: true,
    isActive: true,
    skills: ['HR Consulting', 'Recruitment', 'Employee Training', 'Organizational Development', 'Performance Management'],
    experienceLevel: 'expert',
    hourlyRate: 200000,
    availability: 'part-time',
    portfolioLinks: ['https://sarihandayani.hr', 'https://linkedin.com/in/sari-hr'],
    rating: 4.7,
    totalReviews: 46,
    completedProjects: 67,
    tier: 'gold',
    education: [
      {
        degree: 'S1 Psikologi',
        institution: 'Universitas Padjajaran',
        year: '2012-2016'
      }
    ],
    certifications: [
      {
        name: 'SHRM Certified Professional (SHRM-CP)',
        issuer: 'Society for Human Resource Management',
        year: '2019'
      }
    ]
  },
  {
    uid: 'freelancer_025',
    email: 'yoga.fitness@example.com',
    username: 'yoga_fitness',
    displayName: 'Yoga Pratama',
    phoneNumber: '+6281234567914',
    gender: 'Male',
    location: 'denpasar',
    bio: 'Personal trainer dan fitness coach dengan spesialisasi dalam strength training, weight loss, dan functional fitness. Certified trainer dengan pengalaman 6+ tahun.',
    profilePhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face',
    isFreelancer: true,
    roles: ['freelancer'],
    emailVerified: true,
    isActive: true,
    skills: ['Personal Training', 'Fitness Coaching', 'Strength Training', 'Weight Loss', 'Functional Fitness'],
    experienceLevel: 'expert',
    hourlyRate: 120000,
    availability: 'full-time',
    portfolioLinks: ['https://yogapratama.fitness', 'https://instagram.com/yogafitness'],
    rating: 4.8,
    totalReviews: 91,
    completedProjects: 134,
    tier: 'gold',
    education: [
      {
        degree: 'S1 Ilmu Keolahragaan',
        institution: 'Universitas Negeri Surabaya',
        year: '2016-2020'
      }
    ],
    certifications: [
      {
        name: 'Certified Personal Trainer',
        issuer: 'National Academy of Sports Medicine',
        year: '2020'
      }
    ]
  }
];

// Sample client data - expanded to 5 clients
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
  },
  {
    uid: 'client_003',
    email: 'info@restaurantchain.com',
    username: 'restaurant_chain',
    displayName: 'Restaurant Chain',
    phoneNumber: '+6281234567895',
    location: 'jakarta',
    bio: 'Chain restoran yang ingin digitalisasi sistem dan meningkatkan customer experience.',
    profilePhoto: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=400&fit=crop',
    isFreelancer: false,
    roles: ['client'],
    emailVerified: true,
    isActive: true,
    companyName: 'Nusantara Restaurant Chain',
    industry: 'Food & Beverage'
  },
  {
    uid: 'client_004',
    email: 'admin@educationplatform.com',
    username: 'edu_platform',
    displayName: 'Education Platform',
    phoneNumber: '+6281234567896',
    location: 'yogyakarta',
    bio: 'Platform edukasi online yang mengembangkan sistem pembelajaran digital.',
    profilePhoto: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=400&fit=crop',
    isFreelancer: false,
    roles: ['client'],
    emailVerified: true,
    isActive: true,
    companyName: 'EduTech Indonesia',
    industry: 'Education'
  },
  {
    uid: 'client_005',
    email: 'contact@healthcareapp.com',
    username: 'healthcare_app',
    displayName: 'Healthcare App',
    phoneNumber: '+6281234567897',
    location: 'surabaya',
    bio: 'Startup healthcare yang mengembangkan aplikasi telemedicine untuk Indonesia.',
    profilePhoto: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=400&fit=crop',
    isFreelancer: false,
    roles: ['client'],
    emailVerified: true,
    isActive: true,
    companyName: 'HealthTech Solutions',
    industry: 'Healthcare'
  }
];

// Sample gigs data - expanded to 20 gigs across different categories
const gigs = [
  // 1. UI/UX Design
  {
    id: 'gig_001',
    freelancerId: 'freelancer_001',
    title: 'Desain UI/UX untuk Mobile App Modern dan User-Friendly',
    description: 'Saya akan membuat desain UI/UX yang stunning dan user-friendly untuk aplikasi mobile Anda. Dengan pengalaman 5+ tahun di bidang design, saya telah membantu 200+ client menciptakan aplikasi yang tidak hanya cantik tapi juga mudah digunakan.',
    category: 'Design & Creative',
    subcategory: 'UI/UX Design',
    tags: ['ui', 'ux', 'mobile app', 'figma', 'prototype'],
    images: [
      'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=800&h=600&fit=crop'
    ],
    packages: {
      basic: { name: 'UI Design Only', description: 'Desain interface untuk 5 screens utama', price: 750000, deliveryTime: 5, revisions: 2, features: ['5 screens UI design', 'Basic style guide', 'Source file (Figma)', 'PNG exports'] },
      standard: { name: 'UI/UX Complete', description: 'Paket lengkap UI/UX untuk aplikasi Anda', price: 1500000, deliveryTime: 10, revisions: 3, features: ['10 screens UI design', 'UX research & wireframe', 'Interactive prototype', 'Complete style guide'] },
      premium: { name: 'Full App Design', description: 'Desain lengkap dengan semua features', price: 2500000, deliveryTime: 14, revisions: 5, features: ['Unlimited screens', 'Complete UX research', 'Advanced prototype', 'Design system'] }
    },
    isActive: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    rating: 4.9,
    totalOrders: 89,
    inQueue: 3
  },
  // 2. Web Development
  {
    id: 'gig_002',
    freelancerId: 'freelancer_002',
    title: 'Pengembangan Website Full-Stack dengan React & Node.js',
    description: 'Saya akan membangun website full-stack yang powerful dan scalable menggunakan teknologi terdepan. Dengan pengalaman sebagai full-stack developer, saya siap mewujudkan ide digital Anda menjadi kenyataan.',
    category: 'Programming & Tech',
    subcategory: 'Web Development',
    tags: ['react', 'nodejs', 'fullstack', 'mongodb', 'api'],
    images: [
      'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=600&fit=crop'
    ],
    packages: {
      basic: { name: 'Landing Page', description: 'Website landing page responsive', price: 1000000, deliveryTime: 7, revisions: 2, features: ['Responsive landing page', 'Contact form', 'Basic SEO', 'Mobile optimized'] },
      standard: { name: 'Business Website', description: 'Website lengkap untuk bisnis', price: 2500000, deliveryTime: 14, revisions: 3, features: ['Multi-page website', 'Admin panel', 'Database integration', 'SEO optimized'] },
      premium: { name: 'Full Web App', description: 'Aplikasi web full-featured', price: 5000000, deliveryTime: 21, revisions: 5, features: ['Complete web application', 'User authentication', 'Admin dashboard', 'API development'] }
    },
    isActive: true,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
    rating: 4.8,
    totalOrders: 67,
    inQueue: 2
  },
  // 3. Content Writing
  {
    id: 'gig_003',
    freelancerId: 'freelancer_003',
    title: 'Content Writing SEO-Friendly untuk Website dan Blog',
    description: 'Saya akan membuat konten berkualitas tinggi yang tidak hanya engaging untuk pembaca tapi juga SEO-friendly untuk meningkatkan ranking di Google.',
    category: 'Writing & Translation',
    subcategory: 'Content Writing',
    tags: ['seo', 'content writing', 'blog', 'copywriting', 'article'],
    images: [
      'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&h=600&fit=crop'
    ],
    packages: {
      basic: { name: 'Blog Article', description: '1 artikel blog SEO-optimized', price: 200000, deliveryTime: 3, revisions: 2, features: ['1 artikel (800-1000 kata)', 'SEO keyword research', 'Meta description', 'Plagiarism check'] },
      standard: { name: 'Content Package', description: 'Paket konten untuk website', price: 750000, deliveryTime: 7, revisions: 3, features: ['5 artikel blog (800+ kata)', 'SEO optimization', 'Meta descriptions', 'Content calendar'] },
      premium: { name: 'Complete Content', description: 'Paket lengkap content strategy', price: 1500000, deliveryTime: 14, revisions: 5, features: ['10 artikel blog (1000+ kata)', 'Complete SEO audit', 'Content strategy', 'Performance tracking'] }
    },
    isActive: true,
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-08'),
    rating: 4.7,
    totalOrders: 45,
    inQueue: 1
  },
  // 4. Logo Design
  {
    id: 'gig_004',
    freelancerId: 'freelancer_004',
    title: 'Desain Logo Profesional dan Brand Identity',
    description: 'Saya akan membuat logo yang memorable dan brand identity yang kuat untuk bisnis Anda. Setiap desain dibuat dengan riset mendalam tentang target market dan kompetitor.',
    category: 'Design & Creative',
    subcategory: 'Logo Design',
    tags: ['logo', 'branding', 'identity', 'illustrator', 'vector'],
    images: [
      'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=800&h=600&fit=crop'
    ],
    packages: {
      basic: { name: 'Logo Only', description: 'Desain logo simple dan clean', price: 300000, deliveryTime: 3, revisions: 3, features: ['1 logo concept', 'Vector files (AI, EPS)', 'PNG/JPG exports', 'Basic color variations'] },
      standard: { name: 'Logo + Identity', description: 'Logo dengan brand guidelines', price: 750000, deliveryTime: 5, revisions: 5, features: ['3 logo concepts', 'Brand guidelines', 'Color palette', 'Typography guide', 'Business card design'] },
      premium: { name: 'Complete Branding', description: 'Paket branding lengkap', price: 1500000, deliveryTime: 10, revisions: 7, features: ['5 logo concepts', 'Complete brand identity', 'Stationery design', 'Social media kit', '6 months support'] }
    },
    isActive: true,
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-12'),
    rating: 4.8,
    totalOrders: 34,
    inQueue: 2
  },
  // 5. Mobile App Development
  {
    id: 'gig_005',
    freelancerId: 'freelancer_005',
    title: 'Pengembangan Aplikasi Mobile iOS & Android dengan Flutter',
    description: 'Saya akan mengembangkan aplikasi mobile cross-platform yang berkualitas tinggi menggunakan Flutter. Dari konsep hingga deployment di App Store dan Play Store.',
    category: 'Programming & Tech',
    subcategory: 'Mobile Development',
    tags: ['flutter', 'mobile app', 'ios', 'android', 'cross-platform'],
    images: [
      'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&h=600&fit=crop'
    ],
    packages: {
      basic: { name: 'Simple App', description: 'Aplikasi mobile sederhana', price: 3000000, deliveryTime: 14, revisions: 2, features: ['5-7 screens', 'Basic functionality', 'Local database', 'Source code'] },
      standard: { name: 'Business App', description: 'Aplikasi untuk bisnis', price: 7000000, deliveryTime: 21, revisions: 3, features: ['10-15 screens', 'API integration', 'Push notifications', 'Admin panel', 'App store deployment'] },
      premium: { name: 'Enterprise App', description: 'Aplikasi enterprise level', price: 15000000, deliveryTime: 30, revisions: 5, features: ['Unlimited screens', 'Advanced features', 'Real-time sync', 'Analytics', 'Maintenance 3 months'] }
    },
    isActive: true,
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-05'),
    rating: 4.9,
    totalOrders: 28,
    inQueue: 4
  },
  // 6. Digital Marketing
  {
    id: 'gig_006',
    freelancerId: 'freelancer_006',
    title: 'SEO Optimization & Digital Marketing Strategy',
    description: 'Saya akan meningkatkan ranking website Anda di Google dan mengembangkan strategi digital marketing yang comprehensive untuk meningkatkan traffic dan conversion.',
    category: 'Digital Marketing',
    subcategory: 'SEO',
    tags: ['seo', 'digital marketing', 'google ads', 'analytics', 'strategy'],
    images: [
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop'
    ],
    packages: {
      basic: { name: 'SEO Audit', description: 'Audit dan optimasi dasar', price: 500000, deliveryTime: 5, revisions: 2, features: ['Website SEO audit', 'Keyword research', 'On-page optimization', 'SEO report'] },
      standard: { name: 'SEO + Content', description: 'SEO dengan content marketing', price: 1500000, deliveryTime: 14, revisions: 3, features: ['Complete SEO setup', 'Content strategy', 'Google Analytics setup', 'Monthly reporting'] },
      premium: { name: 'Full Marketing', description: 'Complete digital marketing', price: 3000000, deliveryTime: 30, revisions: 5, features: ['SEO optimization', 'Google Ads campaign', 'Social media strategy', 'Email marketing', 'Ongoing support'] }
    },
    isActive: true,
    createdAt: new Date('2024-01-07'),
    updatedAt: new Date('2024-01-07'),
    rating: 4.7,
    totalOrders: 56,
    inQueue: 3
  },
  // 7. Video Editing
  {
    id: 'gig_007',
    freelancerId: 'freelancer_007',
    title: 'Video Editing Profesional & Motion Graphics',
    description: 'Saya akan mengedit video Anda dengan kualitas profesional dan menambahkan motion graphics yang menarik. Spesialisasi dalam promotional videos dan explainer animations.',
    category: 'Video & Animation',
    subcategory: 'Video Editing',
    tags: ['video editing', 'motion graphics', 'after effects', 'premiere', 'animation'],
    images: [
      'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=800&h=600&fit=crop'
    ],
    packages: {
      basic: { name: 'Basic Editing', description: 'Edit video sederhana', price: 400000, deliveryTime: 3, revisions: 2, features: ['Basic cuts and transitions', 'Color correction', 'Audio sync', 'HD export'] },
      standard: { name: 'Professional Edit', description: 'Edit video profesional', price: 1000000, deliveryTime: 7, revisions: 3, features: ['Advanced editing', 'Motion graphics', 'Sound design', 'Multiple formats'] },
      premium: { name: 'Complete Production', description: 'Produksi video lengkap', price: 2500000, deliveryTime: 14, revisions: 5, features: ['Script writing', 'Advanced animation', 'Professional voice over', 'Multiple versions', 'Commercial rights'] }
    },
    isActive: true,
    createdAt: new Date('2024-01-09'),
    updatedAt: new Date('2024-01-09'),
    rating: 4.8,
    totalOrders: 42,
    inQueue: 2
  },
  // 8. Data Science
  {
    id: 'gig_008',
    freelancerId: 'freelancer_008',
    title: 'Data Analysis & Machine Learning Solutions',
    description: 'Saya akan menganalisis data Anda dan membangun model machine learning untuk memberikan insights yang actionable dan prediksi yang akurat untuk bisnis Anda.',
    category: 'Programming & Tech',
    subcategory: 'Data Science',
    tags: ['python', 'data analysis', 'machine learning', 'visualization', 'ai'],
    images: [
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800&h=600&fit=crop'
    ],
    packages: {
      basic: { name: 'Data Analysis', description: 'Analisis data basic', price: 800000, deliveryTime: 5, revisions: 2, features: ['Data cleaning', 'Descriptive analysis', 'Basic visualization', 'Summary report'] },
      standard: { name: 'Advanced Analytics', description: 'Analisis data mendalam', price: 2000000, deliveryTime: 10, revisions: 3, features: ['Advanced analysis', 'Interactive dashboard', 'Predictive modeling', 'Insights report'] },
      premium: { name: 'ML Solution', description: 'Complete ML solution', price: 5000000, deliveryTime: 21, revisions: 5, features: ['Custom ML model', 'Model deployment', 'API integration', 'Training & documentation', 'Ongoing support'] }
    },
    isActive: true,
    createdAt: new Date('2024-01-06'),
    updatedAt: new Date('2024-01-06'),
    rating: 4.9,
    totalOrders: 19,
    inQueue: 3
  },
  // 9. Voice Over
  {
    id: 'gig_009',
    freelancerId: 'freelancer_009',
    title: 'Voice Over Profesional untuk Video & Podcast',
    description: 'Saya akan memberikan voice over berkualitas profesional dengan suara yang clear dan engaging. Cocok untuk commercial, explainer video, audiobook, dan podcast.',
    category: 'Music & Audio',
    subcategory: 'Voice Over',
    tags: ['voice over', 'audio', 'narrator', 'commercial', 'podcast'],
    images: [
      'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop'
    ],
    packages: {
      basic: { name: 'Short Voice Over', description: 'Voice over untuk video pendek', price: 250000, deliveryTime: 2, revisions: 2, features: ['Up to 100 words', 'Professional recording', 'Basic editing', 'WAV/MP3 files'] },
      standard: { name: 'Commercial VO', description: 'Voice over komersial', price: 600000, deliveryTime: 3, revisions: 3, features: ['Up to 300 words', 'Multiple takes', 'Music sync', 'Commercial license'] },
      premium: { name: 'Complete Audio', description: 'Paket audio lengkap', price: 1200000, deliveryTime: 7, revisions: 5, features: ['Unlimited words', 'Script writing help', 'Background music', 'Multiple versions', 'Rush delivery'] }
    },
    isActive: true,
    createdAt: new Date('2024-01-11'),
    updatedAt: new Date('2024-01-11'),
    rating: 4.6,
    totalOrders: 31,
    inQueue: 1
  },
  // 10. Business Consulting
  {
    id: 'gig_010',
    freelancerId: 'freelancer_010',
    title: 'Business Plan & Market Research Services',
    description: 'Saya akan membantu Anda membuat business plan yang comprehensive dan melakukan market research untuk mendukung strategi bisnis Anda.',
    category: 'Business',
    subcategory: 'Business Plans',
    tags: ['business plan', 'market research', 'strategy', 'consulting', 'analysis'],
    images: [
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=600&fit=crop'
    ],
    packages: {
      basic: { name: 'Business Plan', description: 'Business plan basic', price: 1000000, deliveryTime: 7, revisions: 3, features: ['Executive summary', 'Market analysis', 'Financial projections', 'Basic strategy'] },
      standard: { name: 'Complete Plan', description: 'Business plan lengkap', price: 2500000, deliveryTime: 14, revisions: 5, features: ['Comprehensive plan', 'Market research', 'Competitor analysis', 'Go-to-market strategy'] },
      premium: { name: 'Strategy Package', description: 'Complete business strategy', price: 5000000, deliveryTime: 21, revisions: 7, features: ['Full business plan', 'Market validation', 'Investor presentation', 'Implementation roadmap', 'Ongoing consultation'] }
    },
    isActive: true,
    createdAt: new Date('2024-01-04'),
    updatedAt: new Date('2024-01-04'),
    rating: 4.8,
    totalOrders: 47,
    inQueue: 2
  },
  // 11. Graphic Design
  {
    id: 'gig_011',
    freelancerId: 'freelancer_004',
    title: 'Desain Grafis untuk Social Media & Marketing Materials',
    description: 'Saya akan membuat desain grafis yang eye-catching untuk social media, flyer, banner, dan marketing materials lainnya yang akan meningkatkan brand awareness Anda.',
    category: 'Design & Creative',
    subcategory: 'Graphic Design',
    tags: ['graphic design', 'social media', 'marketing', 'flyer', 'banner'],
    images: [
      'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&h=600&fit=crop'
    ],
    packages: {
      basic: { name: 'Social Media Pack', description: '5 desain untuk social media', price: 200000, deliveryTime: 3, revisions: 2, features: ['5 social media posts', 'Instagram & Facebook ready', 'High resolution files', 'Basic revisions'] },
      standard: { name: 'Marketing Kit', description: 'Paket marketing lengkap', price: 500000, deliveryTime: 5, revisions: 3, features: ['10 social media designs', 'Flyer design', 'Banner design', 'Brand consistency'] },
      premium: { name: 'Complete Package', description: 'Paket desain comprehensive', price: 1000000, deliveryTime: 10, revisions: 5, features: ['20+ designs', 'Multiple formats', 'Print-ready files', 'Source files included', 'Templates provided'] }
    },
    isActive: true,
    createdAt: new Date('2024-01-13'),
    updatedAt: new Date('2024-01-13'),
    rating: 4.7,
    totalOrders: 52,
    inQueue: 3
  },
  // 12. E-commerce Development
  {
    id: 'gig_012',
    freelancerId: 'freelancer_002',
    title: 'Pembuatan Toko Online E-commerce dengan Shopify/WordPress',
    description: 'Saya akan membangun toko online yang profesional dan user-friendly menggunakan platform terbaik seperti Shopify atau WooCommerce untuk memaksimalkan penjualan online Anda.',
    category: 'Programming & Tech',
    subcategory: 'E-commerce Development',
    tags: ['ecommerce', 'shopify', 'woocommerce', 'online store', 'payment'],
    images: [
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=600&fit=crop'
    ],
    packages: {
      basic: { name: 'Simple Store', description: 'Toko online sederhana', price: 1500000, deliveryTime: 7, revisions: 2, features: ['Up to 20 products', 'Payment gateway', 'Basic theme', 'Mobile responsive'] },
      standard: { name: 'Professional Store', description: 'Toko online profesional', price: 3500000, deliveryTime: 14, revisions: 3, features: ['Unlimited products', 'Custom design', 'Inventory management', 'SEO optimization'] },
      premium: { name: 'Enterprise Store', description: 'Toko online enterprise', price: 7500000, deliveryTime: 21, revisions: 5, features: ['Advanced features', 'Multi-vendor support', 'Analytics dashboard', 'Marketing tools', 'Training included'] }
    },
    isActive: true,
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-03'),
    rating: 4.8,
    totalOrders: 41,
    inQueue: 4
  },
  // 13. Translation Services
  {
    id: 'gig_013',
    freelancerId: 'freelancer_003',
    title: 'Layanan Terjemahan Bahasa Inggris-Indonesia Profesional',
    description: 'Saya akan memberikan layanan terjemahan berkualitas tinggi dari Bahasa Inggris ke Indonesia atau sebaliknya dengan akurasi dan nuansa bahasa yang tepat.',
    category: 'Writing & Translation',
    subcategory: 'Translation',
    tags: ['translation', 'english', 'indonesian', 'document', 'localization'],
    images: [
      'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=600&fit=crop'
    ],
    packages: {
      basic: { name: 'Document Translation', description: 'Terjemahan dokumen standar', price: 150000, deliveryTime: 2, revisions: 2, features: ['Up to 1000 words', 'Manual translation', 'Proofreading', 'Fast delivery'] },
      standard: { name: 'Professional Translation', description: 'Terjemahan profesional', price: 400000, deliveryTime: 5, revisions: 3, features: ['Up to 3000 words', 'Native speaker check', 'Localization', 'Formatted delivery'] },
      premium: { name: 'Certified Translation', description: 'Terjemahan tersertifikasi', price: 800000, deliveryTime: 7, revisions: 5, features: ['Unlimited words', 'Certified translator', 'Official documents', 'Notarized copy', 'Rush service'] }
    },
    isActive: true,
    createdAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-14'),
    rating: 4.6,
    totalOrders: 38,
    inQueue: 2
  },
  // 14. Social Media Management
  {
    id: 'gig_014',
    freelancerId: 'freelancer_006',
    title: 'Social Media Management & Content Creation',
    description: 'Saya akan mengelola akun social media Anda dan membuat konten yang engaging untuk meningkatkan followers, engagement, dan brand awareness.',
    category: 'Digital Marketing',
    subcategory: 'Social Media Marketing',
    tags: ['social media', 'content creation', 'instagram', 'facebook', 'engagement'],
    images: [
      'https://images.unsplash.com/photo-1611926653458-09294b3142bf?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&h=600&fit=crop'
    ],
    packages: {
      basic: { name: 'Basic Management', description: 'Pengelolaan basic 1 platform', price: 800000, deliveryTime: 30, revisions: 2, features: ['1 platform (IG/FB)', '15 posts per month', 'Basic engagement', 'Monthly report'] },
      standard: { name: 'Multi-Platform', description: 'Pengelolaan multi platform', price: 2000000, deliveryTime: 30, revisions: 3, features: ['2 platforms', '30 posts per month', 'Stories management', 'Hashtag strategy'] },
      premium: { name: 'Complete Package', description: 'Paket social media lengkap', price: 4000000, deliveryTime: 30, revisions: 5, features: ['All major platforms', 'Daily posting', 'Content creation', 'Ad campaign management', 'Analytics report'] }
    },
    isActive: true,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
    rating: 4.7,
    totalOrders: 63,
    inQueue: 5
  },
  // 15. WordPress Development
  {
    id: 'gig_015',
    freelancerId: 'freelancer_002',
    title: 'Pembuatan Website WordPress Custom & Maintenance',
    description: 'Saya akan membuat website WordPress yang custom, responsive, dan SEO-friendly sesuai kebutuhan bisnis Anda, plus maintenance berkala.',
    category: 'Programming & Tech',
    subcategory: 'WordPress',
    tags: ['wordpress', 'custom theme', 'responsive', 'seo', 'maintenance'],
    images: [
      'https://images.unsplash.com/photo-1547658719-da2b51169166?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=800&h=600&fit=crop'
    ],
    packages: {
      basic: { name: 'Basic WordPress', description: 'Website WordPress basic', price: 1200000, deliveryTime: 7, revisions: 2, features: ['Custom theme setup', 'Responsive design', 'Basic SEO', 'Contact forms'] },
      standard: { name: 'Business WordPress', description: 'Website WordPress untuk bisnis', price: 2800000, deliveryTime: 14, revisions: 3, features: ['Custom theme development', 'E-commerce ready', 'Advanced SEO', 'Security setup'] },
      premium: { name: 'Enterprise WordPress', description: 'WordPress enterprise level', price: 5500000, deliveryTime: 21, revisions: 5, features: ['Fully custom development', 'Performance optimization', 'Security hardening', 'Maintenance 6 months', 'Training included'] }
    },
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    rating: 4.8,
    totalOrders: 54,
    inQueue: 3
  },
  // 16. Animation & Motion Graphics
  {
    id: 'gig_016',
    freelancerId: 'freelancer_007',
    title: 'Animasi 2D & Motion Graphics untuk Explainer Video',
    description: 'Saya akan membuat animasi 2D yang menarik dan motion graphics untuk explainer video, commercial, atau presentasi yang akan menjelaskan produk/layanan Anda dengan cara yang engaging.',
    category: 'Video & Animation',
    subcategory: '2D Animation',
    tags: ['2d animation', 'motion graphics', 'explainer video', 'character animation', 'commercial'],
    images: [
      'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&h=600&fit=crop'
    ],
    packages: {
      basic: { name: 'Simple Animation', description: 'Animasi sederhana 30 detik', price: 1000000, deliveryTime: 7, revisions: 2, features: ['30 second animation', 'Basic characters', 'Simple motion', 'HD export'] },
      standard: { name: 'Explainer Video', description: 'Video explainer 60 detik', price: 2500000, deliveryTime: 14, revisions: 3, features: ['60 second explainer', 'Custom characters', 'Voice over sync', 'Background music'] },
      premium: { name: 'Commercial Animation', description: 'Animasi komersial premium', price: 5000000, deliveryTime: 21, revisions: 5, features: ['90+ second animation', 'Advanced animation', 'Professional voice over', 'Multiple versions', 'Commercial license'] }
    },
    isActive: true,
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-16'),
    rating: 4.9,
    totalOrders: 29,
    inQueue: 4
  },
  // 17. Database Design
  {
    id: 'gig_017',
    freelancerId: 'freelancer_008',
    title: 'Database Design & Optimization untuk Aplikasi',
    description: 'Saya akan merancang dan mengoptimasi database yang efisien dan scalable untuk aplikasi Anda, termasuk MySQL, PostgreSQL, atau MongoDB.',
    category: 'Programming & Tech',
    subcategory: 'Database',
    tags: ['database', 'mysql', 'postgresql', 'mongodb', 'optimization'],
    images: [
      'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=600&fit=crop'
    ],
    packages: {
      basic: { name: 'Database Design', description: 'Desain database basic', price: 800000, deliveryTime: 5, revisions: 2, features: ['ERD design', 'Table structure', 'Basic optimization', 'Documentation'] },
      standard: { name: 'Complete Database', description: 'Database lengkap dengan optimasi', price: 2000000, deliveryTime: 10, revisions: 3, features: ['Advanced design', 'Performance tuning', 'Backup strategy', 'Security setup'] },
      premium: { name: 'Enterprise Database', description: 'Database enterprise level', price: 4500000, deliveryTime: 21, revisions: 5, features: ['Scalable architecture', 'High availability', 'Disaster recovery', 'Migration services', 'Training included'] }
    },
    isActive: true,
    createdAt: new Date('2024-01-17'),
    updatedAt: new Date('2024-01-17'),
    rating: 4.8,
    totalOrders: 23,
    inQueue: 2
  },
  // 18. Podcast Production
  {
    id: 'gig_018',
    freelancerId: 'freelancer_009',
    title: 'Podcast Production & Audio Post-Processing',
    description: 'Saya akan memproduksi podcast Anda dari recording hingga final edit, termasuk noise reduction, mixing, dan mastering untuk kualitas audio yang profesional.',
    category: 'Music & Audio',
    subcategory: 'Podcast Production',
    tags: ['podcast', 'audio editing', 'mixing', 'mastering', 'production'],
    images: [
      'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop'
    ],
    packages: {
      basic: { name: 'Basic Editing', description: 'Edit podcast basic', price: 300000, deliveryTime: 3, revisions: 2, features: ['Noise reduction', 'Basic editing', 'Intro/outro', 'MP3 export'] },
      standard: { name: 'Professional Edit', description: 'Edit podcast profesional', price: 750000, deliveryTime: 5, revisions: 3, features: ['Advanced editing', 'Sound enhancement', 'Background music', 'Multiple formats'] },
      premium: { name: 'Full Production', description: 'Produksi podcast lengkap', price: 1500000, deliveryTime: 10, revisions: 5, features: ['Complete production', 'Script assistance', 'Professional mixing', 'Distribution help', 'Branding audio'] }
    },
    isActive: true,
    createdAt: new Date('2024-01-18'),
    updatedAt: new Date('2024-01-18'),
    rating: 4.7,
    totalOrders: 35,
    inQueue: 2
  },
  // 19. Virtual Assistant
  {
    id: 'gig_019',
    freelancerId: 'freelancer_010',
    title: 'Virtual Assistant & Administrative Support',
    description: 'Saya akan membantu Anda dengan tugas-tugas administrative, data entry, email management, appointment scheduling, dan berbagai task virtual assistant lainnya.',
    category: 'Business',
    subcategory: 'Virtual Assistant',
    tags: ['virtual assistant', 'admin support', 'data entry', 'email management', 'scheduling'],
    images: [
      'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&h=600&fit=crop'
    ],
    packages: {
      basic: { name: 'Basic Support', description: 'Dukungan administrative basic', price: 500000, deliveryTime: 7, revisions: 2, features: ['10 hours support', 'Email management', 'Data entry', 'Basic research'] },
      standard: { name: 'Business Support', description: 'Dukungan bisnis comprehensive', price: 1200000, deliveryTime: 14, revisions: 3, features: ['20 hours support', 'Calendar management', 'Customer service', 'Report preparation'] },
      premium: { name: 'Executive Support', description: 'Dukungan executive level', price: 2500000, deliveryTime: 30, revisions: 5, features: ['40 hours support', 'Project management', 'Strategic assistance', 'Priority support', 'Dedicated communication'] }
    },
    isActive: true,
    createdAt: new Date('2024-01-19'),
    updatedAt: new Date('2024-01-19'),
    rating: 4.6,
    totalOrders: 48,
    inQueue: 3
  },
  // 20. API Development
  {
    id: 'gig_020',
    freelancerId: 'freelancer_005',
    title: 'REST API Development & Integration Services',
    description: 'Saya akan mengembangkan REST API yang robust dan scalable untuk aplikasi Anda, termasuk dokumentasi lengkap dan testing yang comprehensive.',
    category: 'Programming & Tech',
    subcategory: 'API Development',
    tags: ['api', 'rest api', 'backend', 'integration', 'documentation'],
    images: [
      'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=800&h=600&fit=crop'
    ],
    packages: {
      basic: { name: 'Simple API', description: 'API sederhana dengan basic endpoints', price: 1500000, deliveryTime: 7, revisions: 2, features: ['5 endpoints', 'Basic CRUD operations', 'JSON responses', 'Basic documentation'] },
      standard: { name: 'Business API', description: 'API untuk aplikasi bisnis', price: 3500000, deliveryTime: 14, revisions: 3, features: ['15 endpoints', 'Authentication system', 'Data validation', 'Comprehensive docs'] },
      premium: { name: 'Enterprise API', description: 'API enterprise dengan fitur lengkap', price: 7000000, deliveryTime: 21, revisions: 5, features: ['Unlimited endpoints', 'Advanced security', 'Rate limiting', 'Monitoring setup', 'Testing suite'] }
    },
    isActive: true,
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
    rating: 4.9,
    totalOrders: 16,
    inQueue: 4
  },
  // NEW GIGS (21-100)
  // 21. 3D Modeling & Animation
  {
    id: 'gig_021',
    freelancerId: 'freelancer_011',
    title: '3D Modeling & Architectural Visualization',
    description: 'Saya akan membuat 3D model dan visualization yang realistis untuk arsitektur, produk, atau keperluan presentasi. Menggunakan Blender, 3ds Max, dan Cinema 4D dengan kualitas rendering tinggi.',
    category: 'Design & Creative',
    subcategory: '3D Design',
    tags: ['3d modeling', 'blender', '3ds max', 'architecture', 'visualization'],
    images: [
      'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1586717799252-bd134ad00e26?w=800&h=600&fit=crop'
    ],
    packages: {
      basic: { name: 'Simple 3D Model', description: 'Model 3D sederhana untuk 1 objek', price: 800000, deliveryTime: 5, revisions: 2, features: ['1 3D model', 'Basic texturing', '2 render angles', 'OBJ/FBX files'] },
      standard: { name: 'Detailed Model', description: 'Model 3D detail dengan materials', price: 2000000, deliveryTime: 10, revisions: 3, features: ['Detailed 3D model', 'Professional texturing', '5 render angles', 'Animation ready'] },
      premium: { name: 'Architectural Viz', description: 'Visualisasi arsitektur lengkap', price: 4500000, deliveryTime: 14, revisions: 5, features: ['Complete scene', 'Photorealistic render', 'Multiple angles', 'Video walkthrough', 'Source files'] }
    },
    isActive: true,
    createdAt: new Date('2024-01-21'),
    updatedAt: new Date('2024-01-21'),
    rating: 4.7,
    totalOrders: 32,
    inQueue: 2
  },
  // 22. Photography & Photo Editing
  {
    id: 'gig_022',
    freelancerId: 'freelancer_012',
    title: 'Professional Photography & Photo Editing Services',
    description: 'Saya akan memberikan layanan fotografi profesional dan photo editing berkualitas tinggi. Spesialisasi dalam portrait, product, dan event photography dengan post-processing yang memukau.',
    category: 'Design & Creative',
    subcategory: 'Photography',
    tags: ['photography', 'photo editing', 'portrait', 'product photography', 'lightroom'],
    images: [
      'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1493612276216-ee3925520721?w=800&h=600&fit=crop'
    ],
    packages: {
      basic: { name: 'Photo Editing', description: 'Edit 10 foto professional', price: 300000, deliveryTime: 3, revisions: 2, features: ['10 photos edited', 'Basic retouching', 'Color correction', 'High-res delivery'] },
      standard: { name: 'Photo Session', description: 'Sesi foto + editing', price: 1500000, deliveryTime: 7, revisions: 3, features: ['2 hour photoshoot', '30 edited photos', 'Professional lighting', 'Multiple outfits/setups'] },
      premium: { name: 'Complete Package', description: 'Paket lengkap foto + video', price: 3500000, deliveryTime: 14, revisions: 5, features: ['4 hour session', '100+ edited photos', 'Behind scenes video', 'Multiple locations', 'Rush delivery'] }
    },
    isActive: true,
    createdAt: new Date('2024-01-22'),
    updatedAt: new Date('2024-01-22'),
    rating: 4.9,
    totalOrders: 67,
    inQueue: 3
  },
  // 23. Blockchain & Web3 Development
  {
    id: 'gig_023',
    freelancerId: 'freelancer_013',
    title: 'Smart Contract & DeFi Application Development',
    description: 'Saya akan mengembangkan smart contracts yang secure dan DeFi applications menggunakan Solidity. Berpengalaman dengan Ethereum, Polygon, dan protokol DeFi terpopuler.',
    category: 'Programming & Tech',
    subcategory: 'Blockchain',
    tags: ['blockchain', 'smart contracts', 'solidity', 'defi', 'web3'],
    images: [
      'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=800&h=600&fit=crop'
    ],
    packages: {
      basic: { name: 'Simple Smart Contract', description: 'Smart contract basic', price: 3000000, deliveryTime: 7, revisions: 2, features: ['Basic smart contract', 'Testnet deployment', 'Basic testing', 'Documentation'] },
      standard: { name: 'DeFi Protocol', description: 'DeFi application development', price: 8000000, deliveryTime: 21, revisions: 3, features: ['Complex smart contracts', 'Frontend integration', 'Security audit', 'Mainnet deployment'] },
      premium: { name: 'Full DeFi Platform', description: 'Platform DeFi lengkap', price: 25000000, deliveryTime: 45, revisions: 5, features: ['Complete DeFi platform', 'Multi-chain support', 'Advanced features', 'Governance token', 'Full documentation'] }
    },
    isActive: true,
    createdAt: new Date('2024-01-23'),
    updatedAt: new Date('2024-01-23'),
    rating: 4.8,
    totalOrders: 23,
    inQueue: 4
  },
  // 24. Professional Translation Services
  {
    id: 'gig_024',
    freelancerId: 'freelancer_014',
    title: 'Multilingual Translation: English, Japanese, Korean',
    description: 'Saya akan memberikan layanan terjemahan profesional dengan akurasi tinggi untuk bahasa Inggris, Jepang, dan Korea. Spesialisasi dalam technical, legal, dan literary translation.',
    category: 'Writing & Translation',
    subcategory: 'Translation',
    tags: ['translation', 'multilingual', 'japanese', 'korean', 'technical translation'],
    images: [
      'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=600&fit=crop'
    ],
    packages: {
      basic: { name: 'Document Translation', description: 'Terjemahan dokumen standar', price: 200000, deliveryTime: 3, revisions: 2, features: ['Up to 1000 words', 'Native speaker review', 'Fast delivery', 'Quality guarantee'] },
      standard: { name: 'Technical Translation', description: 'Terjemahan technical/legal', price: 500000, deliveryTime: 7, revisions: 3, features: ['Up to 3000 words', 'Technical expertise', 'Industry terminology', 'Certified translation'] },
      premium: { name: 'Localization Package', description: 'Lokalisasi lengkap', price: 1200000, deliveryTime: 14, revisions: 5, features: ['Unlimited words', 'Cultural adaptation', 'Multiple revisions', 'Style guide creation', 'Ongoing support'] }
    },
    isActive: true,
    createdAt: new Date('2024-01-24'),
    updatedAt: new Date('2024-01-24'),
    rating: 4.8,
    totalOrders: 89,
    inQueue: 2
  },
  // 25. Game Development
  {
    id: 'gig_025',
    freelancerId: 'freelancer_015',
    title: 'Mobile & PC Game Development with Unity',
    description: 'Saya akan mengembangkan game mobile dan PC yang engaging menggunakan Unity engine. Dari konsep hingga deployment di app stores dan Steam platform.',
    category: 'Programming & Tech',
    subcategory: 'Game Development',
    tags: ['game development', 'unity', 'mobile games', 'pc games', 'game design'],
    images: [
      'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=600&fit=crop'
    ],
    packages: {
      basic: { name: 'Simple Mobile Game', description: 'Game mobile sederhana', price: 5000000, deliveryTime: 21, revisions: 2, features: ['Simple gameplay', '5 levels', 'Basic UI', 'Android build'] },
      standard: { name: 'Complete Mobile Game', description: 'Game mobile lengkap', price: 12000000, deliveryTime: 45, revisions: 3, features: ['Advanced gameplay', '20+ levels', 'Monetization', 'iOS + Android', 'App store upload'] },
      premium: { name: 'PC Game Development', description: 'Game PC professional', price: 30000000, deliveryTime: 90, revisions: 5, features: ['Complex gameplay', 'Multiple game modes', 'Steam integration', 'Multiplayer support', 'Complete polish'] }
    },
    isActive: true,
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-01-25'),
    rating: 4.9,
    totalOrders: 41,
    inQueue: 6
  },
  // 26. Fashion Design & Illustration
  {
    id: 'gig_026',
    freelancerId: 'freelancer_016',
    title: 'Fashion Design & Pattern Creation Services',
    description: 'Saya akan membuat desain fashion yang unik dan pattern development untuk koleksi Anda. Spesialisasi dalam sustainable fashion dan motif tradisional Indonesia.',
    category: 'Design & Creative',
    subcategory: 'Fashion Design',
    tags: ['fashion design', 'pattern design', 'fashion illustration', 'sustainable fashion', 'traditional motifs'],
    images: [
      'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&h=600&fit=crop'
    ],
    packages: {
      basic: { name: 'Fashion Sketch', description: '5 sketsa desain fashion', price: 600000, deliveryTime: 5, revisions: 3, features: ['5 fashion sketches', 'Basic coloring', 'Technical details', 'Digital files'] },
      standard: { name: 'Pattern Development', description: 'Pembuatan pattern lengkap', price: 1500000, deliveryTime: 10, revisions: 3, features: ['Complete patterns', 'Size grading', 'Technical drawings', 'Production guide'] },
      premium: { name: 'Collection Design', description: 'Desain koleksi lengkap', price: 4000000, deliveryTime: 21, revisions: 5, features: ['20+ designs', 'Complete tech packs', 'Color variations', 'Marketing materials', 'Brand consultation'] }
    },
    isActive: true,
    createdAt: new Date('2024-01-26'),
    updatedAt: new Date('2024-01-26'),
    rating: 4.6,
    totalOrders: 38,
    inQueue: 2
  },
  // 27. Cybersecurity Consulting
  {
    id: 'gig_027',
    freelancerId: 'freelancer_017',
    title: 'Cybersecurity Audit & Penetration Testing',
    description: 'Saya akan melakukan security audit comprehensive dan penetration testing untuk mengidentifikasi vulnerability sistem Anda. Certified Ethical Hacker dengan pengalaman enterprise.',
    category: 'Programming & Tech',
    subcategory: 'Cybersecurity',
    tags: ['cybersecurity', 'penetration testing', 'security audit', 'vulnerability assessment', 'ethical hacking'],
    images: [
      'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&h=600&fit=crop'
    ],
    packages: {
      basic: { name: 'Basic Security Audit', description: 'Audit keamanan dasar', price: 2500000, deliveryTime: 7, revisions: 2, features: ['Network scan', 'Vulnerability report', 'Basic recommendations', 'Security checklist'] },
      standard: { name: 'Penetration Testing', description: 'Pen testing comprehensive', price: 6000000, deliveryTime: 14, revisions: 3, features: ['Full penetration test', 'Detailed report', 'Risk assessment', 'Remediation plan'] },
      premium: { name: 'Complete Security Assessment', description: 'Assessment keamanan lengkap', price: 15000000, deliveryTime: 30, revisions: 5, features: ['Comprehensive security audit', 'Social engineering test', 'Compliance check', 'Security training', 'Ongoing monitoring'] }
    },
    isActive: true,
    createdAt: new Date('2024-01-27'),
    updatedAt: new Date('2024-01-27'),
    rating: 4.9,
    totalOrders: 27,
    inQueue: 3
  },
  // 28. Interior Design
  {
    id: 'gig_028',
    freelancerId: 'freelancer_018',
    title: 'Interior Design & 3D Visualization Services',
    description: 'Saya akan mendesain interior ruangan yang fungsional dan aesthetic sesuai kebutuhan Anda. Menggunakan SketchUp dan 3D visualization untuk presentasi yang realistis.',
    category: 'Design & Creative',
    subcategory: 'Interior Design',
    tags: ['interior design', 'sketchup', '3d visualization', 'space planning', 'residential design'],
    images: [
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=800&h=600&fit=crop'
    ],
    packages: {
      basic: { name: 'Room Design', description: 'Desain 1 ruangan', price: 1500000, deliveryTime: 7, revisions: 3, features: ['Single room design', '3D visualization', 'Furniture layout', 'Material suggestions'] },
      standard: { name: 'Complete House', description: 'Desain rumah lengkap', price: 4500000, deliveryTime: 14, revisions: 3, features: ['Multiple rooms', 'Detailed 3D renders', 'Material specifications', 'Lighting design'] },
      premium: { name: 'Commercial Space', description: 'Desain ruang komersial', price: 8000000, deliveryTime: 21, revisions: 5, features: ['Commercial space design', 'Brand integration', 'Traffic flow analysis', 'Construction drawings', 'Project management'] }
    },
    isActive: true,
    createdAt: new Date('2024-01-28'),
    updatedAt: new Date('2024-01-28'),
    rating: 4.7,
    totalOrders: 45,
    inQueue: 3
  },
  // 29. Music Production & Composing
  {
    id: 'gig_029',
    freelancerId: 'freelancer_019',
    title: 'Music Production & Film Scoring Services',
    description: 'Saya akan memproduksi musik original dan film scoring yang sesuai dengan mood dan cerita Anda. Spesialisasi dalam electronic music, cinematic, dan jingle commercial.',
    category: 'Music & Audio',
    subcategory: 'Music Production',
    tags: ['music production', 'film scoring', 'composing', 'electronic music', 'jingle'],
    images: [
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=800&h=600&fit=crop'
    ],
    packages: {
      basic: { name: 'Jingle Creation', description: 'Jingle 30 detik', price: 800000, deliveryTime: 5, revisions: 3, features: ['30 second jingle', 'Commercial rights', 'Multiple formats', 'Basic mixing'] },
      standard: { name: 'Background Music', description: 'Musik latar 3-5 menit', price: 2000000, deliveryTime: 10, revisions: 3, features: ['3-5 minute track', 'Professional mixing', 'Stem files', 'Commercial license'] },
      premium: { name: 'Film Scoring', description: 'Scoring film lengkap', price: 6000000, deliveryTime: 21, revisions: 5, features: ['Complete film score', 'Orchestral arrangement', 'Professional mastering', 'Sync licensing', 'Multiple versions'] }
    },
    isActive: true,
    createdAt: new Date('2024-01-29'),
    updatedAt: new Date('2024-01-29'),
    rating: 4.8,
    totalOrders: 36,
    inQueue: 2
  },
  // 30. Legal Consulting
  {
    id: 'gig_030',
    freelancerId: 'freelancer_020',
    title: 'Business Legal Consulting & Contract Drafting',
    description: 'Saya akan memberikan konsultasi hukum bisnis dan menyusun kontrak yang protect kepentingan Anda. Spesialisasi dalam business law, IP protection, dan corporate compliance.',
    category: 'Business',
    subcategory: 'Legal',
    tags: ['legal consulting', 'contract drafting', 'business law', 'intellectual property', 'compliance'],
    images: [
      'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=600&fit=crop'
    ],
    packages: {
      basic: { name: 'Legal Review', description: 'Review dokumen legal', price: 1000000, deliveryTime: 3, revisions: 2, features: ['Document review', 'Basic recommendations', 'Risk assessment', 'Legal opinion'] },
      standard: { name: 'Contract Drafting', description: 'Penyusunan kontrak', price: 2500000, deliveryTime: 7, revisions: 3, features: ['Custom contract', 'Legal compliance', 'Risk mitigation', 'Negotiation support'] },
      premium: { name: 'Legal Package', description: 'Paket legal comprehensive', price: 6000000, deliveryTime: 14, revisions: 5, features: ['Multiple contracts', 'Company setup', 'IP registration', 'Ongoing consultation', 'Legal training'] }
    },
    isActive: true,
    createdAt: new Date('2024-01-30'),
    updatedAt: new Date('2024-01-30'),
    rating: 4.9,
    totalOrders: 52,
    inQueue: 4
  },
  // ... continuing with more gigs to reach 100 total
  // 31. Architecture & Structural Design
  {
    id: 'gig_031',
    freelancerId: 'freelancer_021',
    title: 'Sustainable Architecture & Green Building Design',
    description: 'Saya akan mendesain bangunan yang sustainable dan energy-efficient menggunakan prinsip green architecture. Menggunakan Revit, ArchiCAD, dan teknik BIM modern.',
    category: 'Design & Creative',
    subcategory: 'Architecture',
    tags: ['architecture', 'sustainable design', 'revit', 'bim', 'green building'],
    images: [
      'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&h=600&fit=crop'
    ],
    packages: {
      basic: { name: 'Concept Design', description: 'Desain konsep arsitektur', price: 3000000, deliveryTime: 10, revisions: 3, features: ['Concept drawings', 'Site analysis', 'Basic 3D model', 'Design rationale'] },
      standard: { name: 'Detailed Design', description: 'Desain detail lengkap', price: 8000000, deliveryTime: 21, revisions: 3, features: ['Working drawings', 'Construction details', 'BIM model', 'Technical specifications'] },
      premium: { name: 'Complete Package', description: 'Paket arsitektur lengkap', price: 20000000, deliveryTime: 45, revisions: 5, features: ['Complete construction docs', 'Permit assistance', 'Construction supervision', 'Green certification support', 'Project management'] }
    },
    isActive: true,
    createdAt: new Date('2024-01-31'),
    updatedAt: new Date('2024-01-31'),
    rating: 4.8,
    totalOrders: 29,
    inQueue: 3
  },
  // 32. Nutrition & Health Coaching
  {
    id: 'gig_032',
    freelancerId: 'freelancer_022',
    title: 'Personalized Nutrition Planning & Health Coaching',
    description: 'Saya akan membuat meal plan personal dan program health coaching yang sesuai dengan goals dan kondisi kesehatan Anda. Registered Dietitian dengan pendekatan holistic.',
    category: 'Business',
    subcategory: 'Health Consulting',
    tags: ['nutrition planning', 'meal planning', 'health coaching', 'diet consultation', 'weight management'],
    images: [
      'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop'
    ],
    packages: {
      basic: { name: 'Meal Plan', description: 'Meal plan 1 minggu', price: 400000, deliveryTime: 3, revisions: 2, features: ['7-day meal plan', 'Nutritional analysis', 'Shopping list', 'Basic guidelines'] },
      standard: { name: 'Monthly Program', description: 'Program 1 bulan lengkap', price: 1200000, deliveryTime: 7, revisions: 3, features: ['4-week meal plan', 'Weekly consultations', 'Progress tracking', 'Recipe variations'] },
      premium: { name: 'Complete Coaching', description: '3 bulan health coaching', price: 3000000, deliveryTime: 90, revisions: 5, features: ['3-month program', 'Bi-weekly consultations', 'Lifestyle modifications', 'Exercise recommendations', 'Ongoing support'] }
    },
    isActive: true,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01'),
    rating: 4.9,
    totalOrders: 73,
    inQueue: 2
  },
  // 33. DevOps & Cloud Infrastructure
  {
    id: 'gig_033',
    freelancerId: 'freelancer_023',
    title: 'DevOps Implementation & Cloud Infrastructure Setup',
    description: 'Saya akan setup infrastructure cloud yang scalable dan implement DevOps practices untuk meningkatkan deployment efficiency. Expert dalam AWS, Docker, Kubernetes.',
    category: 'Programming & Tech',
    subcategory: 'DevOps',
    tags: ['devops', 'aws', 'docker', 'kubernetes', 'ci/cd'],
    images: [
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1518432031352-d6fc5c10da5a?w=800&h=600&fit=crop'
    ],
    packages: {
      basic: { name: 'Basic Setup', description: 'Setup cloud infrastructure basic', price: 3000000, deliveryTime: 7, revisions: 2, features: ['Basic cloud setup', 'Container deployment', 'Basic monitoring', 'Documentation'] },
      standard: { name: 'Complete DevOps', description: 'Implementation DevOps lengkap', price: 8000000, deliveryTime: 14, revisions: 3, features: ['CI/CD pipeline', 'Auto scaling', 'Advanced monitoring', 'Security setup'] },
      premium: { name: 'Enterprise Solution', description: 'Solusi enterprise DevOps', price: 20000000, deliveryTime: 30, revisions: 5, features: ['Multi-environment setup', 'Disaster recovery', 'Cost optimization', 'Team training', 'Ongoing support'] }
    },
    isActive: true,
    createdAt: new Date('2024-02-02'),
    updatedAt: new Date('2024-02-02'),
    rating: 4.8,
    totalOrders: 34,
    inQueue: 4
  },
  // 34. HR Consulting & Recruitment
  {
    id: 'gig_034',
    freelancerId: 'freelancer_024',
    title: 'HR Strategy & Recruitment Services',
    description: 'Saya akan membantu develop HR strategy dan proses recruitment yang effective untuk perusahaan Anda. SHRM certified dengan pengalaman di berbagai industri.',
    category: 'Business',
    subcategory: 'HR & Training',
    tags: ['hr consulting', 'recruitment', 'employee training', 'hr strategy', 'organizational development'],
    images: [
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&h=600&fit=crop'
    ],
    packages: {
      basic: { name: 'HR Audit', description: 'Audit HR practices', price: 2000000, deliveryTime: 7, revisions: 2, features: ['HR assessment', 'Policy review', 'Recommendations', 'Action plan'] },
      standard: { name: 'Recruitment Process', description: 'Setup proses recruitment', price: 5000000, deliveryTime: 14, revisions: 3, features: ['Recruitment strategy', 'Job descriptions', 'Interview process', 'Candidate sourcing'] },
      premium: { name: 'Complete HR Setup', description: 'Setup HR department lengkap', price: 12000000, deliveryTime: 30, revisions: 5, features: ['Complete HR framework', 'Training programs', 'Performance management', 'Ongoing consultation', 'Team development'] }
    },
    isActive: true,
    createdAt: new Date('2024-02-03'),
    updatedAt: new Date('2024-02-03'),
    rating: 4.7,
    totalOrders: 46,
    inQueue: 3
  },
  // 35. Fitness & Personal Training
  {
    id: 'gig_035',
    freelancerId: 'freelancer_025',
    title: 'Personal Training & Fitness Program Design',
    description: 'Saya akan membuat program fitness personal yang sesuai dengan goals dan kondisi fisik Anda. Certified trainer dengan spesialisasi strength training dan weight management.',
    category: 'Business',
    subcategory: 'Fitness Consulting',
    tags: ['personal training', 'fitness coaching', 'strength training', 'weight loss', 'workout plan'],
    images: [
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&h=600&fit=crop'
    ],
    packages: {
      basic: { name: 'Workout Plan', description: 'Program workout 4 minggu', price: 600000, deliveryTime: 3, revisions: 2, features: ['4-week workout plan', 'Exercise instructions', 'Progress tracking', 'Basic nutrition tips'] },
      standard: { name: 'Coaching Program', description: 'Program coaching 8 minggu', price: 1800000, deliveryTime: 56, revisions: 3, features: ['8-week program', 'Weekly check-ins', 'Form corrections', 'Meal suggestions'] },
      premium: { name: 'Complete Transformation', description: 'Program transformasi 12 minggu', price: 4500000, deliveryTime: 84, revisions: 5, features: ['12-week program', 'Personal training sessions', 'Nutrition planning', 'Supplement guidance', 'Lifestyle coaching'] }
    },
    isActive: true,
    createdAt: new Date('2024-02-04'),
    updatedAt: new Date('2024-02-04'),
    rating: 4.8,
    totalOrders: 91,
    inQueue: 5
  },
  // 36. Web Scraping & Data Extraction
  {
    id: 'gig_036',
    freelancerId: 'freelancer_008',
    title: 'Web Scraping & Data Extraction Services',
    description: 'Saya akan mengekstrak data dari website atau API untuk kebutuhan research dan analisis bisnis Anda. Menggunakan Python, Selenium, dan tools scraping terdepan.',
    category: 'Programming & Tech',
    subcategory: 'Data Science',
    tags: ['web scraping', 'data extraction', 'python', 'automation', 'data mining'],
    images: [
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800&h=600&fit=crop'
    ],
    packages: {
      basic: { name: 'Simple Scraping', description: 'Scraping data dari 1 website', price: 500000, deliveryTime: 3, revisions: 2, features: ['Up to 1000 records', 'CSV/Excel output', 'Basic cleaning', 'Single website'] },
      standard: { name: 'Advanced Scraping', description: 'Scraping multi-website', price: 1500000, deliveryTime: 7, revisions: 3, features: ['Up to 10000 records', 'Multiple websites', 'Data cleaning', 'Scheduled scraping'] },
      premium: { name: 'Enterprise Scraping', description: 'Sistem scraping otomatis', price: 4000000, deliveryTime: 14, revisions: 5, features: ['Unlimited records', 'API development', 'Real-time monitoring', 'Database integration', 'Ongoing maintenance'] }
    },
    isActive: true,
    createdAt: new Date('2024-02-05'),
    updatedAt: new Date('2024-02-05'),
    rating: 4.7,
    totalOrders: 43,
    inQueue: 3
  },
  // 37. Product Photography
  {
    id: 'gig_037',
    freelancerId: 'freelancer_012',
    title: 'Professional Product Photography for E-commerce',
    description: 'Saya akan memotret produk Anda dengan kualitas profesional untuk kebutuhan e-commerce dan marketing. Dengan lighting setup dan background yang tepat.',
    category: 'Design & Creative',
    subcategory: 'Photography',
    tags: ['product photography', 'ecommerce', 'professional lighting', 'white background', 'high resolution'],
    images: [
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=600&fit=crop'
    ],
    packages: {
      basic: { name: 'Basic Product Shoot', description: '10 produk dengan 2 angle', price: 800000, deliveryTime: 3, revisions: 2, features: ['10 products', '2 angles each', 'White background', 'Basic retouching'] },
      standard: { name: 'Professional Shoot', description: '20 produk multi-angle', price: 2000000, deliveryTime: 5, revisions: 3, features: ['20 products', '4 angles each', 'Lifestyle shots', 'Advanced retouching'] },
      premium: { name: 'Complete Package', description: 'Unlimited produk + video', price: 5000000, deliveryTime: 10, revisions: 5, features: ['Unlimited products', 'Multiple backgrounds', 'Product videos', '360° photography', 'Same-day delivery'] }
    },
    isActive: true,
    createdAt: new Date('2024-02-06'),
    updatedAt: new Date('2024-02-06'),
    rating: 4.9,
    totalOrders: 78,
    inQueue: 4
  },
  // 38. Financial Consulting
  {
    id: 'gig_038',
    freelancerId: 'freelancer_020',
    title: 'Financial Planning & Investment Consulting',
    description: 'Saya akan membantu Anda merencanakan keuangan dan strategi investasi yang sesuai dengan goals dan risk profile. Certified Financial Planner dengan pengalaman 10+ tahun.',
    category: 'Business',
    subcategory: 'Financial Consulting',
    tags: ['financial planning', 'investment', 'financial advisor', 'retirement planning', 'wealth management'],
    images: [
      'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&h=600&fit=crop'
    ],
    packages: {
      basic: { name: 'Financial Review', description: 'Review kondisi keuangan', price: 1500000, deliveryTime: 5, revisions: 2, features: ['Financial health check', 'Basic recommendations', 'Investment allocation', 'Risk assessment'] },
      standard: { name: 'Complete Planning', description: 'Perencanaan keuangan lengkap', price: 4000000, deliveryTime: 14, revisions: 3, features: ['Comprehensive plan', 'Investment strategy', 'Tax optimization', 'Insurance review'] },
      premium: { name: 'Wealth Management', description: 'Pengelolaan kekayaan profesional', price: 10000000, deliveryTime: 30, revisions: 5, features: ['Portfolio management', 'Ongoing consultation', 'Quarterly reviews', 'Estate planning', 'Priority support'] }
    },
    isActive: true,
    createdAt: new Date('2024-02-07'),
    updatedAt: new Date('2024-02-07'),
    rating: 4.8,
    totalOrders: 34,
    inQueue: 2
  },
  // 39. SEO Content Writing
  {
    id: 'gig_039',
    freelancerId: 'freelancer_003',
    title: 'SEO-Optimized Blog Writing & Content Strategy',
    description: 'Saya akan menulis artikel blog yang SEO-friendly dan mengembangkan content strategy untuk meningkatkan organic traffic website Anda.',
    category: 'Writing & Translation',
    subcategory: 'Content Writing',
    tags: ['seo content', 'blog writing', 'content strategy', 'keyword research', 'organic traffic'],
    images: [
      'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&h=600&fit=crop'
    ],
    packages: {
      basic: { name: 'SEO Article', description: '1 artikel SEO 1500 kata', price: 350000, deliveryTime: 3, revisions: 2, features: ['1500+ words', 'Keyword optimization', 'Meta description', 'Internal linking'] },
      standard: { name: 'Content Package', description: '5 artikel + strategy', price: 1500000, deliveryTime: 10, revisions: 3, features: ['5 SEO articles', 'Content calendar', 'Competitor analysis', 'Performance tracking'] },
      premium: { name: 'Complete Content Marketing', description: 'Strategy komprehensif', price: 4500000, deliveryTime: 21, revisions: 5, features: ['15 articles', 'Complete strategy', 'Social media content', 'Email sequences', 'Monthly reporting'] }
    },
    isActive: true,
    createdAt: new Date('2024-02-08'),
    updatedAt: new Date('2024-02-08'),
    rating: 4.6,
    totalOrders: 67,
    inQueue: 3
  },
  // 40. Mobile Game Development
  {
    id: 'gig_040',
    freelancerId: 'freelancer_015',
    title: 'Casual Mobile Game Development with Monetization',
    description: 'Saya akan mengembangkan casual mobile game yang addictive dengan sistem monetization yang proven. Dari concept hingga app store deployment.',
    category: 'Programming & Tech',
    subcategory: 'Mobile App Development',
    tags: ['mobile game', 'casual game', 'unity', 'monetization', 'app store'],
    images: [
      'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=600&fit=crop'
    ],
    packages: {
      basic: { name: 'Hyper Casual Game', description: 'Game sederhana untuk casual players', price: 8000000, deliveryTime: 30, revisions: 2, features: ['Simple gameplay', 'Ad integration', 'Leaderboard', 'Android build'] },
      standard: { name: 'Casual Game', description: 'Game dengan fitur lengkap', price: 18000000, deliveryTime: 60, revisions: 3, features: ['Advanced gameplay', 'IAP system', 'Analytics', 'iOS + Android'] },
      premium: { name: 'Complete Game Package', description: 'Game siap publish', price: 35000000, deliveryTime: 90, revisions: 5, features: ['Premium game features', 'Backend services', 'Marketing assets', 'Store optimization', 'Launch support'] }
    },
    isActive: true,
    createdAt: new Date('2024-02-09'),
    updatedAt: new Date('2024-02-09'),
    rating: 4.9,
    totalOrders: 22,
    inQueue: 5
  },
  // Continue with more gigs...
  // 41. Influencer Marketing Strategy
  {
    id: 'gig_041',
    freelancerId: 'freelancer_006',
    title: 'Influencer Marketing Campaign Strategy & Management',
    description: 'Saya akan merancang dan mengelola kampanye influencer marketing yang effective untuk meningkatkan brand awareness dan sales conversion.',
    category: 'Digital Marketing',
    subcategory: 'Influencer Marketing',
    tags: ['influencer marketing', 'campaign management', 'brand awareness', 'social media', 'roi tracking'],
    images: [
      'https://images.unsplash.com/photo-1611926653458-09294b3142bf?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&h=600&fit=crop'
    ],
    packages: {
      basic: { name: 'Campaign Strategy', description: 'Strategi kampanye influencer', price: 2000000, deliveryTime: 7, revisions: 2, features: ['Influencer research', 'Campaign brief', 'Budget allocation', 'KPI framework'] },
      standard: { name: 'Full Management', description: 'Pengelolaan kampanye lengkap', price: 6000000, deliveryTime: 30, revisions: 3, features: ['Complete management', 'Influencer outreach', 'Content oversight', 'Performance tracking'] },
      premium: { name: 'Integrated Campaign', description: 'Kampanye multi-platform', price: 15000000, deliveryTime: 60, revisions: 5, features: ['Multi-platform strategy', 'Tier 1 influencers', 'Video content', 'PR integration', 'Detailed analytics'] }
    },
    isActive: true,
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-02-10'),
    rating: 4.7,
    totalOrders: 28,
    inQueue: 4
  },
  // Add more gigs to reach 100 total...
];

// Note: Additional gigs (042-100) are imported from additionalGigs.js
// This gives us exactly 100 total gigs: 41 original + 59 additional = 100

// Combine all gigs to reach 100 total (additionalGigs imported from additionalGigs.js)
const allGigs = [...gigs, ...additionalGigs];

// For now, continue with gig_051 to gig_100 (50 more gigs needed)
const finalGigs = [
  ...allGigs,
  // gig_051-100 (adding 50 more to reach exactly 100)
  {
    id: 'gig_051',
    freelancerId: 'freelancer_012',
    title: 'Fashion E-commerce Photography & Model Shoots',
    description: 'Fashion photography untuk e-commerce dengan model shoots dan styling professional.',
    category: 'Design & Creative',
    subcategory: 'Photography',
    tags: ['fashion photography', 'model photography', 'ecommerce', 'styling', 'commercial'],
    images: ['https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop'],
    packages: {
      basic: { name: 'Product Photos', description: '20 produk fashion', price: 1500000, deliveryTime: 5, revisions: 2, features: ['20 fashion items', 'White background', 'Basic retouching', 'High resolution'] },
      standard: { name: 'Fashion Lookbook', description: 'Lookbook lengkap', price: 4000000, deliveryTime: 10, revisions: 3, features: ['40 items', 'Model photography', 'Styling', 'Multiple setups'] },
      premium: { name: 'Complete Campaign', description: 'Kampanye fashion', price: 10000000, deliveryTime: 21, revisions: 5, features: ['Full campaign', 'Creative direction', 'Lifestyle shots', 'Video content'] }
    },
    isActive: true,
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date('2024-02-20'),
    rating: 4.9,
    totalOrders: 45,
    inQueue: 3
  },
  {
    id: 'gig_052',
    freelancerId: 'freelancer_013',
    title: 'DeFi Protocol & Smart Contract Development',
    description: 'Pengembangan DeFi protocols dan smart contracts dengan security best practices.',
    category: 'Programming & Tech',
    subcategory: 'Blockchain',
    tags: ['defi', 'smart contracts', 'blockchain', 'solidity', 'web3'],
    images: ['https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&h=600&fit=crop'],
    packages: {
      basic: { name: 'Simple Contract', description: 'Smart contract basic', price: 5000000, deliveryTime: 14, revisions: 2, features: ['Basic smart contract', 'Testnet deployment', 'Security review', 'Documentation'] },
      standard: { name: 'DeFi Protocol', description: 'Protocol DeFi', price: 15000000, deliveryTime: 45, revisions: 3, features: ['Complex contracts', 'Frontend integration', 'Security audit', 'Mainnet deployment'] },
      premium: { name: 'Complete Platform', description: 'Platform DeFi lengkap', price: 50000000, deliveryTime: 90, revisions: 5, features: ['Full DeFi platform', 'Multi-chain support', 'Advanced features', 'Governance', 'Documentation'] }
    },
    isActive: true,
    createdAt: new Date('2024-02-21'),
    updatedAt: new Date('2024-02-21'),
    rating: 4.8,
    totalOrders: 12,
    inQueue: 5
  }
  // Continue with gig_053 to gig_100...
];

// Sample reviews data - expanded for all gigs
const reviews = [
  // Reviews for Ahmad (UI/UX Designer) - gig_001
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
  // Reviews for Sari (Web Developer) - gig_002
  {
    id: 'review_003',
    gigId: 'gig_002',
    freelancerId: 'freelancer_002',
    clientId: 'client_001',
    orderId: 'order_003',
    rating: 5,
    comment: 'Website yang dibangun Sari sangat berkualitas. Code nya clean, dokumentasi lengkap, dan performance excellent. Worth every penny!',
    createdAt: new Date('2024-01-22'),
    helpful: 15
  },
  {
    id: 'review_004',
    gigId: 'gig_002',
    freelancerId: 'freelancer_002',
    clientId: 'client_003',
    orderId: 'order_004',
    rating: 5,
    comment: 'Sangat puas dengan hasil web development nya. Sari sangat detail dan always deliver on time. Recommended developer!',
    createdAt: new Date('2024-01-19'),
    helpful: 9
  },
  // Reviews for Budi (Content Writer) - gig_003
  {
    id: 'review_005',
    gigId: 'gig_003',
    freelancerId: 'freelancer_003',
    clientId: 'client_002',
    orderId: 'order_005',
    rating: 5,
    comment: 'Konten yang ditulis Budi sangat berkualitas dan SEO-friendly. Website traffic kami meningkat setelah menggunakan artikel dari Budi.',
    createdAt: new Date('2024-01-21'),
    helpful: 7
  },
  {
    id: 'review_006',
    gigId: 'gig_003',
    freelancerId: 'freelancer_003',
    clientId: 'client_004',
    orderId: 'order_006',
    rating: 4,
    comment: 'Writing style nya bagus dan sesuai dengan brand voice kami. Deliverynya on time. Good job!',
    createdAt: new Date('2024-01-17'),
    helpful: 4
  },
  // Reviews for Lisa (Logo Designer) - gig_004
  {
    id: 'review_007',
    gigId: 'gig_004',
    freelancerId: 'freelancer_004',
    clientId: 'client_001',
    orderId: 'order_007',
    rating: 5,
    comment: 'Logo yang dibuat Lisa sangat kreatif dan memorable. Brand identity package nya juga sangat comprehensive. Highly recommended!',
    createdAt: new Date('2024-01-23'),
    helpful: 11
  },
  {
    id: 'review_008',
    gigId: 'gig_004',
    freelancerId: 'freelancer_004',
    clientId: 'client_005',
    orderId: 'order_008',
    rating: 5,
    comment: 'Proses desain sangat smooth, banyak pilihan concept yang diberikan. Hasil akhir melebihi ekspektasi!',
    createdAt: new Date('2024-01-16'),
    helpful: 6
  },
  // Reviews for Andi (Mobile Developer) - gig_005
  {
    id: 'review_009',
    gigId: 'gig_005',
    freelancerId: 'freelancer_005',
    clientId: 'client_003',
    orderId: 'order_009',
    rating: 5,
    comment: 'Aplikasi mobile yang dibuat Andi sangat smooth dan bug-free. Deployment ke store juga dibantu sampai selesai. Excellent work!',
    createdAt: new Date('2024-01-25'),
    helpful: 14
  },
  {
    id: 'review_010',
    gigId: 'gig_005',
    freelancerId: 'freelancer_005',
    clientId: 'client_002',
    orderId: 'order_010',
    rating: 4,
    comment: 'Kualitas coding sangat baik, dokumentasi lengkap. Ada sedikit delay tapi hasil akhirnya memuaskan.',
    createdAt: new Date('2024-01-20'),
    helpful: 5
  },
  // Reviews for Maya (Digital Marketing) - gig_006
  {
    id: 'review_011',
    gigId: 'gig_006',
    freelancerId: 'freelancer_006',
    clientId: 'client_004',
    orderId: 'order_011',
    rating: 5,
    comment: 'SEO strategy dari Maya sangat effective. Website ranking meningkat drastis dalam 2 bulan. ROI sangat bagus!',
    createdAt: new Date('2024-01-24'),
    helpful: 13
  },
  {
    id: 'review_012',
    gigId: 'gig_006',
    freelancerId: 'freelancer_006',
    clientId: 'client_001',
    orderId: 'order_012',
    rating: 4,
    comment: 'Analisis yang mendalam dan actionable insights. Monthly report nya sangat detail dan mudah dipahami.',
    createdAt: new Date('2024-01-18'),
    helpful: 8
  },
  // Reviews for David (Video Editor) - gig_007
  {
    id: 'review_013',
    gigId: 'gig_007',
    freelancerId: 'freelancer_007',
    clientId: 'client_005',
    orderId: 'order_013',
    rating: 5,
    comment: 'Video editing David sangat profesional! Motion graphics nya smooth dan audio quality excellent. Hasilnya melebihi ekspektasi.',
    createdAt: new Date('2024-01-26'),
    helpful: 10
  },
  {
    id: 'review_014',
    gigId: 'gig_007',
    freelancerId: 'freelancer_007',
    clientId: 'client_003',
    orderId: 'order_014',
    rating: 5,
    comment: 'Sangat kreatif dalam storytelling. Video promotional kami jadi viral berkat editing yang amazing!',
    createdAt: new Date('2024-01-22'),
    helpful: 9
  },
  // Reviews for Nina (Data Scientist) - gig_008
  {
    id: 'review_015',
    gigId: 'gig_008',
    freelancerId: 'freelancer_008',
    clientId: 'client_001',
    orderId: 'order_015',
    rating: 5,
    comment: 'Machine learning model yang dibuat Nina sangat akurat. Dashboard analytics nya juga user-friendly. Sangat membantu decision making!',
    createdAt: new Date('2024-01-27'),
    helpful: 16
  },
  {
    id: 'review_016',
    gigId: 'gig_008',
    freelancerId: 'freelancer_008',
    clientId: 'client_004',
    orderId: 'order_016',
    rating: 5,
    comment: 'Data analysis yang comprehensive dan insights yang actionable. Nina sangat expert di bidangnya.',
    createdAt: new Date('2024-01-23'),
    helpful: 12
  },
  // Reviews for Riko (Voice Over) - gig_009
  {
    id: 'review_017',
    gigId: 'gig_009',
    freelancerId: 'freelancer_009',
    clientId: 'client_002',
    orderId: 'order_017',
    rating: 4,
    comment: 'Suara Riko sangat clear dan profesional. Audio quality bagus, perfect untuk commercial video kami.',
    createdAt: new Date('2024-01-25'),
    helpful: 7
  },
  {
    id: 'review_018',
    gigId: 'gig_009',
    freelancerId: 'freelancer_009',
    clientId: 'client_005',
    orderId: 'order_018',
    rating: 5,
    comment: 'Voice over untuk podcast sangat engaging. Riko juga membantu dengan script editing. Great service!',
    createdAt: new Date('2024-01-21'),
    helpful: 6
  },
  // Reviews for Tina (Business Consultant) - gig_010
  {
    id: 'review_019',
    gigId: 'gig_010',
    freelancerId: 'freelancer_010',
    clientId: 'client_003',
    orderId: 'order_019',
    rating: 5,
    comment: 'Business plan yang dibuat Tina sangat comprehensive. Market research nya mendalam dan strategy nya realistic. Berhasil dapat funding!',
    createdAt: new Date('2024-01-28'),
    helpful: 18
  },
  {
    id: 'review_020',
    gigId: 'gig_010',
    freelancerId: 'freelancer_010',
    clientId: 'client_001',
    orderId: 'order_020',
    rating: 5,
    comment: 'Consultation sessions sangat valuable. Tina memberikan insights yang praktis dan implementable.',
    createdAt: new Date('2024-01-24'),
    helpful: 11
  },
  // Additional reviews for other gigs
  {
    id: 'review_021',
    gigId: 'gig_011',
    freelancerId: 'freelancer_004',
    clientId: 'client_002',
    orderId: 'order_021',
    rating: 5,
    comment: 'Social media designs nya sangat eye-catching! Engagement rate meningkat signifikan setelah pakai design dari Lisa.',
    createdAt: new Date('2024-01-26'),
    helpful: 9
  },
  {
    id: 'review_022',
    gigId: 'gig_012',
    freelancerId: 'freelancer_002',
    clientId: 'client_005',
    orderId: 'order_022',
    rating: 5,
    comment: 'Toko online Shopify yang dibuat sangat profesional. Payment gateway smooth dan inventory management mudah digunakan.',
    createdAt: new Date('2024-01-29'),
    helpful: 13
  },
  {
    id: 'review_023',
    gigId: 'gig_013',
    freelancerId: 'freelancer_003',
    clientId: 'client_004',
    orderId: 'order_023',
    rating: 4,
    comment: 'Terjemahan akurat dan natural. Nuansa bahasa Indonesia nya sangat baik untuk target market lokal.',
    createdAt: new Date('2024-01-27'),
    helpful: 5
  },
  {
    id: 'review_024',
    gigId: 'gig_014',
    freelancerId: 'freelancer_006',
    clientId: 'client_003',
    orderId: 'order_024',
    rating: 5,
    comment: 'Social media management nya excellent! Followers bertambah 300% dalam 3 bulan. Content strategy nya on point.',
    createdAt: new Date('2024-01-30'),
    helpful: 15
  },
  {
    id: 'review_025',
    gigId: 'gig_015',
    freelancerId: 'freelancer_002',
    clientId: 'client_001',
    orderId: 'order_025',
    rating: 5,
    comment: 'WordPress website yang dibuat sangat fast loading dan SEO optimized. Maintenance service nya juga reliable.',
    createdAt: new Date('2024-01-28'),
    helpful: 12
  },
  {
    id: 'review_026',
    gigId: 'gig_016',
    freelancerId: 'freelancer_007',
    clientId: 'client_004',
    orderId: 'order_026',
    rating: 5,
    comment: 'Explainer video animation nya amazing! Character design unik dan storyline engaging. Perfect untuk marketing campaign.',
    createdAt: new Date('2024-01-31'),
    helpful: 14
  },
  {
    id: 'review_027',
    gigId: 'gig_017',
    freelancerId: 'freelancer_008',
    clientId: 'client_005',
    orderId: 'order_027',
    rating: 5,
    comment: 'Database design sangat efficient dan scalable. Performance improvement signifikan setelah optimization.',
    createdAt: new Date('2024-01-29'),
    helpful: 8
  },
  {
    id: 'review_028',
    gigId: 'gig_018',
    freelancerId: 'freelancer_009',
    clientId: 'client_002',
    orderId: 'order_028',
    rating: 4,
    comment: 'Podcast editing sangat profesional. Audio quality crystal clear dan mixing nya balanced.',
    createdAt: new Date('2024-01-30'),
    helpful: 6
  },
  {
    id: 'review_029',
    gigId: 'gig_019',
    freelancerId: 'freelancer_010',
    clientId: 'client_003',
    orderId: 'order_029',
    rating: 5,
    comment: 'Virtual assistant service sangat membantu! Email management dan scheduling nya efficient. Sangat professional.',
    createdAt: new Date('2024-01-31'),
    helpful: 10
  },
  {
    id: 'review_030',
    gigId: 'gig_020',
    freelancerId: 'freelancer_005',
    clientId: 'client_004',
    orderId: 'order_030',
    rating: 5,
    comment: 'REST API yang dibuat sangat robust dan well-documented. Integration dengan frontend sangat smooth.',
    createdAt: new Date('2024-02-01'),
    helpful: 13
  },
  // Reviews for new gigs (gig_031 onwards)
  {
    id: 'review_031',
    gigId: 'gig_031',
    freelancerId: 'freelancer_021',
    clientId: 'client_001',
    orderId: 'order_031',
    rating: 5,
    comment: 'Desain arsitektur yang sangat sustainable dan innovative. Aris sangat detail dalam perencanaan BIM.',
    createdAt: new Date('2024-02-02'),
    helpful: 14
  },
  {
    id: 'review_032',
    gigId: 'gig_032',
    freelancerId: 'freelancer_022',
    clientId: 'client_002',
    orderId: 'order_032',
    rating: 5,
    comment: 'Program nutrition yang dibuat Indah sangat personal dan effective. Berat badan turun 8kg dalam 2 bulan!',
    createdAt: new Date('2024-02-03'),
    helpful: 18
  },
  {
    id: 'review_033',
    gigId: 'gig_033',
    freelancerId: 'freelancer_023',
    clientId: 'client_003',
    orderId: 'order_033',
    rating: 5,
    comment: 'Setup DevOps nya luar biasa! Deployment time berkurang 80% dan sangat stable. Gani sangat expert!',
    createdAt: new Date('2024-02-04'),
    helpful: 16
  },
  {
    id: 'review_034',
    gigId: 'gig_034',
    freelancerId: 'freelancer_024',
    clientId: 'client_004',
    orderId: 'order_034',
    rating: 4,
    comment: 'HR strategy yang comprehensive. Sari membantu kami build HR department dari nol dengan sangat baik.',
    createdAt: new Date('2024-02-05'),
    helpful: 12
  },
  {
    id: 'review_035',
    gigId: 'gig_035',
    freelancerId: 'freelancer_025',
    clientId: 'client_005',
    orderId: 'order_035',
    rating: 5,
    comment: 'Program fitness Yoga sangat effective! Dalam 3 bulan body fat turun drastis. Highly recommended!',
    createdAt: new Date('2024-02-06'),
    helpful: 22
  },
  {
    id: 'review_036',
    gigId: 'gig_036',
    freelancerId: 'freelancer_008',
    clientId: 'client_001',
    orderId: 'order_036',
    rating: 5,
    comment: 'Web scraping service Nina sangat professional. Data yang dihasilkan akurat dan clean!',
    createdAt: new Date('2024-02-07'),
    helpful: 11
  },
  {
    id: 'review_037',
    gigId: 'gig_037',
    freelancerId: 'freelancer_012',
    clientId: 'client_002',
    orderId: 'order_037',
    rating: 5,
    comment: 'Product photography Dina amazing! Foto produk jadi sangat menarik, sales online meningkat 40%!',
    createdAt: new Date('2024-02-08'),
    helpful: 19
  },
  {
    id: 'review_038',
    gigId: 'gig_038',
    freelancerId: 'freelancer_020',
    clientId: 'client_003',
    orderId: 'order_038',
    rating: 5,
    comment: 'Financial planning dari Putri sangat comprehensive. Investment portfolio nya well-balanced dan profitable.',
    createdAt: new Date('2024-02-09'),
    helpful: 15
  },
  {
    id: 'review_039',
    gigId: 'gig_039',
    freelancerId: 'freelancer_003',
    clientId: 'client_004',
    orderId: 'order_039',
    rating: 4,
    comment: 'SEO content writing Budi bagus sekali. Organic traffic website meningkat 200% dalam 3 bulan!',
    createdAt: new Date('2024-02-10'),
    helpful: 17
  },
  {
    id: 'review_040',
    gigId: 'gig_040',
    freelancerId: 'freelancer_015',
    clientId: 'client_005',
    orderId: 'order_040',
    rating: 5,
    comment: 'Mobile game yang dibuat Bayu sangat addictive! Sudah 100k+ downloads dalam sebulan. Excellent work!',
    createdAt: new Date('2024-02-11'),
    helpful: 25
  },
  {
    id: 'review_041',
    gigId: 'gig_041',
    freelancerId: 'freelancer_006',
    clientId: 'client_001',
    orderId: 'order_041',
    rating: 5,
    comment: 'Influencer campaign strategy Maya sangat effective. ROI mencapai 400% dengan engagement rate tinggi!',
    createdAt: new Date('2024-02-12'),
    helpful: 20
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
    for (const gig of allGigs) {
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
 * Seed orders
 */
export const seedOrders = async () => {
  console.log('🌱 Seeding orders...');
  
  try {
    // Sample orders based on reviews
    const orders = [
      {
        id: 'order_001',
        gigId: 'gig_001',
        freelancerId: 'freelancer_001',
        clientId: 'client_001',
        packageType: 'standard',
        status: 'completed',
        totalAmount: 1500000,
        createdAt: new Date('2024-01-15'),
        completedAt: new Date('2024-01-20'),
        deliveryTime: 10
      },
      {
        id: 'order_002',
        gigId: 'gig_001',
        freelancerId: 'freelancer_001',
        clientId: 'client_002',
        packageType: 'premium',
        status: 'completed',
        totalAmount: 2500000,
        createdAt: new Date('2024-01-10'),
        completedAt: new Date('2024-01-18'),
        deliveryTime: 14
      },
      {
        id: 'order_003',
        gigId: 'gig_002',
        freelancerId: 'freelancer_002',
        clientId: 'client_001',
        packageType: 'premium',
        status: 'completed',
        totalAmount: 5000000,
        createdAt: new Date('2024-01-05'),
        completedAt: new Date('2024-01-22'),
        deliveryTime: 21
      },
      {
        id: 'order_004',
        gigId: 'gig_002',
        freelancerId: 'freelancer_002',
        clientId: 'client_003',
        packageType: 'standard',
        status: 'completed',
        totalAmount: 2500000,
        createdAt: new Date('2024-01-12'),
        completedAt: new Date('2024-01-19'),
        deliveryTime: 14
      },
      {
        id: 'order_005',
        gigId: 'gig_003',
        freelancerId: 'freelancer_003',
        clientId: 'client_002',
        packageType: 'premium',
        status: 'completed',
        totalAmount: 1500000,
        createdAt: new Date('2024-01-08'),
        completedAt: new Date('2024-01-21'),
        deliveryTime: 14
      }
    ];
    
    for (const order of orders) {
      await setDoc(doc(db, COLLECTIONS.ORDERS, order.id), {
        ...order,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log(`✅ Created order: ${order.id}`);
    }
    
    console.log('✅ Orders seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding orders:', error);
    throw error;
  }
};

/**
 * Seed all data
 */
export const seedAllData = async () => {
  console.log('🌱 Starting comprehensive database seeding...');
  
  try {
    await seedUsers();
    await seedGigs();
    await seedReviews();
    await seedOrders();
    
    console.log('🎉 All data seeded successfully!');
    console.log('📊 Summary:');
    console.log(`   • ${freelancers.length} freelancers`);
    console.log(`   • ${clients.length} clients`);
    console.log(`   • ${allGigs.length} gigs across multiple categories`);
    console.log(`   • ${reviews.length} reviews`);
    console.log('   • Sample orders');
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  }
};

// Export individual data for testing
export { freelancers, clients, gigs, allGigs, reviews }; 