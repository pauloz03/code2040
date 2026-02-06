import { supabase } from '../config/Supabase'
import { BUCKETS } from '../config/Supabase'

/**
 * Storage service for handling file uploads to Supabase Storage
 */
export const storageService = {
  /**
   * Upload a report photo to Supabase Storage
   * @param {File} file - The image file to upload
   * @param {string} userId - The user ID who is uploading the photo
   * @returns {Promise<string>} Public URL of the uploaded photo
   */
  async uploadReportPhoto(file, userId) {
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/${Date.now()}.${fileExt}`
      const filePath = `reports/${fileName}`

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from(BUCKETS.REPORT_PHOTOS)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) throw error

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(BUCKETS.REPORT_PHOTOS)
        .getPublicUrl(data.path)

      return urlData.publicUrl
    } catch (error) {
      console.error('Error uploading photo:', error)
      throw new Error('Failed to upload photo: ' + error.message)
    }
  },

  /**
   * Delete a report photo from Supabase Storage
   * @param {string} photoUrl - The public URL of the photo to delete
   * @returns {Promise<void>}
   */
  async deleteReportPhoto(photoUrl) {
    try {
      // Extract file path from URL
      // URL format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
      const urlParts = photoUrl.split('/')
      const bucketIndex = urlParts.findIndex(part => part === 'public')
      
      if (bucketIndex === -1) {
        throw new Error('Invalid photo URL format')
      }

      // Get the path after 'public/[bucket]/'
      const pathParts = urlParts.slice(bucketIndex + 2) // Skip 'public' and bucket name
      const filePath = pathParts.join('/')

      // Delete file from storage
      const { error } = await supabase.storage
        .from(BUCKETS.REPORT_PHOTOS)
        .remove([filePath])

      if (error) throw error
    } catch (error) {
      console.error('Error deleting photo:', error)
      // Don't throw error - photo deletion failure shouldn't block report deletion
    }
  },

  /**
   * Get a signed URL for a private file (if needed in the future)
   * @param {string} filePath - Path to the file in storage
   * @param {number} expiresIn - Expiration time in seconds (default: 3600)
   * @returns {Promise<string>} Signed URL
   */
  async getSignedUrl(filePath, expiresIn = 3600) {
    try {
      const { data, error } = await supabase.storage
        .from(BUCKETS.REPORT_PHOTOS)
        .createSignedUrl(filePath, expiresIn)

      if (error) throw error
      return data.signedUrl
    } catch (error) {
      console.error('Error getting signed URL:', error)
      throw error
    }
  }
}
