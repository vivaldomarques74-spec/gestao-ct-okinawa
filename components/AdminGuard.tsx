"use client"

import { useEffect, useState } from "react"

export default function AdminGuard({
  children,
}: {
  children: React.ReactNode
}) {
  const [liberado, setLiberado] =
    useState(false)

  const [senha, setSenha] =
    useState("")

  const [erro, setErro] =
    useState("")

  useEffect(() => {
    const acesso =
      localStorage.getItem(
        "admin_ok"
      )

    if (
      acesso === "true"
    ) {
      setLiberado(true)
    }
  }, [])

  const entrar =
    () => {
      // SENHA DO PAINEL ADMINISTRATIVO ALTERADA PARA 178248@CTOk
      if (
        senha ===
        "178248@CTOk"
      ) {
        localStorage.setItem(
          "admin_ok",
          "true"
        )

        setLiberado(
          true
        )

        setErro("")
      } else {
        setErro(
          "Senha inválida"
        )
      }
    }

  const sair =
    () => {
      localStorage.removeItem(
        "admin_ok"
      )

      window.location.reload()
    }

  if (!liberado) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">

        <div className="bg-white text-black p-6 rounded-2xl shadow w-full max-w-md">

          <h1 className="text-xl font-bold mb-4 text-center">
            Área Administrativa
          </h1>

          <input
            type="password"
            placeholder="Digite a senha"
            className="w-full p-3 border border-gray-300 rounded-xl mb-3"
            value={senha}
            onChange={(
              e
            ) =>
              setSenha(
                e.target
                  .value
              )
            }
            onKeyDown={(
              e
            ) => {
              if (
                e.key ===
                "Enter"
              ) {
                entrar()
              }
            }}
          />

          <button
            onClick={
              entrar
            }
            className="w-full bg-red-600 text-white p-3 rounded-xl font-semibold hover:bg-red-700 transition"
          >
            Entrar
          </button>

          {erro && (
            <p className="text-red-500 mt-3 text-center text-sm">
              {erro}
            </p>
          )}

        </div>

      </div>
    )
  }

  return (
    <>
      <div className="p-3 flex justify-between items-center border-b bg-gray-50 mb-3">
        <div className="text-sm text-gray-500">
          Área Administrativa Liberada
        </div>
        <button
          onClick={sair}
          className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm"
        >
          Sair do Admin
        </button>
      </div>
      {children}
    </>
  )
}