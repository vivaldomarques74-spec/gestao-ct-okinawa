"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Users, AlertTriangle, Layers, TrendingUp, Award, School, CheckCircle, Clock, Bell } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({ ativos: 0, inativos: 0, alertas: 0, turmas: 0 });
  const [turmasList, setTurmasList] = useState<any[]>([]);
  const [modalidadesList, setModalidadesList] = useState<any[]>([]);
  const [escolasPendentes, setEscolasPendentes] = useState(0);
  
  // Estados para o painel de alertas granular
  const [alertas, setAlertas] = useState({
    atraso5: 0,
    atraso2: 0,
    venceHoje: 0,
    vence2: 0,
    vence5: 0
  });

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    // 1. Alunos Ativos/Inativos
    const { data: alunos } = await supabase.from("alunos").select("status");
    const ativos = alunos?.filter((a: any) => a.status === "ativo").length || 0;
    const inativos = alunos?.filter((a: any) => a.status === "inativo").length || 0;

    // 2. Turmas totais
    const { data: turmas } = await supabase.from("turmas").select("id");
    
    // 3. Escolas Pendentes
    const { count: pendentesCount } = await supabase
      .from("alunos")
      .select("*", { count: "exact", head: true })
      .eq("status", "pendente"); 
    setEscolasPendentes(pendentesCount || 0);

    // 4. Buscar TODAS as mensalidades pendentes para calcular os alertas
    const { data: mensalidades } = await supabase.from("mensalidades").select("*").eq("status", "pendente");
    
    let atraso5 = 0, atraso2 = 0, venceHoje = 0, vence2 = 0, vence5 = 0;
    
    // Data de hoje (Zerada para comparação)
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    mensalidades?.forEach(m => {
      const venc = new Date(m.vencimento + "T12:00:00");
      venc.setHours(0, 0, 0, 0);
      
      const diffTime = venc.getTime() - hoje.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)); // Dias de diferença

      if (diffDays <= -5) atraso5++;
      else if (diffDays <= -2) atraso2++;
      else if (diffDays === 0) venceHoje++;
      else if (diffDays >= 2 && diffDays <= 3) vence2++;
      else if (diffDays >= 4 && diffDays <= 5) vence5++;
    });

    setAlertas({ atraso5, atraso2, venceHoje, vence2, vence5 });

    setStats({ 
      ativos, 
      inativos, 
      alertas: mensalidades?.length || 0, 
      turmas: turmas?.length || 0 
    });

    // 5. Gráficos
    const { data: matriculas } = await supabase.from("matriculas").select("id, turma_id");
    const { data: turmasData } = await supabase.from("turmas").select("id, nome, modalidade_id");
    const { data: modalidadesData } = await supabase.from("modalidades").select("id, nome");

    const turmaCount: any = {};
    const modalidadeCount: any = {};

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

      {/* WIDGET DE INDICAÇÕES DE ESCOLAS */}
      <div 
        onClick={() => escolasPendentes > 0 ? router.push("/escolas") : null} 
        className={`border p-4 rounded-xl mb-6 flex justify-between items-center transition shadow-sm
          ${escolasPendentes > 0 ? "bg-blue-50 border-blue-200 cursor-pointer hover:bg-blue-100" : "bg-white border-gray-200"}
        `}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full text-white ${escolasPendentes > 0 ? "bg-blue-500" : "bg-green-500"}`}>
            {escolasPendentes > 0 ? <School size={24} /> : <CheckCircle size={24} />}
          </div>
          <div>
            <h3 className={`font-bold ${escolasPendentes > 0 ? "text-blue-900" : "text-gray-800"}`}>Indicações de Escolas</h3>
            <p className={`text-sm ${escolasPendentes > 0 ? "text-blue-700" : "text-gray-500"}`}>
              {escolasPendentes > 0 ? `${escolasPendentes} aluno(s) aguardando aprovação.` : "Nenhuma pendência de escola parceira."}
            </p>
          </div>
        </div>
        {escolasPendentes > 0 && (
          <span className="text-blue-600 font-semibold text-sm">Clique aqui para revisar &rarr;</span>
        )}
      </div>

      {/* Cards */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        {cards.map((card, i) => (
          <div key={i} className="bg-white rounded-xl shadow p-4 flex justify-between items-center border border-gray-100">
            <div>
              <p className="text-gray-500 text-sm">{card.title}</p>
              <p className="text-3xl font-bold">{card.value}</p>
            </div>
            <card.icon className={`w-8 h-8 ${card.color}`} />
          </div>
        ))}
      </div>

      {/* PAINEL DE ALERTAS GRANULAR */}
      <div className="mb-8 bg-white rounded-xl shadow p-4 border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold flex items-center gap-2 text-lg">
            <Bell size={20} className="text-red-500" /> Painel de Alertas (Vencimentos)
          </h3>
          <button onClick={() => router.push('/alertas')} className="text-sm text-blue-600 hover:underline">
            Ir para Central de Alertas
          </button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-red-100 border border-red-200 rounded-lg p-3 text-center">
            <p className="text-xs font-semibold text-red-800">+ de 5 dias atrasado</p>
            <p className="text-2xl font-bold text-red-600">{alertas.atraso5}</p>
          </div>
          <div className="bg-orange-100 border border-orange-200 rounded-lg p-3 text-center">
            <p className="text-xs font-semibold text-orange-800">2 a 4 dias atrasado</p>
            <p className="text-2xl font-bold text-orange-600">{alertas.atraso2}</p>
          </div>
          <div className="bg-yellow-100 border border-yellow-200 rounded-lg p-3 text-center">
            <p className="text-xs font-semibold text-yellow-800">Vence Hoje</p>
            <p className="text-2xl font-bold text-yellow-600">{alertas.venceHoje}</p>
          </div>
          <div className="bg-blue-100 border border-blue-200 rounded-lg p-3 text-center">
            <p className="text-xs font-semibold text-blue-800">Vence em 2 a 3 dias</p>
            <p className="text-2xl font-bold text-blue-600">{alertas.vence2}</p>
          </div>
          <div className="bg-green-100 border border-green-200 rounded-lg p-3 text-center">
            <p className="text-xs font-semibold text-green-800">Vence em 4 a 5 dias</p>
            <p className="text-2xl font-bold text-green-600">{alertas.vence5}</p>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <TrendingUp size={18} className="text-red-500" /> Alunos por Turma
          </h3>
          {turmasList.length === 0 ? (
            <p className="text-gray-400">Nenhum aluno matriculado em turma</p>
          ) : (
            turmasList.map((t, i) => (
              <div key={i} className="mb-2">
                <div className="flex justify-between text-sm">
                  <span>{t.nome}</span>
                  <span>{t.alunos}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-red-500 h-2 rounded-full" style={{ width: `${(t.alunos / maxTurma) * 100}%` }} />
                </div>
              </div>
            ))
          )}
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Award size={18} className="text-red-500" /> Distribuição por Modalidade
          </h3>
          {modalidadesList.length === 0 ? (
            <p className="text-gray-400">Nenhum aluno vinculado a modalidade</p>
          ) : (
            modalidadesList.map((m, i) => (
              <div key={i} className="mb-2">
                <div className="flex justify-between text-sm">
                  <span>{m.nome}</span>
                  <span>{m.qtd}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-red-500 h-2 rounded-full" style={{ width: `${(m.qtd / maxModalidade) * 100}%` }} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}