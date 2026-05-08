"use client"

import { useEffect } from "react"
import { SessionProvider as NextAuthSessionProvider, useSession, signIn } from "next-auth/react"

function SessionErrorHandler() {
  const { data: session } = useSession()

  useEffect(() => {
    if ((session as any)?.error === "RefreshAccessTokenError") {
      signIn("cognito")
    }
  }, [session])

  return null
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider>
      <SessionErrorHandler />
      {children}
    </NextAuthSessionProvider>
  )
}
