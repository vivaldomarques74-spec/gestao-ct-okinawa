"use client"

import { createContext, useContext, useEffect, useState } from "react"

const DataContext = createContext<any>(null)

export const DataProvider = ({ children }: any) => {

  const [alunos, setAlunos] = useState<any[]>([])
  const [professores, setProfessores] = useState<any[]>([])
  const [modalidades, setModalidades] = useState<any[]>([])
  const [turmas, setTurmas] = useState<any[]>([])
  const [vendas, setVendas] = useState<any[]>([])
  const [produtos, setProdutos] = useState<any[]>([])
  const [parceiros, setParceiros] = useState<any[]>([])

  // 🔥 CARREGAR DO LOCALSTORAGE
  useEffect(() => {
    const data = localStorage.getItem("ct-data")
    if (data) {
      const parsed = JSON.parse(data)

      setAlunos(parsed.alunos || [])
      setProfessores(parsed.professores || [])
      setModalidades(parsed.modalidades || [])
      setTurmas(parsed.turmas || [])
      setVendas(parsed.vendas || [])
      setProdutos(parsed.produtos || [])
      setParceiros(parsed.parceiros || [])
    }
  }, [])

  // 🔥 SALVAR AUTOMATICAMENTE
  useEffect(() => {
    localStorage.setItem("ct-data", JSON.stringify({
      alunos,
      professores,
      modalidades,
      turmas,
      vendas,
      produtos,
      parceiros
    }))
  }, [alunos, professores, modalidades, turmas, vendas, produtos, parceiros])

  return (
    <DataContext.Provider value={{
      alunos, setAlunos,
      professores, setProfessores,
      modalidades, setModalidades,
      turmas, setTurmas,
      vendas, setVendas,
      produtos, setProdutos,
      parceiros, setParceiros
    }}>
      {children}
    </DataContext.Provider>
  )
}

export const useData = () => useContext(DataContext)