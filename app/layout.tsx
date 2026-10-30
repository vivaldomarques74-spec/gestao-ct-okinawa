"use client";

import "./globals.css";
import Sidebar from "@/components/sidebar";
import { usePathname } from "next/navigation";
import LoginGuard from "@/components/LoginGuard"; // <--- IMPORTANDO O NOME CORRETO

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Rotas onde NÃO deve aparecer o menu lateral
  const semMenu =
    pathname === "/presenca" || 
    pathname?.startsWith("/parceiros/dashboard") || 
    pathname?.startsWith("/escola"); // <--- ADICIONADO AQUI

  return (
    <html lang="pt-br">
      <body className="flex bg-gray-50">
        <LoginGuard>
          {!semMenu && <Sidebar />}
          <main className={`flex-1 ${semMenu ? '' : 'p-6'}`}>{children}</main>
        </LoginGuard>
      </body>
    </html>
  );
}