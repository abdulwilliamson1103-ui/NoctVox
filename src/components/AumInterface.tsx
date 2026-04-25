// AumInterface.tsx — NoctVox ACS Ambient Layer
// Vanilla Three.js inside React; SSR disabled at the dynamic-import level in pages/aum.tsx

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const MODES = [
  'H4 · HEART · VENUS · TAURUS',
  'H10 · MIND · SATURN · CAPRICORN',
  'H7 · BRIDGE · MERCURY · GEMINI',
  'H1 · ROOT · MARS · ARIES',
  'H12 · VOID · NEPTUNE · PISCES',
  'H6 · SERVICE · MOON · VIRGO',
  'H2 · VALUE · EARTH · TAURUS',
  'H9 · VISION · JUPITER · SAGITTARIUS',
]

const VERT_SHADER = `
  uniform float uTime;
  uniform float uSpeed;
  uniform float uWarp;
  varying vec2  vUv;
  varying vec3  vWorldPos;
  varying float vDisplace;

  float hash(vec3 p) {
    return fract(sin(dot(p, vec3(127.1,311.7,74.7))) * 43758.5453);
  }
  float noise3(vec3 p) {
    vec3 i = floor(p), f = fract(p);
    f = f*f*(3.0-2.0*f);
    return mix(
      mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
      mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),
      f.z);
  }
  void main() {
    vUv = uv;
    vec3 pos = position;
    float n  = noise3(pos * 2.0 + uTime * uSpeed * 0.8);
    float n2 = noise3(pos * 4.0 - uTime * uSpeed * 1.2);
    vec3 dir = normal * (n * 0.12 + n2 * 0.06) * uWarp;
    dir += cross(normal, vec3(0.0,1.0,0.0)) * sin(uTime * uSpeed + pos.y * 3.0) * 0.04 * uWarp;
    pos += dir;
    vDisplace  = n;
    vWorldPos  = (modelMatrix * vec4(pos, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

const FRAG_SHADER = `
  uniform float uTime;
  uniform float uSpeed;
  uniform vec3  uA, uB, uC, uD;
  varying vec2  vUv;
  varying vec3  vWorldPos;
  varying float vDisplace;

  float hash(vec3 p) {
    return fract(sin(dot(p, vec3(127.1,311.7,74.7))) * 43758.5453);
  }
  float noise(vec3 p) {
    vec3 i = floor(p), f = fract(p);
    f = f*f*(3.0-2.0*f);
    return mix(
      mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
      mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),
      f.z);
  }
  float fbm(vec3 p) {
    float v = 0.0, a = 0.5;
    vec3 shift = vec3(100.0);
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p = p * 2.0 + shift;
      a *= 0.5;
    }
    return v;
  }
  void main() {
    float t1 = fbm(vWorldPos * 3.0 + vec3(uTime*uSpeed*0.4, uTime*uSpeed*-0.3, uTime*uSpeed*0.2));
    float t2 = fbm(vWorldPos * 5.0 - vec3(uTime*uSpeed*0.5, uTime*uSpeed*0.6, uTime*uSpeed*-0.4));
    float t3 = noise(vWorldPos * 8.0 + uTime * uSpeed * 1.5);
    float pulse  = sin(vUv.x * 12.566 + uTime * uSpeed * 3.0) * 0.5 + 0.5;
    float pulse2 = sin(vUv.x * 8.0 - uTime * uSpeed * 2.2 + t1 * 6.0) * 0.5 + 0.5;
    float t = clamp(t1*0.35 + t2*0.25 + pulse*0.2 + pulse2*0.1 + t3*0.1, 0.0, 1.0);
    vec3 col;
    if      (t < 0.33) col = mix(uA, uB, t * 3.0);
    else if (t < 0.66) col = mix(uB, uC, (t-0.33)*3.0);
    else               col = mix(uC, uD, (t-0.66)*3.0);
    float flare = smoothstep(0.75, 0.92, t3 * pulse);
    col += uD * flare * 0.25;
    float endFade = smoothstep(0.0,0.1,vUv.x) * smoothstep(1.0,0.9,vUv.x);
    float opacity = (0.45 + t1 * 0.3) * (0.2 + endFade * 0.8);
    opacity *= 0.85 + sin(uTime * uSpeed * 5.0 + vUv.x * 20.0) * 0.15;
    gl_FragColor = vec4(col, opacity);
  }
`

const PALETTES = [
  { a: '#3A0500', b: '#8B2000', c: '#D45500', d: '#FFB300' },
  { a: '#2A0018', b: '#7A1030', c: '#C44020', d: '#FF8C00' },
  { a: '#0F0600', b: '#5C2D00', c: '#A05A00', d: '#E8A020' },
  { a: '#1A003A', b: '#5500A0', c: '#AA3000', d: '#FF7030' },
  { a: '#080400', b: '#6B1010', c: '#B03820', d: '#E8804A' },
]

const CSS_STYLES = `
  .aum-loader-text {
    font-family: 'Share Tech Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.5em;
    color: rgba(212,85,0,0.35);
    text-transform: uppercase;
    animation: aum-blink 1.1s step-end infinite;
  }
  @keyframes aum-blink { 0%,100%{opacity:1} 50%{opacity:0} }

  .aum-mono {
    font-family: 'Share Tech Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.38em;
    text-transform: uppercase;
    color: rgba(212,85,0,0.28);
  }

  .aum-pulse-dot {
    display: inline-block;
    width: 4px; height: 4px;
    border-radius: 50%;
    background: #D45500;
    box-shadow: 0 0 6px #D45500;
    margin-right: 7px;
    vertical-align: middle;
    animation: aum-pdot 2.4s ease-in-out infinite;
  }
  @keyframes aum-pdot {
    0%,100% { opacity:1; transform:scale(1); }
    50%     { opacity:0.25; transform:scale(0.5); }
  }

  .aum-mode-token {
    font-family: 'Share Tech Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: rgba(212,85,0,0.22);
    transition: opacity 0.4s ease;
  }

  .aum-glyph {
    font-family: 'Cinzel', serif;
    font-weight: 300;
    font-size: clamp(68px, 11vw, 120px);
    letter-spacing: 0.28em;
    color: transparent;
    -webkit-text-stroke: 1px rgba(200,80,10,0.1);
    line-height: 1;
    animation: aum-breathe 5s ease-in-out infinite;
  }
  @keyframes aum-breathe {
    0%,100% { -webkit-text-stroke-color: rgba(200,80,10,0.10); }
    50%     { -webkit-text-stroke-color: rgba(230,120,20,0.18); }
  }

  .aum-tagline {
    margin-top: 6px;
    font-family: 'Share Tech Mono', monospace;
    font-size: 8px;
    letter-spacing: 0.55em;
    color: rgba(200,80,10,0.13);
    text-transform: uppercase;
  }
`

export default function AumInterface() {
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const modeTokenRef = useRef<HTMLDivElement>(null)
  const loaderRef    = useRef<HTMLDivElement>(null)
  const loaderBarRef = useRef<HTMLDivElement>(null)

  // Mode token cycling
  useEffect(() => {
    const el = modeTokenRef.current
    if (!el) return
    let idx = 0
    let innerT: ReturnType<typeof setTimeout>
    const interval = setInterval(() => {
      idx = (idx + 1) % MODES.length
      el.style.opacity = '0'
      innerT = setTimeout(() => { el.textContent = MODES[idx]; el.style.opacity = '1' }, 400)
    }, 3500)
    return () => { clearInterval(interval); clearTimeout(innerT) }
  }, [])

  // Loader bar + fade-out
  useEffect(() => {
    const bar    = loaderBarRef.current
    const loader = loaderRef.current
    if (!bar || !loader) return
    let t3: ReturnType<typeof setTimeout>
    const t1 = setTimeout(() => { bar.style.width = '100%' }, 100)
    const t2 = setTimeout(() => {
      loader.style.opacity = '0'
      t3 = setTimeout(() => { if (loader) loader.style.display = 'none' }, 1000)
    }, 1500)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  // Three.js scene
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const STRANDS = 110, ORBS = 350, WISPS = 120, SPITS = 25
    const RADIUS = 2.5, SEG = 64

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t

    const randomOnSphere = (r: number) => {
      const theta = Math.random() * Math.PI * 2
      const phi   = Math.acos(2 * Math.random() - 1)
      return new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta),
      )
    }

    const sphereArc = (a: THREE.Vector3, b: THREE.Vector3, n: number, r: number) => {
      const pts: THREE.Vector3[] = []
      for (let i = 0; i <= n; i++) {
        const t = i / n
        const p = new THREE.Vector3().copy(a).lerp(b, t).normalize()
        pts.push(p.multiplyScalar(r * (1 + Math.sin(t * Math.PI) * 0.22)))
      }
      return pts
    }

    // Renderer
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x0B0F14, 1)

    const scene  = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100)
    camera.position.set(0, 0, 7)
    let targetZ = 7

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onResize)

    // Input state (captured in animation closure)
    let mouseX = 0, mouseY = 0
    let isDragging = false, lastDX = 0, lastDY = 0
    let manualRotY = 0, manualRotX = 0
    let lastPinch = 0

    const onMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth  - 0.5) * 2
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2
      if (isDragging) {
        manualRotY += (e.clientX - lastDX) * 0.005
        manualRotX += (e.clientY - lastDY) * 0.003
        manualRotX = Math.max(-0.8, Math.min(0.8, manualRotX))
        lastDX = e.clientX; lastDY = e.clientY
      }
    }
    const onMouseDown = (e: MouseEvent) => { isDragging = true; lastDX = e.clientX; lastDY = e.clientY }
    const onMouseUp   = () => { isDragging = false }
    const onWheel     = (e: WheelEvent) => { targetZ = Math.max(1.5, Math.min(12, targetZ + e.deltaY * 0.01)) }

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) { lastDX = e.touches[0].clientX; lastDY = e.touches[0].clientY }
      else if (e.touches.length === 2)
        lastPinch = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY)
    }
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const t = e.touches[0]
        mouseX = (t.clientX / window.innerWidth  - 0.5) * 2
        mouseY = (t.clientY / window.innerHeight - 0.5) * 2
        manualRotY += (t.clientX - lastDX) * 0.005
        manualRotX += (t.clientY - lastDY) * 0.003
        manualRotX = Math.max(-0.8, Math.min(0.8, manualRotX))
        lastDX = t.clientX; lastDY = t.clientY
      } else if (e.touches.length === 2) {
        const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY)
        targetZ = Math.max(1.5, Math.min(12, targetZ - (d - lastPinch) * 0.02))
        lastPinch = d
      }
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('mouseup',   onMouseUp)
    window.addEventListener('wheel',       onWheel,       { passive: true })
    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchmove',  onTouchMove,  { passive: true })

    // Scene objects
    const aumGroup = new THREE.Group()
    scene.add(aumGroup)

    // Strands
    const strandMats: THREE.ShaderMaterial[] = []
    const strandGeos: THREE.TubeGeometry[]   = []
    for (let i = 0; i < STRANDS; i++) {
      const pts  = sphereArc(randomOnSphere(RADIUS), randomOnSphere(RADIUS), SEG, RADIUS)
      const geo  = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), SEG, 0.008 + Math.random() * 0.028, Math.random() > 0.5 ? 5 : 3, false)
      const pal  = PALETTES[Math.floor(Math.random() * PALETTES.length)]
      const mat  = new THREE.ShaderMaterial({
        vertexShader: VERT_SHADER, fragmentShader: FRAG_SHADER,
        transparent: true, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending,
        uniforms: {
          uTime:  { value: 0 },
          uSpeed: { value: 0.7 + Math.random() * 0.8 },
          uWarp:  { value: 0.6 + Math.random() * 0.8 },
          uA: { value: new THREE.Color(pal.a) },
          uB: { value: new THREE.Color(pal.b) },
          uC: { value: new THREE.Color(pal.c) },
          uD: { value: new THREE.Color(pal.d) },
        },
      })
      strandGeos.push(geo); strandMats.push(mat)
      aumGroup.add(new THREE.Mesh(geo, mat))
    }

    // Orbs (instanced)
    const orbGeo     = new THREE.SphereGeometry(1, 6, 6)
    const orbColors  = [0xCC5500, 0xDD8800, 0xBB3300, 0xDDAA00, 0xCC6600]
    const orbOrigins = Array.from({ length: ORBS }, () => randomOnSphere(RADIUS * (0.85 + Math.random() * 0.35)))
    const orbScales  = Array.from({ length: ORBS }, () => 0.006 + Math.random() * 0.022)
    const orbSpeeds  = Array.from({ length: ORBS }, () => 0.3 + Math.random() * 1.5)
    const orbAxes    = Array.from({ length: ORBS }, () =>
      new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize()
    )
    const colAttr = new Float32Array(ORBS * 3)
    for (let i = 0; i < ORBS; i++) {
      const c = new THREE.Color(orbColors[Math.floor(Math.random() * orbColors.length)])
      colAttr[i * 3] = c.r; colAttr[i * 3 + 1] = c.g; colAttr[i * 3 + 2] = c.b
    }
    orbGeo.setAttribute('color', new THREE.InstancedBufferAttribute(colAttr, 3))
    const orbMat  = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending, vertexColors: true })
    const orbMesh = new THREE.InstancedMesh(orbGeo, orbMat, ORBS)
    orbMesh.frustumCulled = false
    aumGroup.add(orbMesh)

    // Wisps (instanced)
    const wispGeo        = new THREE.SphereGeometry(1, 4, 4)
    const wispMat        = new THREE.MeshBasicMaterial({ color: 0xDD8800, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending })
    const wispMesh       = new THREE.InstancedMesh(wispGeo, wispMat, WISPS)
    wispMesh.frustumCulled = false
    aumGroup.add(wispMesh)
    const wispStarts      = Array.from({ length: WISPS }, () => randomOnSphere(RADIUS * (0.9 + Math.random() * 0.2)))
    const wispDrifts      = Array.from({ length: WISPS }, () => {
      const fast = Math.random() > 0.7
      return new THREE.Vector3(
        (Math.random() - 0.5) * (fast ? 0.6 : 0.15),
        fast ? 0.6 + Math.random() * 1.0 : 0.1 + Math.random() * 0.25,
        (Math.random() - 0.5) * (fast ? 0.6 : 0.15),
      )
    })
    const wispLifetimes   = Array.from({ length: WISPS }, () => 0.8 + Math.random() * 2.5)
    const wispBurstSpeeds = Array.from({ length: WISPS }, () => 0.5 + Math.random() * 1.5)
    const wispJitter      = Array.from({ length: WISPS }, () => ({
      freq:  2 + Math.random() * 6,
      amp:   0.015 + Math.random() * 0.06,
      phase: Math.random() * Math.PI * 2,
    }))

    // Fire spits (instanced)
    const spitGeo    = new THREE.SphereGeometry(1, 5, 5)
    const spitMat    = new THREE.MeshBasicMaterial({ color: 0xFFB300, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending })
    const spitMesh   = new THREE.InstancedMesh(spitGeo, spitMat, SPITS)
    spitMesh.frustumCulled = false
    aumGroup.add(spitMesh)
    const spitStarts  = Array.from({ length: SPITS }, () => randomOnSphere(RADIUS * 0.95))
    const spitEnds    = Array.from({ length: SPITS }, () => randomOnSphere(RADIUS * 1.15))
    const spitOffsets = Array.from({ length: SPITS }, () => Math.random() * 20)
    const spitCycles  = Array.from({ length: SPITS }, () => 4 + Math.random() * 6)

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.02))
    const lightData: [number, number, number, number, number, number][] = [
      [0, 3, 4, 0.6, 0xFF6B00, 15],
      [-3, -2, 2, 0.35, 0xCC6600, 12],
      [2, 1, -3, 0.25, 0xBB4400, 10],
      [0, -3, 0, 0.15, 0x882020, 8],
    ]
    lightData.forEach(([x, y, z, intensity, color, distance]) => {
      const l = new THREE.PointLight(color, intensity, distance); l.position.set(x, y, z); scene.add(l)
    })

    // Animation loop
    const dummy   = new THREE.Object3D()
    const tmpVec  = new THREE.Vector3()
    let lerpTiltX = 0, lerpTiltY = 0, autoRotY = 0, lastTs = 0
    let rafId = 0

    function animate(ts: number) {
      rafId = requestAnimationFrame(animate)
      const t     = ts * 0.001
      const delta = Math.min(t - lastTs, 0.05)
      lastTs = t

      strandMats.forEach((m, i) => { m.uniforms.uTime.value = t + i * 0.09 })

      for (let i = 0; i < ORBS; i++) {
        const angle  = t * orbSpeeds[i]
        const orbitR = 0.06 + Math.sin(t * 0.5 + i) * 0.03
        tmpVec.set(Math.cos(angle) * orbitR, Math.sin(angle * 1.3) * orbitR, Math.sin(angle) * orbitR)
        tmpVec.applyAxisAngle(orbAxes[i], angle * 0.5)
        dummy.position.copy(orbOrigins[i]).add(tmpVec)
        dummy.scale.setScalar(orbScales[i] * (1 + Math.sin(t * 3.5 + i * 0.61) * 0.3) * (0.85 + Math.random() * 0.3))
        dummy.updateMatrix(); orbMesh.setMatrixAt(i, dummy.matrix)
      }
      orbMesh.instanceMatrix.needsUpdate = true

      for (let i = 0; i < WISPS; i++) {
        const life  = wispLifetimes[i]
        const phase = ((t * wispBurstSpeeds[i] + i * 0.37) % life) / life
        const jit   = wispJitter[i]
        dummy.position.copy(wispStarts[i]).addScaledVector(wispDrifts[i], phase)
        dummy.position.x += Math.sin(t * jit.freq + jit.phase) * jit.amp * (1 - phase)
        dummy.position.z += Math.cos(t * jit.freq * 0.7 + jit.phase) * jit.amp * (1 - phase)
        const fade = phase < 0.15 ? phase / 0.15 : phase > 0.7 ? (1 - phase) / 0.3 : 1
        dummy.scale.setScalar(0.012 * fade * (0.6 + Math.random() * 0.4))
        dummy.updateMatrix(); wispMesh.setMatrixAt(i, dummy.matrix)
      }
      wispMesh.instanceMatrix.needsUpdate = true

      for (let i = 0; i < SPITS; i++) {
        const cyclePhase = ((t + spitOffsets[i]) % spitCycles[i]) / spitCycles[i]
        if (cyclePhase > 0.85) {
          const ap = (cyclePhase - 0.85) / 0.15
          dummy.position.lerpVectors(spitStarts[i], spitEnds[i], ap)
          dummy.scale.setScalar(0.025 * Math.sin(ap * Math.PI))
        } else {
          dummy.position.set(0, -100, 0); dummy.scale.setScalar(0)
        }
        dummy.updateMatrix(); spitMesh.setMatrixAt(i, dummy.matrix)
      }
      spitMesh.instanceMatrix.needsUpdate = true

      autoRotY += delta * 0.09
      lerpTiltX = lerp(lerpTiltX, mouseY * 0.25, delta * 2.5)
      lerpTiltY = lerp(lerpTiltY, mouseX * 0.25, delta * 2.5)
      aumGroup.rotation.y = autoRotY + manualRotY + lerpTiltY
      aumGroup.rotation.x = manualRotX + lerpTiltX
      aumGroup.scale.setScalar(1 + Math.sin(t * 0.5) * 0.03)
      camera.position.z = lerp(camera.position.z, targetZ, delta * 4)
      renderer.render(scene, camera)
    }

    const startT = setTimeout(() => requestAnimationFrame(animate), 1500)

    return () => {
      clearTimeout(startT)
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize',   onResize)
      document.removeEventListener('mousemove',   onMouseMove)
      document.removeEventListener('mousedown',   onMouseDown)
      document.removeEventListener('mouseup',     onMouseUp)
      window.removeEventListener('wheel',         onWheel)
      document.removeEventListener('touchstart',  onTouchStart)
      document.removeEventListener('touchmove',   onTouchMove)
      strandGeos.forEach(g => g.dispose()); strandMats.forEach(m => m.dispose())
      orbGeo.dispose(); orbMat.dispose()
      wispGeo.dispose(); wispMat.dispose()
      spitGeo.dispose(); spitMat.dispose()
      renderer.dispose()
    }
  }, [])

  return (
    <div style={{ background: '#0B0F14', overflow: 'hidden', width: '100%', height: '100dvh' }}>
      {/* eslint-disable-next-line react/no-danger */}
      <style dangerouslySetInnerHTML={{ __html: CSS_STYLES }} />

      {/* Loader */}
      <div
        ref={loaderRef}
        style={{ position: 'fixed', inset: 0, background: '#0B0F14', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, transition: 'opacity 1s ease' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div className="aum-loader-text">initializing aum</div>
          <div style={{ width: 120, height: 1, background: 'rgba(212,85,0,0.12)', overflow: 'hidden' }}>
            <div ref={loaderBarRef} style={{ height: 1, width: '0%', background: 'rgba(212,85,0,0.5)', transition: 'width 1.2s ease' }} />
          </div>
        </div>
      </div>

      {/* Three.js canvas */}
      <canvas ref={canvasRef} style={{ display: 'block', position: 'fixed', inset: 0, width: '100%', height: '100%' }} />

      {/* Vignette */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 4, background: 'radial-gradient(ellipse 65% 65% at 50% 50%, transparent 30%, rgba(11,15,20,0.92) 100%)' }} />

      {/* Scanlines */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 5, background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.025) 2px, rgba(0,0,0,0.025) 4px)' }} />

      {/* Corner brackets */}
      <div style={{ position: 'fixed', top: 22, left: 22,  width: 28, height: 28, pointerEvents: 'none', zIndex: 11, opacity: 0.18, borderTop:    '1px solid #D45500', borderLeft:  '1px solid #D45500' }} />
      <div style={{ position: 'fixed', top: 22, right: 22, width: 28, height: 28, pointerEvents: 'none', zIndex: 11, opacity: 0.18, borderTop:    '1px solid #D45500', borderRight: '1px solid #D45500' }} />
      <div style={{ position: 'fixed', bottom: 22, left: 22,  width: 28, height: 28, pointerEvents: 'none', zIndex: 11, opacity: 0.18, borderBottom: '1px solid #D45500', borderLeft:  '1px solid #D45500' }} />
      <div style={{ position: 'fixed', bottom: 22, right: 22, width: 28, height: 28, pointerEvents: 'none', zIndex: 11, opacity: 0.18, borderBottom: '1px solid #D45500', borderRight: '1px solid #D45500' }} />

      {/* UI layer */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', padding: '32px 38px' }}>
        {/* Top bar */}
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="aum-mono"><span className="aum-pulse-dot" />NoctVox · ACS</div>
          <div ref={modeTokenRef} className="aum-mode-token">H4 · HEART · VENUS · TAURUS</div>
        </div>

        {/* Ghost AUM glyph */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
          <div className="aum-glyph">AUM</div>
          <div className="aum-tagline">Conscience System · Always Active</div>
        </div>

        {/* Bottom bar */}
        <div style={{ width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div className="aum-mono">Love Loop · Active</div>
          <div className="aum-mono">scroll — zoom · drag — tilt</div>
        </div>
      </div>
    </div>
  )
}
