"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"

export default function ImprimirRecibos() {
  const [lista, setLista] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    carregar()
  }, [])

  async function carregar() {
    setLoading(true)
    const tresDiasAtras = new Date()
    tresDiasAtras.setDate(tresDiasAtras.getDate() - 3)

    const { data } = await supabase
      .from("caixa")
      .select("*, alunos(nome, cpf)")
      .eq("cancelado", false)
      .gte("data", tresDiasAtras.toISOString())
      .order("data", { ascending: false })

    setLista(data || [])
    setLoading(false)
  }

  function reimprimir(mov: any) {
    const alunoNome = mov.alunos?.nome || mov.nome || "Aluno"
    const alunoCpf = mov.alunos?.cpf || "---"
    const tipo = mov.tipo === "matricula" ? "MATRÍCULA" : mov.tipo === "mensalidade" ? "MENSALIDADE" : "VENDA PDV"
    
    const w = window.open("", "", "width=400,height=650")
    w?.document.write(`
      <html>
      <head>
        <title>Recibo ${tipo}</title>
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
        <div class="center"><b>RECIBO DE ${tipo}</b></div>
        <hr/>
        <div><b>Aluno:</b> ${alunoNome}</div>
        <div><b>CPF:</b> ${alunoCpf}</div>
        <div><b>Descrição:</b> ${mov.descricao || "Pagamento"}</div>
        <hr/>
        <div><b>Valor:</b> R$ ${Number(mov.valor).toFixed(2)}</div>
        <div><b>Pagamento:</b> ${mov.forma_pagamento || "-"}</div>
        <hr/>
        <div><b>Data original:</b> ${new Date(mov.data).toLocaleString()}</div>
        <div class="verse">"Confie no Senhor de todo o seu coração"<br/>Provérbios 3:5</div>
        <div class="center">Reimpressão 🙏</div>
        <script>window.onload = () => { setTimeout(() => { window.print(); setTimeout(() => window.close(), 500); }, 200); }</script>
      </body>
      </html>
    `)
    w?.document.close()
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow">
      <h1 className="text-2xl font-bold mb-6">Reimpressão de Recibos (Últimos 3 dias)</h1>
      {loading ? <p>Carregando...</p> : lista.length === 0 ? <p className="text-gray-500">Nenhum recibo gerado nos últimos 3 dias.</p> : (
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr><th className="p-2 text-left">Data</th><th className="p-2 text-left">Tipo</th><th className="p-2 text-left">Aluno/Descrição</th><th className="p-2 text-left">Valor</th><th className="p-2 text-left">Ação</th></tr>
          </thead>
          <tbody>
            {lista.map(mov => (
              <tr key={mov.id} className="border-t">
                <td className="p-2">{new Date(mov.data).toLocaleString()}</td>
                <td className="p-2 capitalize">{mov.tipo}</td>
                <td className="p-2">{mov.alunos?.nome || mov.nome || mov.descricao || "Venda"}</td>
                <td className="p-2">R$ {Number(mov.valor).toFixed(2)}</td>
                <td className="p-2"><button onClick={() => reimprimir(mov)} className="bg-red-600 text-white px-3 py-1 rounded">Imprimir</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}