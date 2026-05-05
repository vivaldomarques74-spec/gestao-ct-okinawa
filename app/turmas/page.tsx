"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import AdminGuard from "../../components/AdminGuard"

type Turma = {
  id: string
  nome: string
  modalidade_id: string
  professor_id: string
  dias_semana: string
  horario_inicio: string
  horario_fim: string
  limite_alunos: number
  local: string
  status: string
  observacao: string
}

type Modalidade = {
  id: string
  nome: string
  valor_geral: number
  valor_base: number
}

type Professor = {
  id: string
  nome: string
  comissao: number
}

export default function TurmasPage() {
  const [turmas, setTurmas] = useState<Turma[]>([])
  const [modalidades, setModalidades] = useState<Modalidade[]>([])
  const [professores, setProfessores] = useState<Professor[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    nome: "",
    modalidade_id: "",
    professor_id: "",
    dias_semana: "",
    horario_inicio: "",
    horario_fim: "",
    limite_alunos: "",
    local: "",
    status: "ativo",
    observacao: "",
  })
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    carregarDados()
  }, [])

  async function carregarDados() {
    setLoading(true)
    // Carregar turmas
    const { data: turmasData, error: turmasError } = await supabase
      .from("turmas")
      .select("*")
      .order("nome")
    if (turmasError) console.error(turmasError)
    else setTurmas(turmasData || [])

    // Carregar modalidades ativas
    const { data: modsData } = await supabase
      .from("modalidades")
      .select("id, nome, valor_geral, valor_base")
      .eq("status", "ativo")
      .order("nome")
    setModalidades(modsData || [])

    // Carregar professores ativos
    const { data: profsData } = await supabase
      .from("professores")
      .select("id, nome, comissao")
      .eq("status", "ativo")
      .order("nome")
    setProfessores(profsData || [])

    setLoading(false)
  }

  async function salvarTurma() {
    if (!form.nome.trim()) {
      alert("Informe o nome da turma")
      return
    }
    if (!form.modalidade_id) {
      alert("Selecione a modalidade")
      return
    }
    if (!form.professor_id) {
      alert("Selecione o professor")
      return
    }

    const payload = {
      nome: form.nome.trim(),
      modalidade_id: form.modalidade_id,
      professor_id: form.professor_id,
      dias_semana: form.dias_semana,
      horario_inicio: form.horario_inicio,
      horario_fim: form.horario_fim,
      limite_alunos: Number(form.limite_alunos) || 0,
      local: form.local,
      status: form.status,
      observacao: form.observacao,
    }

    setSalvando(true)
    let error = null
    if (editandoId) {
      const res = await supabase.from("turmas").update(payload).eq("id", editandoId)
      error = res.error
    } else {
      const res = await supabase.from("turmas").insert([payload])
      error = res.error
    }

    if (error) {
      alert("Erro: " + error.message)
    } else {
      alert(editandoId ? "Turma atualizada!" : "Turma cadastrada!")
      resetForm()
      carregarDados()
    }
    setSalvando(false)
  }

  function editarTurma(turma: Turma) {
    setEditandoId(turma.id)
    setForm({
      nome: turma.nome,
      modalidade_id: turma.modalidade_id,
      professor_id: turma.professor_id,
      dias_semana: turma.dias_semana || "",
      horario_inicio: turma.horario_inicio || "",
      horario_fim: turma.horario_fim || "",
      limite_alunos: turma.limite_alunos?.toString() || "",
      local: turma.local || "",
      status: turma.status,
      observacao: turma.observacao || "",
    })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  async function excluirTurma(id: string) {
    if (!confirm("Excluir turma? Todas as matrículas e presenças vinculadas serão afetadas.")) return
    const { error } = await supabase.from("turmas").delete().eq("id", id)
    if (error) {
      alert("Erro: " + error.message)
    } else {
      alert("Turma excluída")
      if (editandoId === id) resetForm()
      carregarDados()
    }
  }

  async function alternarStatus(turma: Turma) {
    const novoStatus = turma.status === "ativo" ? "inativo" : "ativo"
    const { error } = await supabase.from("turmas").update({ status: novoStatus }).eq("id", turma.id)
    if (error) alert("Erro: " + error.message)
    else carregarDados()
  }

  function resetForm() {
    setEditandoId(null)
    setForm({
      nome: "",
      modalidade_id: "",
      professor_id: "",
      dias_semana: "",
      horario_inicio: "",
      horario_fim: "",
      limite_alunos: "",
      local: "",
      status: "ativo",
      observacao: "",
    })
  }

  // Obter nome da modalidade pelo ID
  function getModalidadeNome(id: string) {
    return modalidades.find(m => m.id === id)?.nome || "?"
  }

  function getProfessorNome(id: string) {
    return professores.find(p => p.id === id)?.nome || "?"
  }

  return (
    <AdminGuard>
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Turmas</h1>

        {/* Formulário */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">
            {editandoId ? "Editar Turma" : "Nova Turma"}
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <input
              className="input"
              placeholder="Nome da turma (ex: Karatê Infantil)"
              value={form.nome}
              onChange={e => setForm({ ...form, nome: e.target.value })}
            />
            <select
              className="input"
              value={form.modalidade_id}
              onChange={e => setForm({ ...form, modalidade_id: e.target.value })}
            >
              <option value="">Selecione a modalidade</option>
              {modalidades.map(mod => (
                <option key={mod.id} value={mod.id}>
                  {mod.nome} (R$ {mod.valor_geral.toFixed(2)} / base R$ {mod.valor_base.toFixed(2)})
                </option>
              ))}
            </select>
            <select
              className="input"
              value={form.professor_id}
              onChange={e => setForm({ ...form, professor_id: e.target.value })}
            >
              <option value="">Selecione o professor</option>
              {professores.map(prof => (
                <option key={prof.id} value={prof.id}>
                  {prof.nome} (comissão {prof.comissao}%)
                </option>
              ))}
            </select>
            <input
              className="input"
              placeholder="Dias da semana (ex: Segunda e Quarta)"
              value={form.dias_semana}
              onChange={e => setForm({ ...form, dias_semana: e.target.value })}
            />
            <input
              className="input"
              type="time"
              placeholder="Horário início"
              value={form.horario_inicio}
              onChange={e => setForm({ ...form, horario_inicio: e.target.value })}
            />
            <input
              className="input"
              type="time"
              placeholder="Horário fim"
              value={form.horario_fim}
              onChange={e => setForm({ ...form, horario_fim: e.target.value })}
            />
            <input
              className="input"
              type="number"
              placeholder="Limite de alunos"
              value={form.limite_alunos}
              onChange={e => setForm({ ...form, limite_alunos: e.target.value })}
            />
            <input
              className="input"
              placeholder="Local / Sala"
              value={form.local}
              onChange={e => setForm({ ...form, local: e.target.value })}
            />
            <select
              className="input"
              value={form.status}
              onChange={e => setForm({ ...form, status: e.target.value })}
            >
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
            <textarea
              className="input col-span-2"
              rows={3}
              placeholder="Observações"
              value={form.observacao}
              onChange={e => setForm({ ...form, observacao: e.target.value })}
            />
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={salvarTurma} disabled={salvando} className="btn">
              {salvando ? "Salvando..." : editandoId ? "Salvar Alterações" : "Cadastrar"}
            </button>
            {editandoId && (
              <button onClick={resetForm} className="btn cinza">
                Cancelar
              </button>
            )}
          </div>
        </div>

        {/* Lista de turmas */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          {loading ? (
            <div className="p-6 text-center">Carregando...</div>
          ) : turmas.length === 0 ? (
            <div className="p-6 text-center text-gray-500">Nenhuma turma cadastrada.</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left">Nome</th>
                  <th className="p-3 text-left">Modalidade</th>
                  <th className="p-3 text-left">Professor</th>
                  <th className="p-3 text-left">Horário</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Ações</th>
                </tr>
              </thead>
              <tbody>
                {turmas.map((turma) => (
                  <tr key={turma.id} className="border-t">
                    <td className="p-3">{turma.nome}</td>
                    <td className="p-3">{getModalidadeNome(turma.modalidade_id)}</td>
                    <td className="p-3">{getProfessorNome(turma.professor_id)}</td>
                    <td className="p-3">
                      {turma.horario_inicio && turma.horario_fim
                        ? `${turma.horario_inicio} - ${turma.horario_fim}`
                        : "Não definido"}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          turma.status === "ativo"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {turma.status === "ativo" ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="p-3 flex gap-2">
                      <button onClick={() => editarTurma(turma)} className="mini azul">
                        Editar
                      </button>
                      <button
                        onClick={() => alternarStatus(turma)}
                        className={`mini ${
                          turma.status === "ativo" ? "bg-yellow-500" : "bg-green-500"
                        }`}
                      >
                        {turma.status === "ativo" ? "Inativar" : "Ativar"}
                      </button>
                      <button onClick={() => excluirTurma(turma.id)} className="mini vermelho">
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
          .azul { background: #2563eb; }
          .vermelho { background: #dc2626; }
        `}</style>
      </div>
    </AdminGuard>
  )
}