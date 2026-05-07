"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import { aplicarDescontoCampanha } from "../../lib/descontos"

export default function Matricula() {
  const [loading, setLoading] = useState(false)
  const [caixaAberto, setCaixaAberto] = useState<any>(null)
  const [modalidades, setModalidades] = useState<any[]>([])
  const [todasTurmas, setTodasTurmas] = useState<any[]>([])
  const [convenios, setConvenios] = useState<any[]>([])
  const [aluno, setAluno] = useState({
    nome: "", cpf: "", rg: "", nascimento: "", whatsapp: "", email: "", endereco: "",
    menor: false,
    responsavel_nome: "", responsavel_cpf: "", responsavel_whatsapp: "", responsavel_email: "",
    problema_saude: false, saude_detalhes: "",
    usa_remedio: false, remedio_detalhes: "",
    convenio_id: "",
  })
  const [itensMatricula, setItensMatricula] = useState<{ modalidadeId: string; turmaId: string }[]>([])
  const [formaPagamento, setFormaPagamento] = useState("Pix")
  const [tipoCartao, setTipoCartao] = useState("Crédito")
  const [parcelas, setParcelas] = useState("1x")
  const [valorGeralTotal, setValorGeralTotal] = useState(0)
  const [valorFinal, setValorFinal] = useState(0)

  useEffect(() => { carregarDados(); verificarCaixa() }, [])
  useEffect(() => { calcularValores() }, [itensMatricula, aluno.convenio_id, formaPagamento])

  async function verificarCaixa() {
    const { data } = await supabase.from("caixa_turno").select("*").eq("status", "aberto").maybeSingle()
    setCaixaAberto(data)
  }

  async function carregarDados() {
    const { data: mods } = await supabase.from("modalidades").select("*").eq("status", "ativo")
    setModalidades(mods || [])
    const { data: turmasData } = await supabase.from("turmas").select("*, modalidades!inner(*)").eq("status", "ativo")
    setTodasTurmas(turmasData || [])
    const { data: conv } = await supabase.from("convenios").select("*").eq("ativo", true)
    setConvenios(conv || [])
  }

  function calcularValores() {
    let totalGeral = 0
    for (const item of itensMatricula) {
      const turma = todasTurmas.find(t => t.id === item.turmaId)
      if (turma?.modalidades) totalGeral += Number(turma.modalidades.valor_geral || 0)
    }
    setValorGeralTotal(totalGeral)
    let desconto = 0
    if (aluno.convenio_id?.trim()) {
      const convenio = convenios.find(c => c.id === aluno.convenio_id)
      if (convenio) desconto += convenio.tipo === "percentual" ? totalGeral * (convenio.desconto / 100) : convenio.desconto
    }
    if (formaPagamento === "Pix" || formaPagamento === "Dinheiro") desconto += 10
    setValorFinal(Math.max(0, totalGeral - desconto))
  }

  function adicionarModalidade() { setItensMatricula([...itensMatricula, { modalidadeId: "", turmaId: "" }]) }
  function removerModalidade(i: number) { const nova = [...itensMatricula]; nova.splice(i,1); setItensMatricula(nova) }
  function atualizarModalidade(i: number, modalidadeId: string) { const nova = [...itensMatricula]; nova[i] = { modalidadeId, turmaId: "" }; setItensMatricula(nova) }
  function atualizarTurma(i: number, turmaId: string) { const nova = [...itensMatricula]; nova[i].turmaId = turmaId; setItensMatricula(nova) }
  function turmasDaModalidade(modalidadeId: string) { return todasTurmas.filter(t => t.modalidade_id === modalidadeId) }

  async function gerarNumeroMatricula() {
    const { data, error } = await supabase
      .from("alunos")
      .select("numero_matricula")
      .order("numero_matricula", { ascending: false })
      .limit(1);
    if (error || !data || data.length === 0) return "CT001";
    const ultimo = data[0].numero_matricula;
    const match = ultimo.match(/CT(\d+)/);
    let num = match ? parseInt(match[1], 10) : 0;
    if (isNaN(num)) return "CT001";
    num++;
    return `CT${num.toString().padStart(3, "0")}`;
  }

  function formatarMesReferencia(dataVencimento: Date) {
    const meses = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ]
    return `${meses[dataVencimento.getMonth()]} de ${dataVencimento.getFullYear()}`
  }

  async function salvarMatricula() {
    if (!caixaAberto) return alert("❌ Caixa não está aberto.")
    if (!aluno.nome.trim() || itensMatricula.length === 0 || itensMatricula.some(i => !i.turmaId))
      return alert("Preencha nome e selecione pelo menos uma turma.")
    setLoading(true)
    try {
      const numeroMatricula = await gerarNumeroMatricula()
      const alunoParaInserir = {
        nome: aluno.nome.trim(), cpf: aluno.cpf || null, rg: aluno.rg || null,
        nascimento: aluno.nascimento || null, whatsapp: aluno.whatsapp || null,
        email: aluno.email || null, endereco: aluno.endereco || null,
        menor: aluno.menor,
        responsavel_nome: aluno.responsavel_nome || null,
        responsavel_cpf: aluno.responsavel_cpf || null,
        responsavel_whatsapp: aluno.responsavel_whatsapp || null,
        responsavel_email: aluno.responsavel_email || null,
        problema_saude: aluno.problema_saude, saude_detalhes: aluno.saude_detalhes || null,
        usa_remedio: aluno.usa_remedio, remedio_detalhes: aluno.remedio_detalhes || null,
        convenio_id: aluno.convenio_id?.trim() || null,
        numero_matricula: numeroMatricula, status: "ativo"
      }

      const { data: novoAluno, error: errAluno } = await supabase.from("alunos").insert([alunoParaInserir]).select().single()
      if (errAluno) throw new Error(`Erro ao inserir aluno: ${errAluno.message}`)
      const alunoId = novoAluno.id

      const matriculasInseridas = []
      for (const item of itensMatricula) {
        const { data: mat, error: errMat } = await supabase
          .from("matriculas")
          .insert([{ aluno_id: alunoId, turma_id: item.turmaId, status: "ativo" }])
          .select()
          .single()
        if (errMat) throw new Error(`Erro ao vincular turma: ${errMat.message}`)
        matriculasInseridas.push(mat)
      }

      const hoje = new Date()
      const vencimento = new Date(hoje.getFullYear(), hoje.getMonth() + 1, hoje.getDate())
      const vencimentoStr = vencimento.toISOString().slice(0,10)
      const mesReferente = formatarMesReferencia(vencimento)

      for (const mat of matriculasInseridas) {
        const turma = todasTurmas.find(t => t.id === mat.turma_id)
        const valorOriginal = turma?.modalidades?.valor_geral || 0
        const valorBase = turma?.modalidades?.valor_base || 0
        const { valorFinal: valorComDesconto } = await aplicarDescontoCampanha(alunoId, valorOriginal)
        
        const { error: errMens } = await supabase.from("mensalidades").insert([{
          aluno_id: alunoId, 
          matricula_id: mat.id, 
          vencimento: vencimentoStr,
          valor: valorComDesconto, 
          valor_base: valorBase, 
          status: "pendente",
          mes_referente: mesReferente
        }])
        if (errMens) throw new Error(`Erro ao gerar mensalidade: ${errMens.message}`)
      }

      const { error: errCaixa } = await supabase.from("caixa").insert([{
        caixa_turno_id: caixaAberto.id,
        tipo: "matricula",
        nome: `Matrícula ${aluno.nome}`,
        valor: valorFinal,
        valor_base: valorGeralTotal,
        forma_pagamento: formaPagamento,
        tipo_cartao: formaPagamento === "Cartão" ? tipoCartao : null,
        parcelas: formaPagamento === "Cartão" && tipoCartao === "Crédito" ? parcelas : null,
        aluno_id: alunoId,
        data: new Date().toISOString(),
        cancelado: false
      }])
      if (errCaixa) throw new Error(`Erro ao registrar no caixa: ${errCaixa.message}`)

      gerarRecibo(numeroMatricula, mesReferente)
      alert(`✅ Matrícula realizada! Nº ${numeroMatricula}`)
      setAluno({
        nome: "", cpf: "", rg: "", nascimento: "", whatsapp: "", email: "", endereco: "",
        menor: false, responsavel_nome: "", responsavel_cpf: "", responsavel_whatsapp: "", responsavel_email: "",
        problema_saude: false, saude_detalhes: "", usa_remedio: false, remedio_detalhes: "",
        convenio_id: ""
      })
      setItensMatricula([])
    } catch (err: any) {
      console.error("ERRO:", err)
      alert("Erro: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  function gerarRecibo(numeroMatricula: string, mesReferente: string) {
    const detalhes = itensMatricula.map(item => {
      const turma = todasTurmas.find(t => t.id === item.turmaId)
      return `${turma?.modalidades?.nome} - ${turma?.nome}`
    }).join(", ")
    const desconto = valorGeralTotal - valorFinal

    const w = window.open("", "", "width=400,height=650")
    w?.document.write(`
      <html>
      <head>
        <title>Recibo de Matrícula</title>
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
        <div class="logo"><img src="${window.location.origin}/logo.png" alt="Logo" /></div>
        <div class="titulo">CT OKINAWA</div>
        <div class="center">Disciplina • Respeito • Evolução</div>
        <hr/>
        <div class="center"><b>RECIBO DE MATRÍCULA</b></div>
        <hr/>
        <div><b>Nº Matrícula:</b> ${numeroMatricula}</div>
        <div><b>Aluno:</b> ${aluno.nome}</div>
        <div><b>CPF:</b> ${aluno.cpf || '---'}</div>
        <div><b>Data Nasc.:</b> ${aluno.nascimento || '---'}</div>
        ${aluno.menor ? `<div><b>Responsável:</b> ${aluno.responsavel_nome}</div>` : ''}
        <hr/>
        <div><b>Modalidades/Turmas contratadas:</b></div>
        <div>${detalhes}</div>
        <hr/>
        <div><b>1ª mensalidade (${mesReferente}):</b> R$ ${valorGeralTotal.toFixed(2)}</div>
        <div><b>Desconto aplicado:</b> R$ ${desconto.toFixed(2)}</div>
        <div class="total"><b>Total pago na matrícula:</b> R$ ${valorFinal.toFixed(2)}</div>
        <div><b>Forma de pagamento:</b> ${formaPagamento}${formaPagamento === "Cartão" ? ` - ${tipoCartao} ${parcelas}` : ""}</div>
        <hr/>
        <div><b>Data:</b> ${new Date().toLocaleString()}</div>
        <div class="verse">"Confie no Senhor de todo o seu coração"<br/>Provérbios 3:5</div>
        <div class="center">Obrigado por confiar no CT Okinawa! 🙏</div>
        <script>window.onload = () => { setTimeout(() => { window.print(); setTimeout(() => window.close(), 500); }, 200); }</script>
      </body>
      </html>
    `)
    w?.document.close()
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow">
      <h1 className="text-2xl font-bold mb-6">Nova Matrícula</h1>
      {!caixaAberto && <div className="bg-red-100 p-3 mb-4 rounded">⚠️ Caixa fechado. Abra o caixa primeiro.</div>}
      <div className="space-y-4">
        {/* Dados pessoais */}
        <div className="grid md:grid-cols-2 gap-3">
          <input className="p-2 border rounded" placeholder="Nome completo" value={aluno.nome} onChange={e => setAluno({...aluno, nome: e.target.value})} />
          <input className="p-2 border rounded" placeholder="CPF" value={aluno.cpf} onChange={e => setAluno({...aluno, cpf: e.target.value})} />
          <input className="p-2 border rounded" placeholder="RG" value={aluno.rg} onChange={e => setAluno({...aluno, rg: e.target.value})} />
          <input type="date" className="p-2 border rounded" value={aluno.nascimento} onChange={e => setAluno({...aluno, nascimento: e.target.value})} />
          <input className="p-2 border rounded" placeholder="WhatsApp" value={aluno.whatsapp} onChange={e => setAluno({...aluno, whatsapp: e.target.value})} />
          <input className="p-2 border rounded" placeholder="Email" value={aluno.email} onChange={e => setAluno({...aluno, email: e.target.value})} />
          <input className="p-2 border rounded col-span-2" placeholder="Endereço" value={aluno.endereco} onChange={e => setAluno({...aluno, endereco: e.target.value})} />
        </div>

        <label className="flex items-center gap-2"><input type="checkbox" checked={aluno.menor} onChange={e => setAluno({...aluno, menor: e.target.checked})} /> Menor de idade</label>
        {aluno.menor && (
          <div className="grid md:grid-cols-2 gap-3 pl-4">
            <input className="p-2 border rounded" placeholder="Responsável" value={aluno.responsavel_nome} onChange={e => setAluno({...aluno, responsavel_nome: e.target.value})} />
            <input className="p-2 border rounded" placeholder="CPF Responsável" value={aluno.responsavel_cpf} onChange={e => setAluno({...aluno, responsavel_cpf: e.target.value})} />
            <input className="p-2 border rounded" placeholder="WhatsApp Responsável" value={aluno.responsavel_whatsapp} onChange={e => setAluno({...aluno, responsavel_whatsapp: e.target.value})} />
            <input className="p-2 border rounded" placeholder="Email Responsável" value={aluno.responsavel_email} onChange={e => setAluno({...aluno, responsavel_email: e.target.value})} />
          </div>
        )}

        <div className="border p-3 rounded">
          <label><input type="checkbox" checked={aluno.problema_saude} onChange={e => setAluno({...aluno, problema_saude: e.target.checked})} /> Problema de saúde</label>
          {aluno.problema_saude && <textarea className="w-full border rounded mt-1" value={aluno.saude_detalhes} onChange={e => setAluno({...aluno, saude_detalhes: e.target.value})} />}
          <label className="mt-2 block"><input type="checkbox" checked={aluno.usa_remedio} onChange={e => setAluno({...aluno, usa_remedio: e.target.checked})} /> Uso de remédio</label>
          {aluno.usa_remedio && <textarea className="w-full border rounded mt-1" value={aluno.remedio_detalhes} onChange={e => setAluno({...aluno, remedio_detalhes: e.target.value})} />}
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="font-semibold">Modalidades e Turmas</label>
            <button type="button" onClick={adicionarModalidade} className="bg-blue-500 text-white px-3 py-1 rounded text-sm">+ Adicionar Modalidade</button>
          </div>
          {itensMatricula.map((item, idx) => {
            const turmasDisponiveis = turmasDaModalidade(item.modalidadeId)
            return (
              <div key={idx} className="border p-3 rounded mb-2">
                <div className="flex gap-2">
                  <select className="flex-1 p-2 border rounded" value={item.modalidadeId} onChange={e => atualizarModalidade(idx, e.target.value)}>
                    <option value="">Selecione a modalidade</option>
                    {modalidades.map(mod => <option key={mod.id} value={mod.id}>{mod.nome} - R$ {mod.valor_geral}</option>)}
                  </select>
                  <select className="flex-1 p-2 border rounded" value={item.turmaId} onChange={e => atualizarTurma(idx, e.target.value)} disabled={!item.modalidadeId}>
                    <option value="">Selecione a turma</option>
                    {turmasDisponiveis.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
                  </select>
                  <button type="button" onClick={() => removerModalidade(idx)} className="bg-red-500 text-white px-3 rounded">X</button>
                </div>
              </div>
            )
          })}
          {itensMatricula.length === 0 && <p className="text-gray-400 text-sm">Clique em "Adicionar Modalidade" para começar.</p>}
        </div>

        <select className="w-full p-2 border rounded" value={aluno.convenio_id} onChange={e => setAluno({...aluno, convenio_id: e.target.value})}>
          <option value="">Nenhum convênio</option>
          {convenios.map(c => <option key={c.id} value={c.id}>{c.nome} - {c.tipo === "percentual" ? `${c.desconto}%` : `R$ ${c.desconto}`}</option>)}
        </select>

        <select className="w-full p-2 border rounded" value={formaPagamento} onChange={e => setFormaPagamento(e.target.value)}>
          <option>Pix</option><option>Dinheiro</option><option>Cartão</option>
        </select>
        {formaPagamento === "Cartão" && (
          <>
            <select className="w-full p-2 border rounded" value={tipoCartao} onChange={e => setTipoCartao(e.target.value)}>
              <option>Débito</option><option>Crédito</option>
            </select>
            {tipoCartao === "Crédito" && (
              <select className="w-full p-2 border rounded" value={parcelas} onChange={e => setParcelas(e.target.value)}>
                <option>1x</option><option>2x</option><option>3x</option>
              </select>
            )}
          </>
        )}

        <div className="bg-gray-100 p-4 rounded">
          <p>Valor geral das mensalidades: R$ {valorGeralTotal.toFixed(2)}</p>
          <p>Desconto: R$ {(valorGeralTotal - valorFinal).toFixed(2)}</p>
          <p className="font-bold text-lg">Total a pagar (matrícula): R$ {valorFinal.toFixed(2)}</p>
        </div>

        <button onClick={salvarMatricula} disabled={loading || !caixaAberto} className="w-full bg-red-600 text-white p-3 rounded disabled:opacity-50">
          {loading ? "Salvando..." : "Confirmar Matrícula"}
        </button>
      </div>
    </div>
  )
}