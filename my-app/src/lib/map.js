// src/lib/map.js
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix default marker icon issue with Vite/Webpack
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

export class MapService {
  constructor(containerId, options = {}) {
    const defaultOptions = {
      center: [40.7128, -74.0060], // NYC coordinates
      zoom: 13,
      ...options
    }

    this.map = L.map(containerId).setView(defaultOptions.center, defaultOptions.zoom)
    this.markers = {}
    this.userMarker = null
    this.infrastructureMarkers = {
      hydrants: [],
      streetlights: [],
      stopSigns: []
    }
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(this.map)
  }

  /**
   * Add a report marker to the map
   * @param {Object} report - Report object from database
   * @returns {L.CircleMarker} The created marker
   */
  addReportMarker(report) {
    const color = this.getColorByType(report.type)
    const statusIcon = this.getStatusIcon(report.status)
    const typeLabel = this.getTypeLabel(report.type)
    
    const circle = L.circleMarker([report.latitude, report.longitude], {
      radius: 12, // Slightly larger for better visibility
      fillColor: color,
      color: '#fff',
      weight: 3, // Thicker border for better visibility
      opacity: 1,
      fillOpacity: 0.9
    }).addTo(this.map)

    // Add tooltip (shows on hover)
    circle.bindTooltip(typeLabel, {
      permanent: false, // Only show on hover
      direction: 'top',
      offset: [0, -10],
      className: 'report-tooltip',
      opacity: 0.95
    })

    const popupContent = `
      <div style="min-width: 200px;">
        <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">
          ${typeLabel} ${statusIcon}
        </h3>
        <p style="margin: 4px 0; font-size: 14px;">
          <strong>Status:</strong> <span style="color: ${this.getStatusColor(report.status)};">${report.status}</span>
        </p>
        ${report.description ? `<p style="margin: 8px 0; font-size: 14px; color: #666;">${report.description}</p>` : ''}
        ${report.photo_url ? `<img src="${report.photo_url}" alt="Report photo" style="width: 100%; max-width: 250px; border-radius: 4px; margin-top: 8px;">` : ''}
        <p style="font-size: 12px; color: #999; margin: 8px 0 0 0;">
          Reported: ${new Date(report.created_at).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          })}
        </p>
      </div>
    `

    circle.bindPopup(popupContent, {
      maxWidth: 300
    })
    
    // Store marker reference with report ID
    this.markers[report.id] = circle

    return circle
  }

  /**
   * Remove a marker from the map
   * @param {string} reportId - ID of the report
   */
  removeMarker(reportId) {
    if (this.markers[reportId]) {
      this.map.removeLayer(this.markers[reportId])
      delete this.markers[reportId]
    }
  }

  /**
   * Update a marker (removes old one and adds new one)
   * @param {Object} report - Updated report object
   */
  updateMarker(report) {
    this.removeMarker(report.id)
    this.addReportMarker(report)
  }

  /**
   * Clear all report markers from the map
   */
  clearMarkers() {
    Object.values(this.markers).forEach(marker => {
      this.map.removeLayer(marker)
    })
    this.markers = {}
  }

  /**
   * Center map on a specific location
   * @param {number} latitude 
   * @param {number} longitude 
   * @param {number} zoom - Optional zoom level
   */
  centerOn(latitude, longitude, zoom = 15) {
    this.map.setView([latitude, longitude], zoom)
  }

  /**
   * Add or update user's current location marker
   * @param {number} latitude 
   * @param {number} longitude 
   * @returns {L.Marker} The user location marker
   */
  addUserLocation(latitude, longitude) {
    // Remove old user marker if exists
    if (this.userMarker) {
      this.map.removeLayer(this.userMarker)
    }

    const userIcon = L.divIcon({
      className: 'user-location-marker',
      html: `
        <div style="
          position: relative;
          width: 20px;
          height: 20px;
        ">
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #4285f4;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 0 10px rgba(0,0,0,0.3);
          "></div>
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(66, 133, 244, 0.2);
            width: 40px;
            height: 40px;
            border-radius: 50%;
            animation: pulse 2s infinite;
          "></div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    })

    this.userMarker = L.marker([latitude, longitude], { 
      icon: userIcon,
      zIndexOffset: 1000 // Keep user marker on top
    }).addTo(this.map)

    this.userMarker.bindPopup('Your Location')

    return this.userMarker
  }

  /**
   * Remove user location marker
   */
  removeUserLocation() {
    if (this.userMarker) {
      this.map.removeLayer(this.userMarker)
      this.userMarker = null
    }
  }

  /**
   * Add click handler to map
   * @param {Function} callback - Called with (latitude, longitude) when map is clicked
   */
  onMapClick(callback) {
    if (!this.map) {
      console.warn('Map not initialized yet, cannot add click handler')
      return
    }
    this.map.on('click', (e) => {
      callback(e.latlng.lat, e.latlng.lng)
    })
  }

  /**
   * Add click handler for fire hydrant markers
   * @param {Function} callback - Called with (latitude, longitude, hydrantData) when hydrant is clicked
   */
  onHydrantClick(callback) {
    if (!this.map) {
      console.warn('Map not initialized yet, cannot add hydrant click handler')
      return
    }
    this.onHydrantClick = callback
  }

  /**
   * Fit map bounds to show all markers
   */
  fitToMarkers() {
    const markerArray = Object.values(this.markers)
    if (markerArray.length === 0) return

    const group = L.featureGroup(markerArray)
    this.map.fitBounds(group.getBounds().pad(0.1))
  }

  /**
   * Get color based on report type
   * @param {string} type 
   * @returns {string} Hex color
   */
  getColorByType(type) {
    const colors = {
      streetlight: '#FFD700',    // Gold/Yellow - bright and distinct
      pothole: '#FF4444',        // Bright Red - urgent
      sidewalk: '#2196F3',        // Blue - clear and visible
      graffiti: '#9C27B0',       // Purple - distinct
      trash: '#4CAF50',          // Green - clear
      hydrant: '#FF6B35',        // Orange/Red - distinct for fire hydrants
      other: '#757575'           // Gray - neutral
    }
    return colors[type] || colors.other
  }

  /**
   * Get user-friendly label for report type
   * @param {string} type 
   * @returns {string} Formatted label
   */
  getTypeLabel(type) {
    const labels = {
      streetlight: 'Broken Streetlight',
      pothole: 'Pothole',
      sidewalk: 'Sidewalk Issue',
      graffiti: 'Graffiti',
      trash: 'Trash/Debris',
      hydrant: 'Broken Fire Hydrant',
      other: 'Other Issue'
    }
    return labels[type] || this.formatType(type)
  }

  /**
   * Get status icon emoji
   * @param {string} status 
   * @returns {string} Emoji
   */
  getStatusIcon(status) {
    const icons = {
      pending: '⏳',
      in_progress: '🔧',
      resolved: '✅'
    }
    return icons[status] || ''
  }

  /**
   * Get status color
   * @param {string} status 
   * @returns {string} Hex color
   */
  getStatusColor(status) {
    const colors = {
      pending: '#ff9800',      // Orange
      in_progress: '#2196f3',  // Blue
      resolved: '#4caf50'      // Green
    }
    return colors[status] || '#9e9e9e'
  }

  /**
   * Format type for display
   * @param {string} type 
   * @returns {string} Formatted string
   */
  formatType(type) {
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  /**
   * Get the Leaflet map instance
   * @returns {L.Map}
   */
  getMap() {
    return this.map
  }

  /**
   * Add fire hydrant markers to the map
   * @param {Array} hydrants - Array of hydrant objects with latitude and longitude
   */
  addFireHydrants(hydrants) {
    // Clear existing hydrant markers
    this.clearInfrastructureMarkers('hydrants')
    
    console.log('Adding', hydrants.length, 'fire hydrants to map')
    
    if (!hydrants || hydrants.length === 0) {
      console.log('No hydrants to add')
      return
    }
    
    hydrants.forEach((hydrant, index) => {
      if (!hydrant.latitude || !hydrant.longitude) {
        console.warn('Invalid hydrant data:', hydrant)
        return
      }
      // Create a custom icon for fire hydrants
      const hydrantIcon = L.divIcon({
        className: 'fire-hydrant-marker',
        html: `
          <div style="
            width: 12px;
            height: 12px;
            background: #FF0000;
            border: 2px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          "></div>
        `,
        iconSize: [12, 12],
        iconAnchor: [6, 6]
      })
      
      const marker = L.marker([hydrant.latitude, hydrant.longitude], {
        icon: hydrantIcon,
        zIndexOffset: 100 // Keep infrastructure markers above base map but below reports
      }).addTo(this.map)
      
      marker.bindTooltip('Fire Hydrant', {
        permanent: false,
        direction: 'top',
        offset: [0, -8],
        className: 'infrastructure-tooltip'
      })
      
      // Store hydrant data on marker for click handler
      marker.hydrantData = hydrant
      
      marker.bindPopup(`
        <div style="min-width: 150px;">
          <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #FF0000;">
            🔥 Fire Hydrant
          </h3>
          <p style="margin: 4px 0; font-size: 12px; color: #666;">
            Location: ${hydrant.latitude.toFixed(6)}, ${hydrant.longitude.toFixed(6)}
          </p>
          <button 
            id="report-hydrant-btn" 
            style="
              margin-top: 8px;
              padding: 6px 12px;
              background: #FF0000;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              font-size: 12px;
              width: 100%;
            "
            onmouseover="this.style.background='#cc0000'"
            onmouseout="this.style.background='#FF0000'"
          >
            Report Issue
          </button>
        </div>
      `, {
        maxWidth: 200
      })
      
      // Handle popup button click when popup opens
      marker.on('popupopen', () => {
        // Use setTimeout to ensure DOM is ready
        setTimeout(() => {
          const popup = marker.getPopup()
          const popupElement = popup.getElement()
          if (popupElement) {
            const reportBtn = popupElement.querySelector('#report-hydrant-btn')
            if (reportBtn && this.onHydrantClick) {
              reportBtn.onclick = (e) => {
                e.stopPropagation()
                e.preventDefault()
                this.onHydrantClick(hydrant.latitude, hydrant.longitude, hydrant)
                this.map.closePopup()
              }
            }
          }
        }, 10)
      })
      
      this.infrastructureMarkers.hydrants.push(marker)
    })
  }

  /**
   * Clear infrastructure markers of a specific type
   * @param {string} type - 'hydrants' | 'streetlights' | 'stopSigns' | 'all'
   */
  clearInfrastructureMarkers(type = 'all') {
    if (type === 'all') {
      Object.keys(this.infrastructureMarkers).forEach(key => {
        this.infrastructureMarkers[key].forEach(marker => {
          this.map.removeLayer(marker)
        })
        this.infrastructureMarkers[key] = []
      })
    } else if (this.infrastructureMarkers[type]) {
      this.infrastructureMarkers[type].forEach(marker => {
        this.map.removeLayer(marker)
      })
      this.infrastructureMarkers[type] = []
    }
  }

  /**
   * Get current map bounds
   * @returns {Object} Bounds object with north, south, east, west
   */
  getBounds() {
    const bounds = this.map.getBounds()
    return {
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest()
    }
  }

  /**
   * Add event listener for map move/zoom to update infrastructure data
   * @param {Function} callback - Called when map bounds change
   */
  onBoundsChange(callback) {
    this.map.on('moveend', () => {
      callback(this.getBounds())
    })
    this.map.on('zoomend', () => {
      callback(this.getBounds())
    })
  }

  /**
   * Destroy the map instance
   */
  destroy() {
    if (this.map) {
      this.map.remove()
      this.map = null
      this.markers = {}
      this.userMarker = null
      this.infrastructureMarkers = {
        hydrants: [],
        streetlights: [],
        stopSigns: []
      }
    }
  }
}

// Add CSS animation for pulsing effect
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = `
    @keyframes pulse {
      0% {
        transform: translate(-50%, -50%) scale(1);
        opacity: 1;
      }
      100% {
        transform: translate(-50%, -50%) scale(2);
        opacity: 0;
      }
    }
  `
  document.head.appendChild(style)
}