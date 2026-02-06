import React, { useEffect, useState, useRef } from 'react'
import '../App.css'
import { MapService } from '../lib/map'
import { reportService } from '../../backend/services/reportService'
import { geolocationService } from '../../backend/utils/geolocation'
import ReportForm from '../components/ReportForm'

function Dashboard() {
  const [mapService, setMapService] = useState(null)
  const [userLocation, setUserLocation] = useState(null)
  const [reports, setReports] = useState([])
  const [showReportForm, setShowReportForm] = useState(false)
  const [isLoadingLocation, setIsLoadingLocation] = useState(true)
  const [locationError, setLocationError] = useState('')
  const mapContainerRef = useRef(null)
  const mapClickHandlerRef = useRef(null)

  const loadUserLocation = async (showLoading = true) => {
    if (showLoading) {
      setIsLoadingLocation(true)
    }
    setLocationError('')
    
    try {
      // Use very lenient settings for location
      const position = await geolocationService.getCurrentPosition({
        timeout: 10000, // 10 seconds - shorter timeout
        enableHighAccuracy: false, // Faster response
        fallbackToLowAccuracy: true,
        maximumAge: 600000 // Use cached location if less than 10 minutes old
      })
      setUserLocation({
        latitude: position.latitude,
        longitude: position.longitude
      })
      setLocationError('') // Clear any previous errors
    } catch (error) {
      console.error('Error getting location:', error)
      setLocationError(error.message)
      // Don't block the app if location fails
    } finally {
      if (showLoading) {
        setIsLoadingLocation(false)
      }
    }
  }

  const skipLocation = () => {
    setIsLoadingLocation(false)
    setLocationError('')
    // User can still click on map or use report form to set location
  }

  const loadReports = async () => {
    try {
      const allReports = await reportService.getAllReports()
      setReports(allReports)
    } catch (error) {
      console.error('Error loading reports:', error)
    }
  }

  const handleReportSubmitted = (newReport) => {
    // Add new report to the list
    setReports(prevReports => [newReport, ...prevReports])
    
    // Add marker to map immediately
    if (mapService) {
      mapService.addReportMarker(newReport)
    }
  }

  // Initialize map and load data
  useEffect(() => {
    // Initialize map
    const defaultCenter = [40.7128, -74.0060] // NYC default
    const map = new MapService('dashboard-map', {
      center: defaultCenter,
      zoom: 13
    })
    setMapService(map)

    // Set up map click handler
    const handleMapClick = (lat, lng) => {
      // If clicking on map, open report form with that location
      if (!showReportForm) {
        setUserLocation({ latitude: lat, longitude: lng })
        setShowReportForm(true)
      }
    }
    
    map.onMapClick(handleMapClick)
    mapClickHandlerRef.current = handleMapClick

    // Try to get user location (non-blocking, don't wait for it)
    loadUserLocation(true).catch(() => {
      // Silently fail - location is optional
      setIsLoadingLocation(false)
    })

    // Load existing reports
    loadReports()

    // Cleanup on unmount
    return () => {
      map.destroy()
    }
  }, [])

  // Update map click handler when showReportForm changes
  useEffect(() => {
    if (mapService) {
      // Remove old handler and add new one
      const handleMapClick = (lat, lng) => {
        if (!showReportForm) {
          setUserLocation({ latitude: lat, longitude: lng })
          setShowReportForm(true)
        }
      }
      // Note: MapService.onMapClick adds a new listener each time
      // In a production app, you'd want to remove old listeners first
      mapService.onMapClick(handleMapClick)
      mapClickHandlerRef.current = handleMapClick
    }
  }, [mapService, showReportForm])

  // Update map when user location changes
  useEffect(() => {
    if (mapService && userLocation) {
      mapService.addUserLocation(userLocation.latitude, userLocation.longitude)
      mapService.centerOn(userLocation.latitude, userLocation.longitude, 15)
    }
  }, [mapService, userLocation])

  // Update map when reports change
  useEffect(() => {
    if (mapService && reports.length > 0) {
      // Clear existing markers
      mapService.clearMarkers()
      
      // Add all report markers
      reports.forEach(report => {
        mapService.addReportMarker(report)
      })

      // Fit map to show all markers if we have user location
      if (userLocation) {
        // Fit to show both user location and reports
        const allMarkers = Object.values(mapService.markers)
        if (allMarkers.length > 0) {
          mapService.fitToMarkers()
        }
      }
    }
  }, [mapService, reports, userLocation])

  return (
    <div className="dashboard-page">
      <h1>Welcome to Reporters!</h1>
      <p className="dashboard-msg">
        Report infrastructure issues in your area
      </p>

      {isLoadingLocation && (
        <div className="location-status-container">
          <p className="location-status">Getting your location...</p>
          <button 
            className="btn-skip"
            onClick={skipLocation}
          >
            Skip
          </button>
        </div>
      )}
      
      {locationError && !isLoadingLocation && (
        <div className="location-error-container">
          <p className="location-error">
            {locationError}
          </p>
          <button 
            className="btn-retry"
            onClick={() => loadUserLocation(true)}
          >
            Try Again
          </button>
        </div>
      )}

      <div className="dashboard-controls">
        <button 
          className="btn-report"
          onClick={() => setShowReportForm(true)}
        >
          + Report Issue
        </button>
        <button 
          className="btn-location"
          onClick={() => loadUserLocation(true)}
        >
          {userLocation ? '📍 Update Location' : '📍 Get My Location'}
        </button>
      </div>

      <div 
        id="dashboard-map" 
        ref={mapContainerRef}
        style={{ 
          width: '100%', 
          maxWidth: 1000, 
          height: 500, 
          margin: '2rem auto', 
          borderRadius: '12px', 
          boxShadow: '0 2px 16px rgba(0,0,0,0.15)',
          zIndex: 1
        }}
      ></div>

      {showReportForm && (
        <ReportForm
          onClose={() => setShowReportForm(false)}
          onReportSubmitted={handleReportSubmitted}
          initialLocation={userLocation}
        />
      )}
    </div>
  )
}

export default Dashboard
