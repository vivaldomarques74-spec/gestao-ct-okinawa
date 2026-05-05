"use client"

import { useState } from "react"
import { supabase } from "../../lib/supabase"

export default function PresencaPage() {
  const [codigo, setCodigo] = useState("")
  const [loading, setLoading] = useState(false)
  const [professor, setProfessor] = useState<any>(null)
  const [turmas, setTurmas] = useState<any[]>([])
  const [turmaSelecionada, setTurmaSelecionada] = useState<any>(null)
  const [alunos, setAlunos] = useState<any[]>([])
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())
  const [salvando, setSalvando] = useState(false)

  async function entrar() {
    if (!codigo.trim()) return alert("Digite o código do professor")
    setLoading(true)
    const { data, error } = await supabase
      .from("professores")
      .select("*")
      .eq("codigo_acesso", codigo.trim())
      .maybeSingle()
    if (error || !data) {
      alert("Código inválido")
      setLoading(false)
      return
    }
    setProfessor(data)
    const { data: turmasData } = await supabase
      .from("turmas")
      .select("*")
      .eq("professor_id", data.id)
      .eq("status", "ativo")
    setTurmas(turmasData || [])
    setLoading(false)
  }

  async function abrirTurma(turma: any) {
    setTurmaSelecionada(turma)
    setAlunos([])
    setSelecionados(new Set())

    // Buscar alunos matriculados na turma
    const { data: matriculas, error: errMat } = await supabase
      .from("matriculas")
      .select("aluno_id")
      .eq("turma_id", turma.id)
      .eq("status", "ativo")

    if (errMat) {
      alert("Erro ao carregar matrículas: " + errMat.message)
      return
    }
    if (!matriculas || matriculas.length === 0) {
      setAlunos([])
      return
    }

    const alunoIds = matriculas.map(m => m.aluno_id)
    const { data: alunosData, error: errAlunos } = await supabase
      .from("alunos")
      .select("id, nome, cpf, status")
      .in("id", alunoIds)

    if (errAlunos) {
      alert("Erro ao carregar alunos: " + errAlunos.message)
      return
    }

    // Carregar presenças de hoje
    const hoje = new Date().toISOString().slice(0,10)
    const { data: presencasHoje } = await supabase
      .from("presencas")
      .select("aluno_id")
      .eq("turma_id", turma.id)
      .eq("data", hoje)

    const jaPresentes = new Set(presencasHoje?.map(p => p.aluno_id) || [])
    setAlunos(alunosData || [])
    setSelecionados(jaPresentes)
  }

  function toggleAluno(alunoId: string) {
    const novos = new Set(selecionados)
    if (novos.has(alunoId)) novos.delete(alunoId)
    else novos.add(alunoId)
    setSelecionados(novos)
  }

  async function salvarPresencas() {
    if (selecionados.size === 0 && alunos.length > 0) {
      if (!confirm("Nenhum aluno selecionado. Deseja continuar?")) return
    }
    setSalvando(true)
    const hoje = new Date().toISOString().slice(0,10)
    const hora = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })

    for (const alunoId of selecionados) {
      const { error } = await supabase.from("presencas").upsert({
        aluno_id: alunoId,
        turma_id: turmaSelecionada.id,
        professor_id: professor.id,
        data: hoje,
        hora: hora,
        status: "presente"
      }, { onConflict: "aluno_id, turma_id, data" })
      if (error) console.error("Erro ao salvar presença:", error)
    }
    alert("Presenças salvas com sucesso!")
    setSalvando(false)
    await abrirTurma(turmaSelecionada)
  }

  function sair() {
    setProfessor(null)
    setTurmas([])
    setTurmaSelecionada(null)
    setAlunos([])
    setSelecionados(new Set())
    setCodigo("")
  }

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold text-red-600 text-center mb-6">CT OKINAWA</h1>
        {!professor ? (
          <>
            <input className="w-full p-4 border rounded-xl" placeholder="Código do professor" value={codigo} onChange={e => setCodigo(e.target.value)} />
            <button onClick={entrar} className="w-full mt-3 bg-red-600 text-white p-4 rounded-xl font-bold">{loading ? "Entrando..." : "ENTRAR"}</button>
          </>
        ) : !turmaSelecionada ? (
          <>
            <p className="text-center mb-4">Professor: <b>{professor.nome}</b></p>
            <div className="space-y-3">
              {turmas.map(t => <button key={t.id} onClick={() => abrirTurma(t)} className="w-full bg-gray-100 p-4 rounded-xl text-left font-bold border">{t.nome}</button>)}
            </div>
            <button onClick={sair} className="w-full mt-4 border p-3 rounded-xl">Sair</button>
          </>
        ) : (
          <>
            <button onClick={() => setTurmaSelecionada(null)} className="text-sm text-gray-500 mb-3">← Voltar</button>
            <h2 className="text-2xl font-bold mb-3">{turmaSelecionada.nome}</h2>
            <div className="space-y-2 max-h-[500px] overflow-y-auto mb-4">
              {alunos.map(aluno => (
                <label key={aluno.id} className={`flex items-center p-3 rounded-xl border cursor-pointer ${selecionados.has(aluno.id) ? "bg-green-100 border-green-500" : "bg-white"}`}>
                  <input type="checkbox" checked={selecionados.has(aluno.id)} onChange={() => toggleAluno(aluno.id)} className="mr-3 w-5 h-5" />
                  <div>
                    <p className="font-bold">{aluno.nome}</p>
                    <p className="text-xs text-gray-500">CPF: {aluno.cpf || "---"}</p>
                  </div>
                </label>
              ))}
              {alunos.length === 0 && <p className="text-gray-500">Nenhum aluno matriculado nesta turma.</p>}
            </div>
            <button onClick={salvarPresencas} disabled={salvando} className="w-full bg-red-600 text-white p-3 rounded-xl font-bold disabled:opacity-50">
              {salvando ? "Salvando..." : "Salvar Presenças"}
            </button>
          </>
        )}
      </div>
    </div>
  )
}