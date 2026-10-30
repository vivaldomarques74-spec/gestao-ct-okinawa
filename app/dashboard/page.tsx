"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Users, AlertTriangle, Layers, TrendingUp, Award, School } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({ ativos: 0, inativos: 0, alertas: 0, turmas: 0 });
  const [turmasList, setTurmasList] = useState<any[]>([]);
  const [modalidadesList, setModalidadesList] = useState<any[]>([]);
  const [escolasPendentes, setEscolasPendentes] = useState(0);

  useEffect(() => {
    carregar();
  }, []);

  async function carregar() {
    // 1. Alunos Ativos/Inativos
    const { data: alunos } = await supabase.from("alunos").select("status");
    const ativos = alunos?.filter((a: any) => a.status === "ativo").length || 0;
    const inativos = alunos?.filter((a: any) => a.status === "inativo").length || 0;

    // 2. Alerta: Apenas mensalidades vencidas ou que vencem nos próximos 5 dias
    const hoje = new Date();
    const daqui5Dias = new Date();
    daqui5Dias.setDate(hoje.getDate() + 5);
    
    const dataLimite = daqui5Dias.toISOString().split('T')[0]; // Formato YYYY-MM-DD

    const { data: mensalidades } = await supabase
      .from("mensalidades")
      .select("id")
      .eq("status", "pendente")
      .lte("vencimento", dataLimite); // Pega as que vencem antes ou nos próximos 5 dias

    // 3. Turmas totais
    const { data: turmas } = await supabase.from("turmas").select("id");
    
    setStats({ 
      ativos, 
      inativos, 
      alertas: mensalidades?.length || 0, 
      turmas: turmas?.length || 0 
    });

    // 4. Escolas Pendentes (Notificação)
    // ⚠️ AQUI: Se no seu banco a regra for outra, mude o "pendente"
    const { count: pendentesCount } = await supabase
      .from("alunos")
      .select("*", { count: "exact", head: true })
      .eq("status", "pendente"); 
    
    setEscolasPendentes(pendentesCount || 0);

    // 5. Gráficos (Busca Segura para não dar erro 400)
    const { data: matriculas } = await supabase.from("matriculas").select("id, turma_id");
    const { data: turmasData } = await supabase.from("turmas").select("id, nome, modalidade_id");
    const { data: modalidadesData } = await supabase.from("modalidades").select("id, nome");

    const turmaCount: any = {};
    const modalidadeCount: any = {};

    matriculas?.forEach((m: any) => {
      const turma = turmasData?.find(t => t.id === m.turma_id);
      
      // Contagem de Turma
      const nomeTurma = turma?.nome || "Sem turma";
      turmaCount[nomeTurma] = (turmaCount[nomeTurma] || 0) + 1;

      // Contagem de Modalidade
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
    { title: "Alertas (5 dias)", value: stats.alertas, icon: AlertTriangle, color: "text-red-500" },
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
      {escolasPendentes > 0 && (
        <div 
          onClick={() => router.push("/escolas")} 
          className="bg-blue-50 border border-blue-200 p-4 rounded-xl mb-6 flex justify-between items-center cursor-pointer hover:bg-blue-100 transition shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="bg-blue-500 p-2 rounded-full text-white">
              <School size={24} />
            </div>
            <div>
              <h3 className="font-bold text-blue-900">Indicações de Escolas</h3>
              <p className="text-sm text-blue-700">{escolasPendentes} aluno(s) aguardando aprovação.</p>
            </div>
          </div>
          <span className="text-blue-600 font-semibold text-sm">Clique aqui para revisar &rarr;</span>
        </div>
      )}

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

      {/* Gráficos */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Alunos por Turma */}
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

        {/* Distribuição por Modalidade */}
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