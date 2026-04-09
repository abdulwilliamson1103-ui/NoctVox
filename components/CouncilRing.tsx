import { useEffect, useRef } from 'react'

interface Character {
  id: string
  name: string
  role: string
  color: string
  description: string
}

interface Props {
  characters: Character[]
  activeIds: string[]
  onCharacterClick: (id: string) => void
}

export default function CouncilRing({ characters, activeIds, onCharacterClick }: Props) {
  const ringRef = useRef<HTMLDivElement>(null)

  // Position characters in a circle
  const getPosition = (index: number, total: number, radius: number) => {
    const angle = (2 * Math.PI * index) / total - Math.PI / 2
    const x = Math.cos(angle) * radius
    const y = Math.sin(angle) * radius
    return { x, y }
  }

  const centerX = 140
  const centerY = 140
  const radius = 105

  return (
    <div className="relative w-full max-w-[280px] mx-auto" ref={ringRef}>
      <svg viewBox="0 0 280 280" className="w-full aspect-square">
        {/* Outer ring */}
        <circle
          cx={centerX}
          cy={centerY}
          r={radius + 20}
          fill="none"
          stroke="rgba(255,255,255,0.03)"
          strokeWidth="1"
        />
        <circle
          cx={centerX}
          cy={centerY}
          r={radius}
          fill="none"
          stroke="rgba(249,115,22,0.1)"
          strokeWidth="1"
          strokeDasharray="4 4"
        />

        {/* Connection lines to active characters */}
        <g className="pointer-events-none">
          {characters.filter(c => activeIds.includes(c.id)).map(char => {
            const idx = characters.indexOf(char)
            const pos = getPosition(idx, characters.length, radius)
            const dx = pos.x
            const dy = pos.y
            return (
              <line
                key={`line-${char.id}`}
                x1={centerX}
                y1={centerY}
                x2={centerX + dx}
                y2={centerY + dy}
                stroke={char.color}
                strokeWidth="1"
                opacity="0.3"
              />
            )
          })}
        </g>

        {/* Center Ignis emblem */}
        <circle cx={centerX} cy={centerY} r="28" fill="#0a0a0a" stroke="#f97316" strokeWidth="1.5" />
        <text
          x={centerX}
          y={centerY + 5}
          textAnchor="middle"
          className="fill-ember-500"
          style={{ fontSize: '20px', fontWeight: 'bold' }}
        >
          炎
        </text>

        {/* Character nodes */}
        {characters.map((char, index) => {
          const pos = getPosition(index, characters.length, radius)
          const isActive = activeIds.includes(char.id)
          const x = centerX + pos.x
          const y = centerY + pos.y

          return (
            <g
              key={char.id}
              onClick={() => onCharacterClick(char.id)}
              className="cursor-pointer"
            >
              {/* Glow effect when active */}
              {isActive && (
                <circle
                  cx={x}
                  cy={y}
                  r="18"
                  fill={char.color}
                  opacity="0.15"
                  className="animate-pulse"
                />
              )}

              {/* Node circle */}
              <circle
                cx={x}
                cy={y}
                r={isActive ? 14 : 10}
                fill={isActive ? char.color : '#1a1a1a'}
                stroke={isActive ? char.color : 'rgba(255,255,255,0.1)'}
                strokeWidth="1.5"
                className="transition-all duration-300 will-change-transform"
              />

              {/* Character initial */}
              <text
                x={x}
                y={y + 4}
                textAnchor="middle"
                fill={isActive ? '#fff' : '#666'}
                style={{ fontSize: '9px', fontWeight: '600' }}
              >
                {char.name.charAt(0)}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Character labels below */}
      <div className="mt-2 space-y-1">
        {characters.filter(c => activeIds.includes(c.id)).map(char => (
          <div key={char.id} className="flex items-center gap-2 text-xs">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: char.color }}
            />
            <span className="text-gray-300 font-medium">{char.name}</span>
            <span className="text-gray-600 ml-auto">{char.role}</span>
          </div>
        ))}
      </div>

      {/* Click hint */}
      <p className="text-[9px] text-gray-600 text-center mt-2">Tap characters to toggle</p>
    </div>
  )
}
