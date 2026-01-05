import React, { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'
import './styles/observatory.css'

// Components
import PentagonRadar, { FORCE_NAME_MAP, FORCES } from './components/PentagonRadar'
import ForceChapter, { FORCE_ORDER } from './components/ForceChapter'
import OrbitNavigator from './components/OrbitNavigator'
import Synthesis from './components/Synthesis'
import StockPerformance from './components/StockPerformance'
import ContactUs from './components/ContactUs'

const API_BASE = 'http://127.0.0.1:8000'

// Reverse mapping: forceId -> backend force name
const FORCE_ID_TO_NAME = Object.fromEntries(
  Object.entries(FORCE_NAME_MAP).map(([name, id]) => [id, name])
)

export default function App() {
  // State
  const [ticker, setTicker] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [companies, setCompanies] = useState([])
  const [companiesLoading, setCompaniesLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  const [activeForce, setActiveForce] = useState(null)
  const [showOrbitNav, setShowOrbitNav] = useState(false)
  const [visibleChapters, setVisibleChapters] = useState({})

  // Refs for scroll observation
  const chaptersRef = useRef({})
  const heroRef = useRef(null)

  // Fetch companies on mount
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        setCompaniesLoading(true)
        const resp = await axios.get(`${API_BASE}/companies`)
        setCompanies(resp.data || [])
      } catch (e) {
        console.warn('Failed to load companies', e)
      } finally {
        setCompaniesLoading(false)
      }
    }
    loadCompanies()
  }, [])

  // Intersection Observer for chapters
  useEffect(() => {
    const observers = []
    
    // Hero observer - hide orbit nav when hero is visible
    if (heroRef.current) {
      const heroObserver = new IntersectionObserver(
        ([entry]) => {
          setShowOrbitNav(!entry.isIntersecting)
        },
        { threshold: 0.3 }
      )
      heroObserver.observe(heroRef.current)
      observers.push(heroObserver)
    }

    // Chapter observers
    Object.entries(chaptersRef.current).forEach(([forceId, element]) => {
      if (!element) return
      
      const observer = new IntersectionObserver(
        ([entry]) => {
          setVisibleChapters(prev => ({
            ...prev,
            [forceId]: entry.isIntersecting
          }))
          
          if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
            setActiveForce(forceId)
          }
        },
        { threshold: [0.1, 0.3, 0.5] }
      )
      
      observer.observe(element)
      observers.push(observer)
    })

    return () => observers.forEach(obs => obs.disconnect())
  }, [results])

  // Handle analysis
  const handleAnalyze = async (e) => {
    e?.preventDefault()
    if (!ticker.trim()) return

    setLoading(true)
    setError(null)
    setResults(null)

    try {
      const response = await axios.get(`${API_BASE}/analyze`, {
        params: { ticker: ticker.toUpperCase() }
      })

      if (response.data.error) {
        throw new Error(response.data.error)
      }

      setResults(response.data)
      
      // Scroll to first chapter after short delay
      setTimeout(() => {
        const firstChapter = document.getElementById('chapter-rivalry')
        if (firstChapter) {
          firstChapter.scrollIntoView({ behavior: 'smooth' })
        }
      }, 500)
    } catch (err) {
      setError(err.message || 'Analysis failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Navigate to force chapter
  const scrollToForce = useCallback((forceId) => {
    const element = document.getElementById(`chapter-${forceId}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  // Clear selection
  const clearSelection = () => {
    setTicker('')
    setCompanyName('')
    setResults(null)
    setError(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="app">
      {/* ============ FIXED HEADER ============ */}
      <header className="header">
        <div className="header-logo">
          <div className="header-logo-icon" />
          <div className="header-logo-text">
            <span className="header-logo-title">Porter Observatory</span>
            <span className="header-logo-subtitle">Five Forces Chronicle</span>
          </div>
        </div>

        <div className="header-search">
          {ticker && companyName ? (
            <div className="header-company-tag">
              <span className="ticker">{ticker}</span>
              <span>· {companyName}</span>
              <span className="close" onClick={clearSelection}>×</span>
            </div>
          ) : (
            <select
              value={ticker}
              onChange={(e) => {
                const t = e.target.value
                setTicker(t)
                const found = companies.find(c => c.ticker === t)
                setCompanyName(found ? found.name : '')
              }}
            >
              <option value="">
                {companiesLoading ? 'Loading...' : 'Search company...'}
              </option>
              {companies.map((c) => (
                <option key={c.ticker} value={c.ticker}>
                  {c.name} ({c.ticker})
                </option>
              ))}
            </select>
          )}
        </div>

        <button
          className="analyze-btn"
          onClick={handleAnalyze}
          disabled={loading || !ticker}
        >
          <span className="icon">▷</span>
          <span>{loading ? 'Analyzing...' : 'Analyze'}</span>
        </button>
      </header>

      {/* ============ NAVIGATION BAR ============ */}
      <nav className="main-nav">
        <a href="#home" className="nav-link" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>
          Home
        </a>
        <a href="#forces" className="nav-link">Porter's Five Forces</a>
        <a href="#stock" className="nav-link">Stock Performance</a>
        <a href="#contact" className="nav-link">Contact Us</a>
      </nav>

      {/* ============ MAIN CONTENT ============ */}
      <main className="main-content">
        
        {/* ============ LOADING OVERLAY ============ */}
        {loading && (
          <div className="loading-overlay">
            <div className="loading-pentagon">
              <div className="loading-node" />
              <div className="loading-node" />
              <div className="loading-node" />
              <div className="loading-node" />
              <div className="loading-node" />
            </div>
            <div className="loading-text">Analyzing {ticker}...</div>
            <div className="loading-subtext">
              Downloading 10-K, embedding chunks, querying forces
            </div>
          </div>
        )}

        {/* ============ ERROR MESSAGE ============ */}
        {error && (
          <div className="error-message">
            <h4>Analysis Failed</h4>
            <p>{error}</p>
          </div>
        )}

        {/* ============ HERO: COMMAND VIEW ============ */}
        <section className="hero" id="home" ref={heroRef}>
          <div className="hero-content">
            <div className="hero-label">Competitive Analysis</div>
            <h1 className="hero-title">
              {companyName || 'Select a Company'}{' '}
              {ticker && <span className="ticker">({ticker})</span>}
            </h1>
            <p className="hero-subtitle">
              Discover competitive insights powered by SEC 10-K filings
              and Porter's Five Forces.
            </p>

            {/* Pentagon Radar */}
            <PentagonRadar
              ticker={ticker}
              analysisData={results?.analysis}
              onForceClick={scrollToForce}
              size={400}
              analyzing={loading}
            />

            {/* Threat Summary Bar */}
            {results && (
              <div className="threat-summary">
                {FORCES.map((force) => (
                  <div
                    key={force.id}
                    className={`threat-item ${force.id}`}
                    onClick={() => scrollToForce(force.id)}
                  >
                    <div className="threat-arc">
                      <svg viewBox="0 0 36 36">
                        <circle
                          className="threat-arc-bg"
                          cx="18" cy="18" r="15.9"
                          strokeDasharray="100 100"
                        />
                        <circle
                          className="threat-arc-fill"
                          cx="18" cy="18" r="15.9"
                          strokeDasharray="70 100"
                        />
                      </svg>
                    </div>
                    <span className="threat-label">{force.label}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Scroll indicator */}
            {results && (
              <div className="scroll-indicator">
                <span>▼</span>
                <span>Scroll to explore each force</span>
              </div>
            )}
          </div>
        </section>

        {/* ============ ORBIT NAVIGATOR ============ */}
        {results && (
          <OrbitNavigator
            activeForce={activeForce}
            onForceClick={scrollToForce}
            visible={showOrbitNav}
          />
        )}

        {/* ============ FORCE CHAPTERS ============ */}
        {results && (
          <div className="chapters" id="forces">
            {FORCE_ORDER.map((forceId, index) => {
              const forceName = FORCE_ID_TO_NAME[forceId]
              const forceData = results.analysis?.[forceName]
              
              return (
                <div
                  key={forceId}
                  ref={(el) => { chaptersRef.current[forceId] = el }}
                >
                  <ForceChapter
                    forceId={forceId}
                    forceName={forceName}
                    data={forceData}
                    chapterNumber={index + 1}
                    isVisible={visibleChapters[forceId]}
                  />
                </div>
              )
            })}
          </div>
        )}

        {/* ============ SYNTHESIS ============ */}
        {results && (
          <Synthesis
            ticker={results.ticker}
            companyName={companyName}
            analysisData={results.analysis}
          />
        )}

        {/* ============ STOCK PERFORMANCE ============ */}
        {results && (
          <StockPerformance ticker={results.ticker} companyName={companyName} />
        )}

        {/* ============ CONTACT US ============ */}
        <ContactUs />

        {/* ============ EMPTY STATE ============ */}
        {!results && !loading && !error && (
          <div className="empty-state" style={{ marginTop: '-50vh' }}>
            <svg className="empty-pentagon" viewBox="0 0 100 100">
              <polygon
                points="50,5 95,35 80,90 20,90 5,35"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
            </svg>
            <h2 className="empty-title">Begin Your Analysis</h2>
            <p className="empty-subtitle">
              Select a company from the dropdown above to generate a 
              Porter's Five Forces analysis from their latest 10-K filing.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
