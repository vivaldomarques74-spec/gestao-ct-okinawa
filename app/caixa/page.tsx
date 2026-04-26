"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"

type Movimento = {
  id: string
  tipo: string
  descricao: string
  valor: number
  forma_pagamento: string
  created_at: string
}

export default function CaixaPage() {
  const [tipo, setTipo] =
    useState("entrada")

  const [descricao, setDescricao] =
    useState("")

  const [valor, setValor] =
    useState("")

  const [
    formaPagamento,
    setFormaPagamento,
  ] = useState("dinheiro")

  const [lista, setLista] =
    useState<Movimento[]>([])

  const [saldo, setSaldo] =
    useState(0)

  useEffect(() => {
    carregar()
  }, [])

  const carregar =
    async () => {
      const { data } =
        await supabase
          .from("caixa")
          .select("*")
          .order(
            "created_at",
            {
              ascending: false,
            }
          )

      const itens =
        (data ||
          []) as Movimento[]

      setLista(itens)

      let total = 0

      itens.forEach((i) => {
        if (
          i.tipo ===
          "entrada"
        ) {
          total += Number(
            i.valor
          )
        } else {
          total -= Number(
            i.valor
          )
        }
      })

      setSaldo(total)
    }

  const salvar =
    async () => {
      if (
        !descricao ||
        !valor
      ) {
        alert(
          "Preencha descrição e valor"
        )
        return
      }

      const numero =
        Number(valor)

      if (
        isNaN(numero) ||
        numero <= 0
      ) {
        alert(
          "Valor inválido"
        )
        return
      }

      const { error } =
        await supabase
          .from("caixa")
          .insert([
            {
              tipo,
              descricao,
              valor:
                numero,
              forma_pagamento:
                formaPagamento,
            },
          ])

      if (error) {
        alert(
          "Erro ao lançar no caixa"
        )
        return
      }

      alert(
        "Movimento salvo"
      )

      setDescricao("")
      setValor("")
      setFormaPagamento(
        "dinheiro"
      )

      carregar()
    }

  const excluir =
    async (
      id: string
    ) => {
      const ok =
        confirm(
          "Excluir lançamento?"
        )

      if (!ok) return

      await supabase
        .from("caixa")
        .delete()
        .eq("id", id)

      carregar()
    }

  return (
    <div className="p-6">

      <h1 className="text-2xl font-bold mb-6">
        Controle de Caixa
      </h1>

      {/* saldo */}
      <div className="bg-zinc-900 text-white p-5 rounded-2xl mb-6 border border-red-900">
        <p className="text-sm text-zinc-400">
          Saldo Atual
        </p>

        <p className="text-3xl font-bold text-green-400">
          R${" "}
          {saldo.toFixed(2)}
        </p>
      </div>

      {/* form */}
      <div className="bg-white text-black p-6 rounded-2xl shadow mb-6 grid md:grid-cols-2 gap-3">

        <select
          className="input"
          value={tipo}
          onChange={(e) =>
            setTipo(
              e.target
                .value
            )
          }
        >
          <option value="entrada">
            Entrada
          </option>

          <option value="saida">
            Saída
          </option>
        </select>

        <select
          className="input"
          value={
            formaPagamento
          }
          onChange={(e) =>
            setFormaPagamento(
              e.target
                .value
            )
          }
        >
          <option value="dinheiro">
            Dinheiro
          </option>

          <option value="pix">
            Pix
          </option>

          <option value="debito">
            Débito
          </option>

          <option value="credito">
            Crédito
          </option>
        </select>

        <input
          placeholder="Descrição"
          className="input md:col-span-2"
          value={descricao}
          onChange={(e) =>
            setDescricao(
              e.target
                .value
            )
          }
        />

        <input
          placeholder="Valor"
          type="number"
          step="0.01"
          className="input md:col-span-2"
          value={valor}
          onChange={(e) =>
            setValor(
              e.target
                .value
            )
          }
        />

        <button
          onClick={salvar}
          className="bg-red-600 text-white p-3 rounded-xl md:col-span-2"
        >
          Salvar Movimento
        </button>

      </div>

      {/* tabela */}
      <div className="bg-white text-black rounded-2xl shadow overflow-hidden">

        <table className="w-full">

          <thead className="bg-zinc-100">
            <tr>
              <th className="p-3 text-left">
                Data
              </th>
              <th className="p-3 text-left">
                Tipo
              </th>
              <th className="p-3 text-left">
                Descrição
              </th>
              <th className="p-3 text-left">
                Forma
              </th>
              <th className="p-3 text-left">
                Valor
              </th>
              <th className="p-3 text-left">
                Ação
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
                    {new Date(
                      item.created_at
                    ).toLocaleDateString(
                      "pt-BR"
                    )}
                  </td>

                  <td className="p-3 capitalize">
                    {
                      item.tipo
                    }
                  </td>

                  <td className="p-3">
                    {
                      item.descricao
                    }
                  </td>

                  <td className="p-3 capitalize">
                    {
                      item.forma_pagamento
                    }
                  </td>

                  <td
                    className={`p-3 font-bold ${
                      item.tipo ===
                      "entrada"
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    R${" "}
                    {Number(
                      item.valor
                    ).toFixed(
                      2
                    )}
                  </td>

                  <td className="p-3">
                    <button
                      onClick={() =>
                        excluir(
                          item.id
                        )
                      }
                      className="bg-red-600 text-white px-3 py-1 rounded-lg text-sm"
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
        }
      `}</style>

    </div>
  )
}