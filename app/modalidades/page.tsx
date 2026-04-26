"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import AdminGuard from "../../components/AdminGuard"

export default function ModalidadesPage() {
  const [loading, setLoading] =
    useState(false)

  const [lista, setLista] =
    useState<any[]>([])

  const vazio = {
    nome: "",
    valor_geral: "",
    valor_base: "",
    valor_matricula: "",
    cor: "#dc2626",
    status: "ativo",
    observacao: "",
  }

  const [form, setForm] =
    useState<any>(vazio)

  const [editandoId, setEditandoId] =
    useState<string | null>(null)

  useEffect(() => {
    carregar()
  }, [])

  const carregar =
    async () => {
      setLoading(true)

      const { data } =
        await supabase
          .from("modalidades")
          .select("*")
          .order("nome")

      setLista(data || [])
      setLoading(false)
    }

  const salvar =
    async () => {
      if (!form.nome) {
        alert(
          "Informe o nome"
        )
        return
      }

      const payload = {
        nome: form.nome,

        valor_geral:
          Number(
            form.valor_geral ||
              0
          ),

        valor_base:
          Number(
            form.valor_base ||
              0
          ),

        valor_matricula:
          Number(
            form.valor_matricula ||
              0
          ),

        cor: form.cor,
        status:
          form.status,
        observacao:
          form.observacao,
      }

      let error = null

      if (editandoId) {
        const res =
          await supabase
            .from(
              "modalidades"
            )
            .update(
              payload
            )
            .eq(
              "id",
              editandoId
            )

        error =
          res.error
      } else {
        const res =
          await supabase
            .from(
              "modalidades"
            )
            .insert([
              payload,
            ])

        error =
          res.error
      }

      if (error) {
        alert(
          error.message
        )
        return
      }

      alert(
        editandoId
          ? "Modalidade atualizada!"
          : "Modalidade cadastrada!"
      )

      setForm(vazio)
      setEditandoId(
        null
      )

      carregar()
    }

  const editar =
    (item: any) => {
      setForm({
        nome:
          item.nome || "",

        valor_geral:
          String(
            item.valor_geral ||
              ""
          ),

        valor_base:
          String(
            item.valor_base ||
              ""
          ),

        valor_matricula:
          String(
            item.valor_matricula ||
              ""
          ),

        cor:
          item.cor ||
          "#dc2626",

        status:
          item.status ||
          "ativo",

        observacao:
          item.observacao ||
          "",
      })

      setEditandoId(
        item.id
      )

      window.scrollTo({
        top: 0,
        behavior:
          "smooth",
      })
    }

  const apagar =
    async (
      id: string
    ) => {
      const ok =
        confirm(
          "Apagar modalidade?"
        )

      if (!ok)
        return

      await supabase
        .from(
          "modalidades"
        )
        .delete()
        .eq(
          "id",
          id
        )

      carregar()
    }

  return (
    <AdminGuard>
      <div className="p-4 max-w-7xl mx-auto">

        <h1 className="text-2xl font-bold mb-6">
          Modalidades V2
        </h1>

        {/* FORM */}
        <div className="bg-white rounded-2xl shadow p-6 text-black mb-6">

          <h2 className="text-xl font-bold mb-4">
            {editandoId
              ? "Editar Modalidade"
              : "Nova Modalidade"}
          </h2>

          <div className="grid md:grid-cols-2 gap-4">

            <input
              className="input"
              placeholder="Nome"
              value={
                form.nome
              }
              onChange={(
                e
              ) =>
                setForm({
                  ...form,
                  nome:
                    e.target
                      .value,
                })
              }
            />

            <input
              className="input"
              type="number"
              placeholder="Valor Geral (Aluno paga)"
              value={
                form.valor_geral
              }
              onChange={(
                e
              ) =>
                setForm({
                  ...form,
                  valor_geral:
                    e.target
                      .value,
                })
              }
            />

            <input
              className="input"
              type="number"
              placeholder="Valor Base (Professor)"
              value={
                form.valor_base
              }
              onChange={(
                e
              ) =>
                setForm({
                  ...form,
                  valor_base:
                    e.target
                      .value,
                })
              }
            />

            <input
              className="input"
              type="number"
              placeholder="Valor Matrícula"
              value={
                form.valor_matricula
              }
              onChange={(
                e
              ) =>
                setForm({
                  ...form,
                  valor_matricula:
                    e.target
                      .value,
                })
              }
            />

            <div>
              <label className="block mb-1 text-sm">
                Cor
              </label>

              <input
                className="input"
                type="color"
                value={
                  form.cor
                }
                onChange={(
                  e
                ) =>
                  setForm({
                    ...form,
                    cor:
                      e.target
                        .value,
                  })
                }
              />
            </div>

            <select
              className="input"
              value={
                form.status
              }
              onChange={(
                e
              ) =>
                setForm({
                  ...form,
                  status:
                    e.target
                      .value,
                })
              }
            >
              <option value="ativo">
                Ativo
              </option>

              <option value="inativo">
                Inativo
              </option>
            </select>

            <textarea
              className="input md:col-span-2"
              rows={4}
              placeholder="Observação"
              value={
                form.observacao
              }
              onChange={(
                e
              ) =>
                setForm({
                  ...form,
                  observacao:
                    e.target
                      .value,
                })
              }
            />

          </div>

          <div className="flex gap-3 mt-6">

            <button
              onClick={
                salvar
              }
              className="btn"
            >
              {editandoId
                ? "Salvar Alterações"
                : "Salvar Modalidade"}
            </button>

            {editandoId && (
              <button
                onClick={() => {
                  setEditandoId(
                    null
                  )
                  setForm(
                    vazio
                  )
                }}
                className="btn cinza"
              >
                Cancelar
              </button>
            )}

          </div>

        </div>

        {/* LISTA */}
        <div className="bg-white rounded-2xl shadow overflow-auto">

          <table className="w-full text-black">

            <thead className="bg-gray-100">

              <tr>
                <th className="p-3 text-left">
                  Nome
                </th>

                <th className="p-3 text-left">
                  Valor Geral
                </th>

                <th className="p-3 text-left">
                  Valor Base
                </th>

                <th className="p-3 text-left">
                  Matrícula
                </th>

                <th className="p-3 text-left">
                  Status
                </th>

                <th className="p-3 text-left">
                  Ações
                </th>
              </tr>

            </thead>

            <tbody>

              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="p-4"
                  >
                    Carregando...
                  </td>
                </tr>
              ) : lista.length ===
                0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="p-4"
                  >
                    Nenhuma modalidade cadastrada
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

                      <td className="p-3 font-semibold">
                        {
                          item.nome
                        }
                      </td>

                      <td className="p-3">
                        R$ {Number(
                          item.valor_geral ||
                            0
                        ).toFixed(
                          2
                        )}
                      </td>

                      <td className="p-3">
                        R$ {Number(
                          item.valor_base ||
                            0
                        ).toFixed(
                          2
                        )}
                      </td>

                      <td className="p-3">
                        R$ {Number(
                          item.valor_matricula ||
                            0
                        ).toFixed(
                          2
                        )}
                      </td>

                      <td className="p-3 capitalize">
                        {
                          item.status
                        }
                      </td>

                      <td className="p-3 flex gap-2 flex-wrap">

                        <button
                          onClick={() =>
                            editar(
                              item
                            )
                          }
                          className="mini azul"
                        >
                          Editar
                        </button>

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
            padding: 12px;
            border: 1px solid #ccc;
            border-radius: 10px;
          }

          .btn {
            background: red;
            color: white;
            padding: 12px 18px;
            border-radius: 10px;
          }

          .cinza {
            background: #666;
          }

          .mini {
            color: white;
            padding: 7px 10px;
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
    </AdminGuard>
  )
}