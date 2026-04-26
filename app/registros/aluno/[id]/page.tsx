"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../../../lib/supabase"
import AdminGuard from "../../../../components/AdminGuard"
import { useParams, useRouter } from "next/navigation"

export default function EditarAluno() {
  const { id } = useParams()
  const router = useRouter()

  const [form, setForm] = useState<any>({
    nome: "",
    whatsapp: "",
    data_nascimento: "",
    email: "",
    endereco: "",
    responsavel_nome: "",
    whatsapp_responsavel: "",

    status: "ativo",
    data_bloqueio: "",
    data_inativacao: "",

    modalidade: "",
    turma: "",
    desconto: 0,
  })

  const [modalidades, setModalidades] =
    useState<any[]>([])

  const [turmas, setTurmas] =
    useState<any[]>([])

  useEffect(() => {
    carregarAluno()
    carregarModalidades()
  }, [])

  useEffect(() => {
    if (form.modalidade) {
      carregarTurmas(
        form.modalidade
      )
    }
  }, [form.modalidade])

  const carregarAluno =
    async () => {
      const { data } =
        await supabase
          .from("alunos")
          .select("*")
          .eq("id", id)
          .single()

      if (data) {
        setForm(data)
      }
    }

  const carregarModalidades =
    async () => {
      const { data } =
        await supabase
          .from(
            "modalidades"
          )
          .select("*")
          .order("nome")

      setModalidades(
        data || []
      )
    }

  const carregarTurmas =
    async (
      modalidade: string
    ) => {
      const { data } =
        await supabase
          .from("turmas")
          .select("*")
          .eq(
            "modalidade",
            modalidade
          )
          .order("nome")

      setTurmas(data || [])
    }

  const setCampo = (
    campo: string,
    valor: any
  ) => {
    setForm({
      ...form,
      [campo]: valor,
    })
  }

  const mudarStatus = (
    novoStatus: string
  ) => {
    const hoje =
      new Date()
        .toISOString()
        .slice(0, 10)

    if (
      novoStatus ===
      "bloqueado"
    ) {
      setForm({
        ...form,
        status:
          "bloqueado",
        data_bloqueio:
          hoje,
      })
      return
    }

    if (
      novoStatus ===
      "inativo"
    ) {
      setForm({
        ...form,
        status:
          "inativo",
        data_inativacao:
          hoje,
      })
      return
    }

    setForm({
      ...form,
      status: "ativo",
      data_bloqueio: "",
      data_inativacao:
        "",
    })
  }

  const salvar =
    async () => {
      await supabase
        .from("alunos")
        .update(form)
        .eq("id", id)

      alert(
        "Aluno atualizado com sucesso"
      )

      router.push(
        "/registros"
      )
    }

  return (
    <AdminGuard>
      <div className="p-4 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">
          Editar Aluno
        </h1>

        <div className="bg-white rounded-2xl shadow p-6 text-black">

          <div className="grid gap-3">

            <input
              className="input"
              placeholder="Nome"
              value={
                form.nome ||
                ""
              }
              onChange={(
                e
              ) =>
                setCampo(
                  "nome",
                  e.target
                    .value
                )
              }
            />

            <input
              className="input"
              placeholder="Whatsapp"
              value={
                form.whatsapp ||
                ""
              }
              onChange={(
                e
              ) =>
                setCampo(
                  "whatsapp",
                  e.target
                    .value
                )
              }
            />

            <input
              className="input"
              type="date"
              value={
                form.data_nascimento ||
                ""
              }
              onChange={(
                e
              ) =>
                setCampo(
                  "data_nascimento",
                  e.target
                    .value
                )
              }
            />

            <input
              className="input"
              placeholder="Email"
              value={
                form.email ||
                ""
              }
              onChange={(
                e
              ) =>
                setCampo(
                  "email",
                  e.target
                    .value
                )
              }
            />

            <input
              className="input"
              placeholder="Endereço"
              value={
                form.endereco ||
                ""
              }
              onChange={(
                e
              ) =>
                setCampo(
                  "endereco",
                  e.target
                    .value
                )
              }
            />

            <input
              className="input"
              placeholder="Responsável"
              value={
                form.responsavel_nome ||
                ""
              }
              onChange={(
                e
              ) =>
                setCampo(
                  "responsavel_nome",
                  e.target
                    .value
                )
              }
            />

            <input
              className="input"
              placeholder="Whatsapp Responsável"
              value={
                form.whatsapp_responsavel ||
                ""
              }
              onChange={(
                e
              ) =>
                setCampo(
                  "whatsapp_responsavel",
                  e.target
                    .value
                )
              }
            />

            {/* status */}
            <select
              className="input"
              value={
                form.status ||
                "ativo"
              }
              onChange={(
                e
              ) =>
                mudarStatus(
                  e.target
                    .value
                )
              }
            >
              <option value="ativo">
                Ativo
              </option>

              <option value="bloqueado">
                Bloqueado
              </option>

              <option value="inativo">
                Inativo
              </option>
            </select>

            {form.status ===
              "bloqueado" && (
              <div className="box yellow">
                Bloqueado em:{" "}
                {
                  form.data_bloqueio
                }
                <br />
                Continua gerando
                mensalidades
                por 30 dias.
              </div>
            )}

            {form.status ===
              "inativo" && (
              <div className="box red">
                Inativado em:{" "}
                {
                  form.data_inativacao
                }
                <br />
                Para novas
                mensalidades.
              </div>
            )}

            {form.status ===
              "ativo" && (
              <div className="box green">
                Aluno ativo.
                Continua
                gerando
                mensalidades
                normalmente.
              </div>
            )}

            {/* modalidade */}
            <select
              className="input"
              value={
                form.modalidade ||
                ""
              }
              onChange={(
                e
              ) => {
                setCampo(
                  "modalidade",
                  e.target
                    .value
                )

                setCampo(
                  "turma",
                  ""
                )
              }}
            >
              <option value="">
                Selecione
                Modalidade
              </option>

              {modalidades.map(
                (
                  m,
                  i
                ) => (
                  <option
                    key={i}
                    value={
                      m.nome
                    }
                  >
                    {m.nome}
                  </option>
                )
              )}
            </select>

            {/* turma */}
            <select
              className="input"
              value={
                form.turma ||
                ""
              }
              onChange={(
                e
              ) =>
                setCampo(
                  "turma",
                  e.target
                    .value
                )
              }
            >
              <option value="">
                Selecione
                Turma
              </option>

              {turmas.map(
                (
                  t,
                  i
                ) => (
                  <option
                    key={i}
                    value={
                      t.nome
                    }
                  >
                    {t.nome}
                  </option>
                )
              )}
            </select>

            <input
              className="input"
              type="number"
              placeholder="Desconto"
              value={
                form.desconto ||
                0
              }
              onChange={(
                e
              ) =>
                setCampo(
                  "desconto",
                  e.target
                    .value
                )
              }
            />

            <button
              onClick={
                salvar
              }
              className="btn"
            >
              Salvar
              Alterações
            </button>

          </div>
        </div>

        <style jsx>{`
          .input {
            width: 100%;
            padding: 12px;
            border: 1px solid
              #ccc;
            border-radius: 10px;
            background: white;
            color: black;
          }

          .btn {
            background: red;
            color: white;
            padding: 14px;
            border-radius: 10px;
          }

          .box {
            padding: 12px;
            border-radius: 10px;
            font-size: 14px;
          }

          .green {
            background: #dcfce7;
          }

          .yellow {
            background: #fef3c7;
          }

          .red {
            background: #fee2e2;
          }
        `}</style>
      </div>
    </AdminGuard>
  )
}