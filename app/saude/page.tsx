"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import { useRouter } from "next/navigation"
import { Calendar, MessageCircle, Trash2, Search, Plus, Clock, PlayCircle, RefreshCw, Users, FileText, Eye, GraduationCap, ShieldCheck, CheckCircle, Printer } from "lucide-react"
import { calcularPagamento } from "../../lib/pagamentos"
import jsPDF from "jspdf"

export default function AgendamentoSaudePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [aba, setAba] = useState<"agenda" | "alunos" | "pacientes">("agenda")
  
  const [profissionais, setProfissionais] = useState<any[]>([])
  const [servicos, setServicos] = useState<any[]>([])
  const [agendamentos, setAgendamentos] = useState<any[]>([])
  const [pacientesExternos, setPacientesExternos] = useState<any[]>([])
  const [alunos, setAlunos] = useState<any[]>([])
  const [buscaPaciente, setBuscaPaciente] = useState("")
  const [filtroFila, setFiltroFila] = useState("todos")

  const [form, setForm] = useState({
    profissional_id: "", servico_id: "", paciente_tipo: "aluno", paciente_id: "",
    data_hora: "", observacoes: "", is_retorno: false
  })

  const [modalPagamento, setModalPagamento] = useState<any>(null)
  const [formaPagamento, setFormaPagamento] = useState("Pix")
  const [tipoCartao, setTipoCartao] = useState("Crédito")
  const [parcelas, setParcelas] = useState("1x")
  const [codigoPagamento, setCodigoPagamento] = useState("")

  const [modalHistorico, setModalHistorico] = useState<any>(null)
  const [historicoPaciente, setHistoricoPaciente] = useState<any[]>([])

  useEffect(() => { carregarDados() }, [])

  async function carregarDados() {
    const { data: profs } = await supabase.from("profissionais_saude").select("*").eq("status", "ativo")
    setProfissionais(profs || [])

    const { data: alns } = await supabase.from("alunos").select("id, nome, whatsapp, cpf").eq("status", "ativo").order("nome")
    setAlunos(alns || [])

    const { data: pacs } = await supabase.from("pacientes_saude").select("*").order("nome")
    setPacientesExternos(pacs || [])

    const { data: ags } = await supabase
      .from("agendamentos_saude")
      .select("*, profissionais_saude(nome, especialidade), servicos_saude(nome, valor)")
      .order("data_hora", { ascending: true }) 
    setAgendamentos(ags || [])
  }

  async function carregarServicos(profId: string) {
    const { data } = await supabase.from("servicos_saude").select("*").eq("profissional_id", profId).eq("status", "ativo")
    setServicos(data || [])
  }

  function handleProfissionalChange(profId: string) {
    setForm({ ...form, profissional_id: profId, servico_id: "" })
    carregarServicos(profId)
  }

  async function cadastrarPacienteRapido() {
    const nome = prompt("Digite o NOME do novo paciente externo:")
    if (!nome) return
    const cpf = prompt("Digite o CPF (opcional):")
    const telefone = prompt("Digite o WhatsApp (obrigatório):")

    if (!telefone) return alert("WhatsApp é obrigatório.")

    const { data, error } = await supabase.from("pacientes_saude").insert([{ nome, cpf, telefone }]).select().single()
    if (error) return alert("Erro ao cadastrar paciente.")
    
    alert("✅ Paciente cadastrado!")
    setPacientesExternos([...pacientesExternos, data])
    setForm({ ...form, paciente_id: data.id, paciente_tipo: "externo" })
    setBuscaPaciente(data.nome)
  }

  async function agendar(e: any) {
    e.preventDefault()
    if (!form.profissional_id || !form.servico_id || !form.paciente_id || !form.data_hora) {
      return alert("Preencha todos os campos obrigatórios.")
    }

    setLoading(true)
    const servico = servicos.find(s => s.id === form.servico_id)
    
    let nomePaciente = ""
    let whatsappPaciente = ""
    let alunoId = null
    let pacienteId = null

    if (form.paciente_tipo === "aluno") {
      const aluno = alunos.find(a => a.id === form.paciente_id)
      nomePaciente = aluno?.nome || ""
      whatsappPaciente = aluno?.whatsapp || ""
      alunoId = aluno?.id
    } else {
      const pac = pacientesExternos.find(p => p.id === form.paciente_id)
      nomePaciente = pac?.nome || ""
      whatsappPaciente = pac?.telefone || ""
      pacienteId = pac?.id
    }

    const { error } = await supabase.from("agendamentos_saude").insert([{
      aluno_id: alunoId, paciente_id: pacienteId, nome_paciente: nomePaciente, whatsapp_paciente: whatsappPaciente,
      profissional_id: form.profissional_id, servico_id: form.servico_id, data_hora: form.data_hora,
      valor: form.is_retorno ? 0 : (servico?.valor || 0), status: "agendado", is_retorno: form.is_retorno, observacoes: form.observacoes
    }])

    if (error) {
      alert("Erro ao agendar: " + error.message)
    } else {
      alert("✅ Consulta agendada com sucesso!")
      
      const dataFormatada = new Date(form.data_hora).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
      const mensagem = `Olá, *${nomePaciente}*! Sua consulta no CT Okinawa foi agendada.\n\n🩺 *Profissional:* ${profissionais.find(p=>p.id===form.profissional_id)?.nome}\n📅 *Data/Hora:* ${dataFormatada}\n\nAté breve!`
      let numero = whatsappPaciente.replace(/\D/g, "")
      if (numero && !numero.startsWith("55")) numero = "55" + numero
      if(numero) window.open(`https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`, "_blank")

      setForm({ profissional_id: "", servico_id: "", paciente_tipo: "aluno", paciente_id: "", data_hora: "", observacoes: "", is_retorno: false })
      setBuscaPaciente("")
      carregarDados()
    }
    setLoading(false)
  }

  function gerarAtestadoComparecimento(ag: any) {
    const doc = new jsPDF()
    let y = 20

    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text("ATESTADO DE COMPARECIMENTO", 105, y, { align: "center" })
    y += 15

    const dataFormatada = new Date(ag.data_hora).toLocaleDateString('pt-BR')
    const chegada = ag.hora_chegada ? new Date(ag.hora_chegada).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}) : "---"
    const saida = ag.hora_saida ? new Date(ag.hora_saida).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}) : new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})

    doc.setFontSize(11)
    doc.setFont("helvetica", "normal")
    
    const texto = `Atesto, para os devidos fins, que o(a) paciente ${ag.nome_paciente} compareceu a esta clínica no dia ${dataFormatada}, das ${chegada} às ${saida}, para atendimento com o(a) profissional ${ag.profissionais_saude?.nome} (${ag.profissionais_saude?.especialidade}).`
    
    const splitTexto = doc.splitTextToSize(texto, 170)
    doc.text(splitTexto, 20, y)
    y += splitTexto.length * 6 + 40

    doc.setLineWidth(0.5)
    doc.line(50, y, 160, y)
    y += 5
    doc.setFont("helvetica", "bold")
    doc.text(`${ag.profissionais_saude?.nome}`, 105, y, { align: "center" })
    doc.setFont("helvetica", "normal")
    doc.text(`Registro: ${profissionais.find(p => p.id === ag.profissional_id)?.registro_profissional || '---'}`, 105, y + 5, { align: "center" })
    doc.text(`CT OKINAWA`, 105, y + 10, { align: "center" })

    doc.save(`Atestado_${ag.nome_paciente}.pdf`)
  }

  function gerarTCLE(pac: any, tipo: 'externo' | 'aluno') {
    const doc = new jsPDF()
    let y = 20
    
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text("TERMO DE CONSENTIMENTO LIVRE E ESCLARECIDO (TCLE)", 105, y, { align: "center" })
    y += 15

    doc.setFontSize(11)
    doc.setFont("helvetica", "normal")
    
    const texto = `Eu, ${pac.nome}, inscrito(a) no CPF nº ${pac.cpf || '---'}, declaro que fui devidamente informado(a) e esclarecido(a) sobre os procedimentos de atendimento na área de saúde do CT OKINAWA. Estou ciente dos riscos inerentes e autorizo a realização dos procedimentos e o tratamento dos meus dados pessoais conforme a LGPD.`
    
    const splitTexto = doc.splitTextToSize(texto, 170)
    doc.text(splitTexto, 20, y)
    y += splitTexto.length * 6 + 30

    doc.line(20, y, 90, y)
    doc.line(110, y, 180, y)
    y += 5
    doc.text(`${pac.nome} (Paciente/Responsável)`, 20, y)
    doc.text(`CT OKINAWA (Profissional)`, 110, y)

    doc.save(`TCLE_${pac.nome}.pdf`)
  }

  async function verHistorico(pac: any, tipo: 'externo' | 'aluno') {
    setModalHistorico(pac)
    let query = supabase.from("prontuarios_saude").select("*, profissionais_saude(nome)").order("created_at", { ascending: false })
    if (tipo === 'externo') query = query.eq("paciente_id", pac.id)
    else query = query.eq("aluno_id", pac.id)

    const { data } = await query
    setHistoricoPaciente(data || [])
  }

  function agendarRetorno(pac: any, tipo: 'externo' | 'aluno') {
    const ultimaConsulta = agendamentos
      .filter(a => (tipo === 'externo' ? a.paciente_id === pac.id : a.aluno_id === pac.id) && (a.status === 'finalizado' || a.status === 'atendido'))
      .sort((a, b) => new Date(b.data_hora).getTime() - new Date(a.data_hora).getTime())[0]

    if (!ultimaConsulta) {
      alert("Não encontrei consultas anteriores. Agende manualmente na aba 'Agenda'.")
      setAba("agenda")
      return
    }

    setForm({
      profissional_id: ultimaConsulta.profissional_id,
      servico_id: ultimaConsulta.servico_id,
      paciente_tipo: tipo,
      paciente_id: pac.id,
      data_hora: "",
      observacoes: `Retorno da consulta de ${new Date(ultimaConsulta.data_hora).toLocaleDateString()}`,
      is_retorno: true
    })
    
    carregarServicos(ultimaConsulta.profissional_id)
    setAba("agenda")
    alert(`Retorno de ${pac.nome} pré-preenchido. Escolha a data!`)
  }

  function tornarAluno(pac: any) {
    if (!confirm(`Deseja levar ${pac.nome} para a tela de Matrícula como Aluno?`)) return
    const query = new URLSearchParams({ nome: pac.nome, whatsapp: pac.telefone || "", cpf: pac.cpf || "" }).toString()
    router.push(`/matricula?${query}`)
  }

  function iniciarCheckIn(ag: any) {
    if (ag.is_retorno) {
      if (confirm("Este agendamento é um RETORNO (Isento). Confirmar a chegada?")) executarCheckIn(ag)
    } else {
      setModalPagamento(ag)
      setFormaPagamento("Pix")
      setTipoCartao("Crédito")
      setParcelas("1x")
      setCodigoPagamento("")
    }
  }

  function confirmarPagamento() {
    if (!modalPagamento) return
    if ((formaPagamento === "Pix" || formaPagamento === "Cartão") && !codigoPagamento.trim()) {
      return alert("Insira o código de autorização da maquininha.")
    }
    const valorBase = Number(modalPagamento.valor)
    const resultado = calcularPagamento(valorBase, formaPagamento, tipoCartao, parcelas, 0)
    executarCheckIn(modalPagamento, resultado.valorFinal)
  }

  async function executarCheckIn(ag: any, valorFinal: number = 0) {
    setLoading(true)
    const agora = new Date().toISOString()
    
    if (!ag.is_retorno && valorFinal > 0) {
      const { data: caixaTurno } = await supabase.from("caixa_turno").select("*").eq("status", "aberto").maybeSingle()
      if (!caixaTurno) {
        alert("⚠️ O caixa está fechado.")
        setLoading(false)
        return
      }

      await supabase.from("caixa").insert([{
        caixa_turno_id: caixaTurno.id, tipo: "saude", nome: `Consulta: ${ag.nome_paciente} - ${ag.servicos_saude?.nome}`,
        valor: valorFinal, valor_base: ag.valor, forma_pagamento: formaPagamento,
        tipo_cartao: formaPagamento === "Cartão" ? tipoCartao : null,
        parcelas: formaPagamento === "Cartão" && tipoCartao === "Crédito" ? parcelas : null,
        codigo_pagamento: codigoPagamento || null, data: agora, cancelado: false, aluno_id: ag.aluno_id || null
      }])
    }

    await supabase.from("agendamentos_saude").update({ 
      status: "na_fila", hora_chegada: agora,
      valor: valorFinal > 0 ? valorFinal : ag.valor,
      pago: ag.is_retorno ? true : (valorFinal > 0)
    }).eq("id", ag.id)
    
    alert("✅ Check-in realizado! Paciente na fila de espera.")
    setModalPagamento(null)
    carregarDados()
    setLoading(false)
  }

  async function excluirAgendamento(id: string) {
    if (!confirm("Excluir este agendamento?")) return
    await supabase.from("agendamentos_saude").delete().eq("id", id)
    carregarDados()
  }

  function enviarLembreteWhatsApp(ag: any) {
    let numero = ag.whatsapp_paciente.replace(/\D/g, "")
    if (!numero.startsWith("55")) numero = "55" + numero
    const dataFormatada = new Date(ag.data_hora).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
    const mensagem = `Olá, *${ag.nome_paciente}*! Lembrete da sua consulta no CT Okinawa.\n\n🩺 *Profissional:* ${ag.profissionais_saude?.nome}\n📅 *Data/Hora:* ${dataFormatada}\n\nAté breve!`
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`, "_blank")
  }

  const pacientesFiltrados = form.paciente_tipo === 'aluno' 
    ? alunos.filter(a => a.nome.toLowerCase().includes(buscaPaciente.toLowerCase()))
    : pacientesExternos.filter(p => p.nome.toLowerCase().includes(buscaPaciente.toLowerCase()))

  const hojeStr = new Date().toISOString().split('T')[0]
  const agendamentosHoje = agendamentos.filter(a => a.data_hora.startsWith(hojeStr))
  const agendados = agendamentosHoje.filter(a => a.status === 'agendado').sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime())
  const filaEspera = agendamentosHoje.filter(a => a.status === 'na_fila').filter(a => filtroFila === "todos" || a.profissional_id === filtroFila).sort((a, b) => new Date(a.hora_chegada).getTime() - new Date(b.hora_chegada).getTime())
  const finalizados = agendamentosHoje.filter(a => a.status === 'finalizado').sort((a, b) => new Date(b.hora_saida).getTime() - new Date(a.hora_saida).getTime())

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Calendar /> Módulo de Saúde</h1>
        <div className="flex bg-gray-200 rounded-lg p-1">
          <button onClick={() => setAba("agenda")} className={`px-4 py-2 rounded-md font-bold text-sm transition ${aba === 'agenda' ? 'bg-white shadow text-teal-700' : 'text-gray-600'}`}>Agenda do Dia</button>
          <button onClick={() => setAba("alunos")} className={`px-4 py-2 rounded-md font-bold text-sm transition ${aba === 'alunos' ? 'bg-white shadow text-teal-700' : 'text-gray-600'}`}>Alunos</button>
          <button onClick={() => setAba("pacientes")} className={`px-4 py-2 rounded-md font-bold text-sm transition ${aba === 'pacientes' ? 'bg-white shadow text-teal-700' : 'text-gray-600'}`}>Pacientes Externos</button>
        </div>
      </div>

      {aba === "agenda" && (
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow p-4 border border-gray-100 h-fit">
            <h2 className="font-bold text-lg mb-4 text-teal-700">Novo Agendamento</h2>
            {form.is_retorno && <div className="bg-blue-100 text-blue-800 p-2 text-xs font-bold rounded mb-2">🔄 AGENDANDO UM RETORNO (ISENTO)</div>}
            
            <form onSubmit={agendar} className="space-y-3">
              <select className="input" value={form.profissional_id} onChange={e => handleProfissionalChange(e.target.value)} required>
                <option value="">Profissional...</option>
                {profissionais.map(p => <option key={p.id} value={p.id}>{p.nome} ({p.especialidade})</option>)}
              </select>

              <select className="input" value={form.servico_id} onChange={e => setForm({...form, servico_id: e.target.value})} disabled={!form.profissional_id} required>
                <option value="">Serviço...</option>
                {servicos.map(s => <option key={s.id} value={s.id}>{s.nome} - R$ {s.valor.toFixed(2)}</option>)}
              </select>

              <div className="border-t pt-3 mt-3">
                <div className="flex gap-2 mb-2">
                  <button type="button" onClick={() => setForm({...form, paciente_tipo: 'aluno', paciente_id: ''})} className={`flex-1 py-1 text-sm font-bold rounded ${form.paciente_tipo === 'aluno' ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600'}`}>Aluno</button>
                  <button type="button" onClick={() => setForm({...form, paciente_tipo: 'externo', paciente_id: ''})} className={`flex-1 py-1 text-sm font-bold rounded ${form.paciente_tipo === 'externo' ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600'}`}>Externo</button>
                </div>

                {form.paciente_tipo === 'externo' && (
                  <button type="button" onClick={cadastrarPacienteRapido} className="w-full bg-blue-100 text-blue-700 font-bold py-2 rounded mb-2 flex items-center justify-center gap-1 hover:bg-blue-200">
                    <Plus size={16}/> Cadastrar Novo
                  </button>
                )}

                <div className="relative">
                  <Search size={16} className="absolute left-3 top-3 text-gray-400"/>
                  <input type="text" placeholder="Buscar..." className="input pl-10" value={buscaPaciente} onChange={e => setBuscaPaciente(e.target.value)} />
                </div>

                <select className="input mt-2" value={form.paciente_id} onChange={e => setForm({...form, paciente_id: e.target.value})} required>
                  <option value="">Selecione o paciente...</option>
                  {pacientesFiltrados.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              </div>

              <input type="datetime-local" className="input" value={form.data_hora} onChange={e => setForm({...form, data_hora: e.target.value})} required />

              <button type="submit" disabled={loading} className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold p-3 rounded mt-2 transition">
                {loading ? "Agendando..." : form.is_retorno ? "Agendar Retorno" : "Agendar Consulta"}
              </button>
            </form>
          </div>

          <div className="md:col-span-2 space-y-6">
            <div className="bg-yellow-50 rounded-xl shadow-sm p-4 border border-yellow-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-lg text-yellow-800 flex items-center gap-2"><Clock size={20} /> Fila de Espera</h2>
                <select className="text-sm p-1.5 border rounded bg-white" value={filtroFila} onChange={e => setFiltroFila(e.target.value)}>
                  <option value="todos">Todos os Profissionais</option>
                  {profissionais.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              </div>
              {filaEspera.length === 0 ? (
                <p className="text-sm text-yellow-600 italic">Nenhum paciente na fila de espera.</p>
              ) : (
                <div className="space-y-3">
                  {filaEspera.map((ag, index) => (
                    <div key={ag.id} className="bg-white border p-3 rounded-lg flex justify-between items-center shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="bg-yellow-400 text-white font-bold rounded-full w-8 h-8 flex items-center justify-center">{index + 1}º</div>
                        <div>
                          <p className="font-bold">{ag.nome_paciente}</p>
                          <p className="text-xs text-gray-600">Chegou: {new Date(ag.hora_chegada).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})} | {ag.profissionais_saude?.nome}</p>
                        </div>
                      </div>
                      <button onClick={() => excluirAgendamento(ag.id)} className="text-red-500 p-2 hover:bg-red-50 rounded"><Trash2 size={18}/></button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
              <h2 className="font-bold text-lg mb-4 text-gray-800 flex items-center gap-2"><Calendar size={20} /> Agendados Hoje</h2>
              {agendados.length === 0 ? (
                <p className="text-sm text-gray-500 italic">Nenhum paciente agendado para hoje.</p>
              ) : (
                <div className="space-y-3">
                  {agendados.map(ag => (
                    <div key={ag.id} className={`border p-3 rounded-lg flex flex-col md:flex-row justify-between md:items-center gap-2 ${ag.is_retorno ? 'bg-blue-50 border-blue-200' : ''}`}>
                      <div>
                        <p className="font-bold">{ag.nome_paciente} {ag.is_retorno && <span className="text-[10px] bg-blue-200 text-blue-800 px-2 py-0.5 rounded">RETORNO</span>}</p>
                        <p className="text-xs text-gray-600">{new Date(ag.data_hora).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})} | {ag.profissionais_saude?.nome} - {ag.servicos_saude?.nome}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => enviarLembreteWhatsApp(ag)} className="text-green-600 p-2 rounded hover:bg-green-50" title="Lembrete"><MessageCircle size={18}/></button>
                        <button onClick={() => iniciarCheckIn(ag)} className={`${ag.is_retorno ? 'bg-blue-600 hover:bg-blue-700' : 'bg-teal-600 hover:bg-teal-700'} text-white px-3 py-2 rounded text-sm flex items-center gap-1 font-bold`}>
                          <PlayCircle size={16}/> {ag.is_retorno ? 'Check-in' : 'Check-in e Pagar'}
                        </button>
                        <button onClick={() => excluirAgendamento(ag.id)} className="text-red-500 p-2 hover:bg-red-50 rounded"><Trash2 size={18}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* FINALIZADOS HOJE (PARA SECRETARIA EMITIR ATESTADO) */}
            {finalizados.length > 0 && (
              <div className="bg-gray-50 rounded-xl shadow-sm p-4 border border-gray-200">
                <h2 className="font-bold text-lg mb-4 text-gray-800 flex items-center gap-2"><CheckCircle size={20} /> Finalizados Hoje</h2>
                <div className="space-y-3">
                  {finalizados.map(ag => (
                    <div key={ag.id} className="border p-3 rounded-lg flex flex-col md:flex-row justify-between md:items-center gap-2 bg-white">
                      <div>
                        <p className="font-bold">{ag.nome_paciente}</p>
                        <p className="text-xs text-gray-600">{ag.profissionais_saude?.nome} | Chegou: {new Date(ag.hora_chegada).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})} | Saiu: {new Date(ag.hora_saida).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => gerarAtestadoComparecimento(ag)} className="bg-blue-100 text-blue-700 px-3 py-2 rounded text-sm flex items-center gap-1 font-bold hover:bg-blue-200">
                          <Printer size={16}/> Imprimir Atestado
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ABA ALUNOS */}
      {aba === "alunos" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h2 className="font-bold text-lg text-teal-700 mb-2 flex items-center gap-2"><GraduationCap size={20}/> Histórico de Saúde dos Alunos</h2>
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left">
              <thead className="bg-gray-100 text-gray-600 text-sm">
                <tr><th className="p-3">Nome</th><th className="p-3">WhatsApp</th><th className="p-3">Total de Consultas</th><th className="p-3">Ações</th></tr>
              </thead>
              <tbody>
                {alunos.map(pac => {
                  const totalConsultas = agendamentos.filter(a => a.aluno_id === pac.id && (a.status === 'atendido' || a.status === 'finalizado')).length
                  if (totalConsultas === 0) return null; 
                  return (
                    <tr key={pac.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-semibold">{pac.nome}</td>
                      <td className="p-3 text-sm text-gray-600">{pac.whatsapp}</td>
                      <td className="p-3 text-sm font-bold text-teal-700">{totalConsultas}</td>
                      <td className="p-3 flex gap-2">
                        <button onClick={() => verHistorico(pac, 'aluno')} className="bg-gray-200 text-gray-800 text-xs font-bold px-3 py-1.5 rounded hover:bg-gray-300 flex items-center gap-1"><Eye size={14}/> Histórico</button>
                        <button onClick={() => agendarRetorno(pac, 'aluno')} className="bg-teal-600 text-white text-xs font-bold px-3 py-1.5 rounded hover:bg-teal-700 flex items-center gap-1"><RefreshCw size={14}/> Agendar Retorno</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ABA PACIENTES EXTERNOS */}
      {aba === "pacientes" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h2 className="font-bold text-lg text-teal-700 mb-2 flex items-center gap-2"><Users size={20}/> Pacientes Externos</h2>
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left">
              <thead className="bg-gray-100 text-gray-600 text-sm">
                <tr><th className="p-3">Nome</th><th className="p-3">WhatsApp</th><th className="p-3">Total de Consultas</th><th className="p-3">Ações</th></tr>
              </thead>
              <tbody>
                {pacientesExternos.map(pac => {
                  const totalConsultas = agendamentos.filter(a => a.paciente_id === pac.id && (a.status === 'atendido' || a.status === 'finalizado')).length
                  if (totalConsultas === 0) return null;
                  return (
                    <tr key={pac.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-semibold">{pac.nome}</td>
                      <td className="p-3 text-sm text-gray-600">{pac.telefone}</td>
                      <td className="p-3 text-sm font-bold text-teal-700">{totalConsultas}</td>
                      <td className="p-3 flex gap-2">
                        <button onClick={() => gerarTCLE(pac, 'externo')} className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1.5 rounded hover:bg-blue-200 flex items-center gap-1" title="Termo de Consentimento"><ShieldCheck size={14}/> TCLE</button>
                        <button onClick={() => verHistorico(pac, 'externo')} className="bg-gray-200 text-gray-800 text-xs font-bold px-2 py-1.5 rounded hover:bg-gray-300 flex items-center gap-1"><Eye size={14}/> Histórico</button>
                        <button onClick={() => agendarRetorno(pac, 'externo')} className="bg-teal-600 text-white text-xs font-bold px-2 py-1.5 rounded hover:bg-teal-700 flex items-center gap-1"><RefreshCw size={14}/> Retorno</button>
                        <button onClick={() => tornarAluno(pac)} className="bg-purple-600 text-white text-xs font-bold px-2 py-1.5 rounded hover:bg-purple-700 flex items-center gap-1"><GraduationCap size={14}/> Aluno</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL DE HISTÓRICO */}
      {modalHistorico && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="bg-gray-800 p-4 text-white flex justify-between items-center">
              <h2 className="text-xl font-bold">Histórico de {modalHistorico.nome}</h2>
              <button onClick={() => setModalHistorico(null)} className="text-gray-400 hover:text-white">Fechar</button>
            </div>
            <div className="p-4 overflow-y-auto bg-gray-50 flex-1 space-y-3">
              {historicoPaciente.length === 0 ? <p className="text-center text-gray-500 py-10">Nenhum registro.</p> : (
                historicoPaciente.map(h => (
                  <div key={h.id} className="bg-white p-4 rounded border shadow-sm">
                    <div className="flex justify-between items-center mb-2 border-b pb-2">
                      <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2 py-1 rounded uppercase">{h.tipo_documento.replace('_', ' ')}</span>
                      <span className="text-xs text-gray-500">{new Date(h.created_at).toLocaleDateString()} - {h.profissionais_saude?.nome}</span>
                    </div>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{h.conteudo}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE PAGAMENTO */}
      {modalPagamento && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-teal-600 p-4 text-white">
              <h2 className="text-xl font-bold">Check-in e Pagamento</h2>
              <p className="text-teal-100 text-sm">{modalPagamento.nome_paciente}</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Forma de Pagamento</label>
                <select className="w-full p-2 border rounded" value={formaPagamento} onChange={e => setFormaPagamento(e.target.value)}>
                  <option>Pix</option><option>Dinheiro</option><option>Cartão</option>
                </select>
              </div>
              {formaPagamento === "Cartão" && (
                <div className="grid grid-cols-2 gap-2">
                  <select className="w-full p-2 border rounded" value={tipoCartao} onChange={e => setTipoCartao(e.target.value)}>
                    <option>Débito</option><option>Crédito</option>
                  </select>
                  {tipoCartao === "Crédito" && (
                    <select className="w-full p-2 border rounded" value={parcelas} onChange={e => setParcelas(e.target.value)}>
                      {Array.from({ length: 21 }, (_, i) => i + 1).map(n => <option key={n} value={`${n}x`}>{n}x</option>)}
                    </select>
                  )}
                </div>
              )}
              {(formaPagamento === "Pix" || formaPagamento === "Cartão") && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Código de Autorização</label>
                  <input type="text" className="w-full p-2 border rounded" placeholder="Código da maquininha" value={codigoPagamento} onChange={e => setCodigoPagamento(e.target.value)} />
                </div>
              )}
              <div className="bg-gray-50 p-3 rounded border text-center">
                <p className="text-sm text-gray-500">Valor a Pagar</p>
                <p className="text-2xl font-bold text-gray-800">R$ {Number(modalPagamento.valor).toFixed(2)}</p>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={confirmarPagamento} className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded transition">Confirmar</button>
                <button onClick={() => setModalPagamento(null)} className="bg-gray-200 text-gray-700 px-4 rounded hover:bg-gray-300">Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .input { width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 8px; }
      `}</style>
    </div>
  )
}