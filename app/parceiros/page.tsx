"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import AdminGuard from "../../components/AdminGuard"

export default function ParceirosPage() {
  const [loading, setLoading] =
    useState(false)

  const [lista, setLista] =
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

  const [editandoId, setEditandoId] =
    useState<string | null>(null)

  useEffect(() => {
    carregar()
  }, [])

  const carregar =
    async () => {
      setLoading(true)

      const { data } =
        await supabase
          .from("parceiros")
          .select("*")
          .order("nome")

      setLista(data || [])
      setLoading(false)
    }

  const salvar =
    async () => {
      if (!form.nome) {
        alert(
          "Informe o nome"
        )
        return
      }

      const payload = {
        nome: form.nome,
        telefone:
          form.telefone,
        categoria:
          form.categoria,
        pix: form.pix,
        comissao:
          Number(
            form.comissao || 0
          ),
        status:
          form.status,
        observacao:
          form.observacao,
      }

      let error = null

      if (editandoId) {
        const res =
          await supabase
            .from(
              "parceiros"
            )
            .update(
              payload
            )
            .eq(
              "id",
              editandoId
            )

        error =
          res.error
      } else {
        const res =
          await supabase
            .from(
              "parceiros"
            )
            .insert([
              payload,
            ])

        error =
          res.error
      }

      if (error) {
        alert(
          error.message
        )
        return
      }

      alert(
        editandoId
          ? "Parceiro atualizado!"
          : "Parceiro cadastrado!"
      )

      setForm(vazio)
      setEditandoId(
        null
      )

      carregar()
    }

  const editar =
    (item: any) => {
      setForm({
        nome:
          item.nome || "",
        telefone:
          item.telefone ||
          "",
        categoria:
          item.categoria ||
          "",
        pix:
          item.pix || "",
        comissao:
          String(
            item.comissao ||
              10
          ),
        status:
          item.status ||
          "ativo",
        observacao:
          item.observacao ||
          "",
      })

      setEditandoId(
        item.id
      )

      window.scrollTo({
        top: 0,
        behavior:
          "smooth",
      })
    }

  const apagar =
    async (
      id: string
    ) => {
      const ok =
        confirm(
          "Apagar parceiro?"
        )

      if (!ok)
        return

      await supabase
        .from(
          "parceiros"
        )
        .delete()
        .eq(
          "id",
          id
        )

      carregar()
    }

  const resumoParceiro =
    async (
      parceiro: any
    ) => {
      const { data } =
        await supabase
          .from("caixa")
          .select("*")
          .eq(
            "tipo",
            "venda"
          )
          .eq(
            "parceiro",
            parceiro.nome
          )

      const vendas =
        data || []

      let bruto = 0
      let taxa = 0
      let liquido = 0
      let comissao = 0
      let repasse = 0

      vendas.forEach(
        (v: any) => {
          const valor =
            Number(
              v.valor || 0
            )

          const base =
            Number(
              v.valor_base ||
                valor
            )

          const taxaVenda =
            valor - base

          const liquidoVenda =
            valor -
            taxaVenda

          const comissaoVenda =
            liquidoVenda *
            (Number(
              parceiro.comissao ||
                0
            ) /
              100)

          const repasseVenda =
            liquidoVenda -
            comissaoVenda

          bruto += valor
          taxa += taxaVenda
          liquido +=
            liquidoVenda
          comissao +=
            comissaoVenda
          repasse +=
            repasseVenda
        }
      )

      alert(`
${parceiro.nome}

Vendas: ${vendas.length}

Bruto: R$ ${bruto.toFixed(
        2
      )}

Taxas CT: R$ ${taxa.toFixed(
        2
      )}

Líquido: R$ ${liquido.toFixed(
        2
      )}

Comissão CT (${parceiro.comissao}%): R$ ${comissao.toFixed(
        2
      )}

Repasse Parceiro: R$ ${repasse.toFixed(
        2
      )}
      `)
    }

  return (
    <AdminGuard>
      <div className="p-4 max-w-7xl mx-auto">

        <h1 className="text-2xl font-bold mb-6">
          Gestão de
          Parceiros V2
        </h1>

        {/* FORM */}
        <div className="bg-white rounded-2xl shadow p-6 text-black mb-6">

          <h2 className="text-xl font-bold mb-4">
            {editandoId
              ? "Editar Parceiro"
              : "Novo Parceiro"}
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
              placeholder="Categoria / Segmento"
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

          <div className="flex gap-3 mt-6">

            <button
              onClick={
                salvar
              }
              className="btn"
            >
              {editandoId
                ? "Salvar Alterações"
                : "Salvar Parceiro"}
            </button>

            {editandoId && (
              <button
                onClick={() => {
                  setEditandoId(
                    null
                  )
                  setForm(
                    vazio
                  )
                }}
                className="btn cinza"
              >
                Cancelar
              </button>
            )}

          </div>

        </div>

        {/* LISTA */}
        <div className="bg-white rounded-2xl shadow overflow-auto">

          <table className="w-full text-black">

            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">
                  Nome
                </th>

                <th className="p-3 text-left">
                  Categoria
                </th>

                <th className="p-3 text-left">
                  Comissão
                </th>

                <th className="p-3 text-left">
                  Status
                </th>

                <th className="p-3 text-left">
                  Ações
                </th>
              </tr>
            </thead>

            <tbody>

              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-4"
                  >
                    Carregando...
                  </td>
                </tr>
              ) : lista.length ===
                0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-4"
                  >
                    Nenhum parceiro cadastrado
                  </td>
                </tr>
              ) : (
                lista.map(
                  (
                    item,
                    i
                  ) => (
                    <tr
                      key={i}
                      className="border-t"
                    >
                      <td className="p-3">
                        {
                          item.nome
                        }
                      </td>

                      <td className="p-3">
                        {item.categoria ||
                          "-"}
                      </td>

                      <td className="p-3">
                        {
                          item.comissao
                        }
                        %
                      </td>

                      <td className="p-3 capitalize">
                        {
                          item.status
                        }
                      </td>

                      <td className="p-3 flex gap-2 flex-wrap">

                        <button
                          onClick={() =>
                            editar(
                              item
                            )
                          }
                          className="mini azul"
                        >
                          Editar
                        </button>

                        <button
                          onClick={() =>
                            resumoParceiro(
                              item
                            )
                          }
                          className="mini verde"
                        >
                          Relatório
                        </button>

                        <button
                          onClick={() =>
                            apagar(
                              item.id
                            )
                          }
                          className="mini vermelho"
                        >
                          Apagar
                        </button>

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

          .cinza {
            background: #666;
          }

          .mini {
            color: white;
            padding: 7px 10px;
            border-radius: 8px;
            font-size: 12px;
          }

          .azul {
            background: #2563eb;
          }

          .verde {
            background: #16a34a;
          }

          .vermelho {
            background: #dc2626;
          }
        `}</style>

      </div>
    </AdminGuard>
  )
}