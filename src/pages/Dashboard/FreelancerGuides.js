import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  PlayIcon, 
  BookmarkIcon,
  HeartIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { 
  BookmarkIcon as BookmarkSolid,
  HeartIcon as HeartSolid 
} from '@heroicons/react/24/solid';
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';

export default function FreelancerGuides() {
  const { currentUser } = useAuth();
  const [videos, setVideos] = useState([]);
  const [filteredVideos, setFilteredVideos] = useState([]);
  const [categories] = useState([
    'Semua',
    'Memulai',
    'Membuat Gig',
    'Komunikasi Client',
    'Pricing Strategy',
    'Marketing',
    'Portfolio',
    'Tips Sukses'
  ]);
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [likedVideos, setLikedVideos] = useState([]);
  const [bookmarkedVideos, setBookmarkedVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sample video data - in production, this would come from Firestore
  const sampleVideos = [
    {
      id: '1',
      title: 'Cara Membuat Gig Pertama yang Menarik',
      description: 'Panduan lengkap membuat gig yang menarik perhatian client dan meningkatkan penjualan',
      thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      duration: '12:45',
      category: 'Membuat Gig',
      views: 1234,
      likes: 89,
      publishedAt: new Date('2024-01-15')
    },
    {
      id: '2',
      title: 'Tips Menentukan Harga Jasa yang Tepat',
      description: 'Strategi pricing yang efektif untuk freelancer pemula hingga expert',
      thumbnail: 'https://img.youtube.com/vi/jNQXAC9IVRw/maxresdefault.jpg',
      videoUrl: 'https://www.youtube.com/embed/jNQXAC9IVRw',
      duration: '15:30',
      category: 'Pricing Strategy',
      views: 2341,
      likes: 156,
      publishedAt: new Date('2024-01-10')
    },
    {
      id: '3',
      title: 'Komunikasi Efektif dengan Client',
      description: 'Cara berkomunikasi profesional untuk membangun hubungan jangka panjang',
      thumbnail: 'https://img.youtube.com/vi/9bZkp7q19f0/maxresdefault.jpg',
      videoUrl: 'https://www.youtube.com/embed/9bZkp7q19f0',
      duration: '18:20',
      category: 'Komunikasi Client',
      views: 3456,
      likes: 234,
      publishedAt: new Date('2024-01-05')
    },
    {
      id: '4',
      title: 'Memulai Karir Freelancer di SkillNusa',
      description: 'Panduan lengkap untuk pemula yang ingin memulai karir sebagai freelancer',
      thumbnail: 'https://img.youtube.com/vi/M7lc1UVf-VE/maxresdefault.jpg',
      videoUrl: 'https://www.youtube.com/embed/M7lc1UVf-VE',
      duration: '25:15',
      category: 'Memulai',
      views: 5678,
      likes: 456,
      publishedAt: new Date('2024-01-01')
    },
    {
      id: '5',
      title: 'Membangun Portfolio yang Menarik',
      description: 'Tips dan trik membuat portfolio yang membuat client tertarik',
      thumbnail: 'https://img.youtube.com/vi/kJQP7kiw5Fk/maxresdefault.jpg',
      videoUrl: 'https://www.youtube.com/embed/kJQP7kiw5Fk',
      duration: '20:45',
      category: 'Portfolio',
      views: 4321,
      likes: 321,
      publishedAt: new Date('2023-12-28')
    },
    {
      id: '6',
      title: 'Marketing Diri Sebagai Freelancer',
      description: 'Strategi pemasaran personal branding untuk meningkatkan visibility',
      thumbnail: 'https://img.youtube.com/vi/eBGIQ7ZuuiU/maxresdefault.jpg',
      videoUrl: 'https://www.youtube.com/embed/eBGIQ7ZuuiU',
      duration: '16:30',
      category: 'Marketing',
      views: 2890,
      likes: 198,
      publishedAt: new Date('2023-12-25')
    }
  ];

  useEffect(() => {
    // In production, fetch from Firestore
    setVideos(sampleVideos);
    setFilteredVideos(sampleVideos);
    
    // Load user preferences
    loadUserPreferences();
    
    setLoading(false);
  }, []);

  useEffect(() => {
    filterVideos();
  }, [selectedCategory, searchQuery, videos]);

  const loadUserPreferences = async () => {
    if (!currentUser) return;
    
    try {
      const userDoc = await getDocs(query(
        collection(db, 'users'),
        where('uid', '==', currentUser.uid)
      ));
      
      if (!userDoc.empty) {
        const userData = userDoc.docs[0].data();
        setLikedVideos(userData.likedGuides || []);
        setBookmarkedVideos(userData.bookmarkedGuides || []);
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }
  };

  const filterVideos = () => {
    let filtered = [...videos];
    
    // Filter by category
    if (selectedCategory !== 'Semua') {
      filtered = filtered.filter(video => video.category === selectedCategory);
    }
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(video => 
        video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredVideos(filtered);
  };

  const handleLike = async (videoId) => {
    if (!currentUser) return;
    
    const isLiked = likedVideos.includes(videoId);
    
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      
      if (isLiked) {
        await updateDoc(userRef, {
          likedGuides: arrayRemove(videoId)
        });
        setLikedVideos(prev => prev.filter(id => id !== videoId));
      } else {
        await updateDoc(userRef, {
          likedGuides: arrayUnion(videoId)
        });
        setLikedVideos(prev => [...prev, videoId]);
      }
    } catch (error) {
      console.error('Error updating like:', error);
    }
  };

  const handleBookmark = async (videoId) => {
    if (!currentUser) return;
    
    const isBookmarked = bookmarkedVideos.includes(videoId);
    
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      
      if (isBookmarked) {
        await updateDoc(userRef, {
          bookmarkedGuides: arrayRemove(videoId)
        });
        setBookmarkedVideos(prev => prev.filter(id => id !== videoId));
      } else {
        await updateDoc(userRef, {
          bookmarkedGuides: arrayUnion(videoId)
        });
        setBookmarkedVideos(prev => [...prev, videoId]);
      }
    } catch (error) {
      console.error('Error updating bookmark:', error);
    }
  };

  const formatViews = (views) => {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  };

  const formatDate = (date) => {
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Hari ini';
    if (days === 1) return 'Kemarin';
    if (days < 7) return `${days} hari yang lalu`;
    if (days < 30) return `${Math.floor(days / 7)} minggu yang lalu`;
    if (days < 365) return `${Math.floor(days / 30)} bulan yang lalu`;
    return `${Math.floor(days / 365)} tahun yang lalu`;
  };

  const VideoModal = ({ video, onClose }) => {
    if (!video) return null;
    
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed left-[250px] right-0 top-0 bottom-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div 
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.9 }}
          className="bg-white rounded-lg w-[90%] max-w-3xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative">
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
            >
              <XMarkIcon className="h-6 w-6 text-gray-600" />
            </button>
            
            <div className="aspect-video bg-black">
              <iframe
                src={video.videoUrl}
                title={video.title}
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{video.title}</h2>
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                <span>{formatViews(video.views)} tayangan</span>
                <span>{formatDate(video.publishedAt)}</span>
                <span className="bg-[#010042] text-white text-xs px-2 py-1 rounded-full">
                  {video.category}
                </span>
              </div>
              <p className="text-gray-700">{video.description}</p>
              
              <div className="flex items-center gap-4 mt-6">
                <button 
                  onClick={() => handleLike(video.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    likedVideos.includes(video.id)
                      ? 'bg-red-100 text-red-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {likedVideos.includes(video.id) ? (
                    <HeartSolid className="h-5 w-5" />
                  ) : (
                    <HeartIcon className="h-5 w-5" />
                  )}
                  <span>{video.likes}</span>
                </button>
                
                <button 
                  onClick={() => handleBookmark(video.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    bookmarkedVideos.includes(video.id)
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {bookmarkedVideos.includes(video.id) ? (
                    <BookmarkSolid className="h-5 w-5" />
                  ) : (
                    <BookmarkIcon className="h-5 w-5" />
                  )}
                  <span>Simpan</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#010042]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Panduan Freelancer
        </h1>
        <p className="text-gray-600">
          Video tutorial untuk membantu Anda sukses sebagai freelancer di SkillNusa
        </p>
      </motion.div>

      {/* Search and Filter */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari video panduan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#010042]"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <FunnelIcon className="h-5 w-5 text-gray-600" />
            <span>Filter</span>
          </button>
        </div>

        {/* Category Tabs */}
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                selectedCategory === category
                  ? 'bg-[#010042] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Video Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVideos.map((video, index) => (
          <motion.div
            key={video.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setSelectedVideo(video)}
          >
            <div className="relative aspect-video bg-gray-100 rounded-t-lg overflow-hidden">
              <div className="absolute top-2 left-2 z-10">
                <span className="bg-[#010042] text-white text-xs px-2 py-1 rounded-full">
                  {video.category}
                </span>
              </div>
              <img 
                src={video.thumbnail} 
                alt={video.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <PlayIcon className="h-16 w-16 text-white" />
              </div>
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                {video.duration}
              </div>
            </div>
            
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                {video.title}
              </h3>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {video.description}
              </p>
              
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>{formatViews(video.views)} tayangan</span>
                <span>{formatDate(video.publishedAt)}</span>
              </div>
              
              <div className="flex items-center gap-3 mt-3">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLike(video.id);
                  }}
                  className={`flex items-center gap-1 ${
                    likedVideos.includes(video.id) ? 'text-red-600' : 'text-gray-500'
                  }`}
                >
                  {likedVideos.includes(video.id) ? (
                    <HeartSolid className="h-5 w-5" />
                  ) : (
                    <HeartIcon className="h-5 w-5" />
                  )}
                  <span>{video.likes}</span>
                </button>
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBookmark(video.id);
                  }}
                  className={`ml-auto ${
                    bookmarkedVideos.includes(video.id) ? 'text-blue-600' : 'text-gray-500'
                  }`}
                >
                  {bookmarkedVideos.includes(video.id) ? (
                    <BookmarkSolid className="h-5 w-5" />
                  ) : (
                    <BookmarkIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Video Modal */}
      {selectedVideo && (
        <VideoModal 
          video={selectedVideo} 
          onClose={() => setSelectedVideo(null)} 
        />
      )}
    </div>
  );
} 