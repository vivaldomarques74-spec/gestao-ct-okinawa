"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"

export default function PDV() {
  const [produtos, setProdutos] = useState<any[]>([])
  const [carrinho, setCarrinho] = useState<any[]>([])
  const [formaPagamento, setFormaPagamento] = useState("Pix")
  const [tipoCartao, setTipoCartao] = useState("Crédito")
  const [parcelas, setParcelas] = useState("1x")
  const [salvando, setSalvando] = useState(false)
  const [caixaAberto, setCaixaAberto] = useState<any>(null)

  // Taxas Ton (a partir da tabela)
  const taxasCartao: Record<string, number> = {
    debito: 1.25,
    credito1: 3.05,
    credito2: 6.59,
    credito3: 8.19,
    credito4: 8.89,
    credito5: 9.76,
    credito6: 11.10,
    credito7: 11.68,
    credito8: 11.73,
    credito9: 11.78,
    credito10: 11.83,
    credito11: 11.88,
    credito12: 11.95,
    credito13: 12.59,
    credito14: 13.23,
    credito15: 13.87,
    credito16: 14.51,
    credito17: 15.15,
    credito18: 15.79,
  }

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

  function calcularTotal() {
    let total = totalBase
    if (formaPagamento === "Cartão") {
      if (tipoCartao === "Débito") {
        total = totalBase * (1 + taxasCartao.debito / 100)
      } else if (tipoCartao === "Crédito") {
        const num = parseInt(parcelas.replace("x", ""))
        const chave = `credito${num}` as keyof typeof taxasCartao
        const taxa = taxasCartao[chave] || 0
        total = totalBase * (1 + taxa / 100)
      }
    }
    return Number(total.toFixed(2))
  }

  const totalFinal = calcularTotal()

  async function finalizar() {
    if (carrinho.length === 0) return alert("Adicione produtos")
    if (!caixaAberto) return alert("Caixa não está aberto")

    setSalvando(true)
    const nomes = carrinho.map(p => p.nome).join(", ")
    const parceiroId = carrinho.find(p => p.tipo === "parceiro")?.parceiro_id || null

    // Registrar venda no caixa
    const { error } = await supabase.from("caixa").insert([{
      caixa_turno_id: caixaAberto.id,
      tipo: "venda",
      descricao: nomes,
      valor: totalFinal,
      valor_base: totalBase,
      forma_pagamento: formaPagamento,
      tipo_cartao: formaPagamento === "Cartão" ? tipoCartao : null,
      parcelas: formaPagamento === "Cartão" && tipoCartao === "Crédito" ? parcelas : null,
      parceiro_id: parceiroId,
      data: new Date().toISOString(),
      cancelado: false,
    }])

    if (error) {
      alert(error.message)
      setSalvando(false)
      return
    }

    // Atualizar estoque
    for (const item of carrinho) {
      const novoEstoque = Number(item.estoque) - 1
      await supabase.from("produtos").update({ estoque: novoEstoque }).eq("id", item.id)
    }

    gerarRecibo()
    setCarrinho([])
    await carregarProdutos()
    alert("Venda finalizada!")
    setSalvando(false)
  }

  function gerarRecibo() {
    const itens = carrinho.map(item => `${item.nome} .... R$ ${Number(item.preco).toFixed(2)}`).join("<br/>")
    const taxa = totalFinal - totalBase
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
        <div><b>RECIBO DE VENDA - PDV</b></div>
        <hr/>
        ${itens}
        <hr/>
        <div>Subtotal: R$ ${totalBase.toFixed(2)}</div>
        <div>Taxa: R$ ${taxa.toFixed(2)}</div>
        <div class="total"><b>TOTAL: R$ ${totalFinal.toFixed(2)}</b></div>
        <div>Pagamento: ${formaPagamento} ${formaPagamento === "Cartão" ? `- ${tipoCartao} ${parcelas}` : ""}</div>
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
      <div className="bg-gray-100 p-3 rounded">
        <p>Base: R$ {totalBase.toFixed(2)}</p>
        <p className="font-bold text-lg">Total: R$ {totalFinal.toFixed(2)}</p>
      </div>
      <select className="w-full p-2 border rounded mt-2" value={formaPagamento} onChange={e => setFormaPagamento(e.target.value)}>
        <option>Pix</option><option>Dinheiro</option><option>Cartão</option>
      </select>
      {formaPagamento === "Cartão" && (
        <>
          <select className="w-full p-2 border rounded mt-2" value={tipoCartao} onChange={e => setTipoCartao(e.target.value)}>
            <option>Débito</option><option>Crédito</option>
          </select>
          {tipoCartao === "Crédito" && (
            <select className="w-full p-2 border rounded mt-2" value={parcelas} onChange={e => setParcelas(e.target.value)}>
              {Array.from({ length: 18 }, (_, i) => i + 1).map(n => (
                <option key={n} value={`${n}x`}>{n}x</option>
              ))}
            </select>
          )}
        </>
      )}
      <button onClick={finalizar} disabled={salvando || !caixaAberto} className="w-full bg-red-600 text-white p-2 rounded mt-3 disabled:opacity-50">
        {salvando ? "Finalizando..." : "Finalizar Venda"}
      </button>
    </div>
  )
}