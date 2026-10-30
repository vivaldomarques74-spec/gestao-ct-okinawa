"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import AdminGuard from "../../components/AdminGuard"
import { Gift, Lock, FileText, Trash2 } from "lucide-react"
import jsPDF from "jspdf"

export default function RegistrosPage() {
  const [aba, setAba] = useState("alunos")
  const [alunos, setAlunos] = useState<any[]>([])
  const [movimentacoes, setMovimentacoes] = useState<any[]>([])
  const [modalidades, setModalidades] = useState<any[]>([])
  const [turmas, setTurmas] = useState<any[]>([])
  const [convenios, setConvenios] = useState<any[]>([])
  const [parceiros, setParceiros] = useState<any[]>([])

  const [alunoEditando, setAlunoEditando] = useState<any>(null)
  const [matriculasAluno, setMatriculasAluno] = useState<any[]>([])
  const [descontoEspecial, setDescontoEspecial] = useState<any>(null)
  
  const [formDesconto, setFormDesconto] = useState({ tipo: "fixo", valor: "", meses: "", recorrente: false })
  const [senhaDiretor, setSenhaDiretor] = useState("")
  const [aplicandoDesconto, setAplicandoDesconto] = useState(false)

  const [formAluno, setFormAluno] = useState<any>({
    nome: "", cpf: "", rg: "", nascimento: "", whatsapp: "", email: "", endereco: "",
    menor: false,
    responsavel_nome: "", responsavel_cpf: "", responsavel_whatsapp: "", responsavel_email: "",
    problema_saude: false, saude_detalhes: "",
    usa_remedio: false, remedio_detalhes: "",
    status: "ativo",
    convenio_id: "",
    numero_matricula: "",
  })

  const [filtroTipo, setFiltroTipo] = useState("todos")
  const [filtroParceiro, setFiltroParceiro] = useState("")
  const [mostrarCancelados, setMostrarCancelados] = useState(false)
  const [buscaAluno, setBuscaAluno] = useState("")

  const [movCancelar, setMovCancelar] = useState<any>(null)
  const [senhaCancelamento, setSenhaCancelamento] = useState("")

  useEffect(() => { carregarTudo() }, [])

  async function carregarTudo() {
    await carregarAlunos()
    await carregarMovimentacoes()
    await carregarModalidadesTurmas()
    await carregarConvenios()
    await carregarParceiros()
  }

  async function carregarAlunos() {
    const { data } = await supabase.from("alunos").select("*").order("nome")
    setAlunos(data || [])
  }

  async function carregarMovimentacoes() {
    const { data } = await supabase.from("caixa").select("*").order("data", { ascending: false })
    setMovimentacoes(data || [])
  }

  async function carregarModalidadesTurmas() {
    // Sem filtro de status para garantir que tudo apareça na lista
    const { data: mods } = await supabase.from("modalidades").select("*")
    setModalidades(mods || [])
    
    const { data: turmasData } = await supabase.from("turmas").select("*")
    setTurmas(turmasData || [])
  }

  async function carregarConvenios() {
    const { data } = await supabase.from("convenios").select("*").eq("ativo", true)
    setConvenios(data || [])
  }

  async function carregarParceiros() {
    const { data } = await supabase.from("parceiros").select("*").eq("status", "ativo")
    setParceiros(data || [])
  }

  async function editarAluno(aluno: any) {
    setAlunoEditando(aluno)
    setSenhaDiretor("")
    setFormAluno({
      nome: aluno.nome || "", cpf: aluno.cpf || "", rg: aluno.rg || "", nascimento: aluno.nascimento || "",
      whatsapp: aluno.whatsapp || "", email: aluno.email || "", endereco: aluno.endereco || "",
      menor: aluno.menor || false,
      responsavel_nome: aluno.responsavel_nome || "", responsavel_cpf: aluno.responsavel_cpf || "", 
      responsavel_whatsapp: aluno.responsavel_whatsapp || "", responsavel_email: aluno.responsavel_email || "",
      problema_saude: aluno.problema_saude || false, saude_detalhes: aluno.saude_detalhes || "",
      usa_remedio: aluno.usa_remedio || false, remedio_detalhes: aluno.remedio_detalhes || "",
      status: aluno.status || "ativo", convenio_id: aluno.convenio_id || "",
      numero_matricula: aluno.numero_matricula || "",
    })
    
    // Busca segura de matrículas para não dar erro 400
    const { data: rawMats } = await supabase.from("matriculas").select("*").eq("aluno_id", aluno.id).eq("status", "ativo")
    const matsCompletas = await Promise.all((rawMats || []).map(async (m) => {
      const { data: t } = await supabase.from("turmas").select("*").eq("id", m.turma_id).single()
      return { ...m, turmas: t }
    }))
    setMatriculasAluno(matsCompletas)

    const { data: desc } = await supabase.from("descontos_especiais").select("*").eq("aluno_id", aluno.id).eq("status", "ativo").maybeSingle()
    setDescontoEspecial(desc || null)
  }

  async function salvarAluno() {
    if (!alunoEditando) return
    await supabase.from("alunos").update({
      nome: formAluno.nome, cpf: formAluno.cpf, rg: formAluno.rg, nascimento: formAluno.nascimento,
      whatsapp: formAluno.whatsapp, email: formAluno.email, endereco: formAluno.endereco,
      menor: formAluno.menor, responsavel_nome: formAluno.responsavel_nome, responsavel_cpf: formAluno.responsavel_cpf,
      responsavel_whatsapp: formAluno.responsavel_whatsapp, responsavel_email: formAluno.responsavel_email,
      problema_saude: formAluno.problema_saude, saude_detalhes: formAluno.saude_detalhes,
      usa_remedio: formAluno.usa_remedio, remedio_detalhes: formAluno.remedio_detalhes,
      status: formAluno.status, convenio_id: formAluno.convenio_id,
    }).eq("id", alunoEditando.id)
    alert("Aluno atualizado")
    carregarAlunos()
    setAlunoEditando(null)
  }

  function gerarTermoPDF() {
    const doc = new jsPDF()
    let y = 20

    doc.setFontSize(14)
    doc.text("TERMO DE CIÊNCIA, RESPONSABILIDADE E AUTORIZAÇÕES", 105, y, { align: "center" })
    y += 8
    doc.setFontSize(12)
    doc.text("CT OKINAWA", 105, y, { align: "center" })
    y += 15

    doc.setFontSize(10)
    const introText = `Eu, ${formAluno.nome || "________________________________________"}, inscrito(a) no CPF nº ${formAluno.cpf || "____________________"}, declaro, para todos os fins de direito, que:`
    const splitIntro = doc.splitTextToSize(introText, 180)
    doc.text(splitIntro, 15, y)
    y += splitIntro.length * 6 + 5

    const condicaoText = formAluno.menor 
      ? `Na condição de: ( X ) Responsável legal pelo(a) aluno(a) menor ${formAluno.nome}` 
      : `Na condição de: ( X ) Aluno(a) maior de idade`
    doc.text(condicaoText, 15, y)
    y += 10

    const clausulas = [
      `1. DA CIÊNCIA DO REGULAMENTO: Declaro que recebi, li, compreendi e tive acesso ao Regulamento Interno do CT OKINAWA, estando plenamente ciente de todas as normas de funcionamento, conduta, disciplina e organização do espaço.`,
      `2. DA PRÁTICA DE ATIVIDADE FÍSICA E RISCOS: Declaro estar ciente de que a prática de artes marciais envolve riscos inerentes. Assumo integral responsabilidade pela participação, isentando o CT OKINAWA de acidentes que não sejam oriundos de dolo ou negligência direta.`,
      `3. DAS CONDIÇÕES DE SAÚDE: Declaro que: ( X ) O aluno encontra-se apto à prática de atividades físicas. ${formAluno.problema_saude ? `( X ) Informei previamente a seguinte condição de saúde: ${formAluno.saude_detalhes}` : `( ) Informei previamente alguma condição de saúde relevante.`}`,
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

    if (y > 220) { doc.addPage(); y = 20; }
    y += 10
    
    doc.text(`Nome: ${formAluno.nome || "_________________________________________"}`, 15, y); y += 6
    doc.text(`CPF: ${formAluno.cpf || "____________________"}`, 15, y); y += 6
    doc.text(`Telefone: ${formAluno.whatsapp || formAluno.responsavel_whatsapp || "____________________"}`, 15, y); y += 6
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 15, y); y += 15

    doc.text(`( X ) Aluno maior de idade`, 15, y); y += 6
    doc.text(`( X ) Responsável legal`, 15, y); y += 20

    doc.setLineWidth(0.5)
    doc.line(15, y, 100, y)
    doc.line(110, y, 195, y)
    y += 5
    doc.text(`${formAluno.menor ? formAluno.responsavel_nome || "Assinatura do Responsável" : formAluno.nome || "Assinatura do Aluno"}`, 15, y)
    doc.text(`CT OKINAWA`, 110, y)

    doc.save(`Termo_Responsabilidade_${formAluno.nome || "Aluno"}.pdf`)
  }

  async function aplicarDescontoDiretoria() {
    if (senhaDiretor !== "984215") return alert("❌ Senha de Diretoria incorreta. Operação negada.")
    if (!formDesconto.valor) return alert("Preencha o valor do desconto.")
    if (!formDesconto.recorrente && !formDesconto.meses) return alert("Preencha a quantidade de meses ou marque 'Recorrente'.")
    if (descontoEspecial) return alert("Este aluno já possui um desconto ativo.")

    setAplicandoDesconto(true)
    
    const meses = formDesconto.recorrente ? 999 : Number(formDesconto.meses)
    await supabase.from("descontos_especiais").insert([{
      aluno_id: alunoEditando.id,
      tipo: formDesconto.tipo,
      valor: Number(formDesconto.valor),
      meses_duracao: meses,
      meses_restantes: meses,
      recorrente: formDesconto.recorrente,
      status: "ativo"
    }])

    const { data: pendentes } = await supabase.from("mensalidades").select("*").eq("aluno_id", alunoEditando.id).eq("status", "pendente").order("vencimento", { ascending: true })
    
    if (pendentes) {
      let mesesUsados = 0;
      for (const m of pendentes) {
        if (!formDesconto.recorrente && mesesUsados >= Number(formDesconto.meses)) break;

        let novoValor = m.valor;
        if (formDesconto.tipo === 'fixo') novoValor = Math.max(0, novoValor - Number(formDesconto.valor));
        else novoValor = Math.max(0, novoValor - (novoValor * (Number(formDesconto.valor) / 100)));

        await supabase.from("mensalidades").update({ 
          valor: novoValor, 
          status: novoValor === 0 ? "isento" : "pendente" 
        }).eq("id", m.id)
        
        mesesUsados++;
      }
    }

    alert("✅ Desconto de Diretoria aplicado!")
    setDescontoEspecial({ tipo: formDesconto.tipo, valor: formDesconto.valor, meses_restantes: meses, recorrente: formDesconto.recorrente })
    setFormDesconto({ tipo: "fixo", valor: "", meses: "", recorrente: false })
    setSenhaDiretor("")
    setAplicandoDesconto(false)
  }

  async function cancelarDescontoDiretoria() {
    if (senhaDiretor !== "984215") return alert("❌ Senha de Diretoria incorreta. Operação negada.")
    if (!confirm("Cancelar este desconto?")) return
    await supabase.from("descontos_especiais").update({ status: "cancelado" }).eq("id", descontoEspecial.id)
    setDescontoEspecial(null)
    alert("Desconto cancelado.")
  }

  async function excluirAluno(id: string) {
    if (!confirm("Excluir aluno permanentemente?")) return
    await supabase.from("mensalidades").delete().eq("aluno_id", id)
    await supabase.from("matriculas").delete().eq("aluno_id", id)
    await supabase.from("caixa").delete().eq("aluno_id", id)
    await supabase.from("alunos").delete().eq("id", id)
    alert("Excluído")
    carregarAlunos()
    if (alunoEditando?.id === id) setAlunoEditando(null)
  }

  async function ativarInativarAluno(aluno: any) {
    const novoStatus = aluno.status === "ativo" ? "inativo" : "ativo"

    await supabase.from("alunos").update({ status: novoStatus }).eq("id", aluno.id)
    await supabase.from("matriculas").update({ status: novoStatus }).eq("aluno_id", aluno.id)

    if (novoStatus === "inativo") {
      await supabase.from("mensalidades").update({ status: "cancelado" }).eq("aluno_id", aluno.id).eq("status", "pendente")
    }

    alert(`Aluno ${novoStatus === "ativo" ? "ativado" : "inativado"} com sucesso!`)
    carregarAlunos()
  }

  async function adicionarTurmaAluno(turmaId: string) {
    if (!alunoEditando) return
    const turma = turmas.find(t => t.id === turmaId)
    if (!turma) return
    
    const { data: mod } = await supabase.from("modalidades").select("*").eq("id", turma.modalidade_id).single()

    const { data: novaMat, error: errMat } = await supabase.from("matriculas").insert([{ aluno_id: alunoEditando.id, turma_id: turmaId, status: "ativo" }]).select().single()
    
    if (errMat) {
      alert("Erro ao matricular: " + errMat.message)
      return
    }
    
    // --- CORREÇÃO DA DATA DE VENCIMENTO ---
    const dataMatricula = new Date();
    const diaVencimento = dataMatricula.getDate();

    for (let i = 1; i <= 12; i++) {
      const vencimento = new Date(dataMatricula.getFullYear(), dataMatricula.getMonth() + i, diaVencimento)
      const vencimentoStr = vencimento.toLocaleDateString('en-CA')
      
      await supabase.from("mensalidades").insert([{ 
        aluno_id: alunoEditando.id, 
        matricula_id: novaMat.id, 
        vencimento: vencimentoStr, 
        valor: mod?.valor_geral || 0, 
        valor_base: mod?.valor_base || 0, 
        status: "pendente",
        mes_referente: vencimento.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      }])
    }
    
    alert("Modalidade e 12 mensalidades geradas com sucesso!")
    const { data: rawMats } = await supabase.from("matriculas").select("*").eq("aluno_id", alunoEditando.id).eq("status", "ativo")
    const matsCompletas = await Promise.all((rawMats || []).map(async (m) => {
      const { data: t } = await supabase.from("turmas").select("*").eq("id", m.turma_id).single()
      return { ...m, turmas: t }
    }))
    setMatriculasAluno(matsCompletas)
  }

  async function removerTurmaAluno(matriculaId: string) {
    if (!confirm(`Remover esta turma?`)) return
    await supabase.from("mensalidades").update({ status: "cancelado" }).eq("matricula_id", matriculaId).eq("status", "pendente")
    await supabase.from("matriculas").update({ status: "inativo" }).eq("id", matriculaId)
    
    const { data: rawMats } = await supabase.from("matriculas").select("*").eq("aluno_id", alunoEditando.id).eq("status", "ativo")
    const matsCompletas = await Promise.all((rawMats || []).map(async (m) => {
      const { data: t } = await supabase.from("turmas").select("*").eq("id", m.turma_id).single()
      return { ...m, turmas: t }
    }))
    setMatriculasAluno(matsCompletas)
  }

  async function confirmarCancelamentoMovimentacao() {
    if (senhaCancelamento !== "984215") return alert("❌ Senha da Diretoria incorreta.")
    await supabase.from("caixa").update({ cancelado: true, valor: 0 }).eq("id", movCancelar.id)
    
    await supabase.from("logs_auditoria").insert([{
      operador: "Admin (Diretoria)",
      acao: "Cancelamento Financeiro",
      detalhes: `Cancelou ${movCancelar.tipo} de R$ ${movCancelar.valor} do aluno ${movCancelar.nome}. ID: ${movCancelar.id}`
    }])

    alert("✅ Cancelado com sucesso.")
    setMovCancelar(null)
    setSenhaCancelamento("")
    carregarMovimentacoes()
  }

  const movFiltradas = movimentacoes.filter(mov => {
    if (!mostrarCancelados && mov.cancelado) return false
    if (filtroTipo !== "todos" && mov.tipo !== filtroTipo) return false
    if (filtroParceiro && mov.parceiro_id !== filtroParceiro) return false
    return true
  })

  return (
    <AdminGuard>
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Central de Registros</h1>
        <div className="flex gap-2 mb-6">
          <button className={`px-4 py-2 rounded ${aba === "alunos" ? "bg-red-600 text-white" : "bg-gray-200"}`} onClick={() => setAba("alunos")}>Alunos</button>
          <button className={`px-4 py-2 rounded ${aba === "movimentacoes" ? "bg-red-600 text-white" : "bg-gray-200"}`} onClick={() => setAba("movimentacoes")}>Movimentações</button>
        </div>

        {aba === "alunos" && (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="grid md:grid-cols-2 gap-6 p-4">
              <div className="border-r pr-4">
                <input type="text" placeholder="Buscar aluno..." className="w-full p-2 border rounded mb-3" value={buscaAluno} onChange={e => setBuscaAluno(e.target.value)} />
                <div className="max-h-150 overflow-y-auto">
                  {alunos.filter(a => a.nome?.toLowerCase().includes(buscaAluno.toLowerCase())).map(aluno => (
                    <div key={aluno.id} className="border-b p-2 flex justify-between items-center">
                      <div className="cursor-pointer" onClick={() => editarAluno(aluno)}>
                        <p className="font-semibold">{aluno.nome}</p>
                        <p className="text-xs text-gray-500">
                          Nº Matrícula: {aluno.numero_matricula || "---"} | CPF: {aluno.cpf || "---"}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => ativarInativarAluno(aluno)} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">{aluno.status === "ativo" ? "Inativar" : "Ativar"}</button>
                        <button onClick={() => excluirAluno(aluno.id)} className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">Excluir</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {alunoEditando && (
                <div className="pl-4 space-y-3 max-h-175 overflow-y-auto pr-2">
                  <div className="bg-gray-100 p-2 rounded">
                    <label className="text-xs font-semibold text-gray-500">Nº Matrícula</label>
                    <input className="w-full p-2 border rounded bg-transparent font-bold text-red-600" readOnly value={formAluno.numero_matricula || "---"} />
                  </div>

                  <input className="w-full p-2 border rounded" placeholder="Nome" value={formAluno.nome} onChange={e => setFormAluno({...formAluno, nome: e.target.value})} />
                  <input className="w-full p-2 border rounded" placeholder="CPF" value={formAluno.cpf} onChange={e => setFormAluno({...formAluno, cpf: e.target.value})} />
                  <input className="w-full p-2 border rounded" placeholder="RG" value={formAluno.rg} onChange={e => setFormAluno({...formAluno, rg: e.target.value})} />
                  <input type="date" className="w-full p-2 border rounded" value={formAluno.nascimento} onChange={e => setFormAluno({...formAluno, nascimento: e.target.value})} />
                  <input className="w-full p-2 border rounded" placeholder="WhatsApp" value={formAluno.whatsapp} onChange={e => setFormAluno({...formAluno, whatsapp: e.target.value})} />
                  <input className="w-full p-2 border rounded" placeholder="Email" value={formAluno.email} onChange={e => setFormAluno({...formAluno, email: e.target.value})} />
                  <input className="w-full p-2 border rounded" placeholder="Endereço" value={formAluno.endereco} onChange={e => setFormAluno({...formAluno, endereco: e.target.value})} />
                  
                  <label className="flex items-center gap-2"><input type="checkbox" checked={formAluno.menor} onChange={e => setFormAluno({...formAluno, menor: e.target.checked})} /> Menor de idade</label>
                  {formAluno.menor && (
                    <div className="grid md:grid-cols-2 gap-3 pl-4">
                      <input className="p-2 border rounded" placeholder="Responsável" value={formAluno.responsavel_nome} onChange={e => setFormAluno({...formAluno, responsavel_nome: e.target.value})} />
                      <input className="p-2 border rounded" placeholder="CPF Responsável" value={formAluno.responsavel_cpf} onChange={e => setFormAluno({...formAluno, responsavel_cpf: e.target.value})} />
                      <input className="p-2 border rounded" placeholder="WhatsApp Responsável" value={formAluno.responsavel_whatsapp} onChange={e => setFormAluno({...formAluno, responsavel_whatsapp: e.target.value})} />
                      <input className="p-2 border rounded" placeholder="Email Responsável" value={formAluno.responsavel_email} onChange={e => setFormAluno({...formAluno, responsavel_email: e.target.value})} />
                    </div>
                  )}

                  <div className="border p-2 rounded">
                    <label><input type="checkbox" checked={formAluno.problema_saude} onChange={e => setFormAluno({...formAluno, problema_saude: e.target.checked})} /> Problema de saúde</label>
                    {formAluno.problema_saude && <textarea className="w-full border rounded mt-1" value={formAluno.saude_detalhes} onChange={e => setFormAluno({...formAluno, saude_detalhes: e.target.value})} />}
                    <label className="mt-2 block"><input type="checkbox" checked={formAluno.usa_remedio} onChange={e => setFormAluno({...formAluno, usa_remedio: e.target.checked})} /> Uso de remédio</label>
                    {formAluno.usa_remedio && <textarea className="w-full border rounded mt-1" value={formAluno.remedio_detalhes} onChange={e => setFormAluno({...formAluno, remedio_detalhes: e.target.value})} />}
                  </div>

                  <select className="w-full p-2 border rounded" value={formAluno.status} onChange={e => setFormAluno({...formAluno, status: e.target.value})}>
                    <option value="ativo">Ativo</option><option value="inativo">Inativo</option><option value="bloqueado">Bloqueado</option>
                  </select>
                  <select className="w-full p-2 border rounded" value={formAluno.convenio_id} onChange={e => setFormAluno({...formAluno, convenio_id: e.target.value})}>
                    <option value="">Nenhum convênio</option>
                    {convenios.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>

                  <h3 className="font-semibold mt-4 border-t pt-2 text-red-600 flex items-center gap-2"><Gift size={18}/> Desconto de Diretoria</h3>
                  
                  {descontoEspecial ? (
                    <div className="bg-red-50 border border-red-200 p-3 rounded">
                      <p className="text-sm font-semibold text-red-700">Desconto Ativo {descontoEspecial.recorrente && "(Recorrente)"}</p>
                      <p className="text-xs text-gray-600 mb-2">{descontoEspecial.tipo === "fixo" ? `R$ ${descontoEspecial.valor}` : `${descontoEspecial.valor}%`}.</p>
                      <div className="flex gap-2 mt-2">
                        <input type="password" placeholder="Senha Diretor" className="w-1/2 p-1 border rounded text-sm" value={senhaDiretor} onChange={e => setSenhaDiretor(e.target.value)} />
                        <button onClick={cancelarDescontoDiretoria} className="bg-red-600 text-white text-xs px-3 py-1 rounded">Cancelar Desconto</button>
                      </div>
                    </div>
                  ) : (
                    <div className="border p-3 rounded bg-gray-50 space-y-2">
                      <select className="w-full p-2 border rounded" value={formDesconto.tipo} onChange={e => setFormDesconto({...formDesconto, tipo: e.target.value})}>
                        <option value="fixo">Desconto em R$ (Ex: 30)</option>
                        <option value="percentual">Desconto em % (Ex: 20)</option>
                      </select>
                      <input type="number" className="w-full p-2 border rounded" placeholder="Valor do Desconto" value={formDesconto.valor} onChange={e => setFormDesconto({...formDesconto, valor: e.target.value})} />
                      
                      <label className="flex items-center gap-2 text-sm font-semibold text-blue-700">
                        <input type="checkbox" checked={formDesconto.recorrente} onChange={e => setFormDesconto({...formDesconto, recorrente: e.target.checked, meses: e.target.checked ? "" : formDesconto.meses})} />
                        Desconto Recorrente (Para Sempre)
                      </label>

                      {!formDesconto.recorrente && (
                        <input type="number" className="w-full p-2 border rounded" placeholder="Meses de duração (Ex: 10)" value={formDesconto.meses} onChange={e => setFormDesconto({...formDesconto, meses: e.target.value})} />
                      )}

                      <div className="border-t pt-2 mt-2">
                        <label className="text-xs font-bold text-gray-500 flex items-center gap-1 mb-1"><Lock size={12}/> Autorização da Diretoria</label>
                        <input type="password" className="w-full p-2 border border-red-300 rounded" placeholder="Digite a senha" value={senhaDiretor} onChange={e => setSenhaDiretor(e.target.value)} />
                      </div>

                      <button onClick={aplicarDescontoDiretoria} disabled={aplicandoDesconto} className="w-full bg-gray-800 text-white p-2 rounded mt-2 hover:bg-black">Aplicar Desconto</button>
                    </div>
                  )}

                  <div className="border-t pt-4 mt-4">
                    <button onClick={gerarTermoPDF} className="w-full bg-blue-600 text-white p-2 rounded flex items-center justify-center gap-2">
                      <FileText size={18}/> Gerar e Imprimir Termo (PDF)
                    </button>
                  </div>

                  <h3 className="font-semibold mt-4 border-t pt-2">Modalidades / Turmas</h3>
                  {matriculasAluno.map(mat => {
                    const turma = turmas.find(t => t.id === mat.turma_id)
                    const modalidade = modalidades.find(m => m.id === turma?.modalidade_id)
                    return (
                      <div key={mat.id} className="flex justify-between items-center border p-2 rounded mb-2">
                        <span><strong>{modalidade?.nome || "?"}</strong> - {turma?.nome || "?"}</span>
                        <button onClick={() => removerTurmaAluno(mat.id)} className="text-red-600 text-sm">Remover</button>
                      </div>
                    )
                  })}

                  <div className="flex gap-2 mt-2 items-center">
                    <select className="flex-1 p-2 border rounded" onChange={async (e) => {
                      const modalidadeId = e.target.value
                      if (!modalidadeId) return
                      const turmasFiltradas = turmas.filter(t => t.modalidade_id === modalidadeId)
                      if (turmasFiltradas.length === 0) { alert("Nenhuma turma cadastrada para esta modalidade."); return }
                      let turmaEscolhida = null
                      if (turmasFiltradas.length === 1) { turmaEscolhida = turmasFiltradas[0] } 
                      else {
                        const nomeTurma = prompt("Turmas: " + turmasFiltradas.map(t=>t.nome).join(", ") + "\nDigite o nome:")
                        if (nomeTurma) turmaEscolhida = turmasFiltradas.find(t => t.nome.toLowerCase() === nomeTurma.toLowerCase())
                      }
                      if (turmaEscolhida) await adicionarTurmaAluno(turmaEscolhida.id)
                      e.target.value = ""
                    }} defaultValue="">
                      <option value="">+ Adicionar modalidade...</option>
                      {modalidades.map(mod => <option key={mod.id} value={mod.id}>{mod.nome}</option>)}
                    </select>
                  </div>

                  <div className="flex gap-2 mt-4 border-t pt-4">
                    <button onClick={salvarAluno} className="bg-red-600 text-white px-4 py-2 rounded">Salvar Alterações</button>
                    <button onClick={() => setAlunoEditando(null)} className="bg-gray-300 px-4 py-2 rounded">Fechar</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {aba === "movimentacoes" && (
          <div className="bg-white rounded-xl shadow p-4">
            <div className="grid md:grid-cols-4 gap-3 mb-4">
              <select className="p-2 border rounded" value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
                <option value="todos">Todos</option><option value="matricula">Matrícula</option><option value="mensalidade">Mensalidade</option><option value="venda">Venda</option>
              </select>
              <select className="p-2 border rounded" value={filtroParceiro} onChange={e => setFiltroParceiro(e.target.value)}>
                <option value="">Todos os parceiros</option>
                {parceiros.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
              <label className="flex items-center gap-2"><input type="checkbox" checked={mostrarCancelados} onChange={e => setMostrarCancelados(e.target.checked)} /> Mostrar cancelados</label>
            </div>
            <table className="w-full">
              <thead className="bg-gray-100"><tr><th className="p-2 text-left">Data</th><th className="p-2 text-left">Tipo</th><th className="p-2 text-left">Valor</th><th className="p-2 text-left">Ação</th></tr></thead>
              <tbody>
                {movFiltradas.map(mov => (
                  <tr key={mov.id} className="border-t">
                    <td className="p-2">{new Date(mov.data).toLocaleDateString()}</td>
                    <td className="p-2 capitalize">{mov.tipo}</td>
                    <td className="p-2">R$ {Number(mov.valor).toFixed(2)}</td>
                    <td className="p-2">
                      {!mov.cancelado && (
                        <button onClick={() => { setMovCancelar(mov); setSenhaCancelamento(""); }} className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600">Cancelar</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {movCancelar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-2 text-red-600 flex items-center gap-2"><Trash2 size={20}/> Confirmar Cancelamento</h2>
            <p className="text-sm text-gray-600 mb-4">Cancelar <b>{movCancelar.tipo}</b> de R$ {Number(movCancelar.valor).toFixed(2)}?</p>
            <label className="block text-sm font-semibold mb-1">Senha da Diretoria</label>
            <input type="password" placeholder="Senha" className="w-full p-2 border rounded mb-4" value={senhaCancelamento} onChange={e => setSenhaCancelamento(e.target.value)} />
            <div className="flex gap-2">
              <button onClick={confirmarCancelamentoMovimentacao} className="bg-red-600 text-white p-2 rounded flex-1">Confirmar</button>
              <button onClick={() => setMovCancelar(null)} className="bg-gray-300 p-2 rounded">Voltar</button>
            </div>
          </div>
        </div>
      )}
    </AdminGuard>
  )
}