"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import AdminGuard from "../../components/AdminGuard"
import { Plus, Edit, Trash2, RefreshCw } from "lucide-react"

type Modalidade = {
  id: string
  nome: string
  valor_geral: number
  valor_base: number
  status: string
}

export default function ModalidadesPage() {
  const [modalidades, setModalidades] = useState<Modalidade[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    nome: "",
    valor_geral: "",
    valor_base: "",
    status: "ativo",
  })
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [sincronizando, setSincronizando] = useState<string | null>(null)

  useEffect(() => {
    carregarModalidades()
  }, [])

  async function carregarModalidades() {
    setLoading(true)
    const { data, error } = await supabase.from("modalidades").select("*").order("nome")
    if (error) console.error(error)
    else setModalidades(data || [])
    setLoading(false)
  }

  async function salvarModalidade() {
    if (!form.nome.trim()) return alert("Informe o nome da modalidade")
    
    const valorGeral = parseFloat(form.valor_geral)
    const valorBase = parseFloat(form.valor_base)
    
    if (isNaN(valorGeral) || valorGeral <= 0) return alert("Valor geral deve ser maior que zero")
    if (isNaN(valorBase) || valorBase < 0) return alert("Valor base inválido")

    const payload = {
      nome: form.nome.trim(),
      valor_geral: valorGeral,
      valor_base: valorBase,
      status: form.status,
    }

    setSalvando(true)
    let error = null
    if (editandoId) {
      const res = await supabase.from("modalidades").update(payload).eq("id", editandoId)
      error = res.error
    } else {
      const res = await supabase.from("modalidades").insert([payload])
      error = res.error
    }

    if (error) alert("Erro: " + error.message)
    else {
      alert(editandoId ? "Modalidade atualizada!" : "Modalidade cadastrada!")
      resetForm()
      carregarModalidades()
    }
    setSalvando(false)
  }

  async function sincronizarMensalidadesPendentes(mod: Modalidade) {
    if (!confirm(`Isso vai atualizar TODAS as mensalidades PENDENTES de alunos matriculados em ${mod.nome} para R$ ${mod.valor_geral.toFixed(2)}.\n\nMensalidades já pagas NÃO serão alteradas. Continuar?`)) return;
    
    setSincronizando(mod.id)

    try {
      // 1. Busca turmas da modalidade
      const { data: turmas } = await supabase.from("turmas").select("id").eq("modalidade_id", mod.id);
      if (!turmas || turmas.length === 0) throw new Error("Nenhuma turma encontrada para esta modalidade.");
      
      const turmaIds = turmas.map(t => t.id);

      // 2. Busca matrículas ativas nessas turmas
      const { data: matriculas } = await supabase.from("matriculas").select("id").in("turma_id", turmaIds).eq("status", "ativo");
      if (!matriculas || matriculas.length === 0) throw new Error("Nenhum aluno ativo matriculado nessas turmas.");
      
      const matriculaIds = matriculas.map(m => m.id);

      // 3. Atualiza mensalidades pendentes
      const { error } = await supabase
        .from("mensalidades")
        .update({ valor: mod.valor_geral, valor_base: mod.valor_base })
        .in("matricula_id", matriculaIds)
        .eq("status", "pendente");

      if (error) throw error;
      alert("✅ Valores das mensalidades pendentes atualizados com sucesso!");
    } catch (err: any) {
      alert("Erro ao sincronizar: " + err.message);
    } finally {
      setSincronizando(null)
    }
  }

  function editarModalidade(mod: Modalidade) {
    setEditandoId(mod.id)
    setForm({
      nome: mod.nome,
      valor_geral: mod.valor_geral.toString(),
      valor_base: mod.valor_base.toString(),
      status: mod.status,
    })
  }

  async function excluirModalidade(id: string) {
    if (!confirm("Excluir modalidade? Todas as turmas vinculadas serão afetadas.")) return
    const { error } = await supabase.from("modalidades").delete().eq("id", id)
    if (error) alert("Erro: " + error.message)
    else {
      if (editandoId === id) resetForm()
      carregarModalidades()
    }
  }

  async function alternarStatus(mod: Modalidade) {
    const novoStatus = mod.status === "ativo" ? "inativo" : "ativo"
    const { error } = await supabase.from("modalidades").update({ status: novoStatus }).eq("id", mod.id)
    if (error) alert("Erro: " + error.message)
    else carregarModalidades()
  }

  function resetForm() {
    setEditandoId(null)
    setForm({ nome: "", valor_geral: "", valor_base: "", status: "ativo" })
  }

  return (
    <AdminGuard>
      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Modalidades</h1>

        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">{editandoId ? "Editar Modalidade" : "Nova Modalidade"}</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <input className="p-2 border rounded" placeholder="Nome da modalidade" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} />
            <input className="p-2 border rounded" type="number" step="0.01" placeholder="Valor geral (R$) – Aluno paga" value={form.valor_geral} onChange={e => setForm({ ...form, valor_geral: e.target.value })} />
            <input className="p-2 border rounded" type="number" step="0.01" placeholder="Valor base (R$) – Base do professor" value={form.valor_base} onChange={e => setForm({ ...form, valor_base: e.target.value })} />
            <select className="p-2 border rounded" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={salvarModalidade} disabled={salvando} className="bg-red-600 text-white px-6 py-2 rounded font-semibold">
              {salvando ? "Salvando..." : editandoId ? "Salvar Alterações" : "Cadastrar"}
            </button>
            {editandoId && (
              <button onClick={resetForm} className="bg-gray-300 px-6 py-2 rounded">Cancelar</button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow overflow-hidden">
          {loading ? (
            <div className="p-6 text-center">Carregando...</div>
          ) : modalidades.length === 0 ? (
            <div className="p-6 text-center text-gray-500">Nenhuma modalidade cadastrada.</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left">Nome</th>
                  <th className="p-3 text-left">Valor geral</th>
                  <th className="p-3 text-left">Valor base</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Ações</th>
                </tr>
              </thead>
              <tbody>
                {modalidades.map((mod) => (
                  <tr key={mod.id} className="border-t">
                    <td className="p-3 font-semibold">{mod.nome}</td>
                    <td className="p-3">R$ {mod.valor_geral.toFixed(2)}</td>
                    <td className="p-3">R$ {mod.valor_base.toFixed(2)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs ${mod.status === "ativo" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                        {mod.status === "ativo" ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="p-3 flex gap-2 flex-wrap">
                      <button onClick={() => editarModalidade(mod)} className="bg-blue-500 text-white p-2 rounded" title="Editar"><Edit size={16} /></button>
                      <button onClick={() => alternarStatus(mod)} className={`p-2 rounded text-white ${mod.status === "ativo" ? "bg-yellow-500" : "bg-green-500"}`} title={mod.status === "ativo" ? "Inativar" : "Ativar"}>
                        {mod.status === "ativo" ? "Inativar" : "Ativar"}
                      </button>
                      <button onClick={() => excluirModalidade(mod.id)} className="bg-red-500 text-white p-2 rounded" title="Excluir"><Trash2 size={16} /></button>
                      
                      {/* BOTÃO NOVO DE SINCRONIZAR */}
                      <button 
                        onClick={() => sincronizarMensalidadesPendentes(mod)} 
                        disabled={sincronizando === mod.id}
                        className="bg-orange-500 text-white p-2 rounded flex items-center gap-1 text-xs" 
                        title="Atualizar mensalidades pendentes"
                      >
                        <RefreshCw size={14} className={sincronizando === mod.id ? "animate-spin" : ""} />
                        {sincronizando === mod.id ? "Atualizando..." : "Sincronizar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminGuard>
  )
}