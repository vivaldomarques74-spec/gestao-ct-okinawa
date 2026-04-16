"use client"

import { useEffect, useState } from "react"

export default function ConveniosPage() {

  const get = (k: string) => {
    const data =
      localStorage.getItem(k) ||
      localStorage.getItem("ct_okinawa_" + k)

    return JSON.parse(data || "[]")
  }

  const set = (k: string, v: any) =>
    localStorage.setItem("ct_okinawa_" + k, JSON.stringify(v))

  const [convenios, setConvenios] = useState<any[]>([])
  const [editandoId, setEditandoId] = useState<number | null>(null)

  const [form, setForm] = useState({
    nome: "",
    tipoDesconto: "percentual",
    valorDesconto: 0,
    ativo: true
  })

  useEffect(() => {
    setConvenios(get("convenios"))
  }, [])

  const salvar = () => {

    if (!form.nome) return alert("Digite o nome")

    let lista

    if (editandoId) {
      lista = convenios.map(c =>
        c.id === editandoId ? { ...form, id: editandoId } : c
      )
      setEditandoId(null)
    } else {
      lista = [...convenios, { ...form, id: Date.now() }]
    }

    set("convenios", lista)
    setConvenios(lista)

    setForm({
      nome: "",
      tipoDesconto: "percentual",
      valorDesconto: 0,
      ativo: true
    })
  }

  const editar = (c: any) => {
    setForm(c)
    setEditandoId(c.id)
  }

  const excluir = (id: number) => {
    const lista = convenios.filter(c => c.id !== id)
    set("convenios", lista)
    setConvenios(lista)
  }

  return (
    <div style={{ maxWidth:900, margin:"0 auto", padding:30 }}>

      <style>{`
        .card{background:#fff;padding:20px;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.08);margin-bottom:20px}
        .input{width:100%;padding:10px;margin-bottom:10px;border-radius:8px;border:1px solid #ddd}
        .btn{padding:12px;border:none;border-radius:8px;background:#111;color:#fff;cursor:pointer}
        .item{display:flex;justify-content:space-between;padding:10px;border-bottom:1px solid #eee}
      `}</style>

      <h1>Convênios</h1>

      {/* FORM */}
      <div className="card">

        <input
          className="input"
          placeholder="Nome do convênio (ex: Escola X)"
          value={form.nome}
          onChange={e=>setForm({...form,nome:e.target.value})}
        />

        <select
          className="input"
          value={form.tipoDesconto}
          onChange={e=>setForm({...form,tipoDesconto:e.target.value})}
        >
          <option value="percentual">Percentual (%)</option>
          <option value="fixo">Valor fixo (R$)</option>
        </select>

        <input
          className="input"
          type="number"
          placeholder="Valor do desconto"
          value={form.valorDesconto}
          onChange={e=>setForm({...form,valorDesconto:Number(e.target.value)})}
        />

        <label>
          <input
            type="checkbox"
            checked={form.ativo}
            onChange={e=>setForm({...form,ativo:e.target.checked})}
          />
          Ativo
        </label>

        <br/><br/>

        <button className="btn" onClick={salvar}>
          {editandoId ? "Atualizar" : "Cadastrar"}
        </button>

      </div>

      {/* LISTA */}
      <div className="card">

        {convenios.map((c:any)=>(
          <div key={c.id} className="item">

            <div>
              <strong>{c.nome}</strong>
              <div>
                {c.tipoDesconto === "percentual"
                  ? `${c.valorDesconto}%`
                  : `R$ ${c.valorDesconto}`}
              </div>
            </div>

            <div>
              <button onClick={()=>editar(c)}>✏️</button>
              <button onClick={()=>excluir(c.id)}>🗑️</button>
            </div>

          </div>
        ))}

      </div>

    </div>
  )
}