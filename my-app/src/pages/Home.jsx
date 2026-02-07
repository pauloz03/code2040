import React from 'react'
import { useNavigate } from 'react-router-dom'
import '../App.css'

function Home() {
  const navigate = useNavigate()

  return (
    <div className="landing-page">
      <section className="hero-section">
        <h1 className="hero-title">Your Voice Matters</h1>
        <p className="hero-subtitle">
          Report infrastructure and environmental issues in your community.
          Together, we can shine a light on patterns of service delivery and advocate for equitable attention.
        </p>
        <div className="cta-buttons">
          <button className="cta-primary" onClick={() => navigate('/dashboard')}>
            Report an Issue
          </button>
          <button className="cta-secondary" onClick={() => navigate('/about')}>
            Learn More
          </button>
        </div>
      </section>

      <section className="features-section">
        <div className="feature">
          <div className="feature-icon">📍</div>
          <h3>Report Issues</h3>
          <p>Document problems like uncollected trash, broken sidewalks, or streetlight outages in your neighborhood.</p>
        </div>
        <div className="feature">
          <div className="feature-icon">📊</div>
          <h3>Track Patterns</h3>
          <p>See how issues are addressed across different communities and identify potential disparities.</p>
        </div>
        <div className="feature">
          <div className="feature-icon">🤝</div>
          <h3>Build Community</h3>
          <p>Connect with neighbors working toward more responsive and equitable public services.</p>
        </div>
      </section>
    </div>
  )
}

export default Home
