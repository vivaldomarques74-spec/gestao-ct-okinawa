"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import AdminGuard from "../../components/AdminGuard"
import { School, Edit, Link as LinkIcon, X, CheckCircle, Users } from "lucide-react"
import { useRouter } from "next/navigation"

export default function EscolasPage() {
  const router = useRouter()
  const [escolas, setEscolas] = useState<any[]>([])
  const [indicacoes, setIndicacoes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const [form, setForm] = useState({ nome: "", responsavel: "", whatsapp: "", tipo_desconto: "percentual", valor_desconto: "" })
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    carregarDados()
  }, [])

  async function carregarDados() {
    setLoading(true)
    // Busca escolas
    const { data: esc } = await supabase.from("escolas").select("*").order("nome")
    setEscolas(esc || [])
    
    // Busca indicações pendentes e cruza com a tabela de alunos para saber se o CPF já existe
    const { data: ind } = await supabase.from("escolas_indicacoes").select("*, escolas(nome, tipo_desconto, valor_desconto)").eq("status", "pendente").order("created_at", { ascending: false })
    
    // Verifica em qual indicação o aluno já tem cadastro
    const indicacoesComStatus = await Promise.all((ind || []).map(async (i) => {
      const { data: aluno } = await supabase.from("alunos").select("id").eq("cpf", i.aluno_cpf).maybeSingle()
      return { ...i, jaCadastrado: !!aluno, aluno_id: aluno?.id }
    }))

    setIndicacoes(indicacoesComStatus)
    setLoading(false)
  }

  async function salvarEscola() {
    if (!form.nome) return alert("Informe o nome da escola")
    setSalvando(true)

    const payload = {
      nome: form.nome, responsavel: form.responsavel, whatsapp: form.whatsapp,
      tipo_desconto: form.tipo_desconto, valor_desconto: Number(form.valor_desconto) || 0,
    }

    let error;
    if (editandoId) {
      const res = await supabase.from("escolas").update(payload).eq("id", editandoId)
      error = res.error
    } else {
      const codigo = "ESC-" + Math.floor(1000 + Math.random() * 9000)
      const res = await supabase.from("escolas").insert([{ ...payload, codigo_link: codigo }])
      error = res.error
    }

    if (error) alert("Erro: " + error.message)
    else {
      alert(editandoId ? "Escola atualizada!" : "Escola cadastrada!")
      setForm({ nome: "", responsavel: "", whatsapp: "", tipo_desconto: "percentual", valor_desconto: "" })
      setEditandoId(null)
      carregarDados()
    }
    setSalvando(false)
  }

  async function processarIndicacao(ind: any) {
    if (ind.jaCadastrado) {
      // --- ALUNO JÁ EXISTE ---
      if(!confirm(`O aluno ${ind.aluno_nome} já está no sistema. Deseja aplicar o desconto de ${ind.escolas?.nome}?\n\nIsso atualizará TODAS as mensalidades pendentes dele.`)) return;
      
      // 1. Vincula a escola ao aluno
      await supabase.from("alunos").update({ escola_id: ind.escola_id }).eq("id", ind.aluno_id)
      
      // 2. Marca indicação como aprovada
      await supabase.from("escolas_indicacoes").update({ status: "aprovado", aluno_id: ind.aluno_id }).eq("id", ind.id)
      
      // 3. Aplica o desconto em todas as mensalidades pendentes do aluno
      const { data: mensalidades } = await supabase.from("mensalidades").select("id, valor").eq("aluno_id", ind.aluno_id).eq("status", "pendente")
      if (mensalidades && mensalidades.length > 0) {
        for (const m of mensalidades) {
          let desc = ind.escolas.tipo_desconto === 'percentual' ? (Number(m.valor) * (ind.escolas.valor_desconto / 100)) : ind.escolas.valor_desconto;
          let novoValor = Math.max(0, Number(m.valor) - desc);
          await supabase.from("mensalidades").update({ valor: novoValor }).eq("id", m.id)
        }
      }
      
      alert("Desconto aplicado ao aluno com sucesso! As mensalidades pendentes foram atualizadas.")
      carregarDados()
      
    } else {
      // --- ALUNO NOVO ---
      if(!confirm("Aluno não encontrado no sistema. Deseja ir para a tela de matrícula com os dados preenchidos?")) return;
      
      router.push(`/matricula?nome=${encodeURIComponent(ind.aluno_nome)}&cpf=${ind.aluno_cpf}&whatsapp=${ind.aluno_whatsapp || ''}&escola_id=${ind.escola_id}&indicacao_id=${ind.id}`)
    }
  }

  async function rejeitarIndicacao(id: string) {
    if (!confirm("Rejeitar esta indicação?")) return
    await supabase.from("escolas_indicacoes").update({ status: "rejeitado" }).eq("id", id)
    carregarDados()
  }

  function copiarLink(codigo: string) {
    // CORRIGIDO PARA PLURAL
    const url = `${window.location.origin}/escolas/${codigo}`
    navigator.clipboard.writeText(url)
    alert("Link copiado! Envie para a escola.")
  }

  return (
    <AdminGuard>
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <School className="text-red-600" /> Escolas Parceiras
        </h1>

        <div className="grid md:grid-cols-3 gap-6">
          {/* COLUNA ESQUERDA: CADASTRO E LISTA */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white p-5 rounded-xl shadow">
              <h2 className="font-bold text-lg mb-3">{editandoId ? "Editar Escola" : "Nova Escola"}</h2>
              <div className="grid grid-cols-2 gap-3">
                <input className="p-2 border rounded col-span-2" placeholder="Nome da Escola" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} />
                <input className="p-2 border rounded" placeholder="Responsável" value={form.responsavel} onChange={e => setForm({...form, responsavel: e.target.value})} />
                <input className="p-2 border rounded" placeholder="WhatsApp" value={form.whatsapp} onChange={e => setForm({...form, whatsapp: e.target.value})} />
                <select className="p-2 border rounded" value={form.tipo_desconto} onChange={e => setForm({...form, tipo_desconto: e.target.value})}>
                  <option value="percentual">Desconto %</option>
                  <option value="fixo">Desconto R$ Fixo</option>
                </select>
                <input className="p-2 border rounded" type="number" placeholder="Valor" value={form.valor_desconto} onChange={e => setForm({...form, valor_desconto: e.target.value})} />
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={salvarEscola} disabled={salvando} className="bg-red-600 text-white px-6 py-2 rounded font-semibold">
                  {salvando ? "Salvando..." : editandoId ? "Salvar" : "Cadastrar Escola"}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr><th className="p-3 text-left">Escola</th><th className="p-3 text-left">Desconto</th><th className="p-3 text-left">Link</th><th className="p-3 text-left">Ações</th></tr>
                </thead>
                <tbody>
                  {escolas.map(esc => (
                    <tr key={esc.id} className="border-t">
                      <td className="p-3">
                        <p className="font-bold">{esc.nome}</p>
                        <p className="text-xs text-gray-500">{esc.responsavel} - {esc.whatsapp}</p>
                      </td>
                      <td className="p-3">{esc.tipo_desconto === "percentual" ? `${esc.valor_desconto}%` : `R$ ${esc.valor_desconto}`}</td>
                      <td className="p-3">
                        <button onClick={() => copiarLink(esc.codigo_link)} className="text-blue-600 flex items-center gap-1 hover:underline text-sm font-semibold">
                          <LinkIcon size={14} /> Copiar
                        </button>
                      </td>
                      <td className="p-3">
                        <button onClick={() => { setEditandoId(esc.id); setForm(esc) }} className="text-blue-500"><Edit size={18} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* COLUNA DIREITA: INDICAÇÕES */}
          <div className="bg-white p-5 rounded-xl shadow h-fit">
            <h2 className="font-bold text-lg mb-4 text-red-600 flex items-center gap-2">
              <Users size={18} /> Indicações Recebidas
            </h2>
            {indicacoes.length === 0 ? (
              <p className="text-gray-500 text-sm">Nenhuma indicação aguardando.</p>
            ) : (
              <div className="space-y-3">
                {indicacoes.map(ind => (
                  <div key={ind.id} className={`border rounded-lg p-3 ${ind.jaCadastrado ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'}`}>
                    <div className="flex justify-between items-start mb-2">
                       <p className="font-bold text-sm">{ind.aluno_nome}</p>
                       <span className={`text-[10px] font-bold px-2 py-1 rounded ${ind.jaCadastrado ? 'bg-blue-200 text-blue-800' : 'bg-green-200 text-green-800'}`}>
                         {ind.jaCadastrado ? "Aluno CT" : "Novo Aluno"}
                       </span>
                    </div>
                    <p className="text-xs text-gray-500">CPF: {ind.aluno_cpf}</p>
                    <p className="text-xs text-gray-500 mb-3">Escola: {ind.escolas?.nome}</p>
                    
                    <div className="flex flex-col gap-2">
                      <button onClick={() => processarIndicacao(ind)} className="bg-green-600 text-white text-sm p-2 rounded hover:bg-green-700 flex items-center justify-center gap-1 font-semibold">
                        <CheckCircle size={16} /> {ind.jaCadastrado ? "Aplicar Desconto" : "Fazer Matrícula"}
                      </button>
                      <button onClick={() => rejeitarIndicacao(ind.id)} className="text-red-500 text-xs flex items-center justify-center gap-1 mt-1 hover:underline">
                        <X size={12} /> Rejeitar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminGuard>
  )
}