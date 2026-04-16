"use client"

import { useData } from "@/hooks/useData"

export default function Page() {
  const { alunos = [], turmas = [], modalidades = [] } = useData()

  const ativos = alunos.filter((a:any)=>a.status==="ativo").length
  const inativos = alunos.filter((a:any)=>a.status==="inativo").length

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-500 text-white p-4 rounded">
          Alunos Ativos: {ativos}
        </div>
        <div className="bg-red-500 text-white p-4 rounded">
          Alunos Inativos: {inativos}
        </div>
      </div>

      <h2 className="mt-6 font-bold">Alunos por Modalidade</h2>
      {modalidades.map((m:any)=>(
        <p key={m.nome}>
          {m.nome}: {alunos.filter((a:any)=>a.modalidades?.includes(m.nome)).length}
        </p>
      ))}

      <h2 className="mt-6 font-bold">Alunos por Turma</h2>
      {turmas.map((t:any)=>(
        <p key={t.id}>
          {t.nome}: {alunos.filter((a:any)=>a.turmaId==t.id).length}
        </p>
      ))}
    </div>
  )
}