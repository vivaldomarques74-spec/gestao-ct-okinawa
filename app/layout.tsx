"use client";

import "./globals.css";
import Sidebar from "@/components/sidebar";
import { usePathname } from "next/navigation";
import LoginGuard from "@/components/LoginGuard";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Verifica se a URL tem algo depois de /escolas/ (ex: /escolas/ESC-TESTE)
  const isRotaPublicaEscola = pathname?.startsWith("/escolas/") && pathname !== "/escolas" && pathname !== "/escolas/";

  // Rotas onde NÃO deve aparecer o menu lateral
  const semMenu =
    pathname === "/presenca" || 
    pathname?.startsWith("/parceiros/dashboard") || 
    isRotaPublicaEscola;

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