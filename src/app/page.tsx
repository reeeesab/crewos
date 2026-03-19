import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function RootPage() {
  const { userId } = await auth()

  if (userId) {
    redirect('/portfolio')
  }

  // If not signed in, the middleware will handle redirect to sign-in
  // since "/" is no longer a public route.
  return null
}
