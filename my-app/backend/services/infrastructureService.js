/**
 * Service for fetching infrastructure data from local CSV file
 */

const HYDRANTS_CSV_PATH = '/hydrants.csv'

// Cache for parsed hydrant data
let hydrantsCache = null
let isLoadingCache = false

/**
 * Parse a CSV line, handling quoted fields
 * @param {string} line - CSV line to parse
 * @returns {Array} Array of field values
 */
function parseCSVLine(line) {
  const fields = []
  let currentField = ''
  let insideQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === '"') {
      if (insideQuotes && line[i + 1] === '"') {
        // Escaped quote
        currentField += '"'
        i++ // Skip next quote
      } else {
        // Toggle quote state
        insideQuotes = !insideQuotes
      }
    } else if (char === ',' && !insideQuotes) {
      // Field separator
      fields.push(currentField.trim())
      currentField = ''
    } else {
      currentField += char
    }
  }
  
  // Add last field
  fields.push(currentField.trim())
  
  return fields
}

/**
 * Load and parse the CSV file
 * @returns {Promise<Array>} Array of hydrant objects with latitude and longitude
 */
async function loadHydrantsCSV() {
  if (hydrantsCache) {
    return hydrantsCache
  }
  
  if (isLoadingCache) {
    // Wait for ongoing load to complete
    while (isLoadingCache) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    return hydrantsCache
  }
  
  isLoadingCache = true
  
  try {
    console.log('Loading hydrants CSV from:', HYDRANTS_CSV_PATH)
    const response = await fetch(HYDRANTS_CSV_PATH)
    
    if (!response.ok) {
      throw new Error(`Failed to load CSV: ${response.statusText}`)
    }
    
    const text = await response.text()
    const lines = text.split('\n').filter(line => line.trim())
    
    if (lines.length === 0) {
      throw new Error('CSV file is empty')
    }
    
    // Parse header
    const header = parseCSVLine(lines[0])
    console.log('CSV Header:', header)
    
    // Find column indices
    const latIndex = header.findIndex(col => col === 'LATITUDE' || col === 'latitude')
    const lngIndex = header.findIndex(col => col === 'LONGITUDE' || col === 'longitude')
    
    if (latIndex === -1 || lngIndex === -1) {
      throw new Error('Could not find LATITUDE or LONGITUDE columns in CSV')
    }
    
    console.log(`Found LATITUDE at index ${latIndex}, LONGITUDE at index ${lngIndex}`)
    
    // Parse data rows
    const hydrants = []
    
    for (let i = 1; i < lines.length; i++) {
      const fields = parseCSVLine(lines[i])
      
      if (fields.length <= Math.max(latIndex, lngIndex)) {
        continue // Skip incomplete rows
      }
      
      const latitude = parseFloat(fields[latIndex])
      const longitude = parseFloat(fields[lngIndex])
      
      // Validate coordinates (NYC area)
      if (!isNaN(latitude) && !isNaN(longitude) && 
          latitude >= 40 && latitude <= 41 && 
          longitude >= -75 && longitude <= -73) {
        hydrants.push({
          latitude,
          longitude
        })
      }
    }
    
    console.log(`Loaded ${hydrants.length} fire hydrants from CSV`)
    hydrantsCache = hydrants
    isLoadingCache = false
    
    return hydrants
  } catch (error) {
    isLoadingCache = false
    console.error('Error loading hydrants CSV:', error)
    throw error
  }
}

export const infrastructureService = {
  /**
   * Fetch fire hydrants within a bounding box
   * @param {Object} bounds - Map bounds { north, south, east, west }
   * @param {number} limit - Maximum number of hydrants to return (default: 500)
   * @returns {Promise<Array>} Array of fire hydrant objects with lat/lng
   */
  async getFireHydrants(bounds, limit = 500) {
    try {
      console.log('Fetching fire hydrants for bounds:', bounds)
      
      // Load CSV if not cached
      const allHydrants = await loadHydrantsCSV()
      
      // Filter by bounds
      const filteredHydrants = allHydrants.filter(hydrant => {
        return hydrant.latitude >= bounds.south && 
               hydrant.latitude <= bounds.north && 
               hydrant.longitude >= bounds.west && 
               hydrant.longitude <= bounds.east
      })
      
      // Limit results
      const limitedHydrants = filteredHydrants.slice(0, limit)
      
      console.log(`Found ${limitedHydrants.length} fire hydrants in bounds (${filteredHydrants.length} total, limited to ${limit})`)
      
      return limitedHydrants
    } catch (error) {
      console.error('Error fetching fire hydrants:', error)
      throw error
    }
  },

  /**
   * Fetch fire hydrants within a radius of a location
   * @param {number} latitude 
   * @param {number} longitude 
   * @param {number} radiusKm - Radius in kilometers (default: 2km)
   * @param {number} limit - Maximum number of hydrants to fetch
   * @returns {Promise<Array>} Array of fire hydrant objects
   */
  async getFireHydrantsNearby(latitude, longitude, radiusKm = 2, limit = 500) {
    // Calculate bounding box from center point and radius
    // Approximate: 1 degree latitude ≈ 111 km
    const latDelta = radiusKm / 111
    const lngDelta = radiusKm / (111 * Math.cos(latitude * Math.PI / 180))
    
    const bounds = {
      north: latitude + latDelta,
      south: latitude - latDelta,
      east: longitude + lngDelta,
      west: longitude - lngDelta
    }
    
    const hydrants = await this.getFireHydrants(bounds, limit * 2) // Get more to filter by distance
    
    // Filter by actual distance (more accurate than bounding box)
    const nearbyHydrants = hydrants.filter(hydrant => {
      const distance = this.calculateDistance(
        latitude,
        longitude,
        hydrant.latitude,
        hydrant.longitude
      )
      return distance <= radiusKm
    }).slice(0, limit)
    
    return nearbyHydrants
  },

  /**
   * Calculate distance between two points using Haversine formula
   * @param {number} lat1 
   * @param {number} lng1 
   * @param {number} lat2 
   * @param {number} lng2 
   * @returns {number} Distance in kilometers
   */
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371 // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  },

  /**
   * Clear the cache (useful for testing or reloading data)
   */
  clearCache() {
    hydrantsCache = null
  }
}
