/**
 * Gig Service - Handles all gig-related database operations
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit as firestoreLimit,
  startAfter
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { COLLECTIONS } from '../utils/constants';

/**
 * Get all gigs with optional filters
 */
export const getGigs = async (filters = {}, options = {}) => {
  try {
    console.log('🔍 gigService.getGigs called with filters:', filters, 'options:', options);
    
    const { 
      category, 
      priceMin, 
      priceMax, 
      rating,
      location,
      search,
      freelancerId
    } = filters;
    
    const {
      sortBy = 'createdAt',
      sortOrder = 'desc',
      limit = 20,
      page = 1
    } = options;

    let gigsQuery = collection(db, COLLECTIONS.GIGS);
    
    // Build query constraints
    const constraints = [];
    
    // Only show active gigs
    constraints.push(where('isActive', '==', true));
    
    // Category filter
    if (category) {
      constraints.push(where('category', '==', category));
    }
    
    // Freelancer filter
    if (freelancerId) {
      constraints.push(where('freelancerId', '==', freelancerId));
    }
    
    // Note: Removed complex price and rating filters that require composite indexes
    // These will be handled client-side
    
    // Add limit without orderBy to avoid index requirements
    constraints.push(firestoreLimit(limit));
    
    console.log('📊 Executing Firestore query with constraints:', constraints.length);
    
    // Execute query
    gigsQuery = query(gigsQuery, ...constraints);
    const gigsSnapshot = await getDocs(gigsQuery);
    
    console.log(`📊 Raw gigs from Firestore: ${gigsSnapshot.size}`);
    
    let gigs = gigsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log('📄 Gig IDs:', gigs.map(g => g.id));
    
    // Client-side filtering for complex filters
    if (search) {
      const searchTerm = search.toLowerCase();
      gigs = gigs.filter(gig => 
        gig.title.toLowerCase().includes(searchTerm) ||
        gig.description.toLowerCase().includes(searchTerm) ||
        gig.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
      console.log(`📊 After search filter: ${gigs.length}`);
    }
    
    // Client-side price filtering
    if (priceMin) {
      gigs = gigs.filter(gig => gig.packages?.basic?.price >= priceMin);
      console.log(`📊 After priceMin filter: ${gigs.length}`);
    }
    if (priceMax) {
      gigs = gigs.filter(gig => gig.packages?.basic?.price <= priceMax);
      console.log(`📊 After priceMax filter: ${gigs.length}`);
    }
    
    // Client-side rating filtering
    if (rating) {
      gigs = gigs.filter(gig => gig.rating >= rating);
      console.log(`📊 After rating filter: ${gigs.length}`);
    }
    
    console.log('👥 Adding freelancer data to gigs...');
    
    if (location) {
      // Need to fetch freelancer data for location
      const gigsWithLocation = await Promise.all(
        gigs.map(async (gig) => {
          const freelancer = await getFreelancerData(gig.freelancerId);
          return {
            ...gig,
            freelancer: {
              ...freelancer,
              location: freelancer.location || 'Unknown'
            }
          };
        })
      );
      
      gigs = gigsWithLocation.filter(gig => 
        gig.freelancer.location?.toLowerCase().includes(location.toLowerCase())
      );
      console.log(`📊 After location filter: ${gigs.length}`);
    } else {
      // Add freelancer data to each gig
      gigs = await Promise.all(
        gigs.map(async (gig) => {
          const freelancer = await getFreelancerData(gig.freelancerId);
          return {
            ...gig,
            freelancer
          };
        })
      );
    }
    
    console.log('📊 After adding freelancer data:', gigs.length);
    
    // Client-side sorting
    gigs.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'rating':
          aValue = a.rating || 0;
          bValue = b.rating || 0;
          break;
        case 'price':
          aValue = a.packages?.basic?.price || 0;
          bValue = b.packages?.basic?.price || 0;
          break;
        case 'createdAt':
        default:
          // Handle both Date objects and Firestore Timestamps
          aValue = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
          bValue = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
          break;
      }
      
      if (sortOrder === 'desc') {
        return bValue > aValue ? 1 : bValue < aValue ? -1 : 0;
      } else {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      }
    });
    
    console.log('✅ gigService.getGigs completed, returning', gigs.length, 'gigs');
    
    return gigs;
  } catch (error) {
    console.error('❌ Error in gigService.getGigs:', error);
    throw new Error('Failed to fetch gigs');
  }
};

/**
 * Get featured gigs for homepage
 */
export const getFeaturedGigs = async (limit = 12) => {
  try {
    return await getGigs({}, {
      sortBy: 'rating',
      sortOrder: 'desc',
      limit
    });
  } catch (error) {
    console.error('Error getting featured gigs:', error);
    return [];
  }
};

/**
 * Get gig by ID with full details
 */
export const getGigById = async (gigId) => {
  try {
    const gigDoc = await getDoc(doc(db, COLLECTIONS.GIGS, gigId));
    
    if (!gigDoc.exists()) {
      throw new Error('Gig not found');
    }
    
    const gigData = {
      id: gigDoc.id,
      ...gigDoc.data()
    };
    
    // Get freelancer data
    const freelancer = await getFreelancerData(gigData.freelancerId);
    
    // Get reviews for this gig
    const reviews = await getGigReviews(gigId);
    
    return {
      ...gigData,
      freelancer,
      reviews
    };
  } catch (error) {
    console.error('Error getting gig by ID:', error);
    throw error;
  }
};

/**
 * Get freelancer data for a gig
 */
const getFreelancerData = async (freelancerId) => {
  try {
    // Get user data
    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, freelancerId));
    const userData = userDoc.exists() ? userDoc.data() : {};
    
    // Get freelancer profile data
    const freelancerDoc = await getDoc(doc(db, COLLECTIONS.FREELANCER_PROFILES, freelancerId));
    const freelancerData = freelancerDoc.exists() ? freelancerDoc.data() : {};
    
    return {
      id: freelancerId,
      name: userData.displayName || userData.username || 'Unknown',
      displayName: userData.displayName || userData.username || 'Unknown',
      avatar: userData.profilePhoto || null,
      profilePhoto: userData.profilePhoto || null,
      bio: userData.bio || '',
      location: userData.location || 'Unknown',
      isVerified: userData.emailVerified || false,
      isTopRated: freelancerData.tier === 'platinum' || freelancerData.tier === 'gold',
      tier: freelancerData.tier || 'bronze',
      rating: freelancerData.rating || 0,
      totalReviews: freelancerData.totalReviews || 0,
      completedProjects: freelancerData.completedProjects || 0,
      skills: freelancerData.skills || [],
      hourlyRate: freelancerData.hourlyRate || 0,
      experienceLevel: freelancerData.experienceLevel || 'beginner',
      education: freelancerData.education || [],
      certifications: freelancerData.certifications || []
    };
  } catch (error) {
    console.error('Error getting freelancer data:', error);
    return {
      id: freelancerId,
      name: 'Unknown Freelancer',
      displayName: 'Unknown Freelancer',
      avatar: null,
      isVerified: false,
      isTopRated: false
    };
  }
};

/**
 * Get reviews for a specific gig
 */
export const getGigReviews = async (gigId, options = {}) => {
  try {
    const {
      sortBy = 'createdAt',
      sortOrder = 'desc',
      limit = 20
    } = options;
    
    const reviewsQuery = query(
      collection(db, COLLECTIONS.REVIEWS),
      where('gigId', '==', gigId),
      orderBy(sortBy, sortOrder),
      firestoreLimit(limit)
    );
    
    const reviewsSnapshot = await getDocs(reviewsQuery);
    
    const reviews = await Promise.all(
      reviewsSnapshot.docs.map(async (doc) => {
        const reviewData = {
          id: doc.id,
          ...doc.data()
        };
        
        // Get client data for the review
        const clientDoc = await getDoc(doc(db, COLLECTIONS.USERS, reviewData.clientId));
        const clientData = clientDoc.exists() ? clientDoc.data() : {};
        
        return {
          ...reviewData,
          client: {
            name: clientData.displayName || clientData.username || 'Anonymous',
            avatar: clientData.profilePhoto || null
          }
        };
      })
    );
    
    return reviews;
  } catch (error) {
    console.error('Error getting gig reviews:', error);
    return [];
  }
};

/**
 * Get gigs by category
 */
export const getGigsByCategory = async (category, limit = 12) => {
  try {
    return await getGigs({ category }, { limit });
  } catch (error) {
    console.error('Error getting gigs by category:', error);
    return [];
  }
};

/**
 * Search gigs
 */
export const searchGigs = async (searchTerm, filters = {}, options = {}) => {
  try {
    return await getGigs(
      { ...filters, search: searchTerm },
      options
    );
  } catch (error) {
    console.error('Error searching gigs:', error);
    return [];
  }
};

/**
 * Get gig statistics
 */
export const getGigStats = async (gigId) => {
  try {
    const reviews = await getGigReviews(gigId);
    
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
      : 0;
    
    // Rating distribution
    const ratingDistribution = {
      5: reviews.filter(r => r.rating === 5).length,
      4: reviews.filter(r => r.rating === 4).length,
      3: reviews.filter(r => r.rating === 3).length,
      2: reviews.filter(r => r.rating === 2).length,
      1: reviews.filter(r => r.rating === 1).length
    };
    
    return {
      totalReviews,
      averageRating: Math.round(averageRating * 10) / 10,
      ratingDistribution
    };
  } catch (error) {
    console.error('Error getting gig stats:', error);
    return {
      totalReviews: 0,
      averageRating: 0,
      ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    };
  }
};

// Export default object with all functions
const gigService = {
  getGigs,
  getFeaturedGigs,
  getGigById,
  getGigReviews,
  getGigsByCategory,
  searchGigs,
  getGigStats
};

export default gigService; 