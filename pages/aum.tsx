// pages/aum.tsx — Aum Entity Interface
// Route: /aum
import dynamic from 'next/dynamic'
import Head from 'next/head'

// Dynamic import with SSR disabled — Three.js / WebGL requires the browser DOM.
// next/dynamic + ssr:false is the correct pattern for any R3F component in Next.js.
const AumInterface = dynamic(
  () => import('../src/components/AumInterface'),
  { ssr: false, loading: () => (
    <div style={{ height: '100dvh', background: '#0B0F14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: '#3DF2E0', fontFamily: 'monospace', letterSpacing: '0.4em', fontSize: 11 }}>AUM</span>
    </div>
  )}
)

export default function AumPage() {
  return (
    <>
      <Head>
        <title>Aum — NoctVox Routing Engine</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#0B0F14" />
      </Head>
      <AumInterface />
    </>
  )
}
