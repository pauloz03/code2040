import React, { useEffect, useState, useRef, useCallback } from 'react'
import '../App.css'
import { MapService } from '../lib/map'
import { reportService } from '../../backend/services/reportService'
import { geolocationService } from '../../backend/utils/geolocation'
import { infrastructureService } from '../../backend/services/infrastructureService'
import ReportForm from '../components/ReportForm'

function Dashboard() {
  const [mapService, setMapService] = useState(null)
  const [userLocation, setUserLocation] = useState(null)
  const [reports, setReports] = useState([])
  const [showReportForm, setShowReportForm] = useState(false)
  const [isLoadingLocation, setIsLoadingLocation] = useState(true)
  const [locationError, setLocationError] = useState('')
  const [infrastructureVisibility, setInfrastructureVisibility] = useState({
    hydrants: false,
    streetlights: false,
    stopSigns: false
  })
  const [isLoadingHydrants, setIsLoadingHydrants] = useState(false)
  const [targetLocation, setTargetLocation] = useState(null) // For hydrant reports
  const mapContainerRef = useRef(null)
  const boundsChangeTimeoutRef = useRef(null)
  const mapInitializedRef = useRef(false)

  const loadUserLocation = async (showLoading = true) => {
    if (showLoading) {
      setIsLoadingLocation(true)
    }
    setLocationError('')
    
    try {
      const position = await geolocationService.getCurrentPosition({
        timeout: 10000,
        enableHighAccuracy: false,
        fallbackToLowAccuracy: true,
        maximumAge: 600000
      })
      setUserLocation({
        latitude: position.latitude,
        longitude: position.longitude
      })
      setLocationError('')
    } catch (error) {
      console.error('Error getting location:', error)
      setLocationError(error.message)
    } finally {
      if (showLoading) {
        setIsLoadingLocation(false)
      }
    }
  }

  const skipLocation = () => {
    setIsLoadingLocation(false)
    setLocationError('')
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
    setReports(prevReports => [newReport, ...prevReports])
    
    if (mapService) {
      mapService.addReportMarker(newReport)
    }
    
    setTargetLocation(null)
  }

  const handleHydrantClick = (lat, lng, hydrantData) => {
    setTargetLocation({
      latitude: lat,
      longitude: lng
    })
    setShowReportForm(true)
  }

  const loadFireHydrants = useCallback(async (bounds) => {
    if (!mapService || !infrastructureVisibility.hydrants) {
      return
    }

    setIsLoadingHydrants(true)
    try {
      const hydrants = await infrastructureService.getFireHydrants(bounds, 500)
      if (mapService && hydrants.length > 0) {
        mapService.addFireHydrants(hydrants)
      }
    } catch (error) {
      console.error('Error loading fire hydrants:', error)
      alert('Failed to load fire hydrants. Check console for details.')
    } finally {
      setIsLoadingHydrants(false)
    }
  }, [mapService, infrastructureVisibility.hydrants])

  const handleInfrastructureToggle = async (type) => {
    const newVisibility = {
      ...infrastructureVisibility,
      [type]: !infrastructureVisibility[type]
    }
    
    setInfrastructureVisibility(newVisibility)

    if (mapService) {
      if (type === 'hydrants') {
        if (newVisibility.hydrants) {
          const bounds = mapService.getBounds()
          setIsLoadingHydrants(true)
          try {
            const hydrants = await infrastructureService.getFireHydrants(bounds, 500)
            if (hydrants.length > 0) {
              mapService.addFireHydrants(hydrants)
            }
          } catch (error) {
            console.error('Toggle: Error loading fire hydrants:', error)
            alert('Failed to load fire hydrants. Check console for details.')
          } finally {
            setIsLoadingHydrants(false)
          }
        } else {
          mapService.clearInfrastructureMarkers('hydrants')
        }
      } else {
        mapService.clearInfrastructureMarkers(type === 'streetlights' ? 'streetlights' : 'stopSigns')
      }
    }
  }

  // Initialize map and load data
  useEffect(() => {
    const defaultCenter = [40.7128, -74.0060]
    const map = new MapService('dashboard-map', {
      center: defaultCenter,
      zoom: 13
    })

    const setupHandlers = () => {
      if (map && map.getMap()) {
        mapInitializedRef.current = true
        
        const handleMapClick = (lat, lng) => {
          if (!showReportForm) {
            setUserLocation({ latitude: lat, longitude: lng })
            setShowReportForm(true)
          }
        }

        map.onMapClick(handleMapClick)
        map.onHydrantClick(handleHydrantClick)
      } else {
        setTimeout(setupHandlers, 100)
      }
    }

    setMapService(map)
    setTimeout(setupHandlers, 300)

    loadUserLocation(true).catch(() => {
      setIsLoadingLocation(false)
    })

    loadReports()

    return () => {
      if (boundsChangeTimeoutRef.current) {
        clearTimeout(boundsChangeTimeoutRef.current)
      }
      map.destroy()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
      mapService.clearMarkers()
      reports.forEach(report => {
        mapService.addReportMarker(report)
      })

      if (userLocation) {
        const allMarkers = Object.values(mapService.markers)
        if (allMarkers.length > 0) {
          mapService.fitToMarkers()
        }
      }
    }
  }, [mapService, reports, userLocation])

  // Set up bounds change handler when map service is ready
  useEffect(() => {
    if (mapService) {
      const handleBoundsChange = (bounds) => {
        if (boundsChangeTimeoutRef.current) {
          clearTimeout(boundsChangeTimeoutRef.current)
        }
        boundsChangeTimeoutRef.current = setTimeout(() => {
          loadFireHydrants(bounds)
        }, 500)
      }
      
      mapService.onBoundsChange(handleBoundsChange)
      
      return () => {
        if (boundsChangeTimeoutRef.current) {
          clearTimeout(boundsChangeTimeoutRef.current)
        }
      }
    }
  }, [mapService, loadFireHydrants])

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

      <div className="infrastructure-controls" style={{
        margin: '1rem auto',
        maxWidth: 1000,
        padding: '1rem',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '16px', fontWeight: 600 }}>
          Show Infrastructure:
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            cursor: 'pointer',
            fontSize: '14px'
          }}>
            <input
              type="checkbox"
              checked={infrastructureVisibility.hydrants}
              onChange={() => handleInfrastructureToggle('hydrants')}
              disabled={isLoadingHydrants}
              style={{ marginRight: '0.5rem', cursor: 'pointer' }}
            />
             Fire Hydrants
            {isLoadingHydrants && infrastructureVisibility.hydrants && (
              <span style={{ marginLeft: '0.5rem', fontSize: '12px', color: '#666' }}>
                (Loading...)
              </span>
            )}
          </label>
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            cursor: 'pointer',
            fontSize: '14px',
            opacity: 0.5
          }}>
            <input
              type="checkbox"
              checked={infrastructureVisibility.streetlights}
              onChange={() => handleInfrastructureToggle('streetlights')}
              disabled
              style={{ marginRight: '0.5rem', cursor: 'not-allowed' }}
            />
             Streetlights (Coming Soon)
          </label>
          <label style={{ 
            display: 'flex', 
            alignItems: 'center', 
            cursor: 'pointer',
            fontSize: '14px',
            opacity: 0.5
          }}>
            <input
              type="checkbox"
              checked={infrastructureVisibility.stopSigns}
              onChange={() => handleInfrastructureToggle('stopSigns')}
              disabled
              style={{ marginRight: '0.5rem', cursor: 'not-allowed' }}
            />
             Stop Signs (Coming Soon)
          </label>
        </div>
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
          onClose={() => {
            setShowReportForm(false)
            setTargetLocation(null)
          }}
          onReportSubmitted={handleReportSubmitted}
          initialLocation={userLocation}
          targetLocation={targetLocation}
        />
      )}
    </div>
  )
}

export default Dashboard
