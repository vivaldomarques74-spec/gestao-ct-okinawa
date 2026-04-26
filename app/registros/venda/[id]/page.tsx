"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../../../lib/supabase"
import AdminGuard from "../../../../components/AdminGuard"
import { useParams, useRouter } from "next/navigation"

export default function EditarVenda() {
  const { id } = useParams()
  const router = useRouter()

  const [form, setForm] = useState<any>({
    nome: "",
    valor: 0,
    forma_pagamento: "",
    tipo_cartao: "",
    parcelas: "",
  })

  useEffect(() => {
    carregar()
  }, [])

  const carregar = async () => {
    const { data } = await supabase
      .from("caixa")
      .select("*")
      .eq("id", id)
      .single()

    if (data) setForm(data)
  }

  const setCampo = (campo: string, valor: any) => {
    setForm({ ...form, [campo]: valor })
  }

  const salvar = async () => {
    await supabase
      .from("caixa")
      .update(form)
      .eq("id", id)

    alert("Venda atualizada")
    router.push("/registros")
  }

  const apagar = async () => {
    const ok = confirm("Deseja apagar esta venda?")

    if (!ok) return

    await supabase
      .from("caixa")
      .delete()
      .eq("id", id)

    alert("Venda apagada")
    router.push("/registros")
  }

  const imprimir = () => {
    const agora = new Date()

    const w = window.open("", "", "width=300,height=600")

    w?.document.write(`
      <html>
      <body style="font-family:monospace;width:58mm">

      <div style="text-align:center">
        <b>CT OKINAWA</b><br/>
        Disciplina - Respeito - Evolução
      </div>

      <hr/>

      <div><b>Recibo de Venda</b></div>

      <div>Produto: ${form.nome}</div>
      <div>Valor: R$ ${form.valor}</div>
      <div>Pagamento: ${form.forma_pagamento}</div>

      ${
        form.forma_pagamento === "Cartão"
          ? `
        <div>${form.tipo_cartao}</div>
        <div>${form.parcelas}</div>
      `
          : ""
      }

      <hr/>

      <div>${agora.toLocaleDateString()}</div>
      <div>${agora.toLocaleTimeString()}</div>

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

  return (
    <AdminGuard>
      <div className="p-4 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">
          Editar Venda
        </h1>

        <div className="grid gap-3">

          <input
            className="input"
            placeholder="Nome"
            value={form.nome || ""}
            onChange={(e) =>
              setCampo("nome", e.target.value)
            }
          />

          <input
            className="input"
            type="number"
            placeholder="Valor"
            value={form.valor || 0}
            onChange={(e) =>
              setCampo("valor", e.target.value)
            }
          />

          <select
            className="input"
            value={form.forma_pagamento || ""}
            onChange={(e) =>
              setCampo(
                "forma_pagamento",
                e.target.value
              )
            }
          >
            <option value="">Pagamento</option>
            <option value="Pix">Pix</option>
            <option value="Dinheiro">
              Dinheiro
            </option>
            <option value="Cartão">
              Cartão
            </option>
          </select>

          {form.forma_pagamento === "Cartão" && (
            <>
              <select
                className="input"
                value={form.tipo_cartao || ""}
                onChange={(e) =>
                  setCampo(
                    "tipo_cartao",
                    e.target.value
                  )
                }
              >
                <option value="">
                  Tipo Cartão
                </option>
                <option value="Crédito">
                  Crédito
                </option>
                <option value="Débito">
                  Débito
                </option>
              </select>

              <select
                className="input"
                value={form.parcelas || ""}
                onChange={(e) =>
                  setCampo(
                    "parcelas",
                    e.target.value
                  )
                }
              >
                <option value="">
                  Parcelas
                </option>
                <option value="1x">1x</option>
                <option value="2x">2x</option>
                <option value="3x">3x</option>
                <option value="4x">4x</option>
                <option value="5x">5x</option>
                <option value="6x">6x</option>
              </select>
            </>
          )}

          <button
            onClick={salvar}
            className="btn"
          >
            Salvar Alterações
          </button>

          <button
            onClick={imprimir}
            className="btn blue"
          >
            Reemitir Recibo
          </button>

          <button
            onClick={apagar}
            className="btn red"
          >
            Apagar Venda
          </button>

        </div>

        <style jsx>{`
          .input {
            width: 100%;
            padding: 12px;
            border: 1px solid #ccc;
            border-radius: 10px;
            background: white;
            color: black;
          }

          .btn {
            background: red;
            color: white;
            padding: 14px;
            border-radius: 10px;
          }

          .blue {
            background: #2563eb;
          }

          .red {
            background: #b91c1c;
          }
        `}</style>
      </div>
    </AdminGuard>
  )
}