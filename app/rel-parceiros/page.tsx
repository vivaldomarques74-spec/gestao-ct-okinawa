"use client"

import { useEffect, useMemo, useState } from "react"

export default function RelParceirosPage() {

  const get = (k: string) => {
    const data =
      localStorage.getItem(k) ||
      localStorage.getItem("ct_okinawa_" + k)

    return JSON.parse(data || "[]")
  }

  const [vendas, setVendas] = useState<any[]>([])

  useEffect(() => {
    setVendas(get("vendas") || [])
  }, [])

  const porParceiro = useMemo(() => {

    const mapa:any = {}

    vendas.forEach(v => {

      if (!mapa[v.parceiro]) {
        mapa[v.parceiro] = {
          parceiro: v.parceiro,
          total: 0,
          quantidade: 0
        }
      }

      mapa[v.parceiro].total += Number(v.total || 0)
      mapa[v.parceiro].quantidade += Number(v.quantidade || 1)

    })

    return Object.values(mapa)

  }, [vendas])

  const imprimir = () => {

    const conteudo = document.getElementById("print")?.innerHTML
    if (!conteudo) return

    const win = window.open("", "", "width=800,height=600")

    win?.document.write(`
      <html>
        <head>
          <style>
            body{font-family:Arial;padding:20px}
            h1{text-align:center}
          </style>
        </head>
        <body>${conteudo}</body>
      </html>
    `)

    win?.document.close()
    win?.print()
  }

  return (
    <div style={{ maxWidth:1200, margin:"0 auto", padding:30 }}>

      <h1>Relatório Parceiros</h1>

      <button onClick={imprimir}>🖨️ Imprimir</button>

      <div id="print">

        {porParceiro.map((p:any)=>(
          <div key={p.parceiro} style={{marginTop:20}}>

            <h2>{p.parceiro}</h2>

            <div>Total: R$ {p.total.toFixed(2)}</div>
            <div>Quantidade: {p.quantidade}</div>

            <hr/>

          </div>
        ))}

      </div>

    </div>
  )
}