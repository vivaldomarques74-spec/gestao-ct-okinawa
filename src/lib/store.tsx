"use client"

import { createContext, useContext, useState, ReactNode } from "react"

type StoreType = {
  alunos: any[]
  setAlunos: React.Dispatch<React.SetStateAction<any[]>>
  professores: any[]
  setProfessores: React.Dispatch<React.SetStateAction<any[]>>
  turmas: any[]
  setTurmas: React.Dispatch<React.SetStateAction<any[]>>
  vendas: any[]
  setVendas: React.Dispatch<React.SetStateAction<any[]>>
}

const StoreContext = createContext<StoreType | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [alunos, setAlunos] = useState<any[]>([])
  const [professores, setProfessores] = useState<any[]>([])
  const [turmas, setTurmas] = useState<any[]>([])
  const [vendas, setVendas] = useState<any[]>([])

  return (
    <StoreContext.Provider
      value={{
        alunos,
        setAlunos,
        professores,
        setProfessores,
        turmas,
        setTurmas,
        vendas,
        setVendas,
      }}
    >
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const context = useContext(StoreContext)
  if (!context) throw new Error("Store não encontrado")
  return context
}