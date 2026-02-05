import { supabase } from '../config/Supabase'

export const authService = {
  /**
   * Sign up a new user
   * @param {string} email 
   * @param {string} password 
   * @param {Object} metadata - Additional user data
   * @returns {Promise<Object>} User data
   */
  async signUp(email, password, metadata = {}) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata // e.g., { full_name: 'John Doe', phone: '555-0123' }
        }
      })
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Sign up error:', error)
      throw error
    }
  },

  /**
   * Sign in existing user
   * @param {string} email 
   * @param {string} password 
   * @returns {Promise<Object>} Session data
   */
  async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) throw error
      return data
    } catch (error) {
      console.error('Sign in error:', error)
      throw error
    }
  },

  /**
   * Sign out current user
   */
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  },

  /**
   * Get current authenticated user
   * @returns {Promise<Object|null>} User object or null
   */
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error
      return user
    } catch (error) {
      console.error('Get user error:', error)
      return null
    }
  },

  /**
   * Get current session
   * @returns {Promise<Object|null>} Session object or null
   */
  async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error
      return session
    } catch (error) {
      console.error('Get session error:', error)
      return null
    }
  },

  /**
   * Listen to authentication state changes
   * @param {Function} callback - Called when auth state changes
   * @returns {Object} Subscription object
   */
  onAuthStateChange(callback) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        callback(event, session)
      }
    )
    return subscription
  },

  /**
   * Reset password for user
   * @param {string} email 
   */
  async resetPassword(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })
      if (error) throw error
    } catch (error) {
      console.error('Reset password error:', error)
      throw error
    }
  },

  /**
   * Update user password
   * @param {string} newPassword 
   */
  async updatePassword(newPassword) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })
      if (error) throw error
    } catch (error) {
      console.error('Update password error:', error)
      throw error
    }
  },

  /**
   * Update user metadata
   * @param {Object} metadata 
   */
  async updateUserMetadata(metadata) {
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: metadata
      })
      if (error) throw error
      return data
    } catch (error) {
      console.error('Update metadata error:', error)
      throw error
    }
  }
}