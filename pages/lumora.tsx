import Head from 'next/head'

export default function LumoraPage() {
  return (
    <>
      <Head>
        <title>Lumora — NoctVox</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#020408" />
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          html, body { width: 100%; height: 100%; overflow: hidden; background: #020408; }
          iframe { display: block; width: 100%; height: 100%; border: none; }
        `}</style>
      </Head>
      <iframe src="/lumora.html" title="Lumora — Female Android" />
    </>
  )
}
