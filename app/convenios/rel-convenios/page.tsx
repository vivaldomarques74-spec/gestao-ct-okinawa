"use client"

import { useEffect, useMemo, useState } from "react"

export default function RelDescontosPage() {

  const get = (k: string) => {
    const data =
      localStorage.getItem(k) ||
      localStorage.getItem("ct_okinawa_" + k)

    return JSON.parse(data || "[]")
  }

  const [alunos, setAlunos] = useState<any[]>([])
  const [busca, setBusca] = useState("")

  useEffect(() => {
    setAlunos(get("alunos"))
  }, [])

  const porConvenio = useMemo(() => {

    const mapa:any = {}

    alunos.forEach(a => {

      const convenio = a.convenio?.trim() || "Sem convênio"

      if (!mapa[convenio]) {
        mapa[convenio] = {
          nome: convenio,
          alunos: [],
          totalBruto: 0,
          totalDesconto: 0,
          totalLiquido: 0
        }
      }

      const valor = Number(a.valor || 0)
      const desconto = Number(a.desconto || 0)
      const liquido = valor - desconto

      mapa[convenio].alunos.push(a)
      mapa[convenio].totalBruto += valor
      mapa[convenio].totalDesconto += desconto
      mapa[convenio].totalLiquido += liquido

    })

    return Object.values(mapa)

  }, [alunos])

  const listaFiltrada = porConvenio.filter((c:any) =>
    c.nome.toLowerCase().includes(busca.toLowerCase())
  )

  const imprimir = () => {

    const conteudo = document.getElementById("print")?.innerHTML
    if (!conteudo) return

    const win = window.open("", "", "width=800,height=600")

    win?.document.write(`
      <html>
        <head>
          <style>
            body{font-family:Arial;padding:30px}
            h1{text-align:center}
            .aluno{font-size:13px;margin-left:10px}
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

      <h1>Relatório de Convênios</h1>

      <input
        placeholder="Buscar convênio"
        value={busca}
        onChange={e=>setBusca(e.target.value)}
      />

      <button onClick={imprimir}>🖨️ Imprimir</button>

      <div id="print">

        {listaFiltrada.map((c:any)=>(
          <div key={c.nome} style={{marginTop:30}}>

            <h2>{c.nome}</h2>

            <div>👥 Alunos: {c.alunos.length}</div>
            <div>💰 Bruto: R$ {c.totalBruto.toFixed(2)}</div>
            <div>🎯 Desconto: R$ {c.totalDesconto.toFixed(2)}</div>
            <div>💵 Líquido: R$ {c.totalLiquido.toFixed(2)}</div>

            <h3 style={{marginTop:10}}>Alunos</h3>

            {c.alunos.map((a:any,i:number)=>(
              <div key={i} className="aluno">
                {a.nome} - R$ {(a.valor - a.desconto).toFixed(2)}
              </div>
            ))}

            <hr/>

          </div>
        ))}

      </div>

    </div>
  )
}