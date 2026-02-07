import React from 'react'
import '../App.css'

function About() {
  return (
    <div className="content-page">
      <div className="page-container">
        <div className="content-container">
          <h1>About CommunityWatch</h1>
          
          <section className="about-section">
            <h2>Why This Matters</h2>
            <p>
              Many Black and Latinx neighborhoods were historically redlined and experienced decades 
              of underinvestment. That history still shows up today in infrastructure conditions and 
              how quickly issues get addressed.
            </p>
          </section>

          <section className="about-section">
            <h2>What We Do</h2>
            <ul className="about-list-bullets">
              <li>
                <strong>Report:</strong> Residents document issues (trash, sidewalks, street hazards).
              </li>
              <li>
                <strong>Compare:</strong> We analyze response times and trends using NYC 311 data.
              </li>
              <li>
                <strong>Reveal:</strong> We overlay historical redlining to highlight service disparities.
              </li>
            </ul>
          </section>

          <section className="about-section">
            <h2>What "Resistance" Means Here</h2>
            <p>
              Turning everyday problems into evidence communities can use to advocate for equitable public services.
            </p>
          </section>

          <section className="about-section">
            <h2>Our Approach</h2>
            <p>
              We use language like "highlight patterns," "compare," and "track disparities" — 
              not "prove discrimination." Our goal is to provide clear data that communities can use 
              in conversations with local officials, backed by facts and historical context.
            </p>
            <p>
              This tool is for you — to document what you see, amplify resident voices, and work 
              together toward neighborhoods that receive the care they deserve.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}

export default About
