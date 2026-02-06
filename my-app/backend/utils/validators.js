/**
 * Validation utilities for forms and data
 */
export const validators = {
  /**
   * Validate email format
   * @param {string} email 
   * @returns {boolean}
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },

  /**
   * Validate latitude (-90 to 90)
   * @param {number} latitude 
   * @returns {boolean}
   */
  isValidLatitude(latitude) {
    return typeof latitude === 'number' && latitude >= -90 && latitude <= 90
  },

  /**
   * Validate longitude (-180 to 180)
   * @param {number} longitude 
   * @returns {boolean}
   */
  isValidLongitude(longitude) {
    return typeof longitude === 'number' && longitude >= -180 && longitude <= 180
  },

  /**
   * Validate coordinates
   * @param {number} latitude 
   * @param {number} longitude 
   * @returns {boolean}
   */
  isValidCoordinates(latitude, longitude) {
    return this.isValidLatitude(latitude) && this.isValidLongitude(longitude)
  },

  /**
   * Validate report type
   * @param {string} type 
   * @returns {boolean}
   */
  isValidReportType(type) {
    const validTypes = ['streetlight', 'hydrant', 'pothole', 'sidewalk', 'graffiti', 'trash', 'other']
    return validTypes.includes(type)
  },

  /**
   * Validate report status
   * @param {string} status 
   * @returns {boolean}
   */
  isValidReportStatus(status) {
    const validStatuses = ['pending', 'in_progress', 'resolved']
    return validStatuses.includes(status)
  },

  /**
   * Validate required field
   * @param {*} value 
   * @returns {boolean}
   */
  isRequired(value) {
    if (typeof value === 'string') {
      return value.trim().length > 0
    }
    return value !== null && value !== undefined
  }
}

