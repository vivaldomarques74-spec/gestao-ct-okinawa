import "./globals.css"

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
        <div style={{ padding: 10, borderBottom: "1px solid #ccc" }}>
          <a href="/">Home</a> |{" "}
          <a href="/alunos">Alunos</a> |{" "}
          <a href="/professores">Professores</a> |{" "}
          <a href="/turmas">Turmas</a> |{" "}
          <a href="/vendas">Vendas</a>
        </div>

        {children}
      </body>
    </html>
  )
}