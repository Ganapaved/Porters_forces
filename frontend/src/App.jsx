import React, { useState, useEffect } from 'react'
import axios from 'axios'
import ForceCard from './ForceCard'
import './index.css'

export default function App() {
  const [ticker, setTicker] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [companies, setCompanies] = useState([])
  const [companiesLoading, setCompaniesLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)

  // Fetch company list for dropdown
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        setCompaniesLoading(true)
        const resp = await axios.get('http://127.0.0.1:8000/companies')
        setCompanies(resp.data || [])
      } catch (e) {
        console.warn('Failed to load companies', e)
      } finally {
        setCompaniesLoading(false)
      }
    }
    loadCompanies()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!ticker.trim()) return

    setLoading(true)
    setError(null)
    setResults(null)

    try {
      const response = await axios.get('http://127.0.0.1:8000/analyze', {
        params: {
          ticker: ticker.toUpperCase()
        }
      })

      if (response.data.error) {
        throw new Error(response.data.error)
      }

      setResults(response.data)
    } catch (err) {
      setError(err.message || 'Analysis failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <header>
        <h1>📊 Porter's Five Forces Analyzer</h1>
        <p>AI-powered financial analysis from SEC 10-K filings</p>
      </header>

      <div className="search-box">
        <form onSubmit={handleSubmit} className="search-form">
          <select
            value={ticker}
            onChange={(e) => {
              const t = e.target.value
              setTicker(t)
              const found = companies.find(c => c.ticker === t)
              setCompanyName(found ? found.name : '')
            }}
            required
          >
            <option value="">{companiesLoading ? 'Loading companies...' : 'Select a company'}</option>
            {companies.map((c) => (
              <option key={c.ticker} value={c.ticker}>
                {c.name} ({c.ticker})
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Or type ticker manually"
            value={ticker}
            onChange={(e) => {
              setTicker(e.target.value)
              setCompanyName('')
            }}
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </form>
      </div>

      {error && (
        <div className={`error ${error ? 'active' : ''}`}>
          <h4>❌ Analysis Failed</h4>
          <p>{error}</p>
        </div>
      )}

      {loading && (
        <div className="loading active">
          <div className="spinner"></div>
          <p>Analyzing company... This may take 2-3 minutes</p>
        </div>
      )}

      {results && (
        <div className={`results ${results ? 'active' : ''}`}>
          <div className="company-header">
            <h2>{results.ticker}</h2>
            <p>{companyName || 'Porter\'s Five Forces Analysis'}</p>
          </div>
          <div className="forces-grid">
            {Object.entries(results.analysis).map(([force, data]) => (
              <ForceCard key={force} force={force} data={data} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
