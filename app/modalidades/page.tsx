"use client"

import { useEffect, useState } from "react"

export default function ModalidadesPage() {

  // 🔥 STORAGE PADRONIZADO
  const get = (k: string) => {
    try {
      return JSON.parse(
        localStorage.getItem("ct_okinawa_" + k) ||
        localStorage.getItem(k) ||
        "[]"
      )
    } catch {
      return []
    }
  }

  const set = (k: string, v: any) =>
    localStorage.setItem("ct_okinawa_" + k, JSON.stringify(v))

  const [modalidades, setModalidades] = useState<any[]>([])
  const [busca, setBusca] = useState("")
  const [editandoId, setEditandoId] = useState<number | null>(null)

  const [form, setForm] = useState({
    nome: "",
    valor: ""
  })

  useEffect(() => {
    const lista = get("modalidades")
    setModalidades(lista)
  }, [])

  const salvar = () => {

    if (!form.nome) return alert("Digite o nome")
    if (!form.valor) return alert("Digite o valor")

    // 🔥 NORMALIZAÇÃO
    const nome = form.nome.trim()
    const valor = Number(form.valor)

    // 🔥 EVITAR DUPLICIDADE
    const existe = modalidades.find(
      (m:any) =>
        m.nome.toLowerCase() === nome.toLowerCase() &&
        m.id !== editandoId
    )

    if (existe) return alert("Essa modalidade já existe")

    if (editandoId) {

      const lista = modalidades.map((m: any) =>
        m.id === editandoId ? { id: editandoId, nome, valor } : m
      )

      set("modalidades", lista)
      setModalidades(lista)
      setEditandoId(null)

    } else {

      const novo = {
        id: Date.now(),
        nome,
        valor
      }

      const lista = [...modalidades, novo]

      set("modalidades", lista)
      setModalidades(lista)

    }

    setForm({ nome: "", valor: "" })
  }

  const editar = (m: any) => {
    setForm({
      nome: m.nome,
      valor: String(m.valor)
    })
    setEditandoId(m.id)
  }

  const excluir = (id: number) => {
    if (!confirm("Excluir modalidade?")) return

    const lista = modalidades.filter((m: any) => m.id !== id)

    set("modalidades", lista)
    setModalidades(lista)
  }

  const listaFiltrada = modalidades
    .filter((m: any) =>
      m.nome.toLowerCase().includes(busca.toLowerCase())
    )
    .sort((a:any,b:any)=> a.nome.localeCompare(b.nome))

  return (
    <div style={{ maxWidth:1200, margin:"0 auto", padding:30 }}>

      <style>{`
        .grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}
        .card{background:#fff;padding:20px;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.08)}
        .input{width:100%;padding:10px;margin-bottom:10px;border-radius:8px;border:1px solid #ddd}
        .btn{padding:12px;border:none;border-radius:8px;background:#111;color:#fff;cursor:pointer}
        .item{display:flex;justify-content:space-between;padding:10px;border-bottom:1px solid #eee}
      `}</style>

      <h1>Modalidades</h1>

      <div className="grid">

        {/* FORM */}
        <div className="card">

          <input
            className="input"
            placeholder="Nome"
            value={form.nome}
            onChange={e=>setForm({...form,nome:e.target.value})}
          />

          <input
            className="input"
            placeholder="Valor mensalidade"
            value={form.valor}
            onChange={e=>setForm({...form,valor:e.target.value})}
          />

          <button className="btn" onClick={salvar}>
            {editandoId ? "Atualizar" : "Cadastrar"}
          </button>

        </div>

        {/* LISTA */}
        <div className="card">

          <input
            className="input"
            placeholder="Buscar..."
            value={busca}
            onChange={e=>setBusca(e.target.value)}
          />

          {listaFiltrada.map((m:any)=>(
            <div key={m.id} className="item">

              <div>
                <strong>{m.nome}</strong>
                <div>R$ {m.valor}</div>
              </div>

              <div>
                <button onClick={()=>editar(m)}>✏️</button>
                <button onClick={()=>excluir(m.id)}>🗑️</button>
              </div>

            </div>
          ))}

        </div>

      </div>

    </div>
  )
}