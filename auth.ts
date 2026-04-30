import NextAuth from "next-auth"
import Cognito from "next-auth/providers/cognito"

export const { handlers, signIn, signOut, auth } = NextAuth({
  debug: true,
  trustHost: true,
  providers: [
    Cognito({
      clientId: process.env.COGNITO_CLIENT_ID!,
      clientSecret: process.env.COGNITO_CLIENT_SECRET!,
      issuer: process.env.COGNITO_ISSUER!,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account?.id_token ?? account?.access_token) {
        token.accessToken = account.id_token ?? account.access_token
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
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined
      session.user.id = (token.backendId ?? token.sub ?? "") as string
      if (token.backendImageUrl) {
        session.user.image = token.backendImageUrl
      }
      return session
    },
  },
})
