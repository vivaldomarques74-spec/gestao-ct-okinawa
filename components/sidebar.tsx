"use client"

import Link from "next/link"

export default function Sidebar() {
  return (
    <aside className="w-64 h-screen bg-zinc-950 border-r border-red-900 p-4 text-white">
      <h1 className="text-xl font-bold text-red-600 mb-6">
        CT OKINAWA
      </h1>

      <div className="mb-6">
        <p className="text-xs text-zinc-400 mb-2">
          ATENDIMENTO
        </p>

        <ul className="space-y-2">
          <li>
            <Link href="/">
              Visão Geral
            </Link>
          </li>

          <li>
            <Link href="/caixa">
              Controle de Caixa
            </Link>
          </li>

          <li>
            <Link href="/matricula">
              Matrícula
            </Link>
          </li>

          <li>
            <Link href="/pdv">
              PDV
            </Link>
          </li>

          <li>
            <Link href="/mensalidades">
              Mensalidades
            </Link>
          </li>

          <li>
            <Link href="/alertas">
              Central de Alertas
            </Link>
          </li>

          <li>
            <Link href="/imprimir-recibos">
              Imprimir Recibos
            </Link>
          </li>
        </ul>
      </div>

      <div>
        <p className="text-xs text-zinc-400 mb-2">
          PAINEL ADMINISTRATIVO
        </p>

        <ul className="space-y-2">

          <li>
            <Link href="/financeiro">
              Painel Financeiro
            </Link>
          </li>

          <li>
            <Link href="/registros">
              Central de Registros
            </Link>
          </li>

          <li>
            <Link href="/relatorios">
              Central de Relatórios
            </Link>
          </li>

          <li>
            <Link href="/operadores">
              Operadores
            </Link>
          </li>

          <li>
            <Link href="/parceiros">
              Gestão de Parceiros
            </Link>
          </li>

          <li>
            <Link href="/produtos">
              Catálogo de Produtos
            </Link>
          </li>

          <li>
            <Link href="/estoque">
              Entrada de Estoque
            </Link>
          </li>

          <li>
            <Link href="/modalidades">
              Modalidades
            </Link>
          </li>

          <li>
            <Link href="/turmas">
              Turmas
            </Link>
          </li>

          <li>
            <Link href="/professores">
              Professores
            </Link>
          </li>

        </ul>
      </div>
    </aside>
  )
}