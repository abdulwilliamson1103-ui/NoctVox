import Head from 'next/head'
import { useState, useRef, useCallback } from 'react'
import { routeThroughCouncil, COUNCIL_CHARACTERS } from '../lib/council'

const EMPIRES = [
  { id: 'lexov',       name: 'LeVox',        domain: 'Real Estate',        tier: 1, status: 'active',  icon: '🏰', color: '#f97316' },
  { id: 'neovox',      name: 'NeoVox',       domain: 'AI & Robotics',      tier: 0, status: 'planned', icon: '⚡', color: '#8b5cf6' },
  { id: 'hpvox',       name: 'HPVox',        domain: 'Healthcare',         tier: 0, status: 'planned', icon: '🛡️', color: '#10b981' },
  { id: 'doctrinavox', name: 'DoctrinaVox',  domain: 'Education',          tier: 0, status: 'planned', icon: '📚', color: '#3b82f6' },
  { id: 'xovox',       name: 'XoVox',        domain: 'Entertainment',      tier: 0, status: 'planned', icon: '🎭', color: '#ec4899' },
  { id: 'finvox',      name: 'FinVox',       domain: 'Finance',            tier: 0, status: 'planned', icon: '💰', color: '#eab308' },
  { id: 'starvox',     name: 'StarVox',      domain: 'Transport & Energy', tier: 0, status: 'planned', icon: '🌟', color: '#06b6d4' },
]

interface Message {
  id: number
  role: 'user' | 'ignis' | 'council' | 'system'
  text: string
  time: string
  minds?: string[]
}

function IgnisFlame({ size = 64 }: { size?: number }) {
  return (
    <div className="flame-container">
      <svg width={size} height={size * 1.4} viewBox="0 0 64 90" fill="none" xmlns="http://www.w3.org/2000/svg" className="flame-svg">
        <path className="flame-outer" d="M32 2C32 2 8 30 8 55C8 73 18 86 32 86C46 86 56 73 56 55C56 30 32 2 32 2Z" fill="url(#outerGrad)" />
        <path className="flame-mid flame-spiral" d="M32 15C32 15 14 38 14 57C14 71 22 80 32 80C42 80 50 71 50 57C50 38 32 15 32 15Z" fill="url(#midGrad)" />
        <path className="flame-core" d="M32 30C32 30 22 47 22 58C22 67 26 73 32 73C38 73 42 67 42 58C42 47 32 30 32 30Z" fill="url(#coreGrad)" />
        <ellipse cx="32" cy="60" rx="6" ry="8" fill="white" opacity="0.7" className="flame-spiral" />
        <defs>
          <radialGradient id="outerGrad" cx="50%" cy="80%" r="70%"><stop offset="0%" stopColor="#1a0a00" /><stop offset="50%" stopColor="#8B2500" /><stop offset="100%" stopColor="#ff6b3500" stopOpacity="0" /></radialGradient>
          <radialGradient id="midGrad"  cx="50%" cy="75%" r="65%"><stop offset="0%" stopColor="#ff6b35" /><stop offset="40%" stopColor="#d4380d" /><stop offset="100%" stopColor="#ff6b3500" stopOpacity="0" /></radialGradient>
          <radialGradient id="coreGrad" cx="50%" cy="70%" r="60%"><stop offset="0%" stopColor="#ffffff" /><stop offset="30%" stopColor="#ffd700" /><stop offset="100%" stopColor="#ff6b35" /></radialGradient>
        </defs>
      </svg>
    </div>
  )
}

function CosmicBackground() {
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i, left: `${Math.random() * 100}%`, delay: `${Math.random() * 8}s`,
    duration: `${6 + Math.random() * 6}s`, size: 1 + Math.random() * 1.5,
  }))
  return (
    <div className="cosmic-bg">
      <div className="stars" />
      <div className="particle-field">
        {particles.map(p => <div key={p.id} className="particle" style={{ left: p.left, bottom: '0', width: p.size, height: p.size, animationDelay: p.delay, animationDuration: p.duration }} />)}
      </div>
      <div className="earth-container"><div className="earth-glow" /><div className="earth-spin" /></div>
      <div className="ember-glow" /><div className="vignette" />
    </div>
  )
}

function MindTag({ mindId }: { mindId: string }) {
  const char = (COUNCIL_CHARACTERS as Record<string, any>)[mindId]
  if (!char) return null
  return (
    <span className="inline-flex items-center text-[11px] px-1.5 py-0.5 rounded-sm mr-1 mb-1"
      style={{ background: `${char.color}18`, color: char.color, border: `1px solid ${char.color}35` }}>
      {char.name.split(' ')[0]}
    </span>
  )
}

function HoldToSpeak({ onTranscript }: { onTranscript: (t: string) => void }) {
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef<any>(null)
  const transcriptBuffer = useRef<string>('')

  const startListening = useCallback(() => {
    if (typeof window === 'undefined') return
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    if (!SR) { onTranscript('[Voice not supported — try Chrome]'); return }
    transcriptBuffer.current = ''
    const recognition = new SR()
    recognitionRef.current = recognition
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognition.onresult = (event: any) => {
      let t = ''
      for (let i = 0; i < event.results.length; i++) t += event.results[i][0].transcript
      transcriptBuffer.current = t
    }
    recognition.onerror = () => setListening(false)
    recognition.onend = () => {
      if (transcriptBuffer.current.trim()) onTranscript(transcriptBuffer.current.trim())
      setListening(false)
    }
    recognition.start()
    setListening(true)
  }, [onTranscript])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) { recognitionRef.current.stop(); recognitionRef.current = null }
    setListening(false)
  }, [])

  return (
    <button
      className={`hold-btn ${listening ? 'listening' : ''}`}
      onMouseDown={startListening} onMouseUp={stopListening} onMouseLeave={stopListening}
      onTouchStart={(e) => { e.preventDefault(); startListening() }}
      onTouchEnd={(e)   => { e.preventDefault(); stopListening()  }}
    >
      <div className="hold-ring" />
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={listening ? '#d4a843' : '#d4a84399'} strokeWidth="2">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
        <line x1="12" y1="19" x2="12" y2="23"/>
        <line x1="8"  y1="23" x2="16" y2="23"/>
      </svg>
    </button>
  )
}

export default function Home() {
  const [messages,    setMessages]    = useState<Message[]>([])
  const [input,       setInput]       = useState('')
  const [isSpeaking,  setIsSpeaking]  = useState(false)
  const [activeMinds, setActiveMinds] = useState<string[]>(['optimus'])
  const [showEmpire,  setShowEmpire]  = useState(false)
  const [loading,     setLoading]     = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const msgIdRef       = useRef(0)
  const inputRef       = useRef<HTMLInputElement>(null)

  const speak = useCallback((text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.rate = 1.1; u.pitch = 0.95; u.volume = 1
    u.onstart = () => setIsSpeaking(true)
    u.onend   = () => setIsSpeaking(false)
    u.onerror = () => setIsSpeaking(false)
    window.speechSynthesis.speak(u)
  }, [])

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined') window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }, [])

  const addMsg = useCallback((role: Message['role'], text: string, minds?: string[]) => {
    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
    setMessages(prev => [...prev, { id: ++msgIdRef.current, role, text, time, minds }])
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }, [])

  const handleSend = useCallback(async (textOverride?: string) => {
    const text = (textOverride || input).trim()
    if (!text || loading) return
    stopSpeaking()
    addMsg('user', text)
    setInput('')
    setLoading(true)

    const { active } = routeThroughCouncil(text)
    setActiveMinds(active)

    // Aum routes silently first — weights the context before Ignis speaks
    let aumContext = null
    try {
      const aumRes = await fetch('/api/aum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawInput: text, userId: 'noctvox_user', surfaceType: 'api' }),
      })
      if (aumRes.ok) aumContext = await aumRes.json()
    } catch { /* Aum offline — Ignis continues unrouted */ }

    try {
      const res = await fetch('/api/ignis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, minds: active, aumContext }),
      })
      const data = await res.json()
      addMsg('ignis', data.text || data.response || '[No response]', active)
      if (data.text) speak(data.text)
    } catch {
      addMsg('system', 'Connection error — check your network.')
    } finally {
      setLoading(false)
    }
  }, [input, loading, addMsg, speak, stopSpeaking])

  const handleVoiceTranscript = useCallback((transcript: string) => {
    if (transcript.startsWith('[')) { addMsg('system', transcript); return }
    setInput(transcript)
    setTimeout(() => handleSend(transcript), 400)
  }, [addMsg, handleSend])

  return (
    <div style={{ position: 'relative', height: '100dvh', overflow: 'hidden' }}>
      <Head><title>NoctVox — Ignis Command</title><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" /></Head>
      <CosmicBackground />
      <div className="chat-container relative z-10">
        <header className="flex items-center justify-between px-4 pt-3 pb-2"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0) 100%)' }}>
          <div className="flex items-center gap-3">
            <IgnisFlame size={38} />
            <div>
              <h1 className="text-white font-bold text-base leading-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>NoctVox</h1>
              <p className="text-xs" style={{ color: '#d4a84380' }}>Ignis Command</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isSpeaking && <button onClick={stopSpeaking} className="text-[11px] px-3 py-1.5 rounded-full" style={{ background: 'rgba(255,75,75,0.15)', color: '#ff6b6b', border: '1px solid rgba(255,75,75,0.3)' }}>Stop</button>}
            <button onClick={() => setShowEmpire(!showEmpire)} className="text-[11px] px-3 py-1.5 rounded-full" style={{ background: 'rgba(212,168,67,0.1)', color: '#d4a843', border: '1px solid rgba(212,168,67,0.3)' }}>{showEmpire ? 'Hide' : 'Empires'}</button>
          </div>
        </header>

        {showEmpire && (
          <div className="px-4 pb-2 overflow-x-auto">
            <div className="flex gap-2" style={{ minWidth: 'max-content' }}>
              {EMPIRES.map(emp => (
                <div key={emp.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px]"
                  style={{ background: emp.status === 'active' ? `${emp.color}20` : 'rgba(255,255,255,0.03)', border: `1px solid ${emp.status === 'active' ? emp.color + '50' : 'rgba(255,255,255,0.06)'}`, minWidth: '90px', fontSize: '11px' }}>
                  <span>{emp.icon}</span>
                  <span style={{ color: emp.status === 'active' ? '#fff' : '#666' }}>{emp.name}</span>
                  {emp.status === 'active' && <span className="w-1 h-1 rounded-full bg-emerald-400 ml-auto flex-shrink-0" />}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="px-4 pb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] uppercase tracking-widest" style={{ color: '#d4a84360' }}>Council:</span>
            {activeMinds.map(id => <MindTag key={id} mindId={id} />)}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-2 space-y-3">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center pt-12">
              <IgnisFlame size={72} />
              <h2 className="text-white font-semibold text-lg mt-4" style={{ fontFamily: 'Space Grotesk' }}>Ignis Online</h2>
              <p className="text-gray-500 text-xs mt-2 max-w-xs" style={{ color: '#666' }}>Hold the mic to speak, or type below. Aum routes. Ignis responds.</p>
              <div className="flex items-center gap-2 mt-4 text-xs" style={{ color: '#d4a84360' }}>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Aum · Ignis · Live</span>
              </div>
            </div>
          )}
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex items-end gap-2 max-w-[88%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {msg.role === 'ignis'  && <div className="flex-shrink-0"><IgnisFlame size={28} /></div>}
                {msg.role === 'council' && <div className="w-7 h-7 rounded flex items-center justify-center text-[10px] font-mono flex-shrink-0 mt-1" style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa' }}>C</div>}
                {msg.role === 'user'   && <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-1" style={{ background: 'linear-gradient(135deg, #ff6b35, #d4380d)', color: '#fff' }}>K</div>}
                {msg.role === 'system' && <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-1" style={{ background: 'rgba(255,200,50,0.1)', border: '1px solid rgba(255,200,50,0.2)', color: '#ffc832' }}>!</div>}
                <div className={`px-3 py-2 text-sm rounded-xl ${msg.role === 'user' ? 'text-white rounded-br-sm' : 'text-gray-200 rounded-bl-sm bg-black/40'}`}
                  style={msg.role === 'user' ? { background: 'linear-gradient(135deg, #ff6b35, #d4380d)', maxWidth: '75%' } : {}}>
                  {msg.text}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="px-4 pb-4 pt-2" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 60%, rgba(0,0,0,0) 100%)' }}>
          <div className="flex items-end gap-2 max-w-2xl mx-auto">
            <div className="flex-1 flex items-end gap-2 bg-white/5 backdrop-blur-sm rounded-2xl px-4 py-2 border" style={{ borderColor: 'rgba(212,168,67,0.2)' }}>
              <input
                ref={inputRef}
                type="text"
                className="flex-1 bg-transparent text-white text-sm outline-none placeholder-gray-600"
                placeholder="Message Ignis..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                disabled={loading}
              />
              {input.trim() && (
                <button onClick={() => handleSend()} disabled={loading}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d4a843" strokeWidth="2">
                    <line x1="22" y1="2" x2="11" y2="13" />
                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                </button>
              )}
            </div>
            <HoldToSpeak onTranscript={handleVoiceTranscript} />
          </div>
        </div>
      </div>
    </div>
  )
}
