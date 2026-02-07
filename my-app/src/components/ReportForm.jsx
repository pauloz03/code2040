import React, { useState, useEffect } from 'react'
import { reportService } from '../../backend/services/reportService'
import { geolocationService } from '../../backend/utils/geolocation'
import { infrastructureService } from '../../backend/services/infrastructureService'
import '../App.css'

function ReportForm({ onClose, onReportSubmitted, initialLocation = null, targetLocation = null }) {
  const [type, setType] = useState('streetlight')
  const [description, setDescription] = useState('')
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [latitude, setLatitude] = useState(initialLocation?.latitude || null)
  const [longitude, setLongitude] = useState(initialLocation?.longitude || null)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const [locationError, setLocationError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [targetLatitude, setTargetLatitude] = useState(targetLocation?.latitude || null)
  const [targetLongitude, setTargetLongitude] = useState(targetLocation?.longitude || null)
  const [showAdvocateText, setShowAdvocateText] = useState(false)
  const [advocateText, setAdvocateText] = useState('')
  const [reportSubmitted, setReportSubmitted] = useState(false)

  // Get user location on mount if not provided
  useEffect(() => {
    if (!initialLocation && !latitude && !longitude && !targetLocation) {
      // Use setTimeout to avoid state updates during render
      setTimeout(() => {
        handleGetLocation()
      }, 0)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Update target location if prop changes
  useEffect(() => {
    if (targetLocation) {
      // Use setTimeout to avoid state updates during render
      setTimeout(() => {
        setTargetLatitude(targetLocation.latitude)
        setTargetLongitude(targetLocation.longitude)
        // Also set the form location to the target (hydrant) location
        setLatitude(targetLocation.latitude)
        setLongitude(targetLocation.longitude)
      }, 0)
    }
  }, [targetLocation])

  const handleGetLocation = async () => {
    setIsGettingLocation(true)
    setLocationError('')
    
    try {
      // Use faster, lower accuracy first, with fallback
      const position = await geolocationService.getCurrentPosition({
        timeout: 15000, // 15 seconds
        enableHighAccuracy: false, // Faster response
        fallbackToLowAccuracy: true,
        maximumAge: 300000 // Use cached location if less than 5 minutes old
      })
      setLatitude(position.latitude)
      setLongitude(position.longitude)
    } catch (error) {
      setLocationError(error.message)
    } finally {
      setIsGettingLocation(false)
    }
  }

  const handlePhotoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setSubmitError('Please select an image file')
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setSubmitError('Image size must be less than 5MB')
        return
      }

      setPhotoFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPhotoPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError('')

    // Validate location
    if (!latitude || !longitude) {
      setSubmitError('Please get your location first')
      return
    }

    // Validate description
    if (!description.trim()) {
      setSubmitError('Please provide a description')
      return
    }

    // If reporting on a specific target (like a fire hydrant), validate proximity
    if (targetLatitude && targetLongitude) {
      // Get current user location for proximity check
      let userLat = latitude
      let userLng = longitude
      
      // If the form location is the target location, get actual user location
      if (Math.abs(latitude - targetLatitude) < 0.0001 && 
          Math.abs(longitude - targetLongitude) < 0.0001) {
        try {
          setIsGettingLocation(true)
          const position = await geolocationService.getCurrentPosition({
            timeout: 10000,
            enableHighAccuracy: true, // Use high accuracy for proximity check
            fallbackToLowAccuracy: false,
            maximumAge: 0 // Don't use cached location
          })
          userLat = position.latitude
          userLng = position.longitude
        } catch (error) {
          setSubmitError('Unable to verify your location. Please enable location services.')
          setIsGettingLocation(false)
          return
        } finally {
          setIsGettingLocation(false)
        }
      }

      // Calculate distance to target (in meters)
      const distanceKm = infrastructureService.calculateDistance(
        userLat,
        userLng,
        targetLatitude,
        targetLongitude
      )
      const distanceMeters = distanceKm * 1000

      // Require user to be within 50 meters of the hydrant
      const maxDistanceMeters = 50
      
      if (distanceMeters > maxDistanceMeters) {
        setSubmitError(`You are not close to the object. You are ${Math.round(distanceMeters)} meters away. Please get within ${maxDistanceMeters} meters to report an issue.`)
        return
      }
    }

    setIsSubmitting(true)

    try {
      // Use target location (hydrant location) for the report, not user location
      const reportLatitude = targetLatitude || latitude
      const reportLongitude = targetLongitude || longitude

      const report = await reportService.createReport({
        latitude: reportLatitude,
        longitude: reportLongitude,
        type,
        description: description.trim(),
        photoFile
      })

      // Callback to parent component
      if (onReportSubmitted) {
        onReportSubmitted(report)
      }

      // Generate 311-ready complaint text
      const issueTypeText = type === 'streetlight' ? 'Broken Streetlight' :
                           type === 'hydrant' ? 'Broken Fire Hydrant' :
                           type === 'pothole' ? 'Pothole' :
                           type === 'sidewalk' ? 'Sidewalk Damage' :
                           type === 'graffiti' ? 'Graffiti' :
                           type === 'trash' ? 'Uncollected Trash/Debris' : 'Infrastructure Issue'
      
      const address = `${reportLatitude.toFixed(6)}, ${reportLongitude.toFixed(6)}`
      
      const complaint311 = `I am reporting a ${issueTypeText.toLowerCase()} at approximately ${address}. ${description.trim()}. This issue affects the safety and quality of life in our neighborhood. Please address this as soon as possible. Thank you.`
      
      setAdvocateText(complaint311)
      setReportSubmitted(true)
      setShowAdvocateText(true)
    } catch (error) {
      console.error('Error submitting report:', error)
      setSubmitError(error.message || 'Failed to submit report. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = (e) => {
    e?.stopPropagation()
    if (onClose) {
      onClose()
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(advocateText).then(() => {
      alert('311 complaint text copied to clipboard!')
    }).catch(err => {
      console.error('Failed to copy text:', err)
    })
  }

  // Calculate if location is in historically redlined area (placeholder logic)
  const isHistoricallyRedlined = latitude && longitude && (
    // Placeholder: You can replace this with actual HOLC data lookup
    // For demo, we'll use a simple geographic heuristic
    latitude > 40.7 && latitude < 40.75 && longitude > -74.0 && longitude < -73.95
  )

  const typicalCloseTime = isHistoricallyRedlined ? '9.4 days' : '4.1 days'

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            {reportSubmitted ? 'Report Submitted Successfully!' :
             targetLatitude && targetLongitude ? 'Report Fire Hydrant Issue' : 'Report Infrastructure Issue'}
          </h2>
          <button 
            className="close-btn" 
            onClick={handleClose}
            type="button"
            aria-label="Close"
          >×</button>
        </div>

        {reportSubmitted && showAdvocateText ? (
          <div className="report-form" style={{ padding: '2rem' }}>
            <div className="success-message" style={{ marginBottom: '2rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
              <p style={{ fontSize: '1.1rem', color: '#4caf50', fontWeight: 600 }}>Your report has been submitted!</p>
            </div>

            <div className="auto-advocate-section" style={{ marginTop: '2rem' }}>
              <h3 style={{ color: '#1e3c72', marginBottom: '1rem' }}>Auto-Advocate</h3>
              <p style={{ fontSize: '0.95rem', color: '#666', marginBottom: '1rem' }}>
                Copy this text and submit it to NYC 311 to create an official complaint:
              </p>
              <div style={{ 
                background: '#f5f5f5', 
                padding: '1rem', 
                borderRadius: '8px', 
                border: '1px solid #ddd',
                marginBottom: '1rem'
              }}>
                <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.6', color: '#333' }}>
                  {advocateText}
                </p>
              </div>
              <button 
                type="button" 
                className="btn-primary"
                onClick={copyToClipboard}
                style={{ width: '100%', marginBottom: '1rem' }}
              >
                📋 Copy 311 Complaint Text
              </button>
              <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>
                Submit this to <a href="https://portal.311.nyc.gov/" target="_blank" rel="noopener noreferrer" style={{ color: '#2196f3' }}>NYC 311</a> to create an official record.
              </p>
            </div>

            <div className="form-actions" style={{ marginTop: '2rem' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={handleClose}
                style={{ width: '100%' }}
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="report-form">
            {/* Equity Badge */}
            {latitude && longitude && (
              <div className={`equity-badge ${isHistoricallyRedlined ? 'redlined' : 'non-redlined'}`}>
                <div className="equity-badge-content">
                  <div className="equity-badge-item">
                    <span className="equity-label">Historically redlined zone:</span>
                    <span className="equity-value">{isHistoricallyRedlined ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="equity-badge-item">
                    <span className="equity-label">Typical close time here:</span>
                    <span className="equity-value">{typicalCloseTime}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Location Section */}
          <div className="form-section">
            <label className="form-label">Location</label>
            {targetLatitude && targetLongitude ? (
              <div className="location-info">
                <p className="location-coords">
                  🔥 Fire Hydrant: {targetLatitude.toFixed(6)}, {targetLongitude.toFixed(6)}
                </p>
                <p style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  Your location will be verified when you submit. You must be within 50 meters of the hydrant.
                </p>
              </div>
            ) : latitude && longitude ? (
              <div className="location-info">
                <p className="location-coords">
                  📍 {latitude.toFixed(6)}, {longitude.toFixed(6)}
                </p>
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={handleGetLocation}
                  disabled={isGettingLocation}
                >
                  {isGettingLocation ? 'Getting location...' : 'Update Location'}
                </button>
              </div>
            ) : (
              <div>
                <button 
                  type="button" 
                  className="btn-primary"
                  onClick={handleGetLocation}
                  disabled={isGettingLocation}
                >
                  {isGettingLocation ? 'Getting location...' : 'Get My Location'}
                </button>
                {locationError && (
                  <p className="error-msg">{locationError}</p>
                )}
              </div>
            )}
          </div>

          {/* Report Type */}
          <div className="form-section">
            <label className="form-label" htmlFor="report-type">Issue Type</label>
            <select
              id="report-type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="form-select"
              required
            >
              <option value="streetlight">Broken Streetlight</option>
              <option value="hydrant">Broken Fire Hydrant</option>
              <option value="pothole">Pothole</option>
              <option value="sidewalk">Sidewalk Issue</option>
              <option value="graffiti">Graffiti</option>
              <option value="trash">Trash/Debris</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Description */}
          <div className="form-section">
            <label className="form-label" htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-textarea"
              placeholder="Describe the issue..."
              rows="4"
              required
            />
          </div>

          {/* Photo Upload */}
          <div className="form-section">
            <label className="form-label" htmlFor="photo">Photo (Optional)</label>
            <input
              type="file"
              id="photo"
              accept="image/*"
              onChange={handlePhotoChange}
              className="form-file-input"
            />
            {photoPreview && (
              <div className="photo-preview">
                <img src={photoPreview} alt="Preview" />
                <button
                  type="button"
                  className="btn-remove-photo"
                  onClick={() => {
                    setPhotoFile(null)
                    setPhotoPreview(null)
                  }}
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {submitError && (
            <p className="error-msg">{submitError}</p>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting || !latitude || !longitude}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  )
}

export default ReportForm

