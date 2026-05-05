"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import AdminGuard from "../../components/AdminGuard"

type Modalidade = {
  id: string
  nome: string
  valor_geral: number
  valor_base: number
  status: string
  created_at?: string
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

  useEffect(() => {
    carregarModalidades()
  }, [])

  async function carregarModalidades() {
    setLoading(true)
    const { data, error } = await supabase
      .from("modalidades")
      .select("*")
      .order("nome")
    if (error) {
      console.error(error)
      alert("Erro ao carregar modalidades")
    } else {
      setModalidades(data || [])
    }
    setLoading(false)
  }

  async function salvarModalidade() {
    if (!form.nome.trim()) {
      alert("Informe o nome da modalidade")
      return
    }
    const valorGeral = parseFloat(form.valor_geral)
    const valorBase = parseFloat(form.valor_base)
    if (isNaN(valorGeral) || valorGeral <= 0) {
      alert("Valor geral deve ser maior que zero")
      return
    }
    if (isNaN(valorBase) || valorBase < 0) {
      alert("Valor base deve ser um número válido (pode ser zero)")
      return
    }
    if (valorBase > valorGeral) {
      if (!confirm("Valor base é maior que o valor geral. Isso pode causar prejuízo. Continuar assim mesmo?")) {
        return
      }
    }

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

    if (error) {
      alert("Erro: " + error.message)
    } else {
      alert(editandoId ? "Modalidade atualizada!" : "Modalidade cadastrada!")
      resetForm()
      carregarModalidades()
    }
    setSalvando(false)
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
    if (error) {
      alert("Erro: " + error.message)
    } else {
      alert("Modalidade excluída")
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
    setForm({
      nome: "",
      valor_geral: "",
      valor_base: "",
      status: "ativo",
    })
  }

  return (
    <AdminGuard>
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Modalidades</h1>

        {/* Formulário */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">
            {editandoId ? "Editar Modalidade" : "Nova Modalidade"}
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <input
              className="input"
              placeholder="Nome da modalidade"
              value={form.nome}
              onChange={e => setForm({ ...form, nome: e.target.value })}
            />
            <input
              className="input"
              type="number"
              step="0.01"
              placeholder="Valor geral (R$) – Aluno paga"
              value={form.valor_geral}
              onChange={e => setForm({ ...form, valor_geral: e.target.value })}
            />
            <input
              className="input"
              type="number"
              step="0.01"
              placeholder="Valor base (R$) – Base do professor"
              value={form.valor_base}
              onChange={e => setForm({ ...form, valor_base: e.target.value })}
            />
            <select
              className="input"
              value={form.status}
              onChange={e => setForm({ ...form, status: e.target.value })}
            >
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={salvarModalidade} disabled={salvando} className="btn">
              {salvando ? "Salvando..." : editandoId ? "Salvar Alterações" : "Cadastrar"}
            </button>
            {editandoId && (
              <button onClick={resetForm} className="btn cinza">
                Cancelar
              </button>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-4">
            * O valor geral é o que o aluno paga (pode ter descontos).<br />
            * O valor base é a base de cálculo para a comissão do professor.<br />
            * O percentual do professor é definido individualmente no cadastro do professor (campo comissão).
          </p>
        </div>

        {/* Lista de modalidades */}
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
                    <td className="p-3">{mod.nome}</td>
                    <td className="p-3">R$ {mod.valor_geral.toFixed(2)}</td>
                    <td className="p-3">R$ {mod.valor_base.toFixed(2)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs ${mod.status === "ativo" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                        {mod.status === "ativo" ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="p-3 flex gap-2">
                      <button onClick={() => editarModalidade(mod)} className="mini azul">Editar</button>
                      <button onClick={() => alternarStatus(mod)} className={`mini ${mod.status === "ativo" ? "bg-yellow-500" : "bg-green-500"}`}>
                        {mod.status === "ativo" ? "Inativar" : "Ativar"}
                      </button>
                      <button onClick={() => excluirModalidade(mod.id)} className="mini vermelho">Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <style jsx>{`
          .input {
            width: 100%;
            padding: 12px;
            border: 1px solid #ccc;
            border-radius: 10px;
          }
          .btn {
            background: red;
            color: white;
            padding: 12px 18px;
            border-radius: 10px;
          }
          .cinza {
            background: #666;
          }
          .mini {
            color: white;
            padding: 6px 12px;
            border-radius: 8px;
            font-size: 12px;
          }
          .azul { background: #2563eb; }
          .vermelho { background: #dc2626; }
        `}</style>
      </div>
    </AdminGuard>
  )
}