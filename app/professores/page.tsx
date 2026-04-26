"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import AdminGuard from "../../components/AdminGuard"

export default function ProfessoresPage() {
  const [loading, setLoading] =
    useState(false)

  const [lista, setLista] =
    useState<any[]>([])

  const vazio = {
    nome: "",
    telefone: "",
    pix: "",
    valor_fixo: "",
    comissao: "",
    modalidades: "",
    codigo: "",
    link_presenca: "",
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
          .from("professores")
          .select("*")
          .order("nome")

      setLista(data || [])
      setLoading(false)
    }

  const gerarCodigo = () => {
    const c =
      Math.floor(
        1000 +
          Math.random() *
            9000
      ).toString()

    setForm({
      ...form,
      codigo: c,
      link_presenca:
        "/presenca/" + c,
    })
  }

  const salvar =
    async () => {
      if (!form.nome) {
        alert("Informe nome")
        return
      }

      const payload = {
        nome: form.nome,
        telefone:
          form.telefone,
        pix: form.pix,
        valor_fixo:
          Number(
            form.valor_fixo ||
              0
          ),
        comissao:
          Number(
            form.comissao ||
              0
          ),
        modalidades:
          form.modalidades,
        codigo:
          form.codigo,
        link_presenca:
          form.link_presenca,
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
              "professores"
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
              "professores"
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
        "Salvo!"
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
        telefone:
          item.telefone ||
          "",
        pix:
          item.pix || "",
        valor_fixo:
          String(
            item.valor_fixo ||
              ""
          ),
        comissao:
          String(
            item.comissao ||
              ""
          ),
        modalidades:
          item.modalidades ||
          "",
        codigo:
          item.codigo || "",
        link_presenca:
          item.link_presenca ||
          "",
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
      if (
        !confirm(
          "Apagar professor?"
        )
      )
        return

      await supabase
        .from(
          "professores"
        )
        .delete()
        .eq("id", id)

      carregar()
    }

  return (
    <AdminGuard>
      <div className="p-4 max-w-7xl mx-auto">

        <h1 className="text-2xl font-bold mb-6">
          Professores V3
        </h1>

        {/* FORM */}
        <div className="bg-white rounded-2xl shadow p-6 text-black mb-6">

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
              placeholder="Telefone"
              value={
                form.telefone
              }
              onChange={(
                e
              ) =>
                setForm({
                  ...form,
                  telefone:
                    e.target
                      .value,
                })
              }
            />

            <input
              className="input"
              placeholder="Pix"
              value={
                form.pix
              }
              onChange={(
                e
              ) =>
                setForm({
                  ...form,
                  pix:
                    e.target
                      .value,
                })
              }
            />

            <input
              className="input"
              type="number"
              placeholder="Valor Fixo"
              value={
                form.valor_fixo
              }
              onChange={(
                e
              ) =>
                setForm({
                  ...form,
                  valor_fixo:
                    e.target
                      .value,
                })
              }
            />

            <input
              className="input"
              type="number"
              placeholder="Comissão %"
              value={
                form.comissao
              }
              onChange={(
                e
              ) =>
                setForm({
                  ...form,
                  comissao:
                    e.target
                      .value,
                })
              }
            />

            <input
              className="input"
              placeholder="Modalidades"
              value={
                form.modalidades
              }
              onChange={(
                e
              ) =>
                setForm({
                  ...form,
                  modalidades:
                    e.target
                      .value,
                })
              }
            />

            <input
              className="input"
              placeholder="Código"
              value={
                form.codigo
              }
              onChange={(
                e
              ) =>
                setForm({
                  ...form,
                  codigo:
                    e.target
                      .value,
                })
              }
            />

            <div className="flex gap-2">
              <input
                className="input"
                placeholder="Link Presença"
                value={
                  form.link_presenca
                }
                onChange={(
                  e
                ) =>
                  setForm({
                    ...form,
                    link_presenca:
                      e.target
                        .value,
                  })
                }
              />

              <button
                onClick={
                  gerarCodigo
                }
                className="mini azul"
              >
                Gerar
              </button>
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
              rows={4}
              className="input md:col-span-2"
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

          <button
            onClick={
              salvar
            }
            className="btn mt-6"
          >
            {editandoId
              ? "Salvar Alterações"
              : "Salvar Professor"}
          </button>

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
                  Telefone
                </th>

                <th className="p-3 text-left">
                  Comissão
                </th>

                <th className="p-3 text-left">
                  Código
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
                        {
                          item.nome
                        }
                      </td>

                      <td className="p-3">
                        {
                          item.telefone
                        }
                      </td>

                      <td className="p-3">
                        {
                          item.comissao
                        }%
                      </td>

                      <td className="p-3">
                        {
                          item.codigo
                        }
                      </td>

                      <td className="p-3">
                        {
                          item.status
                        }
                      </td>

                      <td className="p-3 flex gap-2">

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

          .mini {
            color: white;
            padding: 8px 10px;
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