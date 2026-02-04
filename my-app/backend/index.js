// Main backend exports
export { supabase, TABLES, BUCKETS } from './config/Supabase'
export { authService } from './services/authService'
export { reportService } from './services/reportService'
export { storageService } from './services/storageService'
export { geolocationService } from './utils/geolocation'
export { validators } from './utils/validators'

// Re-export everything for convenience
export const backend = {
  auth: authService,
  reports: reportService,
  storage: storageService,
  geolocation: geolocationService,
  validators: validators
}

export default backend