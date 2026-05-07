import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, SearchX } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex h-svh w-full overflow-hidden">
      {/* Left branding panel — same as login */}
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
              Página não<br />encontrada.
            </h2>
            <p className="text-primary-foreground/60 text-base leading-relaxed">
              O endereço que você tentou acessar não existe ou foi removido.
            </p>
          </div>

          <div className="flex gap-2 mt-4">
            <div className="h-1 w-8 rounded-full bg-white/80" />
            <div className="h-1 w-4 rounded-full bg-white/30" />
            <div className="h-1 w-4 rounded-full bg-white/30" />
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 bg-background gap-8">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">C</span>
          </div>
          <span className="font-bold text-xl tracking-widest uppercase text-foreground">Coilab</span>
        </div>

        <div className="flex flex-col items-center gap-6 max-w-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
            <SearchX className="w-8 h-8 text-muted-foreground" />
          </div>

          <div className="space-y-2">
            <p className="text-6xl font-bold tracking-tight text-primary">404</p>
            <p className="text-lg font-semibold text-foreground">Página não encontrada</p>
            <p className="text-sm text-muted-foreground">
              O recurso solicitado não existe ou foi removido.
            </p>
          </div>

          <div className="flex flex-col gap-3 w-full">
            <Button asChild className="w-full gap-2">
              <Link href="/">
                <ArrowLeft className="w-4 h-4" />
                Voltar para o início
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/tasks">Ver tarefas</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
