"use client"

import { useEffect, useState, Suspense } from "react"
import { supabase } from "../../lib/supabase"
import { calcularDescontosMensalidade } from "../../lib/descontos"
import { useSearchParams } from "next/navigation"
import { Lock, FileText, CheckCircle } from "lucide-react"
import jsPDF from "jspdf"

function MatriculaContent() {
  const searchParams = useSearchParams()
  
  const [loading, setLoading] = useState(false)
  const [caixaAberto, setCaixaAberto] = useState<any>(null)
  const [modalidades, setModalidades] = useState<any[]>([])
  const [todasTurmas, setTodasTurmas] = useState<any[]>([])
  const [convenios, setConvenios] = useState<any[]>([])
  const [escolas, setEscolas] = useState<any[]>([])
  
  const [aluno, setAluno] = useState({
    nome: "", cpf: "", rg: "", nascimento: "", whatsapp: "", email: "", endereco: "",
    menor: false,
    responsavel_nome: "", responsavel_cpf: "", responsavel_whatsapp: "", responsavel_email: "",
    problema_saude: false, saude_detalhes: "",
    usa_remedio: false, remedio_detalhes: "",
    convenio_id: "",
    escola_id: "",
  })
  
  const [itensMatricula, setItensMatricula] = useState<{ modalidadeId: string; turmaId: string }[]>([])
  const [formaPagamento, setFormaPagamento] = useState("Pix")
  const [tipoCartao, setTipoCartao] = useState("Crédito")
  const [parcelas, setParcelas] = useState("1x")
  const [codigoPagamento, setCodigoPagamento] = useState("")
  const [termoAceito, setTermoAceito] = useState(false)

  const [descTipo, setDescTipo] = useState("fixo")
  const [descValor, setDescValor] = useState("")
  const [descMeses, setDescMeses] = useState("")
  const [descRecorrente, setDescRecorrente] = useState(false)
  const [senhaDiretor, setSenhaDiretor] = useState("")

  const [valorGeralTotal, setValorGeralTotal] = useState(0)
  const [valorFinal, setValorFinal] = useState(0)

  useEffect(() => {
    const nome = searchParams.get("nome")
    const cpf = searchParams.get("cpf")
    const whatsapp = searchParams.get("whatsapp")
    const escolaId = searchParams.get("escola_id")

    if (nome || cpf || whatsapp || escolaId) {
      setAluno(prev => ({ ...prev, nome: nome || prev.nome, cpf: cpf || prev.cpf, whatsapp: whatsapp || prev.whatsapp, escola_id: escolaId || prev.escola_id }))
    }
  }, [searchParams])

  useEffect(() => { carregarDados(); verificarCaixa() }, [])
  useEffect(() => { calcularValores() }, [itensMatricula, aluno.convenio_id, aluno.escola_id, formaPagamento, descTipo, descValor])

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
    const { data: esc } = await supabase.from("escolas").select("*").eq("status", "ativo")
    setEscolas(esc || [])
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

    if (aluno.escola_id?.trim()) {
      const escola = escolas.find(e => e.id === aluno.escola_id)
      if (escola) desconto += escola.tipo_desconto === "percentual" ? totalGeral * (escola.valor_desconto / 100) : escola.valor_desconto
    }

    if (descValor) {
      if (descTipo === "percentual") desconto += totalGeral * (Number(descValor) / 100)
      else desconto += Number(descValor)
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
    const { count, error } = await supabase.from("alunos").select("*", { count: "exact", head: true });
    if (error || count === null) return "CT001";
    return `CT${(count + 1).toString().padStart(3, "0")}`;
  }

  function formatarMesReferencia(dataVencimento: Date) {
    const meses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]
    return `${meses[dataVencimento.getMonth()]} de ${dataVencimento.getFullYear()}`
  }

  // --- GERAÇÃO DO TERMO AUTOPREENCHIDO ---
  function gerarTermoPDF() {
    const doc = new jsPDF()
    let y = 20

    // Cabeçalho
    doc.setFontSize(14)
    doc.text("TERMO DE CIÊNCIA, RESPONSABILIDADE E AUTORIZAÇÕES", 105, y, { align: "center" })
    y += 8
    doc.setFontSize(12)
    doc.text("CT OKINAWA", 105, y, { align: "center" })
    y += 15

    // Introdução
    doc.setFontSize(10)
    const introText = `Eu, ${aluno.nome || "________________________________________"}, inscrito(a) no CPF nº ${aluno.cpf || "____________________"}, declaro, para todos os fins de direito, que:`
    const splitIntro = doc.splitTextToSize(introText, 180)
    doc.text(splitIntro, 15, y)
    y += splitIntro.length * 6 + 5

    // Condição
    const condicaoText = aluno.menor 
      ? `Na condição de: ( X ) Responsável legal pelo(a) aluno(a) menor ${aluno.nome}` 
      : `Na condição de: ( X ) Aluno(a) maior de idade`
    doc.text(condicaoText, 15, y)
    y += 10

    // Cláusulas
    const clausulas = [
      `1. DA CIÊNCIA DO REGULAMENTO: Declaro que recebi, li, compreendi e tive acesso ao Regulamento Interno do CT OKINAWA, estando plenamente ciente de todas as normas de funcionamento, conduta, disciplina e organização do espaço.`,
      `2. DA PRÁTICA DE ATIVIDADE FÍSICA E RISCOS: Declaro estar ciente de que a prática de artes marciais envolve riscos inerentes. Assumo integral responsabilidade pela participação, isentando o CT OKINAWA de acidentes que não sejam oriundos de dolo ou negligência direta.`,
      `3. DAS CONDIÇÕES DE SAÚDE: Declaro que: ( X ) O aluno encontra-se apto à prática de atividades físicas. ${aluno.problema_saude ? `( X ) Informei previamente a seguinte condição de saúde: ${aluno.saude_detalhes}` : `( ) Informei previamente alguma condição de saúde relevante.`}`,
      `4. DO USO DE IMAGEM, VOZ E IDENTIDADE: Autorizo o CT OKINAWA a captar e utilizar imagem, voz e nome do aluno para fins institucionais, promocionais e de divulgação, sem limitação territorial e por prazo indeterminado, sem qualquer remuneração.`,
      `5. DAS RESPONSABILIDADES: O descumprimento das normas poderá resultar em medidas disciplinares. O CT não se responsabiliza por ocorrências fora de suas dependências ou por ações de terceiros.`,
      `6. DAS OBRIGAÇÕES FINANCEIRAS: A mensalidade possui vencimento fixo. O não pagamento poderá acarretar restrição de acesso às atividades até a devida regularização.`,
      `7. DECLARAÇÃO FINAL: Declaro que todas as informações prestadas são verdadeiras e que este termo possui validade jurídica, não podendo alegar desconhecimento.`
    ]

    clausulas.forEach(clausula => {
      const splitText = doc.splitTextToSize(clausula, 180)
      if (y + splitText.length * 6 > 260) { doc.addPage(); y = 20; }
      doc.text(splitText, 15, y)
      y += splitText.length * 6 + 4
    })

    // Rodapé (Dados já preenchidos)
    if (y > 220) { doc.addPage(); y = 20; }
    y += 10
    
    doc.text(`Nome: ${aluno.nome || "_________________________________________"}`, 15, y); y += 6
    doc.text(`CPF: ${aluno.cpf || "____________________"}`, 15, y); y += 6
    doc.text(`Telefone: ${aluno.whatsapp || aluno.responsavel_whatsapp || "____________________"}`, 15, y); y += 6
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 15, y); y += 15

    doc.text(`( X ) Aluno maior de idade`, 15, y); y += 6
    doc.text(`( X ) Responsável legal`, 15, y); y += 20

    // Linha de Assinatura
    doc.setLineWidth(0.5)
    doc.line(15, y, 100, y)
    doc.line(110, y, 195, y)
    y += 5
    doc.text(`${aluno.menor ? aluno.responsavel_nome || "Assinatura do Responsável" : aluno.nome || "Assinatura do Aluno"}`, 15, y)
    doc.text(`CT OKINAWA`, 110, y)

    doc.save(`Termo_Responsabilidade_${aluno.nome || "Aluno"}.pdf`)
    setTermoAceito(true)
  }

  async function salvarMatricula() {
    if (!caixaAberto) return alert("❌ Caixa não está aberto.")
    if (!aluno.nome.trim() || itensMatricula.length === 0 || itensMatricula.some(i => !i.turmaId)) return alert("Preencha nome e selecione pelo menos uma turma.")
    if (descValor && senhaDiretor !== "984215") return alert("❌ Senha de Diretoria incorreta. Operação negada.")
    if (!termoAceito) return alert("⚠️ Você precisa gerar e aceitar o Termo de Responsabilidade antes de finalizar a matrícula.")
    if ((formaPagamento === "Pix" || formaPagamento === "Cartão") && valorFinal > 0 && !codigoPagamento.trim()) return alert("⚠️ Insira o código de autorização da maquininha.")

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
        escola_id: aluno.escola_id?.trim() || null,
        numero_matricula: numeroMatricula, status: "ativo",
        termo_assinado: true
      }

      const { data: novoAluno, error: errAluno } = await supabase.from("alunos").insert([alunoParaInserir]).select().single()
      if (errAluno) throw new Error(`Erro ao inserir aluno: ${errAluno.message}`)
      const alunoId = novoAluno.id

      if (descValor) {
        const meses = descRecorrente ? 999 : Number(descMeses)
        await supabase.from("descontos_especiais").insert([{
          aluno_id: alunoId, tipo: descTipo, valor: Number(descValor), meses_duracao: meses, meses_restantes: meses, recorrente: descRecorrente, status: "ativo"
        }])
      }

      const indicacaoId = searchParams.get("indicacao_id")
      if (indicacaoId) await supabase.from("escolas_indicacoes").update({ status: "aprovado", aluno_id: alunoId }).eq("id", indicacaoId)

      const matriculasInseridas = []
      for (const item of itensMatricula) {
        const { data: mat, error: errMat } = await supabase.from("matriculas").insert([{ aluno_id: alunoId, turma_id: item.turmaId, status: "ativo" }]).select().single()
        if (errMat) throw new Error(`Erro ao vincular turma: ${errMat.message}`)
        matriculasInseridas.push(mat)
      }

      const hoje = new Date()
      const diaVencimento = hoje.getDate();

      for (const mat of matriculasInseridas) {
        const turma = todasTurmas.find(t => t.id === mat.turma_id)
        let valorOriginal = turma?.modalidades?.valor_geral || 0
        const valorBase = turma?.modalidades?.valor_base || 0

        if (aluno.escola_id) {
          const escola = escolas.find(e => e.id === aluno.escola_id)
          if (escola) {
            const descontoEscola = escola.tipo_desconto === "percentual" ? valorOriginal * (escola.valor_desconto / 100) : escola.valor_desconto;
            valorOriginal = Math.max(0, valorOriginal - descontoEscola);
          }
        }

        for (let i = 1; i <= 12; i++) {
          const vencimento = new Date(hoje.getFullYear(), hoje.getMonth() + i, diaVencimento)
          const { valorFinal: valorComDesconto, isento } = await calcularDescontosMensalidade(alunoId, valorOriginal)

          await supabase.from("mensalidades").insert([{
            aluno_id: alunoId, matricula_id: mat.id, vencimento: vencimento.toISOString().slice(0,10),
            valor: valorComDesconto, valor_base: valorBase, status: isento ? "isento" : "pendente", mes_referente: formatarMesReferencia(vencimento)
          }])
        }
      }

      if (valorFinal > 0) {
        await supabase.from("caixa").insert([{
          caixa_turno_id: caixaAberto.id, tipo: "matricula", nome: `Matrícula ${aluno.nome}`, valor: valorFinal,
          valor_base: valorGeralTotal, forma_pagamento: formaPagamento, tipo_cartao: formaPagamento === "Cartão" ? tipoCartao : null,
          parcelas: formaPagamento === "Cartão" && tipoCartao === "Crédito" ? parcelas : null, codigo_pagamento: codigoPagamento || null,
          aluno_id: alunoId, data: new Date().toISOString(), cancelado: false
        }])
      }

      const proxMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, diaVencimento)
      gerarRecibo(numeroMatricula, formatarMesReferencia(proxMes))
      
      alert(`✅ Matrícula realizada! Nº ${numeroMatricula}`)
      setAluno({ nome: "", cpf: "", rg: "", nascimento: "", whatsapp: "", email: "", endereco: "", menor: false, responsavel_nome: "", responsavel_cpf: "", responsavel_whatsapp: "", responsavel_email: "", problema_saude: false, saude_detalhes: "", usa_remedio: false, remedio_detalhes: "", convenio_id: "", escola_id: "" })
      setItensMatricula([])
      setCodigoPagamento("")
      setDescValor("")
      setDescMeses("")
      setDescRecorrente(false)
      setSenhaDiretor("")
      setTermoAceito(false)
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
    const nomeEscola = aluno.escola_id ? escolas.find(e => e.id === aluno.escola_id)?.nome : null;

    const w = window.open("", "", "width=400,height=650")
    w?.document.write(`
      <html><head><title>Recibo de Matrícula</title><style>
      * { margin: 0; padding: 0; box-sizing: border-box; } body { width: 58mm; margin: 0 auto; padding: 2mm; font-family: monospace; font-size: 10pt; line-height: 1.2; }
      .logo { text-align: center; margin-bottom: 4px; } .logo img { max-width: 40mm; height: auto; } .titulo { text-align: center; font-weight: bold; font-size: 12pt; margin: 4px 0; }
      hr { border: none; border-top: 1px dashed #000; margin: 4px 0; } .total { font-weight: bold; font-size: 11pt; } .verse { text-align: center; margin-top: 8px; font-style: italic; } .center { text-align: center; }
      </style></head><body>
        <div class="logo"><img src="${window.location.origin}/logo.png" alt="Logo" /></div>
        <div class="titulo">CT OKINAWA</div><div class="center">Disciplina • Respeito • Evolução</div><hr/>
        <div class="center"><b>RECIBO DE MATRÍCULA</b></div><hr/>
        <div><b>Nº Matrícula:</b> ${numeroMatricula}</div><div><b>Aluno:</b> ${aluno.nome}</div><div><b>CPF:</b> ${aluno.cpf || '---'}</div>
        ${aluno.menor ? `<div><b>Responsável:</b> ${aluno.responsavel_nome}</div>` : ''}
        ${nomeEscola ? `<div><b>Escola Parceira:</b> ${nomeEscola}</div>` : ''}
        <hr/><div><b>Modalidades/Turmas:</b></div><div>${detalhes}</div><hr/>
        <div><b>1ª mensalidade (${mesReferente}):</b> R$ ${valorGeralTotal.toFixed(2)}</div>
        <div><b>Desconto Aplicado:</b> R$ ${desconto.toFixed(2)}</div>
        <div class="total"><b>Total pago:</b> R$ ${valorFinal.toFixed(2)}</div>
        <div><b>Pagamento:</b> ${formaPagamento}${formaPagamento === "Cartão" ? ` - ${tipoCartao} ${parcelas}` : ""}</div>
        ${codigoPagamento ? `<div><b>Cód. Autorização:</b> ${codigoPagamento}</div>` : ''}
        <hr/><div><b>Data:</b> ${new Date().toLocaleString()}</div>
        <div class="verse">"Confie no Senhor de todo o seu coração"<br/>Provérbios 3:5</div>
        <div class="center">Obrigado por confiar no CT Okinawa! 🙏</div>
        <script>window.onload = () => { setTimeout(() => { window.print(); setTimeout(() => window.close(), 500); }, 200); }</script>
      </body></html>
    `)
    w?.document.close()
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow">
      <h1 className="text-2xl font-bold mb-6">Nova Matrícula</h1>
      {!caixaAberto && <div className="bg-red-100 p-3 mb-4 rounded">⚠️ Caixa fechado. Abra o caixa primeiro.</div>}
      <div className="space-y-4">
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
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <select className="w-full p-2 border rounded" value={aluno.escola_id} onChange={e => setAluno({...aluno, escola_id: e.target.value})}>
            <option value="">Nenhuma Escola Parceira</option>
            {escolas.map(e => <option key={e.id} value={e.id}>{e.nome} - {e.tipo_desconto === "percentual" ? `${e.valor_desconto}%` : `R$ ${e.valor_desconto}`}</option>)}
          </select>
          <select className="w-full p-2 border rounded" value={aluno.convenio_id} onChange={e => setAluno({...aluno, convenio_id: e.target.value})}>
            <option value="">Nenhum convênio</option>
            {convenios.map(c => <option key={c.id} value={c.id}>{c.nome} - {c.tipo === "percentual" ? `${c.desconto}%` : `R$ ${c.desconto}`}</option>)}
          </select>
        </div>

        <div className="border border-red-300 p-4 rounded bg-red-50">
          <label className="block font-bold text-red-700 mb-2">Desconto de Diretoria (Opcional)</label>
          <div className="grid grid-cols-3 gap-2 mb-2">
             <select className="p-2 border rounded" value={descTipo} onChange={e => setDescTipo(e.target.value)}>
               <option value="fixo">R$ Fixo (Ex: 30)</option>
               <option value="percentual">% (Ex: 20)</option>
             </select>
             <input type="number" className="p-2 border rounded" placeholder="Valor" value={descValor} onChange={e => setDescValor(e.target.value)} />
             {!descRecorrente && (
               <input type="number" className="p-2 border rounded" placeholder="Meses (Ex: 10)" value={descMeses} onChange={e => setDescMeses(e.target.value)} />
             )}
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-blue-700 mb-3">
            <input type="checkbox" checked={descRecorrente} onChange={e => { setDescRecorrente(e.target.checked); if(e.target.checked) setDescMeses(""); }} />
            Desconto Recorrente (Para Sempre)
          </label>

          {descValor && (
            <div className="border-t border-red-200 pt-2">
              <label className="text-xs font-bold text-gray-500 flex items-center gap-1 mb-1"><Lock size={12}/> Autorização da Diretoria</label>
              <input type="password" className="w-full p-2 border border-red-300 rounded" placeholder="Senha do Diretor" value={senhaDiretor} onChange={e => setSenhaDiretor(e.target.value)} />
            </div>
          )}
        </div>

        <div className="p-4 bg-gray-50 rounded border">
          <label className="block font-semibold mb-2">Forma de Pagamento</label>
          <select className="w-full p-2 border rounded mb-3" value={formaPagamento} onChange={e => setFormaPagamento(e.target.value)}>
            <option>Pix</option><option>Dinheiro</option><option>Cartão</option>
          </select>
          
          {formaPagamento === "Cartão" && (
            <div className="grid grid-cols-2 gap-2 mb-3">
              <select className="w-full p-2 border rounded" value={tipoCartao} onChange={e => setTipoCartao(e.target.value)}>
                <option>Débito</option><option>Crédito</option>
              </select>
              {tipoCartao === "Crédito" && (
                <select className="w-full p-2 border rounded" value={parcelas} onChange={e => setParcelas(e.target.value)}>
                  <option>1x</option><option>2x</option><option>3x</option>
                </select>
              )}
            </div>
          )}

          {(formaPagamento === "Pix" || formaPagamento === "Cartão") && valorFinal > 0 && (
            <div className="mt-2">
              <label className="block text-sm font-semibold mb-1 text-red-600">Código de Autorização (Maquininha)</label>
              <input className="w-full p-2 border border-red-300 rounded" placeholder="Digite o código" value={codigoPagamento} onChange={e => setCodigoPagamento(e.target.value)} />
            </div>
          )}
        </div>

        <div className="border p-4 rounded bg-blue-50 border-blue-200">
          <h3 className="font-bold text-blue-800 mb-2 flex items-center gap-2"><FileText size={18}/> Termo de Responsabilidade</h3>
          <p className="text-sm text-gray-600 mb-3">O sistema vai gerar o termo completo com os dados preenchidos. Basta imprimir e colher a assinatura.</p>
          
          <button 
            type="button" 
            onClick={gerarTermoPDF} 
            className="w-full bg-blue-600 text-white p-2 rounded flex items-center justify-center gap-2 hover:bg-blue-700"
          >
            <FileText size={18}/> Gerar e Imprimir Termo (PDF)
          </button>

          {termoAceito && (
            <div className="mt-3 flex items-center gap-2 text-green-700 bg-green-100 p-2 rounded">
              <CheckCircle size={18}/> Termo gerado! O aluno/responsável deve assinar a via impressa.
            </div>
          )}

          <label className="flex items-start gap-2 text-sm text-gray-700 mt-3">
            <input type="checkbox" checked={termoAceito} onChange={e => setTermoAceito(e.target.checked)} className="mt-1" />
            <span>Declaro que o Termo de Responsabilidade foi gerado, lido e assinado pelo aluno/responsável.</span>
          </label>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <p>Valor geral: R$ {valorGeralTotal.toFixed(2)}</p>
          <p>Desconto Total: R$ {(valorGeralTotal - valorFinal).toFixed(2)}</p>
          <p className="font-bold text-lg">Total a pagar: R$ {valorFinal.toFixed(2)}</p>
        </div>

        <button onClick={salvarMatricula} disabled={loading || !caixaAberto || !termoAceito} className="w-full bg-red-600 text-white p-3 rounded disabled:opacity-50">
          {loading ? "Salvando..." : "Confirmar Matrícula"}
        </button>
      </div>
    </div>
  )
}

export default function Matricula() {
  return (
    <Suspense fallback={<div className="p-6 text-center">Carregando...</div>}>
      <MatriculaContent />
    </Suspense>
  )
}