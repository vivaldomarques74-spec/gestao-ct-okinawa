"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"

type UserRole = "secretaria" | "admin" | "diretoria" | null

const CREDENCIAIS: Record<string, UserRole> = {
  "2006": "secretaria",
  "2060": "admin",
  "1702": "diretoria"
}

export default function LoginGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [autorizado, setAutorizado] = useState<boolean | null>(null)
  const [senha, setSenha] = useState("")
  const [erro, setErro] = useState("")

  // Rotas públicas que não exigem login
  const rotasPublicas = ["/presenca", "/parceiros/dashboard"]
  const isRotaPublica = rotasPublicas.some(rota => pathname?.startsWith(rota))

  useEffect(() => {
    if (isRotaPublica) {
      setAutorizado(true)
      return
    }
    const sessao = sessionStorage.getItem("auth_role")
    if (sessao) {
      setAutorizado(true)
    } else {
      setAutorizado(false)
    }
  }, [isRotaPublica, pathname])

  const fazerLogin = () => {
    const role = CREDENCIAIS[senha]
    if (role) {
      sessionStorage.setItem("auth_role", role)
      sessionStorage.setItem("auth_senha", senha) // opcional
      setAutorizado(true)
      setErro("")
    } else {
      setErro("Senha inválida")
    }
  }

  if (autorizado === null) return <div className="p-6 text-center">Carregando...</div>
  if (autorizado) return <>{children}</>

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-red-600 mb-2">CT OKINAWA</h1>
        <p className="text-center text-gray-500 mb-6">Acesso restrito</p>
        <input
          type="password"
          placeholder="Digite sua senha"
          className="w-full p-3 border rounded-lg mb-3"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fazerLogin()}
        />
        <button
          onClick={fazerLogin}
          className="w-full bg-red-600 text-white p-3 rounded-lg hover:bg-red-700"
        >
          Entrar
        </button>
        {erro && <p className="text-red-500 text-sm mt-3 text-center">{erro}</p>}
      </div>
    </div>
  )
}