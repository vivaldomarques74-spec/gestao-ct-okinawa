"use client"

import { useMemo, useState } from "react"
import { supabase } from "../../lib/supabase"

export default function PresencasPage() {
  const [codigo, setCodigo] = useState("")
  const [loading, setLoading] = useState(false)

  const [professor, setProfessor] = useState<any>(null)
  const [turmas, setTurmas] = useState<any[]>([])

  const [turmaSelecionada, setTurmaSelecionada] = useState<any>(null)
  const [alunos, setAlunos] = useState<any[]>([])
  const [busca, setBusca] = useState("")

  const [presentesIds, setPresentesIds] = useState<number[]>([])

  // =========================
  // LOGIN PROFESSOR
  // =========================
  async function entrar() {
    if (!codigo.trim()) {
      alert("Digite o código.")
      return
    }

    setLoading(true)

    const { data, error } = await supabase
      .from("professores")
      .select("*")
      .eq("codigo", codigo.trim())
      .maybeSingle()

    if (error || !data) {
      alert("Código inválido.")
      setLoading(false)
      return
    }

    setProfessor(data)

    const { data: turmasData } = await supabase
      .from("turmas")
      .select("*")
      .eq("professor_id", data.id)
      .order("nome")

    setTurmas(turmasData || [])
    setLoading(false)
  }

  // =========================
  // ABRIR TURMA
  // =========================
  async function abrirTurma(turma: any) {
    setTurmaSelecionada(turma)
    setBusca("")
    setAlunos([])
    setPresentesIds([])

    const { data } = await supabase
      .from("matriculas")
      .select("*")
      .eq("turma", turma.nome)
      .order("nome")

    setAlunos(data || [])

    await carregarPresentesHoje(turma.nome)
  }

  // =========================
  // CARREGAR PRESENÇAS DE HOJE
  // =========================
  async function carregarPresentesHoje(nomeTurma: string) {
    const hoje = new Date()

    const inicio = new Date(
      hoje.getFullYear(),
      hoje.getMonth(),
      hoje.getDate(),
      0,
      0,
      0
    ).toISOString()

    const fim = new Date(
      hoje.getFullYear(),
      hoje.getMonth(),
      hoje.getDate(),
      23,
      59,
      59
    ).toISOString()

    const { data } = await supabase
      .from("presencas")
      .select("aluno_id")
      .eq("turma", nomeTurma)
      .gte("created_at", inicio)
      .lte("created_at", fim)

    const ids = (data || []).map((item: any) => item.aluno_id)
    setPresentesIds(ids)
  }

  // =========================
  // BLOQUEIO FINANCEIRO
  // =========================
  async function verificarBloqueio(aluno: any) {
    const { data } = await supabase
      .from("mensalidades")
      .select("*")
      .eq("aluno_id", aluno.aluno_id)
      .eq("status", "pendente")

    if (!data || data.length === 0) return false

    const hoje = new Date()

    for (const item of data) {
      const venc = new Date(item.vencimento + "T00:00:00")

      const dias = Math.floor(
        (hoje.getTime() - venc.getTime()) / (1000 * 60 * 60 * 24)
      )

      if (dias > 5) return true
    }

    return false
  }

  // =========================
  // SALVAR PRESENÇA NO SUPABASE
  // =========================
  async function marcarPresenca(aluno: any) {
    if (!professor || !turmaSelecionada) return

    if (presentesIds.includes(aluno.aluno_id)) {
      alert("Esse aluno já marcou presença hoje.")
      return
    }

    const bloqueado = await verificarBloqueio(aluno)

    if (bloqueado) {
      alert("ALUNO BLOQUEADO POR PENDÊNCIA.\nPROCURAR SECRETARIA.")
      return
    }

    const { error } = await supabase.from("presencas").insert([
      {
        aluno_id: aluno.aluno_id,
        nome: aluno.nome,
        turma: turmaSelecionada.nome,
        professor: professor.nome,
        data: new Date().toISOString(),
        status: "presente",
      },
    ])

    if (error) {
      alert("Erro ao salvar presença.")
      return
    }

    setPresentesIds((prev) => [...prev, aluno.aluno_id])
  }

  // =========================
  // FILTRO BUSCA
  // =========================
  const alunosFiltrados = useMemo(() => {
    return alunos.filter((a) =>
      a.nome.toLowerCase().includes(busca.toLowerCase())
    )
  }, [alunos, busca])

  // =========================
  // VOLTAR
  // =========================
  function voltar() {
    setTurmaSelecionada(null)
    setAlunos([])
    setBusca("")
    setPresentesIds([])
  }

  function sair() {
    setProfessor(null)
    setTurmas([])
    voltar()
    setCodigo("")
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-md mx-auto">

        <h1 className="text-3xl font-bold text-center text-red-500 mb-1">
          CT OKINAWA
        </h1>

        <p className="text-center text-gray-300 mb-6">
          CHECK-IN DE PRESENÇA
        </p>

        {/* LOGIN */}
        {!professor && (
          <>
            <input
              className="w-full p-4 rounded-xl text-black"
              placeholder="Código do professor"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
            />

            <button
              onClick={entrar}
              className="w-full bg-red-600 p-4 rounded-xl mt-3 font-bold"
            >
              {loading ? "Entrando..." : "ENTRAR"}
            </button>
          </>
        )}

        {/* TURMAS */}
        {professor && !turmaSelecionada && (
          <>
            <p className="mb-4 text-center">
              Professor: <b>{professor.nome}</b>
            </p>

            <div className="space-y-3">
              {turmas.map((t, i) => (
                <button
                  key={i}
                  onClick={() => abrirTurma(t)}
                  className="w-full bg-white text-black p-4 rounded-xl text-left font-bold"
                >
                  {t.nome}
                </button>
              ))}
            </div>

            <button
              onClick={sair}
              className="w-full border border-gray-600 p-3 rounded-xl mt-4"
            >
              Sair
            </button>
          </>
        )}

        {/* ALUNOS */}
        {professor && turmaSelecionada && (
          <>
            <button
              onClick={voltar}
              className="text-sm text-gray-400 mb-3"
            >
              ← Voltar
            </button>

            <h2 className="text-2xl font-bold mb-2">
              {turmaSelecionada.nome}
            </h2>

            <input
              className="w-full p-4 rounded-xl text-black mb-4"
              placeholder="Pesquisar aluno..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />

            <div className="space-y-2">
              {alunosFiltrados.map((aluno, i) => {
                const marcado = presentesIds.includes(aluno.aluno_id)

                return (
                  <button
                    key={i}
                    disabled={marcado}
                    onClick={() => marcarPresenca(aluno)}
                    className={`w-full p-4 rounded-xl text-left font-bold ${
                      marcado
                        ? "bg-green-700 opacity-70"
                        : "bg-white text-black"
                    }`}
                  >
                    {aluno.nome}
                    {marcado && (
                      <span className="float-right">✓</span>
                    )}
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}