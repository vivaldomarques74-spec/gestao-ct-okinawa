"use client"
import { useEffect, useState } from "react"

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const [liberado, setLiberado] = useState(false)
  const [senha, setSenha] = useState("")
  const [erro, setErro] = useState("")

  useEffect(() => {
    const acesso = localStorage.getItem("admin_ok")
    if (acesso === "true") setLiberado(true)
  }, [])

  const entrar = () => {
    if (senha === "170296@CTOk") {
      localStorage.setItem("admin_ok", "true")
      setLiberado(true)
      setErro("")
    } else {
      setErro("Senha inválida")
    }
  }

  const sair = () => {
    localStorage.removeItem("admin_ok")
    window.location.reload()
  }

  if (!liberado) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
          <h1 className="text-2xl font-bold mb-4">Área Administrativa</h1>
          <input
            type="password"
            placeholder="Digite a senha"
            className="w-full p-3 border rounded-lg mb-3"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && entrar()}
          />
          <button onClick={entrar} className="w-full bg-red-600 text-white p-3 rounded-lg">
            Entrar
          </button>
          {erro && <p className="text-red-500 mt-3 text-center">{erro}</p>}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="p-3 flex justify-between items-center border-b bg-white">
        <span className="text-sm text-gray-500">Administrador</span>
        <button onClick={sair} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm">
          Sair
        </button>
      </div>
      {children}
    </>
  )
}