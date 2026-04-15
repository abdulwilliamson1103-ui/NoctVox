import Head from 'next/head'
import dynamic from 'next/dynamic'

// Aum is the homepage. Three.js requires browser — SSR disabled.
const AumInterface = dynamic(
  () => import('../src/components/AumInterface'),
  {
    ssr: false,
    loading: () => (
      <div style={{
        height: '100dvh',
        background: '#0B0F14',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <span style={{
          color: '#3DF2E0',
          fontFamily: 'monospace',
          letterSpacing: '0.4em',
          fontSize: 11,
        }}>
          AUM
        </span>
      </div>
    ),
  }
)

export default function Home() {
  return (
    <>
      <Head>
        <title>NoctVox</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#0B0F14" />
        <meta name="description" content="NoctVox — Aum Routing Engine" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='45' fill='%230B0F14' stroke='%233DF2E0' stroke-width='4'/><circle cx='50' cy='50' r='20' fill='%233DF2E0' opacity='0.8'/></svg>" />
      </Head>
      <AumInterface />
    </>
  )
}
