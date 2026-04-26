"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Users, AlertTriangle, Layers } from "lucide-react"

export default function Dashboard() {
  const stats = [
    { title: "Alunos Ativos", value: 120, icon: Users },
    { title: "Alunos Inativos", value: 20, icon: Users },
    { title: "Alertas", value: 8, icon: AlertTriangle },
    { title: "Turmas", value: 6, icon: Layers },
  ]

  const turmas = [
    { nome: "Infantil", alunos: 40 },
    { nome: "Adulto", alunos: 60 },
    { nome: "Avançado", alunos: 20 },
  ]

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6">Visão Geral</h2>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {stats.map((s, i) => (
          <Card
            key={i}
            className="bg-zinc-900 border border-red-900 hover:border-red-600 transition"
          >
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">{s.title}</p>
                <p className="text-xl font-bold">{s.value}</p>
              </div>
              <s.icon className="text-red-500" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-zinc-900 border border-red-900">
          <CardContent className="p-6">
            <h3 className="mb-4 text-zinc-300">Alunos por Turma</h3>

            <div className="space-y-4">
              {turmas.map((t, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{t.nome}</span>
                    <span>{t.alunos}</span>
                  </div>

                  <div className="w-full bg-zinc-800 rounded-full h-2">
                    <div
                      className="bg-red-600 h-2 rounded-full"
                      style={{
                        width: `${t.alunos}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border border-red-900">
          <CardContent className="p-6">
            <h3 className="mb-4 text-zinc-300">
              Distribuição por Modalidade
            </h3>

            <p className="text-zinc-400">
              (em breve com dados reais)
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}