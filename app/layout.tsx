import "./globals.css"
import Sidebar from "@/components/sidebar"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-br">
      <body className="flex bg-black text-white">
        <Sidebar />
        <main className="flex-1 p-6">
          {children}
        </main>
      </body>
    </html>
  )
}