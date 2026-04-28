"use client"

import "./globals.css"
import Sidebar from "@/components/sidebar"
import { usePathname } from "next/navigation"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const semMenu =
    pathname === "/presenca"

  return (
    <html lang="pt-br">
      <body className="flex bg-black text-white">

        {!semMenu && <Sidebar />}

        <main className="flex-1 p-6">
          {children}
        </main>

      </body>
    </html>
  )
}