"use client"

import "./globals.css"
import Sidebar from "@/components/sidebar"
import LoginGuard from "@/components/LoginGuard"
import { usePathname } from "next/navigation"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const semMenu =
    pathname === "/presenca" ||
    pathname?.startsWith("/parceiros/dashboard")

  return (
    <html lang="pt-br">
      <body className="flex bg-gray-50">
        <LoginGuard>
          {!semMenu && <Sidebar />}
          <main className="flex-1 p-6">{children}</main>
        </LoginGuard>
      </body>
    </html>
  )
}