"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from "../../../../lib/supabase"
import AdminGuard from "../../../../components/AdminGuard"
import { useParams, useRouter } from "next/navigation"

export default function EditarMensalidade() {
  const { id } = useParams()
  const router = useRouter()

  const [loading, setLoading] =
    useState(false)

  const [form, setForm] =
    useState<any>({
      nome: "",
      valor: 0,
      valor_base: 0,
      vencimento: "",
      status: "pendente",
      forma_pagamento: "",

      aluno_id: null,
      turma: "",
      modalidade: "",
      professor: "",
    })

  const [outras, setOutras] =
    useState<any[]>([])

  useEffect(() => {
    carregar()
  }, [])

  async function carregar() {
    setLoading(true)

    const { data } =
      await supabase
        .from(
          "mensalidades"
        )
        .select("*")
        .eq("id", id)
        .single()

    if (!data) {
      setLoading(false)
      return
    }

    setForm({
      ...data,
      vencimento:
        data.vencimento
          ? String(
              data.vencimento
            ).slice(0, 10)
          : "",
    })

    if (data.aluno_id) {
      const mes =
        new Date(
          data.vencimento
        ).getMonth()

      const ano =
        new Date(
          data.vencimento
        ).getFullYear()

      const inicio =
        new Date(
          ano,
          mes,
          1
        )
          .toISOString()
          .slice(0, 10)

      const fim =
        new Date(
          ano,
          mes + 1,
          0
        )
          .toISOString()
          .slice(0, 10)

      const {
        data: lista,
      } =
        await supabase
          .from(
            "mensalidades"
          )
          .select("*")
          .eq(
            "aluno_id",
            data.aluno_id
          )
          .gte(
            "vencimento",
            inicio
          )
          .lte(
            "vencimento",
            fim
          )
          .order(
            "status",
            {
              ascending:
                false,
            }
          )

      setOutras(
        lista || []
      )
    }

    setLoading(false)
  }

  function setCampo(
    campo: string,
    valor: any
  ) {
    setForm({
      ...form,
      [campo]: valor,
    })
  }

  async function salvar() {
    setLoading(true)

    await supabase
      .from(
        "mensalidades"
      )
      .update({
        valor:
          Number(
            form.valor
          ),
        valor_base:
          Number(
            form.valor_base ||
              form.valor
          ),
        vencimento:
          form.vencimento,
        status:
          form.status,
        forma_pagamento:
          form.forma_pagamento,
      })
      .eq("id", id)

    alert(
      "Mensalidade atualizada"
    )

    carregar()
  }

  async function apagar() {
    const ok =
      confirm(
        "Deseja apagar esta mensalidade?"
      )

    if (!ok) return

    // remove caixa se pago
    if (
      form.status ===
      "pago"
    ) {
      await supabase
        .from("caixa")
        .delete()
        .eq(
          "tipo",
          "mensalidade"
        )
        .eq(
          "nome",
          form.nome
        )
        .eq(
          "turma",
          form.turma
        )
        .eq(
          "modalidade",
          form.modalidade
        )
    }

    await supabase
      .from(
        "mensalidades"
      )
      .delete()
      .eq("id", id)

    alert(
      "Mensalidade apagada"
    )

    router.push(
      "/registros"
    )
  }

  async function pagarItem(
    item: any
  ) {
    const {
      data: caixa,
    } =
      await supabase
        .from(
          "caixa_turno"
        )
        .select("*")
        .eq(
          "status",
          "aberto"
        )
        .single()

    if (!caixa) {
      alert(
        "Abra o caixa primeiro."
      )
      return
    }

    await supabase
      .from(
        "mensalidades"
      )
      .update({
        status: "pago",
        forma_pagamento:
          "Pix",
      })
      .eq(
        "id",
        item.id
      )

    await supabase
      .from("caixa")
      .insert([
        {
          tipo:
            "mensalidade",
          nome:
            item.nome,
          valor:
            item.valor,
          valor_base:
            item.valor_base ||
            item.valor,
          professor:
            item.professor,
          turma:
            item.turma,
          modalidade:
            item.modalidade,
          data:
            new Date(),
          caixa_id:
            caixa.id,
        },
      ])

    carregar()
  }

  async function pagarTudo() {
    const pendentes =
      outras.filter(
        (
          x
        ) =>
          x.status !==
          "pago"
      )

    if (
      pendentes.length ===
      0
    ) {
      alert(
        "Nada pendente."
      )
      return
    }

    for (const item of pendentes) {
      await pagarItem(
        item
      )
    }

    carregar()
  }

  const pagas =
    useMemo(
      () =>
        outras.filter(
          (
            x
          ) =>
            x.status ===
            "pago"
        ),
      [outras]
    )

  const pendentes =
    useMemo(
      () =>
        outras.filter(
          (
            x
          ) =>
            x.status !==
            "pago"
        ),
      [outras]
    )

  const totalMes =
    useMemo(
      () =>
        outras.reduce(
          (
            acc,
            x
          ) =>
            acc +
            Number(
              x.valor ||
                0
            ),
          0
        ),
      [outras]
    )

  const totalPendente =
    useMemo(
      () =>
        pendentes.reduce(
          (
            acc,
            x
          ) =>
            acc +
            Number(
              x.valor ||
                0
            ),
          0
        ),
      [pendentes]
    )

  return (
    <AdminGuard>
      <div className="p-4 max-w-3xl mx-auto">

        <h1 className="text-2xl font-bold mb-6">
          Editar Mensalidade
        </h1>

        <div className="card">

          {loading ? (
            <p>
              Carregando...
            </p>
          ) : (
            <>
              <div className="grid gap-3">

                <input
                  className="input"
                  value={
                    form.nome ||
                    ""
                  }
                  disabled
                />

                <input
                  className="input"
                  value={
                    form.modalidade ||
                    ""
                  }
                  disabled
                />

                <input
                  className="input"
                  value={
                    form.turma ||
                    ""
                  }
                  disabled
                />

                <input
                  className="input"
                  type="number"
                  value={
                    form.valor ||
                    0
                  }
                  onChange={(
                    e
                  ) =>
                    setCampo(
                      "valor",
                      e.target
                        .value
                    )
                  }
                />

                <input
                  className="input"
                  type="date"
                  value={
                    form.vencimento ||
                    ""
                  }
                  onChange={(
                    e
                  ) =>
                    setCampo(
                      "vencimento",
                      e.target
                        .value
                    )
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
                    setCampo(
                      "status",
                      e.target
                        .value
                    )
                  }
                >
                  <option value="pendente">
                    Pendente
                  </option>
                  <option value="pago">
                    Pago
                  </option>
                </select>

                <select
                  className="input"
                  value={
                    form.forma_pagamento ||
                    ""
                  }
                  onChange={(
                    e
                  ) =>
                    setCampo(
                      "forma_pagamento",
                      e.target
                        .value
                    )
                  }
                >
                  <option value="">
                    Forma de Pagamento
                  </option>
                  <option>
                    Pix
                  </option>
                  <option>
                    Dinheiro
                  </option>
                  <option>
                    Cartão
                  </option>
                </select>

                <button
                  onClick={
                    salvar
                  }
                  className="btn"
                >
                  Salvar Alterações
                </button>

                <button
                  onClick={
                    apagar
                  }
                  className="btn red"
                >
                  Apagar Mensalidade
                </button>

              </div>
            </>
          )}

        </div>

        {/* MULTIMODALIDADE MÊS */}

        <div className="card mt-6">

          <div className="between mb-4">
            <h2 className="text-xl font-bold">
              Mensalidades do Mês
            </h2>

            <button
              onClick={
                pagarTudo
              }
              className="btn small"
            >
              Pagar Tudo
            </button>
          </div>

          <div className="resume">
            <p>
              Total do mês:
              <b>
                {" "}
                R${" "}
                {totalMes.toFixed(
                  2
                )}
              </b>
            </p>

            <p>
              Pendente:
              <b>
                {" "}
                R${" "}
                {totalPendente.toFixed(
                  2
                )}
              </b>
            </p>
          </div>

          {/* PAGAS */}
          <h3 className="titulo greenText">
            PAGAS
          </h3>

          {pagas.length ===
            0 && (
            <p className="vazio">
              Nenhuma paga
            </p>
          )}

          {pagas.map(
            (
              x: any
            ) => (
              <div
                key={x.id}
                className="linha"
              >
                <div>
                  <b>
                    {
                      x.modalidade
                    }
                  </b>
                  <br />
                  {
                    x.turma
                  }
                </div>

                <span>
                  R${" "}
                  {Number(
                    x.valor
                  ).toFixed(
                    2
                  )}
                </span>
              </div>
            )
          )}

          {/* PENDENTES */}
          <h3 className="titulo redText mt">
            PENDENTES
          </h3>

          {pendentes.length ===
            0 && (
            <p className="vazio">
              Nenhuma pendente
            </p>
          )}

          {pendentes.map(
            (
              x: any
            ) => (
              <div
                key={x.id}
                className="linha between"
              >
                <div>
                  <b>
                    {
                      x.modalidade
                    }
                  </b>
                  <br />
                  {
                    x.turma
                  }
                </div>

                <div className="flex gap-2 items-center">
                  <span>
                    R${" "}
                    {Number(
                      x.valor
                    ).toFixed(
                      2
                    )}
                  </span>

                  <button
                    onClick={() =>
                      pagarItem(
                        x
                      )
                    }
                    className="mini"
                  >
                    Pagar
                  </button>
                </div>
              </div>
            )
          )}

        </div>

        <style jsx>{`
          .card {
            background: white;
            padding: 24px;
            border-radius: 18px;
            box-shadow: 0 2px 10px rgba(0,0,0,.08);
          }

          .input {
            width: 100%;
            padding: 12px;
            border: 1px solid #ccc;
            border-radius: 10px;
            background: white;
            color: black;
          }

          .btn {
            background: red;
            color: white;
            padding: 14px;
            border-radius: 10px;
          }

          .small {
            padding: 10px 14px;
          }

          .red {
            background: #b91c1c;
          }

          .mini {
            background: #16a34a;
            color: white;
            padding: 8px 12px;
            border-radius: 10px;
          }

          .linha {
            padding: 14px 0;
            border-bottom: 1px solid #eee;
          }

          .between {
            display:flex;
            justify-content:space-between;
            align-items:center;
          }

          .titulo {
            font-weight: bold;
            margin-top: 10px;
            margin-bottom: 10px;
          }

          .greenText {
            color: #15803d;
          }

          .redText {
            color: #b91c1c;
          }

          .mt {
            margin-top: 22px;
          }

          .resume {
            background:#f5f5f5;
            padding:14px;
            border-radius:12px;
            margin-bottom:18px;
          }

          .vazio {
            color:#777;
            margin-bottom:10px;
          }
        `}</style>

      </div>
    </AdminGuard>
  )
}