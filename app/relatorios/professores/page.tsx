"use client"

import { useEffect, useState } from "react"

export default function RelProfessoresPage() {

  const get = (k: string) => {
    const data =
      localStorage.getItem(k) ||
      localStorage.getItem("ct_okinawa_" + k)

    return JSON.parse(data || "[]")
  }

  const [professores, setProfessores] = useState<any[]>([])
  const [turmas, setTurmas] = useState<any[]>([])
  const [alunos, setAlunos] = useState<any[]>([])

  useEffect(() => {
    setProfessores(get("professores"))
    setTurmas(get("turmas"))
    setAlunos(get("alunos"))
  }, [])

  const calcular = (prof:any) => {

    const turmasDoProf = turmas.filter(t => String(t.professorId) === String(prof.id))

    let alunosLista:any[] = []

    turmasDoProf.forEach(t => {
      const alunosTurma = alunos.filter(a => a.turma === t.nome)
      alunosLista.push(...alunosTurma)
    })

    const detalhes = alunosLista.map(a => {

      const valor = Number(a.valor || 0)
      const desconto = Number(a.desconto || 0)
      const liquido = valor - desconto

      const porcentagem = Number(prof.porcentagem || 0)

      const valorProfessor = liquido * (porcentagem / 100)

      return {
        nome: a.nome,
        turma: a.turma,
        liquido,
        valorProfessor
      }
    })

    const totalProfessor = detalhes.reduce((acc, d) => acc + d.valorProfessor, 0)

    return { detalhes, totalProfessor }
  }

  // 🧾 IMPRIMIR
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
            .page{page-break-after:always;margin-bottom:40px}
            .item{margin-bottom:8px}
            .assinatura{
              margin-top:80px;
              text-align:center;
            }
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

      <h1>Relatório Professores</h1>

      <button onClick={imprimir}>🖨️ Imprimir</button>

      <div id="print">

        {professores.map((prof:any)=>{

          const dados = calcular(prof)

          return (
            <div key={prof.id} className="page">

              <h2>{prof.nome}</h2>
              <div>% {prof.porcentagem}</div>

              <hr/>

              {dados.detalhes.map((d:any,i:number)=>(
                <div key={i} className="item">
                  <strong>{d.nome}</strong> - {d.turma}
                  <div>R$ {d.valorProfessor.toFixed(2)}</div>
                </div>
              ))}

              <hr/>

              <h3>
                Total a pagar: R$ {dados.totalProfessor.toFixed(2)}
              </h3>

              {/* ASSINATURA */}
              <div className="assinatura">
                <br/><br/>
                ___________________________<br/>
                Assinatura do Professor
              </div>

            </div>
          )
        })}

      </div>

    </div>
  )
}