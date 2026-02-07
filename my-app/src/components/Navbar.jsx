import React, { useContext } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { AuthContext } from '../auth/AuthContext'
import '../App.css'

function Navbar() {
  const { user, isAuthenticated, logout } = useContext(AuthContext)
  const navigate = useNavigate()
  const location = useLocation()

  // Helper to highlight active link
  const isActive = (path) => location.pathname === path

  if (!isAuthenticated) {
    // Public navbar
    return (
      <nav className="navbar">
        <div className="navbar-container">
          <Link to="/" className="navbar-logo">Community Watchers</Link>
          <ul className="navbar-menu">
            <li><Link to="/about" className={isActive('/about') ? 'active' : ''}>About</Link></li>
            <li><Link to="/contact" className={isActive('/contact') ? 'active' : ''}>Contact</Link></li>
            <li><button className="nav-button" onClick={() => navigate('/login')}>Log In</button></li>
            <li><button className="nav-button" onClick={() => navigate('/signup')}>Sign Up</button></li>
          </ul>
        </div>
      </nav>
    )
  }

  // Authenticated navbar
  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/dashboard" className="navbar-logo">Reporters</Link>
        <ul className="navbar-menu">
          <li><Link to="/dashboard" className={isActive('/dashboard') ? 'active' : ''}>Map</Link></li>
          <li><Link to="/leaderboard" className={isActive('/leaderboard') ? 'active' : ''}>Leaderboard</Link></li>
          <li><Link to="/profile" className={isActive('/profile') ? 'active' : ''}>Profile</Link></li>
          <li><button className="nav-button" onClick={handleLogout}>Log Out</button></li>
        </ul>
      </div>
    </nav>
  )
}

export default Navbar
