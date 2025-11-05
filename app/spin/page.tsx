'use client'

import { useState, useRef } from 'react'
import { Plus, Trash2, RotateCcw, Volume2, VolumeX, Settings, Mail, Copy, Download, X, Star } from 'lucide-react'
import SpinWheel from '@/components/wheel/spin-wheel'
import toast from 'react-hot-toast'

// Default wheel has YES/NO in alternating pattern
const createDefaultWheel = () => [
  { id: 'yes', label: 'YES', color: '#22c55e', weight: 1, count: 3 },
  { id: 'no', label: 'NO', color: '#ef4444', weight: 1, count: 3 },
]

interface WheelOption {
  id?: string
  label: string
  color: string
  weight?: number
  count?: number
  isImage?: boolean
  imageUrl?: string
}

export default function SpinPage() {
  const [options, setOptions] = useState<WheelOption[]>(createDefaultWheel())
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [resultOption, setResultOption] = useState<WheelOption | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [spinSpeed, setSpinSpeed] = useState(3)
  const [showSettings, setShowSettings] = useState(false)
  const [isDefaultWheel, setIsDefaultWheel] = useState(true)
  const [inputValue, setInputValue] = useState('')
  const [globalAppearances, setGlobalAppearances] = useState(1)
  const [winCounts, setWinCounts] = useState<{[key: string]: number}>({})
  const [lastResult, setLastResult] = useState<string | null>(null)
  const [showShareMenu, setShowShareMenu] = useState(false)

  const addOption = () => {
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1']
    
    // Use input value if available, otherwise use default names
    const labelToUse = inputValue.trim() || (isDefaultWheel ? 'Option 1' : `Option ${options.length + 1}`)
    const countToUse = globalAppearances
    
    // Clear default YES/NO when adding first custom option
    if (isDefaultWheel) {
      const newOption = {
        label: labelToUse,
        color: colors[0],
        weight: 1,
        count: countToUse,
      }
      setOptions([newOption])
      setIsDefaultWheel(false)
    } else {
      // Add to existing custom options
      const newOption = {
        label: labelToUse,
        color: colors[options.length % colors.length],
        weight: 1,
        count: countToUse,
      }
      setOptions(prev => [...prev, newOption])
    }
    
    // Clear input after adding
    setInputValue('')
  }



  const updateOption = (index: number, field: keyof WheelOption, value: any) => {
    const newOptions = [...options]
    newOptions[index] = { ...newOptions[index], [field]: value }
    setOptions(newOptions)
  }

  const removeOption = (index: number) => {
    const newOptions = options.filter((_, i) => i !== index)
    setOptions(newOptions)
    
    // If no options left, revert to default wheel
    if (newOptions.length === 0) {
      setIsDefaultWheel(true)
      setOptions(createDefaultWheel())
    }
  }

  const removeAll = () => {
    setOptions(createDefaultWheel())
    setIsDefaultWheel(true)
    setResult(null)
    setShowResult(false)
    toast.success('Reset to default')
  }

  const redo = () => {
    if (spinning) return
    
    // Respin the wheel with the same options
    if (getExpandedOptions().length > 0) {
      setResult(null)
      setShowResult(false)
      setSpinning(true)
      
      // Play spinning sound
      if (soundEnabled) {
        playSpinSound()
      }
      
      toast.success('Respinning...')
    } else {
      toast.error('No options to spin')
    }
  }

  const reset = () => {
    setOptions(createDefaultWheel())
    setIsDefaultWheel(true)
    setResult(null)
    setShowResult(false)
    setSpinning(false)
    setWinCounts({})
    setInputValue('')
    toast.success('Reset to default wheel')
  }

  const handleSpin = () => {
    if (spinning) return
    
    // Play spinning sound
    if (soundEnabled) {
      playSpinSound()
    }
    
    setSpinning(true)
    setShowResult(false)
    setResult(null)
  }
  
  const playSpinSound = () => {
    // Create oscillator for spinning sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(200, audioContext.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 3.5)
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 4)
    
    oscillator.start()
    oscillator.stop(audioContext.currentTime + 4)
  }

  // Return options directly - let the wheel component handle expansion
  const getExpandedOptions = () => {
    // Filter out empty options first
    const validOptions = options.filter(opt => opt.label.trim() !== '')
    
    // If no valid options and not default wheel, show default YES/NO
    if (validOptions.length === 0) {
      return createDefaultWheel()
    }
    
    // Return the options with proper id field for wheel component
    return validOptions.map((opt, index) => ({
      ...opt,
      id: opt.id || `opt-${index}` // Ensure id is present
    }))
  }

  const handleSpinComplete = (spinResult: { label: string, option: WheelOption }) => {
    setResult(spinResult.label)
    setResultOption(spinResult.option)
    setLastResult(spinResult.label)
    setSpinning(false)
    setTimeout(() => setShowResult(true), 500)
  }

  const shareViaEmail = () => {
    const subject = 'Check out my WheelWise result!'
    const body = `I just spun the wheel and got: "${result}"\n\nTry it yourself at ${window.location.origin}/spin`
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  const shareViaFacebook = () => {
    const url = `${window.location.origin}/spin`
    const text = `I just spun the wheel and got: "${result}"!`
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`, '_blank')
  }

  const copyResult = () => {
    navigator.clipboard.writeText(result || '')
    toast.success('Result copied!')
  }

  const downloadResult = () => {
    const canvas = document.createElement('canvas')
    canvas.width = 800
    canvas.height = 400
    const ctx = canvas.getContext('2d')!
    
    ctx.fillStyle = '#1e293b'
    ctx.fillRect(0, 0, 800, 400)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 64px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(result || '', 400, 200)
    
    const link = document.createElement('a')
    link.download = 'wheel-result.png'
    link.href = canvas.toDataURL()
    link.click()
    toast.success('Downloaded result image')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 border-b border-slate-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">WheelWise</h1>
            <p className="text-gray-400 text-sm">Make smart decisions with our intelligent spinning wheel</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 hover:bg-slate-700 rounded-lg transition"
              title={soundEnabled ? 'Mute' : 'Unmute'}
            >
              {soundEnabled ? <Volume2 className="w-5 h-5 text-gray-400" /> : <VolumeX className="w-5 h-5 text-gray-400" />}
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-slate-700 rounded-lg transition"
              title="Settings"
            >
              <Settings className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-[1fr,400px] gap-8">
          {/* Wheel Section */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative mb-8">
              <SpinWheel
                options={getExpandedOptions()}
                onSpinComplete={handleSpinComplete}
                spinning={spinning}
                spinDuration={spinSpeed}
                onSpinStart={() => {
                  if (soundEnabled) {
                    playSpinSound()
                  }
                }}
                onWheelClick={handleSpin}
              />
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleSpin}
                disabled={spinning}
                className="px-12 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg text-white font-bold text-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {spinning ? 'Spinning...' : 'SPIN'}
              </button>
              <button
                onClick={redo}
                className="p-4 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
                title="Respin"
              >
                <RotateCcw className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={removeAll}
                className="px-6 py-4 bg-red-600 hover:bg-red-700 rounded-lg text-white font-semibold transition"
                title="Reset to default"
              >
                Reset
              </button>
            </div>

            {/* Settings Panel */}
            {showSettings && (
              <div className="mt-6 bg-slate-800 rounded-lg p-6 w-full max-w-md border border-slate-700 shadow-xl">
                <h3 className="text-white font-semibold mb-4 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Spin Settings
                  </span>
                  <button 
                    onClick={() => setShowSettings(false)}
                    className="hover:bg-slate-700 rounded p-1 transition"
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </h3>
                
                <div className="space-y-4">
                  {/* Speed Control */}
                  <div>
                    <label className="text-gray-300 font-medium block mb-3">
                      Spin Duration: <span className="text-blue-400 font-bold">{spinSpeed}s</span>
                    </label>
                    <input
                      type="range"
                      min="2"
                      max="8"
                      step="0.5"
                      value={spinSpeed}
                      onChange={(e) => setSpinSpeed(parseFloat(e.target.value))}
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      style={{
                        background: `linear-gradient(to right, #2563eb 0%, #2563eb ${((spinSpeed - 2) / 6) * 100}%, #334155 ${((spinSpeed - 2) / 6) * 100}%, #334155 100%)`
                      }}
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span>⚡ Fast (2s)</span>
                      <span>🐌 Slow (8s)</span>
                    </div>
                  </div>
                  
                  {/* Global Appearances Control */}
                  <div>
                    <label className="text-gray-300 font-medium block mb-3">
                      Default Appearances: <span className="text-blue-400 font-bold">{globalAppearances}</span>
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={globalAppearances}
                      onChange={(e) => {
                        const newValue = parseInt(e.target.value)
                        setGlobalAppearances(newValue)
                        // Update all existing options to use new appearance count
                        if (!isDefaultWheel) {
                          setOptions(prev => prev.map(opt => ({
                            ...opt,
                            count: newValue
                          })))
                        }
                      }}
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span>1x</span>
                      <span>10x</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      How many times each new option appears on the wheel
                    </p>
                  </div>

                  {/* Weight Explanation */}
                  <div className="bg-slate-700 rounded-lg p-3">
                    <h4 className="text-gray-300 font-medium mb-2">💡 Weight System</h4>
                    <p className="text-xs text-gray-400">
                      <strong>Higher weight = Higher priority</strong><br/>
                      Options with more weight have better chances of being selected.
                    </p>
                  </div>
                  
                  {/* Sound Toggle */}
                  <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                    <span className="text-gray-300 font-medium">Spin Sound</span>
                    <button
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className={`relative w-12 h-6 rounded-full transition ${soundEnabled ? 'bg-blue-600' : 'bg-slate-600'}`}
                    >
                      <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${soundEnabled ? 'translate-x-6' : ''}`} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Panel */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="bg-yellow-500 text-yellow-500 rounded-full w-3 h-3"></span>
                INPUTS
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 hover:bg-slate-700 rounded-lg transition"
                  title="Settings"
                >
                  <Settings className="w-4 h-4 text-gray-400" />
                </button>
                <button
                  onClick={addOption}
                  className="p-2 hover:bg-slate-700 rounded-lg transition"
                  title="Add Option"
                >
                  <Plus className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Input Area - Match reference image */}
            <div className="bg-gray-200 rounded-lg p-4 min-h-[200px] relative">
              <div className="flex items-center justify-between mb-4">
                <input
                  type="text"
                  placeholder="Input text here..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && inputValue.trim()) {
                      const newLabel = inputValue.trim()
                      
                      // Clear defaults and add custom option
                      if (isDefaultWheel) {
                        const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1']
                        setOptions([{
                          label: newLabel,
                          color: colors[0],
                          weight: 1,
                          count: globalAppearances,
                        }])
                        setIsDefaultWheel(false)
                      } else {
                        // Add new option
                        const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1']
                        setOptions(prev => [...prev, {
                          label: newLabel,
                          color: colors[prev.length % colors.length],
                          weight: 1,
                          count: globalAppearances,
                        }])
                      }
                      setInputValue('')
                    }
                  }}
                />
                <button
                  onClick={addOption}
                  className="ml-3 p-3 bg-gray-400 hover:bg-gray-500 rounded-lg transition"
                >
                  <Plus className="w-5 h-5 text-white" />
                </button>
                <button
                  onClick={() => {
                    const input = document.createElement('input')
                    input.type = 'file'
                    input.accept = 'image/*'
                    input.onchange = async (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0]
                      if (file) {
                        try {
                          // Show loading toast
                          toast.loading('Processing image...', { id: 'image-processing' })
                          
                          // Create canvas to read image
                          const canvas = document.createElement('canvas')
                          const ctx = canvas.getContext('2d')
                          const img = new Image()
                          
                          img.onload = () => {
                            canvas.width = img.width
                            canvas.height = img.height
                            ctx?.drawImage(img, 0, 0)
                            
                            // Convert image to data URL for storing in wheel segments
                            const imageDataURL = canvas.toDataURL('image/jpeg', 0.7)
                            
                            // Create image segment
                            const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#ef4444', '#10b981']
                            const fileName = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, ' ').trim() || 'Image'
                            
                            const imageOption = {
                              label: fileName,
                              color: colors[0],
                              weight: 1,
                              count: globalAppearances,
                              isImage: true,
                              imageUrl: imageDataURL,
                            }
                            
                            // Add image option to wheel
                            if (isDefaultWheel) {
                              setOptions([imageOption])
                              setIsDefaultWheel(false)
                            } else {
                              setOptions(prev => [...prev, imageOption])
                            }
                            
                            toast.success(`Added image "${fileName}" to wheel!`, { id: 'image-processing' })
                          }
                          
                          img.onerror = () => {
                            toast.error('Failed to process image', { id: 'image-processing' })
                          }
                          
                          img.src = URL.createObjectURL(file)
                          
                        } catch (error) {
                          toast.error('Error processing image', { id: 'image-processing' })
                        }
                      }
                    }
                    input.click()
                  }}
                  className="ml-2 p-3 bg-gray-400 hover:bg-gray-500 rounded-lg transition"
                  title="Import from image"
                >
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              

              
              {/* Options List */}
              {!isDefaultWheel && options.length > 0 && (
                <div className="space-y-2">
                  {options.map((option, index) => (
                    <div key={index} className="bg-white p-3 rounded border">
                      <div className="flex items-center gap-2 mb-2">
                        <div 
                          className="w-4 h-4 rounded border border-gray-300" 
                          style={{ backgroundColor: option.color }}
                        />
                        <input
                          type="text"
                          value={option.label}
                          onChange={(e) => updateOption(index, 'label', e.target.value)}
                          className="flex-1 px-2 py-1 text-sm border rounded focus:outline-none focus:border-blue-500"
                          placeholder="Option label"
                        />
                        {winCounts[option.label] && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded">
                            +{winCounts[option.label]}
                          </span>
                        )}
                        <button
                          onClick={() => removeOption(index)}
                          className="p-1 text-red-500 hover:text-red-700 transition"
                          title="Delete option"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-600">Segments:</span>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            value={option.count}
                            onChange={(e) => updateOption(index, 'count', parseInt(e.target.value) || 1)}
                            className="w-12 px-1 py-1 border rounded text-center"
                            title="Number of segments"
                          />
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <span className="text-gray-600">Weight:</span>
                          <input
                            type="number"
                            min="1"
                            max="10"
                            step="1"
                            value={option.weight || 1}
                            onChange={(e) => updateOption(index, 'weight', parseInt(e.target.value) || 1)}
                            className="w-12 px-1 py-1 border rounded text-center"
                            title="Option weight (higher = more likely)"
                          />
                          {(option.weight || 1) > 1 && (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-1 rounded">
                              {((option.weight || 1) / options.reduce((sum, opt) => sum + (opt.weight || 1), 0) * 100).toFixed(0)}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {isDefaultWheel && (
                <div className="text-center text-gray-500 mt-8">
                  <p>Add your options above</p>
                  <p className="text-sm mt-1">Current wheel: YES (3) / NO (3)</p>
                </div>
              )}
            </div>

            <button
              onClick={addOption}
              className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold transition flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Entry
            </button>
          </div>
        </div>
      </div>

      {/* Result Modal */}
      {showResult && result && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl animate-in zoom-in duration-300">
            <div className="mb-6">
              {resultOption?.isImage && resultOption?.imageUrl ? (
                <div className="mb-4">
                  <img 
                    src={resultOption.imageUrl} 
                    alt={result || 'Selected option'} 
                    className="w-32 h-32 object-cover rounded-xl mx-auto border-4 border-green-500 shadow-lg"
                  />
                  <div className="text-2xl font-bold text-gray-900 mt-3 break-words">{result}</div>
                </div>
              ) : (
                <div className="text-7xl font-bold text-gray-900 mb-2 break-words">{result}</div>
              )}
              <p className="text-gray-600 text-lg">Selected</p>
            </div>
            


            {/* Action Controls */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <button
                onClick={() => {
                  if (result) {
                    // Remove this option from the wheel
                    setOptions(prev => prev.filter(opt => opt.label !== result))
                    setShowResult(false)
                    setResult(null)
                    toast.success(`Removed "${result}" from wheel`)
                  }
                }}
                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium"
              >
                HIDE CHOICE
              </button>
              <button
                onClick={() => {
                  if (result) {
                    setWinCounts(prev => ({
                      ...prev,
                      [result]: (prev[result] || 0) + 1
                    }))
                    toast.success(`+1 for ${result}`)
                  }
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
              >
                COUNT +
              </button>
              <button
                onClick={() => {
                  setShowResult(false)
                  setShowShareMenu(false)
                }}
                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-bold"
              >
                DONE
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
                >
                  SHARE
                </button>
                {showShareMenu && (
                  <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-xl border p-2 min-w-[120px] z-10">
                    <button
                      onClick={() => {
                        copyResult()
                        setShowShareMenu(false)
                      }}
                      className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 rounded flex items-center gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      Copy
                    </button>
                    <button
                      onClick={() => {
                        downloadResult()
                        setShowShareMenu(false)
                      }}
                      className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 rounded flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                    <button
                      onClick={() => {
                        shareViaEmail()
                        setShowShareMenu(false)
                      }}
                      className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 rounded flex items-center gap-2"
                    >
                      <Mail className="w-4 h-4" />
                      Email
                    </button>
                    <button
                      onClick={() => {
                        shareViaFacebook()
                        setShowShareMenu(false)
                      }}
                      className="w-full text-left px-3 py-2 text-gray-700 hover:bg-gray-100 rounded flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                      Facebook
                    </button>
                  </div>
                )}
              </div>
            </div>


            
            {/* Branding */}
            <div className="mt-4 flex items-center justify-center gap-2 text-gray-500 text-sm">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">W</span>
              </div>
              WheelWise
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
