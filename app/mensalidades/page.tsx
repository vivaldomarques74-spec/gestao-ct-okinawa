"use client"

import { useState, useEffect } from "react"
import { supabase } from "../../lib/supabase"
import { aplicarDescontoCampanha } from "../../lib/descontos"

export default function Mensalidades() {
  const [busca, setBusca] = useState("")
  const [alunos, setAlunos] = useState<any[]>([])
  const [mensalidades, setMensalidades] = useState<any[]>([])
  const [selecionado, setSelecionado] = useState<any>(null)
  const [formaPagamento, setFormaPagamento] = useState("Pix")
  const [tipoCartao, setTipoCartao] = useState("Crédito")
  const [parcelas, setParcelas] = useState("1x")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    carregarAlunos()
  }, [])

  async function carregarAlunos() {
    const { data } = await supabase.from("alunos").select("*").order("nome")
    setAlunos(data || [])
  }

  async function buscarMensalidades(alunoId: string) {
    const { data } = await supabase
      .from("mensalidades")
      .select("*, matriculas(turmas(*, modalidades(*)))")
      .eq("aluno_id", alunoId)
      .eq("status", "pendente")
      .order("vencimento", { ascending: true })
    return data || []
  }

  async function selecionarAluno(aluno: any) {
    setSelecionado(aluno)
    const mens = await buscarMensalidades(aluno.id)
    setMensalidades(mens)
  }

  function calcularTotal() {
    let total = mensalidades.reduce((acc, m) => acc + Number(m.valor), 0)
    if (formaPagamento === "Pix" || formaPagamento === "Dinheiro") {
      total -= 10
    }
    return total > 0 ? total : 0
  }

  async function pagar() {
    if (!selecionado || mensalidades.length === 0) return
    const { data: caixaTurno } = await supabase.from("caixa_turno").select("*").eq("status", "aberto").maybeSingle()
    if (!caixaTurno) {
      alert("❌ Caixa não está aberto.")
      return
    }

    setLoading(true)
    const totalPago = calcularTotal()
    const valorBaseTotal = mensalidades.reduce((acc, m) => acc + Number(m.valor_base || m.valor), 0)

    // Registrar no caixa
    await supabase.from("caixa").insert([{
      caixa_turno_id: caixaTurno.id,
      tipo: "mensalidade",
      descricao: `Pagamento de mensalidade(s) de ${selecionado.nome}`,
      valor: totalPago,
      valor_base: valorBaseTotal,
      forma_pagamento: formaPagamento,
      tipo_cartao: formaPagamento === "Cartão" ? tipoCartao : null,
      parcelas: formaPagamento === "Cartão" && tipoCartao === "Crédito" ? parcelas : null,
      aluno_id: selecionado.id,
      data: new Date().toISOString(),
      cancelado: false,
    }])

    // Atualizar mensalidades pagas e gerar próximas com desconto de campanha
    for (const m of mensalidades) {
      // Marcar como paga
      await supabase.from("mensalidades").update({ 
        status: "pago", 
        data_pagamento: new Date().toISOString() 
      }).eq("id", m.id)

      // Gerar próxima mensalidade com desconto de campanha
      const proxVenc = new Date(m.vencimento)
      proxVenc.setMonth(proxVenc.getMonth() + 1)
      const valorOriginal = m.valor
      const { valorFinal } = await aplicarDescontoCampanha(selecionado.id, valorOriginal)

      await supabase.from("mensalidades").insert([{
        aluno_id: selecionado.id,
        matricula_id: m.matricula_id,
        vencimento: proxVenc.toISOString().slice(0,10),
        valor: valorFinal,
        valor_base: m.valor_base,
        status: "pendente",
      }])
    }

    gerarRecibo(selecionado, mensalidades, totalPago, formaPagamento, tipoCartao, parcelas)
    alert("✅ Pagamento realizado com sucesso!")
    setSelecionado(null)
    setMensalidades([])
    setLoading(false)
  }

  function formatarMesReferencia(dataVencimento: string) {
    const data = new Date(dataVencimento)
    const meses = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ]
    return `${meses[data.getMonth()]} de ${data.getFullYear()}`
  }

  function gerarRecibo(aluno: any, mensalidades: any[], totalPago: number, pagamento: string, cartao: string, parcelas: string) {
    const totalBase = mensalidades.reduce((a,b)=>a+Number(b.valor),0)
    const desconto = totalBase - totalPago
    const turmasTexto = mensalidades.map(m => {
      const turma = m.matriculas?.turmas
      const modalidadeNome = turma?.modalidades?.nome || "?"
      const turmaNome = turma?.nome || "?"
      return `${modalidadeNome} - ${turmaNome}`
    }).join(", ")
    
    const mesesReferentes = mensalidades.map(m => formatarMesReferencia(m.vencimento)).join(", ")

    const w = window.open("", "", "width=400,height=650")
    w?.document.write(`
      <html>
      <head>
        <title>Recibo de Mensalidade</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { width: 58mm; margin: 0 auto; padding: 2mm; font-family: monospace; font-size: 10pt; line-height: 1.2; }
          .logo { text-align: center; margin-bottom: 4px; }
          .logo img { max-width: 40mm; height: auto; }
          .titulo { text-align: center; font-weight: bold; font-size: 12pt; margin: 4px 0; }
          hr { border: none; border-top: 1px dashed #000; margin: 4px 0; }
          .total { font-weight: bold; font-size: 11pt; }
          .verse { text-align: center; margin-top: 8px; font-style: italic; }
          .center { text-align: center; }
        </style>
      </head>
      <body>
        <div class="logo"><img src="${window.location.origin}/logo.png" /></div>
        <div class="titulo">CT OKINAWA</div>
        <div class="center">Disciplina • Respeito • Evolução</div>
        <hr/>
        <div><b>RECIBO DE MENSALIDADE</b></div>
        <hr/>
        <div><b>Aluno:</b> ${aluno.nome}</div>
        <div><b>CPF:</b> ${aluno.cpf || '---'}</div>
        <div><b>Turmas:</b> ${turmasTexto}</div>
        <div><b>Mês(es) referente(s):</b> ${mesesReferentes}</div>
        <hr/>
        <div><b>Valor das mensalidades:</b> R$ ${totalBase.toFixed(2)}</div>
        <div><b>Desconto (Pix/Dinheiro):</b> R$ ${desconto.toFixed(2)}</div>
        <div class="total"><b>Total pago:</b> R$ ${totalPago.toFixed(2)}</div>
        <div><b>Pagamento:</b> ${pagamento} ${pagamento === "Cartão" ? `- ${cartao} ${parcelas}` : ""}</div>
        <hr/>
        <div>Data do pagamento: ${new Date().toLocaleDateString()} às ${new Date().toLocaleTimeString()}</div>
        <div class="verse">"Confie no Senhor"<br/>Provérbios 3:5</div>
        <div class="center">Obrigado! 🙏</div>
        <script>window.onload = () => { setTimeout(() => { window.print(); setTimeout(() => window.close(), 500); }, 200); }</script>
      </body>
      </html>
    `)
    w?.document.close()
  }

  const alunosFiltrados = alunos.filter(a => a.nome.toLowerCase().includes(busca.toLowerCase()))

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded-xl shadow">
      <h1 className="text-2xl font-bold mb-6">Pagamento de Mensalidades</h1>
      <input
        type="text"
        placeholder="Buscar aluno por nome..."
        className="w-full p-3 border rounded mb-4"
        value={busca}
        onChange={e => setBusca(e.target.value)}
      />
      <div className="grid md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-2 max-h-[600px] overflow-y-auto">
          {alunosFiltrados.map(aluno => (
            <div
              key={aluno.id}
              className="p-3 border-b cursor-pointer hover:bg-gray-100"
              onClick={() => selecionarAluno(aluno)}
            >
              <p className="font-semibold">{aluno.nome}</p>
              <p className="text-xs text-gray-500">CPF: {aluno.cpf || "---"}</p>
            </div>
          ))}
        </div>

        {selecionado && (
          <div className="border rounded-lg p-4">
            <h2 className="font-bold text-xl">{selecionado.nome}</h2>
            {mensalidades.length === 0 ? (
              <p className="text-gray-500 mt-2">Nenhuma mensalidade pendente.</p>
            ) : (
              <>
                <div className="mt-3 space-y-2">
                  {mensalidades.map(m => (
                    <div key={m.id} className="border-b pb-2">
                      <p><strong>Mês referente:</strong> {formatarMesReferencia(m.vencimento)}</p>
                      <p><strong>Vencimento:</strong> {new Date(m.vencimento).toLocaleDateString()}</p>
                      <p><strong>Valor:</strong> R$ {Number(m.valor).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <label className="block font-semibold mb-1">Forma de pagamento</label>
                  <select className="w-full p-2 border rounded" value={formaPagamento} onChange={e => setFormaPagamento(e.target.value)}>
                    <option>Pix</option>
                    <option>Dinheiro</option>
                    <option>Cartão</option>
                  </select>
                  {formaPagamento === "Cartão" && (
                    <>
                      <select className="w-full p-2 border rounded mt-2" value={tipoCartao} onChange={e => setTipoCartao(e.target.value)}>
                        <option>Débito</option>
                        <option>Crédito</option>
                      </select>
                      {tipoCartao === "Crédito" && (
                        <select className="w-full p-2 border rounded mt-2" value={parcelas} onChange={e => setParcelas(e.target.value)}>
                          <option>1x</option><option>2x</option><option>3x</option>
                        </select>
                      )}
                    </>
                  )}
                </div>
                <div className="bg-gray-100 p-3 rounded mt-4">
                  <p>Total das mensalidades: R$ {mensalidades.reduce((a,b)=>a+Number(b.valor),0).toFixed(2)}</p>
                  <p>Desconto (Pix/Dinheiro): R$ {(formaPagamento === "Pix" || formaPagamento === "Dinheiro") ? 10 : 0}</p>
                  <p className="font-bold text-lg">Total a pagar: R$ {calcularTotal().toFixed(2)}</p>
                </div>
                <button onClick={pagar} disabled={loading} className="w-full bg-red-600 text-white p-3 rounded mt-4">
                  {loading ? "Processando..." : "Confirmar Pagamento"}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}