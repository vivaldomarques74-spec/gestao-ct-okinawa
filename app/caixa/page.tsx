"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"

export default function Caixa() {
  const [codigo, setCodigo] =
    useState("")

  const [valorInicial, setValorInicial] =
    useState("")

  const [caixa, setCaixa] =
    useState<any>(null)

  const [resumo, setResumo] =
    useState({
      total: 0,
      pdv: 0,
      matricula: 0,
      mensalidade: 0,
    })

  const [loading, setLoading] =
    useState(true)

  useEffect(() => {
    carregarCaixa()
  }, [])

  const carregarCaixa =
    async () => {
      setLoading(true)

      const {
        data,
        error,
      } = await supabase
        .from("caixa_turno")
        .select("*")
        .eq("status", "aberto")
        .order("created_at", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle()

      if (error) {
        console.log(error)
      }

      setCaixa(data)

      if (data) {
        carregarResumo(
          data.id
        )
      } else {
        setResumo({
          total: 0,
          pdv: 0,
          matricula: 0,
          mensalidade: 0,
        })
      }

      setLoading(false)
    }

  const carregarResumo =
    async (
      caixaId: any
    ) => {
      const { data } =
        await supabase
          .from("caixa")
          .select("*")
          .eq(
            "caixa_id",
            caixaId
          )

      let total = 0
      let pdv = 0
      let matricula = 0
      let mensalidade = 0

      ;(
        data || []
      ).forEach(
        (item: any) => {
          const valor =
            Number(
              item.valor || 0
            )

          total += valor

          if (
            item.tipo ===
            "venda"
          )
            pdv += valor

          if (
            item.tipo ===
            "matricula"
          )
            matricula += valor

          if (
            item.tipo ===
            "mensalidade"
          )
            mensalidade += valor
        }
      )

      setResumo({
        total,
        pdv,
        matricula,
        mensalidade,
      })
    }

  const abrirCaixa =
    async () => {
      if (!codigo) {
        alert(
          "Digite o código do operador"
        )
        return
      }

      const {
        data:
          caixaAberto,
      } = await supabase
        .from(
          "caixa_turno"
        )
        .select("*")
        .eq(
          "status",
          "aberto"
        )
        .maybeSingle()

      if (caixaAberto) {
        alert(
          `Caixa já aberto por ${caixaAberto.usuario} às ${new Date(
            caixaAberto.created_at
          ).toLocaleString(
            "pt-BR"
          )}`
        )

        setCaixa(
          caixaAberto
        )

        carregarResumo(
          caixaAberto.id
        )

        return
      }

      const {
        data:
          operador,
      } = await supabase
        .from(
          "operadores"
        )
        .select("*")
        .eq(
          "codigo",
          codigo
        )
        .maybeSingle()

      if (!operador) {
        alert(
          "Código inválido"
        )
        return
      }

      const {
        error,
      } = await supabase
        .from(
          "caixa_turno"
        )
        .insert([
          {
            usuario:
              operador.nome,
            codigo_abertura:
              codigo,
            valor_inicial:
              Number(
                valorInicial ||
                  0
              ),
            status:
              "aberto",
          },
        ])

      if (error) {
        console.log(error)

        alert(
          "Erro ao abrir caixa: " +
            error.message
        )
        return
      }

      alert(
        "Caixa aberto com sucesso"
      )

      setCodigo("")
      setValorInicial("")

      carregarCaixa()
    }

  const fecharCaixa =
    async () => {
      if (!caixa) return

      const {
        data:
          operador,
      } = await supabase
        .from(
          "operadores"
        )
        .select("*")
        .eq(
          "codigo",
          codigo
        )
        .maybeSingle()

      if (!operador) {
        alert(
          "Digite código válido para fechar"
        )
        return
      }

      const totalFinal =
        Number(
          caixa.valor_inicial ||
            0
        ) +
        resumo.total

      const {
        error,
      } = await supabase
        .from(
          "caixa_turno"
        )
        .update({
          status:
            "fechado",
          fechado_em:
            new Date(),
          operador_fechamento:
            operador.nome,
          codigo_fechamento:
            codigo,
          valor_final:
            totalFinal,
        })
        .eq(
          "id",
          caixa.id
        )

      if (error) {
        console.log(error)

        alert(
          "Erro ao fechar caixa: " +
            error.message
        )
        return
      }

      gerarRecibo(
        operador.nome,
        totalFinal
      )

      alert(
        "Caixa fechado com sucesso"
      )

      setCodigo("")
      setCaixa(null)

      carregarCaixa()
    }

  const gerarRecibo =
    (
      fechou: string,
      total: number
    ) => {
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
<img src="${window.location.origin}/logo.png" style="width:90px"/>
<h2>CT OKINAWA</h2>
<p>FECHAMENTO DE CAIXA</p>
</div>

<hr/>

<p>Aberto por: ${
        caixa.usuario
      }</p>

<p>Fechado por: ${fechou}</p>

<p>Abertura: ${new Date(
        caixa.created_at
      ).toLocaleString(
        "pt-BR"
      )}</p>

<p>Fechamento: ${new Date().toLocaleString(
        "pt-BR"
      )}</p>

<hr/>

<p>Valor Inicial: R$ ${Number(
        caixa.valor_inicial || 0
      ).toFixed(2)}</p>

<p>PDV: R$ ${resumo.pdv.toFixed(
        2
      )}</p>

<p>Matrículas: R$ ${resumo.matricula.toFixed(
        2
      )}</p>

<p>Mensalidades: R$ ${resumo.mensalidade.toFixed(
        2
      )}</p>

<hr/>

<h3>TOTAL: R$ ${total.toFixed(
        2
      )}</h3>

<hr/>

<p style="text-align:center">
Provérbios 16:3
</p>

<p style="text-align:center">
Obrigado!!!
</p>

<script>
window.onload = ()=>{
window.print();
setTimeout(()=>window.close(),500);
}
</script>

</body>
</html>
      `)

      w?.document.close()
    }

  if (loading) {
    return (
      <div className="p-6">
        Carregando caixa...
      </div>
    )
  }

  return (
    <div className="p-6">

      <h1 className="text-2xl font-bold mb-6">
        Controle de Caixa
      </h1>

      {!caixa ? (
        <div className="box">

          <h2 className="font-bold mb-4">
            Abrir Caixa
          </h2>

          <input
            placeholder="Código Operador"
            className="input"
            value={codigo}
            onChange={(e) =>
              setCodigo(
                e.target.value
              )
            }
          />

          <input
            placeholder="Valor Inicial"
            className="input"
            value={
              valorInicial
            }
            onChange={(e) =>
              setValorInicial(
                e.target.value
              )
            }
          />

          <button
            onClick={
              abrirCaixa
            }
            className="btn"
          >
            Abrir Caixa
          </button>

        </div>
      ) : (
        <div className="box">

          <h2 className="font-bold text-green-600 mb-3">
            Caixa Aberto
          </h2>

          <p>
            Operador:{" "}
            {
              caixa.usuario
            }
          </p>

          <p>
            Aberto em:{" "}
            {new Date(
              caixa.created_at
            ).toLocaleString(
              "pt-BR"
            )}
          </p>

          <p>
            Valor Inicial:
            R$ {" "}
            {Number(
              caixa.valor_inicial || 0
            ).toFixed(
              2
            )}
          </p>

          <hr className="my-4" />

          <p>
            PDV: R${" "}
            {resumo.pdv.toFixed(
              2
            )}
          </p>

          <p>
            Matrículas:
            R${" "}
            {resumo.matricula.toFixed(
              2
            )}
          </p>

          <p>
            Mensalidades:
            R${" "}
            {resumo.mensalidade.toFixed(
              2
            )}
          </p>

          <h3 className="mt-4 text-xl font-bold">
            Total Sistema:
            R${" "}
            {(
              Number(
                caixa.valor_inicial || 0
              ) +
              resumo.total
            ).toFixed(
              2
            )}
          </h3>

          <input
            placeholder="Código para fechar"
            className="input mt-4"
            value={codigo}
            onChange={(e) =>
              setCodigo(
                e.target.value
              )
            }
          />

          <button
            onClick={
              fecharCaixa
            }
            className="btn mt-3"
          >
            Fechar Caixa
          </button>

        </div>
      )}

      <style jsx>{`
        .box {
          background: white;
          color: black;
          padding: 24px;
          border-radius: 16px;
          max-width: 500px;
        }

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
      `}</style>

    </div>
  )
}