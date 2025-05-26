/**
 * Base Service Class
 * Provides common functionality for all services including
 * error handling, logging, and standardized patterns
 */

import ErrorHandler from '../utils/errors';
import Logger from '../utils/logger';

export default class BaseService {
  constructor(repository = null) {
    this.repository = repository;
  }

  /**
   * Handle async operations with proper error handling and logging
   * @param {Function} operation - Async operation to execute
   * @param {string} operationName - Name of the operation for logging
   * @param {object} context - Additional context for logging
   * @returns {Promise<object>} - Result object with success/error status
   */
  async handleOperation(operation, operationName, context = {}) {
    return ErrorHandler.handleAsync(operation, operationName, context);
  }

  /**
   * Validate required fields before processing
   * @param {object} data - Data to validate
   * @param {array} requiredFields - Array of required field names
   * @throws {ValidationError} - If validation fails
   */
  validateRequired(data, requiredFields) {
    ErrorHandler.validateRequired(data, requiredFields);
  }

  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @throws {ValidationError} - If email is invalid
   */
  validateEmail(email) {
    ErrorHandler.validateEmail(email);
  }

  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @throws {ValidationError} - If password is weak
   */
  validatePassword(password) {
    ErrorHandler.validatePassword(password);
  }

  /**
   * Get entity by ID
   * @param {string} id - Entity ID
   * @returns {Promise<object>} - Result object
   */
  async getById(id) {
    if (!this.repository) {
      throw new Error('Repository not configured for this service');
    }

    return this.handleOperation(
      () => this.repository.findById(id),
      `${this.constructor.name}.getById`,
      { id }
    );
  }

  /**
   * Create new entity
   * @param {object} data - Entity data
   * @returns {Promise<object>} - Result object
   */
  async create(data) {
    if (!this.repository) {
      throw new Error('Repository not configured for this service');
    }

    return this.handleOperation(
      () => this.repository.create(data),
      `${this.constructor.name}.create`,
      { data }
    );
  }

  /**
   * Update entity
   * @param {string} id - Entity ID
   * @param {object} data - Update data
   * @returns {Promise<object>} - Result object
   */
  async update(id, data) {
    if (!this.repository) {
      throw new Error('Repository not configured for this service');
    }

    return this.handleOperation(
      () => this.repository.update(id, data),
      `${this.constructor.name}.update`,
      { id, data }
    );
  }

  /**
   * Delete entity
   * @param {string} id - Entity ID
   * @returns {Promise<object>} - Result object
   */
  async delete(id) {
    if (!this.repository) {
      throw new Error('Repository not configured for this service');
    }

    return this.handleOperation(
      () => this.repository.delete(id),
      `${this.constructor.name}.delete`,
      { id }
    );
  }

  /**
   * Find entities with filters
   * @param {object} filters - Filter criteria
   * @param {object} options - Query options (limit, orderBy, etc.)
   * @returns {Promise<object>} - Result object
   */
  async find(filters = {}, options = {}) {
    if (!this.repository) {
      throw new Error('Repository not configured for this service');
    }

    return this.handleOperation(
      () => this.repository.find(filters, options),
      `${this.constructor.name}.find`,
      { filters, options }
    );
  }

  /**
   * Log operation start
   * @param {string} operation - Operation name
   * @param {object} params - Operation parameters
   */
  logStart(operation, params = {}) {
    Logger.operationStart(`${this.constructor.name}.${operation}`, params);
  }

  /**
   * Log operation success
   * @param {string} operation - Operation name
   * @param {object} result - Operation result
   */
  logSuccess(operation, result = {}) {
    Logger.operationSuccess(`${this.constructor.name}.${operation}`, result);
  }

  /**
   * Log operation failure
   * @param {string} operation - Operation name
   * @param {Error} error - Error that occurred
   */
  logError(operation, error) {
    Logger.operationFailed(`${this.constructor.name}.${operation}`, error);
  }
} 