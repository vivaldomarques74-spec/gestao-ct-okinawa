"use client"

import { useRouter, usePathname } from "next/navigation"
import { useState } from "react"
import {
  Home, Users, DollarSign, Package, Handshake,
  GraduationCap, AlertTriangle, Menu as MenuIcon, BarChart3
} from "lucide-react"

export default function MenuCT() {

  const router = useRouter()
  const pathname = usePathname()

  const [aberto, setAberto] = useState(true)

  const Item = ({ label, path, icon: Icon }: any) => {

    const ativo = pathname === path

    return (
      <div
        onClick={() => router.push(path)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 12px",
          borderRadius: 10,
          cursor: "pointer",
          background: ativo ? "#000" : "transparent",
          color: ativo ? "#fff" : "#333",
          transition: "all 0.2s"
        }}
      >
        <Icon size={18} />
        {aberto && <span>{label}</span>}
      </div>
    )
  }

  const Secao = ({ titulo, children }: any) => (
    <div style={{ marginBottom: 20 }}>
      {aberto && (
        <div style={{
          fontSize: 12,
          color: "#777",
          margin: "10px 8px"
        }}>
          {titulo}
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {children}
      </div>
    </div>
  )

  return (
    <div style={{
      width: aberto ? 240 : 70,
      height: "100vh",
      background: "#fff",
      borderRight: "1px solid #eee",
      padding: 10,
      transition: "all 0.3s",
      overflowY: "auto"
    }}>

      {/* TOPO */}
      <div style={{
        display: "flex",
        justifyContent: aberto ? "space-between" : "center",
        marginBottom: 20
      }}>
        {aberto && <strong>CT OKINAWA</strong>}

        <MenuIcon
          size={20}
          style={{ cursor: "pointer" }}
          onClick={() => setAberto(!aberto)}
        />
      </div>

      {/* DASHBOARD */}
      <Secao titulo="PAINEL">
        <Item label="Dashboard" path="/" icon={BarChart3} />
      </Secao>

      {/* GESTÃO */}
      <Secao titulo="GESTÃO">
        <Item label="Alertas" path="/alertas" icon={AlertTriangle} />
      </Secao>

      {/* RELATÓRIOS */}
      <Secao titulo="RELATÓRIOS">
        <Item label="Presenças" path="/relatorios" icon={BarChart3} />
        <Item label="Parceiros" path="/relatorios/parceiros" icon={Handshake} />
        <Item label="Professores" path="/relatorios/professores" icon={Users} />
      </Secao>

      {/* ALUNOS */}
      <Secao titulo="ALUNOS">
        <Item label="Alunos" path="/alunos" icon={Users} />
        <Item label="Editar Alunos" path="/alunos/editar" icon={Users} />
        <Item label="Convênios" path="/convenios" icon={Handshake} />
      </Secao>

      {/* FINANCEIRO */}
      <Secao titulo="FINANCEIRO">
        <Item label="Financeiro" path="/financeiro" icon={DollarSign} />
        <Item label="Mensalidades" path="/mensalidades" icon={DollarSign} />
        <Item label="Editar Mensalidades" path="/mensalidades/lista" icon={DollarSign} />
        <Item label="Vendas" path="/vendas" icon={DollarSign} />
        <Item label="Editar Vendas" path="/vendas/lista" icon={DollarSign} />
      </Secao>

      {/* PRODUTOS */}
      <Secao titulo="PRODUTOS">
        <Item label="Estoque/Entrada" path="/estoque/entrada" icon={Package} />
        <Item label="Produtos" path="/produtos" icon={Package} />
      </Secao>

      {/* PARCEIROS */}
      <Secao titulo="PARCEIROS">
        <Item label="Parceiros" path="/parceiros" icon={Handshake} />
      </Secao>

      {/* ESTRUTURA */}
      <Secao titulo="ESTRUTURA">
        <Item label="Modalidades" path="/modalidades" icon={GraduationCap} />
        <Item label="Professores" path="/professores" icon={Users} />
        <Item label="Turmas" path="/turmas" icon={Home} />
      </Secao>

    </div>
  )
}