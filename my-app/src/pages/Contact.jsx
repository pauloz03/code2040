import React from 'react'
import '../App.css'

function Contact() {
  return (
    <div className="content-page">
      <div className="content-container">
        <h1>Get in Touch</h1>
        
        <section className="contact-section">
          <h2>About This Project</h2>
          <p>
            CommunityWatch was built during the Tech for Resistance hackathon, focused on 
            environmental justice and community empowerment.
          </p>
        </section>

        <section className="contact-section">
          <h2>Connect With Us</h2>
          <p>
            We welcome feedback, partnership inquiries, and collaboration opportunities.
          </p>
          <div className="contact-info">
            <p><strong>Email:</strong> contact@communitywatch.org</p>
            <p><strong>GitHub:</strong> github.com/communitywatch</p>
          </div>
        </section>

        <section className="contact-section">
          <h2>For Residents</h2>
          <p>
            If you need help using the reporting tool or have questions about documenting 
            issues in your community, we're here to support you.
          </p>
        </section>

        <section className="contact-section">
          <h2>For Organizations</h2>
          <p>
            Interested in partnering with us or adapting this tool for your community? 
            We'd love to hear from you.
          </p>
        </section>
      </div>
    </div>
  )
}

export default Contact
