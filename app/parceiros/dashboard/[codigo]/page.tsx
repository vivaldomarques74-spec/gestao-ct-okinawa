"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../../../lib/supabase"
import { useParams } from "next/navigation"

type Produto = {
  id: string
  nome: string
  preco: number
  estoque: number
  status: string
}

type Venda = {
  id: string
  data: string
  valor: number
  forma_pagamento: string
  produto_nome: string
}

export default function ParceiroDashboard() {
  const { codigo } = useParams()
  const [parceiro, setParceiro] = useState<any>(null)
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [vendas, setVendas] = useState<Venda[]>([])
  const [loading, setLoading] = useState(true)
  const [totalVendas, setTotalVendas] = useState(0)
  const [totalDinheiro, setTotalDinheiro] = useState(0)
  const [totalPix, setTotalPix] = useState(0)
  const [totalCartao, setTotalCartao] = useState(0)
  const [periodo, setPeriodo] = useState("mes")

  useEffect(() => {
    if (codigo) carregarParceiro()
  }, [codigo])

  useEffect(() => {
    if (parceiro) {
      carregarProdutos()
      carregarVendas()
    }
  }, [parceiro, periodo])

  async function carregarParceiro() {
    const { data } = await supabase
      .from("parceiros")
      .select("*")
      .eq("codigo_acesso", codigo)
      .single()

    if (!data) {
      alert("Parceiro não encontrado")
      return
    }
    setParceiro(data)
    setLoading(false)
  }

  async function carregarProdutos() {
    const { data } = await supabase
      .from("produtos")
      .select("*")
      .eq("parceiro_id", parceiro.id)
      .order("nome")
    setProdutos(data || [])
  }

  async function carregarVendas() {
    let query = supabase
      .from("caixa")
      .select("*, produtos(nome)")
      .eq("tipo", "venda")
      .eq("parceiro_id", parceiro.id)
      .eq("cancelado", false)

    const agora = new Date()
    if (periodo === "mes") {
      const inicio = new Date(agora.getFullYear(), agora.getMonth(), 1).toISOString()
      query = query.gte("data", inicio)
    } else if (periodo === "ano") {
      const inicio = new Date(agora.getFullYear(), 0, 1).toISOString()
      query = query.gte("data", inicio)
    }

    const { data } = await query.order("data", { ascending: false })
    const vendasList = (data || []).map(v => ({
      id: v.id,
      data: v.data,
      valor: Number(v.valor),
      forma_pagamento: v.forma_pagamento,
      produto_nome: v.produtos?.nome || v.descricao || "Produto"
    }))
    setVendas(vendasList)

    let total = 0, din = 0, pix = 0, cart = 0
    vendasList.forEach(v => {
      total += v.valor
      if (v.forma_pagamento === "Dinheiro") din += v.valor
      else if (v.forma_pagamento === "Pix") pix += v.valor
      else if (v.forma_pagamento === "Cartão") cart += v.valor
    })
    setTotalVendas(total)
    setTotalDinheiro(din)
    setTotalPix(pix)
    setTotalCartao(cart)
  }

  if (loading) return <div className="p-6 text-center">Carregando dados do parceiro...</div>
  if (!parceiro) return <div className="p-6 text-center">Parceiro não encontrado ou link inválido.</div>

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h1 className="text-2xl font-bold text-red-600">CT OKINAWA</h1>
        <h2 className="text-xl">Painel do Parceiro: {parceiro.nome}</h2>
        <p className="text-sm text-gray-500">Código: {parceiro.codigo_acesso}</p>
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow">
          <p className="text-gray-500 text-sm">Total Vendas</p>
          <p className="text-2xl font-bold">R$ {totalVendas.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow">
          <p className="text-gray-500 text-sm">Dinheiro</p>
          <p className="text-2xl font-bold text-green-600">R$ {totalDinheiro.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow">
          <p className="text-gray-500 text-sm">Pix</p>
          <p className="text-2xl font-bold text-blue-600">R$ {totalPix.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow">
          <p className="text-gray-500 text-sm">Cartão</p>
          <p className="text-2xl font-bold text-purple-600">R$ {totalCartao.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow mb-6">
        <div className="flex gap-2">
          <button className={`px-3 py-1 rounded ${periodo === "mes" ? "bg-red-600 text-white" : "bg-gray-200"}`} onClick={() => setPeriodo("mes")}>Mês atual</button>
          <button className={`px-3 py-1 rounded ${periodo === "ano" ? "bg-red-600 text-white" : "bg-gray-200"}`} onClick={() => setPeriodo("ano")}>Ano atual</button>
          <button className={`px-3 py-1 rounded ${periodo === "todo" ? "bg-red-600 text-white" : "bg-gray-200"}`} onClick={() => setPeriodo("todo")}>Todo período</button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow mb-6 overflow-hidden">
        <h3 className="font-bold text-lg p-4 border-b">Meus Produtos</h3>
        <div className="overflow-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">Produto</th>
                <th className="p-3 text-left">Preço</th>
                <th className="p-3 text-left">Estoque</th>
                <th className="p-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {produtos.map(p => (
                <tr key={p.id} className="border-t">
                  <td className="p-3">{p.nome}</td>
                  <td className="p-3">R$ {p.preco.toFixed(2)}</td>
                  <td className="p-3">{p.estoque} un</td>
                  <td className="p-3">{p.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <h3 className="font-bold text-lg p-4 border-b">Últimas Vendas</h3>
        <div className="overflow-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">Data</th>
                <th className="p-3 text-left">Produto</th>
                <th className="p-3 text-left">Valor</th>
                <th className="p-3 text-left">Pagamento</th>
              </tr>
            </thead>
            <tbody>
              {vendas.slice(0, 20).map(v => (
                <tr key={v.id} className="border-t">
                  <td className="p-3">{new Date(v.data).toLocaleDateString()}</td>
                  <td className="p-3">{v.produto_nome}</td>
                  <td className="p-3">R$ {v.valor.toFixed(2)}</td>
                  <td className="p-3">{v.forma_pagamento}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}