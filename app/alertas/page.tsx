"use client"

import { useEffect, useMemo, useState } from "react"

function diferencaEmDias(data: string) {
  if (!data) return 999

  const hoje = new Date()
  const d = new Date(data)

  const diff = d.getTime() - hoje.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export default function AlertasPage() {

  const get = (k: string) => {
    try {
      return JSON.parse(localStorage.getItem(k) || "[]")
    } catch {
      return []
    }
  }

  const set = (k: string, v: any) =>
    localStorage.setItem(k, JSON.stringify(v))

  const [mensalidades, setMensalidades] = useState<any[]>([])
  const [alunos, setAlunos] = useState<any[]>([])

  useEffect(() => {
    setMensalidades(get("ct_okinawa_mensalidades"))
    setAlunos(get("ct_okinawa_alunos"))
  }, [])

  const comDias = useMemo(() => {
    return mensalidades.map(m => ({
      ...m,
      dias: diferencaEmDias(m.vencimento || m.mesReferencia)
    }))
  }, [mensalidades])

  // 🔥 BLOQUEIO AUTOMÁTICO MELHORADO
  useEffect(() => {

    if (alunos.length === 0) return

    const bloqueadosIds = comDias
      .filter(m => m.dias <= -3 && m.status !== "Pago")
      .map(m => m.alunoId)

    const atualizados = alunos.map((a:any) => ({
      ...a,
      status: bloqueadosIds.includes(a.id)
        ? "Bloqueado"
        : "Ativo"
    }))

    set("ct_okinawa_alunos", atualizados)

  }, [comDias, alunos])

  const marcarPago = (id:number) => {

    const lista = mensalidades.map((m:any)=>
      m.id === id ? {...m, status:"Pago"} : m
    )

    set("ct_okinawa_mensalidades", lista)
    setMensalidades(lista)
  }

  const renderLista = (titulo:string, cor:string, lista:any[]) => (
    <div style={{
      background:"#fff",
      padding:20,
      borderRadius:12,
      boxShadow:"0 4px 12px rgba(0,0,0,0.08)"
    }}>

      <h3 style={{marginBottom:15}}>
        {titulo} ({lista.length})
      </h3>

      {lista.length === 0 && (
        <div style={{color:"#888"}}>Nenhum registro</div>
      )}

      {lista.map((m:any)=>(
        <div key={m.id} style={{
          border:"1px solid #eee",
          borderRadius:10,
          padding:12,
          marginBottom:10
        }}>

          <strong>{m.nome}</strong>

          <div style={{fontSize:13,color:"#555"}}>
            {m.modalidade} • {m.turma}
          </div>

          <div style={{marginTop:5}}>
            💰 R$ {m.total}
          </div>

          <div style={{
            color:cor,
            fontWeight:"bold"
          }}>
            {m.dias >= 0
              ? `Vence em ${m.dias} dias`
              : `${Math.abs(m.dias)} dias atrasado`}
          </div>

          {m.status !== "Pago" && (
            <button
              onClick={()=>marcarPago(m.id)}
              style={{
                marginTop:8,
                padding:"6px 10px",
                borderRadius:6,
                border:"none",
                background:"#111",
                color:"#fff",
                cursor:"pointer"
              }}>
              Marcar como pago
            </button>
          )}

        </div>
      ))}

    </div>
  )

  const vence5 = comDias.filter(m => m.dias === 5 && m.status !== "Pago")
  const vence2 = comDias.filter(m => m.dias === 2 && m.status !== "Pago")
  const vencidas = comDias.filter(m => m.dias < 0 && m.status !== "Pago")

  return (
    <div style={{maxWidth:1200,margin:"0 auto",padding:30}}>

      <h1 style={{marginBottom:20}}>🚨 Alertas</h1>

      <div style={{
        display:"grid",
        gridTemplateColumns:"repeat(auto-fit, minmax(300px, 1fr))",
        gap:20
      }}>

        {renderLista("Vence em 5 dias","orange",vence5)}
        {renderLista("Vence em 2 dias","red",vence2)}
        {renderLista("Vencidas","red",vencidas)}

      </div>

    </div>
  )
} 