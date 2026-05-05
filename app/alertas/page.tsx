"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"

// Definição do tipo de um item de alerta
type AlertaItem = {
  id: string
  nome: string
  telefone: string
  vencimento: string
}

// Definição dos grupos de alerta
type GruposAlertas = {
  "🔵 5 dias antes": AlertaItem[]
  "🟢 2 dias antes": AlertaItem[]
  "🟡 Vence hoje": AlertaItem[]
  "🟠 Vencido há 2 dias": AlertaItem[]
  "🔴 Vencido há 5 dias (BLOQUEIO)": AlertaItem[]
}

export default function Alertas() {
  const [alertas, setAlertas] = useState<GruposAlertas>({
    "🔵 5 dias antes": [],
    "🟢 2 dias antes": [],
    "🟡 Vence hoje": [],
    "🟠 Vencido há 2 dias": [],
    "🔴 Vencido há 5 dias (BLOQUEIO)": []
  })

  useEffect(() => {
    carregarAlertas()
  }, [])

  async function carregarAlertas() {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    // Buscar mensalidades pendentes com dados do aluno
    const { data: mensalidades, error } = await supabase
      .from("mensalidades")
      .select(`
        id,
        vencimento,
        alunos (
          id,
          nome,
          whatsapp,
          whatsapp_responsavel
        )
      `)
      .eq("status", "pendente")

    if (error) {
      console.error("Erro ao buscar mensalidades:", error)
      return
    }

    // Reiniciar grupos
    const novosGrupos: GruposAlertas = {
      "🔵 5 dias antes": [],
      "🟢 2 dias antes": [],
      "🟡 Vence hoje": [],
      "🟠 Vencido há 2 dias": [],
      "🔴 Vencido há 5 dias (BLOQUEIO)": []
    }

    mensalidades?.forEach((mensalidade) => {
      const aluno = mensalidade.alunos as any
      if (!aluno) return

      const vencimento = new Date(mensalidade.vencimento)
      vencimento.setHours(0, 0, 0, 0)

      const diffEmDias = Math.floor((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))

      let grupo: keyof GruposAlertas | null = null
      if (diffEmDias === 5) grupo = "🔵 5 dias antes"
      else if (diffEmDias === 2) grupo = "🟢 2 dias antes"
      else if (diffEmDias === 0) grupo = "🟡 Vence hoje"
      else if (diffEmDias === -2) grupo = "🟠 Vencido há 2 dias"
      else if (diffEmDias === -5) grupo = "🔴 Vencido há 5 dias (BLOQUEIO)"

      if (grupo) {
        novosGrupos[grupo].push({
          id: aluno.id,
          nome: aluno.nome,
          telefone: aluno.whatsapp_responsavel || aluno.whatsapp || "Não informado",
          vencimento: mensalidade.vencimento
        })
      }
    })

    setAlertas(novosGrupos)
  }

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded-xl shadow">
      <h1 className="text-2xl font-bold mb-6">Central de Alertas - Inadimplência</h1>
      
      {Object.entries(alertas).map(([titulo, itens]) => (
        <div key={titulo} className="mb-8">
          <h2 className="text-xl font-semibold border-b pb-2 mb-3">{titulo}</h2>
          {itens.length === 0 ? (
            <p className="text-gray-400 text-sm italic">Nenhum aluno neste período.</p>
          ) : (
            <div className="space-y-2">
              {itens.map((item) => (
                <div key={item.id} className="bg-gray-50 p-3 rounded flex justify-between items-center">
                  <div>
                    <p className="font-bold">{item.nome}</p>
                    <p className="text-sm text-gray-600">Vencimento: {new Date(item.vencimento).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">📱 {item.telefone}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}