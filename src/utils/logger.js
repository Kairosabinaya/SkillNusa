/**
 * Unified Logging Service for SkillNusa
 * Provides structured logging with different levels and environment-aware output
 */

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

const currentLogLevel = process.env.NODE_ENV === 'production' ? LOG_LEVELS.ERROR : LOG_LEVELS.DEBUG;

class Logger {
  /**
   * Log an error message
   * @param {string} message - Error message
   * @param {Error|object} error - Error object or additional data
   * @param {object} context - Additional context information
   */
  static error(message, error = {}, context = {}) {
    if (currentLogLevel >= LOG_LEVELS.ERROR) {
      console.error(`[ERROR] ${message}`, {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error,
        context,
        timestamp: new Date().toISOString()
      });
      
      // In production, send to monitoring service
      if (process.env.NODE_ENV === 'production') {
        this.sendToMonitoring('error', message, error, context);
      }
    }
  }

  /**
   * Log a warning message
   * @param {string} message - Warning message
   * @param {object} data - Additional data
   */
  static warn(message, data = {}) {
    if (currentLogLevel >= LOG_LEVELS.WARN) {
      console.warn(`[WARN] ${message}`, {
        data,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Log an info message
   * @param {string} message - Info message
   * @param {object} data - Additional data
   */
  static info(message, data = {}) {
    if (currentLogLevel >= LOG_LEVELS.INFO) {
      console.log(`[INFO] ${message}`, {
        data,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Log a debug message (development only)
   * @param {string} message - Debug message
   * @param {object} data - Additional data
   */
  static debug(message, data = {}) {
    if (currentLogLevel >= LOG_LEVELS.DEBUG && process.env.NODE_ENV === 'development') {
      console.log(`[DEBUG] ${message}`, {
        data,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Log operation start
   * @param {string} operation - Operation name
   * @param {object} params - Operation parameters
   */
  static operationStart(operation, params = {}) {
    this.debug(`Starting operation: ${operation}`, { params });
  }

  /**
   * Log operation success
   * @param {string} operation - Operation name
   * @param {object} result - Operation result
   */
  static operationSuccess(operation, result = {}) {
    this.debug(`Operation successful: ${operation}`, { result });
  }

  /**
   * Log operation failure
   * @param {string} operation - Operation name
   * @param {Error} error - Error that occurred
   */
  static operationFailed(operation, error) {
    this.error(`Operation failed: ${operation}`, error);
  }

  /**
   * Send logs to monitoring service (placeholder for production)
   * @private
   */
  static sendToMonitoring(level, message, error, context) {
    // TODO: Implement monitoring service integration
    // Examples: Sentry, LogRocket, DataDog, etc.
  }
}

export default Logger;
export const logger = Logger; 