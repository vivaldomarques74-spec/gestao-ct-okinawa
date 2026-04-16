"use client"

import "./globals.css"
import { ReactNode } from "react"
import { StoreProvider } from "@/lib/store"

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="pt-br">
      <body>
        <StoreProvider>
          {children}
        </StoreProvider>
      </body>
    </html>
  )
}