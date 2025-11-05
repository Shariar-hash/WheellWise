'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Plus, Trash2, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e',
]

interface WheelOption {
  label: string
  color: string
  weight: number
}

export default function CreateWheelInRoomPage() {
  const params = useParams()
  const router = useRouter()
  const roomCode = params?.code as string
  
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [options, setOptions] = useState<WheelOption[]>([
    { label: 'Option 1', color: PRESET_COLORS[0], weight: 1 },
    { label: 'Option 2', color: PRESET_COLORS[1], weight: 1 },
  ])

  const addOption = () => {
    setOptions([
      ...options,
      {
        label: `Option ${options.length + 1}`,
        color: PRESET_COLORS[options.length % PRESET_COLORS.length],
        weight: 1,
      },
    ])
  }

  const removeOption = (index: number) => {
    if (options.length <= 2) {
      toast.error('You need at least 2 options')
      return
    }
    setOptions(options.filter((_, i) => i !== index))
  }

  const updateOption = (index: number, field: keyof WheelOption, value: any) => {
    const newOptions = [...options]
    newOptions[index] = { ...newOptions[index], [field]: value }
    setOptions(newOptions)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (options.some((opt) => !opt.label.trim())) {
      toast.error('All options must have a label')
      return
    }

    setLoading(true)

    try {
      // First, verify room exists
      const roomRes = await fetch(`/api/rooms?code=${roomCode}`)
      if (!roomRes.ok) {
        toast.error('Room not found')
        router.push('/room')
        return
      }

      const room = await roomRes.json()

      // Create wheel in this room
      const res = await fetch('/api/wheels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim() || null,
          roomId: room.id,
          options,
        }),
      })

      if (!res.ok) throw new Error('Failed to create wheel')

      const wheel = await res.json()
      toast.success('Wheel created in room!')
      router.push(`/room/${roomCode}`)
    } catch (error) {
      toast.error('Failed to create wheel')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Room
      </button>

      <h1 className="text-4xl font-bold text-white mb-2">Create Wheel in Room</h1>
      <p className="text-gray-400 mb-8">
        This wheel will be visible to everyone in room <span className="font-mono font-bold text-white">{roomCode}</span>
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info - Optional */}
        <div className="bg-slate-800/40 rounded-xl p-6 border border-slate-700">
          <h2 className="text-2xl font-bold text-white mb-2">Wheel Title</h2>
          <p className="text-gray-400 text-sm mb-4">Optional - You can leave this blank</p>

          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Lunch Decision, Game Choice..."
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white text-lg focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Options */}
        <div className="bg-slate-800/40 rounded-xl p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">Wheel Options</h2>
            <button
              type="button"
              onClick={addOption}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Option</span>
            </button>
          </div>

          <div className="space-y-3">
            {options.map((option, index) => (
              <div
                key={index}
                className="flex items-center space-x-3 bg-slate-900/50 p-3 rounded-lg"
              >
                <input
                  type="color"
                  value={option.color}
                  onChange={(e) => updateOption(index, 'color', e.target.value)}
                  className="w-12 h-12 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={option.label}
                  onChange={(e) => updateOption(index, 'label', e.target.value)}
                  placeholder="Option label"
                  className="flex-1 px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
                <input
                  type="number"
                  min="1"
                  value={option.weight}
                  onChange={(e) =>
                    updateOption(index, 'weight', parseInt(e.target.value) || 1)
                  }
                  className="w-20 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="Weight"
                  title="Higher weight = more likely to be selected"
                />
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  className="p-2 text-red-400 hover:text-red-300 transition"
                  disabled={options.length <= 2}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 bg-blue-600/10 border border-blue-500/30 rounded-lg">
            <p className="text-sm text-gray-300">
              <span className="font-semibold text-blue-400">Tip:</span> Use weights to control probability. 
              A weight of 2 is twice as likely to be selected as a weight of 1.
            </p>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg text-white font-semibold transition disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Wheel in Room'}
          </button>
        </div>
      </form>
    </div>
  )
}
