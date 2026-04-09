interface Agent {
  id: string
  name: string
  minds: string[]
  status: string
}

interface Props {
  agents: Agent[]
  currentAgent: string
  onAgentSelect: (id: string) => void
}

export default function AgentPanel({ agents, currentAgent, onAgentSelect }: Props) {
  return (
    <div className="glass-panel rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Agents</h2>
        <span className="text-[10px] text-gray-600">{agents.filter(a => a.status !== 'idle').length}/5 active</span>
      </div>

      <div className="space-y-2">
        {agents.map(agent => {
          const isSelected = currentAgent === agent.id

          return (
            <div
              key={agent.id}
              onClick={() => onAgentSelect(agent.id)}
              className={`
                relative rounded-lg p-3 cursor-pointer transition-all duration-200
                ${isSelected
                  ? 'border border-ember-500/50 bg-ember-500/5'
                  : 'border border-white/5 bg-black/30 hover:border-white/10'
                }
              `}
            >
              {/* Agent name */}
              <p className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                {agent.name}
              </p>

              {/* Mind stack */}
              <div className="flex flex-wrap gap-1 mt-1.5">
                {agent.minds.map(mind => (
                  <span
                    key={mind}
                    className={`
                      text-[9px] px-1.5 py-0.5 rounded font-mono
                      ${isSelected ? 'bg-ember-500/20 text-ember-400' : 'bg-gray-800 text-gray-600'}
                    `}
                  >
                    {mind}
                  </span>
                ))}
              </div>

              {/* Status dot */}
              <div className="absolute top-3 right-3">
                <div className={`
                  w-2 h-2 rounded-full
                  ${isSelected ? 'bg-ember-500 animate-pulse' : 'bg-gray-700'}
                `} />
              </div>

              {/* Selected glow */}
              {isSelected && (
                <div
                  className="absolute inset-0 rounded-lg opacity-10 pointer-events-none"
                  style={{ boxShadow: '0 0 20px rgba(249,115,22,0.3)' }}
                />
              )}
            </div>
          )
        })}
      </div>

      <p className="text-[9px] text-gray-600 mt-3 text-center">Tap to select agent</p>
    </div>
  )
}
