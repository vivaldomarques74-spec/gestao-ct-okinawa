"use client"

import { useMemo, useState } from "react"
import { supabase } from "../../lib/supabase"

export default function PresencaPage() {
  const [codigo, setCodigo] = useState("")
  const [loading, setLoading] = useState(false)

  const [professor, setProfessor] =
    useState<any>(null)

  const [turmas, setTurmas] =
    useState<any[]>([])

  const [
    turmaSelecionada,
    setTurmaSelecionada,
  ] = useState<any>(null)

  const [alunos, setAlunos] =
    useState<any[]>([])

  const [busca, setBusca] =
    useState("")

  const [
    presentesIds,
    setPresentesIds,
  ] = useState<number[]>([])

  // ==========================
  // LOGIN PROFESSOR
  // ==========================
  async function entrar() {
    if (!codigo.trim()) {
      alert("Digite o código.")
      return
    }

    setLoading(true)

    const {
      data,
      error,
    } = await supabase
      .from("professores")
      .select("*")
      .eq(
        "codigo",
        codigo.trim()
      )
      .maybeSingle()

    if (error || !data) {
      alert("Código inválido.")
      setLoading(false)
      return
    }

    setProfessor(data)

    const {
      data: listaTurmas,
    } = await supabase
      .from("turmas")
      .select("*")
      .eq(
        "professor",
        data.nome
      )
      .eq(
        "status",
        "ativo"
      )
      .order("nome")

    setTurmas(
      listaTurmas || []
    )

    setLoading(false)
  }

  // ==========================
  // ABRIR TURMA
  // ==========================
  async function abrirTurma(
    turma: any
  ) {
    setTurmaSelecionada(turma)
    setBusca("")
    setAlunos([])
    setPresentesIds([])

    const { data } =
      await supabase
        .from("matriculas")
        .select("*")
        .eq(
          "turma",
          turma.nome
        )
        .eq(
          "status",
          "ativo"
        )
        .order("nome")

    setAlunos(data || [])

    await carregarPresencasHoje(
      turma.nome
    )
  }

  // ==========================
  // PRESENÇAS HOJE
  // ==========================
  async function carregarPresencasHoje(
    nomeTurma: string
  ) {
    const hoje = new Date()

    const inicio =
      new Date(
        hoje.getFullYear(),
        hoje.getMonth(),
        hoje.getDate(),
        0,
        0,
        0
      ).toISOString()

    const fim =
      new Date(
        hoje.getFullYear(),
        hoje.getMonth(),
        hoje.getDate(),
        23,
        59,
        59
      ).toISOString()

    const { data } =
      await supabase
        .from("presencas")
        .select(
          "aluno_id"
        )
        .eq(
          "turma",
          nomeTurma
        )
        .gte(
          "created_at",
          inicio
        )
        .lte(
          "created_at",
          fim
        )

    const ids =
      (data || []).map(
        (item: any) =>
          item.aluno_id
      )

    setPresentesIds(ids)
  }

  // ==========================
  // BLOQUEIO INADIMPLENTE
  // ==========================
  async function verificarBloqueio(
    aluno: any
  ) {
    const { data } =
      await supabase
        .from(
          "mensalidades"
        )
        .select("*")
        .eq(
          "aluno_id",
          aluno.aluno_id
        )
        .eq(
          "status",
          "pendente"
        )

    if (
      !data ||
      data.length === 0
    )
      return false

    const hoje =
      new Date()

    for (const item of data) {
      const venc =
        new Date(
          item.vencimento +
            "T00:00:00"
        )

      const dias =
        Math.floor(
          (hoje.getTime() -
            venc.getTime()) /
            (1000 *
              60 *
              60 *
              24)
        )

      if (dias > 5)
        return true
    }

    return false
  }

  // ==========================
  // MARCAR PRESENÇA
  // ==========================
  async function marcarPresenca(
    aluno: any
  ) {
    if (
      presentesIds.includes(
        aluno.aluno_id
      )
    ) {
      alert(
        "Esse aluno já marcou hoje."
      )
      return
    }

    const bloqueado =
      await verificarBloqueio(
        aluno
      )

    if (bloqueado) {
      alert(
        "ALUNO BLOQUEADO.\nPROCURAR SECRETARIA."
      )
      return
    }

    const { error } =
      await supabase
        .from(
          "presencas"
        )
        .insert([
          {
            aluno_id:
              aluno.aluno_id,
            nome:
              aluno.nome,
            turma:
              turmaSelecionada.nome,
            professor:
              professor.nome,
            modalidade:
              aluno.modalidade,
            status:
              "presente",
            data:
              new Date().toISOString(),
          },
        ])

    if (error) {
      alert(
        "Erro ao salvar presença."
      )
      return
    }

    setPresentesIds(
      (prev) => [
        ...prev,
        aluno.aluno_id,
      ]
    )
  }

  const alunosFiltrados =
    useMemo(() => {
      return alunos.filter(
        (item) =>
          item.nome
            .toLowerCase()
            .includes(
              busca.toLowerCase()
            )
      )
    }, [alunos, busca])

  function voltarTurmas() {
    setTurmaSelecionada(null)
    setAlunos([])
    setBusca("")
  }

  function sair() {
    setProfessor(null)
    setTurmas([])
    setTurmaSelecionada(
      null
    )
    setAlunos([])
    setBusca("")
    setCodigo("")
  }

  return (
    <div className="min-h-screen bg-white text-black p-4">

      <div className="max-w-md mx-auto">

        {/* TOPO */}
        <div className="text-center mb-6">

          <h1 className="text-3xl font-bold text-red-600">
            CT OKINAWA
          </h1>

          <p className="text-gray-600 mt-1">
            CHECK-IN DE PRESENÇA
          </p>

        </div>

        {/* LOGIN */}
        {!professor && (
          <>
            <input
              className="w-full p-4 rounded-xl border border-gray-300 bg-white text-black"
              placeholder="Código do professor"
              value={codigo}
              onChange={(e) =>
                setCodigo(
                  e.target.value
                )
              }
            />

            <button
              onClick={entrar}
              className="w-full mt-3 bg-red-600 text-white p-4 rounded-xl font-bold"
            >
              {loading
                ? "Entrando..."
                : "ENTRAR"}
            </button>
          </>
        )}

        {/* TURMAS */}
        {professor &&
          !turmaSelecionada && (
            <>
              <p className="text-center mb-4">
                Professor:{" "}
                <b>
                  {
                    professor.nome
                  }
                </b>
              </p>

              <div className="space-y-3">

                {turmas.map(
                  (
                    turma,
                    i
                  ) => (
                    <button
                      key={i}
                      onClick={() =>
                        abrirTurma(
                          turma
                        )
                      }
                      className="w-full bg-gray-100 p-4 rounded-xl text-left font-bold border"
                    >
                      {
                        turma.nome
                      }
                    </button>
                  )
                )}

              </div>

              <button
                onClick={sair}
                className="w-full mt-4 border border-gray-400 p-3 rounded-xl"
              >
                Sair
              </button>
            </>
          )}

        {/* ALUNOS */}
        {professor &&
          turmaSelecionada && (
            <>
              <button
                onClick={
                  voltarTurmas
                }
                className="text-sm text-gray-500 mb-3"
              >
                ← Voltar
              </button>

              <h2 className="text-2xl font-bold mb-3">
                {
                  turmaSelecionada.nome
                }
              </h2>

              <input
                className="w-full p-4 rounded-xl border border-gray-300 bg-white mb-4"
                placeholder="Pesquisar aluno..."
                value={busca}
                onChange={(e) =>
                  setBusca(
                    e.target.value
                  )
                }
              />

              <div className="space-y-2">

                {alunosFiltrados.map(
                  (
                    aluno,
                    i
                  ) => {
                    const marcado =
                      presentesIds.includes(
                        aluno.aluno_id
                      )

                    return (
                      <button
                        key={i}
                        disabled={
                          marcado
                        }
                        onClick={() =>
                          marcarPresenca(
                            aluno
                          )
                        }
                        className={`w-full p-4 rounded-xl text-left font-bold border ${
                          marcado
                            ? "bg-green-600 text-white"
                            : "bg-white"
                        }`}
                      >
                        {
                          aluno.nome
                        }

                        <span className="block text-xs opacity-70 mt-1">
                          {
                            aluno.modalidade
                          }
                        </span>

                        {marcado && (
                          <span className="float-right">
                            ✓
                          </span>
                        )}
                      </button>
                    )
                  }
                )}

              </div>
            </>
          )}

      </div>

    </div>
  )
}