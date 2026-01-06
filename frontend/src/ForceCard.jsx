import React from 'react'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

export default function ForceCard({ force, data }) {
  if (!data) return null

  const textAnalysis = data.text_analysis
  const metrics = data.numerical_analysis?.metrics || []

  const numericMetrics = metrics.filter(m => typeof m.value === 'number')
  const chartData = numericMetrics.length ? {
    labels: numericMetrics.map(m => m.name),
    datasets: [
      {
        label: 'Value',
        data: numericMetrics.map(m => m.value),
        backgroundColor: '#667eea',
      }
    ]
  } : null

  const sections = textAnalysis.split('\n\n').filter(s => s.trim())

  // Clean content: remove asterisks, bullet points, and markdown symbols
  const cleanContent = (text) => {
    return text
      .replace(/^\s*[\*\-•]\s*/gm, '') // Remove bullet points at start of lines
      .replace(/\*\*/g, '')            // Remove bold markdown **
      .replace(/\*/g, '')              // Remove remaining asterisks
      .replace(/^#+\s*/gm, '')         // Remove markdown headers
      .replace(/\n{3,}/g, '\n\n')      // Collapse multiple newlines
      .trim()
  }

  const parseSection = (text) => {
    const lines = text.trim().split('\n')
    const firstLine = lines[0]
    const content = cleanContent(lines.slice(1).join('\n'))
    return { firstLine, content }
  }

  return (
    <div className="force-card">
      <h3>{force}</h3>

      {sections.map((section, idx) => {
        const { firstLine, content } = parseSection(section)

        if (firstLine.includes('EXPLANATION')) {
          return (
            <div key={idx} className="force-section">
              <h4>📝 Explanation</h4>
              <p>{content}</p>
            </div>
          )
        } else if (firstLine.includes('KEY_NUMBERS')) {
          return (
            <div key={idx} className="force-section">
              <h4>📊 Key Numbers</h4>
              <p>{content}</p>
            </div>
          )
        } else if (firstLine.includes('ORGANIZATION_VIEW')) {
          return (
            <div key={idx} className="force-section">
              <h4>🏢 Organization View</h4>
              <p>{content}</p>
            </div>
          )
        } else if (firstLine.includes('INVESTOR_VIEW')) {
          return (
            <div key={idx} className="force-section">
              <h4>💰 Investor View</h4>
              <p>{content}</p>
            </div>
          )
        }
        return null
      })}

      {metrics.length > 0 && (
        <div className="metrics">
          <h4>Financial Metrics</h4>
          {metrics.map((metric, idx) => (
            <div key={idx} className="metric-item">
              <div className="metric-name">{metric.name}</div>
              <div>
                <span className="metric-value">{metric.value}</span>
                <span className="metric-unit"> {metric.unit || ''} ({metric.year || ''})</span>
              </div>
              <div className="metric-description">{metric.description}</div>
            </div>
          ))}

          {chartData && (
            <div style={{ marginTop: '12px' }}>
              <Bar data={chartData} options={{ plugins: { legend: { display: false } } }} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
