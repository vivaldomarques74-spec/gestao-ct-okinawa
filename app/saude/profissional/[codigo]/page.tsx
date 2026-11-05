"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "../../../../lib/supabase"
import { Clock, FileText, Printer, ArrowLeft, UploadCloud, UserCheck, RefreshCw, CheckCircle } from "lucide-react"
import jsPDF from "jspdf"

export default function PortalProfissional() {
  const params = useParams()
  const router = useRouter()
  const codigo = params.codigo as string

  const [loading, setLoading] = useState(true)
  const [profissional, setProfissional] = useState<any>(null)
  const [filaEspera, setFilaEspera] = useState<any[]>([])
  const [agendaFutura, setAgendaFutura] = useState<any[]>([])
  const [pacienteSelecionado, setPacienteSelecionado] = useState<any>(null)
  const [prontuarios, setProntuarios] = useState<any[]>([])

  const [abaAtiva, setAbaAtiva] = useState<"fila" | "agenda" | "prontuario">("fila")
  const [formProntuario, setFormProntuario] = useState({ tipo_documento: "evolucao", conteudo: "", link_exame: "" })
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (codigo) carregarPortal()
  }, [codigo])

  async function carregarPortal() {
    setLoading(true)
    const { data: prof, error } = await supabase.from("profissionais_saude").select("*").eq("codigo_acesso", codigo).maybeSingle()

    if (error || !prof) {
      alert("Código de acesso inválido.")
      router.push("/")
      return
    }
    setProfissional(prof)

    const { data: fila } = await supabase
      .from("agendamentos_saude")
      .select("*, servicos_saude(nome, valor)")
      .eq("profissional_id", prof.id)
      .eq("status", "na_fila")
      .order("hora_chegada", { ascending: true }) 
    
    setFilaEspera(fila || [])

    const hoje = new Date().toISOString()
    const daqui7Dias = new Date()
    daqui7Dias.setDate(daqui7Dias.getDate() + 7)

    const { data: agenda } = await supabase
      .from("agendamentos_saude")
      .select("*, servicos_saude(nome, valor)")
      .eq("profissional_id", prof.id)
      .eq("status", "agendado")
      .gte("data_hora", hoje)
      .lte("data_hora", daqui7Dias.toISOString())
      .order("data_hora", { ascending: true })

    setAgendaFutura(agenda || [])
    setLoading(false)
  }

  async function selecionarPaciente(ag: any) {
    setPacienteSelecionado(ag)
    setAbaAtiva("prontuario")
    setFormProntuario({ tipo_documento: "evolucao", conteudo: "", link_exame: "" })

    let query = supabase.from("prontuarios_saude").select("*").order("created_at", { ascending: false })
    
    if (ag.aluno_id) query = query.eq("aluno_id", ag.aluno_id)
    else if (ag.paciente_id) query = query.eq("paciente_id", ag.paciente_id)
    else query = query.eq("agendamento_id", ag.id)

    const { data: pronts } = await query
    setProntuarios(pronts || [])
  }

  async function salvarProntuario() {
    if (!formProntuario.conteudo.trim()) return alert("Digite o conteúdo do prontuário/receita.")
    
    setSalvando(true)
    const { error } = await supabase.from("prontuarios_saude").insert([{
      agendamento_id: pacienteSelecionado.id,
      aluno_id: pacienteSelecionado.aluno_id || null,
      paciente_id: pacienteSelecionado.paciente_id || null,
      profissional_id: profissional.id,
      tipo_documento: formProntuario.tipo_documento,
      conteudo: formProntuario.conteudo,
      link_exame: formProntuario.link_exame || null
    }])

    if (error) alert("Erro ao salvar: " + error.message)
    else {
      alert("✅ Documento salvo no prontuário!")
      setFormProntuario({ tipo_documento: "evolucao", conteudo: "", link_exame: "" })
      selecionarPaciente(pacienteSelecionado)
    }
    setSalvando(false)
  }

  async function finalizarAtendimento() {
    if (!confirm("Deseja finalizar o atendimento deste paciente?")) return
    setSalvando(true)
    const agora = new Date().toISOString()

    await supabase.from("agendamentos_saude").update({ 
      status: "finalizado", 
      hora_saida: agora 
    }).eq("id", pacienteSelecionado.id)

    alert("✅ Atendimento finalizado! O paciente já está disponível na recepção.")
    setPacienteSelecionado({ ...pacienteSelecionado, status: 'finalizado', hora_saida: agora })
    carregarPortal()
    setSalvando(false)
  }

  function gerarAtestadoComparecimento() {
    const doc = new jsPDF()
    let y = 20

    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text("ATESTADO DE COMPARECIMENTO", 105, y, { align: "center" })
    y += 15

    const dataFormatada = new Date(pacienteSelecionado.data_hora).toLocaleDateString('pt-BR')
    const chegada = pacienteSelecionado.hora_chegada ? new Date(pacienteSelecionado.hora_chegada).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}) : "---"
    const saida = pacienteSelecionado.hora_saida ? new Date(pacienteSelecionado.hora_saida).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}) : new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})

    doc.setFontSize(11)
    doc.setFont("helvetica", "normal")
    
    const texto = `Atesto, para os devidos fins, que o(a) paciente ${pacienteSelecionado.nome_paciente} compareceu a esta clínica no dia ${dataFormatada}, das ${chegada} às ${saida}, para atendimento com o(a) profissional ${profissional.nome} (${profissional.especialidade}).`
    
    const splitTexto = doc.splitTextToSize(texto, 170)
    doc.text(splitTexto, 20, y)
    y += splitTexto.length * 6 + 40

    doc.setLineWidth(0.5)
    doc.line(50, y, 160, y)
    y += 5
    doc.setFont("helvetica", "bold")
    doc.text(`${profissional.nome}`, 105, y, { align: "center" })
    doc.setFont("helvetica", "normal")
    doc.text(`Registro: ${profissional.registro_profissional || '---'}`, 105, y + 5, { align: "center" })
    doc.text(`CT OKINAWA`, 105, y + 10, { align: "center" })

    doc.save(`Atestado_${pacienteSelecionado.nome_paciente}.pdf`)
  }

  function gerarDocumentoPDF(prontuario: any) {
    const img = new Image()
    img.src = '/logo-color.png'
    img.onload = () => {
      const doc = new jsPDF()
      doc.addImage(img, 'PNG', 65, 10, 80, 45)
      let y = 70
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      const titulos: any = { receita: "RECEITA / PRESCRIÇÃO", atestado: "ATESTADO", solicitacao_exame: "SOLICITAÇÃO DE EXAMES", evolucao: "EVOLUÇÃO CLÍNICA", anamnese: "ANAMNESE" }
      doc.text(titulos[prontuario.tipo_documento] || "DOCUMENTO CLÍNICO", 105, y, { align: "center" })
      y += 10
      doc.setDrawColor(204, 0, 0)
      doc.setLineWidth(0.5)
      doc.line(20, y, 190, y)
      y += 15
      doc.setFontSize(11)
      doc.setFont("helvetica", "normal")
      doc.text(`Paciente: ${pacienteSelecionado.nome_paciente}`, 20, y); y += 7
      doc.text(`Data: ${new Date(prontuario.created_at).toLocaleDateString('pt-BR')}`, 20, y); y += 15
      const splitText = doc.splitTextToSize(prontuario.conteudo, 170)
      splitText.forEach((linha: string) => { if (y > 260) { doc.addPage(); y = 20 } doc.text(linha, 20, y); y += 6 })
      if (y > 220) { doc.addPage(); y = 20 }
      y += 30
      doc.setLineWidth(0.5)
      doc.line(60, y, 150, y)
      y += 5
      doc.setFontSize(10)
      doc.setFont("helvetica", "bold")
      doc.text(`${profissional.nome}`, 105, y, { align: "center" })
      doc.setFont("helvetica", "normal")
      doc.text(`Registro: ${profissional.registro_profissional || '---'}`, 105, y + 5, { align: "center" })
      doc.text(`CT OKINAWA`, 105, y + 10, { align: "center" })
      doc.save(`${prontuario.tipo_documento}_${pacienteSelecionado.nome_paciente}.pdf`)
    }
  }

  if (loading) return <div className="p-10 text-center">Carregando portal...</div>
  if (!profissional) return null

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-white shadow-sm p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src="/logo-color.png" alt="CT Okinawa" className="h-10" />
          <div>
            <h1 className="font-bold text-lg">{profissional.nome}</h1>
            <p className="text-xs text-gray-500 capitalize">{profissional.especialidade.replace('_', ' ')} • Reg: {profissional.registro_profissional || '---'}</p>
          </div>
        </div>
        <div className="text-right text-xs text-gray-500">
          <p><b>Atendimento:</b> {profissional.dias_atendimento || 'A definir'}</p>
          <p>{profissional.horario_atendimento || ''}</p>
        </div>
        <button onClick={() => router.push("/")} className="text-gray-500 hover:text-red-600 text-sm flex items-center gap-1">
          <ArrowLeft size={16} /> Sair
        </button>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[80vh]">
          <div className="flex border-b">
            <button onClick={() => setAbaAtiva("fila")} className={`flex-1 p-3 font-bold text-sm text-center transition ${abaAtiva === 'fila' || abaAtiva === 'prontuario' ? 'bg-teal-50 text-teal-700 border-b-2 border-teal-600' : 'text-gray-500 hover:bg-gray-50'}`}>Fila ({filaEspera.length})</button>
            <button onClick={() => setAbaAtiva("agenda")} className={`flex-1 p-3 font-bold text-sm text-center transition ${abaAtiva === 'agenda' ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}>Agenda</button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {abaAtiva === "fila" && (
              filaEspera.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <UserCheck size={48} className="opacity-20 mb-2"/>
                  <p className="text-center text-sm">Nenhum paciente na fila.</p>
                </div>
              ) : (
                filaEspera.map((ag, index) => (
                  <div key={ag.id} onClick={() => selecionarPaciente(ag)} className={`p-3 rounded-lg border cursor-pointer transition ${pacienteSelecionado?.id === ag.id ? 'bg-teal-50 border-teal-300' : 'bg-white hover:bg-gray-50'}`}>
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-bold text-sm">{index + 1}º - {ag.nome_paciente}</p>
                    </div>
                    <p className="text-xs text-gray-600">Chegou às {new Date(ag.hora_chegada).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</p>
                    <p className="text-xs text-gray-500 mt-1">{ag.servicos_saude?.nome}</p>
                  </div>
                ))
              )
            )}

            {abaAtiva === "agenda" && (
              agendaFutura.length === 0 ? (
                <p className="text-center text-gray-500 py-6 text-sm">Nenhum agendamento futuro.</p>
              ) : (
                agendaFutura.map(ag => (
                  <div key={ag.id} className="p-3 rounded-lg border bg-white mb-2">
                    <p className="font-bold text-sm text-blue-800">{new Date(ag.data_hora).toLocaleDateString('pt-BR')} às {new Date(ag.data_hora).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</p>
                    <p className="font-bold text-gray-700">{ag.nome_paciente} {ag.is_retorno && <span className="text-[10px] bg-blue-100 px-1 py-0.5 rounded text-blue-700">RETORNO</span>}</p>
                    <p className="text-xs text-gray-500">{ag.servicos_saude?.nome}</p>
                  </div>
                ))
              )
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 md:col-span-2 flex flex-col h-[80vh]">
          {!pacienteSelecionado ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 flex-col gap-2">
              <FileText size={48} className="opacity-20" />
              <p>Selecione um paciente na fila para abrir o prontuário.</p>
            </div>
          ) : (
            <>
              <div className="bg-gray-50 p-4 border-b flex flex-wrap justify-between items-center gap-2">
                <div>
                  <h2 className="font-bold text-lg text-teal-700">{pacienteSelecionado.nome_paciente}</h2>
                  <p className="text-sm text-gray-600">Serviço: {pacienteSelecionado.servicos_saude?.nome}</p>
                </div>
                <div className="flex gap-2 items-center">
                  <span className="text-sm font-semibold bg-gray-200 px-3 py-1 rounded">Data: {new Date(pacienteSelecionado.data_hora).toLocaleDateString('pt-BR')}</span>
                  
                  {pacienteSelecionado.status === 'na_fila' && (
                    <button onClick={() => finalizarAtendimento()} className="bg-green-600 text-white px-3 py-1.5 rounded text-sm font-bold flex items-center gap-1 hover:bg-green-700">
                      <CheckCircle size={14}/> Finalizar Atendimento
                    </button>
                  )}

                  {pacienteSelecionado.status === 'finalizado' && (
                    <button onClick={gerarAtestadoComparecimento} className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm font-bold flex items-center gap-1 hover:bg-blue-700 shadow-md">
                      <FileText size={14}/> Emitir Atestado
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 flex overflow-hidden">
                <div className="w-1/2 border-r overflow-y-auto p-4 bg-gray-50">
                  <h3 className="font-bold text-sm text-gray-500 uppercase mb-3">Histórico</h3>
                  {prontuarios.length === 0 ? (
                    <p className="text-sm text-gray-400">Nenhum registro anterior.</p>
                  ) : (
                    <div className="space-y-3">
                      {prontuarios.map(p => (
                        <div key={p.id} className="bg-white p-3 rounded border shadow-sm">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded uppercase">{p.tipo_documento.replace('_', ' ')}</span>
                            <span className="text-xs text-gray-400">{new Date(p.created_at).toLocaleDateString()}</span>
                          </div>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{p.conteudo}</p>
                          {p.link_exame && <a href={p.link_exame} target="_blank" className="text-xs text-blue-500 underline mt-2 block">Ver Exame</a>}
                          <button onClick={() => gerarDocumentoPDF(p)} className="mt-3 w-full border border-red-200 text-red-600 py-1.5 rounded text-xs flex items-center justify-center gap-1 hover:bg-red-50 transition"><Printer size={14}/> Imprimir</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="w-1/2 p-4 flex flex-col">
                  <h3 className="font-bold text-sm text-gray-500 uppercase mb-3">Novo Lançamento</h3>
                  
                  <label className="text-xs font-bold text-gray-600 mb-1">Tipo de Documento</label>
                  <select className="border p-2 rounded text-sm mb-3 bg-gray-50" value={formProntuario.tipo_documento} onChange={e => setFormProntuario({...formProntuario, tipo_documento: e.target.value})}>
                    <option value="evolucao">Evolução / Anotação</option>
                    {profissional.especialidade === 'nutricionista' && <option value="receita">Receita / Prescrição</option>}
                    {profissional.especialidade === 'nutricionista' && <option value="solicitacao_exame">Solicitação de Exames</option>}
                    {profissional.especialidade === 'educador_fisico' && <option value="atestado">Atestado de Aptidão Física</option>}
                    {profissional.especialidade === 'fisioterapeuta' && <option value="atestado">Atestado de Comparecimento</option>}
                    <option value="anamnese">Anamnese Completa</option>
                  </select>

                  <label className="text-xs font-bold text-gray-600 mb-1">Conteúdo</label>
                  <textarea className="flex-1 border p-2 rounded text-sm resize-none focus:ring-2 focus:ring-teal-500 outline-none" placeholder="Digite aqui..." value={formProntuario.conteudo} onChange={e => setFormProntuario({...formProntuario, conteudo: e.target.value})} disabled={pacienteSelecionado.status === 'finalizado'} />

                  <label className="text-xs font-bold text-gray-600 mb-1 mt-3 flex items-center gap-1"><UploadCloud size={14}/> Link de Exame (Opcional)</label>
                  <input type="url" className="border p-2 rounded text-sm mb-3" placeholder="Cole o link..." value={formProntuario.link_exame} onChange={e => setFormProntuario({...formProntuario, link_exame: e.target.value})} disabled={pacienteSelecionado.status === 'finalizado'} />

                  <button onClick={salvarProntuario} disabled={salvando || pacienteSelecionado.status === 'finalizado'} className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 rounded transition disabled:opacity-50">
                    {salvando ? "Salvando..." : pacienteSelecionado.status === 'finalizado' ? "Atendimento Finalizado" : "Salvar no Prontuário"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}