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
      if (
        senha ===
        "170296@CTOk"
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
            className="input"
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
            className="btn mt-3 w-full"
          >
            Entrar
          </button>

          {erro && (
            <p className="text-red-500 mt-3 text-center">
              {erro}
            </p>
          )}

          <style jsx>{`
            .input {
              width: 100%;
              padding: 12px;
              border: 1px solid #ccc;
              border-radius: 10px;
            }

            .btn {
              background: red;
              color: white;
              padding: 12px;
              border-radius: 10px;
            }
          `}</style>

        </div>

      </div>
    )
  }

  return (
    <>
      {/* TOPO ADMIN */}
      <div className="p-3 flex justify-between items-center border-b border-zinc-800 mb-3">

        <div className="text-sm text-zinc-400">
          Área Administrativa Liberada
        </div>

        <button
          onClick={sair}
          className="bg-red-600 text-white px-4 py-2 rounded-lg"
        >
          Sair
        </button>

      </div>

      {children}
    </>
  )
}