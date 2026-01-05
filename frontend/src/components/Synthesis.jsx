import React from 'react'
import PentagonRadar from './PentagonRadar'
import { FORCE_NAME_MAP } from './PentagonRadar'

// Parse LLM text analysis into sections
function parseAnalysisText(textAnalysis) {
  if (!textAnalysis) return { explanation: '', keyNumbers: '', orgView: '', investorView: '' }
  
  const sections = textAnalysis.split('\n\n').filter(s => s.trim())
  
  let explanation = ''
  let keyNumbers = ''
  let orgView = ''
  let investorView = ''
  
  sections.forEach(section => {
    const lines = section.trim().split('\n')
    const firstLine = lines[0] || ''
    const content = lines.slice(1).join('\n').trim()
    
    if (firstLine.includes('EXPLANATION')) {
      explanation = content || lines.slice(1).join(' ').trim()
    } else if (firstLine.includes('KEY_NUMBERS') || firstLine.includes('KEY NUMBERS')) {
      keyNumbers = content || lines.slice(1).join(' ').trim()
    } else if (firstLine.includes('ORGANIZATION_VIEW') || firstLine.includes('ORGANIZATION VIEW')) {
      orgView = content || lines.slice(1).join('\n').trim()
    } else if (firstLine.includes('INVESTOR_VIEW') || firstLine.includes('INVESTOR VIEW')) {
      investorView = content || lines.slice(1).join('\n').trim()
    }
  })
  
  if (!explanation && textAnalysis) {
    explanation = textAnalysis.substring(0, 500)
  }
  
  return { explanation, keyNumbers, orgView, investorView }
}

// Generate and download HTML report
function generateReport(ticker, companyName, analysisData, overallScore, highestRiskForce) {
  const date = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })
  
  const forceDetails = Object.entries(analysisData).map(([forceName, data]) => {
    const { explanation, keyNumbers, orgView, investorView } = parseAnalysisText(data.text_analysis)
    const metrics = data.numerical_analysis?.metrics || []
    
    return `
      <div class="force-section">
        <h2>${forceName}</h2>
        
        <div class="subsection">
          <h3>📝 Analysis</h3>
          <p>${explanation || 'No analysis available.'}</p>
        </div>
        
        ${keyNumbers ? `
        <div class="subsection">
          <h3>📊 Key Numbers</h3>
          <p>${keyNumbers}</p>
        </div>
        ` : ''}
        
        ${orgView ? `
        <div class="subsection">
          <h3>🏢 Organization Perspective</h3>
          <p>${orgView.replace(/\n/g, '<br>')}</p>
        </div>
        ` : ''}
        
        ${investorView ? `
        <div class="subsection">
          <h3>💰 Investor Perspective</h3>
          <p>${investorView.replace(/\n/g, '<br>')}</p>
        </div>
        ` : ''}
        
        ${metrics.length > 0 ? `
        <div class="subsection">
          <h3>📈 Metrics</h3>
          <table>
            <tr>
              <th>Metric</th>
              <th>Value</th>
              <th>Unit</th>
              <th>Description</th>
            </tr>
            ${metrics.map(m => `
              <tr>
                <td>${m.name || '-'}</td>
                <td>${m.value || '-'}</td>
                <td>${m.unit || '-'}</td>
                <td>${m.description || '-'}</td>
              </tr>
            `).join('')}
          </table>
        </div>
        ` : ''}
      </div>
    `
  }).join('<hr>')
  
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Porter's Five Forces Report - ${ticker}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 900px;
      margin: 0 auto;
      padding: 40px 20px;
      background: #fff;
    }
    
    .header {
      text-align: center;
      border-bottom: 3px solid #fbbf24;
      padding-bottom: 30px;
      margin-bottom: 40px;
    }
    
    .header h1 {
      font-size: 2.5rem;
      color: #1a1a2e;
      margin-bottom: 8px;
    }
    
    .header .ticker {
      color: #fbbf24;
      font-weight: 600;
    }
    
    .header .subtitle {
      color: #666;
      font-size: 1.1rem;
    }
    
    .header .date {
      color: #999;
      font-size: 0.9rem;
      margin-top: 10px;
    }
    
    .summary {
      display: flex;
      justify-content: center;
      gap: 30px;
      margin-bottom: 50px;
      flex-wrap: wrap;
    }
    
    .summary-box {
      background: #f8f9fa;
      border-radius: 12px;
      padding: 20px 30px;
      text-align: center;
      min-width: 150px;
      border: 1px solid #e9ecef;
    }
    
    .summary-box .label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #666;
      margin-bottom: 8px;
    }
    
    .summary-box .value {
      font-size: 2rem;
      font-weight: 700;
      color: #fbbf24;
    }
    
    .summary-box .desc {
      font-size: 0.85rem;
      color: #888;
      margin-top: 4px;
    }
    
    .force-section {
      margin-bottom: 40px;
      page-break-inside: avoid;
    }
    
    .force-section h2 {
      font-size: 1.5rem;
      color: #1a1a2e;
      border-left: 4px solid #fbbf24;
      padding-left: 15px;
      margin-bottom: 20px;
    }
    
    .subsection {
      margin-bottom: 20px;
      padding-left: 20px;
    }
    
    .subsection h3 {
      font-size: 1rem;
      color: #444;
      margin-bottom: 10px;
    }
    
    .subsection p {
      color: #555;
      text-align: justify;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      font-size: 0.9rem;
    }
    
    th, td {
      border: 1px solid #ddd;
      padding: 10px;
      text-align: left;
    }
    
    th {
      background: #f8f9fa;
      font-weight: 600;
      color: #333;
    }
    
    tr:nth-child(even) {
      background: #fafafa;
    }
    
    hr {
      border: none;
      border-top: 1px solid #eee;
      margin: 40px 0;
    }
    
    .footer {
      text-align: center;
      margin-top: 50px;
      padding-top: 30px;
      border-top: 1px solid #eee;
      color: #999;
      font-size: 0.85rem;
    }
    
    @media print {
      body { padding: 20px; }
      .force-section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${companyName || ticker} <span class="ticker">(${ticker})</span></h1>
    <div class="subtitle">Porter's Five Forces Analysis</div>
    <div class="date">Generated on ${date}</div>
  </div>
  
  <div class="summary">
    <div class="summary-box">
      <div class="label">Overall Score</div>
      <div class="value">${overallScore}</div>
      <div class="desc">Competitive Position</div>
    </div>
    <div class="summary-box">
      <div class="label">Key Risk</div>
      <div class="value" style="font-size: 1.2rem;">${highestRiskForce}</div>
      <div class="desc">Highest Concern</div>
    </div>
    <div class="summary-box">
      <div class="label">Forces Analyzed</div>
      <div class="value">${Object.keys(analysisData).length}</div>
      <div class="desc">From SEC 10-K Filing</div>
    </div>
  </div>
  
  ${forceDetails}
  
  <div class="footer">
    <p>Generated by Porter Observatory | AI-powered analysis from SEC 10-K filings</p>
    <p>This report is for informational purposes only and should not be considered financial advice.</p>
  </div>
</body>
</html>
  `
  
  // Create and download the file
  const blob = new Blob([htmlContent], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `Porter_Analysis_${ticker}_${new Date().toISOString().split('T')[0]}.html`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

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

  // Handle export
  const handleExport = () => {
    generateReport(ticker, companyName, analysisData, overallScore, highestRiskForce)
  }

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
        <button className="btn-primary" onClick={handleExport}>
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
