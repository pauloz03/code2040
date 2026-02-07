import React from 'react'
import '../App.css'

function About() {
  return (
    <div className="content-page">
      <div className="content-container">
        <h1>About CommunityWatch</h1>
        
        <section className="about-section">
          <h2>Our Mission</h2>
          <p>
            CommunityWatch helps residents document infrastructure and environmental issues 
            in their neighborhoods — from uncollected trash to broken sidewalks to malfunctioning streetlights.
          </p>
          <p>
            By creating a clear record of what's reported and how quickly it's addressed, we aim to 
            highlight patterns in service delivery and support communities in advocating for more equitable attention.
          </p>
        </section>

        <section className="about-section">
          <h2>Why This Matters</h2>
          <p>
            Many communities — particularly historically redlined Black and Latinx neighborhoods — 
            have experienced decades of disinvestment. This history continues to affect infrastructure 
            maintenance, environmental quality, and municipal responsiveness today.
          </p>
          <p>
            When residents document these issues systematically, they create data that can:
          </p>
          <ul className="about-list">
            <li>Reveal disparities in how quickly problems are addressed</li>
            <li>Support conversations with local officials backed by facts</li>
            <li>Help communities hold their cities accountable</li>
            <li>Build collective power through shared documentation</li>
          </ul>
        </section>

        <section className="about-section">
          <h2>How It Works</h2>
          <p>
            Creating an account takes just a moment. Once you're logged in, you can report issues 
            right from your phone — adding photos, descriptions, and locations. Track updates and 
            see how your community's reports compare to response times in other areas.
          </p>
          <p>
            This tool is for you — to document what you see, amplify resident voices, and work 
            together toward neighborhoods that receive the care they deserve.
          </p>
        </section>
      </div>
    </div>
  )
}

export default About
