"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from "../../lib/supabase"
import AdminGuard from "../../components/AdminGuard"

export default function RelatoriosPage() {
  const [aba, setAba] =
    useState("professores")

  const [loading, setLoading] =
    useState(false)

  const [dados, setDados] =
    useState<any[]>([])

  const [professores, setProfessores] =
    useState<any[]>([])

  const [turmas, setTurmas] =
    useState<any[]>([])

  const [parceiros, setParceiros] =
    useState<any[]>([])

  const [professor, setProfessor] =
    useState("")

  const [turma, setTurma] =
    useState("")

  const [parceiro, setParceiro] =
    useState("")

  const [inicio, setInicio] =
    useState("")

  const [fim, setFim] =
    useState("")

  const [
    chamadaSelecionada,
    setChamadaSelecionada,
  ] = useState<any>(null)

  const [
    detalheChamada,
    setDetalheChamada,
  ] = useState<any[]>([])

  const [
    alunosTurma,
    setAlunosTurma,
  ] = useState<any[]>([])

  useEffect(() => {
    carregarBases()
  }, [])

  useEffect(() => {
    carregar()
  }, [
    aba,
    professor,
    turma,
    parceiro,
    inicio,
    fim,
  ])

  async function carregarBases() {
    const { data: p } =
      await supabase
        .from(
          "professores"
        )
        .select("*")
        .order("nome")

    const { data: t } =
      await supabase
        .from("turmas")
        .select("*")
        .order("nome")

    const { data: pr } =
      await supabase
        .from(
          "parceiros"
        )
        .select("*")
        .order("nome")

    setProfessores(p || [])
    setTurmas(t || [])
    setParceiros(pr || [])
  }

  function dentroPeriodo(
    base: any
  ) {
    if (!base) return true

    const data =
      new Date(base)

    let inicioOk = true
    let fimOk = true

    if (inicio) {
      inicioOk =
        data >=
        new Date(inicio)
    }

    if (fim) {
      const final =
        new Date(fim)

      final.setHours(
        23,
        59,
        59
      )

      fimOk =
        data <= final
    }

    return (
      inicioOk &&
      fimOk
    )
  }

  function periodoProfessor(
    base: any
  ) {
    const data =
      new Date(base)

    if (
      inicio ||
      fim
    )
      return dentroPeriodo(
        data
      )

    const hoje =
      new Date()

    const ini =
      new Date(
        hoje.getFullYear(),
        hoje.getMonth() - 1,
        10,
        0,
        0,
        0
      )

    const fimc =
      new Date(
        hoje.getFullYear(),
        hoje.getMonth(),
        9,
        23,
        59,
        59
      )

    return (
      data >= ini &&
      data <= fimc
    )
  }

  async function carregar() {
    setLoading(true)
    setDados([])

    // =========================
    // PROFESSORES
    // =========================
    if (
      aba ===
      "professores"
    ) {
      let query =
        supabase
          .from(
            "caixa"
          )
          .select("*")
          .in(
            "tipo",
            [
              "matricula",
              "mensalidade",
            ]
          )

      if (professor) {
        query =
          query.eq(
            "professor",
            professor
          )
      }

      const {
        data,
      } =
        await query

      const lista =
        (data ||
          []).filter(
          (
            x
          ) =>
            periodoProfessor(
              x.created_at ||
                x.data
            )
        )

      const final =
        lista.map(
          (
            x
          ) => ({
            ...x,
            valor_comissao:
              Number(
                x.valor_base ||
                  x.valor ||
                  0
              ) *
              0.5,
          })
        )

      setDados(final)
    }

    // =========================
    // PRESENÇA
    // =========================
    if (
      aba ===
      "presenca"
    ) {
      let query =
        supabase
          .from(
            "presencas"
          )
          .select("*")
          .order(
            "created_at",
            {
              ascending:
                false,
            }
          )

      if (turma) {
        query =
          query.eq(
            "turma",
            turma
          )
      }

      const {
        data,
      } =
        await query

      const lista =
        (data ||
          []).filter(
          (
            x
          ) =>
            dentroPeriodo(
              x.created_at ||
                x.data
            )
        )

      const grupos: any =
        {}

      lista.forEach(
        (
          item
        ) => {
          const dt =
            new Date(
              item.created_at ||
                item.data
            )

          const chave = `${item.turma}_${dt.toLocaleDateString()}_${dt.getHours()}`

          if (
            !grupos[
              chave
            ]
          ) {
            grupos[
              chave
            ] = {
              turma:
                item.turma,
              professor:
                item.professor,
              data:
                item.created_at ||
                item.data,
              registros:
                [],
            }
          }

          grupos[
            chave
          ].registros.push(
            item
          )
        }
      )

      setDados(
        Object.values(
          grupos
        )
      )
    }

    // =========================
    // TURMAS
    // =========================
    if (
      aba ===
      "turmas"
    ) {
      setDados(turmas)
    }

    // =========================
    // PARCEIROS
    // =========================
    if (
      aba ===
      "parceiros"
    ) {
      const {
        data,
      } =
        await supabase
          .from(
            "caixa"
          )
          .select("*")
          .eq(
            "tipo",
            "venda"
          )

      setDados(
        (data ||
          []).filter(
          (
            x
          ) =>
            dentroPeriodo(
              x.created_at ||
                x.data
            )
        )
      )
    }

    setLoading(false)
  }

  async function verChamada(
    item: any
  ) {
    setChamadaSelecionada(
      item
    )

    const {
      data:
        matriculados,
    } =
      await supabase
        .from(
          "matriculas"
        )
        .select("*")
        .eq(
          "turma",
          item.turma
        )
        .eq(
          "status",
          "ativo"
        )

    const presentes =
      item.registros.map(
        (
          x: any
        ) =>
          x.aluno_id
      )

    const lista =
      (
        matriculados ||
        []
      ).map(
        (
          al: any
        ) => ({
          ...al,
          presente:
            presentes.includes(
              al.aluno_id
            ),
        })
      )

    setDetalheChamada(
      lista
    )
  }

  async function abrirTurma(
    nome: string
  ) {
    setTurma(nome)

    const {
      data,
    } =
      await supabase
        .from(
          "matriculas"
        )
        .select("*")
        .eq(
          "turma",
          nome
        )
        .eq(
          "status",
          "ativo"
        )
        .order("nome")

    setAlunosTurma(
      data || []
    )
  }

  async function apagarChamada() {
    if (
      !confirm(
        "Apagar chamada?"
      )
    )
      return

    for (const item of detalheChamada) {
      if (
        item.presente
      ) {
        await supabase
          .from(
            "presencas"
          )
          .delete()
          .eq(
            "aluno_id",
            item.aluno_id
          )
          .eq(
            "turma",
            chamadaSelecionada.turma
          )
      }
    }

    setChamadaSelecionada(
      null
    )
    setDetalheChamada(
      []
    )

    carregar()
  }

  function imprimir() {
    window.print()
  }

  const total =
    useMemo(() => {
      if (
        aba ===
        "professores"
      ) {
        return dados.reduce(
          (
            acc,
            x
          ) =>
            acc +
            Number(
              x.valor_comissao ||
                0
            ),
          0
        )
      }

      return dados.length
    }, [dados, aba])

  return (
    <AdminGuard>
      <div className="p-4 max-w-7xl mx-auto">

        <div className="flex justify-between gap-3 flex-wrap mb-6">
          <h1 className="text-2xl font-bold">
            Central de Relatórios
          </h1>

          <button
            onClick={
              imprimir
            }
            className="btn"
          >
            🖨️ Imprimir
          </button>
        </div>

        <div className="flex gap-2 flex-wrap mb-6">

          <button className={`tab ${aba==="professores"?"ativo":""}`} onClick={()=>setAba("professores")}>
            Professores
          </button>

          <button className={`tab ${aba==="presenca"?"ativo":""}`} onClick={()=>setAba("presenca")}>
            Presença
          </button>

          <button className={`tab ${aba==="turmas"?"ativo":""}`} onClick={()=>setAba("turmas")}>
            Modalidades / Turmas
          </button>

          <button className={`tab ${aba==="parceiros"?"ativo":""}`} onClick={()=>setAba("parceiros")}>
            Parceiros
          </button>

        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-6">

          <input type="date" className="input" value={inicio} onChange={(e)=>setInicio(e.target.value)}/>
          <input type="date" className="input" value={fim} onChange={(e)=>setFim(e.target.value)}/>

        </div>

        {/* PROFESSORES */}
        {aba==="professores" && (
          <div className="card space-y-3">

            {dados.map((x:any,i:number)=>(
              <div key={i} className="linha between">
                <div>
                  {x.nome}<br/>
                  {x.tipo}
                </div>

                <div className="text-right">
                  <b>
                    R$ {Number(x.valor_comissao).toFixed(2)}
                  </b>
                </div>
              </div>
            ))}

            <div className="total">
              TOTAL: R$ {Number(total).toFixed(2)}
            </div>

          </div>
        )}

        {/* PRESENÇA */}
        {aba==="presenca" && (
          <div className="card space-y-3">

            {dados.map((x:any,i:number)=>(
              <div key={i} className="linha between">

                <div>
                  <b>{x.turma}</b><br/>
                  {new Date(x.data).toLocaleDateString()} {" "}
                  {new Date(x.data).toLocaleTimeString()}
                </div>

                <button className="mini green" onClick={()=>verChamada(x)}>
                  VER
                </button>

              </div>
            ))}

          </div>
        )}

        {/* DETALHE CHAMADA */}
        {chamadaSelecionada && (
          <div className="card mt-6">

            <h2 className="font-bold text-xl mb-4">
              {chamadaSelecionada.turma}
            </h2>

            {detalheChamada.map((x:any,i:number)=>(
              <div key={i} className="linha between">

                <span>{x.nome}</span>

                <span className={x.presente?"text-green-600":"text-red-600"}>
                  {x.presente ? "Presente" : "Ausente"}
                </span>

              </div>
            ))}

            <div className="grid grid-cols-2 gap-2 mt-4">
              <button className="btn" onClick={imprimir}>
                Imprimir
              </button>

              <button className="btn redbg" onClick={apagarChamada}>
                Apagar
              </button>
            </div>

          </div>
        )}

        {/* TURMAS */}
        {aba==="turmas" && (
          <div className="grid md:grid-cols-2 gap-6">

            <div className="card">

              {turmas.map((t:any,i:number)=>(
                <div key={i} className="linha" onClick={()=>abrirTurma(t.nome)}>
                  <b>{t.nome}</b><br/>
                  <small>{t.professor}</small>
                </div>
              ))}

            </div>

            <div className="card">

              <h2 className="font-bold mb-4">
                {turma || "Selecione uma turma"}
              </h2>

              {alunosTurma.map((a:any,i:number)=>(
                <div key={i} className="linha between">

                  <span>{a.nome}</span>

                  <span className="text-xs">
                    {a.modalidade}
                  </span>

                </div>
              ))}

            </div>

          </div>
        )}

        <style jsx>{`
          .input{
            width:100%;
            padding:14px;
            border:1px solid #ccc;
            border-radius:10px;
          }

          .btn{
            background:red;
            color:white;
            padding:12px 16px;
            border-radius:10px;
          }

          .redbg{
            background:#111;
          }

          .tab{
            background:white;
            padding:10px 16px;
            border-radius:10px;
            border:1px solid #ddd;
          }

          .ativo{
            background:red;
            color:white;
          }

          .card{
            background:white;
            padding:24px;
            border-radius:18px;
            box-shadow:0 2px 10px rgba(0,0,0,.08);
          }

          .linha{
            padding:14px;
            border-bottom:1px solid #eee;
          }

          .between{
            display:flex;
            justify-content:space-between;
            align-items:center;
          }

          .mini{
            background:#16a34a;
            color:white;
            padding:8px 12px;
            border-radius:10px;
          }

          .total{
            margin-top:10px;
            font-size:22px;
            font-weight:bold;
          }
        `}</style>

      </div>
    </AdminGuard>
  )
}