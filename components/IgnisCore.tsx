import { useState, useEffect } from 'react'

interface Character {
  id: string
  name: string
  role: string
  color: string
  description: string
}

interface Props {
  activeTask: string
  activeCharacters: string[]
  COUNCIL: Character[]
}

export default function IgnisCore({ activeTask, activeCharacters, COUNCIL }: Props) {
  const [glowIntensity, setGlowIntensity] = useState(0.5)

  useEffect(() => {
    const interval = setInterval(() => {
      setGlowIntensity(prev => 0.4 + Math.sin(Date.now() / 1000) * 0.2)
    }, 100)
    return () => clearInterval(interval)
  }, [])

  const activeMinds = COUNCIL.filter(c => activeCharacters.includes(c.id))

  return (
    <div className="glass-panel rounded-xl p-5 relative overflow-hidden ember-scan">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl"
            style={{
              background: `rgba(249, 115, 22, ${glowIntensity})`,
              boxShadow: `0 0 30px rgba(249, 115, 22, ${glowIntensity * 0.5})`,
            }}
          >
            炎
          </div>
          <div>
            <h2 className="text-white font-semibold text-lg leading-none">Ignis Core</h2>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">Active Operator</p>
          </div>
        </div>

        {/* Status */}
        <div className="text-right">
          <div className={`
            inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-mono
            ${activeTask === 'executing'
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-gray-800 text-gray-400'}
          `}>
            <span className={`
              w-1.5 h-1.5 rounded-full
              ${activeTask === 'executing' ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}
            `} />
            {activeTask === 'executing' ? 'EXECUTING' : 'STANDBY'}
          </div>
        </div>
      </div>

      {/* Mission statement */}
      <div className="bg-black/30 rounded-lg p-3 mb-4">
        <p className="text-xs text-gray-400 mb-1">Current Mission</p>
        <p className="text-sm text-white leading-relaxed">
          {activeTask === 'executing'
            ? 'Building the Vox empire system across all 7 domains'
            : 'Awaiting directive. Select a task to begin.'}
        </p>
      </div>

      {/* Active minds summary */}
      <div className="flex flex-wrap gap-2">
        {activeMinds.map(mind => (
          <div
            key={mind.id}
            className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium"
            style={{
              background: `${mind.color}15`,
              border: `1px solid ${mind.color}30`,
              color: mind.color,
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: mind.color }} />
            {mind.name}
          </div>
        ))}
        {activeMinds.length === 0 && (
          <p className="text-xs text-gray-600 italic">No minds active</p>
        )}
      </div>

      {/* Decorative scan line */}
      <div
        className="absolute inset-x-0 h-px bottom-0"
        style={{
          background: `linear-gradient(90deg, transparent, rgba(249, 115, 22, ${glowIntensity}), transparent)`,
        }}
      />
    </div>
  )
}
