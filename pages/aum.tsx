// pages/aum.tsx — Aum Entity Interface
// Route: /aum
import dynamic from 'next/dynamic'
import Head from 'next/head'

const AumInterface = dynamic(
  () => import('../src/components/AumInterface'),
  {
    ssr: false,
    loading: () => (
      <div style={{ height: '100dvh', background: '#0B0F14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#D45500', fontFamily: 'monospace', letterSpacing: '0.4em', fontSize: 11 }}>AUM</span>
      </div>
    ),
  }
)

export default function AumPage() {
  return (
    <>
      <Head>
        <title>Aum — NoctVox</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#0B0F14" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Cinzel:wght@300;400&display=swap" rel="stylesheet" />
      </Head>
      <AumInterface />
    </>
  )
}
