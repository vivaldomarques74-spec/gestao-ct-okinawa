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

  useEffect(() => {
    carregarCaixa()
  }, [])

  const carregarCaixa =
    async () => {
      const { data } =
        await supabase
          .from("caixa_turno")
          .select("*")
          .eq("status", "aberto")
          .maybeSingle()

      setCaixa(data)

      if (data) {
        carregarResumo(
          data.id
        )
      }
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
          total += Number(
            item.valor || 0
          )

          if (
            item.tipo ===
            "venda"
          )
            pdv += Number(
              item.valor
            )

          if (
            item.tipo ===
            "matricula"
          )
            matricula +=
              Number(
                item.valor
              )

          if (
            item.tipo ===
            "mensalidade"
          )
            mensalidade +=
              Number(
                item.valor
              )
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
          "Digite código"
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

      const { error } =
        await supabase
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
        alert(
          "Erro ao abrir caixa"
        )
        return
      }

      alert(
        "Caixa aberto"
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

      const valorFinal =
        Number(
          caixa.valor_inicial ||
            0
        ) +
        resumo.total

      await supabase
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
            valorFinal,
        })
        .eq(
          "id",
          caixa.id
        )

      gerarRecibo(
        operador.nome,
        valorFinal
      )

      alert(
        "Caixa fechado"
      )

      setCodigo("")
      setCaixa(null)
      setResumo({
        total: 0,
        pdv: 0,
        matricula: 0,
        mensalidade: 0,
      })

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
      ).toLocaleString()}</p>

<p>Fechamento: ${new Date().toLocaleString()}</p>

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

          <h2 className="font-bold mb-4 text-green-600">
            Caixa Aberto
          </h2>

          <p>
            Operador:{" "}
            {
              caixa.usuario
            }
          </p>

          <p>
            Inicial: R${" "}
            {Number(
              caixa.valor_inicial
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
            Matrículas: R${" "}
            {resumo.matricula.toFixed(
              2
            )}
          </p>

          <p>
            Mensalidades: R${" "}
            {resumo.mensalidade.toFixed(
              2
            )}
          </p>

          <h3 className="mt-4 text-xl font-bold">
            Total Sistema: R${" "}
            {(
              Number(
                caixa.valor_inicial
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