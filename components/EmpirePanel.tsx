interface Empire {
  id: string
  name: string
  domain: string
  tier: number
  status: string
  icon: string
  color: string
}

interface Props {
  empires: Empire[]
}

export default function EmpirePanel({ empires }: Props) {
  return (
    <div className="glass-panel rounded-xl p-4 flex-1">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Empires</h2>
        <span className="text-[10px] text-gray-600">{empires.filter(e => e.status === 'active').length}/7 live</span>
      </div>

      <div className="space-y-2">
        {empires.map(empire => {
          const isActive = empire.status === 'active'
          const isBuilding = empire.status === 'building'

          return (
            <div
              key={empire.id}
              className={`
                relative rounded-lg p-3 transition-all duration-300
                ${isActive ? 'border border-opacity-30' : 'border border-white/5'}
                hover:border-white/10
              `}
              style={{
                borderColor: isActive ? empire.color : undefined,
                background: isActive ? `${empire.color}08` : '#0f0f0f',
              }}
            >
              {/* Status indicator */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{empire.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-white">{empire.name}</p>
                    <p className="text-[10px] text-gray-500">{empire.domain}</p>
                  </div>
                </div>

                {/* Status badge */}
                <div className={`
                  text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded
                  ${isActive ? 'bg-emerald-500/20 text-emerald-400' : ''}
                  ${isBuilding ? 'bg-amber-500/20 text-amber-400' : ''}
                  ${empire.status === 'planned' ? 'bg-gray-800 text-gray-500' : ''}
                `}>
                  {empire.status === 'active' && '● LIVE'}
                  {empire.status === 'building' && '◐ BUILD'}
                  {empire.status === 'planned' && '○ PLAN'}
                </div>
              </div>

              {/* Tier indicator */}
              <div className="flex items-center gap-1 mt-2">
                <span className="text-[9px] text-gray-600">Tier</span>
                {[1, 2, 3].map(tier => (
                  <div
                    key={tier}
                    className={`
                      w-4 h-1.5 rounded-sm
                      ${tier <= empire.tier ? 'bg-ember-500' : 'bg-gray-800'}
                    `}
                  />
                ))}
                <span className="text-[9px] text-gray-600 ml-1">
                  {empire.tier === 0 ? 'not started' : `${empire.tier}/3`}
                </span>
              </div>

              {/* Active glow */}
              {isActive && (
                <div
                  className="absolute inset-0 rounded-lg opacity-20 pointer-events-none"
                  style={{
                    boxShadow: `0 0 20px ${empire.color}30`,
                  }}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
