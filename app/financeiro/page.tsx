"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'
import { Bar, Pie } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement)

export default function Financeiro() {
  const [periodo, setPeriodo] = useState("mes")
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")
  const [totais, setTotais] = useState({
    geral: 0,
    matriculas: 0,
    mensalidades: 0,
    vendas: 0,
  })
  const [movimentacoes, setMovimentacoes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    definirPeriodoPadrao()
  }, [])

  useEffect(() => {
    carregarDados()
  }, [dataInicio, dataFim])

  function definirPeriodoPadrao() {
    const hoje = new Date()
    let inicio = new Date()
    if (periodo === "dia") {
      inicio.setHours(0,0,0,0)
      setDataInicio(inicio.toISOString().slice(0,10))
      setDataFim(hoje.toISOString().slice(0,10))
    } else if (periodo === "mes") {
      inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
      setDataInicio(inicio.toISOString().slice(0,10))
      setDataFim(hoje.toISOString().slice(0,10))
    } else if (periodo === "ano") {
      inicio = new Date(hoje.getFullYear(), 0, 1)
      setDataInicio(inicio.toISOString().slice(0,10))
      setDataFim(hoje.toISOString().slice(0,10))
    }
  }

  async function carregarDados() {
    if (!dataInicio || !dataFim) return
    setLoading(true)

    let query = supabase
      .from("caixa")
      .select("*")
      .eq("cancelado", false)
      .gte("data", `${dataInicio}T00:00:00`)
      .lte("data", `${dataFim}T23:59:59`)

    const { data, error } = await query
    if (error) {
      console.error(error)
      setLoading(false)
      return
    }

    const movs = data || []
    setMovimentacoes(movs)

    let geral = 0, mats = 0, mens = 0, vend = 0
    movs.forEach(item => {
      const valor = Number(item.valor)
      geral += valor
      if (item.tipo === "matricula") mats += valor
      else if (item.tipo === "mensalidade") mens += valor
      else if (item.tipo === "venda") vend += valor
    })
    setTotais({ geral, matriculas: mats, mensalidades: mens, vendas: vend })
    setLoading(false)
  }

  const handlePeriodoChange = (novoPeriodo: string) => {
    setPeriodo(novoPeriodo)
    definirPeriodoPadrao()
  }

  // Dados para gráfico de barras (movimentações diárias)
  const movimentosPorDia = movimentacoes.reduce((acc: any, mov) => {
    const dia = new Date(mov.data).toLocaleDateString()
    if (!acc[dia]) acc[dia] = { matricula: 0, mensalidade: 0, venda: 0, total: 0 }
    acc[dia][mov.tipo] += Number(mov.valor)
    acc[dia].total += Number(mov.valor)
    return acc
  }, {})

  const labels = Object.keys(movimentosPorDia)
  const dadosMatricula = labels.map(d => movimentosPorDia[d].matricula)
  const dadosMensalidade = labels.map(d => movimentosPorDia[d].mensalidade)
  const dadosVenda = labels.map(d => movimentosPorDia[d].venda)

  const chartData = {
    labels,
    datasets: [
      { label: 'Matrículas', data: dadosMatricula, backgroundColor: '#3b82f6' },
      { label: 'Mensalidades', data: dadosMensalidade, backgroundColor: '#10b981' },
      { label: 'Vendas PDV', data: dadosVenda, backgroundColor: '#f59e0b' },
    ],
  }

  // Dados para gráfico de pizza (proporção por tipo)
  const pieData = {
    labels: ['Matrículas', 'Mensalidades', 'Vendas'],
    datasets: [{
      data: [totais.matriculas, totais.mensalidades, totais.vendas],
      backgroundColor: ['#3b82f6', '#10b981', '#f59e0b'],
    }],
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Painel Financeiro</h1>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-xl shadow mb-6 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-sm font-semibold mb-1">Período</label>
          <select className="p-2 border rounded" value={periodo} onChange={e => handlePeriodoChange(e.target.value)}>
            <option value="dia">Hoje</option>
            <option value="mes">Mês atual</option>
            <option value="ano">Ano atual</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Data Início</label>
          <input type="date" className="p-2 border rounded" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Data Fim</label>
          <input type="date" className="p-2 border rounded" value={dataFim} onChange={e => setDataFim(e.target.value)} />
        </div>
        <button onClick={carregarDados} className="bg-red-600 text-white px-4 py-2 rounded">Filtrar</button>
      </div>

      {/* Cards */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl shadow">
          <p className="text-gray-500 text-sm">Total Geral</p>
          <p className="text-3xl font-bold">R$ {totais.geral.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow">
          <p className="text-gray-500 text-sm">Matrículas</p>
          <p className="text-3xl font-bold text-blue-600">R$ {totais.matriculas.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow">
          <p className="text-gray-500 text-sm">Mensalidades</p>
          <p className="text-3xl font-bold text-green-600">R$ {totais.mensalidades.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow">
          <p className="text-gray-500 text-sm">Vendas (PDV)</p>
          <p className="text-3xl font-bold text-orange-600">R$ {totais.vendas.toFixed(2)}</p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-xl shadow">
          <h2 className="font-semibold text-lg mb-4">Movimentação Diária</h2>
          {movimentacoes.length > 0 ? (
            <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: true }} />
          ) : (
            <p className="text-gray-400">Nenhum dado no período.</p>
          )}
        </div>
        <div className="bg-white p-4 rounded-xl shadow">
          <h2 className="font-semibold text-lg mb-4">Distribuição por Tipo</h2>
          {totais.geral > 0 ? (
            <Pie data={pieData} options={{ responsive: true, maintainAspectRatio: true }} />
          ) : (
            <p className="text-gray-400">Sem receitas no período.</p>
          )}
        </div>
      </div>

      {/* Tabela de últimas movimentações */}
      <div className="mt-8 bg-white rounded-xl shadow overflow-hidden">
        <h2 className="font-semibold text-lg p-4 border-b">Últimas Movimentações</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">Data</th>
                <th className="p-3 text-left">Tipo</th>
                <th className="p-3 text-left">Descrição</th>
                <th className="p-3 text-left">Valor</th>
              </tr>
            </thead>
            <tbody>
              {movimentacoes.slice(0, 10).map(mov => (
                <tr key={mov.id} className="border-t">
                  <td className="p-3">{new Date(mov.data).toLocaleDateString()}</td>
                  <td className="p-3 capitalize">{mov.tipo}</td>
                  <td className="p-3">{mov.descricao || mov.nome || '-'}</td>
                  <td className="p-3">R$ {Number(mov.valor).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}