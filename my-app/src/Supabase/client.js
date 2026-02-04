// supabaseClient.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

// map.js
import L from 'leaflet'
import { supabase } from './supabaseClient'

// Initialize map centered on NYC
const map = L.map('map').setView([40.7128, -74.0060], 13)

// Add OpenStreetMap tiles
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map)

// Function to create a report
async function createReport(lat, lng, type, description, photoFile) {
  // Upload photo if exists
  let photoUrl = null
  if (photoFile) {
    const { data, error } = await supabase.storage
      .from('report-photos')
      .upload(`${Date.now()}_${photoFile.name}`, photoFile)
    
    if (!error) {
      photoUrl = supabase.storage.from('report-photos').getPublicUrl(data.path).data.publicUrl
    }
  }

  // Insert report
  const { data, error } = await supabase
    .from('reports')
    .insert([{
      latitude: lat,
      longitude: lng,
      location: `POINT(${lng} ${lat})`,
      type: type,
      description: description,
      photo_url: photoUrl,
      user_id: (await supabase.auth.getUser()).data.user?.id
    }])
    .select()

  if (!error) {
    addMarkerToMap(data[0])
  }
}

// Function to add marker to map
function addMarkerToMap(report) {
  const circle = L.circleMarker([report.latitude, report.longitude], {
    radius: 8,
    fillColor: getColorByType(report.type),
    color: '#000',
    weight: 1,
    opacity: 1,
    fillOpacity: 0.8
  }).addTo(map)
  
  circle.bindPopup(`
    <b>${report.type}</b><br>
    ${report.description}<br>
    Status: ${report.status}
  `)
}

function getColorByType(type) {
  const colors = {
    streetlight: '#ffeb3b',
    pothole: '#f44336',
    sidewalk: '#2196f3',
    other: '#9e9e9e'
  }
  return colors[type] || colors.other
}

// Load all existing reports
async function loadReports() {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
  
  if (!error) {
    data.forEach(report => addMarkerToMap(report))
  }
}

loadReports()