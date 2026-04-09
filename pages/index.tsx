import Head from 'next/head'
import { useState, useEffect, useRef, useCallback } from 'react'
import { routeThroughCouncil, generateCouncilResponse, COUNCIL_CHARACTERS } from '../lib/council'

const EMPIRES = [
  { id: 'lexov', name: 'LeVox', domain: 'Real Estate', tier: 1, status: 'active', icon: '🏰', color: '#f97316' },
  { id: 'neovox', name: 'NeoVox', domain: 'AI, Tech, Robotics', tier: 0, status: 'planned', icon: '⚡', color: '#8b5cf6' },
  { id: 'hpvox', name: 'HPVox', domain: 'Healthcare & Perseverance', tier: 0, status: 'planned', icon: '🛡️', color: '#10b981' },
  { id: 'doctrinavox', name: 'DoctrinaVox', domain: 'Education', tier: 0, status: 'planned', icon: '📚', color: '#3b82f6' },
  { id: 'xovox', name: 'XoVox', domain: 'Entertainment, Music, Sports, Gaming', tier: 0, status: 'planned', icon: '🎭', color: '#ec4899' },
  { id: 'finvox', name: 'FinVox', domain: 'Finance', tier: 0, status: 'planned', icon: '💰', color: '#eab308' },
  { id: 'starvox', name: 'StarVox', domain: 'Transportation & Energy', tier: 0, status: 'planned', icon: '🌟', color: '#06b6d4' },
]

interface Message {
  id: number
  role: 'user' | 'ignis' | 'council' | 'system'
  text: string
  time: string
  minds?: string[]
}

function IgnisFlame({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="fc" cx="50%" cy="70%" r="60%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="40%" stopColor="#b0b0b0" />
          <stop offset="70%" stopColor="#404040" />
          <stop offset="100%" stopColor="#0a0a0a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="fo" cx="50%" cy="60%" r="55%">
          <stop offset="0%" stopColor="#1a1a1a" />
          <stop offset="60%" stopColor="#0d0d0d" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path d="M24 4C24 4 10 20 10 30C10 39 16 44 24 44C32 44 38 39 38 30C38 20 24 4 24 4Z" fill="url(#fo)" className="animate-pulse" />
      <path d="M24 12C24 12 15 23 15 31C15 37 19 40 24 40C29 40 33 37 33 31C33 23 24 12 24 12Z" fill="url(#fc)" className="animate-pulse" style={{ animationDuration: '1.8s' }} />
      <ellipse cx="24" cy="31" rx="5" ry="6" fill="white" opacity="0.6" className="animate-pulse" style={{ animationDuration: '1.2s' }} />
    </svg>
  )
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [activeMinds, setActiveMinds] = useState<string[]>(['optimus'])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)
  const msgIdRef = useRef(0)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined') return
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.rate = 1.1; u.pitch = 0.95; u.volume = 1
    u.onstart = () => setIsSpeaking(true)
    u.onend = () => setIsSpeaking(false)
    u.onerror = () => setIsSpeaking(false)
    window.speechSynthesis.speak(u)
  }, [])

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined') window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }, [])

  const startListening = useCallback(() => {
    if (typeof window === 'undefined') return
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setMessages(prev => [...prev, { id: ++msgIdRef.current, role: 'system', text: 'Voice not supported. Try Chrome.', time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) }])
      return
    }
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    const recognition = new SR()
    recognitionRef.current = recognition
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'
    recognition.onstart = () => setIsListening(true)
    recognition.onresult = (event: any) => { setInput(event.results[0][0].transcript); setIsListening(false) }
    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)
    recognition.start()
  }, [])

  const stopListening = useCallback(() => { recognitionRef.current?.stop(); setIsListening(false) }, [])

  const handleSend = useCallback(() => {
    if (!input.trim()) return
    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    const userMsg: Message = { id: ++msgIdRef.current, role: 'user', text: input.trim(), time }
    setMessages(prev => [...prev, userMsg])
    const userInput = input.trim()
    setInput('')
    stopSpeaking()

    // Route through council
    const { active, results } = routeThroughCouncil(userInput)
    setActiveMinds(active)

    // Show council thinking
    const councilText = generateCouncilResponse(userInput, results)
    setTimeout(() => {
      const councilMsg: Message = { id: ++msgIdRef.current, role: 'council', text: councilText, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }), minds: active }
      setMessages(prev => [...prev, councilMsg])
      setActiveMinds(active)
      
      // Ignis final response
      const ignisResponse = `Council processed. ${results[results.length - 1]?.note || 'Analyzing.'}`
      setTimeout(() => {
        const ignisMsg: Message = { id: ++msgIdRef.current, role: 'ignis', text: ignisResponse, time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }), minds: active }
        setMessages(prev => [...prev, ignisMsg])
        speak(ignisResponse)
      }, 1200)
    }, 600)
  }, [input, speak, stopSpeaking])

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-gray-200 overflow-hidden">
      <Head><title>NoctVox — Ignis Command</title></Head>

      {/* Left sidebar */}
      <aside className="w-72 flex-shrink-0 border-r border-white/5 flex flex-col">
        <div className="p-4 border-b border-white/5 flex items-center gap-3">
          <IgnisFlame size={36} />
          <div>
            <h1 className="text-white font-bold text-sm">NoctVox</h1>
            <p className="text-[10px] text-gray-500">Ignis Command</p>
          </div>
        </div>

        {/* Active Minds */}
        <div className="p-4 border-b border-white/5">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Active Minds</p>
          <div className="flex flex-wrap gap-1">
            {activeMinds.map(id => {
              const char = (COUNCIL_CHARACTERS as any)[id]
              return char ? (
                <span key={id} className="text-[9px] px-1.5 py-0.5 rounded font-mono" style={{ background: `${char.color}20`, color: char.color, border: `1px solid ${char.color}40` }}>
                  {char.name.split(' ')[0]}
                </span>
              ) : null
            })}
          </div>
        </div>

        {/* Council Stack */}
        <div className="p-4 border-b border-white/5">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Council Stack</p>
          <div className="space-y-1">
            {activeMinds.map(id => {
              const char = (COUNCIL_CHARACTERS as any)[id]
              return char ? (
                <div key={id} className="flex items-center gap-2 text-[10px] p-1.5 rounded" style={{ background: `${char.color}10`, borderLeft: `2px solid ${char.color}` }}>
                  <span className="text-white font-medium">{char.name}</span>
                  <span className="text-gray-500 ml-auto">{char.role}</span>
                </div>
              ) : null
            })}
          </div>
        </div>

        {/* Empires */}
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">Empires</p>
          <div className="space-y-1">
            {EMPIRES.map(emp => (
              <div key={emp.id} className="flex items-center gap-2 text-xs p-2 rounded hover:bg-white/5 cursor-pointer">
                <span>{emp.icon}</span>
                <span className={emp.status === 'active' ? 'text-white' : 'text-gray-500'}>{emp.name}</span>
                {emp.status === 'active' && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500" />}
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-gray-500">Telegram: Live</span>
          </div>
        </div>
      </aside>

      {/* Main chat */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="px-6 py-4 border-b border-white/5 flex items-center gap-4">
          <IgnisFlame size={36} />
          <div className="flex-1">
            <h2 className="text-white font-semibold text-sm">Ignis — NoctVox Command</h2>
            <p className="text-[10px] text-gray-500">Council minds active. Speak or type.</p>
          </div>
          {isSpeaking && (
            <button onClick={stopSpeaking} className="text-[10px] px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/30">
              Stop Voice
            </button>
          )}
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <IgnisFlame size={80} />
              <h3 className="text-white font-semibold mt-4 text-lg">Ignis Online</h3>
              <p className="text-gray-500 text-xs mt-2 max-w-sm">Black flame burns. Council minds standing by. Speak or type to command.</p>
            </div>
          )}

          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex items-end gap-2 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {msg.role === 'ignis' && <IgnisFlame size={26} />}
                {msg.role === 'council' && (
                  <div className="w-7 h-7 rounded bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 text-[10px] font-mono flex-shrink-0">C</div>
                )}
                {msg.role === 'user' && <div className="w-7 h-7 rounded-full bg-ember-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">K</div>}
                {msg.role === 'system' && <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 text-xs flex-shrink-0">!</div>}
                <div>
                  <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user' ? 'bg-ember-600 text-white rounded-br-md' :
                    msg.role === 'ignis' ? 'bg-[#141414] text-gray-200 border border-white/10 rounded-bl-md' :
                    msg.role === 'council' ? 'bg-[#0d0d1a] text-gray-300 border border-purple-500/20 rounded-bl-md font-mono text-xs' :
                    'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-xs'
                  }`}>
                    {msg.text}
                  </div>
                  {msg.minds && (
                    <div className="flex flex-wrap gap-1 mt-1 px-1">
                      {msg.minds.map((m: string) => {
                        const c = (COUNCIL_CHARACTERS as any)[m]
                        return c ? (
                          <span key={m} className="text-[8px] px-1 py-0.5 rounded" style={{ background: `${c.color}15`, color: c.color }}>
                            {c.role}
                          </span>
                        ) : null
                      })}
                    </div>
                  )}
                  <p className="text-[9px] text-gray-600 mt-1 px-1">{msg.time}</p>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {isListening && (
          <div className="px-6 py-3 flex items-center gap-3 bg-red-500/10 border-t border-red-500/20">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-red-400 text-xs flex-1">Listening...</span>
            <button onClick={stopListening} className="text-[10px] text-red-400 underline">Cancel</button>
          </div>
        )}

        <div className="p-4 border-t border-white/5">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                placeholder="Command Ignis..."
                rows={1}
                className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 resize-none focus:outline-none focus:border-ember-500/50"
                style={{ minHeight: '48px', maxHeight: '120px' }}
              />
            </div>
            <button onClick={isListening ? stopListening : startListening}
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-[#141414] border border-white/10 text-gray-400 hover:text-white'}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            </button>
            <button onClick={handleSend} disabled={!input.trim()}
              className="w-12 h-12 bg-ember-600 hover:bg-ember-500 disabled:bg-gray-700 disabled:text-gray-600 text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
