"use client"

import { useData } from "@/hooks/useData"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

export default function Page() {
  console.log("PAGE RENDERIZOU")

  const { alunos = [], turmas = [], modalidades = [] } = useData()

  console.log("ALUNOS:", alunos)

  const ativos = alunos.filter((a: any) => a.ativo).length
  const inativos = alunos.filter((a: any) => !a.ativo).length

  const dadosModalidades = modalidades.map((m: any) => ({
    nome: m.nome,
    alunos: alunos.filter(
      (a: any) =>
        (a.modalidade || a.disciplina) === m.nome
    ).length,
  }))

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 space-y-6">

      {/* DEBUG VISUAL */}
      <pre className="text-xs bg-black p-2 rounded">
        {JSON.stringify(alunos, null, 2)}
      </pre>

      {/* TÍTULO */}
      <h1 className="text-3xl font-bold text-red-500 tracking-wide">
        Dashboard CT Okinawa
      </h1>

      {/* CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

        <div className="bg-zinc-900 border border-red-500/20 shadow-lg rounded-xl p-4">
          <p className="text-gray-400 text-sm">Alunos Ativos</p>
          <h2 className="text-3xl font-bold text-green-400">{ativos}</h2>
        </div>

        <div className="bg-zinc-900 border border-red-500/20 shadow-lg rounded-xl p-4">
          <p className="text-gray-400 text-sm">Alunos Inativos</p>
          <h2 className="text-3xl font-bold text-red-400">{inativos}</h2>
        </div>

        <div className="bg-zinc-900 border border-red-500/20 shadow-lg rounded-xl p-4">
          <p className="text-gray-400 text-sm">Total de Alunos</p>
          <h2 className="text-3xl font-bold">{alunos.length}</h2>
        </div>

        <div className="bg-zinc-900 border border-red-500/20 shadow-lg rounded-xl p-4">
          <p className="text-gray-400 text-sm">Turmas</p>
          <h2 className="text-3xl font-bold">{turmas.length}</h2>
        </div>

      </div>

      {/* GRÁFICO */}
      <div className="bg-zinc-900 border border-red-500/20 shadow-lg rounded-xl p-4">
        <h2 className="font-bold mb-4 text-red-400">
          Alunos por Modalidade
        </h2>

        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dadosModalidades}>
              <XAxis stroke="#aaa" dataKey="nome" />
              <YAxis stroke="#aaa" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#18181b",
                  border: "1px solid #ef4444",
                }}
                labelStyle={{ color: "#fff" }}
              />
              <Bar dataKey="alunos" fill="#ef4444" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* LISTAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* MODALIDADES */}
        <div className="bg-zinc-900 border border-red-500/20 shadow-lg rounded-xl p-4">
          <h2 className="font-bold mb-3 text-red-400">Modalidades</h2>

          {modalidades.map((m: any) => {
            const total = alunos.filter(
              (a: any) =>
                (a.modalidade || a.disciplina) === m.nome
            ).length

            return (
              <div
                key={m.nome}
                className="flex justify-between border-b border-zinc-800 py-1 text-sm"
              >
                <span>{m.nome}</span>
                <span
                  className={
                    total === 0 ? "text-red-500" : "text-gray-400"
                  }
                >
                  {total}
                </span>
              </div>
            )
          })}
        </div>

        {/* TURMAS */}
        <div className="bg-zinc-900 border border-red-500/20 shadow-lg rounded-xl p-4">
          <h2 className="font-bold mb-3 text-red-400">Turmas</h2>

          {turmas.map((t: any) => {
            const total = alunos.filter(
              (a: any) => a.turma === t.nome
            ).length

            return (
              <div
                key={t.id}
                className="flex justify-between border-b border-zinc-800 py-1 text-sm"
              >
                <span>{t.nome}</span>
                <span
                  className={
                    total === 0 ? "text-red-500" : "text-gray-400"
                  }
                >
                  {total}
                </span>
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}