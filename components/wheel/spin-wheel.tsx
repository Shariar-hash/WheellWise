'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'

interface WheelOption {
  id: string
  label: string
  color: string
  weight?: number
  count?: number
  isImage?: boolean
  imageUrl?: string
}

interface SpinWheelProps {
  options: WheelOption[]
  onSpinComplete?: (result: { label: string, option: WheelOption }) => void
  spinning?: boolean
  spinDuration?: number
  onSpinStart?: () => void
  targetResult?: string  // The result to land on (for syncing across clients)
  onWheelClick?: () => void  // Click handler for the wheel
  theme?: {
    backgroundColor?: string
    pointerColor?: string
    borderColor?: string
  }
}

export default function SpinWheel({
  options,
  onSpinComplete,
  spinning = false,
  spinDuration = 4,
  onSpinStart,
  targetResult,
  onWheelClick,
  theme = {},
}: SpinWheelProps) {
  const [rotation, setRotation] = useState(0)
  const [isSpinning, setIsSpinning] = useState(false)
  const [finalRotation, setFinalRotation] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Filter out empty options
  const validOptions = options.filter(option => option.label.trim() !== '')
  // Calculate proportional segments based on weights
  const getSegments = () => {
    const totalWeight = validOptions.reduce((sum, opt) => sum + (opt.weight || 1), 0)
    let currentAngle = 0
    
    return validOptions.map((opt, index) => {
      const portion = (opt.weight || 1) / totalWeight
      const sliceAngle = portion * 360
      const startAngle = currentAngle
      const endAngle = currentAngle + sliceAngle
      currentAngle = endAngle
      
      return { ...opt, index, startAngle, endAngle, sliceAngle }
    })
  }

  useEffect(() => {
    drawWheel()
  }, [validOptions])

  const drawWheel = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = Math.min(centerX, centerY) - 10

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Get proportional segments based on weights
    const segments = getSegments()

    // Draw segments
    segments.forEach((segment) => {
      const startAngle = (segment.startAngle - 90) * (Math.PI / 180)
      const endAngle = (segment.endAngle - 90) * (Math.PI / 180)

      // Draw segment
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, radius, startAngle, endAngle)
      ctx.closePath()
      ctx.fillStyle = segment.color
      ctx.fill()
      ctx.strokeStyle = theme.borderColor || '#ffffff'
      ctx.lineWidth = 2
      ctx.stroke()

      // Draw text or image
      if (segment.isImage && segment.imageUrl) {
        // Draw image segment
        const img = new Image()
        img.onload = () => {
          ctx.save()
          ctx.translate(centerX, centerY)
          ctx.rotate(startAngle + (segment.sliceAngle / 2) * (Math.PI / 180))
          
          // Create clipping path for the segment
          ctx.beginPath()
          ctx.moveTo(0, 0)
          ctx.arc(0, 0, radius - 40, -segment.sliceAngle / 2 * (Math.PI / 180), segment.sliceAngle / 2 * (Math.PI / 180))
          ctx.closePath()
          ctx.clip()
          
          // Draw image
          const imgSize = Math.min(radius - 60, 80)
          ctx.drawImage(img, radius - imgSize - 30, -imgSize/2, imgSize, imgSize)
          
          ctx.restore()
        }
        img.src = segment.imageUrl
      } else {
        // Draw text
        ctx.save()
        ctx.translate(centerX, centerY)
        ctx.rotate(startAngle + (segment.sliceAngle / 2) * (Math.PI / 180))
        ctx.textAlign = 'right'
        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 16px Arial'
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
        ctx.shadowBlur = 4
        ctx.fillText(segment.label, radius - 20, 5)
        ctx.restore()
      }
    })

    // Draw center circle
    ctx.beginPath()
    ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI)
    ctx.fillStyle = theme.backgroundColor || '#1e293b'
    ctx.fill()
    ctx.strokeStyle = theme.borderColor || '#ffffff'
    ctx.lineWidth = 3
    ctx.stroke()
  }

  const calculateWinningSegment = (finalRotationValue: number) => {
    if (validOptions.length === 0) return 0
    
    // Calculate proportional segments based on weights
    const totalWeight = validOptions.reduce((sum, opt) => sum + (opt.weight || 1), 0)
    
    let currentAngle = 0
    const segments = validOptions.map((opt, index) => {
      const portion = (opt.weight || 1) / totalWeight
      const sliceAngle = portion * 360
      const startAngle = currentAngle
      const endAngle = currentAngle + sliceAngle
      currentAngle = endAngle
      
      return { ...opt, index, startAngle, endAngle, sliceAngle }
    })
    
    // Calculate pointer position
    const normalized = ((finalRotationValue % 360) + 360) % 360
    const pointerAngle = (360 - normalized) % 360 // pointer fixed at top
    
    // Find which segment the pointer lands on
    const winner = segments.find(
      seg => pointerAngle >= seg.startAngle && pointerAngle < seg.endAngle
    ) || segments[segments.length - 1] // fallback edge case
    
    return winner?.index || 0
  }

  const handleSpin = (resultValue: number) => {
    if (isSpinning) return

    setIsSpinning(true)

    // If targetResult is provided, calculate exact rotation to land on it
    let targetAngle = Math.random() * 360; // Default random
    
    if (targetResult) {
      // Find the target option's segment
      const segments = getSegments();
      const targetSegment = segments.find(seg => seg.label === targetResult);
      
      if (targetSegment) {
        // Calculate angle to land pointer on center of target segment
        const segmentCenter = (targetSegment.startAngle + targetSegment.endAngle) / 2;
        // Pointer is at top (0 degrees), so we need wheel to rotate so segment center is at top
        targetAngle = (360 - segmentCenter) % 360;
        console.log('🎯 Target segment:', targetSegment.label, 'center:', segmentCenter, 'targetAngle:', targetAngle);
      }
    }

    // Generate consistent rotation based on targetResult to sync across clients
    // Use a simple hash of the targetResult string to get consistent extra rotations
    let extraRotations = 3000; // Default 3000 degrees (8+ full rotations)
    if (targetResult) {
      // Create consistent "random" based on result string
      let hash = 0;
      for (let i = 0; i < targetResult.length; i++) {
        hash = ((hash << 5) - hash) + targetResult.charCodeAt(i);
        hash = hash & hash; // Convert to 32bit integer
      }
      // Use hash to get consistent rotation between 2500-3500 degrees
      extraRotations = 2500 + (Math.abs(hash) % 1000);
    } else {
      extraRotations = 2500 + Math.random() * 1000;
    }
    
    const totalRotation = extraRotations + targetAngle;
    const newFinalRotation = rotation + totalRotation;

    console.log('🎡 Spinning to:', newFinalRotation, 'degrees (extra:', extraRotations, '+ target:', targetAngle, ')');
    
    setRotation(newFinalRotation)
    setFinalRotation(newFinalRotation)

    // Complete spin after animation
    setTimeout(() => {
      setIsSpinning(false)
      fireConfetti()
      
      // Only call onSpinComplete if no targetResult (local mode)
      // When targetResult exists, the parent component handles the result
      if (!targetResult && onSpinComplete) {
        // Calculate winner based on where pointer actually lands
        const winningIndex = calculateWinningSegment(newFinalRotation)
        
        if (validOptions[winningIndex]) {
          onSpinComplete({
            label: validOptions[winningIndex].label || validOptions[winningIndex].id,
            option: validOptions[winningIndex]
          })
        }
      } else if (targetResult) {
        // Verify we landed on the correct result
        const winningIndex = calculateWinningSegment(newFinalRotation)
        const landedOn = validOptions[winningIndex]?.label || 'unknown'
        console.log('🎯 Verification: Target was', targetResult, ', landed on', landedOn, landedOn === targetResult ? '✅' : '❌');
      }
    }, spinDuration * 1000)
  }

  const fireConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#00f3ff', '#ff00ff', '#00ff88', '#ffff00'],
    })
  }

  useEffect(() => {
    if (spinning && !isSpinning) {
      // Trigger spin with random value (in real app, this comes from server)
      const randomValue = Math.random()
      handleSpin(randomValue)
    }
  }, [spinning])

  return (
    <div className="relative flex items-center justify-center">
      {/* Wheel Container */}
      <div className="relative">
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
          <div
            className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[40px]"
            style={{ borderTopColor: theme.pointerColor || '#ef4444' }}
          />
        </div>

        {/* Spinning Canvas */}
        <motion.div
          animate={{ rotate: rotation }}
          transition={{
            duration: spinDuration,
            ease: [0.17, 0.67, 0.12, 0.99],
          }}
          className="relative"
        >
          <canvas
            ref={canvasRef}
            width={500}
            height={500}
            className="drop-shadow-2xl"
            style={{
              background: theme.backgroundColor || 'transparent',
              borderRadius: '50%',
            }}
          />
        </motion.div>

        {/* Center Button */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
          <button
            onClick={() => {
              if (!isSpinning && validOptions.length > 0 && onWheelClick) {
                onWheelClick();
              }
            }}
            disabled={isSpinning || validOptions.length === 0 || !onWheelClick}
            className={`w-20 h-20 rounded-full bg-black text-white font-bold text-sm shadow-xl transition-all ${
              isSpinning || validOptions.length === 0 || !onWheelClick
                ? 'opacity-50 cursor-not-allowed' 
                : 'hover:scale-110 hover:bg-gray-800'
            }`}
          >
            SPIN
          </button>
        </div>
      </div>
    </div>
  )
}
