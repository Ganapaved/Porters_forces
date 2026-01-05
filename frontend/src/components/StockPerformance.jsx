import React, { useState, useEffect, useRef } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
)

// Generate mock stock data for 10 years
function generateMockStockData(ticker, years = 10) {
  const data = []
  const labels = []
  const currentYear = new Date().getFullYear()
  
  // Base prices for known companies
  const basePrices = {
    AAPL: 25,
    MSFT: 30,
    GOOGL: 50,
    AMZN: 80,
    NVDA: 5,
    TSLA: 20,
    META: 30,
  }
  
  let price = basePrices[ticker] || 50
  const volatility = 0.15
  const trend = 0.08 // 8% annual growth average
  
  for (let year = currentYear - years; year <= currentYear; year++) {
    for (let month = 1; month <= 12; month++) {
      if (year === currentYear && month > new Date().getMonth() + 1) break
      
      // Random walk with upward trend
      const randomChange = (Math.random() - 0.5) * volatility
      const trendChange = trend / 12
      price = price * (1 + randomChange + trendChange)
      price = Math.max(price, 1) // Ensure price doesn't go negative
      
      data.push(parseFloat(price.toFixed(2)))
      labels.push(`${year}-${month.toString().padStart(2, '0')}`)
    }
  }
  
  return { data, labels }
}

// Calculate stock statistics
function calculateStats(data) {
  if (!data.length) return {}
  
  const current = data[data.length - 1]
  const yearAgo = data[Math.max(0, data.length - 12)]
  const fiveYearsAgo = data[Math.max(0, data.length - 60)]
  const allTimeHigh = Math.max(...data)
  const allTimeLow = Math.min(...data)
  const yearChange = ((current - yearAgo) / yearAgo * 100).toFixed(2)
  const fiveYearChange = ((current - fiveYearsAgo) / fiveYearsAgo * 100).toFixed(2)
  
  return {
    current: current.toFixed(2),
    yearChange,
    fiveYearChange,
    high: allTimeHigh.toFixed(2),
    low: allTimeLow.toFixed(2),
  }
}

export default function StockPerformance({ ticker, companyName }) {
  const [period, setPeriod] = useState('10Y')
  const [stockData, setStockData] = useState({ data: [], labels: [] })
  const [stats, setStats] = useState({})

  useEffect(() => {
    if (ticker) {
      // Generate mock data (replace with API call later)
      const mockData = generateMockStockData(ticker, 10)
      setStockData(mockData)
      setStats(calculateStats(mockData.data))
    }
  }, [ticker])

  // Filter data based on selected period
  const getFilteredData = () => {
    const { data, labels } = stockData
    if (!data.length) return { data: [], labels: [] }
    
    let months = data.length
    switch (period) {
      case '1Y': months = 12; break
      case '3Y': months = 36; break
      case '5Y': months = 60; break
      case '10Y': months = data.length; break
      default: months = data.length
    }
    
    return {
      data: data.slice(-months),
      labels: labels.slice(-months)
    }
  }

  const filteredData = getFilteredData()
  const isPositive = parseFloat(stats.yearChange) >= 0

  const chartData = {
    labels: filteredData.labels,
    datasets: [
      {
        label: `${ticker} Stock Price`,
        data: filteredData.data,
        borderColor: isPositive ? '#10b981' : '#f43f5e',
        backgroundColor: isPositive 
          ? 'rgba(16, 185, 129, 0.1)' 
          : 'rgba(244, 63, 94, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: isPositive ? '#10b981' : '#f43f5e',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index',
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#f1f5f9',
        bodyColor: '#94a3b8',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          title: (items) => {
            if (items.length) {
              const [year, month] = items[0].label.split('-')
              const date = new Date(year, month - 1)
              return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
            }
            return ''
          },
          label: (item) => `$${item.raw.toFixed(2)}`
        }
      }
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
        },
        ticks: {
          color: '#64748b',
          font: { size: 10 },
          maxTicksLimit: 8,
          callback: function(value, index) {
            const label = this.getLabelForValue(value)
            if (label) {
              const [year, month] = label.split('-')
              if (month === '01' || month === '06') {
                return year
              }
            }
            return ''
          }
        }
      },
      y: {
        display: true,
        position: 'right',
        grid: {
          color: 'rgba(255,255,255,0.05)',
        },
        ticks: {
          color: '#64748b',
          font: { size: 10 },
          callback: (value) => `$${value}`
        }
      }
    },
    animation: {
      duration: 1000,
      easing: 'easeOutQuart'
    }
  }

  if (!ticker) {
    return (
      <section className="stock-performance" id="stock-performance">
        <div className="stock-performance-inner">
          <div className="stock-header">
            <div className="stock-label">Market Performance</div>
            <h2 className="stock-title">Stock Performance</h2>
          </div>
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--space-2xl)' }}>
            Select a company to view its stock performance chart.
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="stock-performance" id="stock-performance">
      <div className="stock-performance-inner">
        <div className="stock-header">
          <div className="stock-label">Market Performance</div>
          <h2 className="stock-title">{companyName || ticker} Stock</h2>
        </div>

        <div className="stock-chart-container">
          <div className="stock-chart-header">
            <div className="stock-price-info">
              <span className="stock-current-price">${stats.current}</span>
              <span className={`stock-change ${isPositive ? 'positive' : 'negative'}`}>
                {isPositive ? '↑' : '↓'} {Math.abs(stats.yearChange)}% (1Y)
              </span>
            </div>
            
            <div className="stock-period-tabs">
              {['1Y', '3Y', '5Y', '10Y'].map((p) => (
                <button
                  key={p}
                  className={`period-tab ${period === p ? 'active' : ''}`}
                  onClick={() => setPeriod(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="stock-chart">
            <Line data={chartData} options={chartOptions} />
          </div>

          <div className="stock-stats">
            <div className="stock-stat-card">
              <div className="stock-stat-value">${stats.high}</div>
              <div className="stock-stat-label">All-Time High</div>
            </div>
            <div className="stock-stat-card">
              <div className="stock-stat-value">${stats.low}</div>
              <div className="stock-stat-label">All-Time Low</div>
            </div>
            <div className="stock-stat-card">
              <div className="stock-stat-value">{stats.yearChange}%</div>
              <div className="stock-stat-label">1 Year Return</div>
            </div>
            <div className="stock-stat-card">
              <div className="stock-stat-value">{stats.fiveYearChange}%</div>
              <div className="stock-stat-label">5 Year Return</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
