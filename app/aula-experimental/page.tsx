"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import { useRouter } from "next/navigation"
import { CalendarDays, UserPlus, Trash2, MessageCircle, FileText, Download, FileSignature } from "lucide-react"
import jsPDF from "jspdf"

export default function AulaExperimentalPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [modalidades, setModalidades] = useState<any[]>([])
  const [turmas, setTurmas] = useState<any[]>([])
  const [agendamentos, setAgendamentos] = useState<any[]>([])
  const [abaAtiva, setAbaAtiva] = useState<"pendente" | "compareceu" | "matriculado" | "todos">("pendente")

  const [form, setForm] = useState({
    nome: "", responsavel: "", telefone: "",
    modalidade_id: "", turma_id: "", data_aula: new Date().toISOString().split('T')[0]
  })

  useEffect(() => { carregarDados() }, [])

  async function carregarDados() {
    const { data: mods } = await supabase.from("modalidades").select("*")
    setModalidades(mods || [])
    
    const { data: turs } = await supabase.from("turmas").select("*")
    setTurmas(turs || [])
    
    const { data: ags } = await supabase.from("aulas_experimentais").select("*").order("data_aula")
    
    const agendamentosCruzados = (ags || []).map(ag => {
      const turma = turs?.find(t => t.id === ag.turma_id)
      const mod = mods?.find(m => m.id === ag.modalidade_id)
      
      let horario = "s/ horário"
      if (turma?.hora_inicio && turma?.hora_fim) {
        horario = `${turma.hora_inicio} às ${turma.hora_fim}`
      } else if (turma?.horario) {
        horario = turma.horario
      }

      let statusNormalizado = ag.status
      if (!statusNormalizado || statusNormalizado === "agendado") statusNormalizado = "pendente"

      return {
        ...ag,
        status: statusNormalizado,
        modalidade_nome: mod?.nome || "?",
        turma_nome: turma?.nome || "?",
        turma_horario: horario
      }
    })

    setAgendamentos(agendamentosCruzados)
  }

  async function agendar(e: any) {
    e.preventDefault()
    if (!form.nome || !form.telefone || !form.modalidade_id || !form.turma_id || !form.data_aula) {
      return alert("Preencha todos os campos obrigatórios.")
    }
    setLoading(true)
    
    const { data: novoAgendamento, error } = await supabase.from("aulas_experimentais").insert([{ ...form, status: "pendente" }]).select().single()
    
    if (error) {
      alert("Erro ao agendar: " + error.message)
    } else {
      alert("✅ Aula experimental agendada! O comprovante será baixado.")
      
      const turma = turmas.find(t => t.id === form.turma_id)
      const mod = modalidades.find(m => m.id === form.modalidade_id)
      let horario = "A confirmar"
      if (turma?.hora_inicio && turma?.hora_fim) horario = `${turma.hora_inicio} às ${turma.hora_fim}`
      else if (turma?.horario) horario = turma.horario

      const agParaPDF = {
        ...novoAgendamento,
        modalidades: { nome: mod?.nome },
        turmas: { nome: turma?.nome, horario: horario }
      }

      gerarComprovantePDF(agParaPDF) 
      setForm({ nome: "", responsavel: "", telefone: "", modalidade_id: "", turma_id: "", data_aula: new Date().toISOString().split('T')[0] })
      carregarDados()
    }
    setLoading(false)
  }

  // --- COMPROVANTE DE AGENDAMENTO (LOGO AJUSTADA) ---
  function gerarComprovantePDF(ag: any) {
    // Carrega a imagem antes de gerar o PDF para não dar erro
    const img = new Image()
    img.src = '/logo-color.png'

    img.onload = () => {
      const doc = new jsPDF()
      const dataFormatada = new Date(ag.data_aula + "T12:00:00").toLocaleDateString('pt-BR')
      const horario = ag.turmas?.horario || ag.turma_horario || "A confirmar"

      // Adiciona a logo centralizada (X=65, Y=10, Largura=80, Altura=45) - Mantém proporção
      doc.addImage(img, 'PNG', 65, 10, 80, 45)

      // Título
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text("COMPROVANTE DE AGENDAMENTO - AULA EXPERIMENTAL", 105, 65, { align: "center" })

      doc.setDrawColor(204, 0, 0) // Linha vermelha
      doc.setLineWidth(0.5)
      doc.line(20, 70, 190, 70)

      // DADOS DO ALUNO
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text("DADOS DO ALUNO", 20, 80)
      doc.line(20, 82, 190, 82)
      
      doc.setFontSize(11)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(50, 50, 50)
      doc.text(`Nome: ${ag.nome}`, 20, 90)
      doc.text(`WhatsApp: ${ag.telefone}`, 20, 98)
      if (ag.responsavel) doc.text(`Responsável: ${ag.responsavel}`, 20, 106)

      // DADOS DA AULA
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(0, 0, 0)
      doc.text("DADOS DA AULA", 20, 120)
      doc.line(20, 122, 190, 122)
      
      doc.setFontSize(11)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(50, 50, 50)
      doc.text(`Modalidade: ${ag.modalidades?.nome}`, 20, 130)
      doc.text(`Turma: ${ag.turmas?.nome}`, 20, 138)
      doc.text(`Data: ${dataFormatada}`, 20, 146)
      doc.text(`Horário: ${horario}`, 20, 154)

      // LOCAL
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(0, 0, 0)
      doc.text("LOCAL", 20, 170)
      doc.line(20, 172, 190, 172)
      
      doc.setFontSize(11)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(50, 50, 50)
      doc.text("R. Pres. Médici, 278 - Águas Claras, Salvador - BA, 41311-050", 20, 180)

      // INSTRUÇÕES
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(0, 0, 0)
      doc.text("INSTRUÇÕES IMPORTANTES", 20, 195)
      doc.line(20, 197, 190, 197)
      
      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(50, 50, 50)
      const avisos = [
        "1. Chegue com 10 minutos de antecedência.",
        "2. Vista roupas confortáveis para a prática esportiva.",
        "3. Traga uma garrafa de água.",
        "4. Esta aula é experimental e não gera vínculo contratual."
      ]
      let y = 205
      avisos.forEach(aviso => {
        doc.text(aviso, 20, y)
        y += 6
      })

      // Rodapé
      doc.setFontSize(10)
      doc.setTextColor(150, 150, 150)
      doc.text("Disciplina • Respeito • Evolução", 105, 280, { align: "center" })

      doc.save(`Comprovante_Aula_Experimental_${ag.nome}.pdf`)
    }
  }

  // --- TERMO DE CIÊNCIA (LOGO AJUSTADA) ---
  function gerarTermoCienciaPDF(ag: any) {
    const img = new Image()
    img.src = '/logo-color.png'

    img.onload = () => {
      const doc = new jsPDF()
      const dataFormatada = new Date(ag.data_aula + "T12:00:00").toLocaleDateString('pt-BR')

      // Adiciona a logo
      doc.addImage(img, 'PNG', 65, 10, 80, 45)

      doc.setTextColor(0, 0, 0)
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text("TERMO DE CIÊNCIA E RESPONSABILIDADE", 105, 65, { align: "center" })
      doc.setFontSize(12)
      doc.text("AULA EXPERIMENTAL", 105, 73, { align: "center" })

      doc.setDrawColor(204, 0, 0) // Linha vermelha
      doc.setLineWidth(0.5)
      doc.line(20, 78, 190, 78)

      doc.setFontSize(11)
      doc.setFont("helvetica", "normal")
      doc.setTextColor(50, 50, 50)
      
      let texto = ""
      if (ag.responsavel) {
        texto = `Eu, ${ag.responsavel}, na qualidade de responsável legal pelo(a) aluno(a) ${ag.nome}, declaro para os devidos fins que:`
      } else {
        texto = `Eu, ${ag.nome}, declaro para os devidos fins que:`
      }
      
      let splitText = doc.splitTextToSize(texto, 170)
      doc.text(splitText, 20, 90)
      let y = 90 + (splitText.length * 6) + 5

      const clausulas = [
        `1. Estou ciente de que a prática de artes marciais (${ag.modalidade_nome || "Artes Marciais"}) é uma atividade física de alto impacto e que envolve riscos inerentes, incluindo, mas não se limitando a, quedas, torções, contusões e lesões musculares.`,
        `2. Declaro que o(a) aluno(a) encontra-se em plenas condições de saúde e apto(a) fisicamente para a prática da modalidade, isentando o CT OKINAWA de qualquer responsabilidade por eventuais acidentes ou lesões que possam ocorrer durante a aula.`,
        `3. Estou ciente de que esta AULA EXPERIMENTAL tem caráter puramente demonstrativo e não gera, sob nenhuma hipótese, vínculo empregatício, contratual ou financeiro entre as partes.`,
        `4. Comprometo-me a seguir as orientações do professor durante toda a atividade.`
      ]

      clausulas.forEach(clausula => {
        const split = doc.splitTextToSize(clausula, 170)
        if (y + (split.length * 6) > 260) {
          doc.addPage()
          y = 20
        }
        doc.text(split, 20, y)
        y += (split.length * 6) + 4
      })

      y += 15
      doc.setFontSize(11)
      doc.text(`Data da Aula: ${dataFormatada}`, 20, y)
      
      y += 40
      doc.setLineWidth(0.5)
      doc.line(20, y, 90, y)
      doc.line(110, y, 180, y)
      y += 5
      doc.setFontSize(10)
      doc.text(ag.responsavel ? `${ag.responsavel} (Responsável)` : `${ag.nome} (Aluno)`, 20, y)
      doc.text(`CT OKINAWA (Professor)`, 110, y)

      doc.save(`Termo_Aula_Experimental_${ag.nome}.pdf`)
    }
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
    const horario = ag.turma_horario || "horário a confirmar"

    let mensagem = ""
    if (tipo === "comprovante") {
      mensagem = `Olá, *${ag.nome}*! Tudo bem?\n\nSua aula experimental de *${ag.modalidade_nome}* está confirmada! 🥋\n\n📅 Data: ${dataFormatada}\n⏰ Horário: ${horario}\n📍 Local: R. Pres. Médici, 278 - Águas Claras\n\n⚠️ *Estou enviando em anexo o comprovante.* Chegue com 10 minutinhos de antecedência!\n\nAté lá! OSS!`
    } else {
      mensagem = `Olá, *${ag.nome}*! Passando para lembrar da sua aula experimental de *${ag.modalidade_nome}* HOJE!\n\n⏰ Horário: ${horario}\n\nEstamos te esperando! OSS! 🥋`
    }

    const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`
    window.open(url, "_blank")
  }

  const agendamentosFiltrados = agendamentos.filter(a => {
    if (abaAtiva === "todos") return true
    if (abaAtiva === "pendente") return a.status === "pendente" || a.status === "agendado" || !a.status
    return a.status === abaAtiva
  })

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><CalendarDays /> Funil de Aula Experimental</h1>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-4 border border-gray-100 h-fit">
          <h2 className="font-bold text-lg mb-4 text-red-700">Agendar Nova Aula</h2>
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
              {turmas
                .filter(t => String(t.modalidade_id) === String(form.modalidade_id))
                .map(t => (
                  <option key={t.id} value={t.id}>
                    {t.nome} {t.hora_inicio ? `(${t.hora_inicio} - ${t.hora_fim})` : ''}
                  </option>
              ))}
            </select>

            <input type="date" className="input" value={form.data_aula} onChange={e => setForm({...form, data_aula: e.target.value})} required />

            <button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold p-3 rounded mt-2 transition">
              {loading ? "Agendando..." : "Agendar e Baixar Comprovante"}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow p-4 border border-gray-100 flex flex-col h-150">
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            <button onClick={() => setAbaAtiva("pendente")} className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition ${abaAtiva === 'pendente' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Ainda Vão Fazer</button>
            <button onClick={() => setAbaAtiva("compareceu")} className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition ${abaAtiva === 'compareceu' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Fizeram (Cobrar)</button>
            <button onClick={() => setAbaAtiva("matriculado")} className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition ${abaAtiva === 'matriculado' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Já Matriculados</button>
            <button onClick={() => setAbaAtiva("todos")} className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition ${abaAtiva === 'todos' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Ver Todos</button>
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
                    <p className="text-xs text-gray-600">Mod: {ag.modalidade_nome} | Turma: {ag.turma_nome} ({ag.turma_horario})</p>
                    <p className="text-xs text-red-600 font-bold mt-1">Data: {new Date(ag.data_aula + "T12:00:00").toLocaleDateString('pt-BR')} | Status: {ag.status.toUpperCase()}</p>
                  </div>
                  
                  <div className="mt-2 grid grid-cols-2 gap-1">
                    <button onClick={() => gerarComprovantePDF({...ag, modalidades: {nome: ag.modalidade_nome}, turmas: {nome: ag.turma_nome, horario: ag.turma_horario}})} className="bg-gray-200 text-gray-800 hover:bg-gray-300 text-xs font-bold py-2 rounded flex items-center justify-center gap-1 transition" title="Baixar Comprovante de Agendamento">
                      <Download size={14}/> Comprovante
                    </button>
                    <button onClick={() => gerarTermoCienciaPDF(ag)} className="bg-yellow-100 text-yellow-800 border border-yellow-300 hover:bg-yellow-200 text-xs font-bold py-2 rounded flex items-center justify-center gap-1 transition" title="Baixar Termo de Ciência para Assinar">
                      <FileSignature size={14}/> Termo Assinatura
                    </button>
                    <button onClick={() => enviarWhatsApp(ag, "comprovante")} className="bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs font-bold py-2 rounded flex items-center justify-center gap-1 transition" title="Enviar Comprovante">
                      <FileText size={14}/> Enviar Comp.
                    </button>
                    <button onClick={() => enviarWhatsApp(ag, "lembrete")} className="bg-green-100 text-green-700 hover:bg-green-200 text-xs font-bold py-2 rounded flex items-center justify-center gap-1 transition" title="Enviar Lembrete">
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