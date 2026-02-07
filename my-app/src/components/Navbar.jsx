import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '../App.css'

function Navbar() {
  const navigate = useNavigate()

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          CommunityWatch
        </Link>
        <ul className="navbar-menu">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/dashboard">Report</Link></li>
          <li><Link to="/about">About</Link></li>
          <li><Link to="/contact">Contact</Link></li>
          <li><button onClick={() => navigate('/login')} className="nav-button">Sign In</button></li>
        </ul>
      </div>
    </nav>
  )
}

export default Navbar
