import React from 'react'

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
  const cx = size / 2
  const cy = size / 2
  const outerRadius = size * 0.4
  const nodeRadius = 28

  // Calculate threat levels from analysis data (simplified - based on metrics count)
  const getThreatLevel = (forceId) => {
    if (!analysisData) return 0.5
    const forceName = Object.keys(FORCE_NAME_MAP).find(k => FORCE_NAME_MAP[k] === forceId)
    const forceData = analysisData[forceName]
    if (!forceData) return 0.5
    const metricsCount = forceData.numerical_analysis?.metrics?.length || 0
    return Math.min(0.3 + metricsCount * 0.15, 1)
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
          
          return (
            <g
              key={f.id}
              className={`pentagon-node ${f.id}`}
              onClick={() => onForceClick?.(f.id)}
              style={{ cursor: 'pointer' }}
            >
              {/* Glow effect */}
              <circle
                cx={x}
                cy={y}
                r={nodeRadius + 4}
                fill="none"
                stroke={forceColor}
                strokeWidth="2"
                opacity={analyzing ? 0.3 : (analysisData ? threat * 0.5 : 0.1)}
                style={{
                  animation: analyzing ? 'pulse 1.5s ease-in-out infinite' : 'none',
                }}
              />
              
              {/* Main node */}
              <circle
                cx={x}
                cy={y}
                r={nodeRadius}
                fill="var(--bg-surface)"
                stroke={forceColor}
                strokeWidth="3"
              />
              
              {/* Label */}
              <text
                x={x}
                y={y + 4}
                textAnchor="middle"
                fill="var(--text-primary)"
                fontSize="11"
                fontWeight="600"
              >
                {f.label}
              </text>

              {/* Threat indicator arc */}
              {analysisData && (
                <circle
                  cx={x}
                  cy={y}
                  r={nodeRadius - 6}
                  fill="none"
                  stroke={forceColor}
                  strokeWidth="3"
                  strokeDasharray={`${threat * 100} 100`}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${x} ${y})`}
                  opacity="0.7"
                />
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
