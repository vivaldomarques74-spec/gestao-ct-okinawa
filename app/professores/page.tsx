"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import AdminGuard from "../../components/AdminGuard"

type Professor = {
  id: string
  nome: string
  telefone: string
  pix: string
  comissao: number
  codigo_acesso: string
  status: string
  observacao: string
  created_at?: string
}

export default function ProfessoresPage() {
  const [professores, setProfessores] = useState<Professor[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    nome: "",
    telefone: "",
    pix: "",
    comissao: "",
    codigo_acesso: "",
    status: "ativo",
    observacao: "",
  })
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    carregarProfessores()
  }, [])

  async function carregarProfessores() {
    setLoading(true)
    const { data, error } = await supabase
      .from("professores")
      .select("*")
      .order("nome")
    if (error) {
      console.error(error)
      alert("Erro ao carregar professores")
    } else {
      setProfessores(data || [])
    }
    setLoading(false)
  }

  function gerarCodigoAcesso() {
    const codigo = Math.floor(1000 + Math.random() * 9000).toString()
    setForm(prev => ({ ...prev, codigo_acesso: codigo }))
  }

  async function salvarProfessor() {
    if (!form.nome.trim()) {
      alert("Informe o nome do professor")
      return
    }
    const comissaoNum = parseFloat(form.comissao)
    if (isNaN(comissaoNum) || comissaoNum < 0 || comissaoNum > 100) {
      alert("Comissão deve ser um número entre 0 e 100")
      return
    }

    const payload = {
      nome: form.nome.trim(),
      telefone: form.telefone || null,
      pix: form.pix || null,
      comissao: comissaoNum,
      codigo_acesso: form.codigo_acesso || null,
      status: form.status,
      observacao: form.observacao || null,
    }

    setSalvando(true)
    let error = null

    if (editandoId) {
      const res = await supabase.from("professores").update(payload).eq("id", editandoId)
      error = res.error
    } else {
      // Se for novo professor e não tem código, gera automaticamente
      if (!payload.codigo_acesso) {
        const codigo = Math.floor(1000 + Math.random() * 9000).toString()
        payload.codigo_acesso = codigo
        setForm(prev => ({ ...prev, codigo_acesso: codigo }))
      }
      const res = await supabase.from("professores").insert([payload])
      error = res.error
    }

    if (error) {
      alert("Erro: " + error.message)
    } else {
      alert(editandoId ? "Professor atualizado!" : "Professor cadastrado!")
      resetForm()
      carregarProfessores()
    }
    setSalvando(false)
  }

  function editarProfessor(prof: Professor) {
    setEditandoId(prof.id)
    setForm({
      nome: prof.nome,
      telefone: prof.telefone || "",
      pix: prof.pix || "",
      comissao: prof.comissao.toString(),
      codigo_acesso: prof.codigo_acesso || "",
      status: prof.status,
      observacao: prof.observacao || "",
    })
  }

  async function excluirProfessor(id: string) {
    if (!confirm("Excluir professor? Todas as turmas vinculadas perderão o vínculo.")) return
    const { error } = await supabase.from("professores").delete().eq("id", id)
    if (error) {
      alert("Erro: " + error.message)
    } else {
      alert("Professor excluído")
      if (editandoId === id) resetForm()
      carregarProfessores()
    }
  }

  async function alternarStatus(prof: Professor) {
    const novoStatus = prof.status === "ativo" ? "inativo" : "ativo"
    const { error } = await supabase.from("professores").update({ status: novoStatus }).eq("id", prof.id)
    if (error) alert("Erro: " + error.message)
    else carregarProfessores()
  }

  function resetForm() {
    setEditandoId(null)
    setForm({
      nome: "",
      telefone: "",
      pix: "",
      comissao: "",
      codigo_acesso: "",
      status: "ativo",
      observacao: "",
    })
  }

  function copiarCodigo(codigo: string) {
    navigator.clipboard.writeText(codigo)
    alert("Código copiado! Use para acessar a presença.")
  }

  return (
    <AdminGuard>
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Professores</h1>

        {/* Formulário */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">
            {editandoId ? "Editar Professor" : "Novo Professor"}
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <input
              className="input"
              placeholder="Nome completo"
              value={form.nome}
              onChange={e => setForm({ ...form, nome: e.target.value })}
            />
            <input
              className="input"
              placeholder="Telefone"
              value={form.telefone}
              onChange={e => setForm({ ...form, telefone: e.target.value })}
            />
            <input
              className="input"
              placeholder="Chave Pix"
              value={form.pix}
              onChange={e => setForm({ ...form, pix: e.target.value })}
            />
            <input
              className="input"
              type="number"
              step="0.01"
              placeholder="Comissão (%) – Ex: 50"
              value={form.comissao}
              onChange={e => setForm({ ...form, comissao: e.target.value })}
            />
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="block text-sm text-gray-500 mb-1">
                  Código de acesso (presença)
                </label>
                <input
                  className="input bg-gray-50"
                  readOnly
                  placeholder="Clique em gerar"
                  value={form.codigo_acesso}
                />
              </div>
              <button
                type="button"
                onClick={gerarCodigoAcesso}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Gerar
              </button>
            </div>
            <select
              className="input"
              value={form.status}
              onChange={e => setForm({ ...form, status: e.target.value })}
            >
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
            <textarea
              className="input md:col-span-2"
              rows={3}
              placeholder="Observação (opcional)"
              value={form.observacao}
              onChange={e => setForm({ ...form, observacao: e.target.value })}
            />
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={salvarProfessor} disabled={salvando} className="btn">
              {salvando ? "Salvando..." : editandoId ? "Salvar Alterações" : "Cadastrar"}
            </button>
            {editandoId && (
              <button onClick={resetForm} className="btn cinza">
                Cancelar
              </button>
            )}
          </div>
        </div>

        {/* Lista de professores */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          {loading ? (
            <div className="p-6 text-center">Carregando...</div>
          ) : professores.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              Nenhum professor cadastrado.
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left">Nome</th>
                  <th className="p-3 text-left">Telefone</th>
                  <th className="p-3 text-left">Comissão</th>
                  <th className="p-3 text-left">Código</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Ações</th>
                </tr>
              </thead>
              <tbody>
                {professores.map((prof) => (
                  <tr key={prof.id} className="border-t">
                    <td className="p-3">{prof.nome}</td>
                    <td className="p-3">{prof.telefone || "-"}</td>
                    <td className="p-3">{prof.comissao}%</td>
                    <td className="p-3">
                      {prof.codigo_acesso ? (
                        <button
                          onClick={() => copiarCodigo(prof.codigo_acesso)}
                          className="text-blue-600 underline text-sm"
                        >
                          {prof.codigo_acesso} (copiar)
                        </button>
                      ) : (
                        <span className="text-gray-400">não gerado</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          prof.status === "ativo"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {prof.status === "ativo" ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="p-3 flex gap-2">
                      <button
                        onClick={() => editarProfessor(prof)}
                        className="mini azul"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => alternarStatus(prof)}
                        className={`mini ${
                          prof.status === "ativo" ? "bg-yellow-500" : "bg-green-500"
                        }`}
                      >
                        {prof.status === "ativo" ? "Inativar" : "Ativar"}
                      </button>
                      <button
                        onClick={() => excluirProfessor(prof.id)}
                        className="mini vermelho"
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
          .azul {
            background: #2563eb;
          }
          .vermelho {
            background: #dc2626;
          }
        `}</style>
      </div>
    </AdminGuard>
  )
}