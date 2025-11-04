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
    
    // Normalize the rotation to 0-360 range
    const normalized = ((finalRotationValue % 360) + 360) % 360
    
    // The pointer is at the top (12 o'clock). Segments are drawn with -90° offset.
    // So pointer at top = 90° in segment coordinate system
    // After wheel rotates by 'normalized' degrees clockwise, find which segment is at 90°
    const pointerAngle = (90 - normalized + 360) % 360
    
    // Find which segment the pointer lands on
    const winner = segments.find(
      seg => pointerAngle >= seg.startAngle && pointerAngle < seg.endAngle
    ) || segments[segments.length - 1] // fallback edge case
    
    return winner?.index || 0
  }

  const handleSpin = (resultValue: number) => {
    if (isSpinning) return

    setIsSpinning(true)

    // Weight-based random selection from options
    const totalWeight = validOptions.reduce((sum, opt) => sum + (opt.weight || 1), 0)
    let random = Math.random() * totalWeight
    let selectedOption = validOptions[0]
    
    for (const option of validOptions) {
      random -= (option.weight || 1)
      if (random <= 0) {
        selectedOption = option
        break
      }
    }
    
    // If targetResult is provided, use it instead of random selection
    if (targetResult) {
      const targetOption = validOptions.find(opt => opt.label === targetResult)
      if (targetOption) {
        selectedOption = targetOption
      }
    }
    
    // Find the index of the selected option
    const selectedIndex = validOptions.findIndex(opt => opt.label === selectedOption.label)
    
    // Calculate the segments
    const segments = getSegments()
    
    // Find all segments that match the selected option
    const matchingSegments = segments
      .map((seg, index) => ({ seg, index }))
      .filter(({ seg }) => seg.label === selectedOption.label)
    
    // Pick a random matching segment (for visual variety)
    const targetSegmentData = matchingSegments[Math.floor(Math.random() * matchingSegments.length)]
    const targetSegment = targetSegmentData.seg
    
    // Calculate angle to land on the center of the selected segment
    // Segments are drawn with -90° offset (starting at 3 o'clock instead of 12 o'clock)
    // Pointer is at top (12 o'clock = 0°)
    const segmentCenter = (targetSegment.startAngle + targetSegment.endAngle) / 2
    
    // Account for the -90° drawing offset: pointer at 0° = segment at 90° in our coordinate system
    // To align segment center with pointer (top), rotate wheel so (segmentCenter) ends up at 90°
    const targetAngle = (90 - segmentCenter + 360) % 360
    
    // Generate rotation (multiple full spins + targetAngle)
    const fullSpins = 5 + Math.floor(Math.random() * 3) // 5-7 full rotations
    const extraRotation = fullSpins * 360
    const totalRotation = extraRotation + targetAngle
    const newFinalRotation = rotation + totalRotation
    
    setRotation(newFinalRotation)
    setFinalRotation(newFinalRotation)

    // Complete spin after animation
    setTimeout(() => {
      setIsSpinning(false)
      fireConfetti()
      
      // Calculate winner based on where pointer actually lands
      const winningIndex = calculateWinningSegment(newFinalRotation)
      
      if (onSpinComplete && validOptions[winningIndex]) {
        onSpinComplete({
          label: validOptions[winningIndex].label || validOptions[winningIndex].id,
          option: validOptions[winningIndex]
        })
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
