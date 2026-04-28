"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from "../../lib/supabase"
import AdminGuard from "../../components/AdminGuard"

export default function RegistrosPage() {
  const [aba, setAba] = useState("alunos")

  const [busca, setBusca] = useState("")
  const [alunos, setAlunos] = useState<any[]>([])
  const [selecionado, setSelecionado] = useState<any>(null)

  const [mensalidades, setMensalidades] = useState<any[]>([])
  const [vendas, setVendas] = useState<any[]>([])

  const [modalidades, setModalidades] = useState<any[]>([])
  const [turmas, setTurmas] = useState<any[]>([])

  const [form, setForm] = useState<any>({
    nome: "",
    cpf: "",
    whatsapp: "",
    endereco: "",
    status: "Ativo",
    modalidade: "",
    turma: "",
  })

  useEffect(() => {
    iniciar()
  }, [])

  const iniciar = async () => {
    await carregarBases()
    await carregarAlunos()
    await carregarMensalidades()
    await carregarVendas()
  }

  const carregarBases = async () => {
    const { data: mods } = await supabase
      .from("modalidades")
      .select("*")
      .order("nome")

    const { data: trs } = await supabase
      .from("turmas")
      .select("*")
      .order("nome")

    setModalidades(mods || [])
    setTurmas(trs || [])
  }

  const carregarAlunos = async () => {
    const { data } = await supabase
      .from("alunos")
      .select("*")
      .order("nome")

    setAlunos(data || [])
  }

  const carregarMensalidades = async () => {
    const { data } = await supabase
      .from("mensalidades")
      .select("*")
      .order("vencimento", {
        ascending: false,
      })

    setMensalidades(data || [])
  }

  const carregarVendas = async () => {
    const { data } = await supabase
      .from("caixa")
      .select("*")
      .eq("tipo", "venda")
      .order("created_at", {
        ascending: false,
      })

    setVendas(data || [])
  }

  const buscarAlunos = useMemo(() => {
    return alunos.filter((a) =>
      (a.nome || "")
        .toLowerCase()
        .includes(busca.toLowerCase())
    )
  }, [alunos, busca])

  const abrirAluno = async (aluno: any) => {
    const { data: mat } = await supabase
      .from("matriculas")
      .select("*")
      .eq("aluno_id", aluno.id)
      .limit(1)
      .single()

    setSelecionado(aluno)

    setForm({
      nome: aluno.nome || "",
      cpf: aluno.cpf || "",
      whatsapp: aluno.whatsapp || "",
      endereco: aluno.endereco || "",
      status: aluno.status || "Ativo",
      modalidade: mat?.modalidade || "",
      turma: mat?.turma || "",
    })
  }

  const salvarAluno = async () => {
    if (!selecionado) return

    await supabase
      .from("alunos")
      .update({
        nome: form.nome,
        cpf: form.cpf,
        whatsapp: form.whatsapp,
        endereco: form.endereco,
        status: form.status,
      })
      .eq("id", selecionado.id)

    const { data: mat } = await supabase
      .from("matriculas")
      .select("id")
      .eq("aluno_id", selecionado.id)
      .limit(1)
      .single()

    if (mat) {
      await supabase
        .from("matriculas")
        .update({
          modalidade: form.modalidade,
          turma: form.turma,
        })
        .eq("id", mat.id)
    } else {
      await supabase
        .from("matriculas")
        .insert([
          {
            aluno_id: selecionado.id,
            modalidade: form.modalidade,
            turma: form.turma,
          },
        ])
    }

    alert("Aluno atualizado")
    carregarAlunos()
  }

  const excluirAluno = async (id: any) => {
    if (!confirm("Excluir aluno?")) return

    await supabase
      .from("matriculas")
      .delete()
      .eq("aluno_id", id)

    await supabase
      .from("mensalidades")
      .delete()
      .eq("aluno_id", id)

    await supabase
      .from("alunos")
      .delete()
      .eq("id", id)

    setSelecionado(null)
    carregarAlunos()
  }

  const pagarMensalidade = async (
    item: any
  ) => {
    await supabase
      .from("mensalidades")
      .update({
        status: "pago",
      })
      .eq("id", item.id)

    carregarMensalidades()
  }

  const apagarMensalidade = async (
    id: any
  ) => {
    if (!confirm("Apagar mensalidade?"))
      return

    await supabase
      .from("mensalidades")
      .delete()
      .eq("id", id)

    carregarMensalidades()
  }

  const apagarVenda = async (id: any) => {
    if (!confirm("Apagar venda?"))
      return

    await supabase
      .from("caixa")
      .delete()
      .eq("id", id)

    carregarVendas()
  }

  const totalVendas = vendas.reduce(
    (acc, item) =>
      acc + Number(item.valor || 0),
    0
  )

  const inadimplentes =
    mensalidades.filter(
      (m) =>
        m.status === "pendente"
    ).length

  return (
    <AdminGuard>
      <div className="p-6 max-w-7xl mx-auto">

        <h1 className="text-3xl font-bold mb-6">
          Central de Registros
        </h1>

        <div className="grid grid-cols-4 gap-3 mb-6">
          <button
            onClick={() =>
              setAba("alunos")
            }
            className="tab"
          >
            Alunos
          </button>

          <button
            onClick={() =>
              setAba(
                "mensalidades"
              )
            }
            className="tab"
          >
            Mensalidades
          </button>

          <button
            onClick={() =>
              setAba("vendas")
            }
            className="tab"
          >
            Vendas
          </button>

          <button
            onClick={() =>
              setAba(
                "dashboard"
              )
            }
            className="tab"
          >
            Dashboard
          </button>
        </div>

        {aba === "alunos" && (
          <div className="card">

            <input
              className="input mb-4"
              placeholder="Buscar aluno"
              value={busca}
              onChange={(e) =>
                setBusca(
                  e.target.value
                )
              }
            />

            <div className="grid md:grid-cols-2 gap-6">

              <div>
                {buscarAlunos.map(
                  (a: any) => (
                    <div
                      key={a.id}
                      onClick={() =>
                        abrirAluno(a)
                      }
                      className="linha"
                    >
                      {a.nome}
                    </div>
                  )
                )}
              </div>

              {selecionado && (
                <div className="space-y-3">

                  <input
                    className="input"
                    value={form.nome}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        nome:
                          e.target
                            .value,
                      })
                    }
                  />

                  <input
                    className="input"
                    value={form.cpf}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        cpf:
                          e.target
                            .value,
                      })
                    }
                  />

                  <input
                    className="input"
                    value={
                      form.whatsapp
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        whatsapp:
                          e.target
                            .value,
                      })
                    }
                  />

                  <input
                    className="input"
                    value={
                      form.endereco
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        endereco:
                          e.target
                            .value,
                      })
                    }
                  />

                  <select
                    className="input"
                    value={
                      form.status
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        status:
                          e.target
                            .value,
                      })
                    }
                  >
                    <option>
                      Ativo
                    </option>
                    <option>
                      Bloqueado
                    </option>
                    <option>
                      Inativo
                    </option>
                  </select>

                  <select
                    className="input"
                    value={
                      form.modalidade
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        modalidade:
                          e.target
                            .value,
                        turma:
                          "",
                      })
                    }
                  >
                    <option value="">
                      Modalidade
                    </option>

                    {modalidades.map(
                      (
                        m: any
                      ) => (
                        <option
                          key={
                            m.id
                          }
                          value={
                            m.nome
                          }
                        >
                          {m.nome}
                        </option>
                      )
                    )}
                  </select>

                  <select
                    className="input"
                    value={
                      form.turma
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        turma:
                          e.target
                            .value,
                      })
                    }
                  >
                    <option value="">
                      Turma
                    </option>

                    {turmas
                      .filter(
                        (
                          t: any
                        ) =>
                          t.modalidade ===
                          form.modalidade
                      )
                      .map(
                        (
                          t: any
                        ) => (
                          <option
                            key={
                              t.id
                            }
                            value={
                              t.nome
                            }
                          >
                            {
                              t.nome
                            }
                          </option>
                        )
                      )}
                  </select>

                  <button
                    onClick={
                      salvarAluno
                    }
                    className="btn red"
                  >
                    Salvar
                  </button>

                  <button
                    onClick={() =>
                      excluirAluno(
                        selecionado.id
                      )
                    }
                    className="btn black"
                  >
                    Excluir
                  </button>

                </div>
              )}

            </div>
          </div>
        )}

        {aba ===
          "mensalidades" && (
          <div className="card">

            {mensalidades.map(
              (m: any) => (
                <div
                  key={m.id}
                  className="linha between"
                >
                  <div>
                    {m.nome} - R$
                    {m.valor}
                    <br />
                    <small>
                      {
                        m.status
                      }
                    </small>
                  </div>

                  <div className="flex gap-2">
                    {m.status !==
                      "pago" && (
                      <button
                        onClick={() =>
                          pagarMensalidade(
                            m
                          )
                        }
                        className="mini green"
                      >
                        Pagar
                      </button>
                    )}

                    <button
                      onClick={() =>
                        apagarMensalidade(
                          m.id
                        )
                      }
                      className="mini red"
                    >
                      Apagar
                    </button>
                  </div>
                </div>
              )
            )}

          </div>
        )}

        {aba === "vendas" && (
          <div className="card">

            {vendas.map(
              (v: any) => (
                <div
                  key={v.id}
                  className="linha between"
                >
                  <div>
                    {v.nome}
                    <br />
                    <small>
                      {
                        v.forma_pagamento
                      }
                    </small>
                  </div>

                  <div className="flex gap-2 items-center">
                    R$
                    {Number(
                      v.valor
                    ).toFixed(
                      2
                    )}

                    <button
                      onClick={() =>
                        apagarVenda(
                          v.id
                        )
                      }
                      className="mini red"
                    >
                      Apagar
                    </button>
                  </div>
                </div>
              )
            )}

          </div>
        )}

        {aba ===
          "dashboard" && (
          <div className="grid md:grid-cols-4 gap-4">

            <div className="card2">
              <small>
                Alunos
              </small>
              <h2>
                {
                  alunos.length
                }
              </h2>
            </div>

            <div className="card2">
              <small>
                Pendentes
              </small>
              <h2>
                {
                  inadimplentes
                }
              </h2>
            </div>

            <div className="card2">
              <small>
                Vendas
              </small>
              <h2>
                R$
                {totalVendas.toFixed(
                  2
                )}
              </h2>
            </div>

            <div className="card2">
              <small>
                Ativos
              </small>
              <h2>
                {
                  alunos.filter(
                    (
                      a
                    ) =>
                      a.status ===
                      "Ativo"
                  ).length
                }
              </h2>
            </div>

          </div>
        )}

        <style jsx>{`
          .tab {
            background: white;
            padding: 14px;
            border-radius: 14px;
            font-weight: bold;
            box-shadow: 0 2px 8px rgba(0,0,0,.08);
          }

          .card {
            background: white;
            padding: 24px;
            border-radius: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,.08);
          }

          .card2 {
            background: white;
            padding: 24px;
            border-radius: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,.08);
          }

          .card2 h2 {
            font-size: 2rem;
            font-weight: bold;
          }

          .input {
            width: 100%;
            padding: 14px;
            border: 1px solid #ddd;
            border-radius: 12px;
          }

          .linha {
            padding: 14px;
            border-bottom: 1px solid #eee;
            cursor: pointer;
          }

          .between {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .btn {
            width: 100%;
            color: white;
            padding: 14px;
            border-radius: 12px;
            font-weight: bold;
          }

          .red {
            background: #dc2626;
          }

          .black {
            background: #111;
          }

          .green {
            background: #16a34a;
          }

          .mini {
            color: white;
            padding: 8px 12px;
            border-radius: 10px;
            font-size: 13px;
          }
        `}</style>

      </div>
    </AdminGuard>
  )
}