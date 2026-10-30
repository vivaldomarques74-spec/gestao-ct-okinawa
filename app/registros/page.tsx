"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import AdminGuard from "../../components/AdminGuard"
import { Gift, Lock, Trash2, X } from "lucide-react"

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
  const [descontoEspecial, setDescontoEspecial] = useState<any>(null)
  
  const [formDesconto, setFormDesconto] = useState({ tipo: "fixo", valor: "", meses: "", recorrente: false })
  const [senhaDiretor, setSenhaDiretor] = useState("")
  const [aplicandoDesconto, setAplicandoDesconto] = useState(false)

  // ESTADOS DE CANCELAMENTO E AUDITORIA
  const [movCancelar, setMovCancelar] = useState<any>(null)
  const [senhaCancelamento, setSenhaCancelamento] = useState("")

  const [formAluno, setFormAluno] = useState<any>({
    nome: "", cpf: "", rg: "", nascimento: "", whatsapp: "", email: "", endereco: "",
    menor: false,
    responsavel_nome: "", responsavel_cpf: "", responsavel_whatsapp: "", responsavel_email: "",
    problema_saude: false, saude_detalhes: "",
    usa_remedio: false, remedio_detalhes: "",
    status: "ativo",
    convenio_id: "",
  })

  const [filtroTipo, setFiltroTipo] = useState("todos")
  const [filtroParceiro, setFiltroParceiro] = useState("")
  const [mostrarCancelados, setMostrarCancelados] = useState(false)
  const [buscaAluno, setBuscaAluno] = useState("")

  useEffect(() => { carregarTudo() }, [])

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
    const { data: turmasData } = await supabase.from("turmas").select("*, modalidades(*)").eq("status", "ativo")
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
    setSenhaDiretor("")
    setFormAluno({
      nome: aluno.nome || "", cpf: aluno.cpf || "", rg: aluno.rg || "", nascimento: aluno.nascimento || "",
      whatsapp: aluno.whatsapp || "", email: aluno.email || "", endereco: aluno.endereco || "",
      menor: aluno.menor || false,
      responsavel_nome: aluno.responsavel_nome || "", responsavel_cpf: aluno.responsavel_cpf || "", 
      responsavel_whatsapp: aluno.responsavel_whatsapp || "", responsavel_email: aluno.responsavel_email || "",
      problema_saude: aluno.problema_saude || false, saude_detalhes: aluno.saude_detalhes || "",
      usa_remedio: aluno.usa_remedio || false, remedio_detalhes: aluno.remedio_detalhes || "",
      status: aluno.status || "ativo", convenio_id: aluno.convenio_id || "",
    })
    
    const { data: mats } = await supabase.from("matriculas").select("*, turmas(*)").eq("aluno_id", aluno.id).eq("status", "ativo")
    setMatriculasAluno(mats || [])

    const { data: desc } = await supabase.from("descontos_especiais").select("*").eq("aluno_id", aluno.id).eq("status", "ativo").maybeSingle()
    setDescontoEspecial(desc || null)
  }

  async function salvarAluno() {
    if (!alunoEditando) return
    await supabase.from("alunos").update({
      nome: formAluno.nome, cpf: formAluno.cpf, rg: formAluno.rg, nascimento: formAluno.nascimento,
      whatsapp: formAluno.whatsapp, email: formAluno.email, endereco: formAluno.endereco,
      menor: formAluno.menor, responsavel_nome: formAluno.responsavel_nome, responsavel_cpf: formAluno.responsavel_cpf,
      responsavel_whatsapp: formAluno.responsavel_whatsapp, responsavel_email: formAluno.responsavel_email,
      problema_saude: formAluno.problema_saude, saude_detalhes: formAluno.saude_detalhes,
      usa_remedio: formAluno.usa_remedio, remedio_detalhes: formAluno.remedio_detalhes,
      status: formAluno.status, convenio_id: formAluno.convenio_id,
    }).eq("id", alunoEditando.id)
    alert("Aluno atualizado")
    carregarAlunos()
    setAlunoEditando(null)
  }

  async function aplicarDescontoDiretoria() {
    if (senhaDiretor !== "984215") return alert("❌ Senha de Diretoria incorreta. Operação negada.")
    if (!formDesconto.valor) return alert("Preencha o valor do desconto.")
    if (!formDesconto.recorrente && !formDesconto.meses) return alert("Preencha a quantidade de meses ou marque 'Recorrente'.")
    if (descontoEspecial) return alert("Este aluno já possui um desconto ativo.")

    setAplicandoDesconto(true)
    
    const meses = formDesconto.recorrente ? 999 : Number(formDesconto.meses)
    await supabase.from("descontos_especiais").insert([{
      aluno_id: alunoEditando.id,
      tipo: formDesconto.tipo,
      valor: Number(formDesconto.valor),
      meses_duracao: meses,
      meses_restantes: meses,
      recorrente: formDesconto.recorrente,
      status: "ativo"
    }])

    const { data: pendentes } = await supabase.from("mensalidades").select("*").eq("aluno_id", alunoEditando.id).eq("status", "pendente").order("vencimento", { ascending: true })
    
    if (pendentes) {
      let mesesUsados = 0;
      for (const m of pendentes) {
        if (!formDesconto.recorrente && mesesUsados >= Number(formDesconto.meses)) break;

        let novoValor = m.valor;
        if (formDesconto.tipo === 'fixo') novoValor = Math.max(0, novoValor - Number(formDesconto.valor));
        else novoValor = Math.max(0, novoValor - (novoValor * (Number(formDesconto.valor) / 100)));

        await supabase.from("mensalidades").update({ 
          valor: novoValor, 
          status: novoValor === 0 ? "isento" : "pendente" 
        }).eq("id", m.id)
        
        mesesUsados++;
      }
    }

    alert("✅ Desconto de Diretoria aplicado!")
    setDescontoEspecial({ tipo: formDesconto.tipo, valor: formDesconto.valor, meses_restantes: meses, recorrente: formDesconto.recorrente })
    setFormDesconto({ tipo: "fixo", valor: "", meses: "", recorrente: false })
    setSenhaDiretor("")
    setAplicandoDesconto(false)
  }

  async function cancelarDescontoDiretoria() {
    if (senhaDiretor !== "984215") return alert("❌ Senha de Diretoria incorreta. Operação negada.")
    if (!confirm("Cancelar este desconto? As mensalidades pendentes voltarão ao valor normal.")) return
    await supabase.from("descontos_especiais").update({ status: "cancelado" }).eq("id", descontoEspecial.id)
    setDescontoEspecial(null)
    alert("Desconto cancelado.")
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
    await supabase.from("alunos").update({ status: aluno.status === "ativo" ? "inativo" : "ativo" }).eq("id", aluno.id)
    carregarAlunos()
  }

  async function adicionarTurmaAluno(turmaId: string) {
    if (!alunoEditando) return
    const turma = turmas.find(t => t.id === turmaId)
    if (!turma) return
    const { data: novaMat } = await supabase.from("matriculas").insert([{ aluno_id: alunoEditando.id, turma_id: turmaId, status: "ativo" }]).select().single()
    const hoje = new Date()
    const vencimento = new Date(hoje.getFullYear(), hoje.getMonth() + 1, hoje.getDate()).toISOString().slice(0, 10)
    await supabase.from("mensalidades").insert([{ aluno_id: alunoEditando.id, matricula_id: novaMat.id, vencimento, valor: turma.modalidades?.valor_geral || 0, valor_base: turma.modalidades?.valor_base || 0, status: "pendente" }])
    alert("Modalidade adicionada")
    const { data: mats } = await supabase.from("matriculas").select("*, turmas(*)").eq("aluno_id", alunoEditando.id).eq("status", "ativo")
    setMatriculasAluno(mats || [])
  }

  async function removerTurmaAluno(matriculaId: string) {
    if (!confirm(`Remover esta turma?`)) return
    await supabase.from("mensalidades").update({ status: "cancelado" }).eq("matricula_id", matriculaId).eq("status", "pendente")
    await supabase.from("matriculas").update({ status: "inativo" }).eq("id", matriculaId)
    const { data: mats } = await supabase.from("matriculas").select("*, turmas(*)").eq("aluno_id", alunoEditando.id).eq("status", "ativo")
    setMatriculasAluno(mats || [])
  }

  // CANCELAMENTO COM LOG E SENHA
  async function confirmarCancelamento() {
    if (senhaCancelamento !== "984215") return alert("❌ Senha incorreta. Cancelamento negado.")
    if (!movCancelar) return

    // 1. Cancela no caixa
    await supabase.from("caixa").update({ cancelado: true, valor: 0 }).eq("id", movCancelar.id)
    
    // 2. Grava o log de auditoria
    await supabase.from("logs_auditoria").insert([{
      operador: "Admin (Diretoria)",
      acao: "Cancelamento Financeiro",
      detalhes: `Cancelou ${movCancelar.tipo} no valor de R$ ${movCancelar.valor} do aluno ${movCancelar.nome}. ID: ${movCancelar.id}`
    }])

    alert("✅ Cancelado com sucesso. Log registrado.")
    setMovCancelar(null)
    setSenhaCancelamento("")
    carregarMovimentacoes()
  }

  const movFiltradas = movimentacoes.filter(mov => {
    if (!mostrarCancelados && mov.cancelado) return false
    if (filtroTipo !== "todos" && mov.tipo !== filtroTipo) return false
    if (filtroParceiro && mov.parceiro_id !== filtroParceiro) return false
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
                <input type="text" placeholder="Buscar aluno..." className="w-full p-2 border rounded mb-3" value={buscaAluno} onChange={e => setBuscaAluno(e.target.value)} />
                <div className="max-h-150 overflow-y-auto">
                  {alunos.filter(a => a.nome?.toLowerCase().includes(buscaAluno.toLowerCase())).map(aluno => (
                    <div key={aluno.id} className="border-b p-2 flex justify-between items-center">
                      <div className="cursor-pointer" onClick={() => editarAluno(aluno)}>
                        <p className="font-semibold">{aluno.nome}</p>
                        <p className="text-xs text-gray-500">CPF: {aluno.cpf}</p>
                      </div>
                      <button onClick={() => excluirAluno(aluno.id)} className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">Excluir</button>
                    </div>
                  ))}
                </div>
              </div>

              {alunoEditando && (
                <div className="pl-4 space-y-3 max-h-175 overflow-y-auto pr-2">
                  <input className="w-full p-2 border rounded" placeholder="Nome" value={formAluno.nome} onChange={e => setFormAluno({...formAluno, nome: e.target.value})} />
                  <input className="w-full p-2 border rounded" placeholder="WhatsApp" value={formAluno.whatsapp} onChange={e => setFormAluno({...formAluno, whatsapp: e.target.value})} />
                  
                  <h3 className="font-semibold mt-4 border-t pt-2 text-red-600 flex items-center gap-2"><Gift size={18}/> Desconto de Diretoria</h3>
                  
                  {descontoEspecial ? (
                    <div className="bg-red-50 border border-red-200 p-3 rounded">
                      <p className="text-sm font-semibold text-red-700">Desconto Ativo {descontoEspecial.recorrente && "(Recorrente)"}</p>
                      <p className="text-xs text-gray-600 mb-2">{descontoEspecial.tipo === "fixo" ? `R$ ${descontoEspecial.valor}` : `${descontoEspecial.valor}%`}.</p>
                      
                      <div className="flex gap-2 mt-2">
                        <input type="password" placeholder="Senha Diretor" className="w-1/2 p-1 border rounded text-sm" value={senhaDiretor} onChange={e => setSenhaDiretor(e.target.value)} />
                        <button onClick={cancelarDescontoDiretoria} className="bg-red-600 text-white text-xs px-3 py-1 rounded">Cancelar Desconto</button>
                      </div>
                    </div>
                  ) : (
                    <div className="border p-3 rounded bg-gray-50 space-y-2">
                      <select className="w-full p-2 border rounded" value={formDesconto.tipo} onChange={e => setFormDesconto({...formDesconto, tipo: e.target.value})}>
                        <option value="fixo">Desconto em R$ (Ex: 30)</option>
                        <option value="percentual">Desconto em % (Ex: 20)</option>
                      </select>
                      <input type="number" className="w-full p-2 border rounded" placeholder="Valor do Desconto" value={formDesconto.valor} onChange={e => setFormDesconto({...formDesconto, valor: e.target.value})} />
                      
                      <label className="flex items-center gap-2 text-sm font-semibold text-blue-700">
                        <input type="checkbox" checked={formDesconto.recorrente} onChange={e => setFormDesconto({...formDesconto, recorrente: e.target.checked, meses: e.target.checked ? "" : formDesconto.meses})} />
                        Desconto Recorrente (Para Sempre)
                      </label>

                      {!formDesconto.recorrente && (
                        <input type="number" className="w-full p-2 border rounded" placeholder="Meses de duração (Ex: 10)" value={formDesconto.meses} onChange={e => setFormDesconto({...formDesconto, meses: e.target.value})} />
                      )}

                      <div className="border-t pt-2 mt-2">
                        <label className="text-xs font-bold text-gray-500 flex items-center gap-1 mb-1"><Lock size={12}/> Autorização da Diretoria</label>
                        <input type="password" className="w-full p-2 border border-red-300 rounded" placeholder="Digite a senha" value={senhaDiretor} onChange={e => setSenhaDiretor(e.target.value)} />
                      </div>

                      <button onClick={aplicarDescontoDiretoria} disabled={aplicandoDesconto} className="w-full bg-gray-800 text-white p-2 rounded mt-2 hover:bg-black">Aplicar Desconto</button>
                    </div>
                  )}

                  <div className="flex gap-2 mt-4 border-t pt-4">
                    <button onClick={salvarAluno} className="bg-red-600 text-white px-4 py-2 rounded">Salvar Alterações</button>
                    <button onClick={() => setAlunoEditando(null)} className="bg-gray-300 px-4 py-2 rounded">Fechar</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {aba === "movimentacoes" && (
          <div className="bg-white rounded-xl shadow p-4">
            <div className="grid md:grid-cols-4 gap-3 mb-4">
              <select className="p-2 border rounded" value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
                <option value="todos">Todos</option><option value="matricula">Matrícula</option><option value="mensalidade">Mensalidade</option><option value="venda">Venda</option>
              </select>
              <select className="p-2 border rounded" value={filtroParceiro} onChange={e => setFiltroParceiro(e.target.value)}>
                <option value="">Todos os parceiros</option>
                {parceiros.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
              <label className="flex items-center gap-2"><input type="checkbox" checked={mostrarCancelados} onChange={e => setMostrarCancelados(e.target.checked)} /> Mostrar cancelados</label>
            </div>
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr><th className="p-2 text-left">Data</th><th className="p-2 text-left">Tipo</th><th className="p-2 text-left">Valor</th><th className="p-2 text-left">Ação</th></tr>
              </thead>
              <tbody>
                {movFiltradas.map(mov => (
                  <tr key={mov.id} className="border-t">
                    <td className="p-2">{new Date(mov.data).toLocaleDateString()}</td>
                    <td className="p-2 capitalize">{mov.tipo}</td>
                    <td className="p-2">R$ {Number(mov.valor).toFixed(2)}</td>
                    <td className="p-2">
                      {!mov.cancelado && (
                        <button onClick={() => { setMovCancelar(mov); setSenhaCancelamento(""); }} className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600">
                          Cancelar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL DE CANCELAMENTO COM SENHA E LOG */}
      {movCancelar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-2 text-red-600 flex items-center gap-2">
              <Trash2 size={20} /> Confirmar Cancelamento
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Você está cancelando <b>{movCancelar.tipo}</b> no valor de <b>R$ {Number(movCancelar.valor).toFixed(2)}</b>. 
              Essa ação será registrada no log de auditoria.
            </p>
            <label className="block text-sm font-semibold mb-1">Senha da Diretoria</label>
            <input 
              type="password" 
              placeholder="Digite a senha de 6 dígitos" 
              className="w-full p-2 border rounded mb-4" 
              value={senhaCancelamento} 
              onChange={e => setSenhaCancelamento(e.target.value)} 
            />
            <div className="flex gap-2">
              <button onClick={confirmarCancelamento} className="bg-red-600 text-white p-2 rounded flex-1 hover:bg-red-700">Confirmar Cancelamento</button>
              <button onClick={() => setMovCancelar(null)} className="bg-gray-300 p-2 rounded hover:bg-gray-400">Voltar</button>
            </div>
          </div>
        </div>
      )}
    </AdminGuard>
  )
}