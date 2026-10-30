"use client"

import { useState, useEffect } from "react"
import { supabase } from "../../lib/supabase"
import { calcularDescontosMensalidade } from "../../lib/descontos"
import { Lock, RefreshCw } from "lucide-react"

export default function Mensalidades() {
  const [busca, setBusca] = useState("")
  const [alunos, setAlunos] = useState<any[]>([])
  const [selecionado, setSelecionado] = useState<any>(null)
  const [pendentes, setPendentes] = useState<any[]>([])
  const [pagas, setPagas] = useState<any[]>([])
  const [selecionadasParaPagar, setSelecionadasParaPagar] = useState<string[]>([])
  
  const [aba, setAba] = useState<"pendentes" | "pagas">("pendentes")
  const [formaPagamento, setFormaPagamento] = useState("Pix")
  const [tipoCartao, setTipoCartao] = useState("Crédito")
  const [parcelas, setParcelas] = useState("1x")
  const [codigoPagamento, setCodigoPagamento] = useState("")
  const [loading, setLoading] = useState(false)

  const [showDescDiretoria, setShowDescDiretoria] = useState(false)
  const [senhaDiretor, setSenhaDiretor] = useState("")
  const [descValor, setDescValor] = useState("")

  useEffect(() => { carregarAlunos() }, [])

  async function carregarAlunos() {
    const { data } = await supabase.from("alunos").select("*, escolas(nome, tipo_desconto, valor_desconto)").order("nome")
    setAlunos(data || [])
  }

  async function selecionarAluno(aluno: any) {
    setSelecionado(aluno)
    setAba("pendentes")
    setCodigoPagamento("")
    setShowDescDiretoria(false)
    setSenhaDiretor("")
    
    const { data } = await supabase
      .from("mensalidades")
      .select("*, matriculas(turmas(*, modalidades(*)))")
      .eq("aluno_id", aluno.id)
      .in("status", ["pendente", "pago", "isento"])
      .order("vencimento", { ascending: true })

    const todas = data || []
    const pend = todas.filter(m => m.status === "pendente" || m.status === "isento")
    const pg = todas.filter(m => m.status === "pago").reverse() 

    setPendentes(pend)
    setPagas(pg)
    
    if (pend.length > 0) setSelecionadasParaPagar([pend[0].id])
    else setSelecionadasParaPagar([])

    // Se não existir NENHUMA mensalidade no banco para este aluno, gera automaticamente
    if (todas.length === 0) {
      await gerarMensalidadesAutomatico(aluno)
    }
  }

  async function gerarMensalidadesAutomatico(aluno: any) {
    if (aluno.status !== "ativo") return;

    setLoading(true)
    const { data: mats, error } = await supabase.from("matriculas").select("*, turmas(*, modalidades(*))").eq("aluno_id", aluno.id).eq("status", "ativo")
    
    if (error || !mats || mats.length === 0) {
      setLoading(false)
      return; 
    }

    const hoje = new Date()
    const diaVencimento = hoje.getDate()
    let novasMensalidades = []

    for (const mat of mats) {
      const turma = mat.turmas
      let valorOriginal = turma?.modalidades?.valor_geral || 0
      const valorBase = turma?.modalidades?.valor_base || 0

      if (aluno.escola_id) {
        const { data: escola } = await supabase.from("escolas").select("*").eq("id", aluno.escola_id).single()
        if (escola) {
          const descEscola = escola.tipo_desconto === "percentual" ? valorOriginal * (escola.valor_desconto / 100) : escola.valor_desconto;
          valorOriginal = Math.max(0, valorOriginal - descEscola);
        }
      }

      for (let i = 1; i <= 12; i++) {
        const vencimento = new Date(hoje.getFullYear(), hoje.getMonth() + i, diaVencimento)
        const vencimentoStr = vencimento.toLocaleDateString('en-CA') 
        
        const { valorFinal: valorComDesconto, isento } = await calcularDescontosMensalidade(aluno.id, valorOriginal)

        // 👇 Ignora geração se for isento ou valor zerado
        if (isento || valorComDesconto <= 0) continue;

        novasMensalidades.push({
          aluno_id: aluno.id, 
          matricula_id: mat.id, 
          vencimento: vencimentoStr,
          valor: valorComDesconto, 
          valor_base: valorBase, 
          status: "pendente",
          mes_referente: vencimento.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
        })
      }
    }

    if (novasMensalidades.length > 0) {
      await supabase.from("mensalidades").insert(novasMensalidades)
      
      const { data } = await supabase
        .from("mensalidades")
        .select("*, matriculas(turmas(*, modalidades(*)))")
        .eq("aluno_id", aluno.id)
        .in("status", ["pendente", "pago", "isento"])
        .order("vencimento", { ascending: true })
      
      const todas = data || []
      setPendentes(todas.filter(m => m.status === "pendente" || m.status === "isento"))
      setPagas(todas.filter(m => m.status === "pago").reverse())
      if (todas.length > 0) setSelecionadasParaPagar([todas.find(m => m.status !== "pago")?.id].filter(Boolean))
    }

    setLoading(false)
  }

  function toggleSelecionada(id: string) {
    if (selecionadasParaPagar.includes(id)) setSelecionadasParaPagar(selecionadasParaPagar.filter(i => i !== id))
    else setSelecionadasParaPagar([...selecionadasParaPagar, id])
  }

  function calcularTotal() {
    const mensalidadesParaPagar = pendentes.filter(m => selecionadasParaPagar.includes(m.id) && m.status === "pendente")
    let total = mensalidadesParaPagar.reduce((acc, m) => acc + Number(m.valor), 0)
    if ((formaPagamento === "Pix" || formaPagamento === "Dinheiro") && total > 0) total -= 10
    return total > 0 ? total : 0
  }

  async function aplicarDescontoNaHora() {
    if (senhaDiretor !== "984215") return alert("❌ Senha de Diretoria incorreta.")
    if (!descValor) return alert("Digite o valor do desconto.")

    const valorDesconto = Number(descValor)
    setLoading(true)

    for (const mId of selecionadasParaPagar) {
      const m = pendentes.find(x => x.id === mId)
      if (!m) continue
      
      let novoValor = Math.max(0, Number(m.valor) - valorDesconto)
      await supabase.from("mensalidades").update({ 
        valor: novoValor, 
        status: novoValor === 0 ? "isento" : "pendente" 
      }).eq("id", mId)
    }

    alert("✅ Desconto aplicado!")
    setShowDescDiretoria(false)
    setDescValor("")
    setSenhaDiretor("")
    await selecionarAluno(selecionado)
    setLoading(false)
  }

  async function pagar() {
    if (selecionadasParaPagar.length === 0) return alert("Selecione pelo menos uma mensalidade.")
    if ((formaPagamento === "Pix" || formaPagamento === "Cartão") && !codigoPagamento.trim()) return alert("⚠️ Insira o código de autorização da maquininha.")
    
    const { data: caixaTurno } = await supabase.from("caixa_turno").select("*").eq("status", "aberto").maybeSingle()
    if (!caixaTurno) return alert("❌ Caixa não está aberto.")

    setLoading(true)
    const mensalidadesParaPagar = pendentes.filter(m => selecionadasParaPagar.includes(m.id) && m.status === "pendente")
    const totalPago = calcularTotal()
    const valorBaseTotal = mensalidadesParaPagar.reduce((acc, m) => acc + Number(m.valor_base || m.valor), 0)

    if (mensalidadesParaPagar.length > 0) {
      await supabase.from("caixa").insert([{
        caixa_turno_id: caixaTurno.id, tipo: "mensalidade", nome: `Mensalidade ${selecionado.nome}`,
        valor: totalPago, valor_base: valorBaseTotal, forma_pagamento: formaPagamento,
        tipo_cartao: formaPagamento === "Cartão" ? tipoCartao : null,
        parcelas: formaPagamento === "Cartão" && tipoCartao === "Crédito" ? parcelas : null,
        codigo_pagamento: codigoPagamento || null,
        aluno_id: selecionado.id, data: new Date().toISOString(), cancelado: false,
      }])

      for (const m of mensalidadesParaPagar) {
        await supabase.from("mensalidades").update({ status: "pago", data_pagamento: new Date().toISOString() }).eq("id", m.id)

        // Usamos T12:00:00 para evitar problemas de fuso horário ao virar o mês
        const proxVenc = new Date(m.vencimento + "T12:00:00")
        proxVenc.setMonth(proxVenc.getMonth() + 1)
        const proxVencStr = proxVenc.toLocaleDateString('en-CA') 
        
        const valorGeralModalidade = m.matriculas?.turmas?.modalidades?.valor_geral || m.valor

        let valorComDescontoEscola = valorGeralModalidade
        if (selecionado.escolas) {
          const descEscola = selecionado.escolas.tipo_desconto === 'percentual' ? valorGeralModalidade * (selecionado.escolas.valor_desconto / 100) : selecionado.escolas.valor_desconto;
          valorComDescontoEscola = Math.max(0, valorGeralModalidade - descEscola);
        }

        const { valorFinal, isento } = await calcularDescontosMensalidade(selecionado.id, valorComDescontoEscola)

        // 👇 Se o próximo mês for isento ou zero, não gera a próxima fatura
        if (isento || valorFinal <= 0) continue; 

        await supabase.from("mensalidades").insert([{
          aluno_id: selecionado.id, matricula_id: m.matricula_id, vencimento: proxVencStr,
          valor: valorFinal, valor_base: m.valor_base, status: "pendente",
          mes_referente: proxVenc.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
        }])
      }

      gerarRecibo(selecionado, mensalidadesParaPagar, totalPago, formaPagamento, tipoCartao, parcelas)
      alert("✅ Pagamento realizado!")
    } else {
      alert("Nenhuma mensalidade válida para pagamento foi selecionada.")
    }
    
    await selecionarAluno(selecionado)
    setLoading(false)
  }

  function formatarMesReferencia(dataVencimento: string | Date) {
    return new Date(dataVencimento + "T12:00:00").toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  }

  function gerarRecibo(aluno: any, mensalidades: any[], totalPago: number, pagamento: string, cartao: string, parcelas: string) {
    const totalBase = mensalidades.reduce((a,b)=>a+Number(b.valor),0)
    const desconto = totalBase - totalPago
    const turmasTexto = mensalidades.map(m => `${m.matriculas?.turmas?.modalidades?.nome} - ${m.matriculas?.turmas?.nome}`).join(", ")
    const mesesReferentes = mensalidades.map(m => formatarMesReferencia(m.vencimento)).join(", ")

    const w = window.open("", "", "width=400,height=650")
    w?.document.write(`
      <html><head><title>Recibo de Mensalidade</title><style>
      * { margin: 0; padding: 0; box-sizing: border-box; } body { width: 58mm; margin: 0 auto; padding: 2mm; font-family: monospace; font-size: 10pt; line-height: 1.2; }
      .logo { text-align: center; margin-bottom: 4px; } .logo img { max-width: 40mm; height: auto; } .titulo { text-align: center; font-weight: bold; font-size: 12pt; margin: 4px 0; }
      hr { border: none; border-top: 1px dashed #000; margin: 4px 0; } .total { font-weight: bold; font-size: 11pt; } .verse { text-align: center; margin-top: 8px; font-style: italic; } .center { text-align: center; }
      </style></head><body>
        <div class="logo"><img src="${window.location.origin}/logo.png" /></div>
        <div class="titulo">CT OKINAWA</div><div class="center">Disciplina • Respeito • Evolução</div><hr/>
        <div class="center"><b>RECIBO DE MENSALIDADE</b></div><hr/>
        <div><b>Aluno:</b> ${aluno.nome}</div><div><b>CPF:</b> ${aluno.cpf || '---'}</div>
        <div><b>Turmas:</b> ${turmasTexto}</div><div><b>Mês(es):</b> ${mesesReferentes}</div><hr/>
        <div><b>Valor Base:</b> R$ ${totalBase.toFixed(2)}</div><div><b>Desconto(s):</b> R$ ${desconto.toFixed(2)}</div>
        <div class="total"><b>Total pago:</b> R$ ${totalPago.toFixed(2)}</div>
        <div><b>Pagamento:</b> ${pagamento} ${pagamento === "Cartão" ? `- ${cartao} ${parcelas}` : ""}</div>
        ${codigoPagamento ? `<div><b>Cód. Autorização:</b> ${codigoPagamento}</div>` : ''}
        <hr/><div>Data do pagamento: ${new Date().toLocaleString()}</div>
        <div class="verse">"Confie no Senhor"<br/>Provérbios 3:5</div>
        <div class="center">Obrigado! 🙏</div>
        <script>window.onload = () => { setTimeout(() => { window.print(); setTimeout(() => window.close(), 500); }, 200); }</script>
      </body></html>
    `)
    w?.document.close()
  }

  function imprimirInforme() {
    if (pagas.length === 0) return alert("Nenhum pagamento registrado para este aluno.");
    
    const nomeEmissor = prompt("Digite seu nome para a assinatura:", "");
    if (nomeEmissor === null) return; 
    const funcaoEmissor = prompt("Digite sua função (ex: Secretária, Diretor):", "Secretaria");
    if (funcaoEmissor === null) return;

    const assinaturaNome = nomeEmissor.trim() || "___________________________";
    const assinaturaFuncao = funcaoEmissor.trim() || "Assinatura";

    const totalGeralPago = pagas.reduce((acc, m) => acc + Number(m.valor), 0);
    
    const linhasTabela = pagas.map(m => {
      const dataVenc = new Date(m.vencimento + "T12:00:00").toLocaleDateString('pt-BR');
      const dataPag = m.data_pagamento ? new Date(m.data_pagamento).toLocaleDateString('pt-BR') : "---";
      return `
        <tr>
          <td>${formatarMesReferencia(m.vencimento)}</td>
          <td>${dataVenc}</td>
          <td>${dataPag}</td>
          <td>R$ ${Number(m.valor).toFixed(2)}</td>
        </tr>
      `;
    }).join("");

    const w = window.open("", "", "width=800,height=800")
    w?.document.write(`
      <html>
      <head>
        <title>Informe de Pagamentos - A4</title>
        <style>
          @page { size: A4; margin: 20mm; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, Helvetica, sans-serif; color: #333; background: #fff; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #cc0000; padding-bottom: 20px; margin-bottom: 30px; }
          .header img { height: 80px; }
          .header-info { text-align: right; }
          .header-info h1 { font-size: 24px; color: #cc0000; margin-bottom: 5px; }
          .header-info p { font-size: 14px; color: #666; }
          .student-info { margin-bottom: 30px; background: #f9f9f9; padding: 15px; border-radius: 8px; border-left: 4px solid #cc0000;}
          .student-info p { margin-bottom: 5px; font-size: 16px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { background: #cc0000; color: #fff; padding: 12px; text-align: left; font-size: 14px; }
          td { padding: 12px; border-bottom: 1px solid #ddd; font-size: 14px; }
          tr:nth-child(even) { background: #f9f9f9; }
          .total-box { text-align: right; margin-bottom: 50px; }
          .total-box h2 { font-size: 22px; color: #333; }
          .total-box span { color: #cc0000; }
          .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 50px; border-top: 1px solid #ddd; padding-top: 20px; font-size: 12px; color: #888; }
          .signature { text-align: center; width: 300px; color: #333;}
          .signature-line { border-top: 1px solid #000; margin-bottom: 5px; margin-top: 40px;}
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="${window.location.origin}/logo.png" alt="Logo" />
          <div class="header-info">
            <h1>Extrato de Pagamentos</h1>
            <p>CT OKINAWA - Disciplina e Respeito</p>
            <p>Emitido em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
          </div>
        </div>

        <div class="student-info">
          <p><b>Aluno:</b> ${selecionado.nome}</p>
          <p><b>CPF:</b> ${selecionado.cpf || '---'}</p>
          <p><b>Nº Matrícula:</b> ${selecionado.numero_matricula || '---'}</p>
          ${selecionado.escolas ? `<p><b>Escola Parceira:</b> ${selecionado.escolas.nome}</p>` : ''}
        </div>

        <table>
          <thead>
            <tr><th>Mês Referência</th><th>Vencimento</th><th>Data do Pagamento</th><th>Valor</th></tr>
          </thead>
          <tbody>
            ${linhasTabela}
          </tbody>
        </table>

        <div class="total-box">
          <h2>Total Pago: <span>R$ ${totalGeralPago.toFixed(2)}</span></h2>
        </div>

        <div class="footer">
          <div>"Confie no Senhor de todo o seu coração"<br/>Provérbios 3:5</div>
          <div class="signature"><div class="signature-line"></div><b>${assinaturaNome}</b><br/>${assinaturaFuncao}</div>
        </div>

        <script>window.onload = () => { setTimeout(() => { window.print(); setTimeout(() => window.close(), 500); }, 300); }</script>
      </body>
      </html>
    `)
    w?.document.close()
  }

  const alunosFiltrados = alunos.filter(a => a.nome.toLowerCase().includes(busca.toLowerCase()))

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded-xl shadow">
      <h1 className="text-2xl font-bold mb-6">Pagamento de Mensalidades</h1>
      <input type="text" placeholder="Buscar aluno..." className="w-full p-3 border rounded mb-4" value={busca} onChange={e => setBusca(e.target.value)} />
      
      <div className="grid md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-2 max-h-150 overflow-y-auto">
          {alunosFiltrados.map(aluno => (
            <div key={aluno.id} className={`p-3 border-b cursor-pointer hover:bg-gray-100 ${selecionado?.id === aluno.id ? 'bg-red-50 border-l-4 border-red-500' : ''}`} onClick={() => selecionarAluno(aluno)}>
              <p className="font-semibold">{aluno.nome}</p>
              <p className="text-xs text-gray-500">Nº Matrícula: {aluno.numero_matricula || "---"}</p>
              <p className="text-xs text-gray-500">CPF: {aluno.cpf || "---"}</p>
            </div>
          ))}
        </div>

        {selecionado && (
          <div className="border rounded-lg p-4">
            <h2 className="font-bold text-xl mb-4">{selecionado.nome}</h2>
            
            <div className="flex justify-between items-center border-b mb-4">
              <div className="flex gap-2">
                <button className={`pb-2 px-2 font-semibold ${aba === "pendentes" ? "text-red-600 border-b-2 border-red-600" : "text-gray-500"}`} onClick={() => setAba("pendentes")}>A Vencer / Pendentes</button>
                <button className={`pb-2 px-2 font-semibold ${aba === "pagas" ? "text-red-600 border-b-2 border-red-600" : "text-gray-500"}`} onClick={() => setAba("pagas")}>Histórico (Pagas)</button>
              </div>
              {aba === "pagas" && pagas.length > 0 && (
                <button onClick={imprimirInforme} className="mb-2 bg-gray-800 text-white px-3 py-1 rounded text-sm hover:bg-gray-900">Imprimir Informe A4</button>
              )}
            </div>

            {aba === "pendentes" && (
              <>
                {pendentes.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-gray-500 mb-4">Nenhuma mensalidade pendente.</p>
                    {loading && <p className="text-sm text-blue-500"><RefreshCw size={16} className="animate-spin inline mr-2"/> Gerando mensalidades...</p>}
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 max-h-75 overflow-y-auto mb-4 pr-1">
                      {pendentes.map(m => {
                        const isSelected = selecionadasParaPagar.includes(m.id);
                        const isIsento = m.status === "isento";
                        return (
                          <label key={m.id} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer ${isSelected ? 'bg-red-50 border-red-300' : 'bg-gray-50'}`}>
                            <input 
                              type="checkbox" 
                              className="mt-1 w-4 h-4 text-red-600" 
                              checked={isSelected} 
                              onChange={() => toggleSelecionada(m.id)} 
                              disabled={isIsento} 
                            />
                            <div>
                              <p className="font-semibold">{formatarMesReferencia(m.vencimento)} {isIsento && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded ml-2">Isento</span>}</p>
                              <p className="text-xs text-gray-500">Vencimento: {new Date(m.vencimento + "T12:00:00").toLocaleDateString()}</p>
                              <p className="text-sm font-medium mt-1">Valor: R$ {Number(m.valor).toFixed(2)}</p>
                            </div>
                          </label>
                        )
                      })}
                    </div>

                    {!showDescDiretoria ? (
                      <button onClick={() => setShowDescDiretoria(true)} className="w-full bg-gray-200 text-gray-700 font-bold p-2 rounded mb-4 flex items-center justify-center gap-2 hover:bg-gray-300">
                        <Lock size={16} /> Aplicar Desconto Pontual (Diretoria)
                      </button>
                    ) : (
                      <div className="bg-red-50 border border-red-200 p-3 rounded mb-4">
                        <label className="text-sm font-bold text-red-700 mb-2 block">Autorização da Diretoria</label>
                        <input type="password" placeholder="Senha do Diretor" className="w-full p-2 border rounded mb-2" value={senhaDiretor} onChange={e => setSenhaDiretor(e.target.value)} />
                        <input type="number" placeholder="Valor do Desconto (R$)" className="w-full p-2 border rounded mb-2" value={descValor} onChange={e => setDescValor(e.target.value)} />
                        <div className="flex gap-2">
                          <button onClick={aplicarDescontoNaHora} className="bg-red-600 text-white p-2 rounded flex-1">Aplicar</button>
                          <button onClick={() => { setShowDescDiretoria(false); setSenhaDiretor(""); }} className="bg-gray-300 p-2 rounded">Cancelar</button>
                        </div>
                      </div>
                    )}

                    <div className="p-4 bg-gray-50 rounded border">
                      <label className="block font-semibold mb-2">Forma de Pagamento</label>
                      <select className="w-full p-2 border rounded mb-3" value={formaPagamento} onChange={e => setFormaPagamento(e.target.value)}>
                        <option>Pix</option><option>Dinheiro</option><option>Cartão</option>
                      </select>
                      {formaPagamento === "Cartão" && (
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <select className="w-full p-2 border rounded" value={tipoCartao} onChange={e => setTipoCartao(e.target.value)}><option>Débito</option><option>Crédito</option></select>
                          {tipoCartao === "Crédito" && <select className="w-full p-2 border rounded" value={parcelas} onChange={e => setParcelas(e.target.value)}><option>1x</option><option>2x</option><option>3x</option></select>}
                        </div>
                      )}
                      {(formaPagamento === "Pix" || formaPagamento === "Cartão") && (
                        <input type="text" className="w-full p-2 border border-red-300 rounded" placeholder="Código da Maquininha" value={codigoPagamento} onChange={e => setCodigoPagamento(e.target.value)} />
                      )}
                    </div>

                    <div className="bg-gray-100 p-3 rounded mt-4">
                      <p>Total selecionado: R$ {pendentes.filter(m => selecionadasParaPagar.includes(m.id)).reduce((a,b)=>a+Number(b.valor),0).toFixed(2)}</p>
                      <p>Desconto (Pix/Dinheiro): R$ {(formaPagamento === "Pix" || formaPagamento === "Dinheiro") && selecionadasParaPagar.length > 0 ? 10 : 0}</p>
                      <p className="font-bold text-lg text-red-600">Total a pagar: R$ {calcularTotal().toFixed(2)}</p>
                    </div>
                    <button onClick={pagar} disabled={loading || selecionadasParaPagar.length === 0} className="w-full bg-red-600 text-white p-3 rounded mt-4 disabled:opacity-50 font-bold">Confirmar Pagamento</button>
                  </>
                )}
              </>
            )}

            {aba === "pagas" && (
              <div className="space-y-2 max-h-100 overflow-y-auto">
                {pagas.length === 0 ? <p className="text-gray-500 py-4">Nenhum pagamento realizado.</p> : pagas.map(m => (
                  <div key={m.id} className="p-3 rounded-lg border bg-white">
                    <div className="flex justify-between items-center mb-1">
                      <p className="font-semibold text-green-700">{formatarMesReferencia(m.vencimento)}</p>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Pago</span>
                    </div>
                    <p className="text-xs text-gray-500">Pago em: {m.data_pagamento ? new Date(m.data_pagamento).toLocaleString() : "---"}</p>
                    <p className="text-sm font-medium mt-1">Valor: R$ {Number(m.valor).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}