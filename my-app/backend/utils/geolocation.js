/**
 * Geolocation service for getting user's current location
 */
export const geolocationService = {
  /**
   * Get user's current location using browser Geolocation API
   * @param {Object} options - Geolocation options
   * @param {number} options.timeout - Timeout in milliseconds (default: 20000)
   * @param {number} options.maximumAge - Maximum age of cached position in milliseconds (default: 300000 = 5 minutes)
   * @param {boolean} options.enableHighAccuracy - Enable high accuracy (default: false for faster response)
   * @param {boolean} options.fallbackToLowAccuracy - If high accuracy times out, try low accuracy (default: true)
   * @returns {Promise<{latitude: number, longitude: number}>} User's coordinates
   */
  async getCurrentPosition(options = {}) {
    const {
      timeout = 8000, // 8 seconds - shorter timeout for faster failure
      maximumAge = 600000, // 10 minutes - use cached location if available (more lenient)
      enableHighAccuracy = false, // Changed to false for faster response
      fallbackToLowAccuracy = true,
      ...otherOptions
    } = options

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'))
        return
      }

      const attemptGetLocation = (highAccuracy) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: position.timestamp
            })
          },
          (error) => {
            // If high accuracy failed with timeout and fallback is enabled, try low accuracy
            if (highAccuracy && error.code === error.TIMEOUT && fallbackToLowAccuracy) {
              console.log('High accuracy timed out, trying low accuracy...')
              attemptGetLocation(false)
              return
            }

            let errorMessage = 'Unable to retrieve your location'
            
            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage = 'Location access denied. Please enable location permissions in your browser settings and refresh the page.'
                break
              case error.POSITION_UNAVAILABLE:
                errorMessage = 'Location information is unavailable. Please check your device\'s location settings.'
                break
              case error.TIMEOUT:
                errorMessage = 'Location request timed out. Please check your internet connection and try again, or click on the map to set a location manually.'
                break
            }
            
            reject(new Error(errorMessage))
          },
          {
            timeout,
            maximumAge,
            enableHighAccuracy: highAccuracy,
            ...otherOptions
          }
        )
      }

      // Start with the requested accuracy setting
      attemptGetLocation(enableHighAccuracy)
    })
  },

  /**
   * Watch user's position (continuous updates)
   * @param {Function} callback - Called with position updates
   * @param {Object} options - Geolocation options
   * @returns {number} Watch ID that can be used to stop watching
   */
  watchPosition(callback, options = {}) {
    const defaultOptions = {
      timeout: 10000,
      maximumAge: 60000,
      enableHighAccuracy: true,
      ...options
    }

    if (!navigator.geolocation) {
      throw new Error('Geolocation is not supported by your browser')
    }

    return navigator.geolocation.watchPosition(
      (position) => {
        callback({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        })
      },
      (error) => {
        let errorMessage = 'Unable to retrieve your location'
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable'
            break
          case error.TIMEOUT:
            errorMessage = 'Location request timed out'
            break
        }
        
        callback(null, new Error(errorMessage))
      },
      defaultOptions
    )
  },

  /**
   * Stop watching position
   * @param {number} watchId - Watch ID returned from watchPosition
   */
  clearWatch(watchId) {
    if (navigator.geolocation && watchId) {
      navigator.geolocation.clearWatch(watchId)
    }
  },

  /**
   * Check if geolocation is supported
   * @returns {boolean}
   */
  isSupported() {
    return !!navigator.geolocation
  }
}

