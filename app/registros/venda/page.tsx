"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from "../../../lib/supabase"
import AdminGuard from "../../../components/AdminGuard"

export default function RegistrosVendaPage() {
  const [loading, setLoading] =
    useState(false)

  const [vendas, setVendas] =
    useState<any[]>([])

  const [busca, setBusca] =
    useState("")

  const [inicio, setInicio] =
    useState("")

  const [fim, setFim] =
    useState("")

  const [formaPagamento, setFormaPagamento] =
    useState("todos")

  useEffect(() => {
    carregar()
  }, [])

  const carregar =
    async () => {
      setLoading(true)

      const { data } =
        await supabase
          .from("caixa")
          .select("*")
          .eq("tipo", "venda")
          .order("data", {
            ascending: false,
          })

      setVendas(data || [])
      setLoading(false)
    }

  const apagar =
    async (
      id: string
    ) => {
      const ok =
        confirm(
          "Apagar venda?"
        )

      if (!ok)
        return

      await supabase
        .from("caixa")
        .delete()
        .eq("id", id)

      carregar()
    }

  const vendasFiltradas =
    useMemo(() => {
      return vendas.filter(
        (item) => {
          const nome =
            (
              item.nome ||
              ""
            ).toLowerCase()

          const textoOk =
            nome.includes(
              busca.toLowerCase()
            )

          const dataBase =
            item.created_at ||
            item.data

          const data =
            new Date(
              dataBase
            )

          let inicioOk =
            true

          let fimOk =
            true

          if (inicio) {
            inicioOk =
              data >=
              new Date(
                inicio
              )
          }

          if (fim) {
            const final =
              new Date(
                fim
              )

            final.setHours(
              23,
              59,
              59
            )

            fimOk =
              data <=
              final
          }

          let formaOk =
            true

          if (
            formaPagamento !==
            "todos"
          ) {
            formaOk =
              (
                item.forma_pagamento ||
                ""
              ) ===
              formaPagamento
          }

          return (
            textoOk &&
            inicioOk &&
            fimOk &&
            formaOk
          )
        }
      )
    }, [
      vendas,
      busca,
      inicio,
      fim,
      formaPagamento,
    ])

  const total =
    vendasFiltradas.reduce(
      (
        acc,
        item
      ) =>
        acc +
        Number(
          item.valor ||
            0
        ),
      0
    )

  return (
    <AdminGuard>
      <div className="p-4 max-w-7xl mx-auto">

        <h1 className="text-2xl font-bold mb-6">
          Registros de
          Vendas
        </h1>

        {/* FILTROS */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">

          <input
            className="input"
            placeholder="Buscar produto..."
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

          <input
            type="date"
            className="input"
            value={inicio}
            onChange={(
              e
            ) =>
              setInicio(
                e.target
                  .value
              )
            }
          />

          <input
            type="date"
            className="input"
            value={fim}
            onChange={(
              e
            ) =>
              setFim(
                e.target
                  .value
              )
            }
          />

          <select
            className="input"
            value={
              formaPagamento
            }
            onChange={(
              e
            ) =>
              setFormaPagamento(
                e.target
                  .value
              )
            }
          >
            <option value="todos">
              Todos pagamentos
            </option>

            <option value="Pix">
              Pix
            </option>

            <option value="Dinheiro">
              Dinheiro
            </option>

            <option value="Cartão">
              Cartão
            </option>
          </select>

        </div>

        {/* CARD */}
        <div className="card mb-6">
          <small>
            Total no filtro
          </small>

          <h2>
            R${" "}
            {total.toFixed(
              2
            )}
          </h2>
        </div>

        {/* TABELA */}
        <div className="bg-white rounded-2xl shadow overflow-auto">

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

              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-4"
                  >
                    Carregando...
                  </td>
                </tr>
              ) : vendasFiltradas.length ===
                0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-4"
                  >
                    Nenhuma venda encontrada
                  </td>
                </tr>
              ) : (
                vendasFiltradas.map(
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
                            apagar(
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
                )
              )}

            </tbody>

          </table>

        </div>

        <style jsx>{`
          .input {
            width: 100%;
            padding: 14px;
            border: 1px solid #ccc;
            border-radius: 10px;
            background: white;
          }

          .card {
            background: white;
            padding: 24px;
            border-radius: 18px;
            box-shadow: 0 2px 10px rgba(0,0,0,.08);
          }

          .card h2 {
            font-size: 2rem;
            font-weight: bold;
            margin-top: 10px;
          }

          .mini {
            color: white;
            padding: 8px 12px;
            border-radius: 8px;
            font-size: 13px;
          }

          .vermelho {
            background: #dc2626;
          }
        `}</style>

      </div>
    </AdminGuard>
  )
}