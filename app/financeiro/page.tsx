"use client"

import { useEffect, useMemo, useState } from "react"

export default function FinanceiroPage() {
  const [autorizado, setAutorizado] = useState(false)
  const [mesFiltro, setMesFiltro] = useState("")

  const [mensalidades, setMensalidades] = useState<any[]>([])
  const [matriculas, setMatriculas] = useState<any[]>([])
  const [vendas, setVendas] = useState<any[]>([])

  useEffect(() => {
    const senha = prompt("Digite a senha do financeiro:")
    if (senha === "170296") {
      setAutorizado(true)
    } else {
      alert("Acesso negado")
    }

    // 🔥 Pegando dados do localStorage (ajuste se usar outro lugar)
    setMensalidades(JSON.parse(localStorage.getItem("mensalidades") || "[]"))
    setMatriculas(JSON.parse(localStorage.getItem("matriculas") || "[]"))
    setVendas(JSON.parse(localStorage.getItem("vendas") || "[]"))
  }, [])

  function filtrarPorMes(lista: any[]) {
    if (!mesFiltro) return lista
    return lista.filter((item) => {
      const data = new Date(item.data)
      const mes = (data.getMonth() + 1).toString().padStart(2, "0")
      return mes === mesFiltro
    })
  }

  const mensalidadesFiltradas = useMemo(() => filtrarPorMes(mensalidades), [mensalidades, mesFiltro])
  const matriculasFiltradas = useMemo(() => filtrarPorMes(matriculas), [matriculas, mesFiltro])
  const vendasFiltradas = useMemo(() => filtrarPorMes(vendas), [vendas, mesFiltro])

  const totalMensalidades = mensalidadesFiltradas.reduce((acc, m) => acc + Number(m.valor || 0), 0)
  const totalMatriculas = matriculasFiltradas.reduce((acc, m) => acc + Number(m.valor || 0), 0)
  const totalVendas = vendasFiltradas.reduce((acc, v) => acc + Number(v.valor || 0), 0)

  const totalGeral = totalMensalidades + totalMatriculas + totalVendas

  const valorCT = (totalMensalidades + totalMatriculas) * 0.5
  const valorCTVendas = totalVendas * 0.7

  const valorPorProfessor: Record<string, number> = {}

  mensalidadesFiltradas.forEach((m) => {
    if (!m.professor) return
    if (!valorPorProfessor[m.professor]) valorPorProfessor[m.professor] = 0
    valorPorProfessor[m.professor] += Number(m.valor || 0) * 0.5
  })

  matriculasFiltradas.forEach((m) => {
    if (!m.professor) return
    if (!valorPorProfessor[m.professor]) valorPorProfessor[m.professor] = 0
    valorPorProfessor[m.professor] += Number(m.valor || 0) * 0.5
  })

  const valorPorParceiro: Record<string, number> = {}

  vendasFiltradas.forEach((v) => {
    if (!v.parceiro) return
    if (!valorPorParceiro[v.parceiro]) valorPorParceiro[v.parceiro] = 0
    valorPorParceiro[v.parceiro] += Number(v.valor || 0) * 0.3
  })

  if (!autorizado) return null

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">💰 Financeiro</h1>

      {/* Filtro */}
      <div>
        <label>Filtrar por mês: </label>
        <select value={mesFiltro} onChange={(e) => setMesFiltro(e.target.value)}>
          <option value="">Todos</option>
          <option value="01">Janeiro</option>
          <option value="02">Fevereiro</option>
          <option value="03">Março</option>
          <option value="04">Abril</option>
          <option value="05">Maio</option>
          <option value="06">Junho</option>
          <option value="07">Julho</option>
          <option value="08">Agosto</option>
          <option value="09">Setembro</option>
          <option value="10">Outubro</option>
          <option value="11">Novembro</option>
          <option value="12">Dezembro</option>
        </select>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card title="Total Geral" value={totalGeral} />
        <Card title="Mensalidades" value={totalMensalidades} />
        <Card title="Matrículas" value={totalMatriculas} />
        <Card title="Vendas" value={totalVendas} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card title="CT (Mensalidades+Matrículas)" value={valorCT} />
        <Card title="CT Vendas" value={valorCTVendas} />
      </div>

      {/* Professores */}
      <div>
        <h2 className="text-xl font-semibold">👨‍🏫 Professores</h2>
        {Object.entries(valorPorProfessor).map(([nome, valor]) => (
          <p key={nome}>{nome}: R$ {valor.toFixed(2)}</p>
        ))}
      </div>

      {/* Parceiros */}
      <div>
        <h2 className="text-xl font-semibold">🤝 Parceiros</h2>
        {Object.entries(valorPorParceiro).map(([nome, valor]) => (
          <p key={nome}>{nome}: R$ {valor.toFixed(2)}</p>
        ))}
      </div>
    </div>
  )
}

function Card({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-gray-900 text-white p-4 rounded-2xl shadow">
      <p className="text-sm">{title}</p>
      <h2 className="text-xl font-bold">R$ {value.toFixed(2)}</h2>
    </div>
  )
}
