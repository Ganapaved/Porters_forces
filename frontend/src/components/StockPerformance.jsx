import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Activity, DollarSign, BarChart3 } from 'lucide-react'

const API_BASE = 'http://127.0.0.1:8001'

export default function StockPerformance({ ticker, companyName }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!ticker) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    fetch(`${API_BASE}/stock?ticker=${ticker}`)
      .then(res => res.json())
      .then(result => {
        if (result.error) {
          setError(result.error)
        } else {
          setData(result)
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [ticker])

  if (!ticker) {
    return (
      <section className="stock-section" id="stock">
        <div className="stock-header">
          <div className="stock-label">Market Data</div>
          <h2 className="stock-title">Stock Performance</h2>
        </div>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--space-2xl)' }}>
          Select a company to view real-time stock performance.
        </div>
      </section>
    )
  }

  if (loading) {
    return (
      <section className="stock-section" id="stock">
        <div className="stock-header">
          <div className="stock-label">Market Data</div>
          <h2 className="stock-title">Stock Performance</h2>
        </div>
        <div className="stock-loading">
          <Activity className="loading-icon" size={24} />
          <span>Loading real-time data for {ticker}...</span>
        </div>
      </section>
    )
  }

  if (error || !data) {
    return (
      <section className="stock-section" id="stock">
        <div className="stock-header">
          <div className="stock-label">Market Data</div>
          <h2 className="stock-title">Stock Performance</h2>
        </div>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--space-2xl)' }}>
          Unable to load stock data. {error}
        </div>
      </section>
    )
  }

  const isPositive = data.change >= 0
  const prices = data.history.map(h => h.price)
  const min = Math.min(...prices)
  const max = Math.max(...prices)

  // SVG Sparkline Logic
  const width = 600
  const height = 120
  const padding = 10

  const points = data.history.map((h, i) => {
    const x = padding + (i / (data.history.length - 1)) * (width - padding * 2)
    const y = padding + (height - padding * 2) - ((h.price - min) / (max - min || 1)) * (height - padding * 2)
    return `${x},${y}`
  }).join(' ')

  // Gradient fill path
  const areaPath = `M ${padding},${height - padding} ` +
    data.history.map((h, i) => {
      const x = padding + (i / (data.history.length - 1)) * (width - padding * 2)
      const y = padding + (height - padding * 2) - ((h.price - min) / (max - min || 1)) * (height - padding * 2)
      return `L ${x},${y}`
    }).join(' ') +
    ` L ${width - padding},${height - padding} Z`

  const formatMarketCap = (value) => {
    if (!value) return 'N/A'
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`
    return `$${value.toLocaleString()}`
  }

  const formatVolume = (value) => {
    if (!value) return 'N/A'
    if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`
    if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`
    if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`
    return value.toLocaleString()
  }

  return (
    <section className="stock-section" id="stock">
      <div className="stock-header">
        <div className="stock-label">Real-Time Market Data</div>
        <h2 className="stock-title">{companyName || ticker} Stock Performance</h2>
      </div>

      <div className="stock-content">
        {/* Main Price Card */}
        <motion.div 
          className="stock-price-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="price-header">
            <div className="price-info">
              <span className="ticker-badge">{data.ticker}</span>
              <div className="current-price">
                <DollarSign size={28} className="price-icon" />
                <span className="price-value">{data.current_price}</span>
              </div>
              <div className={`price-change ${isPositive ? 'positive' : 'negative'}`}>
                {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                <span>{isPositive ? '+' : ''}{data.change} ({data.change_percent}%)</span>
              </div>
            </div>
            <div className={`trend-indicator ${isPositive ? 'positive' : 'negative'}`}>
              {isPositive ? <TrendingUp size={32} /> : <TrendingDown size={32} />}
            </div>
          </div>

          {/* Animated SVG Chart */}
          <div className="chart-container">
            <svg viewBox={`0 0 ${width} ${height}`} className="stock-chart">
              <defs>
                <linearGradient id={`gradient-${ticker}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={isPositive ? '#4ade80' : '#f87171'} stopOpacity="0.3" />
                  <stop offset="100%" stopColor={isPositive ? '#4ade80' : '#f87171'} stopOpacity="0" />
                </linearGradient>
              </defs>
              
              {/* Area fill */}
              <motion.path
                d={areaPath}
                fill={`url(#gradient-${ticker})`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 0.5 }}
              />

              {/* Line */}
              <motion.polyline
                fill="none"
                stroke={isPositive ? '#4ade80' : '#f87171'}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />

              {/* Current price dot */}
              <motion.circle
                cx={width - padding}
                cy={padding + (height - padding * 2) - ((prices[prices.length - 1] - min) / (max - min || 1)) * (height - padding * 2)}
                r="6"
                fill={isPositive ? '#4ade80' : '#f87171'}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: 1.5 }}
              />
            </svg>

            <div className="chart-labels">
              <span className="chart-label-low">30D Low: ${min.toFixed(2)}</span>
              <span className="chart-label-period">Last 30 Days</span>
              <span className="chart-label-high">30D High: ${max.toFixed(2)}</span>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="stock-stats-grid">
          <motion.div 
            className="stock-stat-card"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <BarChart3 size={20} className="stat-icon" />
            <div className="stat-content">
              <span className="stat-value">{formatMarketCap(data.summary?.market_cap)}</span>
              <span className="stat-label">Market Cap</span>
            </div>
          </motion.div>

          <motion.div 
            className="stock-stat-card"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Activity size={20} className="stat-icon" />
            <div className="stat-content">
              <span className="stat-value">{formatVolume(data.summary?.volume)}</span>
              <span className="stat-label">Volume</span>
            </div>
          </motion.div>

          <motion.div 
            className="stock-stat-card"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <TrendingUp size={20} className="stat-icon" />
            <div className="stat-content">
              <span className="stat-value">${data.summary?.high_52w?.toFixed(2) || 'N/A'}</span>
              <span className="stat-label">52W High</span>
            </div>
          </motion.div>

          <motion.div 
            className="stock-stat-card"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <TrendingDown size={20} className="stat-icon" />
            <div className="stat-content">
              <span className="stat-value">${data.summary?.low_52w?.toFixed(2) || 'N/A'}</span>
              <span className="stat-label">52W Low</span>
            </div>
          </motion.div>

          {data.summary?.pe_ratio && (
            <motion.div 
              className="stock-stat-card"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <DollarSign size={20} className="stat-icon" />
              <div className="stat-content">
                <span className="stat-value">{data.summary.pe_ratio.toFixed(2)}</span>
                <span className="stat-label">P/E Ratio</span>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  )
}
