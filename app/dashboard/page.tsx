"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Users, AlertTriangle, Layers, School, CheckCircle, FlaskConical, MessageCircle, FileText, Stethoscope, RefreshCw, CalendarDays } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({ ativos: 0, turmas: 0, pendencias: 0 });
  const [escolasPendentes, setEscolasPendentes] = useState<any[]>([]);
  const [aulasExp, setAulasExp] = useState<any[]>([]); 
  const [consultas, setConsultas] = useState<any[]>([]); 
  const [retornosSemana, setRetornosSemana] = useState<any[]>([]);
  
  const [alertas, setAlertas] = useState({
    atraso5: 0, atraso2: 0, venceHoje: 0, vence2: 0, vence5: 0
  });

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    // 1. Alunos e Turmas
    const { data: alunos } = await supabase.from("alunos").select("status, nome, id");
    const ativos = alunos?.filter((a: any) => a.status === "ativo").length || 0;
    const pendentes = alunos?.filter((a: any) => a.status === "pendente") || [];
    setEscolasPendentes(pendentes);

    const { data: turmas } = await supabase.from("turmas").select("id");
    
    // 2. Mensalidades (Alertas)
    const { data: mensalidades } = await supabase.from("mensalidades").select("*").eq("status", "pendente");
    const pendentesMensalidades = mensalidades || [];
    
    let atraso5 = 0, atraso2 = 0, venceHoje = 0, vence2 = 0, vence5 = 0;
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);

    pendentesMensalidades.forEach(m => {
      const venc = new Date(m.vencimento + "T12:00:00"); venc.setHours(0, 0, 0, 0);
      const diffDays = Math.round((venc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= -5) atraso5++;
      else if (diffDays <= -2) atraso2++;
      else if (diffDays === 0) venceHoje++;
      else if (diffDays >= 2 && diffDays <= 3) vence2++;
      else if (diffDays >= 4 && diffDays <= 5) vence5++;
    });

    setAlertas({ atraso5, atraso2, venceHoje, vence2, vence5 });
    setStats({ ativos, turmas: turmas?.length || 0, pendencias: pendentesMensalidades.length });

    // 3. Aulas Experimentais (Filtrando Hoje e Amanhã)
    const hojeStr = hoje.toISOString().split('T')[0];
    const amanha = new Date(hoje); amanha.setDate(amanha.getDate() + 1);
    const amanhaStr = amanha.toISOString().split('T')[0];

    const { data: exp } = await supabase
      .from("aulas_experimentais")
      .select("*")
      .neq("status", "matriculado")
      .in("data_aula", [hojeStr, amanhaStr])
      .order("data_aula");
      
    const { data: mods } = await supabase.from("modalidades").select("id, nome");
    
    const expCruzadas = (exp || []).map(e => {
      const mod = mods?.find(m => m.id === e.modalidade_id)
      return { ...e, modalidade_nome: mod?.nome || "Modalidade" }
    })
    setAulasExp(expCruzadas || []);

    // 4. Consultas Saúde (Filtrando Hoje e Amanhã)
    const daqui2Dias = new Date(hoje); daqui2Dias.setDate(daqui2Dias.getDate() + 2);
    
    const { data: consultasData } = await supabase
      .from("agendamentos_saude")
      .select("*, profissionais_saude(nome, especialidade)")
      .eq("status", "agendado")
      .gte("data_hora", `${hojeStr}T00:00:00`)
      .lte("data_hora", `${amanhaStr}T23:59:59`)
      .order("data_hora");
    setConsultas(consultasData || []);

    // 5. Retornos Agendados (Próximos 7 dias)
    const daqui7Dias = new Date();
    daqui7Dias.setDate(daqui7Dias.getDate() + 7);
    
    const { data: retornos } = await supabase
      .from("agendamentos_saude")
      .select("*, profissionais_saude(nome)")
      .eq("is_retorno", true)
      .eq("status", "agendado")
      .gte("data_hora", hoje.toISOString())
      .lte("data_hora", daqui7Dias.toISOString())
      .order("data_hora")
    
    setRetornosSemana(retornos || [])
  }

  function enviarWhatsAppExp(ag: any) {
    let numero = ag.telefone.replace(/\D/g, "")
    if (!numero.startsWith("55")) numero = "55" + numero
    const dataFormatada = new Date(ag.data_aula + "T12:00:00").toLocaleDateString('pt-BR')
    const mensagem = `Olá, *${ag.nome}*! Passando para lembrar da sua aula experimental de *${ag.modalidade_nome}* no CT Okinawa.\n\n📅 Data: ${dataFormatada}\n\nEstamos te esperando! OSS! 🥋`
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`, "_blank")
  }

  function enviarWhatsAppSaude(ag: any) {
    let numero = ag.whatsapp_paciente.replace(/\D/g, "")
    if (!numero.startsWith("55")) numero = "55" + numero
    const dataFormatada = new Date(ag.data_hora).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
    const mensagem = `Olá, *${ag.nome_paciente}*! Passando para lembrar da sua consulta no CT Okinawa.\n\n🩺 *Profissional:* ${ag.profissionais_saude?.nome}\n📅 *Data/Hora:* ${dataFormatada}\n\nAté logo!`
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`, "_blank")
  }

  const hojeStr = new Date().toISOString().split('T')[0];
  const amanha = new Date(); amanha.setDate(amanha.getDate() + 1);
  const amanhaStr = amanha.toISOString().split('T')[0];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Visão Geral</h1>
        <p className="text-gray-500">Acompanhe os indicadores e os agendamentos da sua academia</p>
      </div>

      {/* LINHA 1: INDICADORES GERAIS */}
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4 flex justify-between items-center border border-gray-100">
          <div>
            <p className="text-gray-500 text-sm">Alunos Ativos</p>
            <p className="text-3xl font-bold">{stats.ativos}</p>
          </div>
          <Users className="w-8 h-8 text-green-600" />
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 flex justify-between items-center border border-gray-100">
          <div>
            <p className="text-gray-500 text-sm">Turmas Ativas</p>
            <p className="text-3xl font-bold">{stats.turmas}</p>
          </div>
          <Layers className="w-8 h-8 text-blue-500" />
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 flex justify-between items-center border border-gray-100">
          <div>
            <p className="text-gray-500 text-sm">Total de Pendências</p>
            <p className="text-3xl font-bold text-red-500">{stats.pendencias}</p>
          </div>
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
      </div>

      {/* LINHA 2: BLOCOS GRANDES DE AÇÃO (HOJE E AMANHÃ) */}
      <div className="grid md:grid-cols-3 gap-6 mb-6">
        
        {/* BLOCO ESCOLAS */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-96">
          <div className="bg-blue-50 p-4 border-b border-blue-100 flex justify-between items-center rounded-t-xl">
            <div className="flex items-center gap-2">
              <School className="text-blue-600" size={20} />
              <h2 className="font-bold text-blue-900">Escolas Parceiras</h2>
            </div>
            <button onClick={() => router.push("/escolas")} className="text-xs text-blue-600 hover:underline font-bold">Gerenciar</button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {escolasPendentes.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <CheckCircle size={40} className="text-green-500 mb-2 opacity-50" />
                <p className="text-sm">Nenhum aluno aguardando aprovação.</p>
              </div>
            ) : (
              escolasPendentes.map(aluno => (
                <div key={aluno.id} className="bg-blue-50 border border-blue-100 p-3 rounded-lg flex justify-between items-center">
                  <p className="font-bold text-sm text-blue-900">{aluno.nome}</p>
                  <button onClick={() => router.push("/escolas")} className="text-xs bg-blue-600 text-white px-3 py-1 rounded font-bold">Aprovar</button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* BLOCO AULAS EXPERIMENTAIS */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-96">
          <div className="bg-purple-50 p-4 border-b border-purple-100 flex justify-between items-center rounded-t-xl">
            <div className="flex items-center gap-2">
              <FlaskConical className="text-purple-600" size={20} />
              <h2 className="font-bold text-purple-900">Aulas Experimentais</h2>
            </div>
            <button onClick={() => router.push("/aula-experimental")} className="text-xs text-purple-600 hover:underline font-bold">Gerenciar</button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {aulasExp.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <CheckCircle size={40} className="text-green-500 mb-2 opacity-50" />
                <p className="text-sm">Nenhuma aula para hoje ou amanhã.</p>
              </div>
            ) : (
              aulasExp.map(ag => {
                const isHoje = ag.data_aula === hojeStr;
                return (
                  <div key={ag.id} className={`border p-3 rounded-lg flex justify-between items-center ${isHoje ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isHoje ? 'bg-red-200 text-red-800' : 'bg-yellow-200 text-yellow-800'}`}>
                          {isHoje ? 'HOJE' : 'AMANHÃ'}
                        </span>
                        <p className="font-bold text-sm text-gray-800">{ag.nome}</p>
                      </div>
                      <p className="text-xs text-gray-600">Mod: {ag.modalidade_nome}</p>
                    </div>
                    <button onClick={() => enviarWhatsAppExp(ag)} className={`p-2 rounded-full shadow text-white ${isHoje ? 'bg-red-500 hover:bg-red-600' : 'bg-yellow-500 hover:bg-yellow-600'}`}>
                      <MessageCircle size={16} />
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* BLOCO SAÚDE */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-96">
          <div className="bg-teal-50 p-4 border-b border-teal-100 flex justify-between items-center rounded-t-xl">
            <div className="flex items-center gap-2">
              <Stethoscope className="text-teal-600" size={20} />
              <h2 className="font-bold text-teal-900">Consultas de Saúde</h2>
            </div>
            <button onClick={() => router.push("/saude")} className="text-xs text-teal-600 hover:underline font-bold">Gerenciar</button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {consultas.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <CheckCircle size={40} className="text-green-500 mb-2 opacity-50" />
                <p className="text-sm">Nenhuma consulta para hoje ou amanhã.</p>
              </div>
            ) : (
              consultas.map(ag => {
                const dataConsulta = new Date(ag.data_hora);
                const isHoje = dataConsulta.toISOString().split('T')[0] === hojeStr;
                return (
                  <div key={ag.id} className={`border p-3 rounded-lg flex justify-between items-center ${isHoje ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isHoje ? 'bg-red-200 text-red-800' : 'bg-yellow-200 text-yellow-800'}`}>
                          {isHoje ? 'HOJE' : 'AMANHÃ'}
                        </span>
                        <p className="font-bold text-sm text-gray-800">{ag.nome_paciente}</p>
                      </div>
                      <p className="text-xs text-gray-600">{dataConsulta.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})} - {ag.profissionais_saude?.nome}</p>
                    </div>
                    <button onClick={() => enviarWhatsAppSaude(ag)} className={`p-2 rounded-full shadow text-white ${isHoje ? 'bg-red-500 hover:bg-red-600' : 'bg-yellow-500 hover:bg-yellow-600'}`}>
                      <MessageCircle size={16} />
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* LINHA 3: RETORNOS DA SEMANA E ALERTAS */}
      <div className="grid md:grid-cols-2 gap-6">
        
        {/* RETORNOS */}
        <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-orange-500 p-2 rounded-full text-white">
              <RefreshCw size={20} />
            </div>
            <div>
              <h3 className="font-bold text-orange-900">Retornos Agendados (Próximos 7 dias)</h3>
              <p className="text-sm text-orange-700">{retornosSemana.length} paciente(s) para retornar.</p>
            </div>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {retornosSemana.length === 0 ? (
              <p className="text-sm text-orange-600 italic">Nenhum retorno agendado.</p>
            ) : (
              retornosSemana.map(ag => (
                <div key={ag.id} className="bg-white p-2 rounded border border-orange-100 flex justify-between items-center text-sm">
                  <div>
                    <p className="font-bold text-gray-800">{ag.nome_paciente}</p>
                    <p className="text-xs text-gray-500">{new Date(ag.data_hora).toLocaleDateString('pt-BR')} - {ag.profissionais_saude?.nome}</p>
                  </div>
                  <button onClick={() => enviarWhatsAppSaude(ag)} className="text-green-600 hover:text-green-800"><MessageCircle size={16}/></button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ALERTAS DE VENCIMENTO */}
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold flex items-center gap-2 text-sm uppercase tracking-wide text-gray-600">
              <AlertTriangle size={16} className="text-red-500" /> Alertas de Vencimento
            </h3>
            <button onClick={() => router.push('/alertas')} className="text-xs text-blue-600 hover:underline">Central de Alertas &rarr;</button>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-red-50 border border-red-100 rounded-lg p-2 text-center">
              <p className="text-[10px] font-bold text-red-800 uppercase">Atraso +5d</p>
              <p className="text-xl font-bold text-red-600">{alertas.atraso5}</p>
            </div>
            <div className="bg-orange-50 border border-orange-100 rounded-lg p-2 text-center">
              <p className="text-[10px] font-bold text-orange-800 uppercase">Atraso 2-4d</p>
              <p className="text-xl font-bold text-orange-600">{alertas.atraso2}</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-2 text-center">
              <p className="text-[10px] font-bold text-yellow-800 uppercase">Vence Hoje</p>
              <p className="text-xl font-bold text-yellow-600">{alertas.venceHoje}</p>
            </div>
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-2 text-center">
              <p className="text-[10px] font-bold text-blue-800 uppercase">Vence em 2-5d</p>
              <p className="text-xl font-bold text-blue-600">{alertas.vence2 + alertas.vence5}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}