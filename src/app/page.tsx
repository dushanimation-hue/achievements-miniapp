'use client'

import dynamic from 'next/dynamic'

const HomeApp = dynamic(() => import('./HomeApp'), { ssr: false })

export default function Page() {
  return <HomeApp />
}
