"use client"

import { useState } from "react"
import { supabase } from "../../lib/supabase"

export default function Mensalidades() {
  const [nome, setNome] = useState("")
  const [dados, setDados] = useState<any>(null)

  const [formaPagamento, setFormaPagamento] = useState("Pix")
  const [tipoCartao, setTipoCartao] = useState("Crédito")
  const [parcelas, setParcelas] = useState("1x")

  const buscar = async () => {
    const { data } = await supabase
      .from("mensalidades")
      .select("*")
      .ilike("nome", `%${nome}%`)
      .eq("status", "pendente")
      .order("vencimento", { ascending: true })
      .limit(1)
      .single()

    if (!data) {
      alert("Nenhuma mensalidade encontrada")
      return
    }

    setDados(data)
  }

  const calcularValorFinal = () => {
    if (!dados) return 0

    let valor = dados.valor

    if (formaPagamento === "Pix" || formaPagamento === "Dinheiro") {
      valor -= 10
    }

    return valor
  }

  const gerarRecibo = (valorFinal:any) => {
    const agora = new Date()

    const w = window.open("", "", "width=300,height=600")

    w?.document.write(`
      <html>
      <body style="font-family:monospace;width:58mm">

      <div style="text-align:center">
        <img src="${window.location.origin}/logo.png" style="width:100px"/>
      </div>

      <div style="text-align:center"><b>CT OKINAWA</b></div>
      <div style="text-align:center">Disciplina - Respeito - Evolução</div>

      <hr/>

      <div><b>Recibo de Mensalidade</b></div>

      <hr/>

      <div>NOME: ${dados.nome}</div>
      <div>MÊS REFERENTE: ${new Date(dados.vencimento).toLocaleDateString()}</div>

      <hr/>

      <div>VALOR BASE: R$ ${dados.valor}</div>
      <div>DESCONTO: R$ ${(formaPagamento === "Pix" || formaPagamento === "Dinheiro") ? 10 : 0}</div>
      <div><b>VALOR: R$ ${valorFinal}</b></div>

      <hr/>

      <div>FORMA: ${formaPagamento}</div>
      ${
        formaPagamento === "Cartão"
          ? `<div>${tipoCartao} - ${parcelas}</div>`
          : ""
      }

      <hr/>

      <div>Data: ${agora.toLocaleDateString()}</div>
      <div>Hora: ${agora.toLocaleTimeString()}</div>

      <div>Cupom não fiscal</div>

      <hr/>

      <div style="text-align:center">Provérbios 13:3</div>
      <div style="text-align:center">Deus abençoe!</div>

      <script>
        window.onload = () => {
          setTimeout(()=>{window.print();window.close()},300)
        }
      </script>

      </body>
      </html>
    `)

    w?.document.close()
  }

  const pagar = async () => {
    if (!dados) return

    const { data: caixa } = await supabase
      .from("caixa_turno")
      .select("*")
      .eq("status", "aberto")
      .single()

    if (!caixa) {
      alert("Nenhum caixa aberto")
      return
    }

    const valorFinal = calcularValorFinal()

    await supabase.from("caixa").insert([
      {
        tipo: "mensalidade",
        nome: dados.nome,
        valor: valorFinal,
        forma_pagamento: formaPagamento,
        caixa_id: caixa.id,
      },
    ])

    await supabase
      .from("mensalidades")
      .update({ status: "pago" })
      .eq("id", dados.id)

    const prox = new Date(dados.vencimento)
    prox.setMonth(prox.getMonth() + 1)

    await supabase.from("mensalidades").insert([
      {
        aluno_id: dados.aluno_id,
        nome: dados.nome,
        valor: dados.valor,
        vencimento: prox,
        status: "pendente",
      },
    ])

    gerarRecibo(valorFinal)

    alert("Mensalidade paga")

    setDados(null)
    setNome("")
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Mensalidades</h1>

      <input
        placeholder="Nome do aluno"
        className="input mb-4"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
      />

      <button onClick={buscar} className="btn mb-4">
        Buscar
      </button>

      {dados && (
        <div className="bg-white p-6 rounded shadow text-black">

          <p><b>Aluno:</b> {dados.nome}</p>
          <p><b>Valor Base:</b> R$ {dados.valor}</p>
          <p><b>Vencimento:</b> {new Date(dados.vencimento).toLocaleDateString()}</p>

          <div className="mt-4">
            <select
              className="input"
              value={formaPagamento}
              onChange={(e) => setFormaPagamento(e.target.value)}
            >
              <option>Pix</option>
              <option>Dinheiro</option>
              <option>Cartão</option>
            </select>
          </div>

          {formaPagamento === "Cartão" && (
            <>
              <select
                className="input mt-2"
                value={tipoCartao}
                onChange={(e) => setTipoCartao(e.target.value)}
              >
                <option>Crédito</option>
                <option>Débito</option>
              </select>

              {tipoCartao === "Crédito" && (
                <select
                  className="input mt-2"
                  value={parcelas}
                  onChange={(e) => setParcelas(e.target.value)}
                >
                  <option>1x</option>
                  <option>2x</option>
                  <option>3x</option>
                </select>
              )}
            </>
          )}

          <div className="mt-4 bg-black text-white p-4 rounded">
            <p>Valor Base: R$ {dados.valor}</p>
            <p>Desconto: R$ {(formaPagamento === "Pix" || formaPagamento === "Dinheiro") ? 10 : 0}</p>
            <p className="text-lg">
              Total: <b>R$ {calcularValorFinal()}</b>
            </p>
          </div>

          <button onClick={pagar} className="btn mt-4 w-full">
            Confirmar Pagamento
          </button>

        </div>
      )}

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