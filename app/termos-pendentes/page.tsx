"use client"

import { useEffect, useState } from "react"
import { supabase } from "../../lib/supabase"
import AdminGuard from "../../components/AdminGuard"
import { FileText, CheckCircle } from "lucide-react"
import jsPDF from "jspdf"

export default function TermosPendentesPage() {
  const [alunos, setAlunos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    carregarAlunos()
  }, [])

  async function carregarAlunos() {
    setLoading(true)
    // Busca alunos que ainda não assinaram o termo
    const { data } = await supabase.from("alunos").select("*").eq("termo_assinado", false).order("nome")
    setAlunos(data || [])
    setLoading(false)
  }

  function gerarTermoPDF(aluno: any) {
    const doc = new jsPDF()
    let y = 15

    // --- LOGO CORRIGIDA (Proporção 80x30) ---
    try {
      // x=65 centraliza a imagem, y=10, largura=80, altura=30
      doc.addImage('/logo-color.png', 'PNG', 65, 10, 80, 30)
      y = 50 // Joga o texto para baixo da logo
    } catch (e) {
      doc.setFontSize(16)
      doc.setFont("helvetica", "bold")
      doc.text("CT OKINAWA", 105, 20, { align: "center" })
      y = 30
    }

    // --- TÍTULOS ---
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text("TERMO DE CIÊNCIA, RESPONSABILIDADE E AUTORIZAÇÕES", 105, y, { align: "center" })
    y += 8
    
    doc.setDrawColor(204, 0, 0) // Linha vermelha
    doc.setLineWidth(0.5)
    doc.line(15, y, 195, y)
    y += 10

    // --- LÓGICA DE QUEM ESTÁ DECLARANDO ---
    // Se for menor, quem declara é o responsável. Se for maior, é o próprio aluno.
    const nomeDeclarante = aluno.menor 
      ? (aluno.responsavel_nome || "________________________________________") 
      : (aluno.nome || "________________________________________")
    
    const cpfDeclarante = aluno.menor 
      ? (aluno.responsavel_cpf || "____________________") 
      : (aluno.cpf || "____________________")

    doc.setFontSize(11)
    doc.setFont("helvetica", "normal")
    
    const introText = `Eu, ${nomeDeclarante}, inscrito(a) no CPF nº ${cpfDeclarante}, declaro, para todos os fins de direito, que:`
    const splitIntro = doc.splitTextToSize(introText, 180)
    doc.text(splitIntro, 15, y)
    y += splitIntro.length * 6 + 5

    const condicaoText = aluno.menor 
      ? `Na condição de: ( X ) Responsável legal pelo(a) aluno(a) menor ${aluno.nome}` 
      : `Na condição de: ( X ) Aluno(a) maior de idade`
    doc.text(condicaoText, 15, y)
    y += 10

    // --- CLÁUSULAS (Incluindo LGPD) ---
    const clausulas = [
      `1. DA CIÊNCIA DO REGULAMENTO: Declaro que recebi, li, compreendi e tive acesso ao Regulamento Interno do CT OKINAWA, estando plenamente ciente de todas as normas de funcionamento, conduta, disciplina e organização do espaço.`,
      `2. DA PRÁTICA DE ATIVIDADE FÍSICA E RISCOS: Declaro estar ciente de que a prática de artes marciais envolve riscos inerentes. Assumo integral responsabilidade pela participação, isentando o CT OKINAWA de acidentes que não sejam oriundos de dolo ou negligência direta.`,
      `3. DAS CONDIÇÕES DE SAÚDE: Declaro que: ( X ) O aluno encontra-se apto à prática de atividades físicas. ${aluno.problema_saude ? `( X ) Informei previamente a seguinte condição de saúde: ${aluno.saude_detalhes}` : `( ) Informei previamente alguma condição de saúde relevante.`}`,
      `4. DO USO DE IMAGEM, VOZ E IDENTIDADE: Autorizo o CT OKINAWA a captar e utilizar imagem, voz e nome do aluno para fins institucionais, promocionais e de divulgação, sem limitação territorial e por prazo indeterminado, sem qualquer remuneração.`,
      `5. LGPD (LEI 13.709/2018): Autorizo o tratamento dos meus dados pessoais e dos dados do aluno menor, exclusivamente para fins de gestão acadêmica, financeira e comunicação, ciente de que posso solicitar a exclusão a qualquer momento.`,
      `6. DAS RESPONSABILIDADES: O descumprimento das normas poderá resultar em medidas disciplinares. O CT não se responsabiliza por ocorrências fora de suas dependências ou por ações de terceiros.`,
      `7. DAS OBRIGAÇÕES FINANCEIRAS: A mensalidade possui vencimento fixo. O não pagamento poderá acarretar restrição de acesso às atividades até a devida regularização.`,
      `8. DECLARAÇÃO FINAL: Declaro que todas as informações prestadas são verdadeiras e que este termo possui validade jurídica, não podendo alegar desconhecimento.`
    ]

    clausulas.forEach(clausula => {
      const splitText = doc.splitTextToSize(clausula, 180)
      if (y + splitText.length * 6 > 260) { doc.addPage(); y = 20; }
      doc.text(splitText, 15, y)
      y += splitText.length * 6 + 4
    })

    if (y > 220) { doc.addPage(); y = 20; }
    y += 10
    
    // --- DADOS DO ALUNO ---
    doc.setFont("helvetica", "bold")
    doc.text(`Nome do Aluno: ${aluno.nome || "_________________________________________"}`, 15, y); y += 6
    doc.text(`CPF do Aluno: ${aluno.cpf || "____________________"}`, 15, y); y += 6
    if (aluno.menor) {
      doc.text(`Responsável Legal: ${aluno.responsavel_nome || "_________________________________________"}`, 15, y); y += 6
    }
    doc.setFont("helvetica", "normal")
    doc.text(`Telefone: ${aluno.whatsapp || aluno.responsavel_whatsapp || "____________________"}`, 15, y); y += 6
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 15, y); y += 15

    // --- CHECKBOXES CORRETOS ---
    doc.text(`( ${aluno.menor ? " " : "X"} ) Aluno maior de idade`, 15, y); y += 6
    doc.text(`( ${aluno.menor ? "X" : " "} ) Responsável legal`, 15, y); y += 20

    // --- ASSINATURAS ---
    doc.setLineWidth(0.5)
    doc.line(15, y, 100, y)
    doc.line(110, y, 195, y)
    y += 5
    doc.setFontSize(10)
    
    // Assinatura de quem declarou
    doc.text(`${nomeDeclarante}`, 15, y)
    doc.text(`CT OKINAWA`, 110, y)

    doc.save(`Termo_Responsabilidade_${aluno.nome || "Aluno"}.pdf`)
  }

  async function marcarComoAssinado(id: string) {
    await supabase.from("alunos").update({ termo_assinado: true }).eq("id", id)
    alert("Termo marcado como assinado!")
    carregarAlunos()
  }

  return (
    <AdminGuard>
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <FileText className="text-red-600" /> Termos Pendentes de Assinatura
        </h1>

        {loading ? (
          <p>Carregando...</p>
        ) : alunos.length === 0 ? (
          <p className="text-gray-500 text-center py-10">Todos os alunos já assinaram o termo! ✅</p>
        ) : (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left">Nome</th>
                  <th className="p-3 text-left">CPF</th>
                  <th className="p-3 text-left">Ações</th>
                </tr>
              </thead>
              <tbody>
                {alunos.map(aluno => (
                  <tr key={aluno.id} className="border-t">
                    <td className="p-3">
                      {aluno.nome}
                      {aluno.menor && <span className="text-xs text-gray-500 block">Resp: {aluno.responsavel_nome}</span>}
                    </td>
                    <td className="p-3">{aluno.cpf || "---"}</td>
                    <td className="p-3 flex gap-2">
                      <button onClick={() => gerarTermoPDF(aluno)} className="bg-blue-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1">
                        <FileText size={14} /> Imprimir Termo
                      </button>
                      <button onClick={() => marcarComoAssinado(aluno.id)} className="bg-green-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1">
                        <CheckCircle size={14} /> Marcar como Assinado
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminGuard>
  )
}