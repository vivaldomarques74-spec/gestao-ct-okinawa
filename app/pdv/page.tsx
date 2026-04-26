"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"

export default function PDV() {
  const [produtos, setProdutos] =
    useState<any[]>([])

  const [carrinho, setCarrinho] =
    useState<any[]>([])

  const [
    formaPagamento,
    setFormaPagamento,
  ] = useState("Pix")

  const [
    tipoCartao,
    setTipoCartao,
  ] = useState("Crédito")

  const [parcelas, setParcelas] =
    useState("1x")

  const [salvando, setSalvando] =
    useState(false)

  useEffect(() => {
    carregarProdutos()
  }, [])

  const carregarProdutos =
    async () => {
      const { data } =
        await supabase
          .from("produtos")
          .select("*")
          .eq(
            "status",
            "ativo"
          )
          .gt(
            "estoque",
            0
          )
          .order("nome")

      setProdutos(data || [])
    }

  const adicionar =
    (produto: any) => {
      setCarrinho([
        ...carrinho,
        produto,
      ])
    }

  const remover =
    (index: number) => {
      const copia = [
        ...carrinho,
      ]

      copia.splice(
        index,
        1
      )

      setCarrinho(copia)
    }

  const totalBase =
    carrinho.reduce(
      (
        acc,
        item
      ) =>
        acc +
        Number(
          item.preco || 0
        ),
      0
    )

  const taxaCredito =
    (parcela: number) => {
      const taxas: any = {
        1: 3.05,
        2: 6.59,
        3: 8.19,
        4: 8.89,
        5: 9.76,
        6: 11.1,
        7: 11.68,
        8: 11.73,
        9: 11.78,
        10: 11.83,
        11: 11.88,
        12: 11.95,
        13: 12.59,
        14: 13.23,
        15: 13.87,
        16: 14.51,
        17: 15.15,
        18: 15.79,
      }

      return (
        taxas[parcela] || 0
      )
    }

  const calcularTotal =
    () => {
      let total =
        totalBase

      if (
        formaPagamento ===
        "Cartão"
      ) {
        if (
          tipoCartao ===
          "Débito"
        ) {
          total =
            totalBase *
            1.0125
        }

        if (
          tipoCartao ===
          "Crédito"
        ) {
          const num =
            parseInt(
              parcelas.replace(
                "x",
                ""
              )
            )

          const taxa =
            taxaCredito(
              num
            )

          total =
            totalBase *
            (1 +
              taxa /
                100)
        }
      }

      return Number(
        total.toFixed(
          2
        )
      )
    }

  const totalFinal =
    calcularTotal()

  const finalizar =
    async () => {
      if (
        carrinho.length ===
        0
      ) {
        alert(
          "Adicione produtos"
        )
        return
      }

      setSalvando(true)

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
          .order(
            "aberto_em",
            {
              ascending:
                false,
            }
          )
          .limit(1)
          .maybeSingle()

      if (!caixa) {
        alert(
          "Nenhum caixa aberto"
        )
        setSalvando(
          false
        )
        return
      }

      const nomes =
        carrinho
          .map(
            (p) =>
              p.nome
          )
          .join(", ")

      const parceiroVenda =
        carrinho.find(
          (p) =>
            p.tipo ===
            "parceiro"
        )?.parceiro ||
        null

      /* SALVA VENDA */
      const {
        error,
      } =
        await supabase
          .from(
            "caixa"
          )
          .insert([
            {
              tipo: "venda",
              nome: nomes,
              valor:
                totalFinal,
              valor_base:
                totalBase,
              forma_pagamento:
                formaPagamento,
              tipo_cartao:
                formaPagamento ===
                "Cartão"
                  ? tipoCartao
                  : null,
              parcelas:
                formaPagamento ===
                  "Cartão" &&
                tipoCartao ===
                  "Crédito"
                  ? parcelas
                  : null,
              caixa_id:
                caixa.id,
              parceiro:
                parceiroVenda,
            },
          ])

      if (error) {
        alert(
          error.message
        )
        setSalvando(
          false
        )
        return
      }

      /* BAIXA ESTOQUE */
      for (const item of carrinho) {
        const novo =
          Number(
            item.estoque ||
              0
          ) - 1

        await supabase
          .from(
            "produtos"
          )
          .update({
            estoque:
              novo,
          })
          .eq(
            "id",
            item.id
          )

        await supabase
          .from(
            "estoque_movimentacoes"
          )
          .insert([
            {
              produto_id:
                item.id,
              produto:
                item.nome,
              tipo: "saida",
              quantidade: 1,
              custo:
                Number(
                  item.custo ||
                    0
                ),
              observacao:
                "Venda PDV",
            },
          ])
      }

      gerarRecibo()

      setCarrinho([])
      setSalvando(false)

      await carregarProdutos()

      alert(
        "Venda finalizada!"
      )
    }

  const gerarRecibo =
    () => {
      const agora =
        new Date()

      const taxa =
        totalFinal -
        totalBase

      const itens =
        carrinho
          .map(
            (
              item
            ) =>
              `${item.nome} .... R$ ${Number(
                item.preco
              ).toFixed(
                2
              )}`
          )
          .join(
            "<br/>"
          )

      const w =
        window.open(
          "",
          "",
          "width=300,height=700"
        )

      w?.document.write(`
      <html>
      <body style="font-family:monospace;width:58mm">

      <div style="text-align:center">
        <img src="${window.location.origin}/logo.png" style="width:90px"/>
      </div>

      <div style="text-align:center"><b>CT OKINAWA</b></div>
      <div style="text-align:center">Disciplina • Respeito • Evolução</div>

      <hr/>

      ${itens}

      <hr/>

      <div>Subtotal: R$ ${totalBase.toFixed(
        2
      )}</div>

      <div>Taxa: R$ ${taxa.toFixed(
        2
      )}</div>

      <div><b>TOTAL: R$ ${totalFinal.toFixed(
        2
      )}</b></div>

      <hr/>

      <div>Pagamento: ${formaPagamento}</div>

      ${
        formaPagamento ===
        "Cartão"
          ? `<div>${tipoCartao} ${
              tipoCartao ===
              "Crédito"
                ? "- " +
                  parcelas
                : ""
            }</div>`
          : ""
      }

      <hr/>

      <div>${agora.toLocaleDateString()}</div>
      <div>${agora.toLocaleTimeString()}</div>

      <hr/>

      <div style="text-align:center">Provérbios 13:3</div>

      <br/>

      <div style="text-align:center">
        Obrigado pela preferência!
      </div>

      <div style="text-align:center">
        Volte sempre 🙏
      </div>

      <script>
        window.onload=()=>{
          setTimeout(()=>{
            window.print();
            window.close();
          },300)
        }
      </script>

      </body>
      </html>
      `)

      w?.document.close()
    }

  return (
    <div className="p-4 max-w-md mx-auto">

      <h1 className="text-xl font-bold mb-4 text-center">
        PDV
      </h1>

      {/* PRODUTOS */}
      <div className="grid grid-cols-2 gap-2">

        {produtos.map(
          (p) => (
            <button
              key={p.id}
              className="bg-white p-3 rounded shadow text-black"
              onClick={() =>
                adicionar(
                  p
                )
              }
            >
              {p.nome}
              <br />
              R${" "}
              {Number(
                p.preco
              ).toFixed(
                2
              )}
              <br />
              <small>
                Estoque:
                {" "}
                {
                  p.estoque
                }
              </small>
            </button>
          )
        )}

      </div>

      {/* CARRINHO */}
      <div className="mt-4 bg-white p-4 rounded shadow text-black">

        <h2 className="font-bold mb-2">
          Carrinho
        </h2>

        {carrinho.map(
          (
            item,
            i
          ) => (
            <div
              key={i}
              className="flex justify-between border-b py-1"
            >
              <span>
                {
                  item.nome
                }
              </span>

              <button
                onClick={() =>
                  remover(
                    i
                  )
                }
              >
                ❌
              </button>
            </div>
          )
        )}

      </div>

      {/* TOTAL */}
      <div className="mt-4 bg-black text-white p-4 rounded">

        <p>
          Base: R${" "}
          {totalBase.toFixed(
            2
          )}
        </p>

        <p className="text-xl">
          <b>
            Total: R${" "}
            {totalFinal.toFixed(
              2
            )}
          </b>
        </p>

      </div>

      {/* PAGAMENTO */}
      <select
        className="input mt-3"
        value={
          formaPagamento
        }
        onChange={(
          e
        ) =>
          setFormaPagamento(
            e.target
              .value
          )
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

      {formaPagamento ===
        "Cartão" && (
        <>
          <select
            className="input mt-2"
            value={
              tipoCartao
            }
            onChange={(
              e
            ) =>
              setTipoCartao(
                e.target
                  .value
              )
            }
          >
            <option>
              Débito
            </option>

            <option>
              Crédito
            </option>
          </select>

          {tipoCartao ===
            "Crédito" && (
            <select
              className="input mt-2"
              value={
                parcelas
              }
              onChange={(
                e
              ) =>
                setParcelas(
                  e.target
                    .value
                )
              }
            >
              {Array.from(
                {
                  length: 18,
                },
                (
                  _,
                  i
                ) => (
                  <option
                    key={i}
                  >
                    {i + 1}
                    x
                  </option>
                )
              )}
            </select>
          )}
        </>
      )}

      <button
        onClick={
          finalizar
        }
        disabled={
          salvando
        }
        className="btn mt-4 w-full"
      >
        {salvando
          ? "Processando..."
          : "Finalizar Venda"}
      </button>

      <style jsx>{`
        .input {
          width: 100%;
          padding: 12px;
          border: 1px solid #ccc;
          border-radius: 8px;
        }

        .btn {
          background: red;
          color: white;
          padding: 12px;
          border-radius: 8px;
        }
      `}</style>

    </div>
  )
}