import BaseModel from './BaseModel';

export class Favorite extends BaseModel {
  constructor(data = {}) {
    super(data);
    this.userId = data.userId || '';
    this.gigId = data.gigId || '';
    this.createdAt = data.createdAt || new Date();
  }

  static getCollectionName() {
    return 'favorites';
  }

  validate() {
    const errors = {};
    
    if (!this.userId) {
      errors.userId = 'User ID is required';
    }
    
    if (!this.gigId) {
      errors.gigId = 'Gig ID is required';
    }

    return errors;
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      gigId: this.gigId,
      createdAt: this.createdAt
    };
  }
}

export default Favorite; 