"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import AdminGuard from "../../components/AdminGuard"

export default function RegistrosPage() {
  const [aba, setAba] = useState("alunos")
  const [alunos, setAlunos] = useState<any[]>([])
  const [movimentacoes, setMovimentacoes] = useState<any[]>([])
  const [modalidades, setModalidades] = useState<any[]>([])
  const [turmas, setTurmas] = useState<any[]>([])
  const [convenios, setConvenios] = useState<any[]>([])
  const [parceiros, setParceiros] = useState<any[]>([])

  const [alunoEditando, setAlunoEditando] = useState<any>(null)
  const [matriculasAluno, setMatriculasAluno] = useState<any[]>([])
  const [formAluno, setFormAluno] = useState<any>({
    nome: "", cpf: "", rg: "", nascimento: "", whatsapp: "", email: "", endereco: "",
    menor: false,
    responsavel_nome: "", responsavel_cpf: "", responsavel_whatsapp: "", responsavel_email: "",
    problema_saude: false, saude_detalhes: "",
    usa_remedio: false, remedio_detalhes: "",
    status: "ativo",
    convenio_id: "",
  })

  // Filtros movimentações
  const [filtroTipo, setFiltroTipo] = useState("todos")
  const [filtroParceiro, setFiltroParceiro] = useState("")
  const [filtroDataInicio, setFiltroDataInicio] = useState("")
  const [filtroDataFim, setFiltroDataFim] = useState("")
  const [mostrarCancelados, setMostrarCancelados] = useState(false)

  // Busca de aluno
  const [buscaAluno, setBuscaAluno] = useState("")

  useEffect(() => {
    carregarTudo()
  }, [])

  async function carregarTudo() {
    await carregarAlunos()
    await carregarMovimentacoes()
    await carregarModalidadesTurmas()
    await carregarConvenios()
    await carregarParceiros()
  }

  async function carregarAlunos() {
    const { data } = await supabase.from("alunos").select("*").order("nome")
    setAlunos(data || [])
  }

  async function carregarMovimentacoes() {
    const { data } = await supabase.from("caixa").select("*").order("data", { ascending: false })
    setMovimentacoes(data || [])
  }

  async function carregarModalidadesTurmas() {
    const { data: mods } = await supabase.from("modalidades").select("*").eq("status", "ativo")
    setModalidades(mods || [])
    const { data: turmasData } = await supabase
      .from("turmas")
      .select("*, modalidades(*)")
      .eq("status", "ativo")
    setTurmas(turmasData || [])
  }

  async function carregarConvenios() {
    const { data } = await supabase.from("convenios").select("*").eq("ativo", true)
    setConvenios(data || [])
  }

  async function carregarParceiros() {
    const { data } = await supabase.from("parceiros").select("*").eq("status", "ativo")
    setParceiros(data || [])
  }

  async function editarAluno(aluno: any) {
    setAlunoEditando(aluno)
    setFormAluno({
      nome: aluno.nome || "",
      cpf: aluno.cpf || "",
      rg: aluno.rg || "",
      nascimento: aluno.nascimento || "",
      whatsapp: aluno.whatsapp || "",
      email: aluno.email || "",
      endereco: aluno.endereco || "",
      menor: aluno.menor || false,
      responsavel_nome: aluno.responsavel_nome || "",
      responsavel_cpf: aluno.responsavel_cpf || "",
      responsavel_whatsapp: aluno.responsavel_whatsapp || "",
      responsavel_email: aluno.responsavel_email || "",
      problema_saude: aluno.problema_saude || false,
      saude_detalhes: aluno.saude_detalhes || "",
      usa_remedio: aluno.usa_remedio || false,
      remedio_detalhes: aluno.remedio_detalhes || "",
      status: aluno.status || "ativo",
      convenio_id: aluno.convenio_id || "",
    })
    const { data: mats } = await supabase
      .from("matriculas")
      .select("*, turmas(*)")
      .eq("aluno_id", aluno.id)
      .eq("status", "ativo")
    setMatriculasAluno(mats || [])
  }

  async function salvarAluno() {
    if (!alunoEditando) return
    const { error } = await supabase
      .from("alunos")
      .update({
        nome: formAluno.nome,
        cpf: formAluno.cpf,
        rg: formAluno.rg,
        nascimento: formAluno.nascimento,
        whatsapp: formAluno.whatsapp,
        email: formAluno.email,
        endereco: formAluno.endereco,
        menor: formAluno.menor,
        responsavel_nome: formAluno.responsavel_nome,
        responsavel_cpf: formAluno.responsavel_cpf,
        responsavel_whatsapp: formAluno.responsavel_whatsapp,
        responsavel_email: formAluno.responsavel_email,
        problema_saude: formAluno.problema_saude,
        saude_detalhes: formAluno.saude_detalhes,
        usa_remedio: formAluno.usa_remedio,
        remedio_detalhes: formAluno.remedio_detalhes,
        status: formAluno.status,
        convenio_id: formAluno.convenio_id,
      })
      .eq("id", alunoEditando.id)
    if (error) alert("Erro: " + error.message)
    else {
      alert("Aluno atualizado")
      carregarAlunos()
      setAlunoEditando(null)
    }
  }

  async function excluirAluno(id: string) {
    if (!confirm("Excluir aluno permanentemente?")) return
    await supabase.from("mensalidades").delete().eq("aluno_id", id)
    await supabase.from("matriculas").delete().eq("aluno_id", id)
    await supabase.from("caixa").delete().eq("aluno_id", id)
    await supabase.from("alunos").delete().eq("id", id)
    alert("Excluído")
    carregarAlunos()
    if (alunoEditando?.id === id) setAlunoEditando(null)
  }

  async function ativarInativarAluno(aluno: any) {
    const novoStatus = aluno.status === "ativo" ? "inativo" : "ativo"
    await supabase.from("alunos").update({ status: novoStatus }).eq("id", aluno.id)
    carregarAlunos()
  }

  async function adicionarTurmaAluno(turmaId: string) {
    if (!alunoEditando) return
    const turma = turmas.find(t => t.id === turmaId)
    if (!turma) return
    const jaExiste = matriculasAluno.some(m => m.turma_id === turmaId)
    if (jaExiste) { alert("Aluno já está nesta turma"); return }

    const { data: novaMat, error } = await supabase
      .from("matriculas")
      .insert([{ aluno_id: alunoEditando.id, turma_id: turmaId, status: "ativo" }])
      .select()
      .single()
    if (error) { alert("Erro: " + error.message); return }

    const hoje = new Date()
    const vencimento = new Date(hoje.getFullYear(), hoje.getMonth() + 1, hoje.getDate()).toISOString().slice(0, 10)
    await supabase.from("mensalidades").insert([{
      aluno_id: alunoEditando.id,
      matricula_id: novaMat.id,
      vencimento,
      valor: turma.modalidades?.valor_geral || 0,
      valor_base: turma.modalidades?.valor_base || 0,
      status: "pendente",
    }])
    alert("Modalidade adicionada")
    const { data: mats } = await supabase
      .from("matriculas")
      .select("*, turmas(*)")
      .eq("aluno_id", alunoEditando.id)
      .eq("status", "ativo")
    setMatriculasAluno(mats || [])
  }

  async function removerTurmaAluno(matriculaId: string, turmaNome: string) {
    if (!confirm(`Remover "${turmaNome}"? Mensalidades futuras serão canceladas.`)) return
    await supabase.from("mensalidades").update({ status: "cancelado" }).eq("matricula_id", matriculaId).eq("status", "pendente")
    await supabase.from("matriculas").update({ status: "inativo" }).eq("id", matriculaId)
    alert("Removido")
    const { data: mats } = await supabase
      .from("matriculas")
      .select("*, turmas(*)")
      .eq("aluno_id", alunoEditando.id)
      .eq("status", "ativo")
    setMatriculasAluno(mats || [])
  }

  async function cancelarMovimentacao(mov: any) {
    if (!confirm(`Cancelar ${mov.tipo} de R$ ${mov.valor}?`)) return
    await supabase.from("caixa").update({ cancelado: true, valor: 0 }).eq("id", mov.id)
    alert("Cancelado")
    carregarMovimentacoes()
  }

  const movFiltradas = movimentacoes.filter(mov => {
    if (!mostrarCancelados && mov.cancelado) return false
    if (filtroTipo !== "todos" && mov.tipo !== filtroTipo) return false
    if (filtroParceiro && mov.parceiro_id !== filtroParceiro) return false
    if (filtroDataInicio && new Date(mov.data).toISOString().slice(0,10) < filtroDataInicio) return false
    if (filtroDataFim && new Date(mov.data).toISOString().slice(0,10) > filtroDataFim) return false
    return true
  })

  return (
    <AdminGuard>
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Central de Registros</h1>
        <div className="flex gap-2 mb-6">
          <button className={`px-4 py-2 rounded ${aba === "alunos" ? "bg-red-600 text-white" : "bg-gray-200"}`} onClick={() => setAba("alunos")}>Alunos</button>
          <button className={`px-4 py-2 rounded ${aba === "movimentacoes" ? "bg-red-600 text-white" : "bg-gray-200"}`} onClick={() => setAba("movimentacoes")}>Movimentações</button>
        </div>

        {aba === "alunos" && (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="grid md:grid-cols-2 gap-6 p-4">
              <div className="border-r pr-4">
                <h2 className="font-bold mb-3">Lista de Alunos</h2>
                <input
                  type="text"
                  placeholder="Buscar por nome, CPF ou nº matrícula..."
                  className="w-full p-2 border rounded mb-3"
                  value={buscaAluno}
                  onChange={e => setBuscaAluno(e.target.value)}
                />
                <div className="max-h-[600px] overflow-y-auto">
                  {alunos
                    .filter(aluno =>
                      aluno.nome?.toLowerCase().includes(buscaAluno.toLowerCase()) ||
                      aluno.cpf?.includes(buscaAluno) ||
                      aluno.numero_matricula?.toString().includes(buscaAluno)
                    )
                    .map(aluno => (
                      <div key={aluno.id} className="border-b p-2">
                        <div className="flex justify-between items-start">
                          <div className="cursor-pointer" onClick={() => editarAluno(aluno)}>
                            <p className="font-semibold">{aluno.nome}</p>
                            <p className="text-xs text-gray-500">Nº Matrícula: {aluno.numero_matricula || "---"} | CPF: {aluno.cpf}</p>
                            <p className="text-xs">Status: <span className={aluno.status === "ativo" ? "text-green-600" : "text-red-600"}>{aluno.status}</span></p>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => ativarInativarAluno(aluno)} className="text-xs bg-blue-500 text-white px-2 py-1 rounded">
                              {aluno.status === "ativo" ? "Inativar" : "Ativar"}
                            </button>
                            <button onClick={() => excluirAluno(aluno.id)} className="text-xs bg-red-600 text-white px-2 py-1 rounded">Excluir</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  {alunos.filter(aluno =>
                    aluno.nome?.toLowerCase().includes(buscaAluno.toLowerCase()) ||
                    aluno.cpf?.includes(buscaAluno) ||
                    aluno.numero_matricula?.toString().includes(buscaAluno)
                  ).length === 0 && <p className="text-gray-400 text-sm p-2">Nenhum aluno encontrado.</p>}
                </div>
              </div>

              {alunoEditando && (
                <div className="pl-4">
                  <h2 className="font-bold mb-3">Editar Aluno</h2>
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    <input className="w-full p-2 border rounded" placeholder="Nome" value={formAluno.nome} onChange={e => setFormAluno({...formAluno, nome: e.target.value})} />
                    <input className="w-full p-2 border rounded" placeholder="CPF" value={formAluno.cpf} onChange={e => setFormAluno({...formAluno, cpf: e.target.value})} />
                    <input className="w-full p-2 border rounded" placeholder="RG" value={formAluno.rg} onChange={e => setFormAluno({...formAluno, rg: e.target.value})} />
                    <input type="date" className="w-full p-2 border rounded" value={formAluno.nascimento} onChange={e => setFormAluno({...formAluno, nascimento: e.target.value})} />
                    <input className="w-full p-2 border rounded" placeholder="WhatsApp" value={formAluno.whatsapp} onChange={e => setFormAluno({...formAluno, whatsapp: e.target.value})} />
                    <input className="w-full p-2 border rounded" placeholder="Email" value={formAluno.email} onChange={e => setFormAluno({...formAluno, email: e.target.value})} />
                    <input className="w-full p-2 border rounded" placeholder="Endereço" value={formAluno.endereco} onChange={e => setFormAluno({...formAluno, endereco: e.target.value})} />
                    <label className="flex items-center gap-2"><input type="checkbox" checked={formAluno.menor} onChange={e => setFormAluno({...formAluno, menor: e.target.checked})} /> Menor</label>
                    {formAluno.menor && (
                      <>
                        <input className="w-full p-2 border rounded" placeholder="Responsável" value={formAluno.responsavel_nome} onChange={e => setFormAluno({...formAluno, responsavel_nome: e.target.value})} />
                        <input className="w-full p-2 border rounded" placeholder="CPF Responsável" value={formAluno.responsavel_cpf} onChange={e => setFormAluno({...formAluno, responsavel_cpf: e.target.value})} />
                        <input className="w-full p-2 border rounded" placeholder="WhatsApp Responsável" value={formAluno.responsavel_whatsapp} onChange={e => setFormAluno({...formAluno, responsavel_whatsapp: e.target.value})} />
                        <input className="w-full p-2 border rounded" placeholder="Email Responsável" value={formAluno.responsavel_email} onChange={e => setFormAluno({...formAluno, responsavel_email: e.target.value})} />
                      </>
                    )}
                    <div className="border p-2 rounded">
                      <label><input type="checkbox" checked={formAluno.problema_saude} onChange={e => setFormAluno({...formAluno, problema_saude: e.target.checked})} /> Problema de saúde</label>
                      {formAluno.problema_saude && <textarea className="w-full border rounded mt-1" value={formAluno.saude_detalhes} onChange={e => setFormAluno({...formAluno, saude_detalhes: e.target.value})} />}
                      <label className="mt-2 block"><input type="checkbox" checked={formAluno.usa_remedio} onChange={e => setFormAluno({...formAluno, usa_remedio: e.target.checked})} /> Uso de remédio</label>
                      {formAluno.usa_remedio && <textarea className="w-full border rounded mt-1" value={formAluno.remedio_detalhes} onChange={e => setFormAluno({...formAluno, remedio_detalhes: e.target.value})} />}
                    </div>
                    <select className="w-full p-2 border rounded" value={formAluno.status} onChange={e => setFormAluno({...formAluno, status: e.target.value})}>
                      <option value="ativo">Ativo</option><option value="inativo">Inativo</option><option value="bloqueado">Bloqueado</option>
                    </select>
                    <select className="w-full p-2 border rounded" value={formAluno.convenio_id} onChange={e => setFormAluno({...formAluno, convenio_id: e.target.value})}>
                      <option value="">Nenhum convênio</option>
                      {convenios.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                    </select>

                    <h3 className="font-semibold mt-4">Modalidades / Turmas</h3>
                    {matriculasAluno.map(mat => {
                      const turma = turmas.find(t => t.id === mat.turma_id)
                      const modalidadeNome = turma?.modalidades?.nome || "?"
                      return (
                        <div key={mat.id} className="flex justify-between items-center border p-2 rounded mb-2">
                          <span><strong>{modalidadeNome}</strong> - {turma?.nome}</span>
                          <button onClick={() => removerTurmaAluno(mat.id, turma?.nome)} className="text-red-600 text-sm">Remover</button>
                        </div>
                      )
                    })}

                    <div className="flex gap-2 mt-2 items-center">
                      <select className="flex-1 p-2 border rounded" onChange={async (e) => {
                        const modalidadeId = e.target.value
                        if (!modalidadeId) return
                        const turmasFiltradas = turmas.filter(t => t.modalidade_id === modalidadeId && t.status === "ativo")
                        if (turmasFiltradas.length === 0) {
                          alert("Nenhuma turma ativa para esta modalidade.")
                          return
                        }
                        let turmaEscolhida = null
                        if (turmasFiltradas.length === 1) {
                          turmaEscolhida = turmasFiltradas[0]
                        } else {
                          const nomeTurma = prompt("Turmas disponíveis: " + turmasFiltradas.map(t=>t.nome).join(", ") + "\nDigite o nome da turma:")
                          if (nomeTurma) {
                            turmaEscolhida = turmasFiltradas.find(t => t.nome.toLowerCase() === nomeTurma.toLowerCase())
                          }
                        }
                        if (turmaEscolhida) {
                          await adicionarTurmaAluno(turmaEscolhida.id)
                        } else {
                          alert("Turma não encontrada ou não selecionada.")
                        }
                        e.target.value = ""
                      }} defaultValue="">
                        <option value="">+ Adicionar modalidade...</option>
                        {modalidades.map(mod => <option key={mod.id} value={mod.id}>{mod.nome}</option>)}
                      </select>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <button onClick={salvarAluno} className="bg-red-600 text-white px-4 py-2 rounded">Salvar Alterações</button>
                      <button onClick={() => setAlunoEditando(null)} className="bg-gray-300 px-4 py-2 rounded">Cancelar</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {aba === "movimentacoes" && (
          <div className="bg-white rounded-xl shadow p-4">
            <div className="grid md:grid-cols-5 gap-3 mb-4">
              <select className="p-2 border rounded" value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
                <option value="todos">Todos</option>
                <option value="matricula">Matrícula</option>
                <option value="mensalidade">Mensalidade</option>
                <option value="venda">Venda</option>
              </select>
              <select className="p-2 border rounded" value={filtroParceiro} onChange={e => setFiltroParceiro(e.target.value)}>
                <option value="">Todos os parceiros</option>
                {parceiros.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
              <input type="date" className="p-2 border rounded" value={filtroDataInicio} onChange={e => setFiltroDataInicio(e.target.value)} />
              <input type="date" className="p-2 border rounded" value={filtroDataFim} onChange={e => setFiltroDataFim(e.target.value)} />
              <label className="flex items-center gap-2"><input type="checkbox" checked={mostrarCancelados} onChange={e => setMostrarCancelados(e.target.checked)} /> Mostrar cancelados</label>
            </div>
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr><th className="p-2 text-left">Data</th><th className="p-2 text-left">Tipo</th><th className="p-2 text-left">Descrição</th><th className="p-2 text-left">Valor</th><th className="p-2 text-left">Parceiro</th><th className="p-2 text-left">Ação</th></tr>
              </thead>
              <tbody>
                {movFiltradas.map(mov => (
                  <tr key={mov.id} className="border-t">
                    <td className="p-2">{new Date(mov.data).toLocaleDateString()}</td>
                    <td className="p-2 capitalize">{mov.tipo}</td>
                    <td className="p-2">{mov.descricao || mov.nome}</td>
                    <td className="p-2">R$ {Number(mov.valor).toFixed(2)}</td>
                    <td className="p-2">{parceiros.find(p => p.id === mov.parceiro_id)?.nome || (mov.tipo === "venda" ? "CT" : "-")}</td>
                    <td className="p-2">{!mov.cancelado && <button onClick={() => cancelarMovimentacao(mov)} className="bg-red-500 text-white px-2 py-1 rounded text-sm">Cancelar</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminGuard>
  )
}