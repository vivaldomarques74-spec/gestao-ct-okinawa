"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import { MessageCircle, AlertTriangle, CheckCircle } from "lucide-react"

type AlertaItem = {
  id: string
  aluno_nome: string
  aluno_menor: boolean
  responsavel_nome: string | null
  telefone: string
  vencimento: string
  valor: number
  diasDiferenca: number
  jaAvisado: boolean
  dataAviso: string | null
}

export default function Alertas() {
  const [alertas, setAlertas] = useState<{ [key: string]: AlertaItem[] }>({
    "🚫 Bloqueio (Mais de 5 dias atrasado)": [],
    "🚨 Atrasado 2 a 4 dias": [],
    "🔴 Vence hoje": [],
    "🟠 Vence em 2 dias": [],
    "🟡 Vence em 5 dias": []
  })

  useEffect(() => {
    carregarAlertas()
  }, [])

  async function carregarAlertas() {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    const { data: mensalidades, error } = await supabase
      .from("mensalidades")
      .select(`*, alunos ( id, nome, menor, responsavel_nome, whatsapp, whatsapp_responsavel )`)
      .eq("status", "pendente")

    if (error) {
      console.error("Erro ao buscar mensalidades:", error)
      return
    }

    const novosGrupos: any = {
      "🚫 Bloqueio (Mais de 5 dias atrasado)": [],
      "🚨 Atrasado 2 a 4 dias": [],
      "🔴 Vence hoje": [],
      "🟠 Vence em 2 dias": [],
      "🟡 Vence em 5 dias": []
    }

    mensalidades?.forEach((mensalidade) => {
      const aluno = mensalidade.alunos as any
      if (!aluno) return

      const vencimento = new Date(mensalidade.vencimento + "T12:00:00")
      vencimento.setHours(0, 0, 0, 0)
      const diffEmDias = Math.floor((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))

      // Agora filtramos para mostrar SÓ quem está atrasado ou vence nos próximos 5 dias
      let grupo = null
      if (diffEmDias <= -5) grupo = "🚫 Bloqueio (Mais de 5 dias atrasado)"
      else if (diffEmDias <= -2) grupo = "🚨 Atrasado 2 a 4 dias"
      else if (diffEmDias === 0) grupo = "🔴 Vence hoje"
      else if (diffEmDias === 2) grupo = "🟠 Vence em 2 dias"
      else if (diffEmDias === 5) grupo = "🟡 Vence em 5 dias"

      // Se não estiver nos grupos acima, ignora (não mostra as mensalidades de dezembro, janeiro, etc)
      if (grupo) {
        let telefoneContato = aluno.menor ? aluno.whatsapp_responsavel : aluno.whatsapp
        if (!telefoneContato) telefoneContato = aluno.whatsapp

        novosGrupos[grupo].push({
          id: mensalidade.id,
          aluno_nome: aluno.nome,
          aluno_menor: aluno.menor,
          responsavel_nome: aluno.responsavel_nome,
          telefone: telefoneContato || "Não informado",
          vencimento: mensalidade.vencimento,
          valor: Number(mensalidade.valor),
          diasDiferenca: diffEmDias,
          jaAvisado: !!mensalidade.ultimo_aviso_enviado,
          dataAviso: mensalidade.ultimo_aviso_enviado
        })
      }
    })

    setAlertas(novosGrupos)
  }

  async function enviarWhatsApp(item: AlertaItem) {
    if (item.telefone === "Não informado") return alert("Sem WhatsApp cadastrado.")
    
    let numeroLimpo = item.telefone.replace(/\D/g, "")
    if (!numeroLimpo.startsWith("55")) numeroLimpo = "55" + numeroLimpo

    const dataFormatada = new Date(item.vencimento + "T12:00:00").toLocaleDateString('pt-BR')
    const valorFormatado = item.valor.toFixed(2).replace('.', ',')
    
    const nomeSaudacao = item.aluno_menor && item.responsavel_nome ? item.responsavel_nome : item.aluno_nome
    const sujeitoMensalidade = item.aluno_menor ? `do(a) aluno(a) ${item.aluno_nome}` : `sua`
    
    let mensagem = ""

    if (item.diasDiferenca === 5) {
      mensagem = `Olá, ${nomeSaudacao}, tudo bem? 🥋\n\nPassando para lembrar que a mensalidade ${sujeitoMensalidade} de R$ ${valorFormatado} vence no dia ${dataFormatada} (daqui a 5 dias)!\n\nPara manter tudo em dia...`
    } else if (item.diasDiferenca === 2) {
      mensagem = `Olá, ${nomeSaudacao}! Tudo bem? 😊\n\nO vencimento está se aproximando! Daqui a 2 dias (dia ${dataFormatada}) vence a mensalidade ${sujeitoMensalidade}...`
    } else if (item.diasDiferenca === 0) {
      mensagem = `Olá, ${nomeSaudacao}! Passando para lembrar que a mensalidade ${sujeitoMensalidade} vence hoje, ${dataFormatada}! 🥋\n\nPedimos que...`
    } else {
      mensagem = `Olá, ${nomeSaudacao}! Tudo bem?\n\nIdentificamos que a mensalidade ${sujeitoMensalidade} de R$ ${valorFormatado} do CT Okinawa está em aberto desde o dia ${dataFormatada}.\n\nPedimos que...`
    }

    const url = `https://wa.me/${numeroLimpo}?text=${encodeURIComponent(mensagem)}`
    window.open(url, "_blank")

    await supabase.from("mensalidades").update({ ultimo_aviso_enviado: new Date().toISOString() }).eq("id", item.id)
    carregarAlertas()
  }

  const totalPendencias = Object.values(alertas).reduce((acc, curr) => acc + curr.length, 0)

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded-xl shadow">
      <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
        <AlertTriangle className="text-red-600" /> Central de Alertas - Inadimplência
      </h1>
      <p className="text-gray-500 mb-6">Apenas mensalidades atrasadas ou a vencer nos próximos 5 dias. Total de <b>{totalPendencias}</b> em alerta.</p>
      
      {Object.entries(alertas).map(([titulo, itens]) => {
        if (itens.length === 0) return null;
        
        return (
          <div key={titulo} className="mb-8">
            <h2 className="text-xl font-semibold border-b pb-2 mb-3">{titulo} ({itens.length})</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {itens.map((item) => (
                <div key={item.id} className={`p-4 rounded-xl border shadow-sm flex flex-col justify-between ${
                  titulo.includes("Bloqueio") ? "bg-red-50 border-red-300" : 
                  titulo.includes("Atrasado") ? "bg-orange-50 border-orange-300" :
                  "bg-white border-gray-200"
                }`}>
                  <div>
                    <p className="font-bold text-gray-800 text-lg">{item.aluno_nome}</p>
                    {item.aluno_menor && item.responsavel_nome && (
                      <p className="text-xs text-gray-500 font-medium">Resp: {item.responsavel_nome}</p>
                    )}
                    <p className="text-sm text-gray-600 mt-1">Vencimento: {new Date(item.vencimento + "T12:00:00").toLocaleDateString()}</p>
                    <p className="text-sm font-semibold text-gray-700">Valor: R$ {item.valor.toFixed(2)}</p>
                    
                    {item.jaAvisado && (
                      <div className="mt-2 flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 w-fit px-2 py-1 rounded">
                        <CheckCircle size={12} /> 
                        Avisado: {new Date(item.dataAviso!).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => enviarWhatsApp(item)}
                    className={`mt-4 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition ${
                      item.jaAvisado ? "bg-gray-500 hover:bg-gray-600" : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
                    <MessageCircle size={18} /> 
                    {item.jaAvisado ? "Reenviar WhatsApp" : "Enviar WhatsApp"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )
      })}
      
      {totalPendencias === 0 && (
        <p className="text-center text-gray-500 py-10">Nenhuma mensalidade vencendo nos próximos dias. Tudo tranquilo! 🎉</p>
      )}
    </div>
  )
}