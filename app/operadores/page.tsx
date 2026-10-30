"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import AdminGuard from "../../components/AdminGuard"
import { Users, Printer, Search, Eye, X, FileText } from "lucide-react"

type Operador = {
  id: string
  nome: string
  codigo: string
  ativo: boolean
}

export default function OperadoresPage() {
  const [aba, setAba] = useState<"gerenciar" | "relatorio">("gerenciar")
  
  // --- ESTADOS DE GERENCIAMENTO DE OPERADORES ---
  const [operadores, setOperadores] = useState<Operador[]>([])
  const [loadingOp, setLoadingOp] = useState(true)
  const [form, setForm] = useState({ nome: "", codigo: "" })
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  // --- ESTADOS DO RELATÓRIO DE OPERAÇÕES ---
  const [dataFiltro, setDataFiltro] = useState(new Date().toISOString().slice(0, 10))
  const [turnos, setTurnos] = useState<any[]>([])
  const [loadingTurnos, setLoadingTurnos] = useState(false)
  const [turnoSelecionado, setTurnoSelecionado] = useState<any>(null)
  const [movimentacoesTurno, setMovimentacoesTurno] = useState<any[]>([])
  const [loadingMovs, setLoadingMovs] = useState(false)

  useEffect(() => {
    if (aba === "gerenciar") {
      carregarOperadores()
    } else {
      carregarTurnos()
    }
  }, [aba])

  // ========== FUNÇÕES DE OPERADORES ==========
  async function carregarOperadores() {
    setLoadingOp(true)
    const { data } = await supabase.from("operadores").select("*").order("nome")
    setOperadores(data || [])
    setLoadingOp(false)
  }

  async function salvarOperador() {
    if (!form.nome.trim() || !form.codigo.trim()) return alert("Preencha nome e código")
    setSalvando(true)

    if (editandoId) {
      await supabase.from("operadores").update({ nome: form.nome.trim(), codigo: form.codigo.trim() }).eq("id", editandoId)
      alert("Operador atualizado")
      cancelarEdicao()
    } else {
      const { error } = await supabase.from("operadores").insert([{ nome: form.nome.trim(), codigo: form.codigo.trim(), ativo: true }])
      if (error) alert("Erro: " + error.message)
      else {
        alert("Operador cadastrado")
        setForm({ nome: "", codigo: "" })
      }
    }
    carregarOperadores()
    setSalvando(false)
  }

  async function alternarAtivo(operador: Operador) {
    await supabase.from("operadores").update({ ativo: !operador.ativo }).eq("id", operador.id)
    carregarOperadores()
  }

  async function excluirOperador(id: string) {
    if (!confirm("Excluir operador permanentemente?")) return
    await supabase.from("operadores").delete().eq("id", id)
    carregarOperadores()
  }

  function editarOperador(operador: Operador) {
    setEditandoId(operador.id)
    setForm({ nome: operador.nome, codigo: operador.codigo })
  }

  function cancelarEdicao() {
    setEditandoId(null)
    setForm({ nome: "", codigo: "" })
  }

  // ========== FUNÇÕES DO RELATÓRIO ==========
  async function carregarTurnos() {
    setLoadingTurnos(true)
    setTurnoSelecionado(null)
    
    const inicio = `${dataFiltro}T00:00:00`
    const fim = `${dataFiltro}T23:59:59`

    const { data } = await supabase
      .from("caixa_turno")
      .select("*")
      .gte("aberto_em", inicio)
      .lte("aberto_em", fim)
      .order("aberto_em", { ascending: false })

    setTurnos(data || [])
    setLoadingTurnos(false)
  }

  async function verDetalhesTurno(turno: any) {
    setTurnoSelecionado(turno)
    setLoadingMovs(true)
    const { data } = await supabase
      .from("caixa")
      .select("*")
      .eq("caixa_turno_id", turno.id)
      .order("data", { ascending: true })
    setMovimentacoesTurno(data || [])
    setLoadingMovs(false)
  }

  function imprimirRelatorioTurno(turno: any, movs: any[]) {
    const totalDinheiro = movs.filter(m => m.forma_pagamento === "Dinheiro").reduce((a,b)=>a+Number(b.valor),0)
    const totalPix = movs.filter(m => m.forma_pagamento === "Pix").reduce((a,b)=>a+Number(b.valor),0)
    const totalCartao = movs.filter(m => m.forma_pagamento === "Cartão").reduce((a,b)=>a+Number(b.valor),0)
    const totalGeral = movs.reduce((a,b)=>a+Number(b.valor),0)

    const linhas = movs.map(m => {
      return `
        <tr>
          <td>${new Date(m.data).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</td>
          <td style="text-transform: capitalize;">${m.tipo}</td>
          <td>${m.nome || m.descricao || "-"}</td>
          <td>${m.forma_pagamento || "-"} ${m.codigo_pagamento ? `(Cód: ${m.codigo_pagamento})` : ''}</td>
          <td>R$ ${Number(m.valor).toFixed(2)}</td>
        </tr>
      `
    }).join("")

    const w = window.open("", "", "width=800,height=800")
    w?.document.write(`
      <html>
      <head>
        <title>Relatório de Operações</title>
        <style>
          @page { size: A4; margin: 15mm; }
          body { font-family: Arial, sans-serif; color: #333; }
          .header { text-align: center; border-bottom: 2px solid #cc0000; padding-bottom: 10px; margin-bottom: 20px; }
          .header h1 { color: #cc0000; margin: 0; }
          .info { margin-bottom: 20px; background: #f9f9f9; padding: 10px; border-radius: 5px; }
          .info p { margin: 5px 0; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th { background: #cc0000; color: white; padding: 8px; text-align: left; font-size: 12px;}
          td { border-bottom: 1px solid #ddd; padding: 8px; font-size: 12px; }
          .resumo { display: flex; justify-content: space-between; background: #eee; padding: 15px; border-radius: 5px; font-weight: bold; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #888; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>CT OKINAWA</h1>
          <p>Relatório de Fechamento de Turno / Operador</p>
        </div>
        <div class="info">
          <p><b>Operador de Abertura:</b> ${turno.usuario} (Cód: ${turno.codigo_abertura})</p>
          ${turno.operador_fechamento ? `<p><b>Operador de Fechamento:</b> ${turno.operador_fechamento} (Cód: ${turno.codigo_fechamento})</p>` : ''}
          <p><b>Abertura:</b> ${new Date(turno.aberto_em).toLocaleString('pt-BR')}</p>
          ${turno.fechado_em ? `<p><b>Fechamento:</b> ${new Date(turno.fechado_em).toLocaleString('pt-BR')}</p>` : '<p><b>Status:</b> Caixa Aberto no momento</p>'}
        </div>
        <table>
          <thead><tr><th>Hora</th><th>Tipo</th><th>Descrição/Aluno</th><th>Pgto/Cód</th><th>Valor</th></tr></thead>
          <tbody>${linhas}</tbody>
        </table>
        <div class="resumo">
          <div>Dinheiro: R$ ${totalDinheiro.toFixed(2)}</div>
          <div>Pix: R$ ${totalPix.toFixed(2)}</div>
          <div>Cartão: R$ ${totalCartao.toFixed(2)}</div>
          <div>TOTAL: R$ ${totalGeral.toFixed(2)}</div>
        </div>
        <div class="footer">
          Relatório gerado em ${new Date().toLocaleString('pt-BR')}<br/>
          "Confie no Senhor de todo o seu coração" - Provérbios 3:5
        </div>
        <script>window.onload = () => { setTimeout(() => { window.print(); setTimeout(() => window.close(), 500); }, 300); }</script>
      </body>
      </html>
    `)
    w?.document.close()
  }

  return (
    <AdminGuard>
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="text-red-600" /> Operadores de Caixa
          </h1>
          <div className="flex bg-gray-200 rounded-lg p-1">
            <button onClick={() => setAba("gerenciar")} className={`px-4 py-2 rounded-md text-sm font-semibold transition ${aba === "gerenciar" ? "bg-white text-red-600 shadow" : "text-gray-600"}`}>Gerenciar Operadores</button>
            <button onClick={() => setAba("relatorio")} className={`px-4 py-2 rounded-md text-sm font-semibold transition ${aba === "relatorio" ? "bg-white text-red-600 shadow" : "text-gray-600"}`}>Relatório de Operações</button>
          </div>
        </div>

        {aba === "gerenciar" && (
          <>
            {/* FORMULÁRIO DE OPERADOR */}
            <div className="bg-white p-6 rounded-xl shadow mb-6">
              <h2 className="font-semibold text-lg mb-3">{editandoId ? "Editar Operador" : "Novo Operador"}</h2>
              <div className="grid md:grid-cols-2 gap-3">
                <input className="p-2 border rounded" placeholder="Nome do operador" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
                <input className="p-2 border rounded" placeholder="Código numérico (ex: 1234)" value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} />
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={salvarOperador} disabled={salvando} className="bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50">
                  {salvando ? "Salvando..." : editandoId ? "Salvar Alterações" : "Cadastrar"}
                </button>
                {editandoId && <button onClick={cancelarEdicao} className="bg-gray-300 px-4 py-2 rounded">Cancelar</button>}
              </div>
            </div>

            {/* LISTA DE OPERADORES */}
            <div className="bg-white rounded-xl shadow overflow-hidden">
              {loadingOp ? (
                <div className="p-6 text-center">Carregando...</div>
              ) : operadores.length === 0 ? (
                <div className="p-6 text-center text-gray-500">Nenhum operador cadastrado.</div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr><th className="p-3 text-left">Nome</th><th className="p-3 text-left">Código</th><th className="p-3 text-left">Status</th><th className="p-3 text-left">Ações</th></tr>
                  </thead>
                  <tbody>
                    {operadores.map((op) => (
                      <tr key={op.id} className="border-t">
                        <td className="p-3">{op.nome}</td>
                        <td className="p-3">{op.codigo}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-xs ${op.ativo ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                            {op.ativo ? "Ativo" : "Inativo"}
                          </span>
                        </td>
                        <td className="p-3 flex gap-2">
                          <button onClick={() => editarOperador(op)} className="bg-blue-500 text-white px-3 py-1 rounded text-sm">Editar</button>
                          <button onClick={() => alternarAtivo(op)} className={`px-3 py-1 rounded text-sm text-white ${op.ativo ? "bg-yellow-500" : "bg-green-500"}`}>
                            {op.ativo ? "Inativar" : "Ativar"}
                          </button>
                          <button onClick={() => excluirOperador(op.id)} className="bg-red-600 text-white px-3 py-1 rounded text-sm">Excluir</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {aba === "relatorio" && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-xl shadow flex items-center gap-4">
              <label className="font-semibold">Filtrar por data de abertura:</label>
              <input type="date" className="p-2 border rounded" value={dataFiltro} onChange={e => setDataFiltro(e.target.value)} />
              <button onClick={carregarTurnos} className="bg-gray-800 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-gray-900">
                <Search size={18} /> Buscar Turnos
              </button>
            </div>

            {loadingTurnos ? (
              <div className="text-center p-6">Buscando turnos...</div>
            ) : turnos.length === 0 ? (
              <div className="bg-white p-6 text-center text-gray-500 rounded-xl shadow">Nenhum turno registrado nesta data.</div>
            ) : (
              <div className="bg-white rounded-xl shadow overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr><th className="p-3 text-left">Operador</th><th className="p-3 text-left">Abertura</th><th className="p-3 text-left">Fechamento</th><th className="p-3 text-left">Status</th><th className="p-3 text-left">Ações</th></tr>
                  </thead>
                  <tbody>
                    {turnos.map(t => (
                      <tr key={t.id} className="border-t">
                        <td className="p-3 font-semibold">{t.usuario}</td>
                        <td className="p-3">{new Date(t.aberto_em).toLocaleTimeString('pt-BR')}</td>
                        <td className="p-3">{t.fechado_em ? new Date(t.fechado_em).toLocaleTimeString('pt-BR') : "Em aberto"}</td>
                        <td className="p-3">
                           <span className={`px-2 py-1 rounded text-xs ${t.status === 'aberto' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'}`}>{t.status}</span>
                        </td>
                        <td className="p-3">
                          <button onClick={() => verDetalhesTurno(t)} className="bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm font-semibold flex items-center gap-1 hover:bg-blue-200">
                            <Eye size={14} /> Ver Detalhes
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {turnoSelecionado && (
              <div className="bg-white p-6 rounded-xl shadow border-t-4 border-red-600">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold">Detalhes do Turno - {turnoSelecionado.usuario}</h3>
                  <div className="flex gap-2">
                    <button onClick={() => imprimirRelatorioTurno(turnoSelecionado, movimentacoesTurno)} className="bg-gray-800 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-gray-900">
                      <Printer size={18} /> Imprimir Relatório
                    </button>
                    <button onClick={() => setTurnoSelecionado(null)} className="text-gray-500 hover:text-red-500"><X size={24} /></button>
                  </div>
                </div>

                {loadingMovs ? (
                  <p>Carregando movimentações...</p>
                ) : movimentacoesTurno.length === 0 ? (
                  <p className="text-gray-500">Nenhuma movimentação registrada neste turno.</p>
                ) : (
                  <div className="overflow-auto max-h-96">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr><th className="p-2 text-left">Hora</th><th className="p-2 text-left">Tipo</th><th className="p-2 text-left">Descrição</th><th className="p-2 text-left">Pgto/Cód</th><th className="p-2 text-left">Valor</th></tr>
                      </thead>
                      <tbody>
                        {movimentacoesTurno.map(m => (
                          <tr key={m.id} className="border-b">
                            <td className="p-2">{new Date(m.data).toLocaleTimeString('pt-BR')}</td>
                            <td className="p-2 capitalize">{m.tipo}</td>
                            <td className="p-2">{m.nome || m.descricao || "-"}</td>
                            <td className="p-2">{m.forma_pagamento} {m.codigo_pagamento ? `(Cód: ${m.codigo_pagamento})` : ''}</td>
                            <td className="p-2 font-bold text-red-600">R$ {Number(m.valor).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </AdminGuard>
  )
}