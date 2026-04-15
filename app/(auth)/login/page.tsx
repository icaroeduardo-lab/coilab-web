"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

const formSchema = z.object({
  email: z.string().email({
    message: "O email deve ser um endereço de e-mail válido.",
  }),
  password: z.string().min(6, {
    message: "A senha deve ter pelo menos 6 caracteres.",
  }),
})

export default function LoginPage() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values)
  }

  return (
    <div className="flex h-svh w-full overflow-hidden">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-[45%] bg-primary relative overflow-hidden flex-col items-center justify-center p-16">
        {/* Geometric decorations */}
        <div className="absolute top-0 right-0 w-120 h-120 rounded-full bg-white/10 translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-black/15 -translate-x-1/3 translate-y-1/3" />
        <div className="absolute bottom-24 right-32 w-28 h-28 rounded-full border border-white/20" />
        <div className="absolute top-32 left-24 w-14 h-14 rounded-full bg-white/10" />
        <div className="absolute top-1/2 right-16 w-4 h-4 rounded-full bg-white/30" />

        {/* Content */}
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
              Insira seus dados para acessar o sistema
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="voce@exemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>Senha</FormLabel>
                      <Link
                        href="/forgot-password"
                        className="text-xs text-primary underline-offset-4 hover:underline"
                      >
                        Esqueceu a senha?
                      </Link>
                    </div>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full mt-2">
                Entrar
              </Button>
            </form>
          </Form>

          <p className="text-center text-sm text-muted-foreground">
            Não tem uma conta?{" "}
            <Link
              href="/register"
              className="text-primary font-medium underline-offset-4 hover:underline"
            >
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
