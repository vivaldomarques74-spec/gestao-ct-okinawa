"use client"

import { useState } from "react"

export default function ProfessoresPage() {
  const [professores, setProfessores] = useState<any[]>([])
  const [nome, setNome] = useState("")
  const [modalidade, setModalidade] = useState("")

  function adicionarProfessor() {
    if (!nome) return

    setProfessores([
      ...professores,
      {
        id: Date.now(),
        nome,
        modalidade,
      },
    ])

    setNome("")
    setModalidade("")
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Professores</h2>

      <input
        placeholder="Nome"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
      />

      <input
        placeholder="Modalidade"
        value={modalidade}
        onChange={(e) => setModalidade(e.target.value)}
      />

      <button onClick={adicionarProfessor}>Adicionar</button>

      <ul>
        {professores.map((p) => (
          <li key={p.id}>
            {p.nome} - {p.modalidade}
          </li>
        ))}
      </ul>
    </div>
  )
}