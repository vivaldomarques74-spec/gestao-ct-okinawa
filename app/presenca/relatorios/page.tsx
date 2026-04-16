"use client"

import { useEffect, useState } from "react"

export default function RelatorioPresenca() {

  const get = (k: string) => {
    try {
      const raw =
        localStorage.getItem("ct_okinawa_" + k) ||
        localStorage.getItem(k)

      if (!raw) return []

      return JSON.parse(raw)
    } catch {
      return []
    }
  }

  const [presencas, setPresencas] = useState<any[]>([])
  const [turmas, setTurmas] = useState<any[]>([])

  const [turmaFiltro, setTurmaFiltro] = useState("")
  const [dataFiltro, setDataFiltro] = useState("")

  useEffect(() => {
    setPresencas(get("presencas"))
    setTurmas(get("turmas"))
  }, [])

  const filtradas = presencas.filter(p => {
    if (turmaFiltro && p.turma !== turmaFiltro) return false
    if (dataFiltro && p.data !== new Date(dataFiltro).toLocaleDateString()) return false
    return true
  })

  const imprimir = (registro:any) => {

    const w = window.open("", "", "width=800,height=600")

    w?.document.write(`
      <html>
      <body style="font-family:Arial;padding:20px">

      <h2 style="text-align:center">RELATÓRIO DE PRESENÇA</h2>

      <div><b>Turma:</b> ${registro.turma}</div>
      <div><b>Data:</b> ${registro.data}</div>

      <hr/>

      ${registro.lista.map((a:any)=>`
        <div style="display:flex;justify-content:space-between;border-bottom:1px solid #eee;padding:6px 0">
          <span>${a.nome}</span>
          <span>${a.presente ? "Presente" : "Falta"}</span>
        </div>
      `).join("")}

      <script>
        window.onload = () => {
          setTimeout(()=>{window.print();window.close()},300)
        }
      </script>

      </body>
      </html>
    `)

    w?.document.close()
  }

  return (
    <div style={{maxWidth:1000, margin:"0 auto", padding:30}}>

      <style>{`
        .card{background:#fff;padding:20px;border-radius:16px;margin-bottom:20px}
        .input{width:100%;padding:12px;margin-bottom:12px;border-radius:10px;border:1px solid #ddd}
        .registro{padding:15px;border-bottom:1px solid #eee}
        .btn{padding:10px 14px;background:#111;color:#fff;border:none;border-radius:10px}
      `}</style>

      <h1>Relatório de Presenças</h1>

      <div className="card">
        <select className="input" onChange={e=>setTurmaFiltro(e.target.value)}>
          <option value="">Todas as turmas</option>
          {turmas.map((t:any)=>(
            <option key={t.id}>{t.nome}</option>
          ))}
        </select>

        <input
          type="date"
          className="input"
          onChange={e=>setDataFiltro(e.target.value)}
        />
      </div>

      <div className="card">

        {filtradas.length === 0 && <div>Nenhuma presença encontrada</div>}

        {filtradas.map((p:any)=>(
          <div key={p.id} className="registro">

            <div><b>Turma:</b> {p.turma}</div>
            <div><b>Data:</b> {p.data}</div>

            <button className="btn" onClick={()=>imprimir(p)}>
              Imprimir
            </button>

          </div>
        ))}

      </div>

    </div>
  )
}