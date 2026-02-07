import React from 'react'
import { useNavigate } from 'react-router-dom'
import '../App.css'

function Home() {
  const navigate = useNavigate()

  return (
    <div className="landing-page">
      <div className="page-container">
        <section className="hero-section">
          <h1 className="hero-title">Your Voice Matters</h1>
          <p className="hero-subtitle">
            Community Watchers helps residents in historically disinvested neighborhoods report local issues and track whether city response is equitable.
            We connect reports to historical redlining to reveal patterns, then make the data easy to act on.
          </p>
          <div className="cta-buttons">
            <button className="cta-primary" onClick={() => navigate('/signup')}>
              Report an Issue
            </button>
            <button className="cta-secondary" onClick={() => navigate('/about')}>
              Learn More
            </button>
          </div>
        </section>
      </div>

      {/* Disparity Snapshot - The proof */}
      <div className="page-container">
        <section className="disparity-snapshot">
          <h2 className="snapshot-title">Disparity Snapshot</h2>
          <div className="snapshot-card">
            <p className="snapshot-metric">"Avg time to close sanitation requests"</p>
            <div className="snapshot-stats">
              <div className="stat-item redlined">
                <span className="stat-label">Historically redlined areas</span>
                <span className="stat-value">9.4 days</span>
              </div>
              <div className="stat-item non-redlined">
                <span className="stat-label">Non-redlined areas</span>
                <span className="stat-value">4.1 days</span>
              </div>
              <div className="stat-item gap">
                <span className="stat-label">Gap</span>
                <span className="stat-value highlight">2.3× slower</span>
              </div>
            </div>
            <p className="snapshot-source">Source: NYC 311 data (sample)</p>
          </div>
        </section>
      </div>

      {/* What's different from 311 */}
      <div className="page-container">
        <section className="different-311">
          <h2>What's different from 311?</h2>
          <div className="comparison-grid">
            <div className="comparison-item">
              <div className="comparison-icon">🎫</div>
              <p><strong>311 is ticket-based.</strong> We are pattern-based.</p>
            </div>
            <div className="comparison-item">
              <div className="comparison-icon">📊</div>
              <p><strong>311 shows your request.</strong> We show equity across neighborhoods.</p>
            </div>
            <div className="comparison-item">
              <div className="comparison-icon">📢</div>
              <p><strong>311 can feel like shouting into the void.</strong> We track follow-through.</p>
            </div>
          </div>
          <p className="comparison-tagline">
            We're not replacing 311—we're upgrading it with accountability and context.
          </p>
        </section>
      </div>

      {/* How it Works */}
      <div className="page-container">
        <section className="how-it-works">
          <h2>How It Works</h2>
          <div className="steps-grid">
            <div className="step">
              <div className="step-number">1</div>
              <h3>Report an issue</h3>
              <p>Document problems with location, photo, and description right from your phone.</p>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <h3>We connect it to city service data</h3>
              <p>Your report is analyzed alongside NYC 311 patterns and response times.</p>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <h3>We show whether response is equitable</h3>
              <p>See how your neighborhood compares, overlaid with historical redlining data.</p>
            </div>
          </div>
          <p className="how-it-works-tagline">
            Designed to support communities that have historically received slower service.
          </p>
        </section>
      </div>

      {/* Original features section */}
      <div className="page-container">
        <section className="features-section">
          <div className="feature">
            <div className="feature-icon">📍</div>
            <h3>Report Issues</h3>
            <p>Document problems like uncollected trash, broken sidewalks, or streetlight outages in your neighborhood.</p>
          </div>
          <div className="feature">
            <div className="feature-icon">📊</div>
            <h3>Highlight Patterns</h3>
            <p>Compare response times across neighborhoods and identify potential service disparities.</p>
          </div>
          <div className="feature">
            <div className="feature-icon">🤝</div>
            <h3>Build Evidence</h3>
            <p>Turn everyday problems into data communities can use to advocate for equitable public services.</p>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Home
