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

  // Calculate threat levels and risk percentage from analysis data
  const getThreatLevel = (forceId) => {
    if (!analysisData) return 0.5
    const forceName = Object.keys(FORCE_NAME_MAP).find(k => FORCE_NAME_MAP[k] === forceId)
    const forceData = analysisData[forceName]
    if (!forceData) return 0.5
    const metricsCount = forceData.numerical_analysis?.metrics?.length || 0
    return Math.min(0.3 + metricsCount * 0.15, 1)
  }

  // Calculate risk percentage (0-100)
  const getRiskPercentage = (forceId) => {
    const threat = getThreatLevel(forceId)
    return Math.round(threat * 100)
  }

  // Create dynamic shape based on threat levels
  const createDynamicPath = () => {
    const points = FORCES.map((f) => {
      const threat = getThreatLevel(f.id)
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
          const threat = getThreatLevel(f.id)
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
