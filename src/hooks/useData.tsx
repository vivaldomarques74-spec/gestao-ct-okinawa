"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export function useData() {
  const [alunos, setAlunos] = useState<any[]>([])
  const [turmas, setTurmas] = useState<any[]>([])
  const [modalidades, setModalidades] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)

      const { data, error } = await supabase
        .from("alunos")
        .select("*")

      console.log("SUPABASE DATA:", data)
      console.log("SUPABASE ERROR:", error)

      if (error) {
        console.error("Erro ao buscar alunos:", error)
        setLoading(false)
        return
      }

      const lista = data || []

      setAlunos(lista)

      // 🔥 Detecta automaticamente se é modalidade OU disciplina
      const mods = [
        ...new Set(
          lista.map((a: any) => a.modalidade || a.disciplina)
        ),
      ]
        .filter(Boolean)
        .map((m) => ({ nome: m }))

      setModalidades(mods)

      // 🔥 Turmas
      const trs = [
        ...new Set(lista.map((a: any) => a.turma))
      ]
        .filter(Boolean)
        .map((t, i) => ({ id: i, nome: t }))

      setTurmas(trs)

      setLoading(false)
    }

    fetchData()
  }, [])

  return { alunos, turmas, modalidades, loading }
}