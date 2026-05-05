"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"

export default function Caixa() {
  const [codigo, setCodigo] = useState("")
  const [valorInicial, setValorInicial] = useState("")
  const [caixa, setCaixa] = useState<any>(null)
  const [movimentacoes, setMovimentacoes] = useState<any[]>([])
  const [resumo, setResumo] = useState({ total: 0, matricula: 0, mensalidade: 0, venda: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    carregarCaixa()
  }, [])

  async function carregarCaixa() {
    setLoading(true)
    const { data, error } = await supabase
      .from("caixa_turno")
      .select("*")
      .eq("status", "aberto")
      .order("aberto_em", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) console.error(error)
    setCaixa(data)

    if (data) {
      await carregarMovimentacoes(data.id)
    } else {
      setMovimentacoes([])
      setResumo({ total: 0, matricula: 0, mensalidade: 0, venda: 0 })
    }
    setLoading(false)
  }

  async function carregarMovimentacoes(caixaTurnoId: string) {
    const { data } = await supabase
      .from("caixa")
      .select("*")
      .eq("caixa_turno_id", caixaTurnoId)
      .order("data", { ascending: false })

    setMovimentacoes(data || [])
    let total = 0, mat = 0, mens = 0, vend = 0
    for (const item of data || []) {
      const valor = Number(item.valor)
      total += valor
      if (item.tipo === "matricula") mat += valor
      else if (item.tipo === "mensalidade") mens += valor
      else if (item.tipo === "venda") vend += valor
    }
    setResumo({ total, matricula: mat, mensalidade: mens, venda: vend })
  }

  async function abrirCaixa() {
    if (!codigo) return alert("Digite o código do operador")
    const { data: operador } = await supabase
      .from("operadores")
      .select("*")
      .eq("codigo", codigo)
      .maybeSingle()
    if (!operador) return alert("Código inválido")

    const { error } = await supabase.from("caixa_turno").insert([{
      usuario: operador.nome,
      codigo_abertura: codigo,
      valor_inicial: Number(valorInicial) || 0,
      status: "aberto",
      aberto_em: new Date().toISOString(),
    }])
    if (error) return alert("Erro: " + error.message)
    alert("Caixa aberto com sucesso")
    setCodigo("")
    setValorInicial("")
    carregarCaixa()
  }

  async function fecharCaixa() {
    if (!caixa) return
    if (!codigo) return alert("Digite o código para fechar")
    const { data: operador } = await supabase
      .from("operadores")
      .select("*")
      .eq("codigo", codigo)
      .maybeSingle()
    if (!operador) return alert("Código inválido")

    const totalFinal = (Number(caixa.valor_inicial) || 0) + resumo.total
    const { error } = await supabase
      .from("caixa_turno")
      .update({
        status: "fechado",
        fechado_em: new Date().toISOString(),
        operador_fechamento: operador.nome,
        codigo_fechamento: codigo,
        valor_final: totalFinal,
      })
      .eq("id", caixa.id)

    if (error) return alert("Erro ao fechar: " + error.message)
    gerarReciboFechamento(operador.nome, totalFinal)
    alert("Caixa fechado")
    setCaixa(null)
    setCodigo("")
    carregarCaixa()
  }

  function gerarReciboFechamento(fechou: string, total: number) {
    const w = window.open("", "", "width=400,height=600")
    w?.document.write(`
      <html>
      <head>
        <title>Fechamento de Caixa</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { width: 58mm; margin: 0 auto; padding: 2mm; font-family: monospace; font-size: 10pt; line-height: 1.2; }
          .logo { text-align: center; margin-bottom: 4px; }
          .logo img { max-width: 40mm; height: auto; }
          .titulo { text-align: center; font-weight: bold; font-size: 12pt; margin: 4px 0; }
          hr { border: none; border-top: 1px dashed #000; margin: 4px 0; }
          .total { font-weight: bold; font-size: 11pt; }
          .verse { text-align: center; margin-top: 8px; font-style: italic; }
          .center { text-align: center; }
        </style>
      </head>
      <body>
        <div class="logo"><img src="${window.location.origin}/logo.png" /></div>
        <div class="titulo">CT OKINAWA</div>
        <div class="center">FECHAMENTO DE CAIXA</div>
        <hr/>
        <div>Aberto por: ${caixa.usuario}</div>
        <div>Fechado por: ${fechou}</div>
        <div>Abertura: ${new Date(caixa.aberto_em).toLocaleString()}</div>
        <div>Fechamento: ${new Date().toLocaleString()}</div>
        <hr/>
        <div>Valor Inicial: R$ ${Number(caixa.valor_inicial).toFixed(2)}</div>
        <div>Matrículas: R$ ${resumo.matricula.toFixed(2)}</div>
        <div>Mensalidades: R$ ${resumo.mensalidade.toFixed(2)}</div>
        <div>Vendas PDV: R$ ${resumo.venda.toFixed(2)}</div>
        <hr/>
        <div class="total">TOTAL FINAL: R$ ${total.toFixed(2)}</div>
        <hr/>
        <div class="verse">"Confie no Senhor"<br/>Provérbios 3:5</div>
        <div class="center">Obrigado!</div>
        <script>
          window.onload = () => {
            setTimeout(() => { window.print(); setTimeout(() => window.close(), 500); }, 200);
          }
        </script>
      </body>
      </html>
    `)
    w?.document.close()
  }

  if (loading) return <div className="p-6">Carregando...</div>

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Controle de Caixa</h1>

      {!caixa ? (
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="font-bold mb-4">Abrir Caixa</h2>
          <input className="w-full p-2 border rounded mb-2" placeholder="Código Operador" value={codigo} onChange={e=>setCodigo(e.target.value)} />
          <input className="w-full p-2 border rounded mb-2" placeholder="Valor Inicial" value={valorInicial} onChange={e=>setValorInicial(e.target.value)} />
          <button onClick={abrirCaixa} className="w-full bg-red-600 text-white p-2 rounded">Abrir Caixa</button>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="font-bold text-green-600">Caixa Aberto</h2>
          <p>Operador: {caixa.usuario}</p>
          <p>Aberto em: {new Date(caixa.aberto_em).toLocaleString()}</p>
          <p>Valor Inicial: R$ {Number(caixa.valor_inicial).toFixed(2)}</p>
          <hr className="my-4" />
          <h3 className="font-bold">Movimentações</h3>
          <div className="max-h-64 overflow-auto mb-4">
            {movimentacoes.map(m => (
              <div key={m.id} className="border-b py-2 flex justify-between">
                <span>{new Date(m.data).toLocaleString()} - {m.tipo}</span>
                <span>R$ {Number(m.valor).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <hr />
          <p>Total Matrículas: R$ {resumo.matricula.toFixed(2)}</p>
          <p>Total Mensalidades: R$ {resumo.mensalidade.toFixed(2)}</p>
          <p>Total Vendas: R$ {resumo.venda.toFixed(2)}</p>
          <h3 className="text-xl font-bold mt-2">Total do dia: R$ {(Number(caixa.valor_inicial) + resumo.total).toFixed(2)}</h3>

          <input className="w-full p-2 border rounded mt-4" placeholder="Código para fechar" value={codigo} onChange={e=>setCodigo(e.target.value)} />
          <button onClick={fecharCaixa} className="w-full bg-red-600 text-white p-2 rounded mt-2">Fechar Caixa</button>
        </div>
      )}
    </div>
  )
}