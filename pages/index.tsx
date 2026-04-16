import Head from 'next/head'

export default function Home() {
  return (
    <>
      <Head>
        <title>NoctVox</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#0B0F14" />
        <meta name="description" content="NoctVox — Aum Routing Engine" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='45' fill='%230B0F14' stroke='%233DF2E0' stroke-width='4'/><circle cx='50' cy='50' r='20' fill='%233DF2E0' opacity='0.8'/></svg>" />
        <style>{`
          *{margin:0;padding:0;box-sizing:border-box}
          html,body{width:100%;height:100%;overflow:hidden;background:#0B0F14}
          iframe{display:block;width:100%;height:100%;border:none}
        `}</style>
      </Head>
      <iframe src="/sphere.html" title="Aum" />
    </>
  )
}
