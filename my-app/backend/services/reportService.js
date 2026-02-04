import { supabase } from '../config/Supabase'
import { TABLES } from '../config/Supabase'
import { storageService } from './storageService'

export const reportService = {
  /**
   * Create a new infrastructure report
   * @param {Object} reportData
   * @param {number} reportData.latitude
   * @param {number} reportData.longitude
   * @param {string} reportData.type - Type of infrastructure issue
   * @param {string} reportData.description
   * @param {File} reportData.photoFile - Optional photo file
   * @returns {Promise<Object>} Created report
   */
  async createReport({ latitude, longitude, type, description, photoFile }) {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      // Upload photo if provided
      let photoUrl = null
      if (photoFile) {
        photoUrl = await storageService.uploadReportPhoto(photoFile, user.id)
      }

      // Insert report into database
      const { data, error } = await supabase
        .from(TABLES.REPORTS)
        .insert([{
          user_id: user.id,
          latitude,
          longitude,
          location: `POINT(${longitude} ${latitude})`, // PostGIS format
          type,
          description,
          photo_url: photoUrl,
          status: 'pending'
        }])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating report:', error)
      throw error
    }
  },

  /**
   * Get all reports with optional filters
   * @param {Object} filters
   * @param {string} filters.type - Filter by report type
   * @param {string} filters.status - Filter by status
   * @param {number} filters.limit - Limit number of results
   * @returns {Promise<Array>} Array of reports
   */
  async getAllReports(filters = {}) {
    try {
      let query = supabase
        .from(TABLES.REPORTS)
        .select('*')

      // Apply filters
      if (filters.type) {
        query = query.eq('type', filters.type)
      }
      if (filters.status) {
        query = query.eq('status', filters.status)
      }
      if (filters.limit) {
        query = query.limit(filters.limit)
      }

      // Order by most recent
      query = query.order('created_at', { ascending: false })

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching reports:', error)
      throw error
    }
  },

  /**
   * Get reports within a radius of a location
   * @param {number} latitude 
   * @param {number} longitude 
   * @param {number} radiusMeters - Radius in meters (default 1000m = 1km)
   * @returns {Promise<Array>} Array of nearby reports
   */
  async getReportsNearby(latitude, longitude, radiusMeters = 1000) {
    try {
      // Call the PostgreSQL function for geospatial query
      const { data, error } = await supabase.rpc('get_nearby_reports', {
        lat: latitude,
        lng: longitude,
        radius_meters: radiusMeters
      })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching nearby reports:', error)
      throw error
    }
  },

  /**
   * Get a single report by ID
   * @param {string} reportId 
   * @returns {Promise<Object>} Report object
   */
  async getReportById(reportId) {
    try {
      const { data, error } = await supabase
        .from(TABLES.REPORTS)
        .select('*')
        .eq('id', reportId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching report:', error)
      throw error
    }
  },

  /**
   * Get all reports created by current user
   * @returns {Promise<Array>} Array of user's reports
   */
  async getMyReports() {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await supabase
        .from(TABLES.REPORTS)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching user reports:', error)
      throw error
    }
  },

  /**
   * Update report status
   * @param {string} reportId 
   * @param {string} status - 'pending' | 'in_progress' | 'resolved'
   * @returns {Promise<Object>} Updated report
   */
  async updateReportStatus(reportId, status) {
    try {
      const validStatuses = ['pending', 'in_progress', 'resolved']
      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`)
      }

      const { data, error } = await supabase
        .from(TABLES.REPORTS)
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', reportId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating report status:', error)
      throw error
    }
  },

  /**
   * Update report details
   * @param {string} reportId 
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated report
   */
  async updateReport(reportId, updates) {
    try {
      const { data, error } = await supabase
        .from(TABLES.REPORTS)
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', reportId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating report:', error)
      throw error
    }
  },

  /**
   * Delete a report
   * @param {string} reportId 
   */
  async deleteReport(reportId) {
    try {
      // First get the report to find photo URL
      const report = await this.getReportById(reportId)
      
      // Delete photo from storage if exists
      if (report.photo_url) {
        await storageService.deleteReportPhoto(report.photo_url)
      }

      // Delete report from database
      const { error } = await supabase
        .from(TABLES.REPORTS)
        .delete()
        .eq('id', reportId)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting report:', error)
      throw error
    }
  },

  /**
   * Subscribe to real-time changes on reports table
   * @param {Function} callback - Called when reports change
   * @returns {Object} Subscription object
   */
  subscribeToReports(callback) {
    const subscription = supabase
      .channel('reports-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: TABLES.REPORTS 
        },
        (payload) => {
          callback(payload)
        }
      )
      .subscribe()

    return subscription
  },

  /**
   * Unsubscribe from real-time changes
   * @param {Object} subscription 
   */
  unsubscribeFromReports(subscription) {
    if (subscription) {
      supabase.removeChannel(subscription)
    }
  },

  /**
   * Get report statistics
   * @returns {Promise<Object>} Statistics object
   */
  async getReportStats() {
    try {
      const { data, error } = await supabase
        .from(TABLES.REPORTS)
        .select('status, type')

      if (error) throw error

      const stats = {
        total: data.length,
        byStatus: {},
        byType: {}
      }

      data.forEach(report => {
        // Count by status
        stats.byStatus[report.status] = (stats.byStatus[report.status] || 0) + 1
        // Count by type
        stats.byType[report.type] = (stats.byType[report.type] || 0) + 1
      })

      return stats
    } catch (error) {
      console.error('Error fetching report stats:', error)
      throw error
    }
  }
}