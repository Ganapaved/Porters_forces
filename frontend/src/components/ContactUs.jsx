import React from 'react'

export default function ContactUs() {
  return (
    <section className="contact-section" id="contact">
      <div className="contact-label">Get In Touch</div>
      <h2 className="contact-title">Contact Us</h2>
      <p className="contact-subtitle">
        Have questions about our analysis or need custom reports? 
        We're here to help.
      </p>

      <div className="contact-cards">
        <div className="contact-card">
          <div className="contact-card-icon">📧</div>
          <h3 className="contact-card-title">Email</h3>
          <p className="contact-card-text">
            <a href="mailto:tanmaydev49@gmail.com">
              tanmaydev49@gmail.com
            </a>
          </p>
        </div>

        <div className="contact-card">
          <div className="contact-card-icon">📍</div>
          <h3 className="contact-card-title">Location</h3>
          <p className="contact-card-text">
            RVCE Campus<br />
            Bengaluru, Karnataka 560059
          </p>
        </div>
      </div>

      <p style={{ 
        color: 'var(--text-muted)', 
        fontSize: '0.85rem',
        marginTop: 'var(--space-xl)'
      }}>
        Porter Observatory — AI-powered competitive analysis from SEC 10-K filings.
        <br />
        <span style={{ opacity: 0.6 }}>
          © {new Date().getFullYear()} All rights reserved. For informational purposes only.
        </span>
      </p>
    </section>
  )
}
