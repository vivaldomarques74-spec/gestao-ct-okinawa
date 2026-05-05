"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"

export default function ImprimirRecibos() {
  const [recibos, setRecibos] = useState<any[]>([])
  const [filtro, setFiltro] = useState("todos")
  const [data, setData] = useState("")

  useEffect(() => {
    carregarRecibos()
  }, [filtro, data])

  async function carregarRecibos() {
    let query = supabase
      .from("caixa")
      .select("*, alunos(nome, cpf)")
      .order("data", { ascending: false })

    if (data) {
      const inicio = new Date(data)
      inicio.setHours(0,0,0,0)
      const fim = new Date(data)
      fim.setHours(23,59,59,999)
      query = query.gte("data", inicio.toISOString()).lte("data", fim.toISOString())
    }

    const { data: movs } = await query
    if (!movs) return

    // Filtrar por tipo
    let lista = movs
    if (filtro !== "todos") lista = movs.filter(m => m.tipo === filtro)

    // Transformar em recibos (simular HTML)
    const recibosFormatados = lista.map(mov => ({
      id: mov.id,
      tipo: mov.tipo,
      nome: mov.alunos?.nome || mov.descricao || "Venda",
      valor: mov.valor,
      data: mov.data,
      html: gerarHTMLRecibo(mov)
    }))
    setRecibos(recibosFormatados)
  }

  function gerarHTMLRecibo(mov: any) {
    // Reuso da função de recibo já existente (simplificado)
    return `
      <html>
      <body style="font-family:monospace;padding:20px">
        <h2>CT OKINAWA</h2>
        <p>${mov.tipo.toUpperCase()}</p>
        <p>Valor: R$ ${Number(mov.valor).toFixed(2)}</p>
        <p>Data: ${new Date(mov.data).toLocaleString()}</p>
        <hr/>
        <p>Provérbios 3:5</p>
      </body>
      </html>
    `
  }

  function imprimir(html: string) {
    const w = window.open("", "", "width=500,height=700")
    w?.document.write(html)
    w?.document.close()
  }

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded-xl shadow">
      <h1 className="text-2xl font-bold mb-6">Reimpressão de Recibos</h1>
      <div className="flex gap-3 mb-4 flex-wrap">
        <select className="p-2 border rounded" value={filtro} onChange={e => setFiltro(e.target.value)}>
          <option value="todos">Todos</option>
          <option value="matricula">Matrícula</option>
          <option value="mensalidade">Mensalidade</option>
          <option value="venda">Venda</option>
        </select>
        <input type="date" className="p-2 border rounded" value={data} onChange={e => setData(e.target.value)} />
        <button onClick={() => { setData(""); carregarRecibos(); }} className="bg-gray-300 p-2 rounded">Limpar data</button>
      </div>
      <div className="overflow-auto">
        {recibos.map(rec => (
          <div key={rec.id} className="border-b py-2 flex justify-between items-center">
            <div>
              <p className="font-semibold">{new Date(rec.data).toLocaleString()} - {rec.tipo}</p>
              <p>{rec.nome} - R$ {Number(rec.valor).toFixed(2)}</p>
            </div>
            <button onClick={() => imprimir(rec.html)} className="bg-red-600 text-white px-3 py-1 rounded">Imprimir</button>
          </div>
        ))}
      </div>
    </div>
  )
}