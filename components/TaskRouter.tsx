interface Character {
  id: string
  name: string
  role: string
  color: string
  description: string
}

interface Agent {
  id: string
  name: string
  minds: string[]
  status: string
}

interface Props {
  activeCharacters: string[]
  COUNCIL: Character[]
  currentAgent: string
  AGENTS: Agent[]
}

export default function TaskRouter({ activeCharacters, COUNCIL, currentAgent, AGENTS }: Props) {
  const currentAgentData = AGENTS.find(a => a.id === currentAgent)

  // Build the routing path
  const routingSteps = [
    { label: 'Request', icon: '◆', active: true },
    { label: 'Values', icon: '◈', active: activeCharacters.includes('optimus') },
    { label: 'Structure', icon: '◉', active: activeCharacters.includes('doom') },
    { label: 'Timeline', icon: '◎', active: activeCharacters.includes('doctor') },
    { label: 'Specialist', icon: '⬡', active: activeCharacters.some(id => !['optimus', 'doom', 'doctor'].includes(id)) },
    { label: 'Execute', icon: '●', active: !!currentAgent },
  ]

  return (
    <div className="glass-panel rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Task Router</h2>
        {currentAgentData && (
          <span className="text-[10px] text-ember-500 font-mono">
            → {currentAgentData.name}
          </span>
        )}
      </div>

      {/* Routing path visualization */}
      <div className="relative">
        <div className="flex items-center justify-between">
          {routingSteps.map((step, index) => {
            const isLast = index === routingSteps.length - 1
            const isActive = step.active

            return (
              <div key={step.label} className="flex items-center">
                {/* Step */}
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`
                      w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-mono
                      transition-all duration-300
                      ${isActive
                        ? 'bg-ember-600 text-white shadow-lg'
                        : 'bg-gray-800 text-gray-600'
                      }
                    `}
                    style={isActive ? { boxShadow: '0 0 12px rgba(249,115,22,0.4)' } : {}}
                  >
                    {step.icon}
                  </div>
                  <span className={`text-[9px] ${isActive ? 'text-gray-300' : 'text-gray-600'}`}>
                    {step.label}
                  </span>
                </div>

                {/* Connector */}
                {!isLast && (
                  <div
                    className={`
                      flex-1 h-px mx-1 mb-4 transition-colors duration-300
                      ${routingSteps[index + 1]?.active ? 'bg-ember-600/50' : 'bg-gray-800'}
                    `}
                    style={routingSteps[index + 1]?.active ? { boxShadow: '0 0 4px rgba(249,115,22,0.3)' } : {}}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Active specialists */}
      {activeCharacters.length > 3 && (
        <div className="mt-4 pt-4 border-t border-white/5">
          <p className="text-[9px] text-gray-600 uppercase tracking-widest mb-2">Active Specialists</p>
          <div className="flex flex-wrap gap-1">
            {activeCharacters
              .filter(id => !['optimus', 'doom', 'doctor'].includes(id))
              .map(id => {
                const char = COUNCIL.find(c => c.id === id)
                return char ? (
                  <span
                    key={id}
                    className="text-[10px] px-2 py-0.5 rounded"
                    style={{
                      background: `${char.color}15`,
                      color: char.color,
                      border: `1px solid ${char.color}30`,
                    }}
                  >
                    {char.role}
                  </span>
                ) : null
              })}
          </div>
        </div>
      )}
    </div>
  )
}
