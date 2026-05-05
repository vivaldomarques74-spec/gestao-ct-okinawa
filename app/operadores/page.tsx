"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import AdminGuard from "../../components/AdminGuard"

type Operador = {
  id: string
  nome: string
  codigo: string
  ativo: boolean
  created_at?: string
}

export default function OperadoresPage() {
  const [operadores, setOperadores] = useState<Operador[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ nome: "", codigo: "" })
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    carregarOperadores()
  }, [])

  async function carregarOperadores() {
    setLoading(true)
    const { data, error } = await supabase
      .from("operadores")
      .select("*")
      .order("nome")
    if (error) {
      console.error(error)
      alert("Erro ao carregar operadores")
    } else {
      setOperadores(data || [])
    }
    setLoading(false)
  }

  async function salvarOperador() {
    if (!form.nome.trim() || !form.codigo.trim()) {
      alert("Preencha nome e código")
      return
    }

    setSalvando(true)

    if (editandoId) {
      // Editar
      const { error } = await supabase
        .from("operadores")
        .update({ nome: form.nome.trim(), codigo: form.codigo.trim() })
        .eq("id", editandoId)
      if (error) {
        alert("Erro ao atualizar: " + error.message)
      } else {
        alert("Operador atualizado")
        cancelarEdicao()
        carregarOperadores()
      }
    } else {
      // Cadastrar novo
      const { error } = await supabase
        .from("operadores")
        .insert([{ nome: form.nome.trim(), codigo: form.codigo.trim(), ativo: true }])
      if (error) {
        alert("Erro ao cadastrar: " + error.message)
      } else {
        alert("Operador cadastrado")
        setForm({ nome: "", codigo: "" })
        carregarOperadores()
      }
    }
    setSalvando(false)
  }

  async function alternarAtivo(operador: Operador) {
    const novoStatus = !operador.ativo
    const { error } = await supabase
      .from("operadores")
      .update({ ativo: novoStatus })
      .eq("id", operador.id)
    if (error) {
      alert("Erro ao alterar status: " + error.message)
    } else {
      carregarOperadores()
    }
  }

  async function excluirOperador(id: string) {
    if (!confirm("Excluir operador permanentemente?")) return
    const { error } = await supabase.from("operadores").delete().eq("id", id)
    if (error) {
      alert("Erro ao excluir: " + error.message)
    } else {
      alert("Operador excluído")
      if (editandoId === id) cancelarEdicao()
      carregarOperadores()
    }
  }

  function editarOperador(operador: Operador) {
    setEditandoId(operador.id)
    setForm({ nome: operador.nome, codigo: operador.codigo })
  }

  function cancelarEdicao() {
    setEditandoId(null)
    setForm({ nome: "", codigo: "" })
  }

  return (
    <AdminGuard>
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Operadores de Caixa</h1>

        {/* Formulário */}
        <div className="bg-white p-4 rounded-xl shadow mb-6">
          <h2 className="font-semibold text-lg mb-3">
            {editandoId ? "Editar Operador" : "Novo Operador"}
          </h2>
          <div className="grid md:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Nome do operador"
              className="p-2 border rounded"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
            />
            <input
              type="text"
              placeholder="Código numérico (ex: 1234)"
              className="p-2 border rounded"
              value={form.codigo}
              onChange={(e) => setForm({ ...form, codigo: e.target.value })}
            />
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={salvarOperador}
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

        {/* Lista de operadores */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          {loading ? (
            <div className="p-6 text-center">Carregando...</div>
          ) : operadores.length === 0 ? (
            <div className="p-6 text-center text-gray-500">Nenhum operador cadastrado.</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left">Nome</th>
                  <th className="p-3 text-left">Código</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Ações</th>
                </tr>
              </thead>
              <tbody>
                {operadores.map((op) => (
                  <tr key={op.id} className="border-t">
                    <td className="p-3">{op.nome}</td>
                    <td className="p-3">{op.codigo}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          op.ativo ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}
                      >
                        {op.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="p-3 flex gap-2">
                      <button
                        onClick={() => editarOperador(op)}
                        className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => alternarAtivo(op)}
                        className={`px-3 py-1 rounded text-sm ${
                          op.ativo ? "bg-yellow-500" : "bg-green-500"
                        } text-white`}
                      >
                        {op.ativo ? "Inativar" : "Ativar"}
                      </button>
                      <button
                        onClick={() => excluirOperador(op.id)}
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
          * O código do operador é usado para abrir/fechar o caixa.
        </div>
      </div>
    </AdminGuard>
  )
}