"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"

export default function Operadores() {
  const vazio = {
    nome: "",
    codigo: "",
    tipo: "secretaria",
  }

  const [form, setForm] =
    useState(vazio)

  const [lista, setLista] =
    useState<any[]>([])

  const [editandoId, setEditandoId] =
    useState<string | null>(null)

  const [loading, setLoading] =
    useState(false)

  useEffect(() => {
    carregar()
  }, [])

  const carregar =
    async () => {
      setLoading(true)

      const { data } =
        await supabase
          .from("operadores")
          .select("*")
          .order("nome")

      setLista(data || [])
      setLoading(false)
    }

  const salvarOperador =
    async () => {
      if (
        !form.nome ||
        !form.codigo
      ) {
        alert(
          "Preencha nome e código"
        )
        return
      }

      let error = null

      if (editandoId) {
        const res =
          await supabase
            .from(
              "operadores"
            )
            .update({
              nome: form.nome,
              codigo:
                form.codigo,
              tipo: form.tipo,
            })
            .eq(
              "id",
              editandoId
            )

        error = res.error
      } else {
        const res =
          await supabase
            .from(
              "operadores"
            )
            .insert([
              {
                nome: form.nome,
                codigo:
                  form.codigo,
                tipo: form.tipo,
              },
            ])

        error = res.error
      }

      if (error) {
        alert(
          "Erro ao salvar operador"
        )
        return
      }

      alert(
        editandoId
          ? "Operador atualizado"
          : "Operador cadastrado"
      )

      setForm(vazio)
      setEditandoId(null)

      carregar()
    }

  const editar =
    (item: any) => {
      setForm({
        nome:
          item.nome || "",
        codigo:
          item.codigo || "",
        tipo:
          item.tipo ||
          "secretaria",
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

  const excluir =
    async (
      id: string
    ) => {
      const ok =
        confirm(
          "Deseja excluir este operador?"
        )

      if (!ok) return

      const { error } =
        await supabase
          .from(
            "operadores"
          )
          .delete()
          .eq("id", id)

      if (error) {
        alert(
          "Erro ao excluir"
        )
        return
      }

      carregar()
    }

  const cancelarEdicao =
    () => {
      setEditandoId(null)
      setForm(vazio)
    }

  return (
    <div className="p-6">

      <h1 className="text-2xl font-bold mb-6">
        Cadastro de Operadores
      </h1>

      {/* FORM */}
      <div className="bg-white p-6 rounded-2xl shadow text-black max-w-md mb-6">

        <input
          placeholder="Nome"
          className="input mb-3"
          value={form.nome}
          onChange={(e) =>
            setForm({
              ...form,
              nome:
                e.target.value,
            })
          }
        />

        <input
          placeholder="Código"
          className="input mb-3"
          value={form.codigo}
          onChange={(e) =>
            setForm({
              ...form,
              codigo:
                e.target.value,
            })
          }
        />

        <select
          className="input mb-3"
          value={form.tipo}
          onChange={(e) =>
            setForm({
              ...form,
              tipo:
                e.target.value,
            })
          }
        >
          <option value="secretaria">
            Secretaria
          </option>

          <option value="admin">
            Admin
          </option>
        </select>

        <button
          onClick={
            salvarOperador
          }
          className="w-full bg-red-600 text-white p-3 rounded-lg mb-2"
        >
          {editandoId
            ? "Salvar Alterações"
            : "Salvar Operador"}
        </button>

        {editandoId && (
          <button
            onClick={
              cancelarEdicao
            }
            className="w-full bg-zinc-800 text-white p-3 rounded-lg"
          >
            Cancelar Edição
          </button>
        )}

      </div>

      {/* LISTA */}
      <div className="bg-white rounded-2xl shadow overflow-hidden text-black">

        <table className="w-full">

          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">
                Nome
              </th>

              <th className="p-3 text-left">
                Código
              </th>

              <th className="p-3 text-left">
                Tipo
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
                  colSpan={4}
                  className="p-4"
                >
                  Carregando...
                </td>
              </tr>
            ) : lista.length ===
              0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="p-4"
                >
                  Nenhum operador cadastrado
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
                      {
                        item.codigo
                      }
                    </td>

                    <td className="p-3 capitalize">
                      {
                        item.tipo
                      }
                    </td>

                    <td className="p-3 flex gap-2">

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
                          excluir(
                            item.id
                          )
                        }
                        className="mini vermelho"
                      >
                        Excluir
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
          border-radius: 8px;
        }

        .mini {
          color: white;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 12px;
        }

        .azul {
          background: #2563eb;
        }

        .vermelho {
          background: #dc2626;
        }
      `}</style>

    </div>
  )
}