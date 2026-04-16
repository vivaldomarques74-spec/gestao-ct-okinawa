"use client"

import { useState } from "react"
import { useData } from "@/hooks/useData"

export default function Page() {
  const { vendas, setVendas, produtos } = useData()

  const [produtoId, setProdutoId] = useState("")

  const vender = () => {
    setVendas([
      ...vendas,
      { id: Date.now(), produtoId }
    ])
  }

  return (
    <div className="p-6">
      <h1>Vendas</h1>

      <select onChange={(e)=>setProdutoId(e.target.value)}>
        {produtos.map((p:any)=>(
          <option key={p.id} value={p.id}>{p.nome}</option>
        ))}
      </select>

      <button onClick={vender}>Vender</button>

      {vendas.map((v:any)=>(
        <div key={v.id}>
          Produto ID: {v.produtoId}
        </div>
      ))}
    </div>
  )
}