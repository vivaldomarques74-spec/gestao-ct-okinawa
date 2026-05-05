"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import AdminGuard from "../../components/AdminGuard"

type Professor = {
  id: string
  nome: string
  comissao: number
}

type Movimentacao = {
  id: string
  aluno_nome: string
  turma_nome: string
  data: string
  tipo: string
  valor_base: number
  valor_comissao: number
}

type Presenca = {
  id: string
  aluno_nome: string
  turma_nome: string
  data: string
  status: string
}

type ParceiroVenda = {
  id: string
  produto: string
  valor: number
  data: string
}

export default function RelatoriosPage() {
  const [aba, setAba] = useState("professores")
  
  // Estado para relatório de professores
  const [professores, setProfessores] = useState<Professor[]>([])
  const [professorSelecionado, setProfessorSelecionado] = useState("")
  const [dataInicioProf, setDataInicioProf] = useState("")
  const [dataFimProf, setDataFimProf] = useState("")
  const [movimentacoesProf, setMovimentacoesProf] = useState<Movimentacao[]>([])
  const [totalComissaoProf, setTotalComissaoProf] = useState(0)
  const [loadingProf, setLoadingProf] = useState(false)

  // Estado para presença
  const [presencas, setPresencas] = useState<Presenca[]>([])
  const [turmasList, setTurmasList] = useState<any[]>([])
  const [filtroTurmaPresenca, setFiltroTurmaPresenca] = useState("")
  const [dataInicioPres, setDataInicioPres] = useState("")
  const [dataFimPres, setDataFimPres] = useState("")
  const [loadingPres, setLoadingPres] = useState(false)

  // Estado para turmas (alunos por turma)
  const [modalidades, setModalidades] = useState<any[]>([])
  const [turmas, setTurmas] = useState<any[]>([])
  const [modalidadeSelecionada, setModalidadeSelecionada] = useState("")
  const [turmaSelecionada, setTurmaSelecionada] = useState("")
  const [alunosTurma, setAlunosTurma] = useState<any[]>([])

  // Estado para parceiros
  const [parceiros, setParceiros] = useState<any[]>([])
  const [parceiroSelecionado, setParceiroSelecionado] = useState("")
  const [dataInicioParceiro, setDataInicioParceiro] = useState("")
  const [dataFimParceiro, setDataFimParceiro] = useState("")
  const [vendasParceiro, setVendasParceiro] = useState<ParceiroVenda[]>([])
  const [totalVendasParceiro, setTotalVendasParceiro] = useState(0)
  const [loadingParceiro, setLoadingParceiro] = useState(false)

  useEffect(() => {
    carregarDadosBase()
  }, [])

  useEffect(() => {
    if (aba === "professores" && professorSelecionado && dataInicioProf && dataFimProf) {
      carregarRelatorioProfessor()
    }
  }, [professorSelecionado, dataInicioProf, dataFimProf])

  useEffect(() => {
    if (aba === "presenca") {
      carregarPresencas()
    }
  }, [filtroTurmaPresenca, dataInicioPres, dataFimPres])

  useEffect(() => {
    if (aba === "turmas") {
      carregarModalidadesTurmas()
    }
  }, [modalidadeSelecionada])

  useEffect(() => {
    if (aba === "turmas" && turmaSelecionada) {
      carregarAlunosPorTurma()
    }
  }, [turmaSelecionada])

  useEffect(() => {
    if (aba === "parceiros" && parceiroSelecionado && dataInicioParceiro && dataFimParceiro) {
      carregarRelatorioParceiro()
    }
  }, [parceiroSelecionado, dataInicioParceiro, dataFimParceiro])

  async function carregarDadosBase() {
    const { data: profs } = await supabase.from("professores").select("*").eq("status", "ativo")
    setProfessores(profs || [])
    const { data: turmasData } = await supabase.from("turmas").select("*, modalidades(nome)").eq("status", "ativo")
    setTurmasList(turmasData || [])
    const { data: mods } = await supabase.from("modalidades").select("*").eq("status", "ativo")
    setModalidades(mods || [])
    const { data: turmasCompletas } = await supabase.from("turmas").select("*, modalidades(*)").eq("status", "ativo")
    setTurmas(turmasCompletas || [])
    const { data: pars } = await supabase.from("parceiros").select("*").eq("status", "ativo")
    setParceiros(pars || [])
  }

  async function carregarModalidadesTurmas() {
    let query = supabase.from("turmas").select("*, modalidades(*)").eq("status", "ativo")
    if (modalidadeSelecionada) query = query.eq("modalidade_id", modalidadeSelecionada)
    const { data } = await query
    setTurmas(data || [])
  }

  async function carregarRelatorioProfessor() {
    setLoadingProf(true)
    // 1. Buscar turmas do professor
    const { data: turmasProfessor } = await supabase
      .from("turmas")
      .select("id, nome")
      .eq("professor_id", professorSelecionado)
      .eq("status", "ativo")
    if (!turmasProfessor?.length) {
      setMovimentacoesProf([])
      setTotalComissaoProf(0)
      setLoadingProf(false)
      return
    }
    const turmaIds = turmasProfessor.map(t => t.id)

    // 2. Buscar matriculas ativas nessas turmas
    const { data: matriculas } = await supabase
      .from("matriculas")
      .select("id, aluno_id, turma_id, alunos(nome)")
      .in("turma_id", turmaIds)
      .eq("status", "ativo")
    if (!matriculas?.length) {
      setMovimentacoesProf([])
      setTotalComissaoProf(0)
      setLoadingProf(false)
      return
    }

    const alunoIds = matriculas.map(m => m.aluno_id)
    const matriculaPorAluno = new Map()
    matriculas.forEach(m => {
      matriculaPorAluno.set(m.aluno_id, {
        turmaId: m.turma_id,
        alunoNome: m.alunos?.nome
      })
    })

    // 3. Buscar movimentações pagas no caixa (matricula ou mensalidade)
    const { data: movimentacoes } = await supabase
      .from("caixa")
      .select("*")
      .in("aluno_id", alunoIds)
      .in("tipo", ["matricula", "mensalidade"])
      .eq("cancelado", false)
      .gte("data", `${dataInicioProf}T00:00:00`)
      .lte("data", `${dataFimProf}T23:59:59`)

    const professor = professores.find(p => p.id === professorSelecionado)
    const comissaoPercent = professor?.comissao || 0

    const lista: Movimentacao[] = []
    let total = 0
    for (const mov of movimentacoes || []) {
      const matInfo = matriculaPorAluno.get(mov.aluno_id)
      if (!matInfo) continue
      const valorBase = Number(mov.valor_base || 0)
      const comissao = valorBase * (comissaoPercent / 100)
      lista.push({
        id: mov.id,
        aluno_nome: matInfo.alunoNome,
        turma_nome: turmasProfessor.find(t => t.id === matInfo.turmaId)?.nome || "",
        data: mov.data,
        tipo: mov.tipo,
        valor_base: valorBase,
        valor_comissao: comissao,
      })
      total += comissao
    }
    setMovimentacoesProf(lista)
    setTotalComissaoProf(total)
    setLoadingProf(false)
  }

  function imprimirRelatorioProfessor() {
    const professor = professores.find(p => p.id === professorSelecionado)
    const comissaoPercent = professor?.comissao || 0
    const w = window.open("", "", "width=800,height=600")
    w?.document.write(`
      <html><head><title>Relatório Professor</title>
      <style>body{font-family:Arial;padding:30px} table{border-collapse:collapse;width:100%} th,td{border:1px solid #ccc;padding:8px} .assinatura{margin-top:50px;display:flex;justify-content:space-between}</style>
      </head><body>
      <h1>CT OKINAWA</h1>
      <h2>Relatório de Comissão - Professor ${professor?.nome}</h2>
      <p>Período: ${new Date(dataInicioProf).toLocaleDateString()} a ${new Date(dataFimProf).toLocaleDateString()}</p>
      <table><thead><tr><th>Aluno</th><th>Turma</th><th>Data</th><th>Tipo</th><th>Valor Base</th><th>Comissão (${comissaoPercent}%)</th></tr></thead><tbody>
      ${movimentacoesProf.map(m => `<tr><td>${m.aluno_nome}</td><td>${m.turma_nome}</td><td>${new Date(m.data).toLocaleDateString()}</td><td>${m.tipo === 'matricula' ? 'Matrícula' : 'Mensalidade'}</td><td>R$ ${m.valor_base.toFixed(2)}</td><td>R$ ${m.valor_comissao.toFixed(2)}</td></tr>`).join('')}
      </tbody></table>
      <div class="total">Total de Comissão: R$ ${totalComissaoProf.toFixed(2)}</div>
      <div class="assinatura"><div>__________________________<br/>Professor</div><div>__________________________<br/>Coordenação</div></div>
      <script>window.onload=()=>window.print()</script>
      </body></html>
    `)
    w?.document.close()
  }

  async function carregarPresencas() {
    setLoadingPres(true)
    let query = supabase.from("presencas").select("*, alunos(nome), turmas(nome)").order("data", { ascending: false })
    if (filtroTurmaPresenca) query = query.eq("turma_id", filtroTurmaPresenca)
    if (dataInicioPres) query = query.gte("data", dataInicioPres)
    if (dataFimPres) query = query.lte("data", dataFimPres)
    const { data } = await query
    const lista = (data || []).map(p => ({
      id: p.id,
      aluno_nome: p.alunos?.nome || "?",
      turma_nome: p.turmas?.nome || "?",
      data: p.data,
      status: p.status
    }))
    setPresencas(lista)
    setLoadingPres(false)
  }

  async function excluirPresenca(id: string) {
    if (!confirm("Excluir esta presença?")) return
    await supabase.from("presencas").delete().eq("id", id)
    carregarPresencas()
  }

  async function editarPresenca(id: string, novoStatus: string) {
    await supabase.from("presencas").update({ status: novoStatus }).eq("id", id)
    carregarPresencas()
  }

  function imprimirPresencas() {
    const w = window.open("", "", "width=800,height=600")
    w?.document.write(`<html><head><title>Relatório de Presenças</title><style>table,th,td{border:1px solid #ccc;border-collapse:collapse;padding:8px}</style></head><body>
    <h1>CT OKINAWA</h1><h2>Relatório de Presenças</h2><p>Período: ${dataInicioPres || "início"} a ${dataFimPres || "fim"}</p>
    <table><thead><tr><th>Aluno</th><th>Turma</th><th>Data</th><th>Status</th></tr></thead><tbody>
    ${presencas.map(p => `<tr><td>${p.aluno_nome}</td><td>${p.turma_nome}</td><td>${new Date(p.data).toLocaleDateString()}</td><td>${p.status}</td></tr>`).join('')}
    </tbody></table>
    <script>window.onload=()=>window.print()</script>
    </body></html>`)
    w?.document.close()
  }

  async function carregarAlunosPorTurma() {
    if (!turmaSelecionada) return
    const { data: matriculas } = await supabase
      .from("matriculas")
      .select("alunos(id, nome, cpf, status)")
      .eq("turma_id", turmaSelecionada)
      .eq("status", "ativo")
    const alunos = matriculas?.map(m => m.alunos).filter(Boolean) || []
    setAlunosTurma(alunos)
  }

  async function carregarRelatorioParceiro() {
    setLoadingParceiro(true)
    const { data: vendas } = await supabase
      .from("caixa")
      .select("*")
      .eq("tipo", "venda")
      .eq("parceiro_id", parceiroSelecionado)
      .eq("cancelado", false)
      .gte("data", `${dataInicioParceiro}T00:00:00`)
      .lte("data", `${dataFimParceiro}T23:59:59`)
    const lista = (vendas || []).map(v => ({
      id: v.id,
      produto: v.descricao || v.nome || "Produto",
      valor: Number(v.valor),
      data: v.data
    }))
    const total = lista.reduce((acc, v) => acc + v.valor, 0)
    setVendasParceiro(lista)
    setTotalVendasParceiro(total)
    setLoadingParceiro(false)
  }

  function imprimirRelatorioParceiro() {
    const parceiro = parceiros.find(p => p.id === parceiroSelecionado)
    const w = window.open("", "", "width=800,height=600")
    w?.document.write(`<html><head><title>Relatório Parceiro</title><style>table,th,td{border:1px solid #ccc;border-collapse:collapse;padding:8px}</style></head><body>
    <h1>CT OKINAWA</h1><h2>Relatório de Vendas - Parceiro ${parceiro?.nome}</h2>
    <p>Período: ${new Date(dataInicioParceiro).toLocaleDateString()} a ${new Date(dataFimParceiro).toLocaleDateString()}</p>
    <table><thead><tr><th>Produto</th><th>Valor</th><th>Data</th></tr></thead><tbody>
    ${vendasParceiro.map(v => `<tr><td>${v.produto}</td><td>R$ ${v.valor.toFixed(2)}</td><td>${new Date(v.data).toLocaleDateString()}</td></tr>`).join('')}
    </tbody></table>
    <h3>Total: R$ ${totalVendasParceiro.toFixed(2)}</h3>
    <script>window.onload=()=>window.print()</script>
    </body></html>`)
    w?.document.close()
  }

  function getModalidadeNome(turma: any): string {
    if (!turma.modalidades) return "?"
    if (Array.isArray(turma.modalidades)) return turma.modalidades[0]?.nome || "?"
    return turma.modalidades.nome || "?"
  }

  return (
    <AdminGuard>
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Central de Relatórios</h1>
        <div className="flex gap-2 mb-6 border-b">
          <button className={`px-4 py-2 ${aba === 'professores' ? 'bg-red-600 text-white rounded-t' : 'text-gray-600'}`} onClick={() => setAba('professores')}>Professores</button>
          <button className={`px-4 py-2 ${aba === 'presenca' ? 'bg-red-600 text-white rounded-t' : 'text-gray-600'}`} onClick={() => setAba('presenca')}>Presença</button>
          <button className={`px-4 py-2 ${aba === 'turmas' ? 'bg-red-600 text-white rounded-t' : 'text-gray-600'}`} onClick={() => setAba('turmas')}>Modalidades / Turmas</button>
          <button className={`px-4 py-2 ${aba === 'parceiros' ? 'bg-red-600 text-white rounded-t' : 'text-gray-600'}`} onClick={() => setAba('parceiros')}>Parceiros</button>
        </div>

        {aba === 'professores' && (
          <div className="bg-white p-4 rounded-xl shadow">
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <select className="p-2 border rounded" value={professorSelecionado} onChange={e => setProfessorSelecionado(e.target.value)}>
                <option value="">Selecione o professor</option>
                {professores.map(p => <option key={p.id} value={p.id}>{p.nome} (Comissão {p.comissao}%)</option>)}
              </select>
              <input type="date" className="p-2 border rounded" value={dataInicioProf} onChange={e => setDataInicioProf(e.target.value)} />
              <input type="date" className="p-2 border rounded" value={dataFimProf} onChange={e => setDataFimProf(e.target.value)} />
            </div>
            {loadingProf && <p>Carregando...</p>}
            {!loadingProf && movimentacoesProf.length === 0 && professorSelecionado && dataInicioProf && dataFimProf && (
              <p className="text-gray-500">Nenhuma movimentação paga no período.</p>
            )}
            {movimentacoesProf.length > 0 && (
              <>
                <div className="overflow-auto">
                  <table className="w-full border">
                    <thead className="bg-gray-100"><tr><th className="p-2">Aluno</th><th>Turma</th><th>Data</th><th>Tipo</th><th>Valor Base</th><th>Comissão</th></tr></thead>
                    <tbody>
                      {movimentacoesProf.map(m => (
                        <tr key={m.id}><td className="p-2">{m.aluno_nome}</td><td>{m.turma_nome}</td><td>{new Date(m.data).toLocaleDateString()}</td><td>{m.tipo === 'matricula' ? 'Matrícula' : 'Mensalidade'}</td><td>R$ {m.valor_base.toFixed(2)}</td><td>R$ {m.valor_comissao.toFixed(2)}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 flex justify-between items-center">
                  <p className="font-bold text-lg">Total Comissão: R$ {totalComissaoProf.toFixed(2)}</p>
                  <button onClick={imprimirRelatorioProfessor} className="bg-red-600 text-white px-4 py-2 rounded">Imprimir</button>
                </div>
              </>
            )}
          </div>
        )}

        {aba === 'presenca' && (
          <div className="bg-white p-4 rounded-xl shadow">
            <div className="grid md:grid-cols-4 gap-4 mb-4">
              <select className="p-2 border rounded" value={filtroTurmaPresenca} onChange={e => setFiltroTurmaPresenca(e.target.value)}>
                <option value="">Todas as turmas</option>
                {turmasList.map(t => <option key={t.id} value={t.id}>{t.nome} ({getModalidadeNome(t)})</option>)}
              </select>
              <input type="date" className="p-2 border rounded" value={dataInicioPres} onChange={e => setDataInicioPres(e.target.value)} />
              <input type="date" className="p-2 border rounded" value={dataFimPres} onChange={e => setDataFimPres(e.target.value)} />
              <button onClick={carregarPresencas} className="bg-blue-500 text-white p-2 rounded">Filtrar</button>
              <button onClick={imprimirPresencas} className="bg-green-600 text-white p-2 rounded">Imprimir</button>
            </div>
            {loadingPres && <p>Carregando...</p>}
            <div className="overflow-auto">
              <table className="w-full border">
                <thead className="bg-gray-100"><tr><th>Aluno</th><th>Turma</th><th>Data</th><th>Status</th><th>Ações</th></tr></thead>
                <tbody>
                  {presencas.map(p => (
                    <tr key={p.id}><td>{p.aluno_nome}</td><td>{p.turma_nome}</td><td>{new Date(p.data).toLocaleDateString()}</td>
                    <td><select value={p.status} onChange={e => editarPresenca(p.id, e.target.value)} className="border rounded p-1"><option value="presente">Presente</option><option value="ausente">Ausente</option></select></td>
                    <td><button onClick={() => excluirPresenca(p.id)} className="bg-red-500 text-white px-2 py-1 rounded text-sm">Excluir</button></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {aba === 'turmas' && (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-4 rounded-xl shadow"><h3 className="font-bold mb-2">Modalidades</h3>{modalidades.map(mod => <button key={mod.id} onClick={() => setModalidadeSelecionada(mod.id)} className={`block w-full text-left p-2 rounded ${modalidadeSelecionada === mod.id ? 'bg-red-600 text-white' : 'bg-gray-100'}`}>{mod.nome}</button>)}</div>
            <div className="bg-white p-4 rounded-xl shadow"><h3 className="font-bold mb-2">Turmas</h3>{turmas.filter(t => t.modalidade_id === modalidadeSelecionada).map(turma => <button key={turma.id} onClick={() => setTurmaSelecionada(turma.id)} className={`block w-full text-left p-2 rounded ${turmaSelecionada === turma.id ? 'bg-red-600 text-white' : 'bg-gray-100'}`}>{turma.nome}</button>)}</div>
            <div className="bg-white p-4 rounded-xl shadow"><h3 className="font-bold mb-2">Alunos - {turmas.find(t => t.id === turmaSelecionada)?.nome || ''}</h3>{alunosTurma.length === 0 ? <p className="text-gray-500">Nenhum aluno matriculado.</p> : <ul className="list-disc pl-5">{alunosTurma.map(aluno => <li key={aluno.id}>{aluno.nome} - {aluno.cpf} ({aluno.status})</li>)}</ul>}</div>
          </div>
        )}

        {aba === 'parceiros' && (
          <div className="bg-white p-4 rounded-xl shadow">
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <select className="p-2 border rounded" value={parceiroSelecionado} onChange={e => setParceiroSelecionado(e.target.value)}><option value="">Selecione o parceiro</option>{parceiros.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}</select>
              <input type="date" className="p-2 border rounded" value={dataInicioParceiro} onChange={e => setDataInicioParceiro(e.target.value)} />
              <input type="date" className="p-2 border rounded" value={dataFimParceiro} onChange={e => setDataFimParceiro(e.target.value)} />
            </div>
            {loadingParceiro && <p>Carregando...</p>}
            {!loadingParceiro && vendasParceiro.length === 0 && parceiroSelecionado && dataInicioParceiro && dataFimParceiro && <p className="text-gray-500">Nenhuma venda no período.</p>}
            {vendasParceiro.length > 0 && (
              <>
                <div className="overflow-auto"><table className="w-full border"><thead className="bg-gray-100"><tr><th>Produto</th><th>Valor</th><th>Data</th></tr></thead><tbody>{vendasParceiro.map(v => <tr key={v.id}><td>{v.produto}</td><td>R$ {v.valor.toFixed(2)}</td><td>{new Date(v.data).toLocaleDateString()}</td></tr>)}</tbody></table></div>
                <div className="mt-4 flex justify-between items-center"><p className="font-bold text-lg">Total de Vendas: R$ {totalVendasParceiro.toFixed(2)}</p><button onClick={imprimirRelatorioParceiro} className="bg-red-600 text-white px-4 py-2 rounded">Imprimir</button></div>
              </>
            )}
          </div>
        )}
      </div>
    </AdminGuard>
  )
}