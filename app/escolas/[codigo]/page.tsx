"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../../lib/supabase"
import { useParams } from "next/navigation"
import { Trash2, UserPlus, CheckCircle, Search, Lock, ArrowRight } from "lucide-react"

export default function EscolaPainel() {
  const { codigo } = useParams()
  const [escola, setEscola] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  // Estados de Autenticação
  const [autenticado, setAutenticado] = useState(false)
  const [senhaInput, setSenhaInput] = useState("")
  const [criandoSenha, setCriandoSenha] = useState(false)
  const [erroSenha, setErroSenha] = useState("")

  // Estados do Painel
  const [aba, setAba] = useState<"indicar" | "meus_alunos">("indicar")
  const [alunosDaEscola, setAlunosDaEscola] = useState<any[]>([])
  const [indicacoesPendentes, setIndicacoesPendentes] = useState<any[]>([])
  
  // Formulário de Indicação
  const [form, setForm] = useState({ aluno_nome: "", aluno_cpf: "", aluno_whatsapp: "" })
  const [enviado, setEnviado] = useState(false)
  const [verificandoCpf, setVerificandoCpf] = useState(false)
  const [cpfStatus, setCpfStatus] = useState<"novo" | "antigo" | null>(null)

  useEffect(() => {
    if (codigo) carregarEscola()
  }, [codigo])

  async function carregarEscola() {
    setLoading(true)
    const { data } = await supabase.from("escolas").select("*").eq("codigo_link", codigo).eq("status", "ativo").maybeSingle()
    
    if (!data) {
      setEscola(null)
      setLoading(false)
      return
    }
    setEscola(data)

    // Se a escola não tiver senha, ela precisa criar uma
    if (!data.senha) {
      setCriandoSenha(true)
    }
    
    setLoading(false)
  }

  async function salvarNovaSenha(e: React.FormEvent) {
    e.preventDefault()
    if (senhaInput.length < 4) return setErroSenha("A senha deve ter pelo menos 4 dígitos.")
    
    const { error } = await supabase.from("escolas").update({ senha: senhaInput }).eq("id", escola.id)
    if (error) return setErroSenha("Erro ao salvar senha.")
    
    setEscola({ ...escola, senha: senhaInput })
    setCriandoSenha(false)
    setAutenticado(true)
    carregarAlunosDaEscola()
  }

  function fazerLogin(e: React.FormEvent) {
    e.preventDefault()
    if (senhaInput === escola.senha) {
      setAutenticado(true)
      setErroSenha("")
      carregarAlunosDaEscola()
    } else {
      setErroSenha("Senha incorreta.")
    }
  }

  async function carregarAlunosDaEscola() {
    // Busca os alunos já vinculados a esta escola
    const { data: alunos } = await supabase.from("alunos").select("id, nome, cpf, status").eq("escola_id", escola.id).order("nome")
    setAlunosDaEscola(alunos || [])

    // Busca indicações que ainda estão pendentes ou foram aprovadas
    const { data: inds } = await supabase.from("escolas_indicacoes").select("*").eq("escola_id", escola.id).in("status", ["pendente", "aprovado"]).order("created_at", { ascending: false })
    setIndicacoesPendentes(inds || [])
  }

  // Validação em tempo real do CPF
  async function verificarCpf() {
    if (form.aluno_cpf.length < 11) return;
    setVerificandoCpf(true)
    setCpfStatus(null)
    
    const { data } = await supabase.from("alunos").select("id").eq("cpf", form.aluno_cpf).maybeSingle()
    
    if (data) {
      setCpfStatus("antigo")
      // Se já existe, já preenche o nome para facilitar
      const { data: alunoCompleto } = await supabase.from("alunos").select("nome").eq("id", data.id).single()
      if (alunoCompleto) setForm(prev => ({ ...prev, aluno_nome: alunoCompleto.nome }))
    } else {
      setCpfStatus("novo")
    }
    setVerificandoCpf(false)
  }

  async function enviarIndicacao(e: React.FormEvent) {
    e.preventDefault()
    if (!form.aluno_nome || !form.aluno_cpf) return alert("Preencha o nome e CPF do aluno.")
    
    const { error } = await supabase.from("escolas_indicacoes").insert([{
      escola_id: escola.id,
      aluno_nome: form.aluno_nome,
      aluno_cpf: form.aluno_cpf,
      aluno_whatsapp: form.aluno_whatsapp
    }])

    if (error) alert("Erro ao enviar: " + error.message)
    else {
      setEnviado(true)
      setForm({ aluno_nome: "", aluno_cpf: "", aluno_whatsapp: "" })
      setCpfStatus(null)
      carregarAlunosDaEscola()
    }
  }

  async function removerAluno(alunoId: string, nome: string) {
    if (!confirm(`Tem certeza que deseja remover o aluno ${nome} da parceria? O desconto será cancelado nas próximas mensalidades.`)) return
    
    await supabase.from("alunos").update({ escola_id: null }).eq("id", alunoId)
    await supabase.from("escolas_indicacoes").update({ status: "removido" }).eq("aluno_id", alunoId).eq("escola_id", escola.id)
    
    alert("Aluno removido com sucesso. O desconto foi cancelado.")
    carregarAlunosDaEscola()
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">Carregando...</div>
  if (!escola) return <div className="min-h-screen flex items-center justify-center font-bold text-red-600 text-xl bg-gray-50">Link inválido ou escola inativa.</div>

  // --- TELA DE CRIAÇÃO DE SENHA (PRIMEIRO ACESSO) ---
  if (criandoSenha) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full text-center">
          <img src="/logo-color.png" alt="CT Okinawa" className="h-20 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Bem-vindo, {escola.nome}!</h1>
          <p className="text-gray-500 mb-6 text-sm">Este é o seu primeiro acesso. Crie uma senha para proteger sua parceria.</p>
          
          <form onSubmit={salvarNovaSenha} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
              <input 
                type="password" 
                placeholder="Crie uma senha (mín. 4 dígitos)" 
                className="w-full pl-10 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                value={senhaInput}
                onChange={e => setSenhaInput(e.target.value)}
                required
              />
            </div>
            {erroSenha && <p className="text-red-500 text-sm">{erroSenha}</p>}
            <button type="submit" className="w-full bg-red-600 text-white font-bold p-3 rounded-xl hover:bg-red-700 transition flex items-center justify-center gap-2">
              Criar Senha e Acessar <ArrowRight size={18} />
            </button>
          </form>
        </div>
      </div>
    )
  }

  // --- TELA DE LOGIN (ACESSOS SEGUINTES) ---
  if (!autenticado) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full text-center">
          <img src="/logo-color.png" alt="CT Okinawa" className="h-20 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{escola.nome}</h1>
          <p className="text-gray-500 mb-6 text-sm">Digite sua senha de acesso.</p>
          
          <form onSubmit={fazerLogin} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
              <input 
                type="password" 
                placeholder="Sua senha" 
                className="w-full pl-10 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                value={senhaInput}
                onChange={e => setSenhaInput(e.target.value)}
                required
              />
            </div>
            {erroSenha && <p className="text-red-500 text-sm">{erroSenha}</p>}
            <button type="submit" className="w-full bg-red-600 text-white font-bold p-3 rounded-xl hover:bg-red-700 transition">
              Entrar
            </button>
          </form>
        </div>
      </div>
    )
  }

  // --- PAINEL DA ESCOLA (LOGADO) ---
  return (
    <div className="min-h-screen bg-gray-100 p-4 py-10">
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xl max-w-3xl mx-auto">
        <div className="text-center mb-8 border-b pb-6">
          <img src="/logo-color.png" alt="CT Okinawa" className="h-16 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800">Portal da Escola Parceira</h1>
          <p className="text-red-600 font-semibold">{escola.nome}</p>
        </div>

        <div className="flex border-b mb-6">
          <button className={`flex-1 pb-3 font-bold text-sm ${aba === 'indicar' ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-500'}`} onClick={() => setAba('indicar')}>
            <span className="flex items-center justify-center gap-2"><UserPlus size={18}/> Indicar Novo Aluno</span>
          </button>
          <button className={`flex-1 pb-3 font-bold text-sm ${aba === 'meus_alunos' ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-500'}`} onClick={() => setAba('meus_alunos')}>
            Meus Alunos Ativos ({alunosDaEscola.length})
          </button>
        </div>

        {aba === 'indicar' && (
          <div>
            {enviado ? (
              <div className="bg-green-50 border border-green-200 text-green-800 p-6 rounded-2xl text-center">
                <CheckCircle size={48} className="mx-auto mb-3 text-green-500" />
                <p className="font-bold text-lg mb-2">Indicação enviada com sucesso!</p>
                <p className="text-sm">A secretaria do CT Okinawa processará o cadastro e o desconto será aplicado em breve.</p>
                <button onClick={() => setEnviado(false)} className="mt-5 bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700">
                  Enviar outro aluno
                </button>
              </div>
            ) : (
              <form onSubmit={enviarIndicacao} className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">Preencha os dados do aluno abaixo. Se ele já estuda no CT, o sistema identificará automaticamente.</p>
                
                <div className="relative">
                  <input 
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none" 
                    placeholder="CPF do Aluno (somente números)" 
                    value={form.aluno_cpf} 
                    onChange={e => setForm({...form, aluno_cpf: e.target.value})} 
                    onBlur={verificarCpf}
                    required
                  />
                  {verificandoCpf && <span className="absolute right-3 top-3 text-xs text-gray-400">Verificando...</span>}
                  {cpfStatus === "antigo" && <span className="absolute right-3 top-3 text-xs font-bold text-blue-600">Aluno do CT</span>}
                  {cpfStatus === "novo" && <span className="absolute right-3 top-3 text-xs font-bold text-green-600">Novo Aluno</span>}
                </div>

                <input 
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none" 
                  placeholder="Nome completo do Aluno" 
                  value={form.aluno_nome} 
                  onChange={e => setForm({...form, aluno_nome: e.target.value})} 
                  required
                />
                
                <input 
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 outline-none" 
                  placeholder="WhatsApp do Responsável (opcional)" 
                  value={form.aluno_whatsapp} 
                  onChange={e => setForm({...form, aluno_whatsapp: e.target.value})} 
                />
                
                <button type="submit" className="w-full bg-red-600 text-white font-bold p-3 rounded-xl hover:bg-red-700 transition">
                  Enviar Indicação para o CT
                </button>
              </form>
            )}
          </div>
        )}

        {aba === 'meus_alunos' && (
          <div>
            {alunosDaEscola.length === 0 && indicacoesPendentes.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Nenhum aluno vinculado a esta parceria ainda.</p>
            ) : (
              <div className="space-y-3">
                {/* Alunos já aprovados */}
                {alunosDaEscola.map(aluno => (
                  <div key={aluno.id} className="flex justify-between items-center p-4 border border-gray-200 rounded-xl bg-white shadow-sm">
                    <div>
                      <p className="font-bold text-gray-800">{aluno.nome}</p>
                      <p className="text-xs text-gray-500">CPF: {aluno.cpf}</p>
                      <span className="inline-block mt-1 bg-green-100 text-green-700 text-xs px-2 py-1 rounded">Ativo com Desconto</span>
                    </div>
                    <button onClick={() => removerAluno(aluno.id, aluno.nome)} className="text-red-500 hover:text-red-700 flex items-center gap-1 text-sm font-semibold bg-red-50 px-3 py-2 rounded-lg transition">
                      <Trash2 size={16} /> Remover
                    </button>
                  </div>
                ))}
                
                {/* Indicações aguardando aprovação do CT */}
                {indicacoesPendentes.filter(i => i.status === 'pendente').map(ind => (
                  <div key={ind.id} className="flex justify-between items-center p-4 border border-yellow-200 rounded-xl bg-yellow-50">
                    <div>
                      <p className="font-bold text-gray-800">{ind.aluno_nome}</p>
                      <p className="text-xs text-gray-500">CPF: {ind.aluno_cpf}</p>
                      <span className="inline-block mt-1 bg-yellow-200 text-yellow-800 text-xs px-2 py-1 rounded">Aguardando aprovação do CT</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="text-center mt-8 text-gray-400 text-sm">
        Área exclusiva para escolas parceiras do CT Okinawa.
      </div>
    </div>
  )
}