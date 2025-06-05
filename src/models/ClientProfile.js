import BaseModel from './BaseModel';

/**
 * ClientProfile model representing a client profile in the system
 */
export default class ClientProfile extends BaseModel {
  /**
   * Create a new ClientProfile instance
   * @param {Object} data - ClientProfile data
   */
  constructor(data = {}) {
    super(data);
    this.userID = data.userID || data.userId || null; // Support both userID and userId for compatibility
    this.bio = data.bio || '';
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }
}
