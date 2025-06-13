import BaseModel from './BaseModel';

export class Order extends BaseModel {
  constructor(data = {}) {
    super(data);
    this.clientId = data.clientId || '';
    this.freelancerId = data.freelancerId || '';
    this.gigId = data.gigId || '';
    this.packageType = data.packageType || 'basic'; // basic, standard, premium
    this.title = data.title || '';
    this.description = data.description || '';
    this.price = data.price || 0;
    this.deliveryTime = data.deliveryTime || '';
    this.revisions = data.revisions || 0;
    this.status = data.status || 'pending'; // payment, pending, in_progress, in_review, completed, cancelled, dispute
    this.requirements = data.requirements || '';
    this.paymentStatus = data.paymentStatus || 'pending'; // pending, paid, refunded
    this.deliveryDate = data.deliveryDate || null;
    this.completedAt = data.completedAt || null;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  static getCollectionName() {
    return 'orders';
  }

  validate() {
    const errors = {};
    
    if (!this.clientId) {
      errors.clientId = 'Client ID is required';
    }
    
    if (!this.freelancerId) {
      errors.freelancerId = 'Freelancer ID is required';
    }
    
    if (!this.gigId) {
      errors.gigId = 'Gig ID is required';
    }
    
    if (!this.title) {
      errors.title = 'Order title is required';
    }
    
    if (!this.price || this.price <= 0) {
      errors.price = 'Valid price is required';
    }

    return errors;
  }

  getStatusLabel() {
    const statusLabels = {
      pending: 'Menunggu Konfirmasi',
      in_progress: 'Sedang Dikerjakan',
      in_review: 'Dalam Review',
      completed: 'Selesai',
      cancelled: 'Dibatalkan',
      dispute: 'Dalam Sengketa'
    };
    return statusLabels[this.status] || this.status;
  }

  getStatusColor() {
    const statusColors = {
      payment: 'orange',
      pending: 'yellow',
      in_progress: 'blue',
      in_review: 'orange',
      completed: 'green',
      cancelled: 'red',
      dispute: 'purple'
    };
    return statusColors[this.status] || 'gray';
  }

  getStatusText() {
    const statusTexts = {
      payment: 'Menunggu Pembayaran',
      pending: 'Menunggu Konfirmasi',
      in_progress: 'Sedang Dikerjakan',
      in_review: 'Review Client',
      completed: 'Selesai',
      cancelled: 'Dibatalkan',
      dispute: 'Sengketa'
    };
    return statusTexts[this.status] || this.status;
  }

  toJSON() {
    return {
      id: this.id,
      clientId: this.clientId,
      freelancerId: this.freelancerId,
      gigId: this.gigId,
      packageType: this.packageType,
      title: this.title,
      description: this.description,
      price: this.price,
      deliveryTime: this.deliveryTime,
      revisions: this.revisions,
      status: this.status,
      requirements: this.requirements,
      paymentStatus: this.paymentStatus,
      deliveryDate: this.deliveryDate,
      completedAt: this.completedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

export default Order; 