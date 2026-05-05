"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import AdminGuard from "../../components/AdminGuard"

type Produto = {
  id: string
  nome: string
  estoque: number
  custo: number
}

type Movimentacao = {
  id: string
  produto_id: string
  produto_nome: string
  tipo: "entrada" | "saida"
  quantidade: number
  custo_unitario: number
  observacao: string
  created_at: string
}

export default function EstoquePage() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [produtoSelecionado, setProdutoSelecionado] = useState("")
  const [quantidade, setQuantidade] = useState("")
  const [custoUnitario, setCustoUnitario] = useState("")
  const [observacao, setObservacao] = useState("")
  const [loading, setLoading] = useState(false)
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([])
  const [carregandoMov, setCarregandoMov] = useState(false)

  useEffect(() => {
    carregarProdutos()
    carregarMovimentacoes()
  }, [])

  async function carregarProdutos() {
    const { data } = await supabase
      .from("produtos")
      .select("id, nome, estoque, custo")
      .eq("status", "ativo")
      .order("nome")
    setProdutos(data || [])
  }

  async function carregarMovimentacoes() {
    setCarregandoMov(true)
    const { data } = await supabase
      .from("estoque_movimentacoes")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50)
    setMovimentacoes(data || [])
    setCarregandoMov(false)
  }

  async function registrarEntrada() {
    if (!produtoSelecionado) {
      alert("Selecione um produto")
      return
    }
    const qtd = Number(quantidade)
    if (isNaN(qtd) || qtd <= 0) {
      alert("Quantidade inválida")
      return
    }
    const custo = Number(custoUnitario)
    if (isNaN(custo) || custo < 0) {
      alert("Custo unitário inválido (use 0 se não quiser alterar)")
      return
    }

    setLoading(true)

    // 1. Buscar produto atual
    const produto = produtos.find(p => p.id === produtoSelecionado)
    if (!produto) {
      alert("Produto não encontrado")
      setLoading(false)
      return
    }

    // 2. Atualizar estoque e (opcional) custo
    const novoEstoque = produto.estoque + qtd
    const updateData: any = { estoque: novoEstoque }
    if (custo > 0) {
      updateData.custo = custo
    }

    const { error: updateError } = await supabase
      .from("produtos")
      .update(updateData)
      .eq("id", produtoSelecionado)

    if (updateError) {
      alert("Erro ao atualizar estoque: " + updateError.message)
      setLoading(false)
      return
    }

    // 3. Registrar movimentação
    const { error: movError } = await supabase
      .from("estoque_movimentacoes")
      .insert([{
        produto_id: produtoSelecionado,
        produto_nome: produto.nome,
        tipo: "entrada",
        quantidade: qtd,
        custo_unitario: custo > 0 ? custo : produto.custo,
        observacao: observacao || "Entrada de estoque"
      }])

    if (movError) {
      alert("Erro ao registrar movimentação: " + movError.message)
    } else {
      alert("Entrada de estoque registrada com sucesso!")
      setQuantidade("")
      setCustoUnitario("")
      setObservacao("")
      setProdutoSelecionado("")
      await carregarProdutos()
      await carregarMovimentacoes()
    }
    setLoading(false)
  }

  return (
    <AdminGuard>
      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Entrada de Estoque</h1>

        {/* Formulário de entrada */}
        <div className="bg-white p-6 rounded-xl shadow mb-8">
          <h2 className="text-xl font-semibold mb-4">Registrar Entrada</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <select
              className="p-2 border rounded"
              value={produtoSelecionado}
              onChange={e => setProdutoSelecionado(e.target.value)}
            >
              <option value="">Selecione o produto</option>
              {produtos.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nome} (estoque atual: {p.estoque})
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Quantidade"
              className="p-2 border rounded"
              value={quantidade}
              onChange={e => setQuantidade(e.target.value)}
            />
            <input
              type="number"
              step="0.01"
              placeholder="Custo unitário (opcional)"
              className="p-2 border rounded"
              value={custoUnitario}
              onChange={e => setCustoUnitario(e.target.value)}
            />
            <input
              type="text"
              placeholder="Observação (motivo)"
              className="p-2 border rounded"
              value={observacao}
              onChange={e => setObservacao(e.target.value)}
            />
          </div>
          <button
            onClick={registrarEntrada}
            disabled={loading}
            className="mt-4 bg-red-600 text-white px-6 py-2 rounded disabled:opacity-50"
          >
            {loading ? "Processando..." : "Registrar Entrada"}
          </button>
          <p className="text-xs text-gray-500 mt-2">
            * O campo custo, se preenchido, atualizará o custo do produto para futuras vendas.
          </p>
        </div>

        {/* Histórico de movimentações */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <h2 className="text-xl font-semibold p-4 border-b">Últimas Movimentações</h2>
          {carregandoMov ? (
            <div className="p-6 text-center">Carregando...</div>
          ) : movimentacoes.length === 0 ? (
            <div className="p-6 text-center text-gray-500">Nenhuma movimentação registrada.</div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3 text-left">Data</th>
                    <th className="p-3 text-left">Produto</th>
                    <th className="p-3 text-left">Tipo</th>
                    <th className="p-3 text-left">Quantidade</th>
                    <th className="p-3 text-left">Custo Unit.</th>
                    <th className="p-3 text-left">Observação</th>
                  </tr>
                </thead>
                <tbody>
                  {movimentacoes.map(mov => (
                    <tr key={mov.id} className="border-t">
                      <td className="p-3">{new Date(mov.created_at).toLocaleString()}</td>
                      <td className="p-3">{mov.produto_nome}</td>
                      <td className="p-3 capitalize">{mov.tipo}</td>
                      <td className="p-3">{mov.quantidade}</td>
                      <td className="p-3">R$ {mov.custo_unitario.toFixed(2)}</td>
                      <td className="p-3">{mov.observacao || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminGuard>
  )
}