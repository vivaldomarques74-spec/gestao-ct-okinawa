"use client"

import { useState } from "react"

export default function TurmasPage() {
  const [turmas, setTurmas] = useState<any[]>([])
  const [nome, setNome] = useState("")
  const [professor, setProfessor] = useState("")

  function adicionarTurma() {
    if (!nome) return

    setTurmas([
      ...turmas,
      {
        id: Date.now(),
        nome,
        professor,
      },
    ])

    setNome("")
    setProfessor("")
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Turmas</h2>

      <input
        placeholder="Nome da turma"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
      />

      <input
        placeholder="Professor"
        value={professor}
        onChange={(e) => setProfessor(e.target.value)}
      />

      <button onClick={adicionarTurma}>Salvar</button>

      <ul>
        {turmas.map((t) => (
          <li key={t.id}>
            {t.nome} - {t.professor || "Sem professor"}
          </li>
        ))}
      </ul>
    </div>
  )
}