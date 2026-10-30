"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase"; // Ajuste o caminho se necessário
import {
  Home,
  DollarSign,
  UserPlus,
  ShoppingBag,
  Calendar,
  Bell,
  Receipt,
  BarChart3,
  Database,
  Users,
  Key,
  Handshake,
  Package,
  Boxes,
  GraduationCap,
  School,
  UserCog,
  Menu,
  X,
  Gift,
  FileText,
} from "lucide-react";

const menuAtendimento = [
  { href: "/dashboard", icon: Home, label: "Visão Geral" },
  { href: "/caixa", icon: DollarSign, label: "Controle de Caixa" },
  { href: "/matricula", icon: UserPlus, label: "Matrícula" },
  { href: "/pdv", icon: ShoppingBag, label: "PDV" },
  { href: "/mensalidades", icon: Calendar, label: "Mensalidades" },
  { href: "/alertas", icon: Bell, label: "Central de Alertas" },
  { href: "/imprimir-recibos", icon: Receipt, label: "Imprimir Recibos" },
];

const menuAdmin = [
  { href: "/financeiro", icon: BarChart3, label: "Painel Financeiro" },
  { href: "/registros", icon: Database, label: "Central de Registros" },
  { href: "/relatorios", icon: Users, label: "Central de Relatórios" },
  { href: "/operadores", icon: Key, label: "Operadores" },
  { href: "/convenios", icon: Handshake, label: "Convênios" },
  { href: "/escolas", icon: School, label: "Escolas Parceiras" },
  { href: "/parceiros", icon: Package, label: "Gestão de Parceiros" },
  { href: "/produtos", icon: Boxes, label: "Catálogo de Produtos" },
  { href: "/estoque", icon: Package, label: "Entrada de Estoque" },
  { href: "/sorteios", icon: Gift, label: "Sorteios / Promoções" },
  { href: "/termos-pendentes", icon: FileText, label: "Termos Pendentes" },
  { href: "/modalidades", icon: GraduationCap, label: "Modalidades" },
  { href: "/turmas", icon: School, label: "Turmas" },
  { href: "/professores", icon: UserCog, label: "Professores" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [escolasPendentes, setEscolasPendentes] = useState(0);

  useEffect(() => {
    async function checkPendentes() {
      // Busca alunos com status "pendente" (Ajuste a regra se necessário)
      const { count } = await supabase
        .from("alunos")
        .select("*", { count: "exact", head: true })
        .eq("status", "pendente");
      
      setEscolasPendentes(count || 0);
    }
    checkPendentes();
  }, [pathname]); // Recarrega a contagem a cada troca de página

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);
  const isActive = (href: string) => pathname === href;

  return (
    <>
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 md:hidden bg-red-700 text-white p-2 rounded-lg shadow-lg hover:bg-red-800 transition"
      >
        <Menu size={20} />
      </button>

      <aside
        className={`fixed top-0 left-0 h-screen bg-black text-white shadow-2xl border-r border-red-900 transition-all duration-300 z-40
        ${isCollapsed ? "w-20" : "w-72"} md:w-72 md:translate-x-0 -translate-x-full md:relative`}
      >
        <div className="flex justify-between items-center p-5 border-b border-red-900">
          <div className="flex items-center gap-3">
            <div className="bg-red-700 p-2 rounded-xl">
              <img src="/logo-color.png" alt="Logo CT Okinawa" className="h-8 w-auto" />
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="text-xl font-bold tracking-wide text-white">CT OKINAWA</h1>
                <p className="text-xs text-red-400">Disciplina e Respeito</p>
              </div>
            )}
          </div>
          <button
            onClick={toggleSidebar}
            className="text-gray-400 hover:text-red-400 transition cursor-pointer"
          >
            {isCollapsed ? <Menu size={18} /> : <X size={18} />}
          </button>
        </div>

        <div className="flex-1 py-6 overflow-y-auto h-[calc(100vh-80px)]">
          <div className="px-4 mb-3 text-xs font-semibold text-red-500 uppercase tracking-wider">
            {!isCollapsed ? "Atendimento" : "A"}
          </div>
          <div className="space-y-1">
            {menuAtendimento.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                  isActive(item.href)
                    ? "bg-red-700 text-white shadow-md"
                    : "text-gray-300 hover:bg-red-900/30 hover:text-red-400"
                }`}
              >
                <item.icon size={18} />
                {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
              </Link>
            ))}
          </div>

          <div className="px-4 mt-6 mb-3 text-xs font-semibold text-red-500 uppercase tracking-wider">
            {!isCollapsed ? "Administrativo" : "A"}
          </div>
          <div className="space-y-1">
            {menuAdmin.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between mx-2 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                  isActive(item.href)
                    ? "bg-red-700 text-white shadow-md"
                    : "text-gray-300 hover:bg-red-900/30 hover:text-red-400"
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon size={18} />
                  {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
                </div>
                {/* BADGE VERMELHO AQUI */}
                {item.href === "/escolas" && escolasPendentes > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {escolasPendentes}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-red-900 text-center text-xs text-gray-500">
          {!isCollapsed && (
            <>
              {new Date().getFullYear()} © CT Okinawa<br />
              Versão 2.0
            </>
          )}
        </div>
      </aside>

      {!isCollapsed && (
        <div
          className="fixed inset-0 bg-black/70 z-30 md:hidden"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
}