"use client"

import { useState } from "react"
import { supabase } from "../../lib/supabase"

export default function Presenca() {
  const [codigo, setCodigo] = useState("")
  const [professor, setProfessor] = useState<any>(null)
  const [turmas, setTurmas] = useState<any[]>([])
  const [alunos, setAlunos] = useState<any[]>([])
  const [turmaSelecionada, setTurmaSelecionada] = useState("")

  const entrar = async () => {
    const { data } = await supabase
      .from("professores")
      .select("*")
      .eq("codigo", codigo)
      .single()

    if (!data) {
      alert("Código inválido")
      return
    }

    setProfessor(data)

    const { data: turmasData } = await supabase
      .from("turmas")
      .select("*")
      .eq("professor_id", data.id)

    setTurmas(turmasData || [])
  }

  const carregarAlunos = async (turma: any) => {
    setTurmaSelecionada(turma.nome)

    const { data } = await supabase
      .from("matriculas")
      .select("*")
      .eq("turma", turma.nome)

    setAlunos(data || [])
  }

  const verificarBloqueio = async (aluno: any) => {
    const { data } = await supabase
      .from("mensalidades")
      .select("*")
      .eq("aluno_id", aluno.aluno_id)
      .eq("status", "pendente")

    if (!data || data.length === 0) return false

    const hoje = new Date()

    for (let m of data) {
      const venc = new Date(m.vencimento + "T00:00:00")

      const diff = Math.floor(
        (hoje.getTime() - venc.getTime()) / (1000 * 60 * 60 * 24)
      )

      if (diff > 5) return true
    }

    return false
  }

  const marcarPresenca = async (aluno: any) => {
    const bloqueado = await verificarBloqueio(aluno)

    if (bloqueado) {
      alert("BLOQUEADO POR PENDÊNCIA FINANCEIRA\nPROCURAR A SECRETARIA")
      return
    }

    await supabase.from("presencas").insert([
      {
        aluno_id: aluno.aluno_id,
        nome: aluno.nome,
        turma: turmaSelecionada,
        professor: professor.nome,
      },
    ])

    alert("Presença registrada")
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4 text-center">Presença</h1>

      {!professor && (
        <>
          <input
            placeholder="Código do professor"
            className="input"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
          />

          <button onClick={entrar} className="btn mt-3 w-full">
            Entrar
          </button>
        </>
      )}

      {professor && turmas.length > 0 && (
        <>
          <h2 className="mb-3 text-center">Turmas</h2>

          <div className="space-y-2">
            {turmas.map((t, i) => (
              <button
                key={i}
                className="btn w-full text-lg py-4"
                onClick={() => carregarAlunos(t)}
              >
                {t.nome}
              </button>
            ))}
          </div>
        </>
      )}

      {alunos.length > 0 && (
        <>
          <h2 className="mt-6 mb-3 text-center">
            Alunos - {turmaSelecionada}
          </h2>

          <div className="space-y-2">
            {alunos.map((a, i) => (
              <button
                key={i}
                className="bg-white text-black p-4 rounded w-full text-left text-lg shadow"
                onClick={() => marcarPresenca(a)}
              >
                {a.nome}
              </button>
            ))}
          </div>
        </>
      )}

      <style jsx>{`
        .input {
          width: 100%;
          padding: 14px;
          border: 1px solid #ccc;
          border-radius: 10px;
          font-size: 16px;
        }

        .btn {
          background: red;
          color: white;
          padding: 14px;
          border-radius: 10px;
          font-size: 16px;
        }
      `}</style>
    </div>
  )
}