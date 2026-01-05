import React from 'react'
import PentagonRadar from './PentagonRadar'
import { FORCE_NAME_MAP } from './PentagonRadar'

export default function Synthesis({ ticker, companyName, analysisData }) {
  if (!analysisData) return null

  // Calculate overall metrics
  const forceCount = Object.keys(analysisData).length
  const totalMetrics = Object.values(analysisData).reduce((sum, force) => {
    return sum + (force.numerical_analysis?.metrics?.length || 0)
  }, 0)

  // Find highest risk force (most metrics = most discussed = higher concern)
  let highestRiskForce = 'Industry Rivalry'
  let maxMetrics = 0
  Object.entries(analysisData).forEach(([forceName, data]) => {
    const count = data.numerical_analysis?.metrics?.length || 0
    if (count > maxMetrics) {
      maxMetrics = count
      highestRiskForce = forceName
    }
  })

  // Generate overall score (simplified)
  const scores = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C']
  const scoreIndex = Math.min(Math.floor(totalMetrics / 3), scores.length - 1)
  const overallScore = scores[scoreIndex] || 'B'

  return (
    <section className="synthesis" id="synthesis">
      <div className="synthesis-header">
        <div className="synthesis-label">Complete Analysis</div>
        <h2 className="synthesis-title">
          {companyName || ticker} — Force Map
        </h2>
      </div>

      <div className="synthesis-pentagon">
        <PentagonRadar
          ticker={ticker}
          analysisData={analysisData}
          size={350}
          showLabels={true}
        />
      </div>

      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-card-title">Overall Score</div>
          <div className="summary-card-value">{overallScore}</div>
          <div className="summary-card-subtitle">Competitive Position</div>
        </div>

        <div className="summary-card">
          <div className="summary-card-title">Key Risk</div>
          <div className="summary-card-value" style={{ fontSize: '1.2rem' }}>
            {highestRiskForce.split(' ').slice(-1)[0]}
          </div>
          <div className="summary-card-subtitle">{highestRiskForce}</div>
        </div>

        <div className="summary-card">
          <div className="summary-card-title">Forces Analyzed</div>
          <div className="summary-card-value">{forceCount}</div>
          <div className="summary-card-subtitle">{totalMetrics} Metrics Found</div>
        </div>
      </div>

      <div className="synthesis-actions">
        <button className="btn-primary" onClick={() => window.print()}>
          Export Report
        </button>
        <button 
          className="btn-secondary"
          onClick={() => {
            navigator.clipboard.writeText(window.location.href)
            alert('Link copied!')
          }}
        >
          Share Analysis
        </button>
      </div>
    </section>
  )
}
