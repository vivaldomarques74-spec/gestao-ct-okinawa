"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import AdminGuard from "../../components/AdminGuard"

export default function TurmasPage() {
  const [loading, setLoading] =
    useState(false)

  const [lista, setLista] =
    useState<any[]>([])

  const [modalidades, setModalidades] =
    useState<any[]>([])

  const [professores, setProfessores] =
    useState<any[]>([])

  const vazio = {
    nome: "",
    modalidade: "",
    professor: "",
    dias_semana: "",
    horario_inicio: "",
    horario_fim: "",
    limite_alunos: "",
    local: "",
    status: "ativo",
    observacao: "",
  }

  const [form, setForm] =
    useState<any>(vazio)

  const [editandoId, setEditandoId] =
    useState<string | null>(null)

  useEffect(() => {
    carregar()
    carregarBases()
  }, [])

  const carregar =
    async () => {
      setLoading(true)

      const { data } =
        await supabase
          .from("turmas")
          .select("*")
          .order("nome")

      setLista(data || [])
      setLoading(false)
    }

  const carregarBases =
    async () => {
      const { data: mods } =
        await supabase
          .from("modalidades")
          .select("*")
          .eq("status", "ativo")
          .order("nome")

      const { data: profs } =
        await supabase
          .from("professores")
          .select("*")
          .eq("status", "ativo")
          .order("nome")

      setModalidades(mods || [])
      setProfessores(profs || [])
    }

  const salvar =
    async () => {
      if (!form.nome) {
        alert("Informe nome")
        return
      }

      const payload = {
        nome: form.nome,
        modalidade:
          form.modalidade,
        professor:
          form.professor,
        dias_semana:
          form.dias_semana,
        horario_inicio:
          form.horario_inicio,
        horario_fim:
          form.horario_fim,
        limite_alunos:
          Number(
            form.limite_alunos ||
              0
          ),
        local: form.local,
        status:
          form.status,
        observacao:
          form.observacao,
      }

      let error = null

      if (editandoId) {
        const res =
          await supabase
            .from("turmas")
            .update(payload)
            .eq(
              "id",
              editandoId
            )

        error = res.error
      } else {
        const res =
          await supabase
            .from("turmas")
            .insert([
              payload,
            ])

        error = res.error
      }

      if (error) {
        alert(
          error.message
        )
        return
      }

      alert("Salvo!")

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
        modalidade:
          item.modalidade ||
          "",
        professor:
          item.professor ||
          "",
        dias_semana:
          item.dias_semana ||
          "",
        horario_inicio:
          item.horario_inicio ||
          "",
        horario_fim:
          item.horario_fim ||
          "",
        limite_alunos:
          String(
            item.limite_alunos ||
              ""
          ),
        local:
          item.local || "",
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
          "Apagar turma?"
        )
      )
        return

      await supabase
        .from("turmas")
        .delete()
        .eq("id", id)

      carregar()
    }

  return (
    <AdminGuard>
      <div className="p-4 max-w-7xl mx-auto">

        <h1 className="text-2xl font-bold mb-6">
          Turmas
        </h1>

        {/* FORM */}
        <div className="bg-white rounded-2xl shadow p-6 text-black mb-6">

          <div className="grid md:grid-cols-2 gap-4">

            <input
              className="input"
              placeholder="Nome da turma"
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

            <select
              className="input"
              value={
                form.modalidade
              }
              onChange={(
                e
              ) =>
                setForm({
                  ...form,
                  modalidade:
                    e.target
                      .value,
                })
              }
            >
              <option value="">
                Modalidade
              </option>

              {modalidades.map(
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

            <select
              className="input"
              value={
                form.professor
              }
              onChange={(
                e
              ) =>
                setForm({
                  ...form,
                  professor:
                    e.target
                      .value,
                })
              }
            >
              <option value="">
                Professor
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

            <input
              className="input"
              placeholder="Dias semana"
              value={
                form.dias_semana
              }
              onChange={(
                e
              ) =>
                setForm({
                  ...form,
                  dias_semana:
                    e.target
                      .value,
                })
              }
            />

            <input
              className="input"
              type="time"
              value={
                form.horario_inicio
              }
              onChange={(
                e
              ) =>
                setForm({
                  ...form,
                  horario_inicio:
                    e.target
                      .value,
                })
              }
            />

            <input
              className="input"
              type="time"
              value={
                form.horario_fim
              }
              onChange={(
                e
              ) =>
                setForm({
                  ...form,
                  horario_fim:
                    e.target
                      .value,
                })
              }
            />

            <input
              className="input"
              type="number"
              placeholder="Limite alunos"
              value={
                form.limite_alunos
              }
              onChange={(
                e
              ) =>
                setForm({
                  ...form,
                  limite_alunos:
                    e.target
                      .value,
                })
              }
            />

            <input
              className="input"
              placeholder="Local / Sala"
              value={
                form.local
              }
              onChange={(
                e
              ) =>
                setForm({
                  ...form,
                  local:
                    e.target
                      .value,
                })
              }
            />

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
              : "Salvar Turma"}
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
                  Modalidade
                </th>
                <th className="p-3 text-left">
                  Professor
                </th>
                <th className="p-3 text-left">
                  Horário
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
                          item.modalidade
                        }
                      </td>

                      <td className="p-3">
                        {
                          item.professor
                        }
                      </td>

                      <td className="p-3">
                        {
                          item.horario_inicio
                        }{" "}
                        -{" "}
                        {
                          item.horario_fim
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