import React, { useEffect, useRef, useState } from 'react'

export default function BackgroundEffects() {
  const canvasRef = useRef(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const particlesRef = useRef([])
  const animationFrameRef = useRef(null)

  // Track mouse movement for interactive particles
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Initialize and animate particles
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    const updateCanvasSize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    updateCanvasSize()
    window.addEventListener('resize', updateCanvasSize)

    // Create particles
    const particleCount = 80
    const particles = []
    
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.1,
        color: `rgba(251, 191, 36, ${Math.random() * 0.3 + 0.1})`, // Gold with varying opacity
      })
    }
    particlesRef.current = particles

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach((particle, i) => {
        // Move particle
        particle.x += particle.vx
        particle.y += particle.vy

        // Mouse interaction - particles attracted to cursor
        const dx = mousePos.x - particle.x
        const dy = mousePos.y - particle.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (distance < 150) {
          const force = (150 - distance) / 150
          particle.x += (dx / distance) * force * 0.5
          particle.y += (dy / distance) * force * 0.5
        }

        // Boundary bounce
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1

        // Keep within bounds
        particle.x = Math.max(0, Math.min(canvas.width, particle.x))
        particle.y = Math.max(0, Math.min(canvas.height, particle.y))

        // Draw particle
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
        ctx.fillStyle = particle.color
        ctx.fill()

        // Draw connections to nearby particles
        particles.forEach((other, j) => {
          if (i >= j) return
          const dx = particle.x - other.x
          const dy = particle.y - other.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          if (distance < 120) {
            ctx.beginPath()
            ctx.moveTo(particle.x, particle.y)
            ctx.lineTo(other.x, other.y)
            ctx.strokeStyle = `rgba(251, 191, 36, ${(1 - distance / 120) * 0.15})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        })
      })

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', updateCanvasSize)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [mousePos])

  return (
    <>
      {/* Animated Gradient Background */}
      <div className="bg-gradient-animated"></div>

      {/* Ambient Glow */}
      <div className="ambient-glow"></div>

      {/* Interactive Particle Canvas */}
      <canvas 
        ref={canvasRef} 
        className="bg-particles"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 1,
          opacity: 0.6
        }}
      />

      {/* Animated SVG Shapes */}
      <svg className="bg-svg-shapes" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="shapeGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.1">
              <animate attributeName="stop-opacity" values="0.05;0.15;0.05" dur="8s" repeatCount="indefinite"/>
            </stop>
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1">
              <animate attributeName="stop-opacity" values="0.1;0.05;0.1" dur="8s" repeatCount="indefinite"/>
            </stop>
          </linearGradient>
          <linearGradient id="shapeGradient2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.08"/>
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.08"/>
          </linearGradient>
        </defs>

        {/* Morphing circles */}
        <circle cx="10%" cy="20%" r="150" fill="url(#shapeGradient1)">
          <animate attributeName="cx" values="10%;15%;10%" dur="20s" repeatCount="indefinite"/>
          <animate attributeName="cy" values="20%;25%;20%" dur="25s" repeatCount="indefinite"/>
          <animate attributeName="r" values="150;180;150" dur="15s" repeatCount="indefinite"/>
        </circle>

        <circle cx="85%" cy="70%" r="200" fill="url(#shapeGradient2)">
          <animate attributeName="cx" values="85%;80%;85%" dur="22s" repeatCount="indefinite"/>
          <animate attributeName="cy" values="70%;65%;70%" dur="28s" repeatCount="indefinite"/>
          <animate attributeName="r" values="200;230;200" dur="18s" repeatCount="indefinite"/>
        </circle>

        {/* Floating pentagon shape */}
        <path 
          d="M 500,100 L 650,200 L 600,400 L 400,400 L 350,200 Z" 
          fill="rgba(251, 191, 36, 0.03)"
          stroke="rgba(251, 191, 36, 0.1)"
          strokeWidth="1"
        >
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0,0; 20,-10; 0,0"
            dur="30s"
            repeatCount="indefinite"
          />
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="0 500 250; 5 500 250; 0 500 250"
            dur="40s"
            repeatCount="indefinite"
            additive="sum"
          />
        </path>
      </svg>

      {/* Parallax layers */}
      <div className="parallax-layer parallax-layer-1"></div>
      <div className="parallax-layer parallax-layer-2"></div>
    </>
  )
}
