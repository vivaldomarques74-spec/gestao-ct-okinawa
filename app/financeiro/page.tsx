"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from "../../lib/supabase"
import AdminGuard from "../../components/AdminGuard"

export default function FinanceiroPage() {
  const [loading, setLoading] =
    useState(false)

  const [registros, setRegistros] =
    useState<any[]>([])

  const [periodo, setPeriodo] =
    useState("hoje")

  const [tipoFiltro, setTipoFiltro] =
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
          .order("data", {
            ascending: false,
          })

      setRegistros(
        data || []
      )

      setLoading(false)
    }

  const registrosFiltrados =
    useMemo(() => {
      const hoje =
        new Date()

      hoje.setHours(
        0,
        0,
        0,
        0
      )

      return registros.filter(
        (r) => {
          const baseData =
            r.created_at ||
            r.data

          const data =
            new Date(
              baseData
            )

          const dia =
            new Date(
              data
            )

          dia.setHours(
            0,
            0,
            0,
            0
          )

          const diff =
            Math.floor(
              (hoje.getTime() -
                dia.getTime()) /
                (1000 *
                  60 *
                  60 *
                  24)
            )

          let periodoOk =
            true

          if (
            periodo ===
            "hoje"
          )
            periodoOk =
              diff ===
              0

          if (
            periodo ===
            "7dias"
          )
            periodoOk =
              diff <=
              7

          if (
            periodo ===
            "30dias"
          )
            periodoOk =
              diff <=
              30

          if (
            periodo ===
            "mes"
          ) {
            periodoOk =
              data.getMonth() ===
                hoje.getMonth() &&
              data.getFullYear() ===
                hoje.getFullYear()
          }

          let tipoOk =
            true

          if (
            tipoFiltro !==
            "todos"
          ) {
            tipoOk =
              r.tipo ===
              tipoFiltro
          }

          return (
            periodoOk &&
            tipoOk
          )
        }
      )
    }, [
      registros,
      periodo,
      tipoFiltro,
    ])

  const total =
    registrosFiltrados.reduce(
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

  const matriculas =
    registrosFiltrados
      .filter(
        (i) =>
          i.tipo ===
          "matricula"
      )
      .reduce(
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

  const mensalidades =
    registrosFiltrados
      .filter(
        (i) =>
          i.tipo ===
          "mensalidade"
      )
      .reduce(
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

  const vendas =
    registrosFiltrados
      .filter(
        (i) =>
          i.tipo ===
          "venda"
      )
      .reduce(
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
          Painel
          Financeiro
        </h1>

        {/* FILTROS */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">

          <select
            className="input"
            value={
              periodo
            }
            onChange={(
              e
            ) =>
              setPeriodo(
                e.target
                  .value
              )
            }
          >
            <option value="hoje">
              Hoje
            </option>

            <option value="7dias">
              Últimos 7 dias
            </option>

            <option value="30dias">
              Últimos 30 dias
            </option>

            <option value="mes">
              Este mês
            </option>

            <option value="todos">
              Todos
            </option>
          </select>

          <select
            className="input"
            value={
              tipoFiltro
            }
            onChange={(
              e
            ) =>
              setTipoFiltro(
                e.target
                  .value
              )
            }
          >
            <option value="todos">
              Todos
            </option>

            <option value="matricula">
              Matrículas
            </option>

            <option value="mensalidade">
              Mensalidades
            </option>

            <option value="venda">
              PDV
            </option>
          </select>

        </div>

        {/* CARDS */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">

          <div className="card">
            <small>
              💰 Total
            </small>
            <h2>
              R${" "}
              {total.toFixed(
                2
              )}
            </h2>
          </div>

          <div className="card">
            <small>
              🎓 Matrículas
            </small>
            <h2>
              R${" "}
              {matriculas.toFixed(
                2
              )}
            </h2>
          </div>

          <div className="card">
            <small>
              🏦 Mensalidades
            </small>
            <h2>
              R${" "}
              {mensalidades.toFixed(
                2
              )}
            </h2>
          </div>

          <div className="card">
            <small>
              🛒 PDV
            </small>
            <h2>
              R${" "}
              {vendas.toFixed(
                2
              )}
            </h2>
          </div>

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
                  Tipo
                </th>

                <th className="p-4 text-left">
                  Nome
                </th>

                <th className="p-4 text-left">
                  Pagamento
                </th>

                <th className="p-4 text-left">
                  Valor
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
              ) : registrosFiltrados.length ===
                0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-4"
                  >
                    Nenhum registro encontrado
                  </td>
                </tr>
              ) : (
                registrosFiltrados.map(
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

                      <td className="p-4 capitalize">
                        {
                          item.tipo
                        }
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
        `}</style>

      </div>
    </AdminGuard>
  )
}