"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from "../../lib/supabase"
import AdminGuard from "../../components/AdminGuard"

export default function RelatoriosPage() {
  const [aba, setAba] = useState("professores")
  const [loading, setLoading] = useState(false)

  const [dados, setDados] = useState<any[]>([])
  const [professores, setProfessores] = useState<any[]>([])
  const [turmas, setTurmas] = useState<any[]>([])
  const [parceiros, setParceiros] = useState<any[]>([])

  const [professor, setProfessor] = useState("")
  const [turma, setTurma] = useState("")
  const [parceiro, setParceiro] = useState("")

  const [inicio, setInicio] = useState("")
  const [fim, setFim] = useState("")

  useEffect(() => {
    carregarBases()
  }, [])

  useEffect(() => {
    carregar()
  }, [aba, professor, turma, parceiro, inicio, fim])

  async function carregarBases() {
    const { data: p } = await supabase
      .from("professores")
      .select("*")
      .order("nome")

    const { data: t } = await supabase
      .from("turmas")
      .select("*")
      .order("nome")

    const { data: pr } = await supabase
      .from("parceiros")
      .select("*")
      .order("nome")

    setProfessores(p || [])
    setTurmas(t || [])
    setParceiros(pr || [])
  }

  function dentroPeriodo(base: any) {
    if (!base) return true

    const data = new Date(base)

    let inicioOk = true
    let fimOk = true

    if (inicio) inicioOk = data >= new Date(inicio)

    if (fim) {
      const final = new Date(fim)
      final.setHours(23, 59, 59)
      fimOk = data <= final
    }

    return inicioOk && fimOk
  }

  function periodoProfessor(dataBase: any) {
    const data = new Date(dataBase)

    if (inicio || fim) return dentroPeriodo(data)

    const hoje = new Date()

    const fimCiclo = new Date(
      hoje.getFullYear(),
      hoje.getMonth(),
      9,
      23,
      59,
      59
    )

    const inicioCiclo = new Date(
      hoje.getFullYear(),
      hoje.getMonth() - 1,
      10,
      0,
      0,
      0
    )

    return data >= inicioCiclo && data <= fimCiclo
  }

  async function carregar() {
    setLoading(true)
    setDados([])

    // =====================================
    // PROFESSORES
    // =====================================
    if (aba === "professores") {
      let query = supabase
        .from("caixa")
        .select("*")
        .in("tipo", ["matricula", "mensalidade"])

      if (professor) {
        query = query.eq("professor", professor)
      }

      const { data } = await query

      const filtrado = (data || []).filter((item) =>
        periodoProfessor(
          item.created_at ||
            item.data_pagamento ||
            item.data
        )
      )

      const final = filtrado.map((item) => ({
        ...item,
        valor_comissao:
          Number(item.valor_base || item.valor || 0) * 0.5,
      }))

      setDados(final)
    }

    // =====================================
    // PRESENÇA
    // =====================================
    if (aba === "presenca") {
      let query = supabase
        .from("presencas")
        .select("*")
        .order("created_at", {
          ascending: false,
        })

      if (turma) query = query.eq("turma", turma)

      const { data } = await query

      const filtrado = (data || []).filter((item) =>
        dentroPeriodo(
          item.created_at || item.data
        )
      )

      setDados(filtrado)
    }

    // =====================================
    // PARCEIROS
    // =====================================
    if (aba === "parceiros") {
      let query = supabase
        .from("caixa")
        .select("*")
        .eq("tipo", "venda")

      const { data } = await query

      let filtrado = (data || []).filter((item) =>
        dentroPeriodo(
          item.created_at || item.data
        )
      )

      if (parceiro) {
        filtrado = filtrado.filter(
          (item) =>
            item.parceiro === parceiro ||
            item.parceiro_nome === parceiro
        )
      }

      setDados(filtrado)
    }

    setLoading(false)
  }

  const total = useMemo(() => {
    if (aba === "professores") {
      return dados.reduce(
        (acc, item) =>
          acc +
          Number(
            item.valor_comissao || 0
          ),
        0
      )
    }

    return dados.reduce(
      (acc, item) =>
        acc + Number(item.valor || 0),
      0
    )
  }, [dados, aba])

  const quantidade = dados.length

  function imprimir() {
    window.print()
  }

  function cabecalho() {
    if (aba === "presenca") {
      return (
        <tr>
          <th className="p-4 text-left">Data</th>
          <th className="p-4 text-left">Aluno</th>
          <th className="p-4 text-left">Turma</th>
          <th className="p-4 text-left">Professor</th>
        </tr>
      )
    }

    if (aba === "professores") {
      return (
        <tr>
          <th className="p-4 text-left">Data</th>
          <th className="p-4 text-left">Aluno</th>
          <th className="p-4 text-left">Tipo</th>
          <th className="p-4 text-left">Base</th>
          <th className="p-4 text-left">50%</th>
        </tr>
      )
    }

    return (
      <tr>
        <th className="p-4 text-left">Data</th>
        <th className="p-4 text-left">Nome</th>
        <th className="p-4 text-left">Tipo</th>
        <th className="p-4 text-left">Valor</th>
      </tr>
    )
  }

  function linhas() {
    if (loading) {
      return (
        <tr>
          <td colSpan={5} className="p-4">
            Carregando...
          </td>
        </tr>
      )
    }

    if (dados.length === 0) {
      return (
        <tr>
          <td colSpan={5} className="p-4">
            Nenhum dado encontrado
          </td>
        </tr>
      )
    }

    if (aba === "presenca") {
      return dados.map((item, i) => (
        <tr key={i} className="border-t">
          <td className="p-4">
            {new Date(
              item.created_at ||
                item.data
            ).toLocaleDateString()}
          </td>

          <td className="p-4">
            {item.nome}
          </td>

          <td className="p-4">
            {item.turma}
          </td>

          <td className="p-4">
            {item.professor}
          </td>
        </tr>
      ))
    }

    if (aba === "professores") {
      return dados.map((item, i) => (
        <tr key={i} className="border-t">
          <td className="p-4">
            {new Date(
              item.created_at ||
                item.data
            ).toLocaleDateString()}
          </td>

          <td className="p-4">
            {item.nome}
          </td>

          <td className="p-4 capitalize">
            {item.tipo}
          </td>

          <td className="p-4">
            R$ {Number(
              item.valor_base ||
                item.valor ||
                0
            ).toFixed(2)}
          </td>

          <td className="p-4 font-bold text-green-600">
            R$ {Number(
              item.valor_comissao || 0
            ).toFixed(2)}
          </td>
        </tr>
      ))
    }

    return dados.map((item, i) => (
      <tr key={i} className="border-t">
        <td className="p-4">
          {new Date(
            item.created_at ||
              item.data
          ).toLocaleDateString()}
        </td>

        <td className="p-4">
          {item.nome ||
            item.parceiro ||
            "-"}
        </td>

        <td className="p-4">
          {item.tipo}
        </td>

        <td className="p-4 font-bold">
          R$ {Number(
            item.valor || 0
          ).toFixed(2)}
        </td>
      </tr>
    ))
  }

  return (
    <AdminGuard>
      <div className="p-4 max-w-7xl mx-auto">

        <div className="flex justify-between gap-3 flex-wrap mb-6">
          <h1 className="text-2xl font-bold">
            Central de Relatórios
          </h1>

          <button
            onClick={imprimir}
            className="btn"
          >
            🖨️ Imprimir
          </button>
        </div>

        <div className="flex gap-2 flex-wrap mb-6">

          <button
            onClick={() =>
              setAba("professores")
            }
            className={`tab ${
              aba === "professores"
                ? "ativo"
                : ""
            }`}
          >
            Professores
          </button>

          <button
            onClick={() =>
              setAba("presenca")
            }
            className={`tab ${
              aba === "presenca"
                ? "ativo"
                : ""
            }`}
          >
            Presença
          </button>

          <button
            onClick={() =>
              setAba("parceiros")
            }
            className={`tab ${
              aba === "parceiros"
                ? "ativo"
                : ""
            }`}
          >
            Parceiros
          </button>

        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-6">

          {aba === "professores" && (
            <select
              className="input"
              value={professor}
              onChange={(e) =>
                setProfessor(
                  e.target.value
                )
              }
            >
              <option value="">
                Todos professores
              </option>

              {professores.map(
                (item, i) => (
                  <option key={i}>
                    {item.nome}
                  </option>
                )
              )}
            </select>
          )}

          {aba === "presenca" && (
            <select
              className="input"
              value={turma}
              onChange={(e) =>
                setTurma(
                  e.target.value
                )
              }
            >
              <option value="">
                Todas turmas
              </option>

              {turmas.map(
                (item, i) => (
                  <option key={i}>
                    {item.nome}
                  </option>
                )
              )}
            </select>
          )}

          {aba === "parceiros" && (
            <select
              className="input"
              value={parceiro}
              onChange={(e) =>
                setParceiro(
                  e.target.value
                )
              }
            >
              <option value="">
                Todos parceiros
              </option>

              {parceiros.map(
                (item, i) => (
                  <option key={i}>
                    {item.nome}
                  </option>
                )
              )}
            </select>
          )}

          <input
            type="date"
            className="input"
            value={inicio}
            onChange={(e) =>
              setInicio(
                e.target.value
              )
            }
          />

          <input
            type="date"
            className="input"
            value={fim}
            onChange={(e) =>
              setFim(
                e.target.value
              )
            }
          />

        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-6">

          <div className="card">
            <small>Quantidade</small>
            <h2>{quantidade}</h2>
          </div>

          <div className="card">
            <small>
              Total Geral
            </small>
            <h2>
              R$ {total.toFixed(2)}
            </h2>
          </div>

        </div>

        <div className="bg-white rounded-2xl shadow overflow-auto">

          <table className="w-full text-black">
            <thead className="bg-gray-100">
              {cabecalho()}
            </thead>

            <tbody>{linhas()}</tbody>
          </table>

        </div>

        <style jsx>{`
          .input {
            width: 100%;
            padding: 14px;
            border: 1px solid #ccc;
            border-radius: 10px;
            background: white;
          }

          .btn {
            background: red;
            color: white;
            padding: 12px 16px;
            border-radius: 10px;
          }

          .tab {
            background: white;
            color: black;
            padding: 10px 16px;
            border-radius: 10px;
            border: 1px solid #ddd;
          }

          .ativo {
            background: red;
            color: white;
            border-color: red;
          }

          .card {
            background: white;
            padding: 24px;
            border-radius: 18px;
            box-shadow: 0 2px 10px rgba(0,0,0,.08);
          }

          .card h2 {
            font-size: 2rem;
            font-weight: bold;
            margin-top: 10px;
          }

          @media print {
            button,
            select,
            input {
              display: none !important;
            }
          }
        `}</style>

      </div>
    </AdminGuard>
  )
}