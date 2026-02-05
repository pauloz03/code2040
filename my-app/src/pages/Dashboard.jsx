import React, { useEffect } from 'react'
import '../App.css'
import { MapService } from '../lib/map'

function Dashboard() {
  useEffect(() => {
    const mapService = new MapService('dashboard-map', {
      center: [40.7128, -74.0060], // NYC
      zoom: 13
    })
    // Cleanup on unmount
    return () => mapService.destroy()
  }, [])

  return (
    <div className="dashboard-page">
      <h1>Welcome to Reporters!</h1>
      <p className="dashboard-msg"></p>
      <div id="dashboard-map" style={{ width: '100%', maxWidth: 800, height: 400, margin: '2rem auto', borderRadius: '12px', boxShadow: '0 2px 16px rgba(0,0,0,0.15)' }}></div>
    </div>
  )
}

export default Dashboard
