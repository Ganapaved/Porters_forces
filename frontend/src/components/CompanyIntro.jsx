import React, { useState, useEffect } from 'react'
import axios from 'axios'

const API_BASE = 'http://127.0.0.1:8000'

// Default data for loading/error states
const DEFAULT_DATA = {
  name: 'Company',
  description: 'Company information is being loaded...',
  founded: 'N/A',
  headquarters: 'N/A',
  ceo: 'N/A',
  employees: 'N/A',
  marketCap: 'N/A',
  sector: 'N/A',
  history: [
    { year: '—', event: 'Loading company history...' }
  ]
}

export default function CompanyIntro({ ticker, companyName }) {
  const [companyData, setCompanyData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (ticker) {
      fetchCompanyInfo()
    } else {
      setCompanyData(null)
    }
  }, [ticker])

  const fetchCompanyInfo = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await axios.get(`${API_BASE}/company-info`, {
        params: { 
          ticker: ticker,
          company_name: companyName || ''
        }
      })
      
      if (response.data.error) {
        throw new Error(response.data.error)
      }
      
      setCompanyData(response.data)
    } catch (err) {
      console.error('Failed to fetch company info:', err)
      setError(err.message)
      // Set fallback data with company name
      setCompanyData({
        ...DEFAULT_DATA,
        name: companyName || ticker,
        description: `Unable to load detailed information for ${companyName || ticker}. Please try again later.`
      })
    } finally {
      setLoading(false)
    }
  }

  if (!ticker) {
    return (
      <section className="company-intro" id="company-intro">
        <div className="company-intro-header">
          <div className="company-intro-label">Company Profile</div>
          <h2 className="company-intro-title">Select a Company</h2>
        </div>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--space-2xl)' }}>
          Choose a company from the dropdown above to view its profile and history.
        </div>
      </section>
    )
  }

  const data = companyData || DEFAULT_DATA

  return (
    <section className="company-intro" id="company-intro">
      <div className="company-intro-header">
        <div className="company-intro-label">Company Profile</div>
        <h2 className="company-intro-title">
          {loading ? 'Loading...' : data.name}
          {loading && <span className="loading-spinner" style={{ marginLeft: '10px' }}>⟳</span>}
        </h2>
      </div>

      <div className="company-intro-content">
        {/* Company Overview */}
        <div className="company-card">
          <h3 className="company-card-title">
            <span className="company-card-icon">🏢</span>
            Company Overview
          </h3>
          <p className="company-card-text">{data.description}</p>
          
          <div className="company-stats">
            <div className="company-stat">
              <div className="company-stat-value">{data.founded}</div>
              <div className="company-stat-label">Founded</div>
            </div>
            <div className="company-stat">
              <div className="company-stat-value">{data.employees}</div>
              <div className="company-stat-label">Employees</div>
            </div>
            <div className="company-stat">
              <div className="company-stat-value">{data.marketCap}</div>
              <div className="company-stat-label">Market Cap</div>
            </div>
            <div className="company-stat">
              <div className="company-stat-value">{data.headquarters}</div>
              <div className="company-stat-label">Headquarters</div>
            </div>
            <div className="company-stat">
              <div className="company-stat-value">{data.ceo}</div>
              <div className="company-stat-label">CEO</div>
            </div>
            <div className="company-stat">
              <div className="company-stat-value">{data.sector}</div>
              <div className="company-stat-label">Sector</div>
            </div>
          </div>
        </div>

        {/* Company History */}
        <div className="company-card">
          <h3 className="company-card-title">
            <span className="company-card-icon">📜</span>
            Company History
          </h3>
          <div className="history-timeline">
            {data.history && data.history.map((item, idx) => (
              <div key={idx} className="timeline-item">
                <div className="timeline-year">{item.year}</div>
                <div className="timeline-event">{item.event}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
