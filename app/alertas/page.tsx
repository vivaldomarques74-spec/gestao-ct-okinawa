"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"

export default function Alertas() {
  const [dados, setDados] = useState<any[]>([])

  const carregar = async () => {
    const { data, error } = await supabase
      .from("mensalidades")
      .select("*")
      .eq("status", "pendente")

    if (error) {
      console.log(error)
      return
    }

    if (!data) return

    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    const lista = await Promise.all(
      data.map(async (m: any) => {
        const venc = new Date(m.vencimento + "T00:00:00")
        venc.setHours(0, 0, 0, 0)

        const diff = Math.floor(
          (venc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
        )

        let alerta = ""

        if (diff === 5) alerta = "🟡 5 dias"
        else if (diff === 2) alerta = "🟠 2 dias"
        else if (diff === 0) alerta = "🟠 vence hoje"
        else if (diff < 0 && diff >= -5) alerta = "🔴 atrasado"

        // 🔥 BUSCA O ALUNO AQUI (GARANTE QUE FUNCIONA)
        const { data: aluno } = await supabase
          .from("alunos")
          .select("whatsapp, whatsapp_responsavel")
          .eq("id", m.aluno_id)
          .single()

        return {
          ...m,
          alerta,
          telefone:
            aluno?.whatsapp_responsavel ||
            aluno?.whatsapp ||
            "Sem número",
        }
      })
    )

    const filtrado = lista.filter((a) => a.alerta !== "")

    setDados(filtrado)
  }

  useEffect(() => {
    carregar()
  }, [])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Central de Alertas</h1>

      {dados.length === 0 && (
        <p className="text-gray-500">
          Nenhum aluno com pendência no momento
        </p>
      )}

      <div className="space-y-3">
        {dados.map((a, i) => (
          <div
            key={i}
            className="bg-white p-4 rounded shadow text-black border-l-4"
            style={{
              borderColor:
                a.alerta.includes("atrasado") ? "red" :
                a.alerta.includes("vence") ? "orange" :
                a.alerta.includes("2 dias") ? "orange" :
                "yellow",
            }}
          >
            <p className="font-bold">{a.nome}</p>

            <p>📅 {new Date(a.vencimento).toLocaleDateString()}</p>

            <p>📱 {a.telefone}</p>

            <p className="mt-2 font-semibold">{a.alerta}</p>
          </div>
        ))}
      </div>
    </div>
  )
}