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

  const [matriculasAluno, setMatriculasAluno] =
    useState<any[]>([])

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
  })

  useEffect(() => {
    iniciar()
  }, [])

  async function iniciar() {
    await carregarBases()
    await carregarAlunos()
    await carregarMensalidades()
    await carregarVendas()
  }

  async function carregarBases() {
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

  async function carregarAlunos() {
    const { data } = await supabase
      .from("alunos")
      .select("*")
      .order("nome")

    setAlunos(data || [])
  }

  async function carregarMensalidades() {
    const { data } = await supabase
      .from("mensalidades")
      .select("*")
      .order("vencimento", {
        ascending: false,
      })

    setMensalidades(data || [])
  }

  async function carregarVendas() {
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
        .includes(
          busca.toLowerCase()
        )
    )
  }, [alunos, busca])

  async function abrirAluno(
    aluno: any
  ) {
    const { data: mats } =
      await supabase
        .from("matriculas")
        .select("*")
        .eq("aluno_id", aluno.id)
        .order("id")

    setSelecionado(aluno)
    setMatriculasAluno(
      mats || []
    )

    setForm({
      nome: aluno.nome || "",
      cpf: aluno.cpf || "",
      rg: aluno.rg || "",
      nascimento:
        aluno.nascimento ||
        "",
      whatsapp:
        aluno.whatsapp ||
        "",
      email:
        aluno.email || "",
      endereco:
        aluno.endereco ||
        "",

      status:
        aluno.status ||
        "Ativo",

      convenio:
        aluno.convenio ||
        "Nenhum",

      menor:
        aluno.menor ||
        false,

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
    })
  }

  async function salvarAluno() {
    if (!selecionado)
      return

    await supabase
      .from("alunos")
      .update({
        ...form,
        nascimento:
          form.nascimento ||
          null,
      })
      .eq(
        "id",
        selecionado.id
      )

    alert(
      "Aluno atualizado!"
    )

    await carregarAlunos()
    await abrirAluno(
      selecionado
    )
  }

  async function adicionarTurma() {
    if (!selecionado)
      return

    await supabase
      .from("matriculas")
      .insert([
        {
          aluno_id:
            selecionado.id,
          nome:
            selecionado.nome,
          modalidade: "",
          turma: "",
          professor: "",
          valor_base: 0,
          status:
            "ativo",
        },
      ])

    abrirAluno(
      selecionado
    )
  }

  async function salvarTurma(
    item: any
  ) {
    const turmaInfo =
      turmas.find(
        (t: any) =>
          t.nome ===
          item.turma
      )

    const modInfo =
      modalidades.find(
        (m: any) =>
          m.nome ===
          item.modalidade
      )

    const professor =
      turmaInfo?.professor ||
      ""

    const valorBase =
      Number(
        modInfo?.valor_geral ||
          0
      )

    await supabase
      .from("matriculas")
      .update({
        modalidade:
          item.modalidade,
        turma:
          item.turma,
        professor,
        valor_base:
          valorBase,
      })
      .eq("id", item.id)

    await supabase
      .from("mensalidades")
      .update({
        modalidade:
          item.modalidade,
        turma:
          item.turma,
        professor,
        valor_base:
          valorBase,
        valor:
          valorBase,
      })
      .eq(
        "aluno_id",
        selecionado.id
      )
      .eq(
        "id_matricula",
        item.id
      )

    abrirAluno(
      selecionado
    )
  }

  async function removerTurma(
    item: any
  ) {
    if (
      !confirm(
        "Remover esta turma?"
      )
    )
      return

    await supabase
      .from("matriculas")
      .delete()
      .eq("id", item.id)

    await supabase
      .from("mensalidades")
      .delete()
      .eq(
        "aluno_id",
        selecionado.id
      )
      .eq(
        "turma",
        item.turma
      )
      .eq(
        "modalidade",
        item.modalidade
      )

    abrirAluno(
      selecionado
    )
  }

  async function inativarAluno() {
    await supabase
      .from("alunos")
      .update({
        status:
          "Inativo",
      })
      .eq(
        "id",
        selecionado.id
      )

    iniciar()
  }

  async function excluirAluno(
    id: any
  ) {
    if (
      !confirm(
        "Excluir aluno?"
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
    iniciar()
  }

  async function pagarMensalidade(
    item: any
  ) {
    const {
      data: caixa,
    } = await supabase
      .from("caixa_turno")
      .select("*")
      .eq(
        "status",
        "aberto"
      )
      .single()

    if (!caixa) {
      alert(
        "Abra o caixa."
      )
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
          tipo:
            "mensalidade",
          nome:
            item.nome,
          valor:
            item.valor,
          valor_base:
            item.valor_base,
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

    carregarMensalidades()
  }

  async function apagarMensalidade(
    id: any
  ) {
    await supabase
      .from("mensalidades")
      .delete()
      .eq("id", id)

    carregarMensalidades()
  }

  async function apagarVenda(
    id: any
  ) {
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
            className="tab"
            onClick={() =>
              setAba(
                "alunos"
              )
            }
          >
            Alunos
          </button>

          <button
            className="tab"
            onClick={() =>
              setAba(
                "mensalidades"
              )
            }
          >
            Mensalidades
          </button>

          <button
            className="tab"
            onClick={() =>
              setAba(
                "vendas"
              )
            }
          >
            Vendas
          </button>

        </div>

        {aba === "alunos" && (
          <div className="card">

            <input
              className="input mb-4"
              placeholder="Buscar aluno"
              value={busca}
              onChange={(e) =>
                setBusca(
                  e.target.value
                )
              }
            />

            <div className="grid md:grid-cols-2 gap-6">

              <div className="border rounded-xl max-h-[700px] overflow-auto">
                {buscarAlunos.map(
                  (
                    a: any
                  ) => (
                    <div
                      key={
                        a.id
                      }
                      className="linha"
                      onClick={() =>
                        abrirAluno(
                          a
                        )
                      }
                    >
                      <b>
                        {a.nome}
                      </b>
                      <br />
                      <small>
                        {
                          a.status
                        }
                      </small>
                    </div>
                  )
                )}
              </div>

              {selecionado && (
                <div className="space-y-3">

                  <input className="input" value={form.nome} onChange={(e)=>setForm({...form,nome:e.target.value})}/>
                  <input className="input" value={form.cpf} onChange={(e)=>setForm({...form,cpf:e.target.value})}/>
                  <input className="input" value={form.rg} onChange={(e)=>setForm({...form,rg:e.target.value})}/>
                  <input className="input" value={form.whatsapp} onChange={(e)=>setForm({...form,whatsapp:e.target.value})}/>
                  <input className="input" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})}/>
                  <input className="input" value={form.endereco} onChange={(e)=>setForm({...form,endereco:e.target.value})}/>

                  <button className="btn red" onClick={salvarAluno}>Salvar Dados</button>
                  <button className="btn gold" onClick={inativarAluno}>Inativar</button>
                  <button className="btn black" onClick={()=>excluirAluno(selecionado.id)}>Excluir</button>

                  <hr />

                  <h2 className="font-bold text-lg">
                    Turmas / Modalidades
                  </h2>

                  {matriculasAluno.map((mt:any,i:number)=>(
                    <div key={mt.id} className="border rounded-xl p-3 space-y-2">

                      <select
                        className="input"
                        value={mt.modalidade}
                        onChange={(e)=>{
                          const lista=[...matriculasAluno]
                          lista[i].modalidade=e.target.value
                          lista[i].turma=""
                          setMatriculasAluno(lista)
                        }}
                      >
                        <option value="">Modalidade</option>

                        {modalidades.map((m:any)=>(
                          <option key={m.id} value={m.nome}>
                            {m.nome}
                          </option>
                        ))}
                      </select>

                      <select
                        className="input"
                        value={mt.turma}
                        onChange={(e)=>{
                          const lista=[...matriculasAluno]
                          lista[i].turma=e.target.value
                          setMatriculasAluno(lista)
                        }}
                      >
                        <option value="">Turma</option>

                        {turmas
                          .filter((t:any)=>t.modalidade===mt.modalidade)
                          .map((t:any)=>(
                            <option key={t.id} value={t.nome}>
                              {t.nome}
                            </option>
                          ))}
                      </select>

                      <div className="grid grid-cols-2 gap-2">
                        <button className="mini green" onClick={()=>salvarTurma(mt)}>Salvar</button>
                        <button className="mini red" onClick={()=>removerTurma(mt)}>Remover</button>
                      </div>

                    </div>
                  ))}

                  <button className="btn black" onClick={adicionarTurma}>
                    + Adicionar Turma
                  </button>

                </div>
              )}

            </div>

          </div>
        )}

        {aba === "mensalidades" && (
          <div className="card">

            {mensalidades.map((m:any)=>(
              <div key={m.id} className="linha between">

                <div>
                  {m.nome}
                  <br/>
                  {m.modalidade} - {m.turma}
                </div>

                <div className="flex gap-2">

                  {m.status !== "pago" && (
                    <button className="mini green" onClick={()=>pagarMensalidade(m)}>
                      Pagar
                    </button>
                  )}

                  <button className="mini red" onClick={()=>apagarMensalidade(m.id)}>
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
              <div key={v.id} className="linha between">

                <div>{v.nome}</div>

                <div className="flex gap-2">
                  <span>R$ {Number(v.valor).toFixed(2)}</span>

                  <button className="mini red" onClick={()=>apagarVenda(v.id)}>
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
            padding:14px;
            color:white;
            border-radius:12px;
            font-weight:bold;
          }

          .mini{
            color:white;
            padding:8px 12px;
            border-radius:10px;
          }

          .red{background:#dc2626;}
          .black{background:#111;}
          .gold{background:#ca8a04;}
          .green{background:#16a34a;}
        `}</style>

      </div>
    </AdminGuard>
  )
}