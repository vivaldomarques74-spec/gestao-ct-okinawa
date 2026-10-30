"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import { calcularPagamento } from "../../lib/pagamentos" // Importando a regra centralizada

export default function PDV() {
  const [produtos, setProdutos] = useState<any[]>([])
  const [carrinho, setCarrinho] = useState<any[]>([])
  const [formaPagamento, setFormaPagamento] = useState("Pix")
  const [tipoCartao, setTipoCartao] = useState("Crédito")
  const [parcelas, setParcelas] = useState("1x")
  const [codigoPagamento, setCodigoPagamento] = useState("")
  const [salvando, setSalvando] = useState(false)
  const [caixaAberto, setCaixaAberto] = useState<any>(null)

  useEffect(() => {
    carregarProdutos()
    verificarCaixa()
  }, [])

  async function verificarCaixa() {
    const { data } = await supabase.from("caixa_turno").select("*").eq("status", "aberto").maybeSingle()
    setCaixaAberto(data)
  }

  async function carregarProdutos() {
    const { data } = await supabase.from("produtos").select("*").eq("status", "ativo").gt("estoque", 0).order("nome")
    setProdutos(data || [])
  }

  function adicionar(produto: any) {
    setCarrinho([...carrinho, produto])
  }

  function remover(index: number) {
    const copia = [...carrinho]
    copia.splice(index, 1)
    setCarrinho(copia)
  }

  const totalBase = carrinho.reduce((acc, item) => acc + Number(item.preco || 0), 0)

  // Usa a função centralizada para calcular
  const resultadoPagamento = calcularPagamento(
    totalBase,
    formaPagamento,
    tipoCartao,
    parcelas,
    formaPagamento === "Pix" || formaPagamento === "Dinheiro" ? 0 : 0 // No PDV o desconto de R$10 é apenas para mensalidades
  )

  const totalFinal = resultadoPagamento.valorFinal
  const taxaCobrada = totalFinal - totalBase

  async function finalizar() {
    if (carrinho.length === 0) return alert("Adicione produtos")
    if (!caixaAberto) return alert("Caixa não está aberto")

    if ((formaPagamento === "Pix" || formaPagamento === "Cartão") && !codigoPagamento.trim()) {
      return alert("⚠️ Por favor, insira o código de autorização da maquininha para finalizar.")
    }

    setSalvando(true)
    const nomes = carrinho.map(p => p.nome).join(", ")
    const parceiroId = carrinho.find(p => p.tipo === "parceiro")?.parceiro_id || null

    const { error } = await supabase.from("caixa").insert([{
      caixa_turno_id: caixaAberto.id,
      tipo: "venda",
      nome: nomes,
      valor: totalFinal, // Valor final com juros
      valor_base: totalBase, // Valor original sem juros
      forma_pagamento: formaPagamento,
      tipo_cartao: formaPagamento === "Cartão" ? tipoCartao : null,
      parcelas: formaPagamento === "Cartão" && tipoCartao === "Crédito" ? parcelas : null,
      codigo_pagamento: codigoPagamento || null,
      parceiro_id: parceiroId,
      data: new Date().toISOString(),
      cancelado: false,
    }])

    if (error) {
      alert(error.message)
      setSalvando(false)
      return
    }

    for (const item of carrinho) {
      const novoEstoque = Number(item.estoque) - 1
      await supabase.from("produtos").update({ estoque: novoEstoque }).eq("id", item.id)
    }

    gerarRecibo()
    setCarrinho([])
    setCodigoPagamento("")
    await carregarProdutos()
    alert("Venda finalizada!")
    setSalvando(false)
  }

  function gerarRecibo() {
    const itens = carrinho.map(item => `${item.nome} .... R$ ${Number(item.preco).toFixed(2)}`).join("<br/>")
    const w = window.open("", "", "width=400,height=600")
    w?.document.write(`
      <html>
      <head>
        <title>Recibo de Venda</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { width: 58mm; margin: 0 auto; padding: 2mm; font-family: monospace; font-size: 10pt; line-height: 1.2; }
          .logo { text-align: center; margin-bottom: 4px; }
          .logo img { max-width: 40mm; height: auto; }
          .titulo { text-align: center; font-weight: bold; font-size: 12pt; margin: 4px 0; }
          hr { border: none; border-top: 1px dashed #000; margin: 4px 0; }
          .total { font-weight: bold; font-size: 11pt; }
          .verse { text-align: center; margin-top: 8px; font-style: italic; }
          .center { text-align: center; }
        </style>
      </head>
      <body>
        <div class="logo"><img src="${window.location.origin}/logo.png" /></div>
        <div class="titulo">CT OKINAWA</div>
        <div class="center">Disciplina • Respeito • Evolução</div>
        <hr/>
        <div class="center"><b>RECIBO DE VENDA - PDV</b></div>
        <hr/>
        ${itens}
        <hr/>
        <div>Subtotal: R$ ${totalBase.toFixed(2)}</div>
        ${taxaCobrada > 0 ? `<div>Juros Parcelamento: R$ ${taxaCobrada.toFixed(2)}</div>` : ''}
        <div class="total"><b>TOTAL: R$ ${totalFinal.toFixed(2)}</b></div>
        <div>Pagamento: ${formaPagamento} ${formaPagamento === "Cartão" ? `- ${tipoCartao} ${parcelas}` : ""}</div>
        ${resultadoPagamento.numParcelas > 1 ? `<div>Parcelas: ${resultadoPagamento.numParcelas}x de R$ ${resultadoPagamento.valorParcela.toFixed(2)}</div>` : ''}
        ${codigoPagamento ? `<div><b>Cód. Autorização:</b> ${codigoPagamento}</div>` : ''}
        <hr/>
        <div>Data: ${new Date().toLocaleString()}</div>
        <div class="verse">"Confie no Senhor"<br/>Provérbios 3:5</div>
        <div class="center">Obrigado pela preferência!</div>
        <script>window.onload = () => { setTimeout(() => { window.print(); setTimeout(() => window.close(), 500); }, 200); }</script>
      </body>
      </html>
    `)
    w?.document.close()
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow">
      <h1 className="text-2xl font-bold mb-4 text-center">PDV - Ponto de Venda</h1>
      {!caixaAberto && <div className="bg-red-100 p-2 mb-4 rounded text-center">⚠️ Caixa fechado. Abra o caixa antes de vender.</div>}
      
      <div className="grid grid-cols-2 gap-2 mb-4">
        {produtos.map(p => (
          <button key={p.id} onClick={() => adicionar(p)} className="bg-gray-100 p-2 rounded border text-left">
            <p className="font-semibold">{p.nome}</p>
            <p className="text-sm">R$ {Number(p.preco).toFixed(2)}</p>
            <p className="text-xs text-gray-500">Estoque: {p.estoque}</p>
          </button>
        ))}
      </div>

      <div className="border p-3 rounded mb-3">
        <h3 className="font-bold">Carrinho</h3>
        {carrinho.map((item, i) => (
          <div key={i} className="flex justify-between border-b py-1">
            <span>{item.nome}</span>
            <button onClick={() => remover(i)} className="text-red-500">❌</button>
          </div>
        ))}
      </div>

      <div className="bg-gray-100 p-3 rounded mb-3">
        <p>Base: R$ {totalBase.toFixed(2)}</p>
        {taxaCobrada > 0 && <p className="text-sm text-red-600">Juros: R$ {taxaCobrada.toFixed(2)}</p>}
        <p className="font-bold text-lg">Total: R$ {totalFinal.toFixed(2)}</p>
        {resultadoPagamento.numParcelas > 1 && (
          <p className="text-sm text-gray-600 font-semibold">ou {resultadoPagamento.numParcelas}x de R$ {resultadoPagamento.valorParcela.toFixed(2)}</p>
        )}
      </div>

      <div className="p-3 bg-gray-50 rounded border mb-3">
        <label className="block font-semibold mb-2">Forma de Pagamento</label>
        <select className="w-full p-2 border rounded mb-2" value={formaPagamento} onChange={e => setFormaPagamento(e.target.value)}>
          <option>Pix</option><option>Dinheiro</option><option>Cartão</option>
        </select>

        {formaPagamento === "Cartão" && (
          <>
            <select className="w-full p-2 border rounded mb-2" value={tipoCartao} onChange={e => setTipoCartao(e.target.value)}>
              <option>Débito</option><option>Crédito</option>
            </select>
            {tipoCartao === "Crédito" && (
              <select className="w-full p-2 border rounded mb-2" value={parcelas} onChange={e => setParcelas(e.target.value)}>
                {Array.from({ length: 21 }, (_, i) => i + 1).map(n => (
                  <option key={n} value={`${n}x`}>{n}x</option>
                ))}
              </select>
            )}
          </>
        )}

        {(formaPagamento === "Pix" || formaPagamento === "Cartão") && (
          <div className="mt-2">
            <label className="block text-sm font-semibold mb-1 text-red-600">Código de Autorização (Maquininha)</label>
            <input 
              className="w-full p-2 border border-red-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500" 
              placeholder="Digite o código do comprovante" 
              value={codigoPagamento} 
              onChange={e => setCodigoPagamento(e.target.value)} 
            />
          </div>
        )}
      </div>

      <button onClick={finalizar} disabled={salvando || !caixaAberto} className="w-full bg-red-600 text-white p-2 rounded mt-3 disabled:opacity-50">
        {salvando ? "Finalizando..." : "Finalizar Venda"}
      </button>
    </div>
  )
}