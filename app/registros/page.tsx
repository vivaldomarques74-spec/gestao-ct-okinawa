"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { supabase } from "../../lib/supabase"

export default function Registros() {
  const [aba, setAba] =
    useState("alunos")

  const [busca, setBusca] =
    useState("")

  const [alunos, setAlunos] =
    useState<any[]>([])

  const [
    mensalidades,
    setMensalidades,
  ] = useState<any[]>([])

  const [vendas, setVendas] =
    useState<any[]>([])

  useEffect(() => {
    carregarTudo()
  }, [])

  const carregarTudo =
    async () => {
      const {
        data: alunosDb,
      } = await supabase
        .from("alunos")
        .select("*")
        .order("id", {
          ascending: false,
        })

      const {
        data: mensDb,
      } = await supabase
        .from(
          "mensalidades"
        )
        .select("*")
        .order("id", {
          ascending: false,
        })

      const {
        data: vendasDb,
      } = await supabase
        .from("vendas")
        .select("*")
        .order("id", {
          ascending: false,
        })

      setAlunos(
        alunosDb || []
      )

      setMensalidades(
        mensDb || []
      )

      setVendas(
        vendasDb || []
      )
    }

  const excluirAluno =
    async (
      id: any
    ) => {
      const ok =
        confirm(
          "Apagar aluno?"
        )

      if (!ok) return

      await supabase
        .from("alunos")
        .delete()
        .eq("id", id)

      carregarTudo()
    }

  const excluirMens =
    async (
      id: any
    ) => {
      const ok =
        confirm(
          "Apagar mensalidade?"
        )

      if (!ok) return

      await supabase
        .from(
          "mensalidades"
        )
        .delete()
        .eq("id", id)

      carregarTudo()
    }

  const excluirVenda =
    async (
      id: any
    ) => {
      const ok =
        confirm(
          "Apagar venda?"
        )

      if (!ok) return

      await supabase
        .from("vendas")
        .delete()
        .eq("id", id)

      carregarTudo()
    }

  const texto =
    busca.toLowerCase()

  const alunosFiltrado =
    alunos.filter(
      (a) =>
        a.nome
          ?.toLowerCase()
          .includes(
            texto
          ) ||
        a.cpf
          ?.toLowerCase()
          .includes(
            texto
          )
    )

  const mensPend =
    mensalidades.filter(
      (m) =>
        m.status !==
          "pago" &&
        m.nome
          ?.toLowerCase()
          .includes(
            texto
          )
    )

  const mensPago =
    mensalidades.filter(
      (m) =>
        m.status ===
          "pago" &&
        m.nome
          ?.toLowerCase()
          .includes(
            texto
          )
    )

  const vendasFiltrado =
    vendas.filter(
      (v) =>
        v.nome
          ?.toLowerCase()
          .includes(
            texto
          )
    )

  return (
    <div className="p-6">

      <h1 className="text-2xl font-bold mb-6">
        Central de Registros
      </h1>

      <input
        className="input mb-4"
        placeholder="Buscar nome / cpf..."
        value={busca}
        onChange={(e) =>
          setBusca(
            e.target.value
          )
        }
      />

      <div className="flex gap-2 mb-6">

        <button
          className={`tab ${
            aba ===
            "alunos"
              ? "on"
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
            "mens"
              ? "on"
              : ""
          }`}
          onClick={() =>
            setAba(
              "mens"
            )
          }
        >
          Mensalidades
        </button>

        <button
          className={`tab ${
            aba ===
            "vendas"
              ? "on"
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

      {/* ALUNOS */}
      {aba ===
        "alunos" && (
        <div className="box">

          <table className="w-full">
            <thead>
              <tr>
                <th>
                  Nome
                </th>
                <th>
                  CPF
                </th>
                <th>
                  Ações
                </th>
              </tr>
            </thead>

            <tbody>

              {alunosFiltrado.map(
                (
                  a
                ) => (
                  <tr
                    key={
                      a.id
                    }
                  >
                    <td>
                      {
                        a.nome
                      }
                    </td>

                    <td>
                      {
                        a.cpf
                      }
                    </td>

                    <td className="flex gap-2">

                      <Link
                        href={`/registros/aluno/${a.id}`}
                        className="mini azul"
                      >
                        Ver
                      </Link>

                      <button
                        onClick={() =>
                          excluirAluno(
                            a.id
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

        </div>
      )}

      {/* MENSALIDADES */}
      {aba ===
        "mens" && (
        <div>

          <div className="box mb-6">

            <h2 className="font-bold mb-4 text-red-600">
              Pendentes
            </h2>

            <table className="w-full">

              <thead>
                <tr>
                  <th>
                    Nome
                  </th>
                  <th>
                    Valor
                  </th>
                  <th>
                    Venc.
                  </th>
                </tr>
              </thead>

              <tbody>

                {mensPend.map(
                  (
                    m
                  ) => (
                    <tr
                      key={
                        m.id
                      }
                    >
                      <td>
                        {
                          m.nome
                        }
                      </td>

                      <td>
                        R$ {" "}
                        {
                          m.valor
                        }
                      </td>

                      <td>
                        {new Date(
                          m.vencimento
                        ).toLocaleDateString()}
                      </td>
                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>

          <div className="box">

            <h2 className="font-bold mb-4 text-green-600">
              Pagas
            </h2>

            <table className="w-full">

              <thead>
                <tr>
                  <th>
                    Nome
                  </th>
                  <th>
                    Valor
                  </th>
                  <th>
                    Ações
                  </th>
                </tr>
              </thead>

              <tbody>

                {mensPago.map(
                  (
                    m
                  ) => (
                    <tr
                      key={
                        m.id
                      }
                    >
                      <td>
                        {
                          m.nome
                        }
                      </td>

                      <td>
                        R$ {" "}
                        {
                          m.valor
                        }
                      </td>

                      <td>

                        <button
                          onClick={() =>
                            excluirMens(
                              m.id
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

          </div>

        </div>
      )}

      {/* VENDAS */}
      {aba ===
        "vendas" && (
        <div className="box">

          <table className="w-full">

            <thead>
              <tr>
                <th>
                  Produto
                </th>
                <th>
                  Valor
                </th>
                <th>
                  Ações
                </th>
              </tr>
            </thead>

            <tbody>

              {vendasFiltrado.map(
                (
                  v
                ) => (
                  <tr
                    key={
                      v.id
                    }
                  >
                    <td>
                      {
                        v.nome
                      }
                    </td>

                    <td>
                      R$ {" "}
                      {
                        v.valor
                      }
                    </td>

                    <td>

                      <button
                        onClick={() =>
                          excluirVenda(
                            v.id
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

        </div>
      )}

      <style jsx>{`
        .input {
          width: 100%;
          padding: 12px;
          border: 1px solid #ccc;
          border-radius: 10px;
        }

        .tab {
          padding: 10px 16px;
          border-radius: 10px;
          background: #27272a;
          color: white;
        }

        .on {
          background: red;
        }

        .box {
          background: white;
          color: black;
          padding: 20px;
          border-radius: 16px;
          overflow: auto;
        }

        table {
          border-collapse: collapse;
        }

        th,
        td {
          padding: 10px;
          border-bottom: 1px solid #eee;
          text-align: left;
        }

        .mini {
          color: white;
          padding: 6px 10px;
          border-radius: 8px;
          font-size: 12px;
        }

        .azul {
          background: #2563eb;
        }

        .vermelho {
          background: #dc2626;
        }
      `}</style>

    </div>
  )
}