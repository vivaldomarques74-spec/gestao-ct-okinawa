"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import AdminGuard from "../../components/AdminGuard"

type Convenio = {
  id: string
  nome: string
  tipo: "percentual" | "fixo"
  desconto: number
  ativo: boolean
  created_at?: string
}

export default function ConveniosPage() {
  const [convenios, setConvenios] = useState<Convenio[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ nome: "", tipo: "percentual", desconto: "" })
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    carregarConvenios()
  }, [])

  async function carregarConvenios() {
    setLoading(true)
    const { data, error } = await supabase
      .from("convenios")
      .select("*")
      .order("nome")
    if (error) {
      console.error(error)
      alert("Erro ao carregar convênios")
    } else {
      setConvenios(data || [])
    }
    setLoading(false)
  }

  async function salvarConvenio() {
    if (!form.nome.trim() || !form.desconto) {
      alert("Preencha nome e desconto")
      return
    }

    setSalvando(true)

    const payload = {
      nome: form.nome.trim(),
      tipo: form.tipo,
      desconto: Number(form.desconto),
      ativo: true,
    }

    if (editandoId) {
      // Editar
      const { error } = await supabase
        .from("convenios")
        .update(payload)
        .eq("id", editandoId)
      if (error) {
        alert("Erro ao atualizar: " + error.message)
      } else {
        alert("Convênio atualizado")
        cancelarEdicao()
        carregarConvenios()
      }
    } else {
      // Cadastrar novo
      const { error } = await supabase
        .from("convenios")
        .insert([payload])
      if (error) {
        alert("Erro ao cadastrar: " + error.message)
      } else {
        alert("Convênio cadastrado")
        setForm({ nome: "", tipo: "percentual", desconto: "" })
        carregarConvenios()
      }
    }
    setSalvando(false)
  }

  async function alternarAtivo(convenio: Convenio) {
    const novoStatus = !convenio.ativo
    const { error } = await supabase
      .from("convenios")
      .update({ ativo: novoStatus })
      .eq("id", convenio.id)
    if (error) {
      alert("Erro ao alterar status: " + error.message)
    } else {
      carregarConvenios()
    }
  }

  async function excluirConvenio(id: string) {
    if (!confirm("Excluir convênio permanentemente?")) return
    const { error } = await supabase.from("convenios").delete().eq("id", id)
    if (error) {
      alert("Erro ao excluir: " + error.message)
    } else {
      alert("Convênio excluído")
      if (editandoId === id) cancelarEdicao()
      carregarConvenios()
    }
  }

  function editarConvenio(convenio: Convenio) {
    setEditandoId(convenio.id)
    setForm({
      nome: convenio.nome,
      tipo: convenio.tipo,
      desconto: convenio.desconto.toString(),
    })
  }

  function cancelarEdicao() {
    setEditandoId(null)
    setForm({ nome: "", tipo: "percentual", desconto: "" })
  }

  return (
    <AdminGuard>
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Convênios e Descontos</h1>

        {/* Formulário */}
        <div className="bg-white p-4 rounded-xl shadow mb-6">
          <h2 className="font-semibold text-lg mb-3">
            {editandoId ? "Editar Convênio" : "Novo Convênio"}
          </h2>
          <div className="grid md:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Nome do convênio"
              className="p-2 border rounded"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
            />
            <select
              className="p-2 border rounded"
              value={form.tipo}
              onChange={(e) => setForm({ ...form, tipo: e.target.value })}
            >
              <option value="percentual">Percentual (%)</option>
              <option value="fixo">Valor Fixo (R$)</option>
            </select>
            <input
              type="number"
              step="0.01"
              placeholder={form.tipo === "percentual" ? "Ex: 10" : "Ex: 20.00"}
              className="p-2 border rounded"
              value={form.desconto}
              onChange={(e) => setForm({ ...form, desconto: e.target.value })}
            />
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={salvarConvenio}
              disabled={salvando}
              className="bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              {salvando ? "Salvando..." : editandoId ? "Salvar Alterações" : "Cadastrar"}
            </button>
            {editandoId && (
              <button onClick={cancelarEdicao} className="bg-gray-300 px-4 py-2 rounded">
                Cancelar
              </button>
            )}
          </div>
        </div>

        {/* Lista de convênios */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          {loading ? (
            <div className="p-6 text-center">Carregando...</div>
          ) : convenios.length === 0 ? (
            <div className="p-6 text-center text-gray-500">Nenhum convênio cadastrado.</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left">Nome</th>
                  <th className="p-3 text-left">Tipo</th>
                  <th className="p-3 text-left">Desconto</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Ações</th>
                </tr>
              </thead>
              <tbody>
                {convenios.map((c) => (
                  <tr key={c.id} className="border-t">
                    <td className="p-3">{c.nome}</td>
                    <td className="p-3">{c.tipo === "percentual" ? "%" : "R$"}</td>
                    <td className="p-3">
                      {c.tipo === "percentual" ? `${c.desconto}%` : `R$ ${c.desconto.toFixed(2)}`}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          c.ativo ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {c.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="p-3 flex gap-2">
                      <button
                        onClick={() => editarConvenio(c)}
                        className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => alternarAtivo(c)}
                        className={`px-3 py-1 rounded text-sm ${
                          c.ativo ? "bg-yellow-500" : "bg-green-500"
                        } text-white`}
                      >
                        {c.ativo ? "Inativar" : "Ativar"}
                      </button>
                      <button
                        onClick={() => excluirConvenio(c.id)}
                        className="bg-red-600 text-white px-3 py-1 rounded text-sm"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-4 text-xs text-gray-500">
          * Convênios ativos aparecem na matrícula e nas mensalidades para aplicação de desconto.
        </div>
      </div>
    </AdminGuard>
  )
}