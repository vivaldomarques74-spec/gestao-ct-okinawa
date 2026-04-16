"use client"

import { useEffect, useState } from "react"

export default function MensalidadesPage() {

  const getAlunos = () => {
    try {
      return JSON.parse(
        localStorage.getItem("ct_okinawa_alunos") ||
        localStorage.getItem("alunos") ||
        "[]"
      )
    } catch {
      return []
    }
  }

  const set = (k: string, v: any) =>
    localStorage.setItem("ct_okinawa_" + k, JSON.stringify(v))

  const [alunos, setAlunos] = useState<any[]>([])
  const [alunoId, setAlunoId] = useState("")
  const [busca, setBusca] = useState("")
  const [mostrarLista, setMostrarLista] = useState(false)

  const [form, setForm] = useState({
    nome: "",
    matricula: "",
    modalidade: "",
    turma: "",
    valor: 0,
    descontoBase: 0,
    descontoPagamento: 0,
    total: 0,
    mesReferencia: "",
    formaPagamento: "Pix"
  })

  useEffect(() => {

    let lista = getAlunos()

    lista = lista.map((a:any, i:number)=>({
      id: a.id || i + 1,
      nome: a.nome || "Sem nome",
      matricula: a.matricula || "-",
      modalidade: a.modalidade || "-",
      turma: a.turma || "-",
      valorMensalidade: Number(a.valorMensalidade || a.valor || 0),
      desconto: Number(a.desconto || 0),
      ...a
    }))

    setAlunos(lista)

  }, [])

  const alunosFiltrados = alunos.filter(a =>
    a.nome.toLowerCase().includes(busca.toLowerCase())
  )

  useEffect(() => {

    if (!alunoId) return

    const aluno = alunos.find(a => String(a.id) === String(alunoId))
    if (!aluno) return

    const valor = aluno.valorMensalidade || 0
    const descontoBase = aluno.desconto || 0

    let descontoPagamento = 0

    if (form.formaPagamento === "Pix" || form.formaPagamento === "Dinheiro") {
      descontoPagamento = 10
    }

    const total = valor - descontoBase - descontoPagamento

    setForm(prev => ({
      ...prev,
      nome: aluno.nome,
      matricula: aluno.matricula,
      modalidade: aluno.modalidade,
      turma: aluno.turma,
      valor,
      descontoBase,
      descontoPagamento,
      total
    }))

  }, [alunoId, alunos, form.formaPagamento])

  const imprimirRecibo = (r:any) => {

    const w = window.open("", "", "width=800,height=600")

    w?.document.write(`
      <html>
      <body style="font-family:Arial;padding:30px">

      <div style="display:flex;gap:15px;align-items:center">
        <img src="/logo.png" style="width:70px"/>
        <div>
          <h2>CT OKINAWA</h2>
          <h3>Recibo</h3>
        </div>
      </div>

      <hr/>

      <p><b>Mensalidade referente ao mês:</b> ${r.mesReferencia}</p>
      <p><b>Data:</b> ${r.data}</p>
      <p><b>Hora:</b> ${r.hora}</p>

      <hr/>

      <p><b>Aluno:</b> ${r.nome}</p>
      <p><b>Modalidade:</b> ${r.modalidade}</p>
      <p><b>Turma:</b> ${r.turma}</p>

      <hr/>

      <p><b>Plano:</b> R$ ${r.valor}</p>
      <p><b>Desconto matrícula:</b> R$ ${r.descontoBase}</p>
      <p><b>Desconto pagamento:</b> R$ ${r.descontoPagamento}</p>
      <p><b>Total:</b> R$ ${r.total}</p>
      <p><b>Pagamento:</b> ${r.formaPagamento}</p>

      <br/><br/>
      ___________________________<br/>
      Assinatura

      <br/><br/>

      <div style="text-align:center">
        (71) 99372-5936<br/>
        Obrigado! Deus abençoe!!!
      </div>

      <script>
        window.onload = () => setTimeout(()=>window.print(),300)
      </script>

      </body>
      </html>
    `)

    w?.document.close()
  }

  const salvar = () => {

    if (!alunoId) return alert("Selecione o aluno")
    if (!form.mesReferencia) return alert("Informe o mês")

    const agora = new Date()

    const nova = {
      id: Date.now(),
      ...form,
      data: agora.toLocaleDateString(),
      hora: agora.toLocaleTimeString()
    }

    const lista = JSON.parse(localStorage.getItem("ct_okinawa_mensalidades") || "[]")
    set("mensalidades", [...lista, nova])

    // 🔥 NOVO BLOCO (SEM QUEBRAR NADA)
    const pagamentosProf = JSON.parse(localStorage.getItem("ct_okinawa_pagamentos_prof") || "[]")
    const turmas = JSON.parse(localStorage.getItem("ct_okinawa_turmas") || "[]")
    const modalidades = JSON.parse(localStorage.getItem("ct_okinawa_modalidades") || "[]")

    const aluno = alunos.find(a => String(a.id) === String(alunoId))

    const turmasAluno = [
      { modalidade: aluno?.modalidade, turma: aluno?.turma },
      ...(aluno?.turmasSelecionadas || [])
    ]

    turmasAluno.forEach((t:any) => {

      if (!t.turma) return

      const turmaObj = turmas.find((tt:any)=>tt.nome === t.turma)
      const mod = modalidades.find((m:any)=>m.nome === t.modalidade)

      if (turmaObj && turmaObj.professor) {

        const valorBase = Number(mod?.valor || 0)

        const baseReal = valorBase - (form.descontoPagamento || 0)

        const porcentagem = Number(turmaObj.porcentagemProfessor || 50)

        const valorProfessor = baseReal * (porcentagem / 100)
        const valorCT = baseReal - valorProfessor

        pagamentosProf.push({
          id: Date.now(),

          professor: turmaObj.professor,
          professorId: turmaObj.professorId,

          aluno: form.nome,

          modalidade: t.modalidade,
          turma: t.turma,

          valorBase,
          baseReal,

          valorProfessor: Number(valorProfessor.toFixed(2)),
          valorCT: Number(valorCT.toFixed(2)),

          mesReferencia: form.mesReferencia,
          formaPagamento: form.formaPagamento,

          data: agora.toLocaleDateString()
        })
      }

    })

    localStorage.setItem("ct_okinawa_pagamentos_prof", JSON.stringify(pagamentosProf))

    imprimirRecibo(nova)

    setAlunoId("")
    setBusca("")
  }

  return (
    <div style={{maxWidth:700, margin:"0 auto", padding:30}}>

      <style>{`
        body{background:#f4f6f9}

        .card{
          background:#fff;
          padding:25px;
          border-radius:12px;
          box-shadow:0 4px 15px rgba(0,0,0,0.08);
        }

        .input{
          width:100%;
          padding:12px;
          margin-bottom:10px;
          border-radius:10px;
          border:1px solid #ddd;
        }

        .lista{
          position:absolute;
          width:100%;
          background:#fff;
          border:1px solid #ddd;
          border-radius:10px;
          max-height:200px;
          overflow:auto;
          z-index:10;
        }

        .itemBusca{
          padding:10px;
          cursor:pointer;
          border-bottom:1px solid #eee;
        }

        .itemBusca:hover{
          background:#f5f5f5;
        }

        .label{
          font-size:13px;
          color:#555;
        }

        .total{
          background:#000;
          color:#fff;
          padding:15px;
          border-radius:12px;
          text-align:center;
          font-size:20px;
          margin-top:10px;
        }

        button{
          width:100%;
          padding:14px;
          border:none;
          border-radius:12px;
          background:#000;
          color:#fff;
          cursor:pointer;
          margin-top:10px;
        }
      `}</style>

      <h1>Mensalidades</h1>

      <div className="card">

        <div style={{position:"relative"}}>

          <input
            className="input"
            placeholder="🔍 Buscar aluno..."
            value={busca}
            onChange={e=>{
              setBusca(e.target.value)
              setMostrarLista(true)
            }}
            onFocus={()=>setMostrarLista(true)}
          />

          {mostrarLista && busca && (
            <div className="lista">

              {alunosFiltrados.map(a=>(
                <div
                  key={a.id}
                  className="itemBusca"
                  onClick={()=>{
                    setAlunoId(a.id)
                    setBusca(a.nome)
                    setMostrarLista(false)
                  }}
                >
                  <strong>{a.nome}</strong><br/>
                  <span style={{fontSize:12,color:"#666"}}>
                    {a.modalidade} • {a.turma}
                  </span>
                </div>
              ))}

            </div>
          )}

        </div>

        <input className="input" value={form.matricula} disabled />
        <input className="input" value={form.modalidade} disabled />
        <input className="input" value={form.turma} disabled />

        <div className="label">Valor da mensalidade</div>
        <input className="input" value={form.valor} disabled />

        <div className="label">Desconto da matrícula</div>
        <input className="input" value={form.descontoBase} disabled />

        <div className="label">Desconto pagamento</div>
        <input className="input" value={form.descontoPagamento} disabled />

        <input className="input"
          placeholder="Mês referência (04/2026)"
          value={form.mesReferencia}
          onChange={e=>setForm({...form, mesReferencia:e.target.value})}
        />

        <select className="input"
          value={form.formaPagamento}
          onChange={e=>setForm({...form, formaPagamento:e.target.value})}>
          <option>Pix</option>
          <option>Dinheiro</option>
          <option>Débito</option>
          <option>Crédito</option>
        </select>

        <div className="total">
          Total: R$ {form.total}
        </div>

        <button onClick={salvar}>
          Gerar Recibo
        </button>

      </div>

    </div>
  )
}