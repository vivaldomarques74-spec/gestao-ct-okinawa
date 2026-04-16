"use client"

import { useEffect, useState } from "react"

export default function ListaAlunosPage() {

  const get = (k: string) => {
    try {
      return JSON.parse(localStorage.getItem("ct_okinawa_" + k) || "[]")
    } catch {
      return []
    }
  }

  const set = (k: string, v: any) =>
    localStorage.setItem("ct_okinawa_" + k, JSON.stringify(v))

  const [alunos, setAlunos] = useState<any[]>([])
  const [busca, setBusca] = useState("")
  const [editando, setEditando] = useState<any | null>(null)
  const [visualizando, setVisualizando] = useState<any | null>(null)
  const [historico, setHistorico] = useState<any | null>(null)

  useEffect(() => {
    setAlunos(get("alunos"))
  }, [])

  const atualizar = () => setAlunos(get("alunos"))

  const verificarStatus = (aluno:any) => {
    const mensalidades = get("mensalidades")
      .filter((m:any)=>m.aluno === aluno.nome)

    if (!mensalidades.length) return aluno.ativo ? "ativo" : "inativo"

    const ultima = mensalidades[mensalidades.length - 1]

    const hoje = new Date()
    const data = new Date(ultima.data)

    const diff = (hoje.getTime() - data.getTime()) / (1000 * 60 * 60 * 24)

    if (diff > 30) return "bloqueado"

    return aluno.ativo ? "ativo" : "inativo"
  }

  const excluir = (id:number) => {
    if (!confirm("Excluir aluno?")) return
    set("alunos", alunos.filter(a => a.id !== id))
    atualizar()
  }

  const toggleAtivo = (id:number) => {
    const lista = alunos.map(a =>
      a.id === id ? { ...a, ativo: !a.ativo } : a
    )
    set("alunos", lista)
    atualizar()
  }

  const salvarEdicao = () => {
    const lista = alunos.map(a =>
      a.id === editando.id ? editando : a
    )
    set("alunos", lista)
    setEditando(null)
    atualizar()
  }

  const verHistorico = (a:any) => {
    const mensalidades = get("mensalidades")
      .filter((m:any)=>m.aluno === a.nome)

    setHistorico({
      aluno: a.nome,
      lista: mensalidades
    })
  }

  const fichaA4 = (a:any) => {

    const w = window.open("", "", "width=900,height=700")

    w?.document.write(`
      <html>
      <body style="font-family:Arial;padding:40px">

      <h1>CT OKINAWA</h1>
      <h2>Ficha do Aluno</h2>

      <hr/>

      Nome: ${a.nome}<br/>
      CPF: ${a.cpf}<br/>
      RG: ${a.rg}<br/>
      WhatsApp: ${a.whatsapp}<br/>
      Email: ${a.email}<br/>
      Endereço: ${a.endereco}<br/><br/>

      Modalidade: ${a.modalidade} - ${a.turma}<br/><br/>

      Saúde:<br/>
      ${a.problemasSaude}<br/>
      ${a.medicamentos}<br/><br/>

      ${
        a.responsavelNome ? `
        Responsável:<br/>
        ${a.responsavelNome}<br/>
        ${a.responsavelCpf}<br/>
        ${a.responsavelWhatsapp}<br/>
        ` : ""
      }

      <br/><br/>
      ___________________________<br/>
      Assinatura

      <script>
        window.onload = () => setTimeout(()=>window.print(),300)
      </script>

      </body>
      </html>
    `)

    w?.document.close()
  }

  const listaFiltrada = alunos.filter(a =>
    a.nome?.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div style={{maxWidth:1200, margin:"0 auto", padding:30}}>

      <style>{`
        body{background:#f4f6f9}

        .card{background:#fff;padding:20px;border-radius:12px;margin-bottom:20px}
        .input{width:100%;padding:10px;margin-bottom:10px;border-radius:8px;border:1px solid #ddd}

        .item{
          display:flex;
          justify-content:space-between;
          padding:12px;
          border-bottom:1px solid #eee;
          align-items:center;
        }

        .acoes button{
          margin-left:5px;
          border:none;
          padding:6px 10px;
          border-radius:6px;
          cursor:pointer;
        }

        .ver{background:#3498db;color:#fff}
        .editar{background:#f1c40f}
        .excluir{background:#e74c3c;color:#fff}
        .ativoBtn{background:#2ecc71;color:#fff}

        .ativo{color:green;font-weight:bold}
        .inativo{color:gray;font-weight:bold}
        .bloqueado{color:red;font-weight:bold}

        .modal{
          position:fixed;
          top:0;left:0;
          width:100%;
          height:100%;
          background:rgba(0,0,0,0.5);
          display:flex;
          align-items:center;
          justify-content:center;
        }

        .modal-content{
          background:#fff;
          padding:25px;
          border-radius:12px;
          width:420px;
          max-height:90%;
          overflow:auto;
        }

      `}</style>

      <div className="card">
        <h2>Alunos</h2>

        <input
          className="input"
          placeholder="Buscar aluno..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
        />

        {listaFiltrada.map(a => {

          const status = verificarStatus(a)

          return (
            <div className="item" key={a.id}>
              <div>
                <strong>{a.nome}</strong><br/>
                <span className={status}>{status}</span>
              </div>

              <div className="acoes">
                <button className="ver" onClick={()=>setVisualizando(a)}>Ver</button>
                <button className="editar" onClick={()=>setEditando(a)}>Editar</button>
                <button onClick={()=>verHistorico(a)}>Histórico</button>
                <button onClick={()=>fichaA4(a)}>Ficha</button>
                <button className="ativoBtn" onClick={()=>toggleAtivo(a.id)}>
                  {a.ativo ? "Inativar" : "Ativar"}
                </button>
                <button className="excluir" onClick={()=>excluir(a.id)}>X</button>
              </div>
            </div>
          )
        })}
      </div>

      {/* VISUALIZAR */}
      {visualizando && (
        <div className="modal">
          <div className="modal-content">
            <h3>{visualizando.nome}</h3>
            <p>{visualizando.whatsapp}</p>
            <button onClick={()=>setVisualizando(null)}>Fechar</button>
          </div>
        </div>
      )}

      {/* EDITAR */}
      {editando && (
        <div className="modal">
          <div className="modal-content">

            <h2>Editar Aluno</h2>

            <input className="input" placeholder="Nome" value={editando.nome}
              onChange={e=>setEditando({...editando, nome:e.target.value})}/>

            <input className="input" placeholder="CPF" value={editando.cpf}
              onChange={e=>setEditando({...editando, cpf:e.target.value})}/>

            <input className="input" placeholder="RG" value={editando.rg}
              onChange={e=>setEditando({...editando, rg:e.target.value})}/>

            <input className="input" placeholder="WhatsApp" value={editando.whatsapp}
              onChange={e=>setEditando({...editando, whatsapp:e.target.value})}/>

            <input className="input" placeholder="Email" value={editando.email}
              onChange={e=>setEditando({...editando, email:e.target.value})}/>

            <input className="input" placeholder="Endereço" value={editando.endereco}
              onChange={e=>setEditando({...editando, endereco:e.target.value})}/>

            <input className="input" placeholder="Modalidade" value={editando.modalidade}
              onChange={e=>setEditando({...editando, modalidade:e.target.value})}/>

            <input className="input" placeholder="Turma" value={editando.turma}
              onChange={e=>setEditando({...editando, turma:e.target.value})}/>

            <textarea className="input" placeholder="Problemas de saúde"
              value={editando.problemasSaude}
              onChange={e=>setEditando({...editando, problemasSaude:e.target.value})}/>

            <textarea className="input" placeholder="Medicamentos"
              value={editando.medicamentos}
              onChange={e=>setEditando({...editando, medicamentos:e.target.value})}/>

            <h3>Responsável</h3>

            <input className="input" placeholder="Nome" value={editando.responsavelNome}
              onChange={e=>setEditando({...editando, responsavelNome:e.target.value})}/>

            <input className="input" placeholder="CPF" value={editando.responsavelCpf}
              onChange={e=>setEditando({...editando, responsavelCpf:e.target.value})}/>

            <input className="input" placeholder="WhatsApp" value={editando.responsavelWhatsapp}
              onChange={e=>setEditando({...editando, responsavelWhatsapp:e.target.value})}/>

            <button onClick={salvarEdicao}>💾 Salvar</button>
            <button onClick={()=>setEditando(null)}>Cancelar</button>

          </div>
        </div>
      )}

      {/* HISTÓRICO */}
      {historico && (
        <div className="modal">
          <div className="modal-content">

            <h3>Histórico - {historico.aluno}</h3>

            {historico.lista.length ? (
              historico.lista.map((m:any, i:number)=>(
                <div key={i}>
                  {m.data} - R$ {m.valor}
                </div>
              ))
            ) : (
              <p>Sem histórico</p>
            )}

            <button onClick={()=>setHistorico(null)}>Fechar</button>

          </div>
        </div>
      )}

    </div>
  )
}