"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import AdminGuard from "../../components/AdminGuard"
import { FileText, Plus, Trash2 } from "lucide-react"
import jsPDF from "jspdf"

type Profissional = {
  id: string
  nome: string
  especialidade: string
  registro_profissional: string
  telefone: string
  codigo_acesso: string
  modelo_repasse: string
  valor_repasse: number
  dia_vencimento: number
  status: string
}

type Servico = {
  id?: string
  nome: string
  valor: number
  duracao_minutos: number
}

export default function ProfissionaisSaudePage() {
  const [profissionais, setProfissionais] = useState<Profissional[]>([])
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)

  const [form, setForm] = useState({
    nome: "", especialidade: "nutricionista", registro_profissional: "", telefone: "",
    codigo_acesso: "", modelo_repasse: "mensalidade", valor_repasse: "", dia_vencimento: "10", status: "ativo"
  })
  const [servicos, setServicos] = useState<Servico[]>([])

  useEffect(() => { carregarProfissionais() }, [])

  async function carregarProfissionais() {
    setLoading(true)
    const { data } = await supabase.from("profissionais_saude").select("*").order("nome")
    setProfissionais(data || [])
    setLoading(false)
  }

  function gerarCodigoAcesso() {
    const codigo = Math.floor(1000 + Math.random() * 9000).toString()
    setForm(prev => ({ ...prev, codigo_acesso: codigo }))
  }

  function adicionarServico() {
    setServicos([...servicos, { nome: "", valor: 0, duracao_minutos: 60 }])
  }

  function atualizarServico(index: number, campo: keyof Servico, valor: any) {
    const novos = [...servicos]
    novos[index] = { ...novos[index], [campo]: valor }
    setServicos(novos)
  }

  function removerServico(index: number) {
    const novos = [...servicos]
    novos.splice(index, 1)
    setServicos(novos)
  }

  async function editarProfissional(prof: Profissional) {
    setEditandoId(prof.id)
    setForm({
      nome: prof.nome, especialidade: prof.especialidade, registro_profissional: prof.registro_profissional || "",
      telefone: prof.telefone || "", codigo_acesso: prof.codigo_acesso, modelo_repasse: prof.modelo_repasse,
      valor_repasse: prof.valor_repasse.toString(), dia_vencimento: prof.dia_vencimento.toString(), status: prof.status
    })
    
    const { data: srvs } = await supabase.from("servicos_saude").select("*").eq("profissional_id", prof.id)
    setServicos(srvs || [])
  }

  async function salvarProfissional() {
    if (!form.nome.trim() || !form.codigo_acesso.trim()) return alert("Nome e Código de Acesso são obrigatórios.")
    
    setSalvando(true)
    const payload = {
      nome: form.nome.trim(),
      especialidade: form.especialidade,
      registro_profissional: form.registro_profissional || null,
      telefone: form.telefone || null,
      codigo_acesso: form.codigo_acesso,
      modelo_repasse: form.modelo_repasse,
      valor_repasse: Number(form.valor_repasse) || 0,
      dia_vencimento: Number(form.dia_vencimento) || 10,
      status: form.status
    }

    let profId = editandoId

    if (editandoId) {
      await supabase.from("profissionais_saude").update(payload).eq("id", editandoId)
      await supabase.from("servicos_saude").delete().eq("profissional_id", editandoId)
    } else {
      const { data, error } = await supabase.from("profissionais_saude").insert([payload]).select().single()
      if (error) {
        alert("Erro ao cadastrar: " + error.message)
        setSalvando(false)
        return
      }
      profId = data.id
    }

    if (servicos.length > 0 && profId) {
      const servicosParaInserir = servicos.map(s => ({
        profissional_id: profId,
        nome: s.nome,
        valor: Number(s.valor),
        duracao_minutos: Number(s.duracao_minutos)
      }))
      await supabase.from("servicos_saude").insert(servicosParaInserir)
    }

    alert("✅ Profissional salvo com sucesso!")
    resetForm()
    carregarProfissionais()
    setSalvando(false)
  }

  async function excluirProfissional(id: string) {
    if (!confirm("Excluir este profissional?")) return
    await supabase.from("profissionais_saude").delete().eq("id", id)
    carregarProfissionais()
  }

  function resetForm() {
    setEditandoId(null)
    setForm({ nome: "", especialidade: "nutricionista", registro_profissional: "", telefone: "", codigo_acesso: "", modelo_repasse: "mensalidade", valor_repasse: "", dia_vencimento: "10", status: "ativo" })
    setServicos([])
  }

  // --- GERAR CONTRATO DO PROFISSIONAL DE SAÚDE ---
  function gerarContratoPDF(prof: Profissional) {
    const doc = new jsPDF()
    let y = 20
    const margem = 15
    const largura = 170

    const addTexto = (texto: string, negrito = false, tamanho = 10) => {
      doc.setFontSize(tamanho)
      doc.setFont("helvetica", negrito ? "bold" : "normal")
      const linhas = doc.splitTextToSize(texto, largura)
      linhas.forEach((linha: string) => {
        if (y > 270) { doc.addPage(); y = 20 }
        doc.text(linha, margem, y)
        y += 6
      })
      y += 3
    }

    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text("CONTRATO DE CESSÃO DE ESPAÇO E SERVIÇOS", 105, y, { align: "center" })
    y += 15

    addTexto("CONTRATANTE: CENTRO DE TREINAMENTO OKINAWA – CT OKINAWA, representado por Arliton Almeida de Jesus.", true)
    addTexto(`CONTRATADO(A): ${prof.nome}, registro ${prof.registro_profissional || '---'}, telefone ${prof.telefone || '---'}.`, true)

    addTexto("CLÁUSULA 1 – DO OBJETO", true, 12)
    addTexto(`O presente contrato tem por objeto a cessão de espaço nas dependências do CT OKINAWA para que o(a) CONTRATADO(A) exerça sua atividade profissional na área de ${prof.especialidade.toUpperCase()}, bem como a utilização do sistema de gestão para agendamentos e prontuários.`)

    addTexto("CLÁUSULA 2 – DO MODELO DE REPASSE", true, 12)
    if (prof.modelo_repasse === 'mensalidade') {
      addTexto(`O(A) CONTRATADO(A) pagará ao CT OKINAWA, a título de aluguel/utilização do espaço, o valor fixo mensal de R$ ${prof.valor_repasse.toFixed(2).replace('.', ',')}, com vencimento todo dia ${prof.dia_vencimento}.`)
    } else {
      addTexto(`O(A) CONTRATADO(A) receberá do CT OKINAWA o repasse de ${prof.valor_repasse}% sobre o valor dos atendimentos realizados. O pagamento será realizado até o dia ${prof.dia_vencimento} do mês subsequente.`)
    }

    addTexto("CLÁUSULA 3 – DAS OBRIGAÇÕES", true, 12)
    addTexto("I – O(A) CONTRATADO(A) deverá manter seus registros profissionais ativos e em conformidade com os conselhos de classe; II – Zelar pelo bom uso do espaço e equipamentos do CT; III – Manter sigilo absoluto sobre os dados dos pacientes (LGPD); IV – Utilizar exclusivamente o sistema do CT para agendamentos e lançamentos de prontuários.")

    addTexto("CLÁUSULA 4 – DO USO DE IMAGEM E LGPD", true, 12)
    addTexto("O(A) CONTRATADO(A) autoriza o uso de sua imagem para fins institucionais do CT. O(A) CONTRATADO(A) declara-se ciente e cumpridor da Lei Geral de Proteção de Dados (Lei 13.709/2018), sendo vedado o compartilhamento de dados de pacientes com terceiros.")

    addTexto("CLÁUSULA 5 – DA RESCISÃO", true, 12)
    addTexto("Este contrato poderá ser rescindido por qualquer das partes mediante aviso prévio de 30 (trinta) dias. O descumprimento das normas do CT ensejará rescisão imediata.")

    if (y > 220) { doc.addPage(); y = 20 }
    y += 20
    doc.text("Salvador, ____ de _______________ de ________", 105, y, { align: "center" })
    y += 30
    doc.line(30, y, 90, y)
    doc.line(120, y, 180, y)
    doc.text("CT OKINAWA", 30, y + 5)
    doc.text(prof.nome, 120, y + 5)

    doc.save(`Contrato_${prof.nome.replace(/\s+/g, '_')}.pdf`)
  }

  return (
    <AdminGuard>
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Profissionais de Saúde</h1>

        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">{editandoId ? "Editar Profissional" : "Novo Profissional"}</h2>
          
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <input className="input" placeholder="Nome Completo" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} />
            
            <select className="input" value={form.especialidade} onChange={e => setForm({...form, especialidade: e.target.value})}>
              <option value="nutricionista">Nutricionista</option>
              <option value="fisioterapeuta">Fisioterapeuta</option>
              <option value="educador_fisico">Educador Físico</option>
              <option value="outros">Outros</option>
            </select>

            <input className="input" placeholder="Registro (CRN, CREF, etc)" value={form.registro_profissional} onChange={e => setForm({...form, registro_profissional: e.target.value})} />
            <input className="input" placeholder="Telefone" value={form.telefone} onChange={e => setForm({...form, telefone: e.target.value})} />
            
            <div className="flex gap-2">
              <input className="input flex-1" placeholder="Código de Acesso" value={form.codigo_acesso} readOnly />
              <button onClick={gerarCodigoAcesso} className="bg-gray-800 text-white px-4 rounded">Gerar</button>
            </div>

            <select className="input" value={form.modelo_repasse} onChange={e => setForm({...form, modelo_repasse: e.target.value})}>
              <option value="mensalidade">Paga Aluguel (Mensalidade Fixa)</option>
              <option value="porcentagem">Ganha Comissão (%)</option>
            </select>

            <div>
              <label className="text-xs text-gray-500 font-bold">{form.modelo_repasse === 'mensalidade' ? 'Valor do Aluguel (R$)' : 'Comissão (%)'}</label>
              <input type="number" className="input" value={form.valor_repasse} onChange={e => setForm({...form, valor_repasse: e.target.value})} />
            </div>
            
            <div>
              <label className="text-xs text-gray-500 font-bold">Dia de Vencimento/Acerto</label>
              <input type="number" className="input" value={form.dia_vencimento} onChange={e => setForm({...form, dia_vencimento: e.target.value})} />
            </div>
          </div>

          <div className="border-t pt-4 mb-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-gray-700">Serviços e Procedimentos</h3>
              <button onClick={adicionarServico} className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm flex items-center gap-1 hover:bg-blue-200">
                <Plus size={16} /> Adicionar Serviço
              </button>
            </div>
            
            {servicos.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhum serviço cadastrado. (Ex: Consulta, Bioimpedância).</p>
            ) : (
              <div className="space-y-2">
                {servicos.map((srv, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input className="input flex-1" placeholder="Nome do Serviço (Ex: Consulta)" value={srv.nome} onChange={e => atualizarServico(idx, 'nome', e.target.value)} />
                    <input type="number" className="input w-32" placeholder="Valor (R$)" value={srv.valor} onChange={e => atualizarServico(idx, 'valor', e.target.value)} />
                    <input type="number" className="input w-24" placeholder="Minutos" value={srv.duracao_minutos} onChange={e => atualizarServico(idx, 'duracao_minutos', e.target.value)} />
                    <button onClick={() => removerServico(idx)} className="text-red-500 hover:text-red-700"><Trash2 size={20}/></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6 border-t pt-4">
            <button onClick={salvarProfissional} disabled={salvando} className="btn bg-red-600 text-white">
              {salvando ? "Salvando..." : "Salvar Profissional"}
            </button>
            {editandoId && <button onClick={resetForm} className="btn bg-gray-300 text-gray-700">Cancelar</button>}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow overflow-hidden">
          {loading ? (
            <p className="p-4 text-center">Carregando...</p>
          ) : profissionais.length === 0 ? (
            <p className="p-4 text-center text-gray-500">Nenhum profissional cadastrado.</p>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left">Nome</th>
                  <th className="p-3 text-left">Especialidade</th>
                  <th className="p-3 text-left">Contrato</th>
                  <th className="p-3 text-left">Código</th>
                  <th className="p-3 text-left">Ações</th>
                </tr>
              </thead>
              <tbody>
                {profissionais.map(p => (
                  <tr key={p.id} className="border-t">
                    <td className="p-3 font-semibold">{p.nome}</td>
                    <td className="p-3 capitalize">{p.especialidade.replace('_', ' ')}</td>
                    <td className="p-3">
                      {p.modelo_repasse === 'mensalidade' ? `Aluguel: R$ ${p.valor_repasse}` : `Comissão: ${p.valor_repasse}%`}
                    </td>
                    <td className="p-3 font-mono text-blue-600 font-bold">{p.codigo_acesso}</td>
                    <td className="p-3 flex gap-2">
                      <button onClick={() => gerarContratoPDF(p)} className="bg-purple-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1"><FileText size={14}/> Contrato</button>
                      <button onClick={() => editarProfissional(p)} className="bg-blue-600 text-white px-2 py-1 rounded text-xs">Editar</button>
                      <button onClick={() => excluirProfissional(p.id)} className="bg-red-600 text-white px-2 py-1 rounded text-xs">Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <style jsx>{`
          .input { width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 8px; }
          .btn { padding: 10px 20px; border-radius: 8px; font-weight: bold; }
        `}</style>
      </div>
    </AdminGuard>
  )
}