"use client"

import { signIn } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}

function LoginForm() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  const errorMessage =
    error === "AccessDenied"
      ? "Acesso negado. Sua conta não está autorizada a acessar este sistema."
      : error
      ? "Ocorreu um erro ao tentar fazer login. Tente novamente."
      : null

  return (
    <div className="w-full max-w-sm space-y-8">
      {/* Mobile logo */}
      <div className="lg:hidden flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-sm">C</span>
        </div>
        <span className="font-bold text-xl tracking-widest uppercase text-foreground">Coilab</span>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Bem-vindo de volta</h1>
        <p className="text-muted-foreground text-sm">
          Acesse o sistema com sua conta Google institucional
        </p>
      </div>

      {errorMessage && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <Button
        variant="outline"
        className="w-full gap-3 h-11"
        onClick={() => signIn("cognito", { callbackUrl: "/" })}
      >
        <GoogleIcon />
        Entrar com Google
      </Button>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="flex h-svh w-full overflow-hidden">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-[45%] bg-primary relative overflow-hidden flex-col items-center justify-center p-16">
        <div className="absolute top-0 right-0 w-120 h-120 rounded-full bg-white/10 translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-black/15 -translate-x-1/3 translate-y-1/3" />
        <div className="absolute bottom-24 right-32 w-28 h-28 rounded-full border border-white/20" />
        <div className="absolute top-32 left-24 w-14 h-14 rounded-full bg-white/10" />
        <div className="absolute top-1/2 right-16 w-4 h-4 rounded-full bg-white/30" />

        <div className="relative z-10 flex flex-col gap-6 max-w-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <span className="text-primary-foreground font-bold text-lg tracking-tight">C</span>
            </div>
            <span className="text-primary-foreground font-bold text-2xl tracking-widest uppercase">
              Coilab
            </span>
          </div>

          <div className="flex flex-col gap-3 mt-4">
            <h2 className="text-primary-foreground text-4xl font-bold leading-tight">
              Gerencie projetos<br />com clareza.
            </h2>
            <p className="text-primary-foreground/60 text-base leading-relaxed">
              Organize tarefas, acompanhe projetos e colabore com sua equipe em um só lugar.
            </p>
          </div>

          <div className="flex gap-2 mt-4">
            <div className="h-1 w-8 rounded-full bg-white/80" />
            <div className="h-1 w-4 rounded-full bg-white/30" />
            <div className="h-1 w-4 rounded-full bg-white/30" />
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 bg-background">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
