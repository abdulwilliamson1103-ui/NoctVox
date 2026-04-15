// AumInterface.tsx
// NoctVox — Aum Entity Interface (Codebase #6)
// Built for: Lovable / Next.js (React + TypeScript + Tailwind + Supabase stack)
// Optimized for: 60fps mobile, GPU-only animation, touch-native UX
//
// Drop-in: import AumInterface from '@/src/components/AumInterface'
// Deps:    npm install three @react-three/fiber @react-three/drei @react-three/postprocessing gsap

// ─── Imports ──────────────────────────────────────────────────────────────────

import React, {
  useRef, useMemo, useCallback, useEffect, useState, Suspense,
} from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { AdaptiveDpr, AdaptiveEvents } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// ─── Types ────────────────────────────────────────────────────────────────────

interface AumResponse {
  expressionMode: string
  alignmentStatus: string
  houseMapping:     { primaryHouseId: number }
  torchActivation:  { dominant: string; weights: Record<string, number> }
  ringActivation:   { primary: string }
  echoBlend:        { leadEcho: { name: string; sample: string }; warmth: number; confidence: number }
}

interface Message {
  id: string
  role: 'user' | 'aum'
  content: string
  expressionMode?: string
  alignment?: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

// NoctVox UI palette — 60/30/10 rule
const C = {
  void:     '#0B0F14',   // 60% dominant background
  core:     '#141418',   // 60% paired background
  quantum:  '#0E2A47',   // 30% structural panels
  circuit:  '#0C1A2B',   // 30% deep surfaces
  ion:      '#4FC3F7',   // 10% accent highlights
  cyan:     '#3DF2E0',   // 10% primary glow
  lime:     '#B6FF3B',   // 10% CTA / success
  violet:   '#8A6CFF',   // 10% hover glow
  magenta:  '#E445FF',   // 10% rare flourish
  silver:   '#DDE3EA',   // 10% typography
} as const

// Aum entity fire palette (the 3D entity itself, independent of UI colors)
const FIRE = {
  deep:   new THREE.Color('#7A0F00'),
  mid:    new THREE.Color('#D43500'),
  hot:    new THREE.Color('#FF6B00'),
  bright: new THREE.Color('#FFB300'),
  core:   new THREE.Color('#FFE066'),
}

const STRAND_COUNT    = 90   // Number of tube strands on the sphere
const ORB_COUNT       = 320  // Glowing ember nodes (instanced — 1 draw call)
const SPHERE_R        = 2.5  // Sphere radius in world units
const STRAND_SEGS     = 64   // Curve resolution per strand
const CAMERA_Z        = 7    // Initial camera distance

// ─── Helpers ──────────────────────────────────────────────────────────────────

// GPU lerp — used for all pointer/touch-follow effects, never direct assignment
function lerp(a: number, b: number, t: number) { return a + (b - a) * t }

// Uniform sphere surface distribution (inverse-CDF method)
function randomOnSphere(r: number): THREE.Vector3 {
  const theta = Math.random() * Math.PI * 2
  const phi   = Math.acos(2 * Math.random() - 1)
  return new THREE.Vector3(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  )
}

// Arc points along sphere surface — organic bulge for living feel
function sphereArc(a: THREE.Vector3, b: THREE.Vector3, n: number, r: number): THREE.Vector3[] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n
    // Slerp along sphere surface, then add outward bulge at midpoint
    const p = new THREE.Vector3().copy(a).lerp(b, t).normalize()
    const bulge = 1 + Math.sin(t * Math.PI) * 0.18
    return p.multiplyScalar(r * bulge)
  })
}

// ─── GLSL Shaders — Aum Fire Effect ───────────────────────────────────────────
//
// Fragment shader cycles through fire palette using time-based value noise.
// Using ShaderMaterial (not standard material) gives full color control
// and avoids expensive PBR lighting calculations on 90 tube geometries.

const VERT = /* glsl */`
  varying vec2 vUv;
  varying vec3 vWorldPos;
  void main() {
    vUv = uv;
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const FRAG = /* glsl */`
  uniform float uTime;
  uniform vec3  uA;   // deep red
  uniform vec3  uB;   // mid orange
  uniform vec3  uC;   // bright gold
  varying vec2  vUv;
  varying vec3  vWorldPos;

  // Value noise — cheap but sufficient for organic fire feel
  float hash(vec3 p) {
    return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
  }
  float noise(vec3 p) {
    vec3 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i),           hash(i+vec3(1,0,0)), f.x),
          mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)), f.x), f.y),
      mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)), f.x),
          mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)), f.x), f.y),
      f.z);
  }

  void main() {
    // Animated noise along the strand's world position + time
    float n     = noise(vWorldPos * 3.5 + uTime * 0.35);
    // Pulse travels along the strand length (vUv.x = 0→1 along tube)
    float pulse = sin(vUv.x * 6.2832 + uTime * 1.8) * 0.5 + 0.5;
    float t     = clamp(n * 0.55 + pulse * 0.45, 0.0, 1.0);

    // Three-stop fire gradient: deep → mid → gold
    vec3 col = t < 0.5
      ? mix(uA, uB, t * 2.0)
      : mix(uB, uC, (t - 0.5) * 2.0);

    // Slight opacity fade toward strand ends for organic termination
    float endFade = smoothstep(0.0, 0.08, vUv.x) * smoothstep(1.0, 0.92, vUv.x);
    gl_FragColor  = vec4(col, 0.72 + n * 0.28) * endFade + vec4(col, 0.72 + n * 0.28) * (1.0 - endFade) * 0.3;
    gl_FragColor  = vec4(col, (0.7 + n * 0.3) * (0.3 + endFade * 0.7));
  }
`

// ─── Aum Strands ──────────────────────────────────────────────────────────────

function AumStrands() {
  const timeRef = useRef(0)
  const matsRef = useRef<THREE.ShaderMaterial[]>([])

  // All geometry built once in useMemo — never recomputed on re-render
  const { geos, mats } = useMemo(() => {
    const geos: THREE.TubeGeometry[]    = []
    const mats: THREE.ShaderMaterial[]  = []

    for (let i = 0; i < STRAND_COUNT; i++) {
      const a = randomOnSphere(SPHERE_R)
      const b = randomOnSphere(SPHERE_R)
      const pts = sphereArc(a, b, STRAND_SEGS, SPHERE_R)

      // Thick/thin strand variation — visual diversity matches reference image
      // NEVER uses width/height CSS — varies Three.js tube radius instead
      const radius  = 0.006 + Math.random() * 0.024
      const radSegs = Math.random() > 0.6 ? 5 : 3   // more facets = rounder, fewer = angular
      geos.push(new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(pts), STRAND_SEGS, radius, radSegs, false
      ))

      mats.push(new THREE.ShaderMaterial({
        vertexShader:   VERT,
        fragmentShader: FRAG,
        transparent:    true,
        side:           THREE.DoubleSide,
        uniforms: {
          uTime: { value: 0 },
          uA:    { value: FIRE.deep },
          uB:    { value: FIRE.hot },
          uC:    { value: FIRE.bright },
        },
      }))
    }
    return { geos, mats }
  }, [])

  useEffect(() => {
    matsRef.current = mats
    return () => { geos.forEach(g => g.dispose()); mats.forEach(m => m.dispose()) }
  }, [geos, mats])

  // delta-time loop — GPU transform only, no React state mutations
  useFrame((_, delta) => {
    timeRef.current += delta
    matsRef.current.forEach((m, i) => {
      // Offset per strand gives the impression each filament pulses independently
      m.uniforms.uTime.value = timeRef.current + i * 0.07
    })
  })

  return (
    <>
      {geos.map((geo, i) => (
        <mesh key={i} geometry={geo} material={mats[i]} />
      ))}
    </>
  )
}

// ─── Aum Orbs (Instanced — 1 draw call for all 320 embers) ───────────────────

function AumOrbs() {
  const ref   = useRef<THREE.InstancedMesh>(null!)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  // Pre-compute stable positions + base scales — never recalculate
  const { positions, baseScales } = useMemo(() => {
    const positions: THREE.Vector3[] = []
    const baseScales: number[]       = []
    for (let i = 0; i < ORB_COUNT; i++) {
      // Scatter orbs on and slightly beyond the sphere surface — "embers caught mid-flight"
      const p = randomOnSphere(SPHERE_R * (0.9 + Math.random() * 0.25))
      positions.push(p)
      baseScales.push(0.01 + Math.random() * 0.028)
    }
    return { positions, baseScales }
  }, [])

  // Write initial matrices once
  useEffect(() => {
    if (!ref.current) return
    positions.forEach((pos, i) => {
      dummy.position.copy(pos)
      dummy.scale.setScalar(baseScales[i])
      dummy.updateMatrix()
      ref.current.setMatrixAt(i, dummy.matrix)
    })
    ref.current.instanceMatrix.needsUpdate = true
  }, [positions, baseScales, dummy])

  // Animate: scale pulse per orb — GPU transform only, never position jitter
  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.getElapsedTime()
    positions.forEach((pos, i) => {
      // Each orb has a unique phase offset so they don't all pulse in sync
      const pulse = 1 + Math.sin(t * 2.2 + i * 0.41) * 0.35
      dummy.position.copy(pos)
      dummy.scale.setScalar(baseScales[i] * pulse)
      dummy.updateMatrix()
      ref.current.setMatrixAt(i, dummy.matrix)
    })
    ref.current.instanceMatrix.needsUpdate = true
  })

  return (
    // args = [geometry, material, count] — JSX children provide geo + mat
    <instancedMesh ref={ref} args={[undefined, undefined, ORB_COUNT]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshStandardMaterial
        color={FIRE.core}
        emissive={FIRE.bright}
        emissiveIntensity={3.5}
        toneMapped={false}   // Required for bloom to catch emissive values above 1
      />
    </instancedMesh>
  )
}

// ─── Rotating Aum Group ───────────────────────────────────────────────────────
//
// Rotation uses THREE quaternion internally (GPU matrix op).
// The outer group rotates so BOTH strands and orbs move together coherently.

function AumEntity({ tiltX, tiltY }: { tiltX: number; tiltY: number }) {
  const groupRef = useRef<THREE.Group>(null!)
  // Lerped tilt refs — never assign directly, always lerp for smooth motion
  const lerpedTilt = useRef({ x: 0, y: 0 })

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime()
    // Slow base rotation — always alive, never static
    groupRef.current.rotation.y = t * 0.07
    // Breathing: subtle scale oscillation — GPU transform, not CSS width/height
    const breathe = 1 + Math.sin(t * 0.4) * 0.025
    groupRef.current.scale.setScalar(breathe)
    // Lerped tilt follows pointer/gyroscope — smooth inertia feel
    lerpedTilt.current.x = lerp(lerpedTilt.current.x, tiltY * 0.25, delta * 3)
    lerpedTilt.current.y = lerp(lerpedTilt.current.y, tiltX * 0.25, delta * 3)
    groupRef.current.rotation.x = lerpedTilt.current.x
  })

  return (
    <group ref={groupRef}>
      <AumStrands />
      <AumOrbs />
    </group>
  )
}

// ─── R3F Scene ────────────────────────────────────────────────────────────────

function AumScene({ tiltX, tiltY }: { tiltX: number; tiltY: number }) {
  const { size } = useThree()
  const isMobile  = size.width < 768

  return (
    <>
      {/* Lights give depth to the orbs (strands use ShaderMaterial — unlit) */}
      <ambientLight intensity={0.15} />
      <pointLight position={[0, 0, 0]}  intensity={4}   color={FIRE.bright.getHex()} distance={9} />
      <pointLight position={[5, 3, 2]}  intensity={1.8} color="#FF5500" distance={12} />
      <pointLight position={[-4,-2,-3]} intensity={1.2} color="#8B1A00" distance={10} />

      <AumEntity tiltX={tiltX} tiltY={tiltY} />

      {/* Bloom post-processing — the glow that makes orbs feel like living embers.
          luminanceThreshold 0.3 means only emissiveIntensity > 1 triggers bloom. */}
      <EffectComposer>
        <Bloom
          intensity={2.2}
          luminanceThreshold={0.3}
          luminanceSmoothing={0.85}
          mipmapBlur
          radius={0.6}
        />
      </EffectComposer>

      {/* AdaptiveDpr: auto-downscales resolution if FPS drops below 55.
          AdaptiveEvents: batches R3F events to stay off the main thread. */}
      <AdaptiveDpr pixelated />
      <AdaptiveEvents />
    </>
  )
}

// ─── Expression Mode HUD ──────────────────────────────────────────────────────

function ExpressionHUD({ mode, status }: { mode: string; status: string }) {
  const parts = mode.split(':')
  const colors = [C.cyan, C.silver, C.violet, C.ion]
  return (
    // willChange: transform → GPU compositing layer, avoids layout recalc
    <div className="absolute top-4 left-4 font-mono" style={{ willChange: 'transform' }}>
      <div className="flex gap-1.5 flex-wrap">
        {parts.map((part, i) => (
          <span
            key={i}
            className="px-2 py-0.5 rounded text-xs"
            style={{
              backgroundColor: C.quantum + 'CC',
              border:          `1px solid ${colors[i] ?? C.silver}40`,
              color:           colors[i] ?? C.silver,
              letterSpacing:   '0.05em',
            }}
          >
            {part}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-1.5 mt-1.5">
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: status === 'aligned' ? C.lime : C.magenta, display: 'inline-block' }}
        />
        <span className="text-[10px] tracking-widest font-mono" style={{ color: C.silver + '70' }}>
          {status.toUpperCase()}
        </span>
      </div>
    </div>
  )
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function Bubble({ msg }: { msg: Message }) {
  const isAum = msg.role === 'aum'
  return (
    <div
      className={`flex mb-3 ${isAum ? 'justify-start' : 'justify-end'}`}
      style={{ willChange: 'transform' }}
    >
      <div
        className="max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed"
        style={{
          backgroundColor: isAum ? C.quantum + 'D0' : C.circuit + 'D0',
          border:          `1px solid ${isAum ? C.cyan + '30' : C.violet + '30'}`,
          color:           C.silver,
        }}
      >
        {isAum && msg.expressionMode && (
          <div className="text-[10px] font-mono mb-2" style={{ color: C.cyan + '90' }}>
            {msg.expressionMode}
          </div>
        )}
        {msg.content}
      </div>
    </div>
  )
}

// ─── Loading Dots ─────────────────────────────────────────────────────────────

function ThinkingDots() {
  return (
    <div className="flex justify-start mb-3">
      <div
        className="px-4 py-3 rounded-2xl"
        style={{ backgroundColor: C.quantum + 'D0', border: `1px solid ${C.cyan}30` }}
      >
        <div className="flex gap-1 items-center">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full animate-bounce"
              style={{ backgroundColor: C.cyan, animationDelay: `${i * 0.12}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AumInterface() {
  const [messages, setMessages]   = useState<Message[]>([])
  const [input, setInput]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [exprMode, setExprMode]   = useState('AUM:ROUTING:ENGINE:LIVE')
  const [alignment, setAlignment] = useState('aligned')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef   = useRef<HTMLDivElement>(null)

  // Touch/mouse tilt state for Aum entity — lerped in useFrame, no React re-renders
  // Using refs (not state) keeps the animation loop off the React reconciler entirely
  const tiltRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 })
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const tiltRafRef = useRef<number>(0)

  // GSAP intro — transforms only (opacity + scale), never top/left/margin
  useEffect(() => {
    if (!containerRef.current) return
    gsap.fromTo(containerRef.current,
      { opacity: 0, scale: 0.97 },
      { opacity: 1, scale: 1, duration: 1.6, ease: 'expo.out' }
    )
  }, [])

  // Smooth tilt loop using rAF lerp — runs outside React, never causes re-renders
  // unless tilt has meaningfully changed (threshold prevents micro-updates)
  useEffect(() => {
    function loop() {
      tiltRef.current.x = lerp(tiltRef.current.x, tiltRef.current.targetX, 0.06)
      tiltRef.current.y = lerp(tiltRef.current.y, tiltRef.current.targetY, 0.06)
      setTilt({ x: tiltRef.current.x, y: tiltRef.current.y })
      tiltRafRef.current = requestAnimationFrame(loop)
    }
    tiltRafRef.current = requestAnimationFrame(loop)
    return () => { if (tiltRafRef.current) cancelAnimationFrame(tiltRafRef.current) }
  }, [])

  // Touch move — uses event.touches[0].clientX, NOT event.clientX
  // event.clientX is undefined on iOS Safari when there is no mouse
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0]
    tiltRef.current.targetX = (t.clientX / window.innerWidth  - 0.5) * 2
    tiltRef.current.targetY = (t.clientY / window.innerHeight - 0.5) * 2
  }, [])

  // Desktop mouse fallback — branched from touch to keep mobile path clean
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    tiltRef.current.targetX = (e.clientX / window.innerWidth  - 0.5) * 2
    tiltRef.current.targetY = (e.clientY / window.innerHeight - 0.5) * 2
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: Message = { id: `${Date.now()}`, role: 'user', content: text }
    setMessages(p => [...p, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res  = await fetch('/api/aum', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ rawInput: text, userId: 'guest', surfaceType: 'browser' }),
      })
      const data: AumResponse = await res.json()

      setExprMode(data.expressionMode)
      setAlignment(data.alignmentStatus)

      // GSAP pulse on the canvas when Aum responds
      // Animates opacity (GPU compositing) — never width/height
      const canvas = containerRef.current?.querySelector('canvas')
      if (canvas) {
        gsap.fromTo(canvas, { opacity: 0.7 }, { opacity: 1, duration: 0.6, ease: 'power2.out' })
      }

      const aumMsg: Message = {
        id:            `${Date.now()}-aum`,
        role:          'aum',
        content:       data.echoBlend?.leadEcho?.sample ?? `Routing complete via ${data.expressionMode}`,
        expressionMode: data.expressionMode,
        alignment:     data.alignmentStatus,
      }
      setMessages(p => [...p, aumMsg])
    } catch {
      setMessages(p => [...p, {
        id:      `${Date.now()}-err`,
        role:    'aum',
        content: 'Routing engine active. Supabase persistence offline — local mode.',
      }])
    } finally {
      setLoading(false)
    }
  }, [input, loading])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }, [sendMessage])

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden flex flex-col select-none"
      style={{ height: '100dvh', backgroundColor: C.void, willChange: 'transform' }}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
    >
      {/* ── 3D Canvas — full bleed background ── */}
      <div className="absolute inset-0 pointer-events-none" style={{ willChange: 'transform' }}>
        <Canvas
          // dpr [1,2] → uses device pixel ratio, capped at 2x for performance.
          // AdaptiveDpr inside the scene will drop it further if FPS falls.
          dpr={[1, 2]}
          camera={{ position: [0, 0, CAMERA_Z], fov: 48 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          style={{ background: 'transparent' }}
        >
          <Suspense fallback={null}>
            <AumScene tiltX={tilt.x} tiltY={tilt.y} />
          </Suspense>
        </Canvas>
      </div>

      {/* ── Radial vignette — depth illusion, no GPU cost (CSS radial-gradient) ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 70% 70% at 50% 50%, transparent 20%, ${C.void}B0 75%, ${C.void} 100%)`,
        }}
      />

      {/* ── Expression Mode HUD ── */}
      <ExpressionHUD mode={exprMode} status={alignment} />

      {/* ── Top-right wordmark ── */}
      <div className="absolute top-4 right-4 text-right pointer-events-none" style={{ willChange: 'transform' }}>
        <div className="font-mono text-[11px] tracking-[0.4em]" style={{ color: C.cyan }}>AUM</div>
        <div className="font-mono text-[9px] tracking-[0.2em]" style={{ color: C.silver + '50' }}>NOCTVOX</div>
      </div>

      {/* ── Message thread — transparent over 3D canvas ── */}
      <div
        className="absolute inset-x-0 overflow-y-auto px-4 pt-4"
        style={{ top: 72, bottom: 76 }}
      >
        <div className="max-w-sm mx-auto">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center pt-24 text-center">
              <div
                className="font-mono text-xs tracking-[0.6em] mb-2"
                style={{ color: C.silver + '40' }}
              >
                SPEAK
              </div>
              <div className="text-xs" style={{ color: C.silver + '30' }}>
                Aum is listening
              </div>
            </div>
          )}
          {messages.map(msg => <Bubble key={msg.id} msg={msg} />)}
          {loading && <ThinkingDots />}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ── Input bar — fixed at bottom ── */}
      {/* willChange: transform pins this to its own compositing layer — no layout jitter */}
      <div
        className="absolute inset-x-0 bottom-0 px-4 py-3"
        style={{
          backgroundColor:  C.core + 'F2',
          borderTop:        `1px solid ${C.quantum}`,
          willChange:       'transform',
        }}
      >
        <div className="max-w-sm mx-auto flex gap-2 items-center">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Aum anything…"
            className="flex-1 rounded-xl px-4 text-sm outline-none"
            style={{
              backgroundColor: C.quantum + '90',
              border:          `1px solid ${C.cyan}25`,
              color:           C.silver,
              caretColor:      C.cyan,
              // 44px minimum tap target height (Apple HIG + Android Material)
              height:          44,
            }}
          />
          {/* Send — 44×44 tap target minimum */}
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="rounded-xl flex items-center justify-center flex-shrink-0 transition-opacity"
            style={{
              backgroundColor: C.cyan,
              width:           44,
              height:          44,
              opacity:         loading || !input.trim() ? 0.35 : 1,
              willChange:      'transform',
            }}
          >
            {/* SVG arrow — inline, no external asset load */}
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path
                d="M1.5 7.5L13.5 7.5M8.5 2.5L13.5 7.5L8.5 12.5"
                stroke={C.void}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
