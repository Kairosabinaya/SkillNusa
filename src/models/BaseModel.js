/**
 * Base model class that all models will inherit from
 */
export default class BaseModel {
  constructor(data = {}) {
    this.id = data.id || null;
    this.createdAt = data.createdAt || null;
    this.updatedAt = data.updatedAt || null;
  }

  /**
   * Convert model to plain object for firestore
   * @returns {Object} Plain object representation
   */
  toFirestore() {
    // Remove undefined fields and return plain object
    return Object.entries(this).reduce((obj, [key, value]) => {
      if (value !== undefined) {
        obj[key] = value;
      }
      return obj;
    }, {});
  }

  /**
   * Create an instance from firestore data
   * @param {string} id - Document ID
   * @param {Object} data - Document data
   * @returns {BaseModel} Model instance
   */
  static fromFirestore(id, data) {
    return new this({
      id,
      ...data
    });
  }
} 