"use client"

import { useData } from "@/hooks/useData"
import { useStore } from "@/lib/store"

export default function Page() {
  useData()

  const { alunos } = useStore()

  const ativos = alunos.filter((a) => a.ativo === true).length
  const inativos = alunos.filter((a) => a.ativo === false).length
  const total = alunos.length

  return (
    <div className="p-6 text-white bg-black min-h-screen">
      <h1 className="text-3xl font-bold text-red-500 mb-6">
        Dashboard CT Okinawa
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Ativos */}
        <div className="bg-zinc-900 border border-red-500 rounded-xl p-4">
          <p className="text-gray-400">Alunos Ativos</p>
          <h2 className="text-2xl text-green-400 font-bold">{ativos}</h2>
        </div>

        {/* Inativos */}
        <div className="bg-zinc-900 border border-red-500 rounded-xl p-4">
          <p className="text-gray-400">Alunos Inativos</p>
          <h2 className="text-2xl text-red-400 font-bold">{inativos}</h2>
        </div>

        {/* Total */}
        <div className="bg-zinc-900 border border-red-500 rounded-xl p-4">
          <p className="text-gray-400">Total de Alunos</p>
          <h2 className="text-2xl font-bold">{total}</h2>
        </div>

        {/* Turmas (placeholder por enquanto) */}
        <div className="bg-zinc-900 border border-red-500 rounded-xl p-4">
          <p className="text-gray-400">Turmas</p>
          <h2 className="text-2xl font-bold">-</h2>
        </div>
      </div>
    </div>
  )
}