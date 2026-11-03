"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import AdminGuard from "../../components/AdminGuard"
import { FileText } from "lucide-react"
import jsPDF from "jspdf"

type Professor = {
  id: string
  nome: string
  cpf: string
  rg: string
  endereco: string
  modalidade: string
  telefone: string
  pix: string
  comissao: number
  codigo_acesso: string
  status: string
  observacao: string
  created_at?: string
}

export default function ProfessoresPage() {
  const [professores, setProfessores] = useState<Professor[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    nome: "",
    cpf: "",
    rg: "",
    endereco: "",
    modalidade: "",
    telefone: "",
    pix: "",
    comissao: "",
    codigo_acesso: "",
    status: "ativo",
    observacao: "",
  })
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    carregarProfessores()
  }, [])

  async function carregarProfessores() {
    setLoading(true)
    const { data, error } = await supabase
      .from("professores")
      .select("*")
      .order("nome")
    if (error) {
      console.error(error)
      alert("Erro ao carregar professores")
    } else {
      setProfessores(data || [])
    }
    setLoading(false)
  }

  function gerarCodigoAcesso() {
    const codigo = Math.floor(1000 + Math.random() * 9000).toString()
    setForm(prev => ({ ...prev, codigo_acesso: codigo }))
  }

  async function salvarProfessor() {
    if (!form.nome.trim()) {
      alert("Informe o nome do professor")
      return
    }
    const comissaoNum = parseFloat(form.comissao)
    if (isNaN(comissaoNum) || comissaoNum < 0 || comissaoNum > 100) {
      alert("Comissão deve ser um número entre 0 e 100")
      return
    }

    const payload = {
      nome: form.nome.trim(),
      cpf: form.cpf || null,
      rg: form.rg || null,
      endereco: form.endereco || null,
      modalidade: form.modalidade || null,
      telefone: form.telefone || null,
      pix: form.pix || null,
      comissao: comissaoNum,
      codigo_acesso: form.codigo_acesso || null,
      status: form.status,
      observacao: form.observacao || null,
    }

    setSalvando(true)
    let error = null

    if (editandoId) {
      const res = await supabase.from("professores").update(payload).eq("id", editandoId)
      error = res.error
    } else {
      if (!payload.codigo_acesso) {
        const codigo = Math.floor(1000 + Math.random() * 9000).toString()
        payload.codigo_acesso = codigo
        setForm(prev => ({ ...prev, codigo_acesso: codigo }))
      }
      const res = await supabase.from("professores").insert([payload])
      error = res.error
    }

    if (error) {
      alert("Erro: " + error.message)
    } else {
      alert(editandoId ? "Professor atualizado!" : "Professor cadastrado!")
      resetForm()
      carregarProfessores()
    }
    setSalvando(false)
  }

  function editarProfessor(prof: Professor) {
    setEditandoId(prof.id)
    setForm({
      nome: prof.nome,
      cpf: prof.cpf || "",
      rg: prof.rg || "",
      endereco: prof.endereco || "",
      modalidade: prof.modalidade || "",
      telefone: prof.telefone || "",
      pix: prof.pix || "",
      comissao: prof.comissao.toString(),
      codigo_acesso: prof.codigo_acesso || "",
      status: prof.status,
      observacao: prof.observacao || "",
    })
  }

  async function excluirProfessor(id: string) {
    if (!confirm("Excluir professor? Todas as turmas vinculadas perderão o vínculo.")) return
    const { error } = await supabase.from("professores").delete().eq("id", id)
    if (error) {
      alert("Erro: " + error.message)
    } else {
      alert("Professor excluído")
      if (editandoId === id) resetForm()
      carregarProfessores()
    }
  }

  async function alternarStatus(prof: Professor) {
    const novoStatus = prof.status === "ativo" ? "inativo" : "ativo"
    const { error } = await supabase.from("professores").update({ status: novoStatus }).eq("id", prof.id)
    if (error) alert("Erro: " + error.message)
    else carregarProfessores()
  }

  function resetForm() {
    setEditandoId(null)
    setForm({
      nome: "",
      cpf: "",
      rg: "",
      endereco: "",
      modalidade: "",
      telefone: "",
      pix: "",
      comissao: "",
      codigo_acesso: "",
      status: "ativo",
      observacao: "",
    })
  }

  function copiarCodigo(codigo: string) {
    navigator.clipboard.writeText(codigo)
    alert("Código copiado! Use para acessar a presença.")
  }

  // --- FUNÇÃO DO CONTRATO E MANUAL PDF ---
  function gerarContratoManualPDF(prof: Professor) {
    const doc = new jsPDF()
    let y = 20
    const margem = 15
    const larguraTexto = 180

    const adicionarTexto = (texto: string, isTitulo = false, isNegrito = false) => {
      doc.setFontSize(isTitulo ? 12 : 10)
      doc.setFont("helvetica", isNegrito || isTitulo ? "bold" : "normal")
      const linhas = doc.splitTextToSize(texto, larguraTexto)
      
      for (let i = 0; i < linhas.length; i++) {
        if (y > 270) { doc.addPage(); y = 20 }
        doc.text(linhas[i], margem, y)
        y += 6
      }
      y += 4 
    }

    // CONTRATO
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text("CONTRATO DE PRESTAÇÃO DE SERVIÇOS AUTÔNOMOS", 105, y, { align: "center" })
    y += 15

    adicionarTexto("CONTRATANTE: CENTRO DE TREINAMENTO OKINAWA – CT OKINAWA, pessoa jurídica de direito privado, com sede à R. Pres. Médici, 278 - Águas Claras, Salvador - BA, 41311-050, neste ato representada por seu responsável legal Arliton Almeida de Jesus.", false, true)
    adicionarTexto(`CONTRATADO(A): ${prof.nome}, inscrito(a) no CPF nº ${prof.cpf || '---'}, portador(a) do RG nº ${prof.rg || '---'}, residente e domiciliado(a) à ${prof.endereco || '---'}.`, false, true)

    adicionarTexto("CLÁUSULA 1 – DO OBJETO", true)
    adicionarTexto(`O presente contrato tem por objeto a prestação de serviços profissionais autônomos pelo(a) CONTRATADO(A), consistentes na ministração de aulas da modalidade ${prof.modalidade || '[MODALIDADE]'}, nas dependências da CONTRATANTE, bem como outras atividades correlatas necessárias ao bom funcionamento das turmas.`)
    
    adicionarTexto("CLÁUSULA 2 – DA NATUREZA JURÍDICA", true)
    adicionarTexto("O presente contrato possui natureza estritamente civil, não gerando, em hipótese alguma, vínculo empregatício entre as partes. Não há subordinação jurídica, controle de jornada típico, exclusividade obrigatória ou qualquer outro elemento caracterizador de relação de emprego.")

    adicionarTexto("CLÁUSULA 3 – DO PERÍODO DE EXPERIÊNCIA E ADAPTAÇÃO", true)
    adicionarTexto("Fica estabelecido um período inicial de 02 (dois) meses, a título de experiência e adaptação. Durante este período, o(a) CONTRATADO(A) fará jus ao recebimento de 50% (cinquenta por cento) do valor bruto arrecadado com os alunos da modalidade sob sua responsabilidade.")

    adicionarTexto("CLÁUSULA 4 – DA REMUNERAÇÃO POR PRODUTIVIDADE", true)
    adicionarTexto(`A remuneração será variável, conforme o número de alunos ativos na modalidade. Acordado entre as partes a comissão de ${prof.comissao}% sobre os valores recebidos.`)
    adicionarTexto("§1º O cálculo será realizado com base no valor efetivamente recebido dos alunos (Valor Base).")
    adicionarTexto("§2º IMPORTANTE SOBRE O VALOR BASE: Fica ciente o(a) CONTRATADO(A) de que o valor base para cálculo de repasse refere-se ao valor líquido da modalidade (ex: R$ 120,00), excluindo-se eventuais taxas de operadoras de cartão de crédito. O valor geral (ex: R$ 130,00) é o valor comercial de face cobrado do aluno, sendo a diferença destinada a cobrir custos operacionais e taxas da maquininha.")
    adicionarTexto("§3º Alunos inadimplentes não serão considerados para fins de cálculo.")

    adicionarTexto("CLÁUSULA 5 – DA FORMA DE PAGAMENTO", true)
    adicionarTexto("O pagamento será realizado até o dia 10 de cada mês, referente ao período anterior, via PIX.")

    adicionarTexto("CLÁUSULA 6 – DAS OBRIGAÇÕES DO(A) CONTRATADO(A)", true)
    adicionarTexto("I – Ministrar aulas com qualidade técnica e responsabilidade; II – Zelar pela integridade dos alunos; III – Cumprir horários estabelecidos; IV – Registrar a presença dos alunos em todas as aulas por meio do sistema definido; V – Manter conduta ética e profissional; VI – Preservar a estrutura do CT.")

    adicionarTexto("CLÁUSULA 7 – DA PROTEÇÃO COMERCIAL E NÃO CONCORRÊNCIA", true)
    adicionarTexto("É vedado ao(à) CONTRATADO(A) realizar captação ativa de alunos vinculados à CONTRATANTE para transferência a outros espaços, bem como exercer atividade concorrente direta nos mesmos dias e horários em que estiver vinculado(a) ao CT. O descumprimento ensejará multa e rescisão imediata.")

    adicionarTexto("CLÁUSULA 8 – LGPD E CONFIDENCIALIDADE", true)
    adicionarTexto("O(a) CONTRATADO(A) compromete-se a manter absoluto sigilo sobre dados pessoais de alunos, informações financeiras e estratégias comerciais, conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018). É vedado compartilhar ou utilizar tais informações para fins pessoais.")

    adicionarTexto("CLÁUSULA 9 – DO USO DE IMAGEM, VOZ E IDENTIDADE", true)
    adicionarTexto("O(a) CONTRATADO(A) autoriza, de forma gratuita, irrevogável e irretratável, o uso de sua imagem, voz e nome pela CONTRATANTE para fins institucionais e promocionais, em redes sociais, materiais impressos e plataformas online, por prazo indeterminado, sem qualquer remuneração adicional.")

    adicionarTexto("CLÁUSULA 10 – DA RESCISÃO", true)
    adicionarTexto("O presente contrato poderá ser rescindido por qualquer das partes, a qualquer tempo, mediante aviso prévio mínimo de 30 (trinta) dias. Em caso de rescisão imotivada pelo CONTRATADO sem o cumprimento do aviso, será devida multa de 50% do valor médio do faturamento mensal.")

    if (y > 220) { doc.addPage(); y = 20 }
    y += 20
    doc.setFontSize(10)
    doc.text("Salvador, ____ de _______________ de ________", 105, y, { align: "center" })
    y += 30
    doc.line(30, y, 90, y)
    doc.line(120, y, 180, y)
    doc.text("Arliton Almeida - CT OKINAWA", 30, y + 5)
    doc.text(prof.nome, 120, y + 5)

    // MANUAL
    doc.addPage()
    y = 20
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text("MANUAL DO PROFESSOR", 105, y, { align: "center" })
    y += 15

    adicionarTexto("1. DA POSTURA PROFISSIONAL", true)
    adicionarTexto("O professor deverá atuar com ética, responsabilidade, disciplina e comprometimento, sendo referência direta de comportamento para os alunos. Deverá manter postura compatível com o ambiente esportivo e educacional, prezando pela integridade física, moral e psicológica dos alunos, bem como pela imagem institucional do CT OKINAWA.")

    adicionarTexto("2. DA ABERTURA E ORGANIZAÇÃO DO ESPAÇO", true)
    adicionarTexto("O professor designado para abertura do CT deverá comparecer às 07:00, sendo responsável pela preparação do ambiente, incluindo limpeza, organização, verificação da estrutura, sonorização e demais ajustes necessários para o pleno funcionamento das atividades.")

    adicionarTexto("3. DA APRESENTAÇÃO PESSOAL", true)
    adicionarTexto("O professor deverá estar devidamente uniformizado, utilizando vestimenta compatível com sua modalidade. A apresentação pessoal deve refletir profissionalismo e alinhamento com a identidade do CT.")

    adicionarTexto("4. DA RESPONSABILIDADE COM AS TURMAS", true)
    adicionarTexto("O professor é integralmente responsável pela condução das aulas, organização das turmas, manutenção da disciplina e aplicação da metodologia, garantindo a segurança dos alunos durante o período de aula.")

    adicionarTexto("5. DOS LIMITES DE ATUAÇÃO", true)
    adicionarTexto("O professor não poderá: alterar valores de mensalidade; conceder descontos; comercializar produtos sem autorização; utilizar o espaço para fins próprios sem autorização.")

    adicionarTexto("6. DO REGISTRO DE PRESENÇA", true)
    adicionarTexto("O professor é responsável pelo registro da presença dos alunos em todas as aulas ministradas, por meio do sistema oficial do CT, imediatamente após ou durante a aula. A inserção de informações falsas ou a negligência no registro será considerada falta grave.")

    adicionarTexto("7. DAS FALTAS, SUBSTITUIÇÕES E REPOSIÇÕES", true)
    adicionarTexto("Toda ausência deve ser comunicada com antecedência. O professor poderá indicar um substituto, desde que alinhado com a coordenação, mantendo a responsabilidade pela aula. Na impossibilidade de substituição, a reposição é obrigatória.")

    adicionarTexto("8. DO CUIDADO COM O AMBIENTE E LGPD", true)
    adicionarTexto("O professor deverá zelar pelo espaço físico, mantendo a organização e conservação. Qualquer dano deverá ser registrado imediatamente. Além disso, deve manter sigilo absoluto sobre dados de alunos, conforme a LGPD, sendo vedado o compartilhamento de informações pessoais.")

    adicionarTexto("9. DA RESPONSABILIDADE POR ALUNOS FORA DO CT", true)
    adicionarTexto("Caso o professor, por iniciativa própria, assuma a responsabilidade de acompanhar, transportar ou prestar assistência ao aluno fora das dependências do CT, tal responsabilidade será exclusiva do professor, isentando o CT OKINAWA de qualquer ocorrência.")

    if (y > 220) { doc.addPage(); y = 20 }
    y += 20
    adicionarTexto("TERMO DE CIÊNCIA DO PROFESSOR", true, true)
    adicionarTexto("Declaro que li e estou de acordo com o presente manual.")
    y += 20
    doc.line(30, y, 180, y)
    doc.text(`${prof.nome} - CPF: ${prof.cpf || '---'}`, 30, y + 5)

    doc.save(`Contrato_e_Manual_${prof.nome.replace(/\s+/g, '_')}.pdf`)
  }

  return (
    <AdminGuard>
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Professores</h1>

        {/* Formulário */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">
            {editandoId ? "Editar Professor" : "Novo Professor"}
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <input className="input" placeholder="Nome completo" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} />
            <input className="input" placeholder="CPF" value={form.cpf} onChange={e => setForm({ ...form, cpf: e.target.value })} />
            <input className="input" placeholder="RG" value={form.rg} onChange={e => setForm({ ...form, rg: e.target.value })} />
            <input className="input" placeholder="Endereço Completo" value={form.endereco} onChange={e => setForm({ ...form, endereco: e.target.value })} />
            <input className="input" placeholder="Modalidade (Ex: Karatê)" value={form.modalidade} onChange={e => setForm({ ...form, modalidade: e.target.value })} />
            <input className="input" placeholder="Telefone" value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} />
            <input className="input" placeholder="Chave Pix" value={form.pix} onChange={e => setForm({ ...form, pix: e.target.value })} />
            <input className="input" type="number" step="0.01" placeholder="Comissão (%) – Ex: 50" value={form.comissao} onChange={e => setForm({ ...form, comissao: e.target.value })} />
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="block text-sm text-gray-500 mb-1">Código de acesso (presença)</label>
                <input className="input bg-gray-50" readOnly placeholder="Clique em gerar" value={form.codigo_acesso} />
              </div>
              <button type="button" onClick={gerarCodigoAcesso} className="bg-blue-500 text-white px-4 py-2 rounded">Gerar</button>
            </div>
            <select className="input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
            <textarea className="input md:col-span-2" rows={3} placeholder="Observação (opcional)" value={form.observacao} onChange={e => setForm({ ...form, observacao: e.target.value })} />
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick={salvarProfessor} disabled={salvando} className="btn">
              {salvando ? "Salvando..." : editandoId ? "Salvar Alterações" : "Cadastrar"}
            </button>
            {editandoId && <button onClick={resetForm} className="btn cinza">Cancelar</button>}
          </div>
        </div>

        {/* Lista de professores */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          {loading ? (
            <div className="p-6 text-center">Carregando...</div>
          ) : professores.length === 0 ? (
            <div className="p-6 text-center text-gray-500">Nenhum professor cadastrado.</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left">Nome</th>
                  <th className="p-3 text-left">Telefone</th>
                  <th className="p-3 text-left">Comissão</th>
                  <th className="p-3 text-left">Código</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Ações</th>
                </tr>
              </thead>
              <tbody>
                {professores.map((prof) => (
                  <tr key={prof.id} className="border-t">
                    <td className="p-3">{prof.nome}</td>
                    <td className="p-3">{prof.telefone || "-"}</td>
                    <td className="p-3">{prof.comissao}%</td>
                    <td className="p-3">
                      {prof.codigo_acesso ? (
                        <button onClick={() => copiarCodigo(prof.codigo_acesso)} className="text-blue-600 underline text-sm">
                          {prof.codigo_acesso} (copiar)
                        </button>
                      ) : (
                        <span className="text-gray-400">não gerado</span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs ${prof.status === "ativo" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                        {prof.status === "ativo" ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td className="p-3 flex gap-2 flex-wrap">
                      <button onClick={() => gerarContratoManualPDF(prof)} className="mini bg-purple-600 flex items-center gap-1">
                        <FileText size={14}/> Contrato
                      </button>
                      <button onClick={() => editarProfessor(prof)} className="mini azul">Editar</button>
                      <button onClick={() => alternarStatus(prof)} className={`mini ${prof.status === "ativo" ? "bg-yellow-500" : "bg-green-500"}`}>
                        {prof.status === "ativo" ? "Inativar" : "Ativar"}
                      </button>
                      <button onClick={() => excluirProfessor(prof.id)} className="mini vermelho">Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <style jsx>{`
          .input { width: 100%; padding: 12px; border: 1px solid #ccc; border-radius: 10px; }
          .btn { background: red; color: white; padding: 12px 18px; border-radius: 10px; }
          .cinza { background: #666; }
          .mini { color: white; padding: 6px 12px; border-radius: 8px; font-size: 12px; }
          .azul { background: #2563eb; }
          .vermelho { background: #dc2626; }
        `}</style>
      </div>
    </AdminGuard>
  )
}