"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../../../lib/supabase"
import AdminGuard from "../../../../components/AdminGuard"
import { useParams, useRouter } from "next/navigation"

export default function EditarMensalidade() {
  const { id } = useParams()
  const router = useRouter()

  const [form, setForm] = useState<any>({
    nome: "",
    valor: 0,
    vencimento: "",
    status: "pendente",
    forma_pagamento: "",
  })

  useEffect(() => {
    carregar()
  }, [])

  const carregar = async () => {
    const { data } = await supabase
      .from("mensalidades")
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
      .from("mensalidades")
      .update(form)
      .eq("id", id)

    alert("Mensalidade atualizada")
    router.push("/registros")
  }

  const apagar = async () => {
    const ok = confirm("Deseja apagar esta mensalidade?")

    if (!ok) return

    await supabase
      .from("mensalidades")
      .delete()
      .eq("id", id)

    alert("Mensalidade apagada")
    router.push("/registros")
  }

  return (
    <AdminGuard>
      <div className="p-4 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">
          Editar Mensalidade
        </h1>

        <div className="grid gap-3">

          <input
            className="input"
            value={form.nome || ""}
            placeholder="Nome"
            disabled
          />

          <input
            className="input"
            type="number"
            value={form.valor || 0}
            placeholder="Valor"
            onChange={(e) =>
              setCampo("valor", e.target.value)
            }
          />

          <input
            className="input"
            type="date"
            value={form.vencimento || ""}
            onChange={(e) =>
              setCampo("vencimento", e.target.value)
            }
          />

          <select
            className="input"
            value={form.status || "pendente"}
            onChange={(e) =>
              setCampo("status", e.target.value)
            }
          >
            <option value="pendente">
              Pendente
            </option>
            <option value="pago">
              Pago
            </option>
          </select>

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
            <option value="">
              Forma de Pagamento
            </option>
            <option value="Pix">Pix</option>
            <option value="Dinheiro">
              Dinheiro
            </option>
            <option value="Cartão">
              Cartão
            </option>
          </select>

          <button
            onClick={salvar}
            className="btn"
          >
            Salvar Alterações
          </button>

          <button
            onClick={apagar}
            className="btn red"
          >
            Apagar Mensalidade
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

          .red {
            background: #b91c1c;
          }
        `}</style>
      </div>
    </AdminGuard>
  )
}