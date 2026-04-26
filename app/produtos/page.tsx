"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from "../../lib/supabase"
import AdminGuard from "../../components/AdminGuard"

export default function ProdutosPage() {
  const [loading, setLoading] =
    useState(false)

  const [lista, setLista] =
    useState<any[]>([])

  const [parceiros, setParceiros] =
    useState<any[]>([])

  const [busca, setBusca] =
    useState("")

  const [filtroTipo, setFiltroTipo] =
    useState("todos")

  const vazio = {
    nome: "",
    preco: "",
    custo: "",
    estoque: "",
    estoque_minimo: "0",
    tipo: "interno",
    parceiro: "",
    comissao_produto: "",
    status: "ativo",
  }

  const [form, setForm] =
    useState<any>(vazio)

  const [editandoId, setEditandoId] =
    useState<string | null>(null)

  useEffect(() => {
    carregar()
    carregarParceiros()
  }, [])

  const carregar =
    async () => {
      setLoading(true)

      const { data } =
        await supabase
          .from("produtos")
          .select("*")
          .order("nome")

      setLista(data || [])
      setLoading(false)
    }

  const carregarParceiros =
    async () => {
      const { data } =
        await supabase
          .from("parceiros")
          .select("*")
          .eq(
            "status",
            "ativo"
          )
          .order("nome")

      setParceiros(
        data || []
      )
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
        preco: Number(
          form.preco || 0
        ),
        custo: Number(
          form.custo || 0
        ),
        estoque:
          Number(
            form.estoque ||
              0
          ),
        estoque_minimo:
          Number(
            form.estoque_minimo ||
              0
          ),
        tipo: form.tipo,
        parceiro:
          form.tipo ===
          "parceiro"
            ? form.parceiro
            : null,
        comissao_produto:
          form.tipo ===
            "parceiro" &&
          form.comissao_produto
            ? Number(
                form.comissao_produto
              )
            : null,
        status:
          form.status,
      }

      let error = null

      if (editandoId) {
        const res =
          await supabase
            .from(
              "produtos"
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
              "produtos"
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
          ? "Produto atualizado!"
          : "Produto cadastrado!"
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
        preco: String(
          item.preco ||
            ""
        ),
        custo: String(
          item.custo ||
            ""
        ),
        estoque:
          String(
            item.estoque ||
              ""
          ),
        estoque_minimo:
          String(
            item.estoque_minimo ||
              0
          ),
        tipo:
          item.tipo ||
          "interno",
        parceiro:
          item.parceiro ||
          "",
        comissao_produto:
          item.comissao_produto
            ? String(
                item.comissao_produto
              )
            : "",
        status:
          item.status ||
          "ativo",
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
          "Apagar produto?"
        )

      if (!ok)
        return

      await supabase
        .from(
          "produtos"
        )
        .delete()
        .eq(
          "id",
          id
        )

      carregar()
    }

  const listaFiltrada =
    useMemo(() => {
      return lista.filter(
        (item) => {
          const nomeOk =
            (
              item.nome ||
              ""
            )
              .toLowerCase()
              .includes(
                busca.toLowerCase()
              )

          let tipoOk =
            true

          if (
            filtroTipo !==
            "todos"
          ) {
            tipoOk =
              item.tipo ===
              filtroTipo
          }

          return (
            nomeOk &&
            tipoOk
          )
        }
      )
    }, [
      lista,
      busca,
      filtroTipo,
    ])

  const totalEstoque =
    lista.reduce(
      (
        acc,
        item
      ) =>
        acc +
        Number(
          item.estoque ||
            0
        ),
      0
    )

  const estoqueBaixo =
    lista.filter(
      (item) =>
        Number(
          item.estoque ||
            0
        ) <=
        Number(
          item.estoque_minimo ||
            0
        )
    ).length

  return (
    <AdminGuard>
      <div className="p-4 max-w-7xl mx-auto">

        <h1 className="text-2xl font-bold mb-6">
          Produtos V3
        </h1>

        {/* CARDS */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">

          <div className="card">
            <small>
              Produtos
            </small>
            <h2>
              {
                lista.length
              }
            </h2>
          </div>

          <div className="card">
            <small>
              Itens em
              Estoque
            </small>
            <h2>
              {
                totalEstoque
              }
            </h2>
          </div>

          <div className="card alerta">
            <small>
              Estoque
              Baixo
            </small>
            <h2>
              {
                estoqueBaixo
              }
            </h2>
          </div>

        </div>

        {/* FORM */}
        <div className="bg-white rounded-2xl shadow p-6 text-black mb-6">

          <h2 className="text-xl font-bold mb-4">
            {editandoId
              ? "Editar Produto"
              : "Novo Produto"}
          </h2>

          <div className="grid md:grid-cols-3 gap-4">

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
              type="number"
              placeholder="Preço"
              value={
                form.preco
              }
              onChange={(
                e
              ) =>
                setForm({
                  ...form,
                  preco:
                    e.target
                      .value,
                })
              }
            />

            <input
              className="input"
              type="number"
              placeholder="Custo"
              value={
                form.custo
              }
              onChange={(
                e
              ) =>
                setForm({
                  ...form,
                  custo:
                    e.target
                      .value,
                })
              }
            />

            <input
              className="input"
              type="number"
              placeholder="Estoque"
              value={
                form.estoque
              }
              onChange={(
                e
              ) =>
                setForm({
                  ...form,
                  estoque:
                    e.target
                      .value,
                })
              }
            />

            <input
              className="input"
              type="number"
              placeholder="Estoque mínimo"
              value={
                form.estoque_minimo
              }
              onChange={(
                e
              ) =>
                setForm({
                  ...form,
                  estoque_minimo:
                    e.target
                      .value,
                })
              }
            />

            <select
              className="input"
              value={
                form.tipo
              }
              onChange={(
                e
              ) =>
                setForm({
                  ...form,
                  tipo:
                    e.target
                      .value,
                  parceiro:
                    "",
                })
              }
            >
              <option value="interno">
                Interno
              </option>

              <option value="parceiro">
                Parceiro
              </option>
            </select>

            {form.tipo ===
              "parceiro" && (
              <>
                <select
                  className="input"
                  value={
                    form.parceiro
                  }
                  onChange={(
                    e
                  ) =>
                    setForm({
                      ...form,
                      parceiro:
                        e.target
                          .value,
                    })
                  }
                >
                  <option value="">
                    Selecione parceiro
                  </option>

                  {parceiros.map(
                    (
                      item,
                      i
                    ) => (
                      <option
                        key={i}
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
                  placeholder="Comissão produto % (opcional)"
                  value={
                    form.comissao_produto
                  }
                  onChange={(
                    e
                  ) =>
                    setForm({
                      ...form,
                      comissao_produto:
                        e.target
                          .value,
                    })
                  }
                />
              </>
            )}

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
                : "Salvar Produto"}
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

        {/* FILTROS */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">

          <input
            className="input"
            placeholder="Buscar produto..."
            value={busca}
            onChange={(
              e
            ) =>
              setBusca(
                e.target
                  .value
              )
            }
          />

          <select
            className="input"
            value={
              filtroTipo
            }
            onChange={(
              e
            ) =>
              setFiltroTipo(
                e.target
                  .value
              )
            }
          >
            <option value="todos">
              Todos
            </option>

            <option value="interno">
              Internos
            </option>

            <option value="parceiro">
              Parceiros
            </option>
          </select>

        </div>

        {/* TABELA */}
        <div className="bg-white rounded-2xl shadow overflow-auto">

          <table className="w-full text-black">

            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">
                  Nome
                </th>

                <th className="p-3 text-left">
                  Tipo
                </th>

                <th className="p-3 text-left">
                  Parceiro
                </th>

                <th className="p-3 text-left">
                  Preço
                </th>

                <th className="p-3 text-left">
                  Estoque
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
                    colSpan={7}
                    className="p-4"
                  >
                    Carregando...
                  </td>
                </tr>
              ) : listaFiltrada.length ===
                0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="p-4"
                  >
                    Nenhum produto
                  </td>
                </tr>
              ) : (
                listaFiltrada.map(
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

                      <td className="p-3 capitalize">
                        {
                          item.tipo
                        }
                      </td>

                      <td className="p-3">
                        {item.parceiro ||
                          "-"}
                      </td>

                      <td className="p-3">
                        R$ {Number(
                          item.preco ||
                            0
                        ).toFixed(
                          2
                        )}
                      </td>

                      <td
                        className={`p-3 ${
                          Number(
                            item.estoque ||
                              0
                          ) <=
                          Number(
                            item.estoque_minimo ||
                              0
                          )
                            ? "baixo"
                            : ""
                        }`}
                      >
                        {
                          item.estoque
                        }
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

          .card {
            background: white;
            padding: 20px;
            border-radius: 18px;
            box-shadow: 0 2px 10px rgba(0,0,0,.08);
          }

          .card h2 {
            font-size: 2rem;
            font-weight: bold;
            margin-top: 8px;
          }

          .alerta {
            border: 2px solid #f59e0b;
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

          .vermelho {
            background: #dc2626;
          }

          .baixo {
            color: #dc2626;
            font-weight: bold;
          }
        `}</style>

      </div>
    </AdminGuard>
  )
}