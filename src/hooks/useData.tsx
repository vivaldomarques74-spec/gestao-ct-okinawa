"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export function useData() {
  const [alunos, setAlunos] = useState<any[]>([])
  const [turmas, setTurmas] = useState<any[]>([])
  const [modalidades, setModalidades] = useState<any[]>([])

  useEffect(() => {
    async function fetchData() {
      const { data, error } = await supabase
        .from("alunos")
        .select("*")

      if (error) {
        console.error("Erro ao buscar alunos:", error)
        return
      }

      setAlunos(data || [])

      // gerar modalidades únicas a partir dos alunos
      const mods = [...new Set(data?.map((a:any) => a.modalidade))]
        .filter(Boolean)
        .map((m) => ({ nome: m }))

      setModalidades(mods)

      // gerar turmas únicas
      const trs = [...new Set(data?.map((a:any) => a.turma))]
        .filter(Boolean)
        .map((t, i) => ({ id: i, nome: t }))

      setTurmas(trs)
    }

    fetchData()
  }, [])

  return { alunos, turmas, modalidades }
}