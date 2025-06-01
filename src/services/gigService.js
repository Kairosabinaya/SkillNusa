/**
 * Gig Service - Handles all gig-related database operations
 * Updated to use new database structure with single source of truth
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
    
    // Freelancer filter - use userId only (standardized)
    if (freelancerId) {
      constraints.push(where('userId', '==', freelancerId));
    }
    
    // Add limit
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
    
    // Apply client-side filters and add freelancer data
    gigs = await applyFiltersAndSort(gigs, filters, options);
    
    return gigs;
  } catch (error) {
    console.error('❌ Error in gigService.getGigs:', error);
    throw new Error('Failed to fetch gigs');
  }
};

/**
 * Helper function to apply filters and sorting
 */
const applyFiltersAndSort = async (gigs, filters, options) => {
  const { 
    priceMin, 
    priceMax, 
    rating,
    location,
    search
  } = filters;
  
  const {
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = options;
  
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
  
  console.log('👥 Adding freelancer data to gigs...');
  
  // Add freelancer data to each gig
  gigs = await Promise.all(
    gigs.map(async (gig) => {
      const freelancerId = gig.userId; // Use standardized userId field
      const freelancer = await getFreelancerData(freelancerId);
      
      // Apply rating filter using freelancer data (SINGLE SOURCE OF TRUTH)
      if (rating && (!freelancer || freelancer.rating < rating)) {
        return null; // Filter out this gig
      }
      
      // Apply location filter using freelancer data
      if (location && (!freelancer || !freelancer.location?.toLowerCase().includes(location.toLowerCase()))) {
        return null; // Filter out this gig
      }
      
      return {
        ...gig,
        freelancer
      };
    })
  );
  
  // Remove null entries (filtered out gigs)
  gigs = gigs.filter(gig => gig !== null);
  
  console.log(`📊 After rating and location filters: ${gigs.length}`);
  
  // Client-side sorting
  gigs.sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'price':
        aValue = a.packages?.basic?.price || 0;
        bValue = b.packages?.basic?.price || 0;
        break;
      case 'rating':
        aValue = a.freelancer?.rating || 0;
        bValue = b.freelancer?.rating || 0;
        break;
      case 'totalOrders':
        aValue = a.totalOrders || 0;
        bValue = b.totalOrders || 0;
        break;
      case 'createdAt':
      default:
        aValue = a.createdAt?.seconds || 0;
        bValue = b.createdAt?.seconds || 0;
        break;
    }
    
    return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
  });
  
  console.log(`📊 Final gigs count: ${gigs.length}`);
  return gigs;
};

/**
 * Get featured gigs (high-rated, popular gigs)
 */
export const getFeaturedGigs = async (limit = 12) => {
  try {
    console.log('🌟 Getting featured gigs...');
    
    // Get all active gigs first
    const gigsQuery = query(
      collection(db, COLLECTIONS.GIGS),
      where('isActive', '==', true),
      firestoreLimit(50) // Get more to filter from
    );
    
    const gigsSnapshot = await getDocs(gigsQuery);
    let gigs = gigsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Add freelancer data and filter for featured criteria
    gigs = await Promise.all(
      gigs.map(async (gig) => {
        const freelancer = await getFreelancerData(gig.userId);
        return {
          ...gig,
          freelancer
        };
      })
    );
    
    // Filter for featured criteria (high rating, good order count)
    gigs = gigs.filter(gig => 
      gig.freelancer && 
      gig.freelancer.rating >= 4.5 && 
      gig.freelancer.totalOrders >= 5
    );
    
    // Sort by rating and total orders
    gigs.sort((a, b) => {
      const aScore = (a.freelancer.rating * 0.7) + (a.totalOrders * 0.3);
      const bScore = (b.freelancer.rating * 0.7) + (b.totalOrders * 0.3);
      return bScore - aScore;
    });
    
    return gigs.slice(0, limit);
  } catch (error) {
    console.error('❌ Error getting featured gigs:', error);
    throw new Error('Failed to fetch featured gigs');
  }
};

/**
 * Get gig by ID with complete details
 */
export const getGigById = async (gigId) => {
  try {
    console.log('🔍 Getting gig by ID:', gigId);
    
    const gigDoc = await getDoc(doc(db, COLLECTIONS.GIGS, gigId));
    
    if (!gigDoc.exists()) {
      throw new Error('Gig not found');
    }
    
    const gigData = { id: gigDoc.id, ...gigDoc.data() };
    
    // Get freelancer data
    const freelancer = await getFreelancerData(gigData.userId);
    
    // Get reviews for this gig
    const reviews = await getGigReviews(gigId);
    
    console.log('📊 GigService: Reviews loaded for gig:', reviews.length);
    
    return {
      ...gigData,
      freelancer,
      reviews
    };
  } catch (error) {
    console.error('❌ Error getting gig by ID:', error);
    throw error;
  }
};

/**
 * Get freelancer data with performance metrics (SINGLE SOURCE OF TRUTH)
 */
const getFreelancerData = async (freelancerId) => {
  try {
    if (!freelancerId) return null;
    
    // Get user basic data
    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, freelancerId));
    if (!userDoc.exists()) return null;
    
    const userData = userDoc.data();
    
    // Get freelancer profile data (SINGLE SOURCE FOR RATINGS)
    const freelancerDoc = await getDoc(doc(db, COLLECTIONS.FREELANCER_PROFILES, freelancerId));
    
    let freelancerData = {};
    if (freelancerDoc.exists()) {
      freelancerData = freelancerDoc.data();
    }
    
    return {
      id: freelancerId,
      displayName: userData.displayName,
      profilePhoto: userData.profilePhoto,
      isVerified: userData.isVerified || false,
      // Performance data from freelancer profile (SINGLE SOURCE)
      rating: freelancerData.rating || 0,
      totalReviews: freelancerData.totalReviews || 0,
      totalOrders: freelancerData.totalOrders || 0,
      completedProjects: freelancerData.completedProjects || 0,
      location: freelancerData.location || userData.location || 'Unknown',
      // Professional info
      bio: freelancerData.bio || '',
      skills: freelancerData.skills || [],
      education: freelancerData.education || [],
      certifications: freelancerData.certifications || [],
      experienceLevel: freelancerData.experienceLevel || 'entry',
      website: freelancerData.website || '',
      languages: freelancerData.languages || []
    };
  } catch (error) {
    console.error('❌ Error getting freelancer data:', error);
    return null;
  }
};

/**
 * Get gig reviews (from reviews collection)
 */
export const getGigReviews = async (gigId, options = {}) => {
  try {
    const { limit = 10, orderBy: orderField = 'createdAt' } = options;
    
    console.log('🔍 Getting reviews for gig:', gigId);
    
    // Try with composite index first
    try {
      const reviewsQuery = query(
        collection(db, COLLECTIONS.REVIEWS),
        where('gigId', '==', gigId),
        where('status', '==', 'published'),
        orderBy(orderField, 'desc'),
        firestoreLimit(limit)
      );
      
      const reviewsSnapshot = await getDocs(reviewsQuery);
      const reviews = reviewsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('✅ Reviews loaded with composite index:', reviews.length);
      
      // Add client data to reviews
      const reviewsWithClientData = await Promise.all(
        reviews.map(async (review) => {
          const clientDoc = await getDoc(doc(db, COLLECTIONS.USERS, review.clientId));
          const clientData = clientDoc.exists() ? clientDoc.data() : {};
          
          return {
            ...review,
            client: {
              id: review.clientId,
              displayName: clientData.displayName || 'Anonymous',
              profilePhoto: clientData.profilePhoto || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face&auto=format`
            }
          };
        })
      );
      
      return reviewsWithClientData;
      
    } catch (indexError) {
      console.info('📋 Using fallback query for reviews (no composite index):', indexError.message);
      
      // Fallback: Load reviews without complex ordering
      try {
        const fallbackQuery = query(
          collection(db, COLLECTIONS.REVIEWS),
          where('gigId', '==', gigId),
          firestoreLimit(limit)
        );
        
        const fallbackSnapshot = await getDocs(fallbackQuery);
        let reviews = fallbackSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Filter published reviews and sort manually
        reviews = reviews.filter(review => review.status === 'published');
        reviews.sort((a, b) => {
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return bTime - aTime;
        });
        
        console.log('✅ Reviews loaded with fallback query:', reviews.length);
        
        // Add client data to reviews
        const reviewsWithClientData = await Promise.all(
          reviews.map(async (review) => {
            const clientDoc = await getDoc(doc(db, COLLECTIONS.USERS, review.clientId));
            const clientData = clientDoc.exists() ? clientDoc.data() : {};
            
            return {
              ...review,
              client: {
                id: review.clientId,
                displayName: clientData.displayName || 'Anonymous',
                profilePhoto: clientData.profilePhoto || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face&auto=format`
              }
            };
          })
        );
        
        return reviewsWithClientData;
        
      } catch (fallbackError) {
        console.error('❌ Error with fallback reviews query:', fallbackError);
        return [];
      }
    }
    
  } catch (error) {
    console.error('❌ Error getting gig reviews:', error);
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
    console.error('❌ Error getting gigs by category:', error);
    throw error;
  }
};

/**
 * Search gigs
 */
export const searchGigs = async (searchTerm, filters = {}, options = {}) => {
  try {
    return await getGigs({ ...filters, search: searchTerm }, options);
  } catch (error) {
    console.error('❌ Error searching gigs:', error);
    throw error;
  }
};

/**
 * Get gig statistics
 */
export const getGigStats = async (gigId) => {
  try {
    const gig = await getGigById(gigId);
    if (!gig) return null;
    
    return {
      totalOrders: gig.totalOrders || 0,
      inQueue: gig.inQueue || 0,
      rating: gig.freelancer?.rating || 0,
      totalReviews: gig.freelancer?.totalReviews || 0
    };
  } catch (error) {
    console.error('❌ Error getting gig stats:', error);
    return null;
  }
};

export default {
  getGigs,
  getFeaturedGigs,
  getGigById,
  getGigReviews,
  getGigsByCategory,
  searchGigs,
  getGigStats
}; 