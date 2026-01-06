import React from 'react'
import { FORCE_NAME_MAP } from './PentagonRadar'

// Force visual icons/emojis
const FORCE_ICONS = {
  rivalry: '⚔️',
  buyers: '👥',
  suppliers: '🔗',
  entrants: '🚪',
  substitutes: '🔀',
}

// Force chapter numbers
const FORCE_ORDER = ['rivalry', 'buyers', 'suppliers', 'entrants', 'substitutes']

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
  
  // Fallback: if no structured content found, use the whole text as explanation
  if (!explanation && textAnalysis) {
    explanation = textAnalysis.substring(0, 500)
  }
  
  return { explanation, keyNumbers, orgView, investorView }
}

// Clean content: remove asterisks, bullet points, and markdown symbols
function cleanContent(text) {
  if (!text) return ''
  return text
    .replace(/^\s*[\*\-•]\s*/gm, '')  // Remove bullet points at start of lines
    .replace(/\*\*/g, '')              // Remove bold markdown **
    .replace(/\*/g, '')                // Remove remaining asterisks
    .replace(/^#+\s*/gm, '')           // Remove markdown headers
    .replace(/\n{2,}/g, ' ')           // Collapse multiple newlines into space
    .replace(/\n/g, ' ')               // Replace single newlines with space
    .replace(/\s{2,}/g, ' ')           // Collapse multiple spaces
    .trim()
}

// Format text as clean prose paragraphs
function formatProse(text) {
  if (!text) return null
  
  const cleanedText = cleanContent(text)
  
  if (!cleanedText) return null
  
  return <p style={{ lineHeight: '1.7', margin: 0 }}>{cleanedText}</p>
}

export default function ForceChapter({ 
  forceId, 
  forceName, 
  data, 
  chapterNumber,
  isVisible = false 
}) {
  if (!data) return null
  
  const { explanation, keyNumbers, orgView, investorView } = parseAnalysisText(data.text_analysis)
  const metrics = data.numerical_analysis?.metrics || []
  
  return (
    <section 
      id={`chapter-${forceId}`}
      className={`chapter ${forceId} ${isVisible ? 'visible' : ''}`}
    >
      {/* Visual Side */}
      <div className="chapter-visual">
        <div className="force-icon">{FORCE_ICONS[forceId]}</div>
      </div>
      
      {/* Content Side */}
      <div className="chapter-content">
        <div className="chapter-number">Chapter {chapterNumber.toString().padStart(2, '0')}</div>
        <h2 className="chapter-title">{forceName}</h2>
        
        {/* Narrative */}
        <div className="chapter-narrative">
          {cleanContent(explanation) || 'Analysis in progress...'}
        </div>
        
        {/* Perspectives */}
        <div className="perspectives">
          {orgView && (
            <div className="perspective">
              <div className="perspective-header">
                <span className="perspective-icon">🏢</span>
                <span className="perspective-title">Organization View</span>
              </div>
              <div className="perspective-content">
                {formatProse(orgView)}
              </div>
            </div>
          )}
          
          {investorView && (
            <div className="perspective">
              <div className="perspective-header">
                <span className="perspective-icon">💰</span>
                <span className="perspective-title">Investor View</span>
              </div>
              <div className="perspective-content">
                {formatProse(investorView)}
              </div>
            </div>
          )}
        </div>
        
        {/* Metrics Strip */}
        {metrics.length > 0 && (
          <div className="metrics-strip">
            {metrics.slice(0, 5).map((metric, idx) => (
              <div key={idx} className="metric-card">
                <div className="metric-value">
                  {typeof metric.value === 'number' 
                    ? metric.value.toLocaleString() 
                    : metric.value}
                  {metric.unit && <span style={{ fontSize: '0.7em' }}> {metric.unit}</span>}
                </div>
                <div className="metric-label">{metric.name}</div>
              </div>
            ))}
          </div>
        )}
        
        {/* Key Numbers if no structured metrics */}
        {metrics.length === 0 && keyNumbers && (
          <div className="metrics-strip">
            <div className="metric-card" style={{ minWidth: '200px' }}>
              <div className="metric-label">Key Numbers</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                {keyNumbers}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export { FORCE_ORDER, FORCE_ICONS }
