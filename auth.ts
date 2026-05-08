import NextAuth from "next-auth"
import Cognito from "next-auth/providers/cognito"

async function refreshCognitoToken(token: Record<string, unknown>): Promise<Record<string, unknown>> {
  const tokenEndpoint = token.tokenEndpoint as string
  const refreshToken = token.refreshToken as string

  const res = await fetch(tokenEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: process.env.COGNITO_CLIENT_ID!,
      client_secret: process.env.COGNITO_CLIENT_SECRET!,
      refresh_token: refreshToken,
    }),
  })

  const tokens = await res.json()
  if (!res.ok) throw new Error(tokens.error ?? "Token refresh failed")

  return {
    ...token,
    accessToken: tokens.id_token ?? tokens.access_token,
    expiresAt: Math.floor(Date.now() / 1000) + (tokens.expires_in as number),
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  debug: true,
  trustHost: true,
  providers: [
    Cognito({
      clientId: process.env.COGNITO_CLIENT_ID!,
      clientSecret: process.env.COGNITO_CLIENT_SECRET!,
      issuer: process.env.COGNITO_ISSUER!,
      authorization: { params: { identity_provider: "Google" } },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, account }) {
      // Initial sign-in — store tokens and metadata
      if (account) {
        token.accessToken = account.id_token ?? account.access_token
        token.refreshToken = account.refresh_token
        token.expiresAt = account.expires_at
        token.tokenEndpoint = account.token_endpoint

        try {
          const apiUrl = process.env.API_URL ?? "http://localhost:3001/api"
          const res = await fetch(`${apiUrl}/users/me`, {
            headers: { Authorization: `Bearer ${token.accessToken}` },
          })
          if (res.ok) {
            const user = await res.json()
            token.backendId = user.id
            token.backendImageUrl = user.imageUrl ?? null
          }
        } catch {
          // backend unreachable — proceed without enrichment
        }

        return token
      }

      // Token still valid (60s buffer before real expiry)
      const expiresAt = token.expiresAt as number | undefined
      if (expiresAt && Date.now() < expiresAt * 1000 - 60_000) {
        return token
      }

      // Token expired — refresh
      try {
        return await refreshCognitoToken(token as Record<string, unknown>) as typeof token
      } catch {
        return { ...token, error: "RefreshAccessTokenError" }
      }
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined
      session.user.id = (token.backendId ?? token.sub ?? "") as string
      if (token.backendImageUrl) {
        session.user.image = token.backendImageUrl
      }
      // Expose refresh error so client can redirect to login
      if (token.error) {
        (session as any).error = token.error
      }
      return session
    },
  },
})
