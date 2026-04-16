import "./globals.css"
import { StoreProvider } from "../lib/store"
import { DataProvider } from "@/hooks/useData"
import MenuCT from "../componentes/menu"

export const metadata = {
  title: "CT Okinawa",
  description: "Sistema",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>
        <StoreProvider>
          <DataProvider> {/* 👈 AQUI ESTÁ O SEGREDO */}
            
            <div style={{ display: "flex" }}>
              
              {/* MENU */}
              <MenuCT />

              {/* CONTEÚDO */}
              <div style={{ flex: 1, padding: 20 }}>
                {children}
              </div>

            </div>

          </DataProvider>
        </StoreProvider>
      </body>
    </html>
  )
}