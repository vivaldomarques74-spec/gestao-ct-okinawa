"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import AdminGuard from "../../components/AdminGuard"
import { CheckCircle, Plus, Trash2, TrendingDown } from "lucide-react"

export default function DespesasPage() {
  const [despesas, setDespesas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    descricao: "", categoria: "Geral", valor: "", data_vencimento: new Date().toISOString().split('T')[0]
  })

  useEffect(() => { carregarDespesas() }, [])

  async function carregarDespesas() {
    setLoading(true)
    const { data } = await supabase.from("despesas").select("*").order("data_vencimento", { ascending: false })
    setDespesas(data || [])
    setLoading(false)
  }

  async function salvarDespesa(e: any) {
    e.preventDefault()
    if (!form.descricao || !form.valor) return alert("Preencha descrição e valor.")
    
    const { error } = await supabase.from("despesas").insert([{
      descricao: form.descricao,
      categoria: form.categoria,
      valor: Number(form.valor),
      data_vencimento: form.data_vencimento,
      status: "pendente"
    }])

    if (error) alert("Erro ao salvar: " + error.message)
    else {
      alert("✅ Despesa lançada!")
      setForm({ descricao: "", categoria: "Geral", valor: "", data_vencimento: new Date().toISOString().split('T')[0] })
      carregarDespesas()
    }
  }

  async function marcarComoPago(id: string) {
    if (!confirm("Confirmar pagamento desta despesa?")) return
    await supabase.from("despesas").update({ 
      status: "pago", 
      data_pagamento: new Date().toISOString().split('T')[0] 
    }).eq("id", id)
    carregarDespesas()
  }

  async function excluirDespesa(id: string) {
    if (!confirm("Excluir esta despesa?")) return
    await supabase.from("despesas").delete().eq("id", id)
    carregarDespesas()
  }

  return (
    <AdminGuard>
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><TrendingDown className="text-red-600"/> Contas a Pagar (Despesas)</h1>

        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <form onSubmit={salvarDespesa} className="grid md:grid-cols-5 gap-4 items-end">
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-gray-500">Descrição</label>
              <input className="input" placeholder="Ex: Conta de Luz" value={form.descricao} onChange={e => setForm({...form, descricao: e.target.value})} required />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500">Categoria</label>
              <select className="input" value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})}>
                <option>Geral</option>
                <option>Aluguel</option>
                <option>Água/Luz/Internet</option>
                <option>Materiais/Estoque</option>
                <option>Salários/Comissões</option>
                <option>Manutenção</option>
                <option>Marketing</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500">Valor (R$)</label>
              <input type="number" step="0.01" className="input" placeholder="0.00" value={form.valor} onChange={e => setForm({...form, valor: e.target.value})} required />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500">Vencimento</label>
              <input type="date" className="input" value={form.data_vencimento} onChange={e => setForm({...form, data_vencimento: e.target.value})} required />
            </div>
            <button type="submit" className="bg-red-600 text-white font-bold p-2 rounded hover:bg-red-700 h-10 flex items-center justify-center gap-1 md:col-span-5">
              <Plus size={16}/> Lançar Despesa
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow overflow-hidden">
          {loading ? <p className="p-4 text-center">Carregando...</p> : despesas.length === 0 ? <p className="p-4 text-center text-gray-500">Nenhuma despesa cadastrada.</p> : (
            <table className="w-full text-left">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3">Vencimento</th>
                  <th className="p-3">Descrição</th>
                  <th className="p-3">Categoria</th>
                  <th className="p-3">Valor</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {despesas.map(d => (
                  <tr key={d.id} className="border-t">
                    <td className="p-3">{new Date(d.data_vencimento + "T12:00:00").toLocaleDateString()}</td>
                    <td className="p-3 font-semibold">{d.descricao}</td>
                    <td className="p-3"><span className="text-xs bg-gray-200 px-2 py-1 rounded">{d.categoria}</span></td>
                    <td className="p-3 font-bold text-red-600">R$ {Number(d.valor).toFixed(2)}</td>
                    <td className="p-3">
                      <span className={`text-xs font-bold px-2 py-1 rounded ${d.status === 'pago' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {d.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3 flex gap-2">
                      {d.status === 'pendente' && (
                        <button onClick={() => marcarComoPago(d.id)} className="bg-green-600 text-white px-3 py-1 rounded text-xs flex items-center gap-1 hover:bg-green-700">
                          <CheckCircle size={14}/> Pagar
                        </button>
                      )}
                      <button onClick={() => excluirDespesa(d.id)} className="bg-gray-100 text-red-600 px-2 py-1 rounded text-xs hover:bg-red-100">
                        <Trash2 size={14}/>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <style jsx>{`
          .input { width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 8px; }
        `}</style>
      </div>
    </AdminGuard>
  )
}