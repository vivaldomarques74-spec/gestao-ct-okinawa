"use client"

import { useState } from "react"

export default function AlunosPage() {
  const [alunos, setAlunos] = useState<any[]>([])
  const [nome, setNome] = useState("")
  const [modalidade, setModalidade] = useState("")

  function adicionarModalidade(index: number) {
    if (!modalidade) return

    const lista = [...alunos]
    lista[index].modalidades.push(modalidade)
    setAlunos(lista)
    setModalidade("")
  }

  function adicionarAluno() {
    if (!nome) return

    setAlunos([
      ...alunos,
      {
        id: Date.now(),
        nome,
        modalidades: [],
        ativo: true,
      },
    ])
    setNome("")
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Alunos</h2>

      <input
        placeholder="Nome"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
      />
      <button onClick={adicionarAluno}>Adicionar</button>

      {alunos.map((a, i) => (
        <div key={a.id} style={{ border: "1px solid #ccc", marginTop: 10, padding: 10 }}>
          <strong>{a.nome}</strong>

          <div>
            Modalidades: {a.modalidades.join(", ") || "Nenhuma"}
          </div>

          <input
            placeholder="Nova modalidade"
            value={modalidade}
            onChange={(e) => setModalidade(e.target.value)}
          />
          <button onClick={() => adicionarModalidade(i)}>
            + Modalidade
          </button>
        </div>
      ))}
    </div>
  )
}