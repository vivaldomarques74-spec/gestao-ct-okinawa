"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Users, AlertTriangle, Layers, School, CheckCircle, FlaskConical, MessageCircle, FileText, Stethoscope, ChevronRight, RefreshCw, Award } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({ ativos: 0, turmas: 0 });
  const [turmasList, setTurmasList] = useState<any[]>([]);
  const [modalidadesList, setModalidadesList] = useState<any[]>([]);
  const [escolasPendentes, setEscolasPendentes] = useState(0);
  const [aulasExp, setAulasExp] = useState<any[]>([]); 
  const [consultasHoje, setConsultasHoje] = useState<any[]>([]); 
  const [retornosSemana, setRetornosSemana] = useState<any[]>([]);
  
  const [alertas, setAlertas] = useState({
    atraso5: 0, atraso2: 0, venceHoje: 0, vence2: 0, vence5: 0
  });

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    const { data: alunos } = await supabase.from("alunos").select("status");
    const ativos = alunos?.filter((a: any) => a.status === "ativo").length || 0;
    const pendentes = alunos?.filter((a: any) => a.status === "pendente").length || 0;
    setEscolasPendentes(pendentes);

    const { data: turmas } = await supabase.from("turmas").select("id");
    const { data: mods } = await supabase.from("modalidades").select("*");
    
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
    setStats({ ativos, turmas: turmas?.length || 0 });

    const { data: exp } = await supabase.from("aulas_experimentais").select("*").neq("status", "matriculado");
    const expCruzadas = (exp || []).map(e => {
      const mod = mods?.find(m => m.id === e.modalidade_id)
      return { ...e, modalidade_nome: mod?.nome || "Modalidade" }
    })
    setAulasExp(expCruzadas || []);

    const hojeStr = new Date().toISOString().split('T')[0];
    const { data: consultas } = await supabase
      .from("agendamentos_saude")
      .select("*, profissionais_saude(nome, especialidade)")
      .eq("status", "agendado")
      .gte("data_hora", `${hojeStr}T00:00:00`)
      .lte("data_hora", `${hojeStr}T23:59:59`)
      .order("data_hora");
    setConsultasHoje(consultas || []);

    const daqui7Dias = new Date()
    daqui7Dias.setDate(daqui7Dias.getDate() + 7)
    
    const { data: retornos } = await supabase
      .from("agendamentos_saude")
      .select("*, profissionais_saude(nome)")
      .eq("is_retorno", true)
      .eq("status", "agendado")
      .gte("data_hora", hoje.toISOString())
      .lte("data_hora", daqui7Dias.toISOString())
      .order("data_hora")
    
    setRetornosSemana(retornos || [])

    const { data: matriculas } = await supabase.from("matriculas").select("id, turma_id");
    const { data: turmasData } = await supabase.from("turmas").select("id, nome, modalidade_id");
    const { data: modalidadesData } = await supabase.from("modalidades").select("id, nome");

    const turmaCount: any = {}; const modalidadeCount: any = {};

    matriculas?.forEach((m: any) => {
      const turma = turmasData?.find(t => t.id === m.turma_id);
      const nomeTurma = turma?.nome || "Sem turma";
      turmaCount[nomeTurma] = (turmaCount[nomeTurma] || 0) + 1;

      const modalidade = modalidadesData?.find(mod => mod.id === turma?.modalidade_id);
      const nomeMod = modalidade?.nome || "Sem modalidade";
      modalidadeCount[nomeMod] = (modalidadeCount[nomeMod] || 0) + 1;
    });

    setTurmasList(Object.keys(turmaCount).map((nome) => ({ nome, alunos: turmaCount[nome] })));
    setModalidadesList(Object.keys(modalidadeCount).map((nome) => ({ nome, qtd: modalidadeCount[nome] })));
  }

  function enviarWhatsAppExp(ag: any, tipo: "comprovante" | "lembrete") {
    let numero = ag.telefone.replace(/\D/g, "")
    if (!numero.startsWith("55")) numero = "55" + numero
    const dataFormatada = new Date(ag.data_aula + "T12:00:00").toLocaleDateString('pt-BR')
    const mensagem = tipo === "comprovante" 
      ? `Olá, *${ag.nome}*! Sua aula experimental de *${ag.modalidade_nome}* está confirmada! 🥋\n\n📅 Data: ${dataFormatada}`
      : `Olá, *${ag.nome}*! Passando para lembrar da sua aula experimental HOJE! OSS! 🥋`
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`, "_blank")
  }

  function enviarWhatsAppSaude(ag: any) {
    let numero = ag.whatsapp_paciente.replace(/\D/g, "")
    if (!numero.startsWith("55")) numero = "55" + numero
    const horaFormatada = new Date(ag.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    const mensagem = `Olá, *${ag.nome_paciente}*! Passando para lembrar da sua consulta HOJE às ${horaFormatada} com *${ag.profissionais_saude?.nome}* (${ag.profissionais_saude?.especialidade}) no CT Okinawa. Até logo! 🩺`
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`, "_blank")
  }

  const cards = [
    { title: "Alunos Ativos", value: stats.ativos, icon: Users, color: "text-green-600" },
    { title: "Turmas", value: stats.turmas, icon: Layers, color: "text-blue-500" },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Visão Geral</h1>
        <p className="text-gray-500">Acompanhe os indicadores da sua academia</p>
      </div>

      {/* LINHA 1 E 2: APENAS OS CARDS SOLICITADOS E OS WIDGETS */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        {cards.map((card, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm p-4 flex justify-between items-center border border-gray-100">
            <div>
              <p className="text-gray-500 text-sm">{card.title}</p>
              <p className="text-3xl font-bold">{card.value}</p>
            </div>
            <card.icon className={`w-8 h-8 ${card.color}`} />
          </div>
        ))}

        {/* WIDGETS NA MESMA LINHA PARA COMPACTAR */}
        <div onClick={() => escolasPendentes > 0 ? router.push("/escolas") : null} className={`rounded-xl p-4 flex flex-col justify-between transition shadow-sm border ${escolasPendentes > 0 ? "bg-blue-50 border-blue-200 cursor-pointer hover:bg-blue-100" : "bg-white border-gray-100"}`}>
          <div className="flex items-center gap-2 mb-2">
            <div className={`p-1.5 rounded-full text-white ${escolasPendentes > 0 ? "bg-blue-500" : "bg-green-500"}`}>
              {escolasPendentes > 0 ? <School size={16} /> : <CheckCircle size={16} />}
            </div>
            <h3 className={`font-bold text-xs ${escolasPendentes > 0 ? "text-blue-900" : "text-gray-800"}`}>Escolas</h3>
          </div>
          <p className={`text-xs ${escolasPendentes > 0 ? "text-blue-700 font-semibold" : "text-gray-500"}`}>
            {escolasPendentes > 0 ? `${escolasPendentes} pendente(s).` : "Sem pendências."}
          </p>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="bg-purple-100 p-1.5 rounded-full text-purple-600">
                <FlaskConical size={16} />
              </div>
              <h3 className="font-bold text-xs text-gray-800">Exp.</h3>
            </div>
            <button onClick={() => router.push("/aula-experimental")} className="text-[10px] text-purple-600 font-bold hover:underline">Ver</button>
          </div>
          <p className="text-xs text-gray-500">{aulasExp.length} no funil.</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="bg-teal-100 p-1.5 rounded-full text-teal-600">
                <Stethoscope size={16} />
              </div>
              <h3 className="font-bold text-xs text-gray-800">Saúde</h3>
            </div>
            <button onClick={() => router.push("/saude")} className="text-[10px] text-teal-600 font-bold hover:underline">Ver</button>
          </div>
          <p className="text-xs text-gray-500">{consultasHoje.length} consulta(s).</p>
        </div>
      </div>

      {/* NOVO WIDGET: RETORNOS DA SEMANA */}
      {retornosSemana.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl mb-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-orange-500 p-2 rounded-full text-white">
              <RefreshCw size={20} />
            </div>
            <div>
              <h3 className="font-bold text-orange-900">Retornos Agendados (Próximos 7 dias)</h3>
              <p className="text-sm text-orange-700">{retornosSemana.length} paciente(s) para retornar.</p>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-2">
            {retornosSemana.map(ag => (
              <div key={ag.id} className="bg-white p-2 rounded border border-orange-100 flex justify-between items-center text-sm">
                <div>
                  <p className="font-bold text-gray-800">{ag.nome_paciente}</p>
                  <p className="text-xs text-gray-500">{new Date(ag.data_hora).toLocaleDateString('pt-BR')} - {ag.profissionais_saude?.nome}</p>
                </div>
                <button onClick={() => enviarWhatsAppSaude(ag)} className="text-green-600 hover:text-green-800"><MessageCircle size={16}/></button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6 bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold flex items-center gap-2 text-sm uppercase tracking-wide text-gray-600">
            <AlertTriangle size={16} className="text-red-500" /> Alertas de Vencimento
          </h3>
          <button onClick={() => router.push('/alertas')} className="text-xs text-blue-600 hover:underline">Central de Alertas &rarr;</button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-center"><p className="text-[10px] font-bold text-red-800 uppercase">Atraso +5d</p><p className="text-2xl font-bold text-red-600">{alertas.atraso5}</p></div>
          <div className="bg-orange-50 border border-orange-100 rounded-lg p-3 text-center"><p className="text-[10px] font-bold text-orange-800 uppercase">Atraso 2-4d</p><p className="text-2xl font-bold text-orange-600">{alertas.atraso2}</p></div>
          <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-3 text-center"><p className="text-[10px] font-bold text-yellow-800 uppercase">Vence Hoje</p><p className="text-2xl font-bold text-yellow-600">{alertas.venceHoje}</p></div>
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-center"><p className="text-[10px] font-bold text-blue-800 uppercase">Vence 2-3d</p><p className="text-2xl font-bold text-blue-600">{alertas.vence2}</p></div>
          <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-center"><p className="text-[10px] font-bold text-green-800 uppercase">Vence 4-5d</p><p className="text-2xl font-bold text-green-600">{alertas.vence5}</p></div>
        </div>
      </div>

      {/* DISTRIBUIÇÃO EM CARDS (SUBSTITUINDO OS GRÁFICOS) */}
      <div className="grid md:grid-cols-2 gap-6">
        
        {/* CARD: ALUNOS POR TURMA */}
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <h3 className="font-semibold mb-4 text-sm text-gray-600 flex items-center gap-2">
            <Layers size={16} className="text-red-500" /> Distribuição por Turma
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {turmasList.length === 0 ? <p className="text-gray-400 text-sm col-span-2">Nenhum dado disponível.</p> : turmasList.map((t, i) => (
              <div key={i} className="bg-gray-50 border border-gray-100 p-3 rounded-lg flex flex-col justify-center items-center shadow-sm hover:shadow transition">
                <span className="text-2xl font-bold text-gray-800">{t.alunos}</span>
                <span className="text-xs font-semibold text-gray-500 text-center uppercase tracking-wide mt-1">{t.nome}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CARD: DISTRIBUIÇÃO POR MODALIDADE */}
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <h3 className="font-semibold mb-4 text-sm text-gray-600 flex items-center gap-2">
            <Award size={16} className="text-red-500" /> Distribuição por Modalidade
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {modalidadesList.length === 0 ? <p className="text-gray-400 text-sm col-span-2">Nenhum dado disponível.</p> : modalidadesList.map((m, i) => (
              <div key={i} className="bg-gray-50 border border-gray-100 p-3 rounded-lg flex flex-col justify-center items-center shadow-sm hover:shadow transition">
                <span className="text-2xl font-bold text-gray-800">{m.qtd}</span>
                <span className="text-xs font-semibold text-gray-500 text-center uppercase tracking-wide mt-1">{m.nome}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}