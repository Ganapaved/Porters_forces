import React, { useState } from 'react'

const FORCES = [
  { id: 'rivalry', label: 'RIV', fullLabel: 'Rivalry', angle: -90 },
  { id: 'suppliers', label: 'SUP', fullLabel: 'Suppliers', angle: -18 },
  { id: 'substitutes', label: 'SUB', fullLabel: 'Substitutes', angle: 54 },
  { id: 'entrants', label: 'NEW', fullLabel: 'New Entrants', angle: 126 },
  { id: 'buyers', label: 'BUY', fullLabel: 'Buyers', angle: 198 },
]

// Map backend force names to our force IDs
const FORCE_NAME_MAP = {
  'Industry Rivalry': 'rivalry',
  'Bargaining Power of Suppliers': 'suppliers',
  'Threat of Substitutes': 'substitutes',
  'Threat of New Entrants': 'entrants',
  'Bargaining Power of Buyers': 'buyers',
}

function polarToCartesian(cx, cy, r, angleDeg) {
  const angleRad = (angleDeg * Math.PI) / 180
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  }
}

function createPentagonPath(cx, cy, r) {
  const points = FORCES.map((f) => {
    const { x, y } = polarToCartesian(cx, cy, r, f.angle)
    return `${x},${y}`
  })
  return `M ${points.join(' L ')} Z`
}

export default function PentagonRadar({ 
  ticker = '', 
  analysisData = null, 
  onForceClick,
  size = 400,
  showLabels = true,
  analyzing = false
}) {
  const [hoveredForce, setHoveredForce] = useState(null)
  
  const cx = size / 2
  const cy = size / 2
  const outerRadius = size * 0.4
  const nodeRadius = 28

  // Calculate threat level from ACTUAL analysis data using NLP on text_analysis
  const getThreatLevel = (forceId) => {
    if (!analysisData) return 0.5
    
    const forceName = Object.keys(FORCE_NAME_MAP).find(k => FORCE_NAME_MAP[k] === forceId)
    const forceData = analysisData[forceName]
    if (!forceData || !forceData.text_analysis) return 0.5

    const text = forceData.text_analysis.toLowerCase()
    
    // HIGH THREAT indicators (70-95% range)
    const highThreatKeywords = [
      'high', 'significant', 'substantial', 'severe', 'critical',
      'vulnerable', 'dependent', 'reliance', 'unable to', 'lack of',
      'margin pressure', 'limited alternatives', 'no long-term',
      'potential for order cancellations', 'excess inventory risk',
      'rapid pace of change', 'intense', 'aggressive'
    ]
    
    // MODERATE THREAT indicators (40-65% range)
    const moderateThreatKeywords = [
      'moderate', 'potential', 'some', 'certain', 'partial',
      'suggests', 'implies', 'may', 'could', 'risk of'
    ]
    
    // LOW THREAT indicators (15-35% range)
    const lowThreatKeywords = [
      'low', 'limited', 'minimal', 'weak', 'negligible',
      'strong barriers', 'high switching costs', 'differentiated',
      'ecosystem', 'loyalty', 'moat'
    ]

    // Count keyword matches
    let highScore = 0
    let moderateScore = 0
    let lowScore = 0

    highThreatKeywords.forEach(keyword => {
      if (text.includes(keyword)) highScore++
    })
    
    moderateThreatKeywords.forEach(keyword => {
      if (text.includes(keyword)) moderateScore++
    })
    
    lowThreatKeywords.forEach(keyword => {
      if (text.includes(keyword)) lowScore++
    })

    // Calculate weighted score
    // High threats increase score, low threats decrease it
    let baseScore = 50 // Start at 50% (moderate)
    
    // High threat words add 8-12 points each
    baseScore += highScore * 10
    
    // Moderate adds 3-5 points each
    baseScore += moderateScore * 4
    
    // Low threat words subtract 8-12 points each
    baseScore -= lowScore * 10
    
    // Add bonus for metrics (indicates concrete data-driven analysis)
    const metricsCount = forceData.numerical_analysis?.metrics?.length || 0
    if (metricsCount > 0) {
      baseScore += metricsCount * 5 // Each metric adds 5%
    }
    
    // Clamp between 15-95%
    const clampedScore = Math.max(15, Math.min(95, baseScore))
    
    // Convert to 0-1 scale for visualization
    return clampedScore / 100
  }

  // Normalize percentages to make them more realistic
  const normalizePercentages = () => {
    // Calculate raw percentages for all forces
    const rawPercentages = FORCES.map(f => ({
      id: f.id,
      percentage: Math.round(getThreatLevel(f.id) * 100)
    }))

    // Sort by percentage descending
    rawPercentages.sort((a, b) => b.percentage - a.percentage)

    // Apply constraints
    const normalized = []
    let above90Count = 0
    let above80Count = 0

    rawPercentages.forEach((force, index) => {
      let adjustedPercentage = force.percentage

      // RULE 1: Only ONE force can be above 90%
      if (adjustedPercentage > 90) {
        if (above90Count === 0) {
          above90Count++
          adjustedPercentage = Math.min(adjustedPercentage, 95) // Cap at 95%
        } else {
          adjustedPercentage = Math.min(adjustedPercentage, 85) // Reduce to 85%
        }
      }

      // RULE 2: Maximum 3 forces above 80%
      if (adjustedPercentage > 80) {
        if (above80Count < 3) {
          above80Count++
        } else {
          adjustedPercentage = 75 + Math.floor(Math.random() * 5) // Reduce to 75-79%
        }
      }

      // RULE 3: No duplicate percentages - reduce by 2-5% if duplicate exists
      const isDuplicate = normalized.some(n => n.percentage === adjustedPercentage)
      if (isDuplicate) {
        adjustedPercentage -= (2 + Math.floor(Math.random() * 4)) // Reduce by 2-5%
      }

      normalized.push({
        id: force.id,
        percentage: Math.max(15, adjustedPercentage) // Never below 15%
      })
    })

    // Convert to map for easy lookup
    return Object.fromEntries(normalized.map(n => [n.id, n.percentage]))
  }

  // Memoize normalized percentages to avoid recalculation on every render
  const normalizedPercentages = React.useMemo(
    () => analysisData ? normalizePercentages() : {},
    [analysisData]
  )

  // Get risk percentage (0-100) - now normalized
  const getRiskPercentage = (forceId) => {
    if (!analysisData) return Math.round(getThreatLevel(forceId) * 100)
    return normalizedPercentages[forceId] || 50
  }

  // Get threat level for visualization (0-1 scale)
  const getNormalizedThreatLevel = (forceId) => {
    return getRiskPercentage(forceId) / 100
  }

  // Create dynamic shape based on threat levels
  const createDynamicPath = () => {
    const points = FORCES.map((f) => {
      const threat = analysisData ? getNormalizedThreatLevel(f.id) : getThreatLevel(f.id)
      const r = outerRadius * (0.3 + threat * 0.7)
      const { x, y } = polarToCartesian(cx, cy, r, f.angle)
      return `${x},${y}`
    })
    return `M ${points.join(' L ')} Z`
  }

  return (
    <div className="pentagon-container" style={{ maxWidth: size }}>
      <svg 
        viewBox={`0 0 ${size} ${size}`} 
        className="pentagon-svg"
        style={{ width: '100%', height: '100%' }}
      >
        {/* Animated gradient definitions */}
        <defs>
          {FORCES.map((f) => (
            <radialGradient key={`grad-${f.id}`} id={`gradient-${f.id}`}>
              <stop offset="0%" stopColor={`var(--force-${f.id})`} stopOpacity="0.6">
                <animate
                  attributeName="stop-opacity"
                  values={hoveredForce === f.id ? "0.8;0.4;0.8" : "0.6;0.6;0.6"}
                  dur="2s"
                  repeatCount="indefinite"
                />
              </stop>
              <stop offset="100%" stopColor={`var(--force-${f.id})`} stopOpacity="0">
                <animate
                  attributeName="stop-opacity"
                  values={hoveredForce === f.id ? "0.2;0;0.2" : "0;0;0"}
                  dur="2s"
                  repeatCount="indefinite"
                />
              </stop>
            </radialGradient>
          ))}
        </defs>
        {/* Grid rings */}
        {[0.25, 0.5, 0.75, 1].map((scale, i) => (
          <path
            key={i}
            d={createPentagonPath(cx, cy, outerRadius * scale)}
            className="pentagon-grid"
          />
        ))}

        {/* Grid lines from center */}
        {FORCES.map((f) => {
          const { x, y } = polarToCartesian(cx, cy, outerRadius, f.angle)
          return (
            <line
              key={f.id}
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="1"
            />
          )
        })}

        {/* Dynamic filled shape */}
        {analysisData && (
          <path
            d={createDynamicPath()}
            className="pentagon-shape"
            style={{
              fill: 'rgba(251, 191, 36, 0.15)',
              stroke: '#fbbf24',
              strokeWidth: 2,
            }}
          />
        )}

        {/* Center text */}
        <text x={cx} y={cy - 8} className="pentagon-center-text">
          {analyzing ? 'ANALYZING' : (analysisData ? 'ANALYZED' : 'SELECT')}
        </text>
        <text x={cx} y={cy + 14} className="pentagon-center-ticker">
          {ticker || '—'}
        </text>

        {/* Force nodes */}
        {FORCES.map((f) => {
          const { x, y } = polarToCartesian(cx, cy, outerRadius, f.angle)
          const forceColor = `var(--force-${f.id})`
          const threat = analysisData ? getNormalizedThreatLevel(f.id) : getThreatLevel(f.id)
          const riskPercent = getRiskPercentage(f.id)
          const isHovered = hoveredForce === f.id
          
          return (
            <g
              key={f.id}
              className={`pentagon-node ${f.id}`}
              onClick={() => onForceClick?.(f.id)}
              onMouseEnter={() => setHoveredForce(f.id)}
              onMouseLeave={() => setHoveredForce(null)}
              style={{ cursor: 'pointer' }}
            >
              {/* Animated gradient glow on hover */}
              {isHovered && analysisData && (
                <circle
                  cx={x}
                  cy={y}
                  r={nodeRadius + 20}
                  fill={`url(#gradient-${f.id})`}
                  opacity="0.7"
                >
                  <animate
                    attributeName="r"
                    values={`${nodeRadius + 15};${nodeRadius + 25};${nodeRadius + 15}`}
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}
              
              {/* Outer glow effect */}
              <circle
                cx={x}
                cy={y}
                r={nodeRadius + 4}
                fill="none"
                stroke={forceColor}
                strokeWidth={isHovered ? "3" : "2"}
                opacity={analyzing ? 0.3 : (analysisData ? (isHovered ? 0.8 : threat * 0.5) : 0.1)}
                style={{
                  animation: analyzing ? 'pulse 1.5s ease-in-out infinite' : 'none',
                  transition: 'all 0.3s ease',
                }}
              />
              
              {/* Main node with gradient border animation */}
              <circle
                cx={x}
                cy={y}
                r={nodeRadius}
                fill={isHovered ? `var(--force-${f.id})` : "var(--bg-surface)"}
                fillOpacity={isHovered ? "0.15" : "1"}
                stroke={forceColor}
                strokeWidth={isHovered ? "4" : "3"}
                style={{
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  filter: isHovered ? 'drop-shadow(0 0 8px var(--force-' + f.id + '))' : 'none'
                }}
              >
                {isHovered && (
                  <animate
                    attributeName="stroke-width"
                    values="4;5;4"
                    dur="1s"
                    repeatCount="indefinite"
                  />
                )}
              </circle>
              
              {/* Label */}
              <text
                x={x}
                y={analysisData ? y - 2 : y + 4}
                textAnchor="middle"
                fill={isHovered ? forceColor : "var(--text-primary)"}
                fontSize={isHovered ? "12" : "11"}
                fontWeight="600"
                style={{
                  transition: 'all 0.3s ease',
                }}
              >
                {f.label}
              </text>

              {/* Risk percentage display */}
              {analysisData && (
                <text
                  x={x}
                  y={y + 10}
                  textAnchor="middle"
                  fill={forceColor}
                  fontSize={isHovered ? "14" : "12"}
                  fontWeight="700"
                  style={{
                    transition: 'all 0.3s ease',
                  }}
                >
                  {riskPercent}%
                </text>
              )}

              {/* Animated threat indicator arc */}
              {analysisData && (
                <circle
                  cx={x}
                  cy={y}
                  r={nodeRadius - 6}
                  fill="none"
                  stroke={forceColor}
                  strokeWidth={isHovered ? "4" : "3"}
                  strokeDasharray={`${threat * 100} 100`}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${x} ${y})`}
                  opacity={isHovered ? "1" : "0.7"}
                  style={{
                    transition: 'all 0.3s ease',
                  }}
                >
                  {isHovered && (
                    <animate
                      attributeName="stroke-dasharray"
                      values={`0 100;${threat * 100} 100;${threat * 100} 100`}
                      dur="1s"
                      repeatCount="1"
                    />
                  )}
                </circle>
              )}
              
              {/* Rotating ring effect on hover */}
              {isHovered && analysisData && (
                <circle
                  cx={x}
                  cy={y}
                  r={nodeRadius + 10}
                  fill="none"
                  stroke={forceColor}
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                  opacity="0.4"
                >
                  <animateTransform
                    attributeName="transform"
                    attributeType="XML"
                    type="rotate"
                    from={`0 ${x} ${y}`}
                    to={`360 ${x} ${y}`}
                    dur="3s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}
            </g>
          )
        })}
      </svg>

      {/* External labels */}
      {showLabels && (
        <>
          <span className="force-label rivalry">Rivalry</span>
          <span className="force-label suppliers">Suppliers</span>
          <span className="force-label substitutes">Substitutes</span>
          <span className="force-label entrants">New Entrants</span>
          <span className="force-label buyers">Buyers</span>
        </>
      )}
    </div>
  )
}

// Export force mapping for use in other components
export { FORCES, FORCE_NAME_MAP }
