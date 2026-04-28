"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from "../../lib/supabase"
import AdminGuard from "../../components/AdminGuard"

export default function RegistrosPage() {
  const [aba, setAba] = useState("alunos")

  const [busca, setBusca] = useState("")
  const [alunos, setAlunos] = useState<any[]>([])
  const [selecionado, setSelecionado] = useState<any>(null)

  const [mensalidades, setMensalidades] = useState<any[]>([])
  const [vendas, setVendas] = useState<any[]>([])

  const [modalidades, setModalidades] = useState<any[]>([])
  const [turmas, setTurmas] = useState<any[]>([])

  const [form, setForm] = useState<any>({
    nome: "",
    cpf: "",
    rg: "",
    nascimento: "",
    whatsapp: "",
    email: "",
    endereco: "",

    status: "Ativo",
    convenio: "Nenhum",

    menor: false,

    responsavel_nome: "",
    responsavel_cpf: "",
    responsavel_whatsapp: "",
    responsavel_email: "",

    problema_saude: false,
    saude_detalhes: "",

    usa_remedio: false,
    remedio_detalhes: "",

    modalidade: "",
    turma: "",
  })

  useEffect(() => {
    iniciar()
  }, [])

  const iniciar = async () => {
    await carregarBases()
    await carregarAlunos()
    await carregarMensalidades()
    await carregarVendas()
  }

  const carregarBases = async () => {
    const { data: mods } = await supabase
      .from("modalidades")
      .select("*")
      .order("nome")

    const { data: trs } = await supabase
      .from("turmas")
      .select("*")
      .order("nome")

    setModalidades(mods || [])
    setTurmas(trs || [])
  }

  const carregarAlunos = async () => {
    const { data } = await supabase
      .from("alunos")
      .select("*")
      .order("nome")

    setAlunos(data || [])
  }

  const carregarMensalidades = async () => {
    const { data } = await supabase
      .from("mensalidades")
      .select("*")
      .order("vencimento", {
        ascending: false,
      })

    setMensalidades(data || [])
  }

  const carregarVendas = async () => {
    const { data } = await supabase
      .from("caixa")
      .select("*")
      .eq("tipo", "venda")
      .order("created_at", {
        ascending: false,
      })

    setVendas(data || [])
  }

  const buscarAlunos = useMemo(() => {
    return alunos.filter((a) =>
      `${a.nome || ""} ${a.cpf || ""}`
        .toLowerCase()
        .includes(busca.toLowerCase())
    )
  }, [alunos, busca])

  const abrirAluno = async (aluno: any) => {
    const { data: mat } = await supabase
      .from("matriculas")
      .select("*")
      .eq("aluno_id", aluno.id)
      .limit(1)
      .single()

    setSelecionado(aluno)

    setForm({
      nome: aluno.nome || "",
      cpf: aluno.cpf || "",
      rg: aluno.rg || "",
      nascimento:
        aluno.nascimento || "",
      whatsapp:
        aluno.whatsapp || "",
      email: aluno.email || "",
      endereco:
        aluno.endereco || "",

      status:
        aluno.status || "Ativo",

      convenio:
        aluno.convenio ||
        "Nenhum",

      menor:
        aluno.menor || false,

      responsavel_nome:
        aluno.responsavel_nome ||
        "",

      responsavel_cpf:
        aluno.responsavel_cpf ||
        "",

      responsavel_whatsapp:
        aluno.responsavel_whatsapp ||
        "",

      responsavel_email:
        aluno.responsavel_email ||
        "",

      problema_saude:
        aluno.problema_saude ||
        false,

      saude_detalhes:
        aluno.saude_detalhes ||
        "",

      usa_remedio:
        aluno.usa_remedio ||
        false,

      remedio_detalhes:
        aluno.remedio_detalhes ||
        "",

      modalidade:
        mat?.modalidade || "",
      turma: mat?.turma || "",
    })
  }

  const salvarAluno = async () => {
    if (!selecionado) return

    await supabase
      .from("alunos")
      .update({
        nome: form.nome,
        cpf: form.cpf,
        rg: form.rg,
        nascimento:
          form.nascimento ||
          null,
        whatsapp:
          form.whatsapp,
        email: form.email,
        endereco:
          form.endereco,

        status: form.status,
        convenio:
          form.convenio,

        menor: form.menor,

        responsavel_nome:
          form.menor
            ? form.responsavel_nome
            : null,

        responsavel_cpf:
          form.menor
            ? form.responsavel_cpf
            : null,

        responsavel_whatsapp:
          form.menor
            ? form.responsavel_whatsapp
            : null,

        responsavel_email:
          form.menor
            ? form.responsavel_email
            : null,

        problema_saude:
          form.problema_saude,

        saude_detalhes:
          form.problema_saude
            ? form.saude_detalhes
            : null,

        usa_remedio:
          form.usa_remedio,

        remedio_detalhes:
          form.usa_remedio
            ? form.remedio_detalhes
            : null,

        modalidade:
          form.modalidade,
        turma: form.turma,
      })
      .eq("id", selecionado.id)

    const { data: mat } =
      await supabase
        .from("matriculas")
        .select("id")
        .eq(
          "aluno_id",
          selecionado.id
        )
        .limit(1)
        .single()

    if (mat) {
      await supabase
        .from("matriculas")
        .update({
          modalidade:
            form.modalidade,
          turma: form.turma,
        })
        .eq("id", mat.id)
    } else {
      await supabase
        .from("matriculas")
        .insert([
          {
            aluno_id:
              selecionado.id,
            modalidade:
              form.modalidade,
            turma: form.turma,
          },
        ])
    }

    alert("Aluno atualizado!")
    carregarAlunos()
  }

  const inativarAluno = async () => {
    if (!selecionado) return

    await supabase
      .from("alunos")
      .update({
        status: "Inativo",
      })
      .eq("id", selecionado.id)

    alert("Aluno inativado!")
    carregarAlunos()
  }

  const excluirAluno = async (
    id: any
  ) => {
    if (
      !confirm(
        "Excluir aluno definitivamente?"
      )
    )
      return

    await supabase
      .from("matriculas")
      .delete()
      .eq("aluno_id", id)

    await supabase
      .from("mensalidades")
      .delete()
      .eq("aluno_id", id)

    await supabase
      .from("alunos")
      .delete()
      .eq("id", id)

    setSelecionado(null)
    carregarAlunos()
    carregarMensalidades()
  }

  const pagarMensalidade =
    async (item: any) => {

      const { data: caixaAberto } =
        await supabase
          .from("caixa_turno")
          .select("*")
          .eq("status", "aberto")
          .single()

      if (!caixaAberto) {
        alert("Nenhum caixa aberto.")
        return
      }

      await supabase
        .from("mensalidades")
        .update({
          status: "pago",
        })
        .eq("id", item.id)

      await supabase
        .from("caixa")
        .insert([
          {
            tipo: "mensalidade",
            nome: item.nome,
            valor: item.valor,
            forma_pagamento: "Recebido",
            data: new Date(),
            caixa_id: caixaAberto.id,
          },
        ])

      carregarMensalidades()
      carregarVendas()
    }

  const apagarMensalidade =
    async (id: any) => {
      if (
        !confirm(
          "Apagar mensalidade?"
        )
      )
        return

      const { data: mensalidade } =
        await supabase
          .from("mensalidades")
          .select("*")
          .eq("id", id)
          .single()

      if (
        mensalidade &&
        mensalidade.status === "pago"
      ) {
        const { data: caixaItem } =
          await supabase
            .from("caixa")
            .select("*")
            .eq(
              "tipo",
              "mensalidade"
            )
            .eq(
              "nome",
              mensalidade.nome
            )
            .eq(
              "valor",
              mensalidade.valor
            )
            .order("data", {
              ascending: false,
            })
            .limit(1)
            .single()

        if (caixaItem) {
          await supabase
            .from("caixa")
            .delete()
            .eq("id", caixaItem.id)
        }
      }

      await supabase
        .from("mensalidades")
        .delete()
        .eq("id", id)

      carregarMensalidades()
      carregarVendas()
    }

  const apagarVenda = async (
    id: any
  ) => {
    if (
      !confirm(
        "Apagar venda?"
      )
    )
      return

    await supabase
      .from("caixa")
      .delete()
      .eq("id", id)

    carregarVendas()
  }

  return (
    <AdminGuard>
      <div className="p-6 max-w-7xl mx-auto">

        <h1 className="text-3xl font-bold mb-6">
          Central de Registros
        </h1>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <button
            onClick={() =>
              setAba("alunos")
            }
            className="tab"
          >
            Alunos
          </button>

          <button
            onClick={() =>
              setAba(
                "mensalidades"
              )
            }
            className="tab"
          >
            Mensalidades
          </button>

          <button
            onClick={() =>
              setAba("vendas")
            }
            className="tab"
          >
            Vendas
          </button>
        </div>

        {aba === "alunos" && (
          <div className="card">

            <input
              className="input mb-4"
              placeholder="Buscar aluno por nome ou CPF"
              value={busca}
              onChange={(e) =>
                setBusca(
                  e.target.value
                )
              }
            />

            <div className="grid md:grid-cols-2 gap-6">

              <div className="max-h-[700px] overflow-auto border rounded-xl">
                {buscarAlunos.map(
                  (a: any) => (
                    <div
                      key={a.id}
                      onClick={() =>
                        abrirAluno(a)
                      }
                      className="linha"
                    >
                      <b>{a.nome}</b>
                      <br />
                      <small>
                        {a.status ||
                          "Ativo"}
                      </small>
                    </div>
                  )
                )}
              </div>

              {selecionado && (
                <div className="space-y-3">

                  <input className="input" placeholder="Nome"
                    value={form.nome}
                    onChange={(e)=>setForm({...form,nome:e.target.value})} />

                  <input className="input" placeholder="CPF"
                    value={form.cpf}
                    onChange={(e)=>setForm({...form,cpf:e.target.value})} />

                  <input className="input" placeholder="RG"
                    value={form.rg}
                    onChange={(e)=>setForm({...form,rg:e.target.value})} />

                  <input type="date" className="input"
                    value={form.nascimento}
                    onChange={(e)=>setForm({...form,nascimento:e.target.value})} />

                  <input className="input" placeholder="WhatsApp"
                    value={form.whatsapp}
                    onChange={(e)=>setForm({...form,whatsapp:e.target.value})} />

                  <input className="input" placeholder="Email"
                    value={form.email}
                    onChange={(e)=>setForm({...form,email:e.target.value})} />

                  <input className="input" placeholder="Endereço"
                    value={form.endereco}
                    onChange={(e)=>setForm({...form,endereco:e.target.value})} />

                  <select className="input"
                    value={form.status}
                    onChange={(e)=>setForm({...form,status:e.target.value})}>
                    <option>Ativo</option>
                    <option>Bloqueado</option>
                    <option>Inativo</option>
                  </select>

                  <select className="input"
                    value={form.convenio}
                    onChange={(e)=>setForm({...form,convenio:e.target.value})}>
                    <option>Nenhum</option>
                  </select>

                  <label>
                    <input type="checkbox"
                      checked={form.menor}
                      onChange={(e)=>setForm({...form,menor:e.target.checked})} />
                    {" "}Menor de idade
                  </label>

                  {form.menor && (
                    <>
                      <input className="input" placeholder="Responsável"
                        value={form.responsavel_nome}
                        onChange={(e)=>setForm({...form,responsavel_nome:e.target.value})} />

                      <input className="input" placeholder="CPF Responsável"
                        value={form.responsavel_cpf}
                        onChange={(e)=>setForm({...form,responsavel_cpf:e.target.value})} />

                      <input className="input" placeholder="WhatsApp Responsável"
                        value={form.responsavel_whatsapp}
                        onChange={(e)=>setForm({...form,responsavel_whatsapp:e.target.value})} />

                      <input className="input" placeholder="Email Responsável"
                        value={form.responsavel_email}
                        onChange={(e)=>setForm({...form,responsavel_email:e.target.value})} />
                    </>
                  )}

                  <label>
                    <input type="checkbox"
                      checked={form.problema_saude}
                      onChange={(e)=>setForm({...form,problema_saude:e.target.checked})} />
                    {" "}Problema de saúde
                  </label>

                  {form.problema_saude && (
                    <input className="input"
                      placeholder="Detalhes saúde"
                      value={form.saude_detalhes}
                      onChange={(e)=>setForm({...form,saude_detalhes:e.target.value})} />
                  )}

                  <label>
                    <input type="checkbox"
                      checked={form.usa_remedio}
                      onChange={(e)=>setForm({...form,usa_remedio:e.target.checked})} />
                    {" "}Usa remédio
                  </label>

                  {form.usa_remedio && (
                    <input className="input"
                      placeholder="Detalhes remédio"
                      value={form.remedio_detalhes}
                      onChange={(e)=>setForm({...form,remedio_detalhes:e.target.value})} />
                  )}

                  <select className="input"
                    value={form.modalidade}
                    onChange={(e)=>setForm({...form,modalidade:e.target.value,turma:""})}>
                    <option value="">Modalidade</option>

                    {modalidades.map((m:any)=>(
                      <option key={m.id} value={m.nome}>
                        {m.nome}
                      </option>
                    ))}
                  </select>

                  <select className="input"
                    value={form.turma}
                    onChange={(e)=>setForm({...form,turma:e.target.value})}>
                    <option value="">Turma</option>

                    {turmas
                      .filter((t:any)=>t.modalidade===form.modalidade)
                      .map((t:any)=>(
                        <option key={t.id} value={t.nome}>
                          {t.nome}
                        </option>
                      ))}
                  </select>

                  <button
                    onClick={salvarAluno}
                    className="btn red"
                  >
                    Salvar Alterações
                  </button>

                  <button
                    onClick={inativarAluno}
                    className="btn gold"
                  >
                    Inativar
                  </button>

                  <button
                    onClick={()=>excluirAluno(selecionado.id)}
                    className="btn black"
                  >
                    Excluir
                  </button>

                </div>
              )}

            </div>
          </div>
        )}

        {aba === "mensalidades" && (
          <div className="card">

            {mensalidades.map((m:any)=>(
              <div key={m.id}
                className="linha between">

                <div>
                  {m.nome} - R$ {m.valor}
                  <br/>
                  <small>{m.status}</small>
                </div>

                <div className="flex gap-2">

                  {m.status !== "pago" && (
                    <button
                      onClick={()=>pagarMensalidade(m)}
                      className="mini green">
                      Pagar
                    </button>
                  )}

                  <button
                    onClick={()=>apagarMensalidade(m.id)}
                    className="mini red">
                    Apagar
                  </button>

                </div>

              </div>
            ))}

          </div>
        )}

        {aba === "vendas" && (
          <div className="card">

            {vendas.map((v:any)=>(
              <div key={v.id}
                className="linha between">

                <div>
                  {v.nome}
                  <br/>
                  <small>{v.forma_pagamento}</small>
                </div>

                <div className="flex gap-2 items-center">
                  R$ {Number(v.valor).toFixed(2)}

                  <button
                    onClick={()=>apagarVenda(v.id)}
                    className="mini red">
                    Apagar
                  </button>
                </div>

              </div>
            ))}

          </div>
        )}

        <style jsx>{`
          .tab{
            background:white;
            padding:14px;
            border-radius:14px;
            font-weight:bold;
            box-shadow:0 2px 8px rgba(0,0,0,.08);
          }

          .card{
            background:white;
            padding:24px;
            border-radius:20px;
            box-shadow:0 2px 10px rgba(0,0,0,.08);
          }

          .input{
            width:100%;
            padding:14px;
            border:1px solid #ddd;
            border-radius:12px;
          }

          .linha{
            padding:14px;
            border-bottom:1px solid #eee;
            cursor:pointer;
          }

          .between{
            display:flex;
            justify-content:space-between;
            align-items:center;
          }

          .btn{
            width:100%;
            color:white;
            padding:14px;
            border-radius:12px;
            font-weight:bold;
          }

          .red{background:#dc2626;}
          .black{background:#111;}
          .green{background:#16a34a;}
          .gold{background:#ca8a04;}

          .mini{
            color:white;
            padding:8px 12px;
            border-radius:10px;
            font-size:13px;
          }
        `}</style>

      </div>
    </AdminGuard>
  )
}