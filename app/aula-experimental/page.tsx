"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import { useRouter } from "next/navigation"
import { CalendarDays, UserPlus, Trash2 } from "lucide-react"

export default function AulaExperimentalPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [modalidades, setModalidades] = useState<any[]>([])
  const [turmas, setTurmas] = useState<any[]>([])
  const [agendamentos, setAgendamentos] = useState<any[]>([])
  const [abaAtiva, setAbaAtiva] = useState<"pendente" | "compareceu" | "matriculado">("pendente")

  const [form, setForm] = useState({
    nome: "", nascimento: "", responsavel: "", telefone: "",
    modalidade_id: "", turma_id: "", data_aula: new Date().toISOString().split('T')[0]
  })

  useEffect(() => { carregarDados() }, [])

  async function carregarDados() {
    const { data: mods } = await supabase.from("modalidades").select("*").eq("status", "ativo")
    setModalidades(mods || [])
    const { data: turs } = await supabase.from("turmas").select("*").eq("status", "ativo")
    setTurmas(turs || [])
    
    // Puxa todos os agendamentos
    const { data: ags } = await supabase.from("aulas_experimentais").select("*, modalidades(nome), turmas(nome)").order("data_aula")
    setAgendamentos(ags || [])
  }

  async function agendar(e: any) {
    e.preventDefault()
    if (!form.nome || !form.telefone || !form.modalidade_id || !form.turma_id || !form.data_aula) {
      return alert("Preencha todos os campos obrigatórios.")
    }
    setLoading(true)
    const { error } = await supabase.from("aulas_experimentais").insert([form])
    
    if (error) {
      alert("Erro ao agendar: " + error.message)
    } else {
      alert("✅ Aula experimental agendada!")
      setForm({ nome: "", nascimento: "", responsavel: "", telefone: "", modalidade_id: "", turma_id: "", data_aula: new Date().toISOString().split('T')[0] })
      carregarDados()
    }
    setLoading(false)
  }

  async function excluirAgendamento(id: string) {
    if (!confirm("Tem certeza que deseja excluir este registro? Ele sumirá do sistema e do Dashboard.")) return
    const { error } = await supabase.from("aulas_experimentais").delete().eq("id", id)
    if (error) alert("Erro ao excluir: " + error.message)
    else carregarDados()
  }

  async function converterParaMatricula(ag: any) {
    // Muda o status para matriculado (sai do Dashboard)
    await supabase.from("aulas_experimentais").update({ status: "matriculado" }).eq("id", ag.id)
    
    // Redireciona para a matrícula com os dados na URL
    const query = new URLSearchParams({
      nome: ag.nome,
      whatsapp: ag.telefone,
    }).toString()
    
    router.push(`/matricula?${query}`)
  }

  const agendamentosFiltrados = agendamentos.filter(a => a.status === abaAtiva)

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><CalendarDays /> Funil de Aula Experimental</h1>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Formulário */}
        <div className="bg-white rounded-xl shadow p-4 border border-gray-100 h-fit">
          <h2 className="font-bold text-lg mb-4 text-purple-700">Agendar Nova Aula</h2>
          <form onSubmit={agendar} className="space-y-3">
            <input className="input" placeholder="Nome do Aluno *" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} required />
            <div className="grid grid-cols-2 gap-2">
              <input type="date" className="input" value={form.nascimento} onChange={e => setForm({...form, nascimento: e.target.value})} />
              <input className="input" placeholder="Responsável (se menor)" value={form.responsavel} onChange={e => setForm({...form, responsavel: e.target.value})} />
            </div>
            <input className="input" placeholder="WhatsApp *" value={form.telefone} onChange={e => setForm({...form, telefone: e.target.value})} required />
            
            <select className="input" value={form.modalidade_id} onChange={e => setForm({...form, modalidade_id: e.target.value, turma_id: ""})} required>
              <option value="">Selecione a Modalidade *</option>
              {modalidades.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
            </select>

            <select className="input" value={form.turma_id} onChange={e => setForm({...form, turma_id: e.target.value})} disabled={!form.modalidade_id} required>
              <option value="">Selecione a Turma *</option>
              {turmas.filter(t => t.modalidade_id === form.modalidade_id).map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>

            <input type="date" className="input" value={form.data_aula} onChange={e => setForm({...form, data_aula: e.target.value})} required />

            <button type="submit" disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold p-3 rounded mt-2 transition">
              {loading ? "Agendando..." : "Agendar Aula"}
            </button>
          </form>
        </div>

        {/* Lista de Agendamentos */}
        {/* AQUI FOI CORRIGIDO O h-[600px] PARA h-150 */}
        <div className="bg-white rounded-xl shadow p-4 border border-gray-100 flex flex-col h-150">
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            <button onClick={() => setAbaAtiva("pendente")} className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition ${abaAtiva === 'pendente' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Ainda Vão Fazer</button>
            <button onClick={() => setAbaAtiva("compareceu")} className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition ${abaAtiva === 'compareceu' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Fizeram (Cobrar Matrícula)</button>
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
                    <p className="text-xs text-gray-600">Mod: {ag.modalidades?.nome} | Turma: {ag.turmas?.nome}</p>
                    <p className="text-xs text-blue-600 font-bold mt-1">Data da Aula: {new Date(ag.data_aula + "T12:00:00").toLocaleDateString('pt-BR')}</p>
                  </div>
                  
                  {abaAtiva !== "matriculado" && (
                    <div className="mt-2">
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