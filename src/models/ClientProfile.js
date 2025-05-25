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
    this.userId = data.userId || null;
    this.companyName = data.companyName || '';
    this.industry = data.industry || '';
    this.website = data.website || '';
    this.location = data.location || '';
    this.contactEmail = data.contactEmail || '';
    this.contactPhone = data.contactPhone || '';
    this.bio = data.bio || '';
    this.profilePhoto = data.profilePhoto || null;
    this.preferences = data.preferences || {};
    this.hiredFreelancers = data.hiredFreelancers || [];
    this.paymentMethods = data.paymentMethods || [];
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }
}
