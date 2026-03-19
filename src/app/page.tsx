'use client'

import { useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import MarketingPage from './(marketing)/page'

export default function RootPage() {
  const { isSignedIn, isLoaded } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push('/portfolio')
    }
  }, [isLoaded, isSignedIn, router])

  // Show marketing page while checking auth status, or if not signed in
  return <MarketingPage />
}
