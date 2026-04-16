"use client"

import { useEffect, useState } from "react"

export default function PresencaPage() {

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

  const set = (k: string, v: any) =>
    localStorage.setItem("ct_okinawa_" + k, JSON.stringify(v))

  const [turmas, setTurmas] = useState<any[]>([])
  const [alunos, setAlunos] = useState<any[]>([])

  const [modalidade, setModalidade] = useState("")
  const [turmaSelecionada, setTurmaSelecionada] = useState("")
  const [lista, setLista] = useState<any[]>([])
  const [busca, setBusca] = useState("")

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const mod = params.get("modalidade")
    if (mod) setModalidade(decodeURIComponent(mod))
  }, [])

  useEffect(() => {
    setTurmas(get("turmas"))
    setAlunos(get("alunos"))
  }, [])

  useEffect(() => {
    if (!turmaSelecionada) return

    const alunosFiltrados = alunos.filter(a => {
      if (!a.ativo) return false

      if (a.turma === turmaSelecionada) return true

      if (a.turmasSelecionadas?.some((t:any)=>t.turma === turmaSelecionada)) {
        return true
      }

      return false
    })

    const novaLista = alunosFiltrados.map(a => ({
      alunoId: a.id,
      nome: a.nome,
      presente: true
    }))

    setLista(novaLista)

  }, [turmaSelecionada, alunos])

  const marcar = (index:number) => {
    const nova = [...lista]
    nova[index].presente = !nova[index].presente
    setLista(nova)
  }

  const marcarTodos = (valor:boolean) => {
    setLista(lista.map(a => ({...a, presente: valor})))
  }

  const salvar = () => {

    if (!turmaSelecionada) {
      alert("Selecione a turma")
      return
    }

    const presencas = get("presencas") || []

    const hoje = new Date()
    const mes = String(hoje.getMonth() + 1).padStart(2, "0")
    const ano = hoje.getFullYear()

    presencas.push({
      id: Date.now(),
      data: hoje.toLocaleDateString(),
      turma: turmaSelecionada,
      modalidade,
      mesReferencia: `${mes}/${ano}`,
      timestamp: hoje.getTime(),
      lista
    })

    set("presencas", presencas)

    alert("Presença salva 🔥")
  }

  const listaFiltrada = lista.filter(a =>
    a.nome.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div style={{maxWidth:500, margin:"0 auto", padding:15}}>

      <style>{`
        body { background:#f5f5f5; }

        .card{
          background:#fff;
          padding:15px;
          border-radius:14px;
          margin-bottom:15px
        }

        .input{
          width:100%;
          padding:14px;
          margin-bottom:10px;
          border-radius:10px;
          border:1px solid #ddd;
          font-size:16px
        }

        .aluno{
          display:flex;
          justify-content:space-between;
          align-items:center;
          padding:12px;
          border-bottom:1px solid #eee
        }

        .nome{
          font-size:16px;
          font-weight:500
        }

        .btn{
          padding:10px 14px;
          border:none;
          border-radius:10px;
          font-size:14px
        }

        .presente{ background:#16a34a; color:#fff }
        .falta{ background:#dc2626; color:#fff }

        .topo{
          display:flex;
          gap:10px
        }

        .salvar{
          width:100%;
          padding:16px;
          font-size:18px;
          font-weight:bold;
          background:#000;
          color:#fff;
          border:none;
          border-radius:12px;
          position:sticky;
          bottom:10px
        }
      `}</style>

      <h2 style={{textAlign:"center"}}>📋 Presença</h2>

      <div className="card">

        <input className="input" value={modalidade} disabled />

        <select className="input"
          onChange={e=>setTurmaSelecionada(e.target.value)}>
          <option value="">Selecione a turma</option>
          {turmas
            .filter((t:any)=>t.modalidade === modalidade)
            .map((t:any)=>(
              <option key={t.id}>{t.nome}</option>
            ))}
        </select>

        <input
          className="input"
          placeholder="Buscar aluno..."
          onChange={e=>setBusca(e.target.value)}
        />

        <div className="topo">
          <button className="btn presente" onClick={()=>marcarTodos(true)}>
            ✔ Todos
          </button>

          <button className="btn falta" onClick={()=>marcarTodos(false)}>
            ❌ Todos
          </button>
        </div>

      </div>

      <div className="card">

        {listaFiltrada.map((a,i)=>(
          <div key={i} className="aluno">

            <span className="nome">{a.nome}</span>

            <button
              className={`btn ${a.presente ? "presente" : "falta"}`}
              onClick={()=>marcar(i)}
            >
              {a.presente ? "✔" : "❌"}
            </button>

          </div>
        ))}

      </div>

      <button className="salvar" onClick={salvar}>
        💾 Salvar Presença
      </button>

    </div>
  )
}