"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../../lib/supabase"
import AdminGuard from "../../../components/AdminGuard"

export default function ParceiroDetalhePage({ params }: { params: { id: string } }) {
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [parceiro, setParceiro] = useState<any>(null)
  const [form, setForm] = useState({
    nome: "", telefone: "", categoria: "", pix: "", comissao: "10", status: "ativo", observacao: "",
    codigo_acesso: "", link_acesso: ""
  })

  useEffect(() => {
    carregar()
  }, [])

  async function carregar() {
    setLoading(true)
    const { data } = await supabase.from("parceiros").select("*").eq("id", params.id).single()
    if (data) {
      setParceiro(data)
      setForm({
        nome: data.nome || "",
        telefone: data.telefone || "",
        categoria: data.categoria || "",
        pix: data.pix || "",
        comissao: String(data.comissao || 10),
        status: data.status || "ativo",
        observacao: data.observacao || "",
        codigo_acesso: data.codigo_acesso || "",
        link_acesso: data.link_acesso || ""
      })
    }
    setLoading(false)
  }

  async function gerarCodigo() {
    const prefixo = "PAR"
    const random = Math.floor(1000 + Math.random() * 9000)
    const codigo = `${prefixo}-${random}`
    const link = `/parceiros/dashboard/${codigo}`
    setForm({ ...form, codigo_acesso: codigo, link_acesso: link })
  }

  async function salvar() {
    setSalvando(true)
    const payload = {
      nome: form.nome,
      telefone: form.telefone,
      categoria: form.categoria,
      pix: form.pix,
      comissao: Number(form.comissao),
      status: form.status,
      observacao: form.observacao,
      codigo_acesso: form.codigo_acesso,
      link_acesso: form.link_acesso
    }
    const { error } = await supabase.from("parceiros").update(payload).eq("id", params.id)
    if (error) alert("Erro: " + error.message)
    else alert("Parceiro atualizado")
    setSalvando(false)
    carregar()
  }

  function copiarLink() {
    if (form.link_acesso) {
      navigator.clipboard.writeText(window.location.origin + form.link_acesso)
      alert("Link copiado!")
    }
  }

  if (loading) return <div className="p-6">Carregando...</div>

  return (
    <AdminGuard>
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Editar Parceiro</h1>
        <div className="bg-white p-6 rounded-xl shadow space-y-4">
          <input className="w-full p-2 border rounded" placeholder="Nome" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} />
          <input className="w-full p-2 border rounded" placeholder="Telefone" value={form.telefone} onChange={e => setForm({...form, telefone: e.target.value})} />
          <input className="w-full p-2 border rounded" placeholder="Categoria" value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})} />
          <input className="w-full p-2 border rounded" placeholder="Pix" value={form.pix} onChange={e => setForm({...form, pix: e.target.value})} />
          <input className="w-full p-2 border rounded" type="number" placeholder="Comissão %" value={form.comissao} onChange={e => setForm({...form, comissao: e.target.value})} />
          <select className="w-full p-2 border rounded" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
            <option value="ativo">Ativo</option><option value="inativo">Inativo</option>
          </select>
          <textarea className="w-full p-2 border rounded" rows={3} placeholder="Observação" value={form.observacao} onChange={e => setForm({...form, observacao: e.target.value})} />

          <div className="border-t pt-4">
            <h3 className="font-bold mb-2">Acesso do Parceiro</h3>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="block text-sm">Código de acesso</label>
                <input className="w-full p-2 border rounded bg-gray-100" readOnly value={form.codigo_acesso || "Clique em gerar"} />
              </div>
              <button onClick={gerarCodigo} className="bg-blue-500 text-white px-4 py-2 rounded">Gerar Código</button>
            </div>
            {form.link_acesso && (
              <div className="mt-2">
                <label className="block text-sm">Link de acesso</label>
                <div className="flex gap-2">
                  <input className="flex-1 p-2 border rounded bg-gray-100" readOnly value={window.location.origin + form.link_acesso} />
                  <button onClick={copiarLink} className="bg-green-600 text-white px-4 rounded">Copiar</button>
                </div>
              </div>
            )}
          </div>

          <button onClick={salvar} disabled={salvando} className="w-full bg-red-600 text-white p-2 rounded">Salvar Alterações</button>
        </div>
      </div>
    </AdminGuard>
  )
}