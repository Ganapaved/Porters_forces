import React from 'react'
import { FORCES } from './PentagonRadar'

export default function OrbitNavigator({ 
  activeForce, 
  onForceClick, 
  visible = false 
}) {
  return (
    <nav className={`orbit-nav ${visible ? 'visible' : ''}`}>
      {FORCES.map((force) => (
        <button
          key={force.id}
          className={`orbit-node ${force.id} ${activeForce === force.id ? 'active' : ''}`}
          data-label={force.fullLabel}
          onClick={() => onForceClick(force.id)}
          aria-label={`Navigate to ${force.fullLabel}`}
        >
          {force.label}
        </button>
      ))}
    </nav>
  )
}
