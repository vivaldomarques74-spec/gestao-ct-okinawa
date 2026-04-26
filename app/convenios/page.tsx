"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"

export default function Convenios() {
  const vazio = {
    nome: "",
    tipo: "percentual",
    desconto: "",
    ativo: true,
  }

  const [form, setForm] =
    useState(vazio)

  const [lista, setLista] =
    useState<any[]>([])

  const [editando, setEditando] =
    useState<string | null>(null)

  useEffect(() => {
    carregar()
  }, [])

  const carregar =
    async () => {
      const { data } =
        await supabase
          .from("convenios")
          .select("*")
          .order("nome")

      setLista(data || [])
    }

  const salvar =
    async () => {
      if (
        !form.nome ||
        !form.desconto
      ) {
        alert(
          "Preencha nome e desconto"
        )
        return
      }

      const payload = {
        nome: form.nome,
        tipo: form.tipo,
        desconto:
          Number(
            form.desconto
          ),
        ativo: form.ativo,
      }

      let error = null

      if (editando) {
        const res =
          await supabase
            .from(
              "convenios"
            )
            .update(payload)
            .eq(
              "id",
              editando
            )

        error = res.error
      } else {
        const res =
          await supabase
            .from(
              "convenios"
            )
            .insert([
              payload,
            ])

        error = res.error
      }

      if (error) {
        alert(
          "Erro ao salvar"
        )
        return
      }

      alert(
        editando
          ? "Convênio atualizado"
          : "Convênio cadastrado"
      )

      setForm(vazio)
      setEditando(null)
      carregar()
    }

  const editar =
    (item: any) => {
      setForm({
        nome:
          item.nome,
        tipo:
          item.tipo,
        desconto:
          item.desconto,
        ativo:
          item.ativo,
      })

      setEditando(
        item.id
      )
    }

  const excluir =
    async (
      id: string
    ) => {
      const ok =
        confirm(
          "Excluir convênio?"
        )

      if (!ok) return

      await supabase
        .from(
          "convenios"
        )
        .delete()
        .eq("id", id)

      carregar()
    }

  return (
    <div className="p-6">

      <h1 className="text-2xl font-bold mb-6">
        Convênios e Descontos
      </h1>

      {/* FORM */}
      <div className="bg-white text-black p-6 rounded-2xl shadow max-w-lg mb-6">

        <input
          className="input"
          placeholder="Nome do convênio"
          value={form.nome}
          onChange={(e) =>
            setForm({
              ...form,
              nome:
                e.target.value,
            })
          }
        />

        <select
          className="input"
          value={form.tipo}
          onChange={(e) =>
            setForm({
              ...form,
              tipo:
                e.target.value,
            })
          }
        >
          <option value="percentual">
            Percentual %
          </option>

          <option value="valor">
            Valor Fixo R$
          </option>
        </select>

        <input
          className="input"
          placeholder="Desconto"
          value={
            form.desconto
          }
          onChange={(e) =>
            setForm({
              ...form,
              desconto:
                e.target.value,
            })
          }
        />

        <select
          className="input"
          value={
            form.ativo
              ? "true"
              : "false"
          }
          onChange={(e) =>
            setForm({
              ...form,
              ativo:
                e.target
                  .value ===
                "true",
            })
          }
        >
          <option value="true">
            Ativo
          </option>

          <option value="false">
            Inativo
          </option>
        </select>

        <button
          onClick={salvar}
          className="btn"
        >
          {editando
            ? "Salvar Alterações"
            : "Cadastrar Convênio"}
        </button>

      </div>

      {/* LISTA */}
      <div className="bg-white text-black rounded-2xl shadow overflow-hidden">

        <table className="w-full">

          <thead className="bg-zinc-100">
            <tr>
              <th className="p-3 text-left">
                Nome
              </th>

              <th className="p-3 text-left">
                Tipo
              </th>

              <th className="p-3 text-left">
                Desconto
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

            {lista.map(
              (item) => (
                <tr
                  key={
                    item.id
                  }
                  className="border-t"
                >
                  <td className="p-3">
                    {
                      item.nome
                    }
                  </td>

                  <td className="p-3">
                    {item.tipo ===
                    "percentual"
                      ? "%"
                      : "R$"}
                  </td>

                  <td className="p-3">
                    {
                      item.desconto
                    }
                  </td>

                  <td className="p-3">
                    {item.ativo
                      ? "Ativo"
                      : "Inativo"}
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
          margin-bottom: 12px;
        }

        .btn {
          width: 100%;
          background: red;
          color: white;
          padding: 12px;
          border-radius: 10px;
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