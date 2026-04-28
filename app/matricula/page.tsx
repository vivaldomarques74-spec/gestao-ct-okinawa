"use client"

import { useState, useEffect } from "react"
import { supabase } from "../../lib/supabase"

export default function Matricula() {
  const [loading, setLoading] = useState(false)

  const [modalidadesLista, setModalidadesLista] = useState<any[]>([])
  const [turmasDb, setTurmasDb] = useState<any[]>([])
  const [conveniosDb, setConveniosDb] = useState<any[]>([])

  const [form, setForm] = useState<any>({
    nome: "",
    cpf: "",
    rg: "",
    nascimento: "",
    whatsapp: "",
    email: "",
    endereco: "",

    formaPagamento: "Pix",
    tipoCartao: "",
    parcelas: "1x",

    convenio: "Nenhum",

    valorBase: 0,
    valorFinal: 0,
    desconto: 0,

    modalidades: [
      {
        modalidade: "",
        turma: "",
      },
    ],
  })

  useEffect(() => {
    carregarBases()
  }, [])

  const carregarBases = async () => {
    const { data: mods } = await supabase
      .from("modalidades")
      .select("*")
      .eq("status", "ativo")
      .order("nome")

    const { data: tur } = await supabase
      .from("turmas")
      .select("*")
      .eq("status", "ativo")
      .order("nome")

    const { data: conv } = await supabase
      .from("convenios")
      .select("*")
      .eq("ativo", true)
      .order("nome")

    setModalidadesLista(mods || [])
    setTurmasDb(tur || [])
    setConveniosDb(conv || [])
  }

  useEffect(() => {
    let baseTotal = 0

    form.modalidades.forEach((m: any) => {
      const mod = modalidadesLista.find(
        (x: any) =>
          x.nome === m.modalidade
      )

      if (mod) {
        baseTotal += Number(
          mod.valor_geral || 0
        )
      }
    })

    let desconto = 0

    if (
      form.formaPagamento === "Pix" ||
      form.formaPagamento === "Dinheiro"
    ) {
      desconto += 10
    }

    if (form.convenio !== "Nenhum") {
      const conv =
        conveniosDb.find(
          (c: any) =>
            c.nome === form.convenio
        )

      if (conv) {
        if (
          conv.tipo ===
          "percentual"
        ) {
          desconto +=
            (baseTotal *
              Number(
                conv.desconto || 0
              )) /
            100
        } else {
          desconto += Number(
            conv.desconto || 0
          )
        }
      }
    }

    let valorFinal =
      baseTotal - desconto

    if (valorFinal < 0)
      valorFinal = 0

    setForm((prev: any) => ({
      ...prev,
      valorBase: baseTotal,
      valorFinal,
      desconto,
    }))
  }, [
    form.modalidades,
    form.formaPagamento,
    form.convenio,
    modalidadesLista,
    conveniosDb,
  ])

  const adicionarModalidade = () => {
    setForm({
      ...form,
      modalidades: [
        ...form.modalidades,
        {
          modalidade: "",
          turma: "",
        },
      ],
    })
  }

  const atualizarModalidade = (
    index: number,
    campo: string,
    valor: string
  ) => {
    const lista = [
      ...form.modalidades,
    ]

    lista[index] = {
      ...lista[index],
      [campo]: valor,
    }

    if (
      campo ===
      "modalidade"
    ) {
      lista[index].turma =
        ""
    }

    setForm({
      ...form,
      modalidades: lista,
    })
  }

  const gerarRecibo = () => {
    const agora =
      new Date()

    const modalidadesTexto =
      form.modalidades
        .map(
          (m: any) =>
            `${m.modalidade} - ${m.turma}`
        )
        .join("<br/>")

    const w =
      window.open(
        "",
        "",
        "width=320,height=700"
      )

    w?.document.write(`
<html>
<body style="font-family:monospace;width:58mm">

<div style="text-align:center">
<img src="${window.location.origin}/logo.png" style="width:95px"/>
</div>

<div style="text-align:center">
<b>CT OKINAWA</b>
</div>

<div style="text-align:center">
Disciplina - Respeito - Evolução
</div>

<hr/>

<div><b>RECIBO MATRÍCULA</b></div>

<hr/>

<div>NOME: ${form.nome}</div>
<div>CPF: ${form.cpf}</div>

<hr/>

<div>MODALIDADES:</div>
<div>${modalidadesTexto}</div>

<hr/>

<div>CONVÊNIO: ${form.convenio}</div>
<div>VALOR BASE: R$ ${Number(
      form.valorBase
    ).toFixed(2)}</div>
<div>DESCONTO: R$ ${Number(
      form.desconto
    ).toFixed(2)}</div>

<div>
<b>VALOR FINAL: R$ ${Number(
      form.valorFinal
    ).toFixed(2)}</b>
</div>

<hr/>

<div>PAGAMENTO: ${form.formaPagamento}</div>

${
  form.formaPagamento ===
  "Cartão"
    ? `<div>${form.tipoCartao} - ${form.parcelas}</div>`
    : ""
}

<hr/>

<div>DATA: ${agora.toLocaleDateString()}</div>
<div>HORA: ${agora.toLocaleTimeString()}</div>

<hr/>

<div style="text-align:center">
Provérbios 16:3
</div>

<div style="text-align:center">
Deus abençoe!
</div>

<script>
window.onload = () => {
window.print()
setTimeout(() => window.close(), 500)
}
</script>

</body>
</html>
`)

    w?.document.close()
  }

  const salvarDados = async () => {
    try {
      setLoading(true)

      const {
        data: caixaAberto,
        error: erroCaixa,
      } = await supabase
        .from("caixa_turno")
        .select("*")
        .eq(
          "status",
          "aberto"
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        )
        .limit(1)
        .single()

      if (
        erroCaixa ||
        !caixaAberto
      ) {
        alert(
          "Nenhum caixa aberto."
        )
        setLoading(false)
        return
      }

      const {
        data: aluno,
        error: erroAluno,
      } = await supabase
        .from("alunos")
        .insert([
          {
            nome: form.nome,
            cpf: form.cpf,
            rg: form.rg,
            nascimento:
              form.nascimento,
            whatsapp:
              form.whatsapp,
            email: form.email,
            endereco:
              form.endereco,
            convenio:
              form.convenio,
            status:
              "Ativo",
          },
        ])
        .select()
        .single()

      if (erroAluno) {
        alert(
          "Erro ao cadastrar aluno."
        )
        setLoading(false)
        return
      }

      const matriculas =
        form.modalidades.map(
          (m: any) => ({
            aluno_id:
              aluno.id,
            modalidade:
              m.modalidade,
            turma:
              m.turma,
          })
        )

      const {
        error:
          erroMatriculas,
      } = await supabase
        .from(
          "matriculas"
        )
        .insert(
          matriculas
        )

      if (
        erroMatriculas
      ) {
        alert(
          "Erro ao salvar modalidades."
        )
        setLoading(false)
        return
      }

      const {
        error:
          erroFinanceiro,
      } = await supabase
        .from("caixa")
        .insert([
          {
            tipo:
              "matricula",
            nome: form.nome,
            valor:
              form.valorFinal,
            valor_base:
              form.valorBase,
            desconto:
              form.desconto,
            convenio:
              form.convenio,
            forma_pagamento:
              form.formaPagamento,
            caixa_id:
              caixaAberto.id,
          },
        ])

      if (
        erroFinanceiro
      ) {
        alert(
          "Erro ao lançar no caixa."
        )
        setLoading(false)
        return
      }

      const hoje =
        new Date()

      const prox =
        new Date()

      prox.setMonth(
        prox.getMonth() +
          1
      )

      const {
        error:
          erroMens,
      } = await supabase
        .from(
          "mensalidades"
        )
        .insert([
          {
            aluno_id:
              aluno.id,
            nome:
              form.nome,
            cpf: form.cpf,
            valor:
              form.valorFinal,
            valor_base:
              form.valorBase,
            desconto:
              form.desconto,
            convenio:
              form.convenio,
            vencimento:
              hoje,
            status:
              "pago",
            tipo:
              "matricula",
            forma_pagamento:
              form.formaPagamento,
          },
          {
            aluno_id:
              aluno.id,
            nome:
              form.nome,
            cpf: form.cpf,
            valor:
              form.valorFinal,
            valor_base:
              form.valorBase,
            desconto:
              form.desconto,
            convenio:
              form.convenio,
            vencimento:
              prox,
            status:
              "pendente",
            tipo:
              "mensalidade",
          },
        ])

      if (erroMens) {
        alert(
          "Erro ao gerar mensalidades."
        )
        setLoading(false)
        return
      }

      gerarRecibo()

      alert(
        "Matrícula efetuada com sucesso!"
      )

      window.location.reload()
    } catch (error) {
      console.log(error)
      alert(
        "Erro geral ao salvar."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">
        Matrícula
      </h1>

      <div className="bg-white p-6 rounded-2xl shadow text-black">

        <div className="grid grid-cols-2 gap-4">

          <input
            className="input"
            placeholder="Nome*"
            onChange={(e) =>
              setForm({
                ...form,
                nome:
                  e.target.value,
              })
            }
          />

          <input
            className="input"
            placeholder="CPF*"
            onChange={(e) =>
              setForm({
                ...form,
                cpf:
                  e.target.value,
              })
            }
          />

          <input
            className="input"
            placeholder="RG"
            onChange={(e) =>
              setForm({
                ...form,
                rg:
                  e.target.value,
              })
            }
          />

          <input
            className="input"
            type="date"
            onChange={(e) =>
              setForm({
                ...form,
                nascimento:
                  e.target.value,
              })
            }
          />

          <input
            className="input"
            placeholder="WhatsApp"
            onChange={(e) =>
              setForm({
                ...form,
                whatsapp:
                  e.target.value,
              })
            }
          />

          <input
            className="input"
            placeholder="Email"
            onChange={(e) =>
              setForm({
                ...form,
                email:
                  e.target.value,
              })
            }
          />

          <input
            className="input col-span-2"
            placeholder="Endereço"
            onChange={(e) =>
              setForm({
                ...form,
                endereco:
                  e.target.value,
              })
            }
          />

        </div>

        <div className="mt-6">
          <h2 className="font-bold mb-2">
            Modalidades
          </h2>

          {form.modalidades.map(
            (
              m: any,
              i: number
            ) => {
              const turmasFiltradas =
                turmasDb.filter(
                  (
                    t: any
                  ) =>
                    t.modalidade ===
                    m.modalidade
                )

              return (
                <div
                  key={i}
                  className="grid grid-cols-2 gap-2 mb-3"
                >
                  <select
                    className="input"
                    value={
                      m.modalidade
                    }
                    onChange={(e) =>
                      atualizarModalidade(
                        i,
                        "modalidade",
                        e.target
                          .value
                      )
                    }
                  >
                    <option value="">
                      Selecione Modalidade
                    </option>

                    {modalidadesLista.map(
                      (
                        mod: any
                      ) => (
                        <option
                          key={
                            mod.id
                          }
                          value={
                            mod.nome
                          }
                        >
                          {
                            mod.nome
                          }
                        </option>
                      )
                    )}
                  </select>

                  <select
                    className="input"
                    value={
                      m.turma
                    }
                    onChange={(e) =>
                      atualizarModalidade(
                        i,
                        "turma",
                        e.target
                          .value
                      )
                    }
                  >
                    <option value="">
                      Selecione Turma
                    </option>

                    {turmasFiltradas.map(
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
                </div>
              )
            }
          )}

          <button
            onClick={
              adicionarModalidade
            }
            className="mt-2 bg-zinc-800 text-white px-4 py-2 rounded"
          >
            + Adicionar modalidade
          </button>
        </div>

        <div className="mt-6">
          <select
            className="input"
            value={
              form.convenio
            }
            onChange={(e) =>
              setForm({
                ...form,
                convenio:
                  e.target.value,
              })
            }
          >
            <option value="Nenhum">
              Nenhum
            </option>

            {conveniosDb.map(
              (c: any) => (
                <option
                  key={c.id}
                  value={c.nome}
                >
                  {c.nome}
                </option>
              )
            )}
          </select>
        </div>

        <div className="mt-6">
          <select
            className="input mb-2"
            value={
              form.formaPagamento
            }
            onChange={(e) =>
              setForm({
                ...form,
                formaPagamento:
                  e.target.value,
              })
            }
          >
            <option value="Pix">
              Pix
            </option>
            <option value="Dinheiro">
              Dinheiro
            </option>
            <option value="Cartão">
              Cartão
            </option>
          </select>

          {form.formaPagamento ===
            "Cartão" && (
            <>
              <select
                className="input mb-2"
                value={
                  form.tipoCartao
                }
                onChange={(e) =>
                  setForm({
                    ...form,
                    tipoCartao:
                      e.target
                        .value,
                  })
                }
              >
                <option value="">
                  Tipo cartão
                </option>
                <option value="Crédito">
                  Crédito
                </option>
                <option value="Débito">
                  Débito
                </option>
              </select>

              {form.tipoCartao ===
                "Crédito" && (
                <select
                  className="input"
                  value={
                    form.parcelas
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      parcelas:
                        e.target
                          .value,
                    })
                  }
                >
                  <option value="1x">
                    1x
                  </option>
                  <option value="2x">
                    2x
                  </option>
                  <option value="3x">
                    3x
                  </option>
                </select>
              )}
            </>
          )}
        </div>

        <div className="mt-6 bg-black text-white p-4 rounded">

          <p>
            Valor Base: R${" "}
            {Number(
              form.valorBase
            ).toFixed(2)}
          </p>

          <p>
            Desconto: R${" "}
            {Number(
              form.desconto
            ).toFixed(2)}
          </p>

          <p className="text-xl font-bold">
            Total: R${" "}
            {Number(
              form.valorFinal
            ).toFixed(2)}
          </p>

        </div>

        <button
          onClick={
            salvarDados
          }
          disabled={loading}
          className="mt-6 w-full bg-red-600 text-white p-3 rounded-lg"
        >
          {loading
            ? "Salvando..."
            : "Matricular e imprimir recibo"}
        </button>

      </div>

      <style jsx>{`
        .input {
          width: 100%;
          padding: 12px;
          border: 1px solid #ccc;
          border-radius: 8px;
        }
      `}</style>
    </div>
  )
}