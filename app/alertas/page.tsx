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
    "🟡 5 dias antes": [],
    "🟠 2 dias antes": [],
    "🔴 Vence hoje": [],
    "🚨 Atrasado 2 dias": [],
    "🚫 Bloqueio (5 dias)": []
  })

  useEffect(() => {
    carregarAlertas()
  }, [])

  async function carregarAlertas() {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)

    // Agora puxamos também o 'menor' e o 'responsavel_nome'
    const { data: mensalidades, error } = await supabase
      .from("mensalidades")
      .select(`
        id,
        valor,
        vencimento,
        ultimo_aviso_enviado,
        alunos ( id, nome, menor, responsavel_nome, whatsapp, whatsapp_responsavel )
      `)
      .eq("status", "pendente")

    if (error) {
      console.error("Erro ao buscar mensalidades:", error)
      return
    }

    const novosGrupos: any = {
      "🟡 5 dias antes": [],
      "🟠 2 dias antes": [],
      "🔴 Vence hoje": [],
      "🚨 Atrasado 2 dias": [],
      "🚫 Bloqueio (5 dias)": []
    }

    mensalidades?.forEach((mensalidade) => {
      const aluno = mensalidade.alunos as any
      if (!aluno) return

      const vencimento = new Date(mensalidade.vencimento)
      vencimento.setHours(0, 0, 0, 0)

      const diffEmDias = Math.floor((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))

      let grupo: keyof typeof novosGrupos | null = null
      if (diffEmDias === 5) grupo = "🟡 5 dias antes"
      else if (diffEmDias === 2) grupo = "🟠 2 dias antes"
      else if (diffEmDias === 0) grupo = "🔴 Vence hoje"
      else if (diffEmDias === -2) grupo = "🚨 Atrasado 2 dias"
      else if (diffEmDias <= -5) grupo = "🚫 Bloqueio (5 dias)"

      if (grupo) {
        // Se for menor, tenta o whatsapp do responsável. Se não, tenta o do aluno.
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
    if (item.telefone === "Não informado") {
      return alert("Este aluno/responsável não possui WhatsApp cadastrado.")
    }

    const numeroLimpo = item.telefone.replace(/\D/g, "")
    const dataFormatada = new Date(item.vencimento).toLocaleDateString('pt-BR')
    const valorFormatado = item.valor.toFixed(2).replace('.', ',')
    
    // Variáveis de saudação inteligente
    const nomeSaudacao = item.aluno_menor && item.responsavel_nome ? item.responsavel_nome : item.aluno_nome
    const sujeitoMensalidade = item.aluno_menor ? `do(a) aluno(a) ${item.aluno_nome}` : `sua`
    
    let mensagem = ""

    if (item.diasDiferenca === 5) {
      mensagem = `Olá, ${nomeSaudacao}, tudo bem? 🥋\n\nPassando para lembrar que a mensalidade ${sujeitoMensalidade} de R$ ${valorFormatado} vence no dia ${dataFormatada} (daqui a 5 dias)!\n\nPara manter tudo em dia e continuar aproveitando nossos treinos, programe-se para realizar o pagamento dentro do prazo.\n\nQualquer dúvida, estamos à disposição!\n\nCT Okinawa – Disciplina, respeito e evolução!`
    } else if (item.diasDiferenca === 2) {
      mensagem = `Olá, ${nomeSaudacao}! Tudo bem? 😊\n\nO vencimento está se aproximando! Daqui a 2 dias (dia ${dataFormatada}) vence a mensalidade ${sujeitoMensalidade} de R$ ${valorFormatado} do CT Okinawa.\n\nNão deixe para a última hora. Organize seu pagamento e continue treinando com a gente!\n\nContamos com você! 🥋`
    } else if (item.diasDiferenca === 0) {
      mensagem = `Olá, ${nomeSaudacao}! Passando para lembrar que a mensalidade ${sujeitoMensalidade} de R$ ${valorFormatado} do CT Okinawa vence hoje, ${dataFormatada}! 🥋\n\nPedimos que, por gentileza, realize o pagamento ainda hoje para manter sua situação financeira regularizada.\n\nSe já efetuou o pagamento, por favor, desconsidere esta mensagem.\n\nObrigado pela atenção!\n\nEquipe CT Okinawa.`
    } else if (item.diasDiferenca === -2) {
      mensagem = `Olá, ${nomeSaudacao}! Tudo bem?\n\nIdentificamos que a mensalidade ${sujeitoMensalidade} de R$ ${valorFormatado} do CT Okinawa está em aberto desde o dia ${dataFormatada} (há 2 dias).\n\nPedimos que regularize o pagamento assim que possível para evitar pendências e garantir a continuidade dos seus treinos.\n\nCaso já tenha realizado o pagamento, basta nos encaminhar o comprovante.\n\nEstamos à disposição! 🥋\n\nEquipe CT Okinawa.`
    } else if (item.diasDiferenca <= -5) {
      mensagem = `Olá, ${nomeSaudacao}!\n\nVerificamos que a mensalidade ${sujeitoMensalidade} de R$ ${valorFormatado} do CT Okinawa está em atraso desde o dia ${dataFormatada} (há 5 dias).\n\n⚠️ Informamos que, conforme nossa política de pagamentos, a permanência da pendência poderá ocasionar o bloqueio temporário do acesso aos treinos.\n\nPedimos que regularize sua situação o quanto antes para evitar a suspensão do acesso.\n\nSe já realizou o pagamento, envie o comprovante para nossa equipe.\n\nContamos com sua compreensão!\n\nEquipe CT Okinawa.`
    }

    const url = `https://wa.me/55${numeroLimpo}?text=${encodeURIComponent(mensagem)}`
    window.open(url, "_blank")

    await supabase
      .from("mensalidades")
      .update({ ultimo_aviso_enviado: new Date().toISOString() })
      .eq("id", item.id)

    carregarAlertas()
  }

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded-xl shadow">
      <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
        <AlertTriangle className="text-red-600" /> Central de Alertas - Inadimplência
      </h1>
      <p className="text-gray-500 mb-6">Acompanhe os vencimentos e envie as mensagens pelo WhatsApp oficial.</p>
      
      {Object.entries(alertas).map(([titulo, itens]) => {
        if (itens.length === 0) return null;
        
        return (
          <div key={titulo} className="mb-8">
            <h2 className="text-xl font-semibold border-b pb-2 mb-3">{titulo}</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {itens.map((item) => (
                <div key={item.id} className={`p-4 rounded-xl border shadow-sm flex flex-col justify-between ${
                  titulo.includes("Bloqueio") ? "bg-red-50 border-red-300" : 
                  titulo.includes("Atrasado") ? "bg-orange-50 border-orange-300" :
                  "bg-gray-50 border-gray-200"
                }`}>
                  <div>
                    <p className="font-bold text-gray-800 text-lg">{item.aluno_nome}</p>
                    {item.aluno_menor && item.responsavel_nome && (
                      <p className="text-xs text-gray-500 font-medium">Resp: {item.responsavel_nome}</p>
                    )}
                    <p className="text-sm text-gray-600 mt-1">Vencimento: {new Date(item.vencimento).toLocaleDateString()}</p>
                    <p className="text-sm font-semibold text-gray-700">Valor: R$ {item.valor.toFixed(2)}</p>
                    
                    {item.jaAvisado && (
                      <div className="mt-2 flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 w-fit px-2 py-1 rounded">
                        <CheckCircle size={12} /> 
                        Avisado: {new Date(item.dataAviso!).toLocaleDateString()} às {new Date(item.dataAviso!).toLocaleTimeString()}
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

      {Object.values(alertas).every(arr => arr.length === 0) && (
        <p className="text-center text-gray-500 py-10">Nenhum aluno com pendência no momento.</p>
      )}
    </div>
  )
}