"use client"

import { useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useStore } from "@/lib/store"

export function useData() {
  const { setAlunos } = useStore()

  useEffect(() => {
    async function fetchData() {
      const { data, error } = await supabase.from("alunos").select("*")

      if (error) {
        console.error("Erro ao buscar alunos:", error)
      } else {
        setAlunos(data)
      }
    }

    fetchData()
  }, [])
}