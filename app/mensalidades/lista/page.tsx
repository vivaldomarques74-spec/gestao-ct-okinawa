"use client"

import { useEffect, useState } from "react"

const SENHA = "170296"

export default function ListaMensalidades() {

  const [logado, setLogado] = useState(false)
  const [senha, setSenha] = useState("")

  const [mensalidades, setMensalidades] = useState<any[]>([])
  const [mesFiltro, setMesFiltro] = useState("")

  const get = () => {
    try {
      return JSON.parse(localStorage.getItem("ct_okinawa_mensalidades") || "[]")
    } catch {
      return []
    }
  }

  const set = (lista:any[]) => {
    localStorage.setItem("ct_okinawa_mensalidades", JSON.stringify(lista))
  }

  useEffect(() => {
    setMensalidades(get())
  }, [])

  // 🔐 LOGIN
  if (!logado) {
    return (
      <div style={{padding:40, maxWidth:400, margin:"0 auto"}}>
        <h2>🔒 Acesso restrito</h2>

        <input
          placeholder="Digite a senha"
          value={senha}
          onChange={e=>setSenha(e.target.value)}
          style={{width:"100%", padding:12, marginTop:10}}
        />

        <button
          onClick={()=>{
            if (senha === SENHA) {
              setLogado(true)
            } else {
              alert("Senha incorreta")
            }
          }}
          style={{marginTop:10, padding:12, width:"100%"}}
        >
          Entrar
        </button>
      </div>
    )
  }

  // 🔍 FILTRO POR MÊS
  const listaFiltrada = mensalidades.filter(m =>
    (m.mesReferencia || "").includes(mesFiltro)
  )

  // 🧾 RECIBO
  const imprimirRecibo = (r:any) => {

    const w = window.open("", "", "width=800,height=600")

    w?.document.write(`
      <html>
      <body style="font-family:Arial;padding:30px">

      <h2>CT OKINAWA</h2>
      <h3>Recibo</h3>

      <hr/>

      <p><b>Mês:</b> ${r.mesReferencia || "-"}</p>
      <p><b>Data:</b> ${r.data || "-"}</p>

      <hr/>

      <p><b>Aluno:</b> ${r.nome}</p>
      <p><b>Modalidade:</b> ${r.modalidade || "-"}</p>

      <hr/>

      <p><b>Total:</b> R$ ${r.total}</p>
      <p><b>Pagamento:</b> ${r.formaPagamento || "-"}</p>

      <script>
        window.onload = () => setTimeout(()=>window.print(),300)
      </script>

      </body>
      </html>
    `)

    w?.document.close()
  }

  // ❌ EXCLUIR
  const excluir = (id:number) => {
    if (!confirm("Excluir pagamento?")) return

    const nova = mensalidades.filter(m => m.id !== id)
    set(nova)
    setMensalidades(nova)
  }

  // 📊 RELATÓRIO
  const imprimirRelatorio = () => {

    const total = listaFiltrada.reduce((s, m)=> s + Number(m.total || 0), 0)

    const w = window.open("", "", "width=900,height=700")

    w?.document.write(`
      <html>
      <body style="font-family:Arial;padding:30px">

      <h2>Relatório Mensal</h2>
      <h3>Mês: ${mesFiltro || "Todos"}</h3>

      <table border="1" cellpadding="8" cellspacing="0" width="100%">
        <tr>
          <th>Aluno</th>
          <th>Mês</th>
          <th>Valor</th>
          <th>Pagamento</th>
        </tr>

        ${listaFiltrada.map(m => `
          <tr>
            <td>${m.nome}</td>
            <td>${m.mesReferencia || "-"}</td>
            <td>R$ ${m.total}</td>
            <td>${m.formaPagamento || "-"}</td>
          </tr>
        `).join("")}

      </table>

      <h3>Total: R$ ${total}</h3>

      <script>
        window.onload = () => setTimeout(()=>window.print(),300)
      </script>

      </body>
      </html>
    `)

    w?.document.close()
  }

  return (
    <div style={{maxWidth:900, margin:"0 auto", padding:30}}>

      <h1>📋 Lista de Mensalidades</h1>

      <input
        placeholder="Filtrar por mês (ex: 04/2026)"
        value={mesFiltro}
        onChange={e=>setMesFiltro(e.target.value)}
        style={{padding:10, width:"100%", marginBottom:20}}
      />

      <button onClick={imprimirRelatorio}>
        📊 Imprimir Relatório
      </button>

      <div style={{marginTop:20}}>

        {listaFiltrada.map(m => (
          <div key={m.id}
            style={{
              border:"1px solid #ddd",
              padding:15,
              borderRadius:10,
              marginBottom:10
            }}
          >

            <strong>{m.nome}</strong><br/>
            {(m.modalidade || "-")} • {(m.mesReferencia || "-")}<br/>
            💰 R$ {m.total} • {(m.formaPagamento || "-")}

            <div style={{marginTop:10, display:"flex", gap:10}}>

              <button onClick={()=>imprimirRecibo(m)}>
                🧾 Recibo
              </button>

              <button onClick={()=>excluir(m.id)}>
                ❌ Excluir
              </button>

            </div>

          </div>
        ))}

      </div>

    </div>
  )
}