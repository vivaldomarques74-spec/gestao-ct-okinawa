"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from "../../lib/supabase"
import AdminGuard from "../../components/AdminGuard"

export default function RelatoriosPage() {
  const [aba, setAba] = useState("professores")
  const [loading, setLoading] = useState(false)

  const [dados, setDados] = useState<any[]>([])
  const [professores, setProfessores] = useState<any[]>([])
  const [turmas, setTurmas] = useState<any[]>([])
  const [parceiros, setParceiros] = useState<any[]>([])

  const [professor, setProfessor] = useState("")
  const [turma, setTurma] = useState("")
  const [parceiro, setParceiro] = useState("")

  const [inicio, setInicio] = useState("")
  const [fim, setFim] = useState("")

  useEffect(() => {
    carregarBases()
  }, [])

  useEffect(() => {
    carregar()
  }, [
    aba,
    professor,
    turma,
    parceiro,
    inicio,
    fim,
  ])

  const carregarBases =
    async () => {
      const { data: p } =
        await supabase
          .from("professores")
          .select("*")
          .order("nome")

      const { data: t } =
        await supabase
          .from("turmas")
          .select("*")
          .order("nome")

      const { data: pr } =
        await supabase
          .from("parceiros")
          .select("*")
          .order("nome")

      setProfessores(p || [])
      setTurmas(t || [])
      setParceiros(pr || [])
    }

  const dentroPeriodo =
    (base: any) => {
      if (!base) return true

      const data =
        new Date(base)

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
          new Date(fim)

        final.setHours(
          23,
          59,
          59
        )

        fimOk =
          data <= final
      }

      return (
        inicioOk &&
        fimOk
      )
    }

  const carregar =
    async () => {
      setLoading(true)

      /* PROFESSORES */
      if (
        aba ===
        "professores"
      ) {
        let query =
          supabase
            .from(
              "mensalidades"
            )
            .select("*")
            .eq(
              "status",
              "pago"
            )

        if (
          professor
        ) {
          query =
            query.eq(
              "professor",
              professor
            )
        }

        const {
          data,
        } =
          await query

        const filtrado =
          (
            data || []
          ).filter(
            (
              item
            ) =>
              dentroPeriodo(
                item.created_at ||
                  item.data_pagamento ||
                  item.data
              )
          )

        setDados(
          filtrado
        )
      }

      /* PRESENÇA */
      if (
        aba ===
        "presenca"
      ) {
        let query =
          supabase
            .from(
              "presencas"
            )
            .select("*")

        if (turma) {
          query =
            query.eq(
              "turma",
              turma
            )
        }

        const {
          data,
        } =
          await query

        const filtrado =
          (
            data || []
          ).filter(
            (
              item
            ) =>
              dentroPeriodo(
                item.created_at ||
                  item.data
              )
          )

        setDados(
          filtrado
        )
      }

      /* VENDAS */
      if (
        aba ===
        "vendas"
      ) {
        let query =
          supabase
            .from(
              "caixa"
            )
            .select("*")
            .eq(
              "tipo",
              "venda"
            )

        const {
          data,
        } =
          await query

        let filtrado =
          (
            data || []
          ).filter(
            (
              item
            ) =>
              dentroPeriodo(
                item.created_at ||
                  item.data
              )
          )

        if (
          parceiro
        ) {
          filtrado =
            filtrado.filter(
              (
                item
              ) =>
                item.parceiro ===
                  parceiro ||
                item.parceiro_nome ===
                  parceiro
            )
        }

        setDados(
          filtrado
        )
      }

      setLoading(false)
    }

  const total =
    useMemo(() => {
      return dados.reduce(
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
    }, [dados])

  const imprimir =
    () => {
      window.print()
    }

  return (
    <AdminGuard>
      <div className="p-4 max-w-7xl mx-auto">

        <div className="flex justify-between gap-3 flex-wrap mb-6">

          <h1 className="text-2xl font-bold">
            Central de
            Relatórios
          </h1>

          <button
            onClick={
              imprimir
            }
            className="btn"
          >
            🖨️ Imprimir
          </button>

        </div>

        {/* ABAS */}
        <div className="flex gap-2 flex-wrap mb-6">

          <button
            className={`tab ${
              aba ===
              "professores"
                ? "ativo"
                : ""
            }`}
            onClick={() =>
              setAba(
                "professores"
              )
            }
          >
            Professores
          </button>

          <button
            className={`tab ${
              aba ===
              "presenca"
                ? "ativo"
                : ""
            }`}
            onClick={() =>
              setAba(
                "presenca"
              )
            }
          >
            Presença
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

        {/* FILTROS */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">

          {aba ===
            "professores" && (
            <select
              className="input"
              value={
                professor
              }
              onChange={(
                e
              ) =>
                setProfessor(
                  e.target
                    .value
                )
              }
            >
              <option value="">
                Todos professores
              </option>

              {professores.map(
                (
                  item,
                  i
                ) => (
                  <option
                    key={i}
                  >
                    {
                      item.nome
                    }
                  </option>
                )
              )}
            </select>
          )}

          {aba ===
            "presenca" && (
            <select
              className="input"
              value={
                turma
              }
              onChange={(
                e
              ) =>
                setTurma(
                  e.target
                    .value
                )
              }
            >
              <option value="">
                Todas turmas
              </option>

              {turmas.map(
                (
                  item,
                  i
                ) => (
                  <option
                    key={i}
                  >
                    {
                      item.nome
                    }
                  </option>
                )
              )}
            </select>
          )}

          {aba ===
            "vendas" && (
            <select
              className="input"
              value={
                parceiro
              }
              onChange={(
                e
              ) =>
                setParceiro(
                  e.target
                    .value
                )
              }
            >
              <option value="">
                Todos parceiros
              </option>

              {parceiros.map(
                (
                  item,
                  i
                ) => (
                  <option
                    key={i}
                  >
                    {
                      item.nome
                    }
                  </option>
                )
              )}
            </select>
          )}

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

        </div>

        {/* CARD */}
        <div className="card mb-6">

          <small>
            Total Geral
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
                  Nome
                </th>

                <th className="p-4 text-left">
                  Tipo
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
                    colSpan={4}
                    className="p-4"
                  >
                    Carregando...
                  </td>
                </tr>
              ) : dados.length ===
                0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="p-4"
                  >
                    Nenhum dado encontrado
                  </td>
                </tr>
              ) : (
                dados.map(
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
                            item.data_pagamento ||
                            item.data
                        ).toLocaleDateString()}
                      </td>

                      <td className="p-4">
                        {item.nome ||
                          item.aluno ||
                          item.parceiro ||
                          "-"}
                      </td>

                      <td className="p-4 capitalize">
                        {item.tipo ||
                          aba}
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

          .btn {
            background: red;
            color: white;
            padding: 12px 16px;
            border-radius: 10px;
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

          @media print {
            button,
            select,
            input {
              display: none !important;
            }
          }
        `}</style>

      </div>
    </AdminGuard>
  )
}