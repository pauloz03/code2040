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
    
    const circle = L.circleMarker([report.latitude, report.longitude], {
      radius: 10,
      fillColor: color,
      color: '#fff',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.8
    }).addTo(this.map)

    const popupContent = `
      <div style="min-width: 200px;">
        <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">
          ${this.formatType(report.type)} ${statusIcon}
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
    this.map.on('click', (e) => {
      callback(e.latlng.lat, e.latlng.lng)
    })
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
      streetlight: '#ffeb3b',    // Yellow
      pothole: '#f44336',        // Red
      sidewalk: '#2196f3',       // Blue
      graffiti: '#9c27b0',       // Purple
      trash: '#4caf50',          // Green
      other: '#9e9e9e'           // Gray
    }
    return colors[type] || colors.other
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
   * Destroy the map instance
   */
  destroy() {
    if (this.map) {
      this.map.remove()
      this.map = null
      this.markers = {}
      this.userMarker = null
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