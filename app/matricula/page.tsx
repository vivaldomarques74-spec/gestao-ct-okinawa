"use client"

import { useState, useEffect } from "react"
import { supabase } from "../../lib/supabase"

export default function Matricula() {
  const [menor, setMenor] = useState(false)
  const [saude, setSaude] = useState(false)
  const [remedio, setRemedio] = useState(false)

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

    responsavelNome: "",
    responsavelCpf: "",
    responsavelWhatsapp: "",
    responsavelEmail: "",

    formaPagamento: "Pix",
    tipoCartao: "",
    parcelas: "1x",

    convenio: "Nenhum",

    valorBase: 0,
    valorFinal: 0,
    desconto: 0,

    modalidades: [{ modalidade: "", turma: "" }],
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
        (x: any) => x.nome === m.modalidade
      )

      if (mod) {
        baseTotal += Number(mod.valor_geral || 0)
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
      const conv = conveniosDb.find(
        (c: any) => c.nome === form.convenio
      )

      if (conv) {
        if (conv.tipo === "percentual") {
          desconto +=
            (baseTotal *
              Number(conv.desconto || 0)) /
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

    lista[index][campo] =
      valor

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

  const salvarDados =
    async () => {
      try {
        const {
          data:
            caixaAberto,
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
            .limit(1)
            .single()

        if (
          !caixaAberto
        ) {
          alert(
            "Nenhum caixa aberto"
          )
          return
        }

        const {
          data: aluno,
        } =
          await supabase
            .from("alunos")
            .insert([
              {
                nome: form.nome,
                cpf: form.cpf,
                whatsapp:
                  form.whatsapp,
                endereco:
                  form.endereco,
                convenio:
                  form.convenio,
              },
            ])
            .select()
            .single()

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

        await supabase
          .from(
            "matriculas"
          )
          .insert(
            matriculas
          )

        await supabase
          .from("caixa")
          .insert([
            {
              tipo: "matricula",
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

        const hoje =
          new Date()

        const proximoVencimento =
          new Date(
            hoje
          )

        proximoVencimento.setMonth(
          proximoVencimento.getMonth() +
            1
        )

        await supabase
          .from(
            "mensalidades"
          )
          .insert([
            {
              aluno_id:
                aluno.id,
              nome: form.nome,
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
              tipo: "matricula",
              forma_pagamento:
                form.formaPagamento,
            },

            {
              aluno_id:
                aluno.id,
              nome: form.nome,
              valor:
                form.valorFinal,
              valor_base:
                form.valorBase,
              desconto:
                form.desconto,
              convenio:
                form.convenio,
              vencimento:
                proximoVencimento,
              status:
                "pendente",
              tipo: "mensalidade",
            },
          ])

        alert(
          "Matrícula salva + financeiro ok + mensalidades criadas"
        )
      } catch (err) {
        console.error(
          err
        )
        alert(
          "Erro ao salvar"
        )
      }
    }

  const gerarRecibo =
    () => {
      const agora =
        new Date()

      const modalidadesTexto =
        form.modalidades
          .map(
            (
              m: any
            ) =>
              `${m.modalidade} - ${m.turma}`
          )
          .join(
            "<br/>"
          )

      const w =
        window.open(
          "",
          "",
          "width=300,height=600"
        )

      w?.document.write(`
<html>
<body style="font-family:monospace;width:58mm">

<div style="text-align:center">
<img src="${window.location.origin}/logo.png" style="width:100px"/>
</div>

<div style="text-align:center"><b>CT OKINAWA</b></div>

<div style="text-align:center">
Disciplina - Respeito - Evolução
</div>

<hr/>

<div><b>Recibo de Matrícula</b></div>

<hr/>

<div>NOME: ${form.nome}</div>
<div>CPF: ${form.cpf}</div>

<hr/>

<div>MODALIDADES:</div>
<div>${modalidadesTexto}</div>

<hr/>

<div>CONVÊNIO: ${form.convenio}</div>
<div>VALOR TOTAL: R$ ${form.valorBase}</div>
<div>DESCONTO: R$ ${form.desconto}</div>
<div><b>VALOR: R$ ${form.valorFinal}</b></div>

<hr/>

<div>FORMA: ${form.formaPagamento}</div>

${
  form.formaPagamento ===
  "Cartão"
    ? `
<div>${form.tipoCartao} - ${form.parcelas}</div>
`
    : ""
}

<hr/>

<div>Data: ${agora.toLocaleDateString()}</div>
<div>Hora: ${agora.toLocaleTimeString()}</div>

<div>Cupom não fiscal</div>

<hr/>

<div style="text-align:center">
Provérbios 13:3
</div>

<div style="text-align:center">
Deus abençoe!
</div>

<script>
window.onload = () => {
setTimeout(()=>{
window.print();
window.close()
},300)
}
</script>

</body>
</html>
`)

      w?.document.close()
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
            placeholder="WhatsApp*"
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
          />

          <input
            className="input col-span-2"
            placeholder="Endereço*"
          />

        </div>

        <div className="mt-4">
          <label>
            <input
              type="checkbox"
              onChange={() =>
                setMenor(
                  !menor
                )
              }
            />{" "}
            Menor de idade
          </label>
        </div>

        {menor && (
          <div className="grid grid-cols-2 gap-4 mt-4">
            <input
              className="input"
              placeholder="Nome responsável*"
            />

            <input
              className="input"
              placeholder="CPF*"
            />

            <input
              className="input"
              placeholder="WhatsApp*"
            />

            <input
              className="input"
              placeholder="Email*"
            />
          </div>
        )}

        <div className="mt-6">
          <h2 className="font-semibold mb-2">
            Saúde
          </h2>

          <label>
            <input
              type="checkbox"
              onChange={() =>
                setSaude(
                  !saude
                )
              }
            />{" "}
            Problemas de saúde
          </label>

          {saude && (
            <input
              className="input mt-2"
              placeholder="Quais?"
            />
          )}

          <label className="block mt-2">
            <input
              type="checkbox"
              onChange={() =>
                setRemedio(
                  !remedio
                )
              }
            />{" "}
            Uso de remédio contínuo
          </label>

          {remedio && (
            <input
              className="input mt-2"
              placeholder="Quais?"
            />
          )}
        </div>

        <div className="mt-6">
          <h2 className="font-semibold mb-2">
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
                    <option>
                      Modalidade
                    </option>

                    {modalidadesLista.map(
                      (
                        mod: any
                      ) => (
                        <option
                          key={
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
                    <option>
                      Turma
                    </option>

                    {turmasFiltradas.map(
                      (
                        t: any
                      ) => (
                        <option
                          key={
                            t.id
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
            <option>
              Nenhum
            </option>

            {conveniosDb.map(
              (c: any) => (
                <option
                  key={c.id}
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
            onChange={(e) =>
              setForm({
                ...form,
                formaPagamento:
                  e.target.value,
              })
            }
          >
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

          {form.formaPagamento ===
            "Cartão" && (
            <>
              <select
                className="input mb-2"
                onChange={(
                  e
                ) =>
                  setForm({
                    ...form,
                    tipoCartao:
                      e.target
                        .value,
                  })
                }
              >
                <option>
                  Crédito
                </option>

                <option>
                  Débito
                </option>
              </select>

              {form.tipoCartao ===
                "Crédito" && (
                <select
                  className="input"
                  onChange={(
                    e
                  ) =>
                    setForm({
                      ...form,
                      parcelas:
                        e
                          .target
                          .value,
                    })
                  }
                >
                  <option>
                    1x
                  </option>
                  <option>
                    2x
                  </option>
                  <option>
                    3x
                  </option>
                </select>
              )}
            </>
          )}
        </div>

        <div className="mt-6 bg-black text-white p-4 rounded">
          <p>
            Plano: R$ {form.valorBase}
          </p>

          <p>
            Desconto: R$ {form.desconto}
          </p>

          <p className="text-lg">
            Total:{" "}
            <b>
              R$ {form.valorFinal}
            </b>
          </p>
        </div>

        <button
          onClick={async () => {
            await salvarDados()
            gerarRecibo()
          }}
          className="mt-6 w-full bg-red-600 text-white p-3 rounded-lg"
        >
          Matricular e imprimir recibo
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