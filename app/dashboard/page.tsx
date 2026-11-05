"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Users, AlertTriangle, Layers, TrendingUp, Award, School, CheckCircle, FlaskConical, MessageCircle, FileText, Stethoscope, ChevronRight, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({ ativos: 0, inativos: 0, alertas: 0, turmas: 0 });
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
    const inativos = alunos?.filter((a: any) => a.status === "inativo").length || 0;
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
    setStats({ ativos, inativos, alertas: pendentesMensalidades.length, turmas: turmas?.length || 0 });

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

    // NOVO: Puxa Retornos dos próximos 7 dias
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
    { title: "Alunos Inativos", value: stats.inativos, icon: Users, color: "text-gray-500" },
    { title: "Total Pendências", value: stats.alertas, icon: AlertTriangle, color: "text-red-500" },
    { title: "Turmas", value: stats.turmas, icon: Layers, color: "text-blue-500" },
  ];

  const maxTurma = Math.max(...turmasList.map((t) => t.alunos), 1);
  const maxModalidade = Math.max(...modalidadesList.map((m) => m.qtd), 1);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Visão Geral</h1>
        <p className="text-gray-500">Acompanhe os indicadores da sua academia</p>
      </div>

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
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div onClick={() => escolasPendentes > 0 ? router.push("/escolas") : null} className={`rounded-xl p-4 flex flex-col justify-between transition shadow-sm border ${escolasPendentes > 0 ? "bg-blue-50 border-blue-200 cursor-pointer hover:bg-blue-100" : "bg-white border-gray-100"}`}>
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-full text-white ${escolasPendentes > 0 ? "bg-blue-500" : "bg-green-500"}`}>
              {escolasPendentes > 0 ? <School size={20} /> : <CheckCircle size={20} />}
            </div>
            <h3 className={`font-bold text-sm ${escolasPendentes > 0 ? "text-blue-900" : "text-gray-800"}`}>Escolas Parceiras</h3>
          </div>
          <p className={`text-xs ${escolasPendentes > 0 ? "text-blue-700 font-semibold" : "text-gray-500"}`}>
            {escolasPendentes > 0 ? `${escolasPendentes} aluno(s) aguardando aprovação.` : "Nenhuma pendência no momento."}
          </p>
          {escolasPendentes > 0 && <p className="text-xs text-blue-600 font-bold mt-2 flex items-center gap-1">Revisar agora <ChevronRight size={14}/></p>}
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="bg-purple-100 p-1.5 rounded-full text-purple-600">
                <FlaskConical size={18} />
              </div>
              <h3 className="font-bold text-sm text-gray-800">Aulas Experimentais</h3>
            </div>
            <button onClick={() => router.push("/aula-experimental")} className="text-xs text-purple-600 font-bold hover:underline">Gerenciar</button>
          </div>
          <p className="text-xs text-gray-500 mb-2">{aulasExp.length} pessoa(s) no funil.</p>
          
          {aulasExp.length > 0 && (
            <div className="space-y-1.5 max-h-20 overflow-y-auto pr-1">
              {aulasExp.slice(0, 3).map(ag => (
                <div key={ag.id} className="flex justify-between items-center bg-gray-50 p-1.5 rounded text-xs border border-gray-100">
                  <span className="font-semibold truncate max-w-30">{ag.nome}</span>
                  <div className="flex gap-1">
                    <button onClick={() => enviarWhatsAppExp(ag, "comprovante")} className="text-blue-600 hover:text-blue-800" title="Comprovante"><FileText size={14} /></button>
                    <button onClick={() => enviarWhatsAppExp(ag, "lembrete")} className="text-green-600 hover:text-green-800" title="Lembrete"><MessageCircle size={14} /></button>
                  </div>
                </div>
              ))}
              {aulasExp.length > 3 && <p className="text-[10px] text-gray-400 text-center">+ {aulasExp.length - 3} agendamentos...</p>}
            </div>
          )}
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="bg-teal-100 p-1.5 rounded-full text-teal-600">
                <Stethoscope size={18} />
              </div>
              <h3 className="font-bold text-sm text-gray-800">Saúde Hoje</h3>
            </div>
            <button onClick={() => router.push("/saude")} className="text-xs text-teal-600 font-bold hover:underline">Ver Agenda</button>
          </div>
          <p className="text-xs text-gray-500 mb-2">{consultasHoje.length} consulta(s) agendada(s).</p>

          {consultasHoje.length > 0 ? (
            <div className="space-y-1.5 max-h-20 overflow-y-auto pr-1">
              {consultasHoje.map(ag => (
                <div key={ag.id} className="flex justify-between items-center bg-gray-50 p-1.5 rounded text-xs border border-gray-100">
                  <span className="font-semibold truncate max-w-25">{ag.nome_paciente}</span>
                  <span className="text-gray-500 text-[10px]">{new Date(ag.data_hora).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</span>
                  <button onClick={() => enviarWhatsAppSaude(ag)} className="text-green-600 hover:text-green-800" title="Lembrete WhatsApp"><MessageCircle size={14} /></button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[10px] text-gray-400 text-center mt-2">Tudo tranquilo por aqui.</p>
          )}
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

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <h3 className="font-semibold mb-4 text-sm text-gray-600 flex items-center gap-2"><TrendingUp size={16} className="text-red-500" /> Alunos por Turma</h3>
          {turmasList.length === 0 ? <p className="text-gray-400 text-sm">Nenhum dado disponível.</p> : turmasList.map((t, i) => (
            <div key={i} className="mb-3">
              <div className="flex justify-between text-xs mb-1"><span className="font-medium text-gray-700">{t.nome}</span><span className="font-bold text-gray-500">{t.alunos}</span></div>
              <div className="w-full bg-gray-100 rounded-full h-1.5"><div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${(t.alunos / maxTurma) * 100}%` }} /></div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <h3 className="font-semibold mb-4 text-sm text-gray-600 flex items-center gap-2"><Award size={16} className="text-red-500" /> Alunos por Modalidade</h3>
          {modalidadesList.length === 0 ? <p className="text-gray-400 text-sm">Nenhum dado disponível.</p> : modalidadesList.map((m, i) => (
            <div key={i} className="mb-3">
              <div className="flex justify-between text-xs mb-1"><span className="font-medium text-gray-700">{m.nome}</span><span className="font-bold text-gray-500">{m.qtd}</span></div>
              <div className="w-full bg-gray-100 rounded-full h-1.5"><div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${(m.qtd / maxModalidade) * 100}%` }} /></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}