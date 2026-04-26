"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import AdminGuard from "../../components/AdminGuard"

export default function RegistrosPage() {
  const [aba, setAba] =
    useState("alunos")

  const [dados, setDados] =
    useState<any[]>([])

  const [loading, setLoading] =
    useState(false)

  const [busca, setBusca] =
    useState("")

  useEffect(() => {
    carregar()
  }, [aba])

  const carregar =
    async () => {
      setLoading(true)

      /* ALUNOS */
      if (aba === "alunos") {
        const { data } =
          await supabase
            .from("alunos")
            .select("*")
            .order("nome")

        setDados(data || [])
        setLoading(false)
        return
      }

      /* MENSALIDADES */
      if (
        aba ===
        "mensalidades"
      ) {
        const { data } =
          await supabase
            .from(
              "mensalidades"
            )
            .select("*")
            .order(
              "vencimento",
              {
                ascending: false,
              }
            )

        setDados(data || [])
        setLoading(false)
        return
      }

      /* VENDAS */
      if (aba === "vendas") {
        const { data } =
          await supabase
            .from("caixa")
            .select("*")
            .eq("tipo", "venda")
            .order("data", {
              ascending: false,
            })

        setDados(data || [])
        setLoading(false)
        return
      }

      setLoading(false)
    }

  const excluirVenda =
    async (
      id: string
    ) => {
      if (
        !confirm(
          "Apagar venda?"
        )
      )
        return

      await supabase
        .from("caixa")
        .delete()
        .eq("id", id)

      carregar()
    }

  const dadosFiltrados =
    dados.filter(
      (item) => {
        const texto =
          (
            item.nome ||
            item.aluno ||
            ""
          )
            .toLowerCase()

        return texto.includes(
          busca.toLowerCase()
        )
      }
    )

  return (
    <AdminGuard>
      <div className="p-4 max-w-7xl mx-auto">

        <h1 className="text-2xl font-bold mb-6">
          Central de
          Registros
        </h1>

        {/* ABAS */}
        <div className="flex gap-2 flex-wrap mb-6">

          <button
            className={`tab ${
              aba ===
              "alunos"
                ? "ativo"
                : ""
            }`}
            onClick={() =>
              setAba(
                "alunos"
              )
            }
          >
            Alunos
          </button>

          <button
            className={`tab ${
              aba ===
              "mensalidades"
                ? "ativo"
                : ""
            }`}
            onClick={() =>
              setAba(
                "mensalidades"
              )
            }
          >
            Mensalidades
          </button>

          <button
            className={`tab ${
              aba ===
              "vendas"
                ? "ativo"
                : ""
            }`}
            onClick={() =>
              setAba(
                "vendas"
              )
            }
          >
            Vendas
          </button>

        </div>

        {/* BUSCA */}
        <input
          className="input mb-6"
          placeholder="Buscar..."
          value={busca}
          onChange={(
            e
          ) =>
            setBusca(
              e.target
                .value
            )
          }
        />

        {/* CONTEUDO */}
        <div className="bg-white rounded-2xl shadow overflow-auto">

          {loading ? (
            <div className="p-6 text-black">
              Carregando...
            </div>
          ) : aba ===
            "alunos" ? (
            <table className="w-full text-black">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-4 text-left">
                    Nome
                  </th>
                  <th className="p-4 text-left">
                    Status
                  </th>
                  <th className="p-4 text-left">
                    Modalidade
                  </th>
                  <th className="p-4 text-left">
                    Turma
                  </th>
                  <th className="p-4 text-left">
                    Ações
                  </th>
                </tr>
              </thead>

              <tbody>
                {dadosFiltrados.map(
                  (
                    item,
                    i
                  ) => (
                    <tr
                      key={i}
                      className="border-t"
                    >
                      <td className="p-4">
                        {
                          item.nome
                        }
                      </td>

                      <td className="p-4 capitalize">
                        {item.status ||
                          "ativo"}
                      </td>

                      <td className="p-4">
                        {item.modalidade ||
                          "-"}
                      </td>

                      <td className="p-4">
                        {item.turma ||
                          "-"}
                      </td>

                      <td className="p-4">
                        <a
                          href={`/registros/aluno/${item.id}`}
                          className="mini azul"
                        >
                          Editar
                        </a>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          ) : aba ===
            "mensalidades" ? (
            <table className="w-full text-black">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-4 text-left">
                    Aluno
                  </th>
                  <th className="p-4 text-left">
                    Valor
                  </th>
                  <th className="p-4 text-left">
                    Vencimento
                  </th>
                  <th className="p-4 text-left">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {dadosFiltrados.map(
                  (
                    item,
                    i
                  ) => (
                    <tr
                      key={i}
                      className="border-t"
                    >
                      <td className="p-4">
                        {item.nome ||
                          item.aluno}
                      </td>

                      <td className="p-4">
                        R${" "}
                        {Number(
                          item.valor ||
                            0
                        ).toFixed(
                          2
                        )}
                      </td>

                      <td className="p-4">
                        {new Date(
                          item.vencimento
                        ).toLocaleDateString()}
                      </td>

                      <td className="p-4 capitalize">
                        {
                          item.status
                        }
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-black">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-4 text-left">
                    Data
                  </th>
                  <th className="p-4 text-left">
                    Produto(s)
                  </th>
                  <th className="p-4 text-left">
                    Pagamento
                  </th>
                  <th className="p-4 text-left">
                    Valor
                  </th>
                  <th className="p-4 text-left">
                    Ações
                  </th>
                </tr>
              </thead>

              <tbody>
                {dadosFiltrados.map(
                  (
                    item,
                    i
                  ) => (
                    <tr
                      key={i}
                      className="border-t"
                    >
                      <td className="p-4">
                        {new Date(
                          item.created_at ||
                            item.data
                        ).toLocaleDateString()}
                      </td>

                      <td className="p-4">
                        {
                          item.nome
                        }
                      </td>

                      <td className="p-4">
                        {item.forma_pagamento ||
                          "-"}
                      </td>

                      <td className="p-4 font-bold">
                        R${" "}
                        {Number(
                          item.valor ||
                            0
                        ).toFixed(
                          2
                        )}
                      </td>

                      <td className="p-4">
                        <button
                          onClick={() =>
                            excluirVenda(
                              item.id
                            )
                          }
                          className="mini vermelho"
                        >
                          Apagar
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          )}

        </div>

        <style jsx>{`
          .input {
            width: 100%;
            padding: 14px;
            border: 1px solid #ccc;
            border-radius: 10px;
            background: white;
          }

          .tab {
            background: white;
            color: black;
            padding: 10px 16px;
            border-radius: 10px;
            border: 1px solid #ddd;
          }

          .ativo {
            background: red;
            color: white;
            border-color: red;
          }

          .mini {
            color: white;
            padding: 8px 12px;
            border-radius: 8px;
            font-size: 13px;
          }

          .azul {
            background: #2563eb;
          }

          .vermelho {
            background: #dc2626;
          }
        `}</style>

      </div>
    </AdminGuard>
  )
}