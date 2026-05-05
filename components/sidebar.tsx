"use client"
import Link from "next/link"

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r h-screen p-4 overflow-y-auto">
      <h1 className="text-2xl font-bold text-red-600 mb-6">CT OKINAWA</h1>

      <div className="mb-6">
        <p className="text-xs text-gray-400 mb-2">ATENDIMENTO</p>
        <ul className="space-y-2">
          <li><Link href="/" className="hover:text-red-600">Visão Geral</Link></li>
          <li><Link href="/caixa" className="hover:text-red-600">Controle de Caixa</Link></li>
          <li><Link href="/matricula" className="hover:text-red-600">Matrícula</Link></li>
          <li><Link href="/pdv" className="hover:text-red-600">PDV</Link></li>
          <li><Link href="/mensalidades" className="hover:text-red-600">Mensalidades</Link></li>
          <li><Link href="/alertas" className="hover:text-red-600">Central de Alertas</Link></li>
          <li><Link href="/imprimir-recibos" className="hover:text-red-600">Imprimir Recibos</Link></li>
        </ul>
      </div>

      <div>
        <p className="text-xs text-gray-400 mb-2">PAINEL ADMINISTRATIVO</p>
        <ul className="space-y-2">
          <li><Link href="/financeiro" className="hover:text-red-600">Painel Financeiro</Link></li>
          <li><Link href="/registros" className="hover:text-red-600">Central de Registros</Link></li>
          <li><Link href="/relatorios" className="hover:text-red-600">Central de Relatórios</Link></li>
          <li><Link href="/operadores" className="hover:text-red-600">Operadores</Link></li>
          <li><Link href="/convenios" className="hover:text-red-600">Convênios</Link></li>
          <li><Link href="/parceiros" className="hover:text-red-600">Gestão de Parceiros</Link></li>
          <li><Link href="/produtos" className="hover:text-red-600">Catálogo de Produtos</Link></li>
          <li><Link href="/estoque" className="hover:text-red-600">Entrada de Estoque</Link></li>
          <li><Link href="/modalidades" className="hover:text-red-600">Modalidades</Link></li>
          <li><Link href="/turmas" className="hover:text-red-600">Turmas</Link></li>
          <li><Link href="/professores" className="hover:text-red-600">Professores</Link></li>
        </ul>
      </div>
    </aside>
  )
}