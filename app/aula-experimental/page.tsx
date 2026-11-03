"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import { useRouter } from "next/navigation"
import { CalendarDays, UserPlus, Trash2, MessageCircle, FileText, Download } from "lucide-react"
import jsPDF from "jspdf"

export default function AulaExperimentalPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [modalidades, setModalidades] = useState<any[]>([])
  const [turmas, setTurmas] = useState<any[]>([])
  const [agendamentos, setAgendamentos] = useState<any[]>([])
  const [abaAtiva, setAbaAtiva] = useState<"pendente" | "compareceu" | "matriculado">("pendente")

  const [form, setForm] = useState({
    nome: "", responsavel: "", telefone: "",
    modalidade_id: "", turma_id: "", data_aula: new Date().toISOString().split('T')[0]
  })

  useEffect(() => { carregarDados() }, [])

  async function carregarDados() {
    const { data: mods } = await supabase.from("modalidades").select("*").eq("status", "ativo")
    setModalidades(mods || [])
    
    const { data: turs } = await supabase.from("turmas").select("*, modalidades(nome)").eq("status", "ativo")
    setTurmas(turs || [])
    
    const { data: ags } = await supabase.from("aulas_experimentais").select("*, modalidades(nome), turmas(nome, horario)").order("data_aula")
    setAgendamentos(ags || [])
  }

  async function agendar(e: any) {
    e.preventDefault()
    if (!form.nome || !form.telefone || !form.modalidade_id || !form.turma_id || !form.data_aula) {
      return alert("Preencha todos os campos obrigatórios.")
    }
    setLoading(true)
    
    const { data: novoAgendamento, error } = await supabase.from("aulas_experimentais").insert([form]).select("*, modalidades(nome), turmas(nome, horario)").single()
    
    if (error) {
      alert("Erro ao agendar: " + error.message)
    } else {
      alert("✅ Aula experimental agendada! O comprovante será baixado.")
      gerarComprovantePDF(novoAgendamento) // Gera o PDF logo após agendar
      setForm({ nome: "", responsavel: "", telefone: "", modalidade_id: "", turma_id: "", data_aula: new Date().toISOString().split('T')[0] })
      carregarDados()
    }
    setLoading(false)
  }

  // --- GERAR PDF DO COMPROVANTE ---
  function gerarComprovantePDF(ag: any) {
    const doc = new jsPDF()
    const dataFormatada = new Date(ag.data_aula + "T12:00:00").toLocaleDateString('pt-BR')
    const horario = ag.turmas?.horario || "A confirmar"

    // Cabeçalho
    doc.setFillColor(128, 0, 128) // Cor roxa
    doc.rect(0, 0, 210, 30, "F")
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(22)
    doc.setFont("helvetica", "bold")
    doc.text("CT OKINAWA", 105, 15, { align: "center" })
    doc.setFontSize(12)
    doc.text("Comprovante de Agendamento - Aula Experimental", 105, 23, { align: "center" })

    // Corpo
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(12)
    doc.text("DADOS DO ALUNO", 20, 50)
    doc.setLineWidth(0.5)
    doc.line(20, 52, 190, 52)
    
    doc.setFontSize(11)
    doc.setFont("helvetica", "normal")
    doc.text(`Nome: ${ag.nome}`, 20, 60)
    doc.text(`WhatsApp: ${ag.telefone}`, 20, 68)
    if (ag.responsavel) doc.text(`Responsável: ${ag.responsavel}`, 20, 76)

    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text("DADOS DA AULA", 20, 95)
    doc.line(20, 97, 190, 97)

    doc.setFontSize(11)
    doc.setFont("helvetica", "normal")
    doc.text(`Modalidade: ${ag.modalidades?.nome}`, 20, 105)
    doc.text(`Turma: ${ag.turmas?.nome}`, 20, 113)
    doc.text(`Data: ${dataFormatada}`, 20, 121)
    doc.text(`Horário: ${horario}`, 20, 129)

    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text("LOCAL", 20, 145)
    doc.line(20, 147, 190, 147)
    doc.setFontSize(11)
    doc.setFont("helvetica", "normal")
    doc.text("R. Pres. Médici, 278 - Águas Claras, Salvador - BA, 41311-050", 20, 155)

    // Avisos Importantes
    doc.setFontSize(12)
    doc.setFont("helvetica", "bold")
    doc.text("INSTRUÇÕES IMPORTANTES", 20, 175)
    doc.line(20, 177, 190, 177)
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    const avisos = [
      "1. Chegue com 10 minutos de antecedência.",
      "2. Vista roupas confortáveis para a prática esportiva.",
      "3. Traga uma garrafa de água.",
      "4. Esta aula é experimental e não gera vínculo contratual."
    ]
    let y = 185
    avisos.forEach(aviso => {
      doc.text(aviso, 20, y)
      y += 6
    })

    // Rodapé
    doc.setFontSize(10)
    doc.setTextColor(150, 150, 150)
    doc.text("Este documento é um comprovante de agendamento. Apresente no dia da aula.", 105, 280, { align: "center" })

    doc.save(`Comprovante_Aula_Experimental_${ag.nome}.pdf`)
  }

  async function excluirAgendamento(id: string) {
    if (!confirm("Tem certeza que deseja excluir este registro?")) return
    const { error } = await supabase.from("aulas_experimentais").delete().eq("id", id)
    if (error) alert("Erro ao excluir: " + error.message)
    else carregarDados()
  }

  async function converterParaMatricula(ag: any) {
    await supabase.from("aulas_experimentais").update({ status: "matriculado" }).eq("id", ag.id)
    const query = new URLSearchParams({ nome: ag.nome, whatsapp: ag.telefone }).toString()
    router.push(`/matricula?${query}`)
  }

  function enviarWhatsApp(ag: any, tipo: "comprovante" | "lembrete") {
    let numero = ag.telefone.replace(/\D/g, "")
    if (!numero.startsWith("55")) numero = "55" + numero

    const dataFormatada = new Date(ag.data_aula + "T12:00:00").toLocaleDateString('pt-BR')
    const horario = ag.turmas?.horario || "horário a confirmar"

    let mensagem = ""
    if (tipo === "comprovante") {
      mensagem = `Olá, *${ag.nome}*! Tudo bem?\n\nSua aula experimental de *${ag.modalidades?.nome}* está confirmada! 🥋\n\n📅 Data: ${dataFormatada}\n⏰ Horário: ${horario}\n📍 Local: R. Pres. Médici, 278 - Águas Claras\n\n⚠️ *Estou enviando em anexo o comprovante de agendamento.* Chegue com 10 minutinhos de antecedência!\n\nQualquer dúvida, estamos à disposição. Até lá! OSS!`
    } else {
      mensagem = `Olá, *${ag.nome}*! Passando para lembrar da sua aula experimental de *${ag.modalidades?.nome}* HOJE!\n\n⏰ Horário: ${horario}\n\nEstamos te esperando! Se precisar reagendar, nos avise. OSS! 🥋`
    }

    const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`
    window.open(url, "_blank")
  }

  const agendamentosFiltrados = agendamentos.filter(a => a.status === abaAtiva)

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><CalendarDays /> Funil de Aula Experimental</h1>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-4 border border-gray-100 h-fit">
          <h2 className="font-bold text-lg mb-4 text-purple-700">Agendar Nova Aula</h2>
          <form onSubmit={agendar} className="space-y-3">
            <input className="input" placeholder="Nome do Aluno *" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} required />
            <input className="input" placeholder="Responsável (se menor)" value={form.responsavel} onChange={e => setForm({...form, responsavel: e.target.value})} />
            <input className="input" placeholder="WhatsApp *" value={form.telefone} onChange={e => setForm({...form, telefone: e.target.value})} required />
            
            <select className="input" value={form.modalidade_id} onChange={e => setForm({...form, modalidade_id: e.target.value, turma_id: ""})} required>
              <option value="">Selecione a Modalidade *</option>
              {modalidades.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
            </select>

            <select className="input" value={form.turma_id} onChange={e => setForm({...form, turma_id: e.target.value})} disabled={!form.modalidade_id} required>
              <option value="">Selecione a Turma *</option>
              {turmas.filter(t => t.modalidade_id === form.modalidade_id).map(t => (
                <option key={t.id} value={t.id}>{t.nome} ({t.horario || "s/ horário"})</option>
              ))}
            </select>

            <input type="date" className="input" value={form.data_aula} onChange={e => setForm({...form, data_aula: e.target.value})} required />

            <button type="submit" disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold p-3 rounded mt-2 transition">
              {loading ? "Agendando..." : "Agendar e Baixar Comprovante"}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow p-4 border border-gray-100 flex flex-col h-150">
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            <button onClick={() => setAbaAtiva("pendente")} className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition ${abaAtiva === 'pendente' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Ainda Vão Fazer</button>
            <button onClick={() => setAbaAtiva("compareceu")} className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition ${abaAtiva === 'compareceu' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Fizeram (Cobrar)</button>
            <button onClick={() => setAbaAtiva("matriculado")} className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition ${abaAtiva === 'matriculado' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Já Matriculados</button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {agendamentosFiltrados.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Nenhum registro nesta aba.</p>
            ) : (
              agendamentosFiltrados.map(ag => (
                <div key={ag.id} className="border p-3 rounded-lg bg-gray-50 flex flex-col gap-2 relative">
                  <button onClick={() => excluirAgendamento(ag.id)} className="absolute top-2 right-2 text-red-400 hover:text-red-600 bg-white rounded-full p-1 shadow-sm" title="Excluir Registro">
                    <Trash2 size={16} />
                  </button>
                  <div>
                    <p className="font-bold text-lg">{ag.nome}</p>
                    <p className="text-xs text-gray-600 font-medium">WhatsApp: {ag.telefone}</p>
                    <p className="text-xs text-gray-600">Mod: {ag.modalidades?.nome} | Turma: {ag.turmas?.nome} {ag.turmas?.horario ? `(${ag.turmas.horario})` : ''}</p>
                    <p className="text-xs text-blue-600 font-bold mt-1">Data da Aula: {new Date(ag.data_aula + "T12:00:00").toLocaleDateString('pt-BR')}</p>
                  </div>
                  
                  <div className="mt-2 grid grid-cols-3 gap-1">
                    <button onClick={() => gerarComprovantePDF(ag)} className="bg-gray-200 text-gray-800 hover:bg-gray-300 text-xs font-bold py-2 rounded flex items-center justify-center gap-1 transition" title="Baixar PDF">
                      <Download size={14}/> PDF
                    </button>
                    <button onClick={() => enviarWhatsApp(ag, "comprovante")} className="bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs font-bold py-2 rounded flex items-center justify-center gap-1 transition" title="Enviar Comprovante no WhatsApp">
                      <FileText size={14}/> Enviar Comp.
                    </button>
                    <button onClick={() => enviarWhatsApp(ag, "lembrete")} className="bg-green-100 text-green-700 hover:bg-green-200 text-xs font-bold py-2 rounded flex items-center justify-center gap-1 transition" title="Enviar Lembrete no WhatsApp">
                      <MessageCircle size={14}/> Lembrete
                    </button>
                  </div>

                  {abaAtiva !== "matriculado" && (
                    <div className="mt-1">
                      <button onClick={() => converterParaMatricula(ag)} className="w-full bg-green-600 hover:bg-green-700 text-white text-sm font-bold py-2 rounded flex items-center justify-center gap-2 transition">
                        <UserPlus size={16}/> Converter em Matrícula
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      <style jsx>{`
        .input { width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 8px; }
      `}</style>
    </div>
  )
}