"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"

export default function ImprimirRecibos() {
  const [lista, setLista] =
    useState<any[]>([])

  const [tipo, setTipo] =
    useState("todos")

  const [loading, setLoading] =
    useState(false)

  useEffect(() => {
    carregar()
  }, [tipo])

  const carregar =
    async () => {
      setLoading(true)

      let query =
        supabase
          .from("recibos")
          .select("*")
          .order(
            "created_at",
            {
              ascending:
                false,
            }
          )
          .limit(5)

      if (
        tipo !==
        "todos"
      ) {
        query =
          query.eq(
            "tipo",
            tipo
          )
      }

      const {
        data,
        error,
      } = await query

      if (error) {
        console.error(
          error
        )
        alert(
          "Tabela recibos não encontrada no Supabase"
        )
      }

      setLista(
        data || []
      )

      setLoading(false)
    }

  const imprimir =
    (
      html: string
    ) => {
      const w =
        window.open(
          "",
          "",
          "width=320,height=700"
        )

      w?.document.write(
        html
      )

      w?.document.close()
    }

  return (
    <div className="p-4 max-w-6xl mx-auto">

      <h1 className="text-2xl font-bold mb-6">
        Imprimir Recibos
      </h1>

      <div className="bg-white rounded-2xl shadow p-4 text-black mb-6">

        <div className="grid md:grid-cols-3 gap-3">

          <select
            className="input"
            value={tipo}
            onChange={(
              e
            ) =>
              setTipo(
                e.target
                  .value
              )
            }
          >
            <option value="todos">
              Todos
            </option>

            <option value="pdv">
              PDV
            </option>

            <option value="matricula">
              Matrícula
            </option>

            <option value="mensalidade">
              Mensalidade
            </option>

            <option value="caixa">
              Caixa
            </option>
          </select>

          <button
            onClick={
              carregar
            }
            className="btn"
          >
            Atualizar
          </button>

        </div>

      </div>

      <div className="bg-white rounded-2xl shadow overflow-hidden">

        <table className="w-full text-black">

          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">
                Data
              </th>

              <th className="p-3 text-left">
                Tipo
              </th>

              <th className="p-3 text-left">
                Nome
              </th>

              <th className="p-3 text-left">
                Valor
              </th>

              <th className="p-3 text-left">
                Ação
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
            ) : lista.length ===
              0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="p-4"
                >
                  Nenhum recibo encontrado
                </td>
              </tr>
            ) : (
              lista.map(
                (
                  item,
                  i
                ) => (
                  <tr
                    key={i}
                    className="border-t"
                  >
                    <td className="p-3">
                      {new Date(
                        item.created_at
                      ).toLocaleDateString()}
                      <br />
                      <small>
                        {new Date(
                          item.created_at
                        ).toLocaleTimeString()}
                      </small>
                    </td>

                    <td className="p-3 capitalize">
                      {
                        item.tipo
                      }
                    </td>

                    <td className="p-3">
                      {
                        item.nome
                      }
                    </td>

                    <td className="p-3">
                      R${" "}
                      {Number(
                        item.valor ||
                          0
                      ).toFixed(
                        2
                      )}
                    </td>

                    <td className="p-3">
                      <button
                        onClick={() =>
                          imprimir(
                            item.html_recibo
                          )
                        }
                        className="mini"
                      >
                        Imprimir
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

        .mini {
          background: #111;
          color: white;
          padding: 8px 12px;
          border-radius: 8px;
        }
      `}</style>

    </div>
  )
}