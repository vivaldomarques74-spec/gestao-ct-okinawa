"use client"

import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"
import { Users, AlertTriangle, Layers } from "lucide-react"

export default function Dashboard() {
  const [stats, setStats] = useState({ ativos: 0, inativos: 0, alertas: 0, turmas: 0 })
  const [turmasList, setTurmasList] = useState<any[]>([])
  const [modalidadesList, setModalidadesList] = useState<any[]>([])

  useEffect(() => {
    carregar()
  }, [])

  async function carregar() {
    // Alunos
    const { data: alunos } = await supabase.from("alunos").select("*")
    const ativos = alunos?.filter(a => a.status === "ativo").length || 0
    const inativos = alunos?.filter(a => a.status === "inativo").length || 0

    // Mensalidades pendentes (alertas)
    const { data: mensalidades } = await supabase.from("mensalidades").select("*").eq("status", "pendente")
    const alertas = mensalidades?.length || 0

    // Turmas
    const { data: turmas } = await supabase.from("turmas").select("*")
    const totalTurmas = turmas?.length || 0

    setStats({ ativos, inativos, alertas, turmas: totalTurmas })

    // Alunos por turma (via matriculas)
    const { data: matriculas } = await supabase.from("matriculas").select("*, turmas(nome)")
    const turmaCount: any = {}
    matriculas?.forEach((m: any) => {
      const nome = m.turmas?.nome || "Sem turma"
      turmaCount[nome] = (turmaCount[nome] || 0) + 1
    })
    const turmaArray = Object.keys(turmaCount).map(nome => ({ nome, alunos: turmaCount[nome] }))
    setTurmasList(turmaArray)

    // Alunos por modalidade (via turma -> modalidade)
    const { data: turmasComModalidade } = await supabase.from("turmas").select("*, modalidades(nome)")
    const modalidadeCount: any = {}
    for (const turma of turmasComModalidade || []) {
      const modalidadeNome = turma.modalidades?.nome || "Sem modalidade"
      const { count } = await supabase
        .from("matriculas")
        .select("*", { count: "exact", head: true })
        .eq("turma_id", turma.id)
      modalidadeCount[modalidadeNome] = (modalidadeCount[modalidadeNome] || 0) + (count || 0)
    }
    const modalidadeArray = Object.keys(modalidadeCount).map(nome => ({ nome, qtd: modalidadeCount[nome] }))
    setModalidadesList(modalidadeArray)
  }

  const cards = [
    { title: "Alunos Ativos", value: stats.ativos, icon: Users, color: "text-green-600" },
    { title: "Alunos Inativos", value: stats.inativos, icon: Users, color: "text-gray-500" },
    { title: "Alertas", value: stats.alertas, icon: AlertTriangle, color: "text-red-500" },
    { title: "Turmas", value: stats.turmas, icon: Layers, color: "text-blue-500" },
  ]

  const maxTurma = Math.max(...turmasList.map(t => t.alunos), 1)
  const maxModalidade = Math.max(...modalidadesList.map(m => m.qtd), 1)

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold mb-6">Visão Geral</h2>

      <div className="grid md:grid-cols-4 gap-4 mb-8">
        {cards.map((card, i) => (
          <div key={i} className="bg-white rounded-xl shadow p-4 flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm">{card.title}</p>
              <p className="text-3xl font-bold">{card.value}</p>
            </div>
            <card.icon className={`w-8 h-8 ${card.color}`} />
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Alunos por Turma */}
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="font-semibold mb-3">Alunos por Turma</h3>
          {turmasList.length === 0 ? (
            <p className="text-gray-400">Nenhum aluno matriculado em turma</p>
          ) : (
            turmasList.map((t, i) => (
              <div key={i} className="mb-2">
                <div className="flex justify-between text-sm">
                  <span>{t.nome}</span>
                  <span>{t.alunos}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-red-500 h-2 rounded-full" style={{ width: `${(t.alunos / maxTurma) * 100}%` }} />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Distribuição por Modalidade */}
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="font-semibold mb-3">Distribuição por Modalidade</h3>
          {modalidadesList.length === 0 ? (
            <p className="text-gray-400">Nenhum aluno vinculado a modalidade</p>
          ) : (
            modalidadesList.map((m, i) => (
              <div key={i} className="mb-2">
                <div className="flex justify-between text-sm">
                  <span>{m.nome}</span>
                  <span>{m.qtd}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-red-500 h-2 rounded-full" style={{ width: `${(m.qtd / maxModalidade) * 100}%` }} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}