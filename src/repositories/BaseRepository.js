import { db } from '../firebase/config';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  addDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp 
} from 'firebase/firestore';

/**
 * Base repository for database operations
 */
export default class BaseRepository {
  /**
   * Create a new base repository
   * @param {string} collectionName - Firestore collection name
   * @param {Class} modelClass - Model class to use
   */
  constructor(collectionName, modelClass) {
    this.collectionName = collectionName;
    this.modelClass = modelClass;
    this.collectionRef = collection(db, collectionName);
  }

  /**
   * Find a document by ID
   * @param {string} id - Document ID
   * @returns {Promise<Object|null>} Document data or null
   */
  async findById(id) {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return this.modelClass.fromFirestore(docSnap.id, docSnap.data());
      }

      return null;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find documents with query
   * @param {Object} options - Query options
   * @param {Array} options.filters - Array of filter objects with field, operator, and value
   * @param {string} options.orderByField - Field to order by
   * @param {string} options.orderDirection - Direction to order (asc/desc)
   * @param {number} options.limitCount - Number of documents to limit
   * @returns {Promise<Array>} Array of model instances
   */
  async find(options = {}) {
    try {
      const { filters = [], orderByField, orderDirection = 'desc', limitCount } = options;
      
      let q = this.collectionRef;
      
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
        documents.push(
          this.modelClass.fromFirestore(doc.id, doc.data())
        );
      });
      
      return documents;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create a document with specified ID
   * @param {string} id - Document ID
   * @param {Object} data - Model instance or plain data
   * @param {boolean} merge - Whether to merge with existing document
   * @returns {Promise<string>} Document ID
   */
  async create(id, data, merge = false) {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docData = data instanceof this.modelClass 
        ? data.toFirestore() 
        : data;
      
      // Add timestamps
      const timestampedData = {
        ...docData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await setDoc(docRef, timestampedData, { merge });
      return id;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create a document with auto-generated ID
   * @param {Object} data - Model instance or plain data
   * @returns {Promise<string>} The new document ID
   */
  async add(data) {
    try {
      const docData = data instanceof this.modelClass 
        ? data.toFirestore() 
        : data;
        
      // Add timestamps
      const timestampedData = {
        ...docData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(this.collectionRef, timestampedData);
      return docRef.id;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update a document
   * @param {string} id - Document ID
   * @param {Object} data - Model instance or plain data
   * @returns {Promise<void>}
   */
  async update(id, data) {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docData = data instanceof this.modelClass 
        ? data.toFirestore() 
        : data;
      
      // Add updated timestamp
      const timestampedData = {
        ...docData,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(docRef, timestampedData);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete a document
   * @param {string} id - Document ID
   * @returns {Promise<void>}
   */
  async delete(id) {
    try {
      const docRef = doc(db, this.collectionName, id);
      await deleteDoc(docRef);
    } catch (error) {
      throw error;
    }
  }
} 