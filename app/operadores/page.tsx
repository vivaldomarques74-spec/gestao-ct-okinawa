"use client"

import { useState } from "react"
import { supabase } from "../../lib/supabase"

export default function Operadores() {
  const [form, setForm] = useState({
    nome: "",
    codigo: "",
    tipo: "secretaria",
  })

  const salvarOperador = async () => {
    if (!form.nome || !form.codigo) {
      alert("Preencha nome e código")
      return
    }

    const { error } = await supabase.from("operadores").insert([
      {
        nome: form.nome,
        codigo: form.codigo,
        tipo: form.tipo,
      },
    ])

    if (error) {
      alert("Erro ao salvar operador")
    } else {
      alert("Operador cadastrado")
      setForm({ nome: "", codigo: "", tipo: "secretaria" })
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Cadastro de Operadores</h1>

      <div className="bg-white p-6 rounded-2xl shadow text-black max-w-md">

        <input
          placeholder="Nome"
          className="input mb-3"
          value={form.nome}
          onChange={(e) => setForm({ ...form, nome: e.target.value })}
        />

        <input
          placeholder="Código"
          className="input mb-3"
          value={form.codigo}
          onChange={(e) => setForm({ ...form, codigo: e.target.value })}
        />

        <select
          className="input mb-3"
          value={form.tipo}
          onChange={(e) => setForm({ ...form, tipo: e.target.value })}
        >
          <option value="secretaria">Secretaria</option>
          <option value="admin">Admin</option>
        </select>

        <button
          onClick={salvarOperador}
          className="w-full bg-red-600 text-white p-3 rounded-lg"
        >
          Salvar operador
        </button>

      </div>

      <style jsx>{`
        .input {
          width: 100%;
          padding: 12px;
          border: 1px solid #ccc;
          border-radius: 8px;
        }
      `}</style>
    </div>
  )
}