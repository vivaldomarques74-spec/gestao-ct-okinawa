"use client"

import { useState, useEffect } from "react"
import { supabase } from "../../lib/supabase"

export default function Matricula() {
  const [loading, setLoading] = useState(false)

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

    problemaSaude: "",
    remedioUso: "",

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

    let valorFinal = baseTotal - desconto

    if (valorFinal < 0) valorFinal = 0

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

  const setCampo = (
    campo: string,
    valor: any
  ) => {
    setForm({
      ...form,
      [campo]: valor,
    })
  }

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
    const lista = [...form.modalidades]

    lista[index] = {
      ...lista[index],
      [campo]: valor,
    }

    if (campo === "modalidade") {
      lista[index].turma = ""
    }

    setForm({
      ...form,
      modalidades: lista,
    })
  }

  const gerarRecibo = () => {
    const agora = new Date()

    const mods = form.modalidades
      .map(
        (m: any) =>
          `${m.modalidade} - ${m.turma}`
      )
      .join("<br/>")

    const w = window.open(
      "",
      "",
      "width=320,height=700"
    )

    w?.document.write(`
<html>
<body style="font-family:monospace;width:58mm">

<div style="text-align:center">
<img src="${window.location.origin}/logo.png" style="width:90px"/>
<h3>CT OKINAWA</h3>
</div>

<hr/>

<p><b>RECIBO MATRÍCULA</b></p>

<p>Nome: ${form.nome}</p>
<p>CPF: ${form.cpf}</p>

<hr/>

<p>Modalidades:</p>
${mods}

<hr/>

<p>Convênio: ${form.convenio}</p>
<p>Base: R$ ${Number(
      form.valorBase
    ).toFixed(2)}</p>
<p>Desconto: R$ ${Number(
      form.desconto
    ).toFixed(2)}</p>

<p><b>Total: R$ ${Number(
      form.valorFinal
    ).toFixed(2)}</b></p>

<hr/>

<p>Pagamento: ${form.formaPagamento}</p>

<hr/>

<p>${agora.toLocaleDateString()} ${agora.toLocaleTimeString()}</p>

<hr/>

<p style="text-align:center">
Provérbios 16:3
</p>

<script>
window.onload = () => {
window.print()
setTimeout(()=>window.close(),500)
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

      const { data: caixaAberto } =
        await supabase
          .from("caixa_turno")
          .select("*")
          .eq("status", "aberto")
          .limit(1)
          .single()

      if (!caixaAberto) {
        alert("Nenhum caixa aberto.")
        return
      }

      const { data: aluno, error } =
        await supabase
          .from("alunos")
          .insert([
            {
              nome: form.nome,
              cpf: form.cpf,
              rg: form.rg,
              data_nascimento:
                form.nascimento,
              whatsapp:
                form.whatsapp,
              email: form.email,
              endereco:
                form.endereco,

              responsavel_nome:
                menor
                  ? form.responsavelNome
                  : null,

              responsavel_cpf:
                menor
                  ? form.responsavelCpf
                  : null,

              whatsapp_responsavel:
                menor
                  ? form.responsavelWhatsapp
                  : null,

              email_responsavel:
                menor
                  ? form.responsavelEmail
                  : null,

              problema_saude:
                saude
                  ? form.problemaSaude
                  : null,

              remedio_continuo:
                remedio
                  ? form.remedioUso
                  : null,

              convenio:
                form.convenio,

              status: "ativo",
            },
          ])
          .select()
          .single()

      if (error || !aluno) {
        alert(
          "Erro ao cadastrar aluno."
        )
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

      await supabase
        .from("matriculas")
        .insert(matriculas)

      await supabase.from("caixa").insert([
        {
          tipo: "matricula",
          nome: form.nome,
          valor: form.valorFinal,
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

      const hoje = new Date()
      const prox = new Date()
      prox.setMonth(
        prox.getMonth() + 1
      )

      await supabase
        .from("mensalidades")
        .insert([
          {
            aluno_id:
              aluno.id,
            nome: form.nome,
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
            status: "pago",
            tipo: "matricula",
            forma_pagamento:
              form.formaPagamento,
          },
          {
            aluno_id:
              aluno.id,
            nome: form.nome,
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

      gerarRecibo()

      alert(
        "Matrícula efetuada com sucesso!"
      )

      window.location.reload()
    } catch (err) {
      console.log(err)
      alert("Erro geral ao salvar.")
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
            placeholder="Nome"
            onChange={(e) =>
              setCampo(
                "nome",
                e.target.value
              )
            }
          />

          <input
            className="input"
            placeholder="CPF"
            onChange={(e) =>
              setCampo(
                "cpf",
                e.target.value
              )
            }
          />

          <input
            className="input"
            placeholder="RG"
            onChange={(e) =>
              setCampo(
                "rg",
                e.target.value
              )
            }
          />

          <input
            type="date"
            className="input"
            onChange={(e) =>
              setCampo(
                "nascimento",
                e.target.value
              )
            }
          />

          <input
            className="input"
            placeholder="WhatsApp"
            onChange={(e) =>
              setCampo(
                "whatsapp",
                e.target.value
              )
            }
          />

          <input
            className="input"
            placeholder="Email"
            onChange={(e) =>
              setCampo(
                "email",
                e.target.value
              )
            }
          />

          <input
            className="input col-span-2"
            placeholder="Endereço"
            onChange={(e) =>
              setCampo(
                "endereco",
                e.target.value
              )
            }
          />

        </div>

        <div className="mt-6">
          <label>
            <input
              type="checkbox"
              checked={menor}
              onChange={() =>
                setMenor(!menor)
              }
            />{" "}
            Menor de idade
          </label>

          {menor && (
            <div className="grid grid-cols-2 gap-4 mt-3">

              <input
                className="input"
                placeholder="Responsável"
                onChange={(e) =>
                  setCampo(
                    "responsavelNome",
                    e.target.value
                  )
                }
              />

              <input
                className="input"
                placeholder="CPF Responsável"
                onChange={(e) =>
                  setCampo(
                    "responsavelCpf",
                    e.target.value
                  )
                }
              />

              <input
                className="input"
                placeholder="WhatsApp Responsável"
                onChange={(e) =>
                  setCampo(
                    "responsavelWhatsapp",
                    e.target.value
                  )
                }
              />

              <input
                className="input"
                placeholder="Email Responsável"
                onChange={(e) =>
                  setCampo(
                    "responsavelEmail",
                    e.target.value
                  )
                }
              />

            </div>
          )}
        </div>

        <div className="mt-6">

          <label>
            <input
              type="checkbox"
              checked={saude}
              onChange={() =>
                setSaude(!saude)
              }
            />{" "}
            Problema de saúde
          </label>

          {saude && (
            <input
              className="input mt-2"
              placeholder="Descreva"
              onChange={(e) =>
                setCampo(
                  "problemaSaude",
                  e.target.value
                )
              }
            />
          )}

          <div className="mt-3">

            <label>
              <input
                type="checkbox"
                checked={remedio}
                onChange={() =>
                  setRemedio(
                    !remedio
                  )
                }
              />{" "}
              Usa remédio contínuo
            </label>

            {remedio && (
              <input
                className="input mt-2"
                placeholder="Qual?"
                onChange={(e) =>
                  setCampo(
                    "remedioUso",
                    e.target.value
                  )
                }
              />
            )}

          </div>

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
              const turmas =
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
                      Modalidade
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
                      Turma
                    </option>

                    {turmas.map(
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
            className="bg-zinc-800 text-white px-4 py-2 rounded"
          >
            + Adicionar Modalidade
          </button>
        </div>

        <div className="mt-6">
          <select
            className="input"
            value={
              form.convenio
            }
            onChange={(e) =>
              setCampo(
                "convenio",
                e.target.value
              )
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
            className="input"
            value={
              form.formaPagamento
            }
            onChange={(e) =>
              setCampo(
                "formaPagamento",
                e.target.value
              )
            }
          >
            <option>Pix</option>
            <option>
              Dinheiro
            </option>
            <option>
              Cartão
            </option>
          </select>
        </div>

        <div className="mt-6 bg-black text-white p-4 rounded">
          <p>
            Base: R${" "}
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
