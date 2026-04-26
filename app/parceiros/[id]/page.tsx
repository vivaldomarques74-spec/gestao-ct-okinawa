"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from "../../../lib/supabase"
import AdminGuard from "../../../components/AdminGuard"

export default function ParceiroDetalhePage({
  params,
}: {
  params: {
    id: string
  }
}) {
  const [loading, setLoading] =
    useState(true)

  const [salvando, setSalvando] =
    useState(false)

  const [parceiro, setParceiro] =
    useState<any>(null)

  const [vendas, setVendas] =
    useState<any[]>([])

  const vazio = {
    nome: "",
    telefone: "",
    categoria: "",
    pix: "",
    comissao: "10",
    status: "ativo",
    observacao: "",
  }

  const [form, setForm] =
    useState<any>(vazio)

  useEffect(() => {
    carregar()
  }, [])

  const carregar =
    async () => {
      setLoading(true)

      const {
        data: parceiroData,
      } =
        await supabase
          .from(
            "parceiros"
          )
          .select("*")
          .eq(
            "id",
            params.id
          )
          .single()

      if (
        parceiroData
      ) {
        setParceiro(
          parceiroData
        )

        setForm({
          nome:
            parceiroData.nome ||
            "",
          telefone:
            parceiroData.telefone ||
            "",
          categoria:
            parceiroData.categoria ||
            "",
          pix:
            parceiroData.pix ||
            "",
          comissao: String(
            parceiroData.comissao ||
              10
          ),
          status:
            parceiroData.status ||
            "ativo",
          observacao:
            parceiroData.observacao ||
            "",
        })

        const {
          data: vendasData,
        } =
          await supabase
            .from(
              "caixa"
            )
            .select("*")
            .eq(
              "tipo",
              "venda"
            )
            .eq(
              "parceiro",
              parceiroData.nome
            )
            .order(
              "data",
              {
                ascending:
                  false,
              }
            )

        setVendas(
          vendasData ||
            []
        )
      }

      setLoading(false)
    }

  const salvar =
    async () => {
      setSalvando(true)

      const payload = {
        nome: form.nome,
        telefone:
          form.telefone,
        categoria:
          form.categoria,
        pix: form.pix,
        comissao:
          Number(
            form.comissao ||
              0
          ),
        status:
          form.status,
        observacao:
          form.observacao,
      }

      const {
        error,
      } =
        await supabase
          .from(
            "parceiros"
          )
          .update(
            payload
          )
          .eq(
            "id",
            params.id
          )

      if (error) {
        alert(
          error.message
        )
        setSalvando(
          false
        )
        return
      }

      alert(
        "Parceiro atualizado!"
      )

      await carregar()

      setSalvando(
        false
      )
    }

  const resumo =
    useMemo(() => {
      let bruto = 0
      let taxa = 0
      let liquido = 0
      let comissao = 0
      let repasse = 0

      vendas.forEach(
        (v: any) => {
          const valor =
            Number(
              v.valor ||
                0
            )

          const base =
            Number(
              v.valor_base ||
                valor
            )

          const taxaVenda =
            valor -
            base

          const liquidoVenda =
            valor -
            taxaVenda

          const pct =
            Number(
              parceiro?.comissao ||
                0
            )

          const comissaoVenda =
            liquidoVenda *
            (pct /
              100)

          const repasseVenda =
            liquidoVenda -
            comissaoVenda

          bruto += valor
          taxa +=
            taxaVenda
          liquido +=
            liquidoVenda
          comissao +=
            comissaoVenda
          repasse +=
            repasseVenda
        }
      )

      return {
        bruto,
        taxa,
        liquido,
        comissao,
        repasse,
      }
    }, [
      vendas,
      parceiro,
    ])

  const imprimir =
    () => {
      window.print()
    }

  if (loading) {
    return (
      <AdminGuard>
        <div className="p-6">
          Carregando...
        </div>
      </AdminGuard>
    )
  }

  if (!parceiro) {
    return (
      <AdminGuard>
        <div className="p-6">
          Parceiro não encontrado
        </div>
      </AdminGuard>
    )
  }

  return (
    <AdminGuard>
      <div className="p-4 max-w-7xl mx-auto">

        <div className="flex justify-between gap-3 flex-wrap mb-6">

          <h1 className="text-2xl font-bold">
            Parceiro:
            {" "}
            {
              parceiro.nome
            }
          </h1>

          <button
            onClick={
              imprimir
            }
            className="btn"
          >
            🖨️ Imprimir
          </button>

        </div>

        {/* RESUMO */}
        <div className="grid md:grid-cols-5 gap-4 mb-6">

          <div className="card">
            <small>
              Bruto
            </small>
            <h3>
              R$ {resumo.bruto.toFixed(
                2
              )}
            </h3>
          </div>

          <div className="card">
            <small>
              Taxas CT
            </small>
            <h3>
              R$ {resumo.taxa.toFixed(
                2
              )}
            </h3>
          </div>

          <div className="card">
            <small>
              Líquido
            </small>
            <h3>
              R$ {resumo.liquido.toFixed(
                2
              )}
            </h3>
          </div>

          <div className="card">
            <small>
              Comissão CT
            </small>
            <h3>
              R$ {resumo.comissao.toFixed(
                2
              )}
            </h3>
          </div>

          <div className="card">
            <small>
              Repasse
              Parceiro
            </small>
            <h3>
              R$ {resumo.repasse.toFixed(
                2
              )}
            </h3>
          </div>

        </div>

        {/* FORM */}
        <div className="bg-white rounded-2xl shadow p-6 text-black mb-6">

          <h2 className="text-xl font-bold mb-4">
            Dados do
            Parceiro
          </h2>

          <div className="grid md:grid-cols-2 gap-4">

            <input
              className="input"
              placeholder="Nome"
              value={
                form.nome
              }
              onChange={(
                e
              ) =>
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
              placeholder="Telefone"
              value={
                form.telefone
              }
              onChange={(
                e
              ) =>
                setForm({
                  ...form,
                  telefone:
                    e.target
                      .value,
                })
              }
            />

            <input
              className="input"
              placeholder="Categoria"
              value={
                form.categoria
              }
              onChange={(
                e
              ) =>
                setForm({
                  ...form,
                  categoria:
                    e.target
                      .value,
                })
              }
            />

            <input
              className="input"
              placeholder="Pix"
              value={
                form.pix
              }
              onChange={(
                e
              ) =>
                setForm({
                  ...form,
                  pix:
                    e.target
                      .value,
                })
              }
            />

            <input
              className="input"
              type="number"
              placeholder="Comissão %"
              value={
                form.comissao
              }
              onChange={(
                e
              ) =>
                setForm({
                  ...form,
                  comissao:
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
              onChange={(
                e
              ) =>
                setForm({
                  ...form,
                  status:
                    e.target
                      .value,
                })
              }
            >
              <option value="ativo">
                Ativo
              </option>

              <option value="inativo">
                Inativo
              </option>
            </select>

            <textarea
              className="input md:col-span-2"
              rows={4}
              placeholder="Observação"
              value={
                form.observacao
              }
              onChange={(
                e
              ) =>
                setForm({
                  ...form,
                  observacao:
                    e.target
                      .value,
                })
              }
            />

          </div>

          <button
            onClick={
              salvar
            }
            disabled={
              salvando
            }
            className="btn mt-6"
          >
            Salvar
            Alterações
          </button>

        </div>

        {/* HISTORICO */}
        <div className="bg-white rounded-2xl shadow overflow-auto">

          <table className="w-full text-black">

            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">
                  Data
                </th>

                <th className="p-3 text-left">
                  Produto(s)
                </th>

                <th className="p-3 text-left">
                  Pagamento
                </th>

                <th className="p-3 text-left">
                  Valor
                </th>
              </tr>
            </thead>

            <tbody>

              {vendas.length ===
              0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="p-4"
                  >
                    Nenhuma venda
                    encontrada
                  </td>
                </tr>
              ) : (
                vendas.map(
                  (
                    item,
                    i
                  ) => (
                    <tr
                      key={i}
                      className="border-t"
                    >
                      <td className="p-3">
                        {new Date(
                          item.created_at ||
                            item.data
                        ).toLocaleDateString()}
                      </td>

                      <td className="p-3">
                        {
                          item.nome
                        }
                      </td>

                      <td className="p-3">
                        {item.forma_pagamento ||
                          "-"}
                      </td>

                      <td className="p-3 font-bold">
                        R$ {Number(
                          item.valor ||
                            0
                        ).toFixed(
                          2
                        )}
                      </td>

                    </tr>
                  )
                )
              )}

            </tbody>

          </table>

        </div>

        <style jsx>{`
          .input {
            width: 100%;
            padding: 12px;
            border: 1px solid #ccc;
            border-radius: 10px;
          }

          .btn {
            background: red;
            color: white;
            padding: 12px 18px;
            border-radius: 10px;
          }

          .card {
            background: white;
            padding: 20px;
            border-radius: 18px;
            box-shadow: 0 2px 10px rgba(0,0,0,.08);
          }

          .card h3 {
            font-size: 1.4rem;
            font-weight: bold;
            margin-top: 8px;
          }

          @media print {
            button,
            input,
            textarea,
            select {
              display: none !important;
            }
          }
        `}</style>

      </div>
    </AdminGuard>
  )
}