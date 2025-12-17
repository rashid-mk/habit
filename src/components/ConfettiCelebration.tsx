import { useEffect } from 'react'

interface ConfettiCelebrationProps {
  isActive: boolean
  onComplete: () => void
}

export function ConfettiCelebration({ isActive, onComplete }: ConfettiCelebrationProps) {
  useEffect(() => {
    if (!isActive) return
    
    const timer = setTimeout(() => onComplete(), 3000)
    return () => clearTimeout(timer)
  }, [isActive, onComplete])

  if (!isActive) return null

  // Modern vibrant color palette
  const confettiColors = [
    '#FF6B9D', '#C44569', '#FFA07A', '#FF8C42', '#FFD93D',
    '#6BCF7F', '#4ECDC4', '#45B7D1', '#5F27CD', '#A29BFE',
    '#FD79A8', '#FDCB6E', '#00B894', '#00CEC9', '#0984E3'
  ]
  
  // Generate confetti pieces with varied shapes
  const confettiPieces = Array.from({ length: 80 }).map(() => {
    const left = Math.random() * 100
    const delay = Math.random() * 400
    const duration = 2500 + Math.random() * 1000
    const color = confettiColors[Math.floor(Math.random() * confettiColors.length)]
    const size = 10 + Math.random() * 12
    const rotation = Math.random() * 360
    const wobble = -30 + Math.random() * 60
    
    // Different shapes: circle, square, rectangle
    const shapeType = Math.random()
    let shape = {}
    if (shapeType < 0.33) {
      // Circle
      shape = { borderRadius: '50%' }
    } else if (shapeType < 0.66) {
      // Square
      shape = { borderRadius: '2px' }
    } else {
      // Rectangle
      shape = { 
        width: `${size * 0.6}px`,
        height: `${size * 1.4}px`,
        borderRadius: '2px'
      }
    }
    
    return { left, delay, duration, color, size, rotation, wobble, shape }
  })
  
  return (
    <div 
      className="fixed inset-0 pointer-events-none" 
      style={{ 
        zIndex: 99999,
        overflow: 'hidden'
      }}
    >
      {/* Confetti pieces */}
      {confettiPieces.map((piece, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${piece.left}%`,
            top: '-30px',
            width: `${piece.size}px`,
            height: `${piece.size}px`,
            backgroundColor: piece.color,
            boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
            animation: `confetti-fall-${i} ${piece.duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards ${piece.delay}ms`,
            ...piece.shape
          }}
        />
      ))}
      
      {/* Celebration emoji with burst effect */}
      <div 
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '8rem',
          animation: 'celebration-burst 800ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          zIndex: 100000,
          filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.2))',
        }}
      >
        🎉
      </div>
      
      {/* Radial burst effect */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,215,0,0.3) 0%, rgba(255,215,0,0) 70%)',
          animation: 'burst-expand 600ms ease-out forwards',
          zIndex: 99998,
        }}
      />
      
      <style>{`
        ${confettiPieces.map((piece, i) => `
          @keyframes confetti-fall-${i} {
            0% {
              transform: translateY(0) rotate(${piece.rotation}deg) translateX(0);
              opacity: 1;
            }
            100% {
              transform: translateY(100vh) rotate(${piece.rotation + 720}deg) translateX(${piece.wobble}px);
              opacity: 0;
            }
          }
        `).join('')}
        
        @keyframes celebration-burst {
          0% {
            transform: translate(-50%, -50%) scale(0) rotate(-180deg);
            opacity: 0;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.3) rotate(10deg);
          }
          100% {
            transform: translate(-50%, -50%) scale(1) rotate(0deg);
            opacity: 1;
          }
        }
        
        @keyframes burst-expand {
          0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 0.8;
          }
          100% {
            transform: translate(-50%, -50%) scale(3);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}
