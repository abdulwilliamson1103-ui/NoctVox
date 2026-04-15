// AumOrb.tsx — Standalone Aum Entity Visual
// Drop into Lovable as-is. No backend required.
//
// In Lovable: add packages →  three  @react-three/fiber  @react-three/drei  @react-three/postprocessing
// Then in App.tsx:            import AumOrb from './AumOrb'
//                             export default function App() { return <AumOrb /> }

import { useRef, useMemo, useEffect, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { AdaptiveDpr, AdaptiveEvents } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'

// ─── Fire palette (the Aum entity itself) ─────────────────────────────────────
const FIRE = {
  deep:   new THREE.Color('#7A0F00'),
  hot:    new THREE.Color('#D43500'),
  bright: new THREE.Color('#FFB300'),
  core:   new THREE.Color('#FFE066'),
}

// ─── Config ───────────────────────────────────────────────────────────────────
const STRANDS  = 90   // tube strands forming the sphere
const ORBS     = 320  // glowing ember nodes
const RADIUS   = 2.5  // sphere size

// ─── Helpers ──────────────────────────────────────────────────────────────────
function randomOnSphere(r: number) {
  const theta = Math.random() * Math.PI * 2
  const phi   = Math.acos(2 * Math.random() - 1)
  return new THREE.Vector3(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  )
}

function sphereArc(a: THREE.Vector3, b: THREE.Vector3, n: number, r: number) {
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n
    const p = new THREE.Vector3().copy(a).lerp(b, t).normalize()
    return p.multiplyScalar(r * (1 + Math.sin(t * Math.PI) * 0.18))
  })
}

// ─── GLSL Fire Shader ─────────────────────────────────────────────────────────
const VERT = `
  varying vec2 vUv;
  varying vec3 vWorldPos;
  void main() {
    vUv = uv;
    vWorldPos = (modelMatrix * vec4(position,1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
  }
`
const FRAG = `
  uniform float uTime;
  uniform vec3 uA, uB, uC;
  varying vec2 vUv;
  varying vec3 vWorldPos;
  float hash(vec3 p){ return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453); }
  float noise(vec3 p){
    vec3 i=floor(p),f=fract(p); f=f*f*(3.-2.*f);
    return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
               mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
  }
  void main(){
    float n     = noise(vWorldPos*3.5 + uTime*0.35);
    float pulse = sin(vUv.x*6.2832 + uTime*1.8)*0.5+0.5;
    float t     = clamp(n*0.55+pulse*0.45, 0., 1.);
    vec3  col   = t<0.5 ? mix(uA,uB,t*2.) : mix(uB,uC,(t-.5)*2.);
    float fade  = smoothstep(0.,.08,vUv.x)*smoothstep(1.,.92,vUv.x);
    gl_FragColor = vec4(col, (0.7+n*0.3)*(0.3+fade*0.7));
  }
`

// ─── Strands ──────────────────────────────────────────────────────────────────
function Strands() {
  const matsRef = useRef<THREE.ShaderMaterial[]>([])

  const { geos, mats } = useMemo(() => {
    const geos: THREE.TubeGeometry[]   = []
    const mats: THREE.ShaderMaterial[] = []
    for (let i = 0; i < STRANDS; i++) {
      const pts = sphereArc(randomOnSphere(RADIUS), randomOnSphere(RADIUS), 64, RADIUS)
      geos.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 64,
        0.006 + Math.random() * 0.024, Math.random() > 0.6 ? 5 : 3, false))
      mats.push(new THREE.ShaderMaterial({
        vertexShader: VERT, fragmentShader: FRAG,
        transparent: true, side: THREE.DoubleSide,
        uniforms: { uTime:{value:0}, uA:{value:FIRE.deep}, uB:{value:FIRE.hot}, uC:{value:FIRE.bright} },
      }))
    }
    return { geos, mats }
  }, [])

  useEffect(() => {
    matsRef.current = mats
    return () => { geos.forEach(g=>g.dispose()); mats.forEach(m=>m.dispose()) }
  }, [geos, mats])

  const timeRef = useRef(0)
  useFrame((_,delta) => {
    timeRef.current += delta
    matsRef.current.forEach((m,i) => { m.uniforms.uTime.value = timeRef.current + i*0.07 })
  })

  return <>{geos.map((g,i) => <mesh key={i} geometry={g} material={mats[i]} />)}</>
}

// ─── Orbs (Instanced — 1 draw call) ──────────────────────────────────────────
function Orbs() {
  const ref   = useRef<THREE.InstancedMesh>(null!)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const { pos, scales } = useMemo(() => ({
    pos:    Array.from({ length: ORBS }, () => randomOnSphere(RADIUS * (0.9 + Math.random()*0.25))),
    scales: Array.from({ length: ORBS }, () => 0.01 + Math.random()*0.028),
  }), [])

  useEffect(() => {
    pos.forEach((p,i) => {
      dummy.position.copy(p); dummy.scale.setScalar(scales[i]); dummy.updateMatrix()
      ref.current.setMatrixAt(i, dummy.matrix)
    })
    ref.current.instanceMatrix.needsUpdate = true
  }, [pos, scales, dummy])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    pos.forEach((p,i) => {
      dummy.position.copy(p)
      dummy.scale.setScalar(scales[i] * (1 + Math.sin(t*2.2 + i*0.41)*0.35))
      dummy.updateMatrix()
      ref.current.setMatrixAt(i, dummy.matrix)
    })
    ref.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, ORBS]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshStandardMaterial color={FIRE.core} emissive={FIRE.bright} emissiveIntensity={3.5} toneMapped={false} />
    </instancedMesh>
  )
}

// ─── Rotating Group ───────────────────────────────────────────────────────────
function AumEntity() {
  const ref = useRef<THREE.Group>(null!)
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    ref.current.rotation.y = t * 0.07
    ref.current.scale.setScalar(1 + Math.sin(t * 0.4) * 0.025)
  })
  return <group ref={ref}><Strands /><Orbs /></group>
}

// ─── Scene ────────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <>
      <ambientLight intensity={0.15} />
      <pointLight position={[0,0,0]}  intensity={4}   color={FIRE.bright.getHex()} distance={9} />
      <pointLight position={[5,3,2]}  intensity={1.8} color="#FF5500" distance={12} />
      <pointLight position={[-4,-2,-3]} intensity={1.2} color="#8B1A00" distance={10} />
      <AumEntity />
      <EffectComposer>
        <Bloom intensity={2.2} luminanceThreshold={0.3} luminanceSmoothing={0.85} mipmapBlur radius={0.6} />
      </EffectComposer>
      <AdaptiveDpr pixelated />
      <AdaptiveEvents />
    </>
  )
}

// ─── Export ───────────────────────────────────────────────────────────────────
export default function AumOrb() {
  return (
    <div style={{ width: '100vw', height: '100dvh', background: '#0B0F14', position: 'relative' }}>
      {/* Wordmark */}
      <div style={{
        position: 'absolute', top: 20, right: 20,
        fontFamily: 'monospace', fontSize: 11, letterSpacing: '0.4em',
        color: '#3DF2E0', pointerEvents: 'none', zIndex: 10,
      }}>AUM</div>

      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1,
        background: 'radial-gradient(ellipse 70% 70% at 50% 50%, transparent 20%, #0B0F14B0 75%, #0B0F14 100%)',
      }} />

      <Canvas dpr={[1,2]} camera={{ position:[0,0,7], fov:48 }}
        gl={{ antialias:true, alpha:true, powerPreference:'high-performance' }}
        style={{ background:'transparent' }}>
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  )
}
