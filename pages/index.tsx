import Head from 'next/head'
import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'

// Dynamic import for GSAP components to avoid SSR issues
const CouncilRing = dynamic(() => import('../components/CouncilRing'), { ssr: false })
const EmpirePanel = dynamic(() => import('../components/EmpirePanel'), { ssr: false })
const TaskRouter = dynamic(() => import('../components/TaskRouter'), { ssr: false })
const AgentPanel = dynamic(() => import('../components/AgentPanel'), { ssr: false })
const IgnisCore = dynamic(() => import('../components/IgnisCore'), { ssr: false })
const StatusStrip = dynamic(() => import('../components/StatusStrip'), { ssr: false })

// Council character data
const COUNCIL = [
  { id: 'optimus', name: 'Optimus Prime', role: 'Values', color: '#1d4ed8', description: 'Moral compass and mission alignment' },
  { id: 'doom', name: 'Dr. Doom', role: 'Sovereign', color: '#065f46', description: 'Authority structure and task ownership' },
  { id: 'doctor', name: 'The Doctor', role: 'Timeline', color: '#d97706', description: 'Sequencing and dependency mapping' },
  { id: 'lelouch', name: 'Lelouch', role: 'Persuasion', color: '#dc2626', description: 'Psychological leverage and framing' },
  { id: 'aizen', name: 'Aizen', role: 'Perception', color: '#7c3aed', description: 'Long-game narrative and brand feel' },
  { id: 'll', name: 'L Lawliet', role: 'Evidence', color: '#e5e5e5', description: 'Data validation and anomaly detection' },
  { id: 'ironman', name: 'Iron Man', role: 'Engineering', color: '#b91c1c', description: 'Scalability and system architecture' },
  { id: 'senku', name: 'Senku', role: 'Foundations', color: '#84cc16', description: 'First-principles and dependency chains' },
  { id: 'batman', name: 'Batman', role: 'Intelligence', color: '#ca8a04', description: 'Competitive research and contingencies' },
  { id: 'rick', name: 'Rick Sanchez', role: 'Wildcard', color: '#06b6d4', description: 'Unconventional solutions and constraint-breaking' },
]

const AGENTS = [
  { id: 'orchestrator', name: 'The Orchestrator', minds: ['Doom', 'Doctor', 'Optimus'], status: 'idle' },
  { id: 'architect', name: 'The Architect', minds: ['Iron Man', 'Senku'], status: 'idle' },
  { id: 'growth-hunter', name: 'The Growth Hunter', minds: ['Lelouch', 'Batman'], status: 'idle' },
  { id: 'content-ghost', name: 'The Content Ghost', minds: ['Aizen', 'Lelouch'], status: 'idle' },
  { id: 'data-warden', name: 'The Data Warden', minds: ['L', 'Batman', 'Iron Man'], status: 'idle' },
]

const EMPIRES = [
  { id: 'lexov', name: 'LeVox', domain: 'Real Estate', tier: 1, status: 'active', icon: '🏰', color: '#f97316' },
  { id: 'neovox', name: 'NeoVox', domain: 'AI, Tech, Robotics', tier: 0, status: 'planned', icon: '⚡', color: '#8b5cf6' },
  { id: 'hpvox', name: 'HPVox', domain: 'Healthcare & Perseverance', tier: 0, status: 'planned', icon: '🛡️', color: '#10b981' },
  { id: 'doctrinavox', name: 'DoctrinaVox', domain: 'Education', tier: 0, status: 'planned', icon: '📚', color: '#3b82f6' },
  { id: 'xovox', name: 'XoVox', domain: 'Entertainment, Music, Sports, Gaming', tier: 0, status: 'planned', icon: '🎭', color: '#ec4899' },
  { id: 'finvox', name: 'FinVox', domain: 'Finance', tier: 0, status: 'planned', icon: '💰', color: '#eab308' },
  { id: 'starvox', name: 'StarVox', domain: 'Transportation & Energy', tier: 0, status: 'planned', icon: '🌟', color: '#06b6d4' },
]

export default function Home() {
  const [activeCharacters, setActiveCharacters] = useState<string[]>(['optimus'])
  const [activeTask, setActiveTask] = useState('idle')
  const [currentAgent, setCurrentAgent] = useState('none')
  const [taskHistory, setTaskHistory] = useState<Array<{ id: number; task: string; minds: string[]; agent: string }>>([])
  const [tick, setTick] = useState(0)

  // Simulate clock tick for live feel
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  // Character click handler
  const handleCharacterClick = useCallback((id: string) => {
    setActiveCharacters(prev =>
      prev.includes(id)
        ? prev.filter(c => c !== id)
        : [...prev, id]
    )
  }, [])

  // Agent selection
  const handleAgentSelect = useCallback((agentId: string) => {
    setCurrentAgent(agentId)
    const agent = AGENTS.find(a => a.id === agentId)
    if (agent) {
      setActiveCharacters(agent.minds)
    }
  }, [])

  // Demo task router simulation
  const handleRunDemo = useCallback(() => {
    const demoTask = {
      id: Date.now(),
      task: 'Build LeVox Tier 2 Worker Agents',
      minds: ['optimus', 'doom', 'doctor', 'ironman', 'senku'],
      agent: 'architect',
    }
    setTaskHistory(prev => [demoTask, ...prev.slice(0, 9)])
    setActiveCharacters(demoTask.minds)
    setCurrentAgent(demoTask.agent)
    setActiveTask('executing')
  }, [])

  return (
    <div className="min-h-screen bg-[#0a0a0a] grid-bg overflow-hidden">
      <Head>
        <title>NoctVox — Command Center</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </Head>

      {/* Header */}
      <header className="relative z-10 border-b border-white/5 bg-[#0a0a0a]/90 backdrop-blur-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-ember-600 flex items-center justify-center text-white font-bold text-sm">
            N
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white tracking-tight">NoctVox Command</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Ignis Core Active</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-gray-400">Session</p>
            <p className="text-sm font-mono text-ember-500">{tick}s</p>
          </div>
          <button
            onClick={handleRunDemo}
            className="px-3 py-1.5 text-xs font-medium bg-ember-600 hover:bg-ember-500 text-white rounded transition-colors"
          >
            Run Demo Task
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <main className="relative z-10 grid grid-cols-12 gap-3 p-3 h-[calc(100vh-56px)]">

        {/* Left Column - Council Ring */}
        <section className="col-span-12 lg:col-span-3 flex flex-col gap-3">
          <div className="glass-panel rounded-xl p-4 flex-1">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Council Ring</h2>
              <span className="text-[10px] text-ember-500 font-mono">{activeCharacters.length} active</span>
            </div>
            <CouncilRing
              characters={COUNCIL}
              activeIds={activeCharacters}
              onCharacterClick={handleCharacterClick}
            />
          </div>

          {/* Status Strip */}
          <StatusStrip tick={tick} />
        </section>

        {/* Center Column - Main Content */}
        <section className="col-span-12 lg:col-span-6 flex flex-col gap-3">
          {/* Ignis Core */}
          <IgnisCore
            activeTask={activeTask}
            activeCharacters={activeCharacters}
            COUNCIL={COUNCIL}
          />

          {/* Task Router */}
          <TaskRouter
            activeCharacters={activeCharacters}
            COUNCIL={COUNCIL}
            currentAgent={currentAgent}
            AGENTS={AGENTS}
          />

          {/* Task History */}
          <div className="glass-panel rounded-xl p-4 flex-1 overflow-hidden">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Recent Tasks</h2>
            <div className="space-y-2 overflow-y-auto max-h-32">
              {taskHistory.length === 0 ? (
                <p className="text-xs text-gray-600 italic">No tasks yet. Run the demo.</p>
              ) : (
                taskHistory.map(task => (
                  <div key={task.id} className="flex items-center gap-2 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-ember-500" />
                    <span className="text-gray-300">{task.task}</span>
                    <span className="ml-auto text-gray-600">{task.minds.length} minds</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Right Column - Agents + Empires */}
        <section className="col-span-12 lg:col-span-3 flex flex-col gap-3">
          {/* Agent Panel */}
          <AgentPanel
            agents={AGENTS}
            currentAgent={currentAgent}
            onAgentSelect={handleAgentSelect}
          />

          {/* Empire Panel */}
          <EmpirePanel empires={EMPIRES} />
        </section>
      </main>

      {/* Ambient glow effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-ember-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl" />
      </div>
    </div>
  )
}
