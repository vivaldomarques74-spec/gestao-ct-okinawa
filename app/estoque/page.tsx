"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import AdminGuard from "../../components/AdminGuard"

export default function EntradaEstoquePage() {
  const [loading, setLoading] =
    useState(false)

  const [salvando, setSalvando] =
    useState(false)

  const [produtos, setProdutos] =
    useState<any[]>([])

  const [movs, setMovs] =
    useState<any[]>([])

  const [produtoId, setProdutoId] =
    useState("")

  const [quantidade, setQuantidade] =
    useState("")

  const [custo, setCusto] =
    useState("")

  const [fornecedor, setFornecedor] =
    useState("")

  const [observacao, setObservacao] =
    useState("")

  useEffect(() => {
    carregar()
  }, [])

  const carregar =
    async () => {
      setLoading(true)

      const { data: prods } =
        await supabase
          .from("produtos")
          .select("*")
          .eq(
            "status",
            "ativo"
          )
          .order("nome")

      const { data: hist } =
        await supabase
          .from(
            "estoque_movimentacoes"
          )
          .select("*")
          .eq(
            "tipo",
            "entrada"
          )
          .order(
            "created_at",
            {
              ascending:
                false,
            }
          )
          .limit(50)

      setProdutos(
        prods || []
      )

      setMovs(
        hist || []
      )

      setLoading(false)
    }

  const salvar =
    async () => {
      if (!produtoId) {
        alert(
          "Selecione o produto"
        )
        return
      }

      if (
        !quantidade ||
        Number(
          quantidade
        ) <= 0
      ) {
        alert(
          "Informe quantidade válida"
        )
        return
      }

      setSalvando(true)

      const produto =
        produtos.find(
          (p) =>
            p.id ==
            produtoId
        )

      if (!produto) {
        alert(
          "Produto não encontrado"
        )
        setSalvando(
          false
        )
        return
      }

      const qtd =
        Number(
          quantidade
        )

      const custoUnit =
        Number(
          custo || 0
        )

      const novoEstoque =
        Number(
          produto.estoque ||
            0
        ) + qtd

      /* atualiza produto */
      const {
        error:
          erroProduto,
      } =
        await supabase
          .from(
            "produtos"
          )
          .update({
            estoque:
              novoEstoque,
          })
          .eq(
            "id",
            produtoId
          )

      if (erroProduto) {
        alert(
          erroProduto.message
        )
        setSalvando(
          false
        )
        return
      }

      /* histórico */
      const {
        error:
          erroMov,
      } =
        await supabase
          .from(
            "estoque_movimentacoes"
          )
          .insert([
            {
              produto_id:
                produtoId,
              produto:
                produto.nome,
              tipo: "entrada",
              quantidade:
                qtd,
              custo:
                custoUnit,
              fornecedor:
                fornecedor,
              observacao:
                observacao,
            },
          ])

      if (erroMov) {
        alert(
          erroMov.message
        )
        setSalvando(
          false
        )
        return
      }

      alert(
        "Entrada registrada!"
      )

      setProdutoId("")
      setQuantidade("")
      setCusto("")
      setFornecedor("")
      setObservacao("")

      await carregar()

      setSalvando(
        false
      )
    }

  const produtoSelecionado =
    produtos.find(
      (p) =>
        p.id ==
        produtoId
    )

  return (
    <AdminGuard>
      <div className="p-4 max-w-7xl mx-auto">

        <h1 className="text-2xl font-bold mb-6">
          Entrada de
          Estoque
        </h1>

        {/* FORM */}
        <div className="bg-white rounded-2xl shadow p-6 text-black mb-6">

          <h2 className="text-xl font-bold mb-4">
            Nova Entrada
          </h2>

          <div className="grid md:grid-cols-2 gap-4">

            <select
              className="input"
              value={
                produtoId
              }
              onChange={(
                e
              ) =>
                setProdutoId(
                  e.target
                    .value
                )
              }
            >
              <option value="">
                Selecione produto
              </option>

              {produtos.map(
                (
                  item,
                  i
                ) => (
                  <option
                    key={i}
                    value={
                      item.id
                    }
                  >
                    {
                      item.nome
                    }
                  </option>
                )
              )}
            </select>

            <input
              className="input"
              type="number"
              placeholder="Quantidade"
              value={
                quantidade
              }
              onChange={(
                e
              ) =>
                setQuantidade(
                  e.target
                    .value
                )
              }
            />

            <input
              className="input"
              type="number"
              placeholder="Custo unitário"
              value={
                custo
              }
              onChange={(
                e
              ) =>
                setCusto(
                  e.target
                    .value
                )
              }
            />

            <input
              className="input"
              placeholder="Fornecedor"
              value={
                fornecedor
              }
              onChange={(
                e
              ) =>
                setFornecedor(
                  e.target
                    .value
                )
              }
            />

            <textarea
              className="input md:col-span-2"
              rows={4}
              placeholder="Observação"
              value={
                observacao
              }
              onChange={(
                e
              ) =>
                setObservacao(
                  e.target
                    .value
                )
              }
            />

          </div>

          {produtoSelecionado && (
            <div className="mt-4 text-sm text-zinc-700">
              Estoque atual:
              {" "}
              <b>
                {
                  produtoSelecionado.estoque
                }
              </b>
            </div>
          )}

          <button
            onClick={
              salvar
            }
            disabled={
              salvando
            }
            className="btn mt-6"
          >
            {salvando
              ? "Salvando..."
              : "Registrar Entrada"}
          </button>

        </div>

        {/* HISTÓRICO */}
        <div className="bg-white rounded-2xl shadow overflow-auto">

          <table className="w-full text-black">

            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">
                  Data
                </th>

                <th className="p-3 text-left">
                  Produto
                </th>

                <th className="p-3 text-left">
                  Qtd
                </th>

                <th className="p-3 text-left">
                  Custo
                </th>

                <th className="p-3 text-left">
                  Fornecedor
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
              ) : movs.length ===
                0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-4"
                  >
                    Nenhuma
                    movimentação
                  </td>
                </tr>
              ) : (
                movs.map(
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
                          item.created_at
                        ).toLocaleDateString()}
                      </td>

                      <td className="p-3">
                        {
                          item.produto
                        }
                      </td>

                      <td className="p-3 font-bold">
                        {
                          item.quantidade
                        }
                      </td>

                      <td className="p-3">
                        R${" "}
                        {Number(
                          item.custo ||
                            0
                        ).toFixed(
                          2
                        )}
                      </td>

                      <td className="p-3">
                        {item.fornecedor ||
                          "-"}
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
        `}</style>

      </div>
    </AdminGuard>
  )
}