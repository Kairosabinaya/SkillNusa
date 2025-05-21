import { 
  doc, 
  collection, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  limit, 
  orderBy, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { COLLECTIONS } from '../utils/constants';

// Maximum retry attempts for operations
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

/**
 * Helper function to sleep for a specified time
 * @param {number} ms - Time to sleep in milliseconds
 * @returns {Promise<void>}
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Firebase service for handling database operations
 */
class FirebaseService {
  /**
   * Execute operation with retry logic for network errors
   * 
   * @param {Function} operation - The operation to execute
   * @param {string} operationName - Name of the operation for logging
   * @param {number} retries - Number of retries
   * @returns {Promise<any>} The operation result
   */
  async executeWithRetry(operation, operationName, retries = MAX_RETRIES) {
    try {
      return await operation();
    } catch (error) {
      // Only retry for network-related errors
      const isNetworkError = error.code === 'unavailable' || 
                            error.code === 'deadline-exceeded' ||
                            error.message.includes('network');
                            
      if (isNetworkError && retries > 0) {
        console.warn(`Network error during ${operationName}, retrying... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`);
        await sleep(RETRY_DELAY);
        return this.executeWithRetry(operation, operationName, retries - 1);
      }
      
      // Rethrow if not a network error or no more retries
      throw error;
    }
  }

  /**
   * Get a document by ID from a collection
   * 
   * @param {string} collectionName - The collection name
   * @param {string} documentId - The document ID
   * @returns {Promise<Object|null>} The document data or null
   */
  async getDocument(collectionName, documentId) {
    if (!collectionName || !documentId) {
      throw new Error('Collection name and document ID are required');
    }
    
    try {
      return await this.executeWithRetry(async () => {
        const docRef = doc(db, collectionName, documentId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          return { id: docSnap.id, ...docSnap.data() };
        }
        
        return null;
      }, `getDocument(${collectionName}, ${documentId})`);
    } catch (error) {
      console.error(`Error getting document from ${collectionName}:`, error);
      throw error;
    }
  }
  
  /**
   * Get documents from a collection with optional query parameters
   * 
   * @param {string} collectionName - The collection name
   * @param {Object} options - Query options
   * @param {Array} options.filters - Array of filter objects with field, operator, and value
   * @param {string} options.orderByField - Field to order by
   * @param {string} options.orderDirection - Direction to order (asc/desc)
   * @param {number} options.limitCount - Number of documents to limit
   * @returns {Promise<Array>} Array of document data
   */
  async getDocuments(collectionName, options = {}) {
    if (!collectionName) {
      throw new Error('Collection name is required');
    }
    
    try {
      return await this.executeWithRetry(async () => {
        const { filters = [], orderByField, orderDirection = 'desc', limitCount } = options;
        
        let q = collection(db, collectionName);
        
        // Apply filters
        if (filters.length > 0) {
          q = query(q, ...filters.map(filter => 
            where(filter.field, filter.operator, filter.value)
          ));
        }
        
        // Apply ordering
        if (orderByField) {
          q = query(q, orderBy(orderByField, orderDirection));
        }
        
        // Apply limit
        if (limitCount) {
          q = query(q, limit(limitCount));
        }
        
        const querySnapshot = await getDocs(q);
        const documents = [];
        
        querySnapshot.forEach((doc) => {
          documents.push({ id: doc.id, ...doc.data() });
        });
        
        return documents;
      }, `getDocuments(${collectionName})`);
    } catch (error) {
      console.error(`Error getting documents from ${collectionName}:`, error);
      throw error;
    }
  }
  
  /**
   * Create or update a document with a specific ID
   * 
   * @param {string} collectionName - The collection name
   * @param {string} documentId - The document ID
   * @param {Object} data - The document data
   * @param {boolean} merge - Whether to merge with existing data
   * @returns {Promise<string>} The document ID
   */
  async setDocument(collectionName, documentId, data, merge = true) {
    if (!collectionName || !documentId || !data) {
      throw new Error('Collection name, document ID, and data are required');
    }
    
    try {
      return await this.executeWithRetry(async () => {
        const docRef = doc(db, collectionName, documentId);
        
        await setDoc(docRef, {
          ...data,
          updatedAt: serverTimestamp()
        }, { merge });
        
        return documentId;
      }, `setDocument(${collectionName}, ${documentId})`);
    } catch (error) {
      console.error(`Error setting document in ${collectionName}:`, error);
      throw error;
    }
  }
  
  /**
   * Create a new document with an auto-generated ID
   * 
   * @param {string} collectionName - The collection name
   * @param {Object} data - The document data
   * @returns {Promise<string>} The new document ID
   */
  async addDocument(collectionName, data) {
    if (!collectionName || !data) {
      throw new Error('Collection name and data are required');
    }
    
    try {
      return await this.executeWithRetry(async () => {
        const collectionRef = collection(db, collectionName);
        
        const docRef = await addDoc(collectionRef, {
          ...data,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        return docRef.id;
      }, `addDocument(${collectionName})`);
    } catch (error) {
      console.error(`Error adding document to ${collectionName}:`, error);
      throw error;
    }
  }
  
  /**
   * Update an existing document
   * 
   * @param {string} collectionName - The collection name
   * @param {string} documentId - The document ID
   * @param {Object} data - The document data to update
   * @returns {Promise<void>}
   */
  async updateDocument(collectionName, documentId, data) {
    if (!collectionName || !documentId || !data) {
      throw new Error('Collection name, document ID, and data are required');
    }
    
    try {
      return await this.executeWithRetry(async () => {
        const docRef = doc(db, collectionName, documentId);
        
        await updateDoc(docRef, {
          ...data,
          updatedAt: serverTimestamp()
        });
      }, `updateDocument(${collectionName}, ${documentId})`);
    } catch (error) {
      console.error(`Error updating document in ${collectionName}:`, error);
      throw error;
    }
  }
  
  /**
   * Delete a document
   * 
   * @param {string} collectionName - The collection name
   * @param {string} documentId - The document ID
   * @returns {Promise<void>}
   */
  async deleteDocument(collectionName, documentId) {
    if (!collectionName || !documentId) {
      throw new Error('Collection name and document ID are required');
    }
    
    try {
      return await this.executeWithRetry(async () => {
        const docRef = doc(db, collectionName, documentId);
        await deleteDoc(docRef);
      }, `deleteDocument(${collectionName}, ${documentId})`);
    } catch (error) {
      console.error(`Error deleting document from ${collectionName}:`, error);
      throw error;
    }
  }
  
  /**
   * Get user by ID
   * 
   * @param {string} userId - The user ID
   * @returns {Promise<Object|null>} The user data or null
   */
  async getUser(userId) {
    if (!userId) {
      throw new Error('User ID is required');
    }
    return this.getDocument(COLLECTIONS.USERS, userId);
  }
  
  /**
   * Get profile by user ID
   * 
   * @param {string} userId - The user ID
   * @returns {Promise<Object|null>} The profile data or null
   */
  async getProfile(userId) {
    if (!userId) {
      throw new Error('User ID is required');
    }
    return this.getDocument(COLLECTIONS.PROFILES, userId);
  }
}

export default new FirebaseService(); 