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
    const { data: alunos } = await supabase.from("alunos").select("status");
    const ativos = alunos?.filter((a: any) => a.status === "ativo").length || 0;
    const inativos = alunos?.filter((a: any) => a.status === "inativo").length || 0;

    // Conta pendentes de escolas
    const { count: pendentesCount } = await supabase
      .from("alunos")
      .select("*", { count: "exact", head: true })
      .eq("status", "pendente"); // Regra da escola
    
    if (pendentesCount && pendentesCount > 0) {
      setEscolasPendentes(pendentesCount);
      // TOAST DE AVISO: Dispara o alerta no canto da tela
      setTimeout(() => {
        alert(`🔔 Você tem ${pendentesCount} nova(s) indicação(ões) de escolas parceiras aguardando aprovação!`);
      }, 1000);
    }

    const { data: mensalidades } = await supabase.from("mensalidades").select("id").eq("status", "pendente");
    const { data: turmas } = await supabase.from("turmas").select("id");

    setStats({ 
      ativos, 
      inativos, 
      alertas: mensalidades?.length || 0, 
      turmas: turmas?.length || 0 
    });

    // Gráficos
    const { data: matriculas } = await supabase.from("matriculas").select("id, turmas(nome, modalidades(nome))");
    const turmaCount: any = {};
    const modalidadeCount: any = {};

    matriculas?.forEach((m: any) => {
      const nomeTurma = m.turmas?.nome || "Sem turma";
      turmaCount[nomeTurma] = (turmaCount[nomeTurma] || 0) + 1;
      const nomeMod = m.turmas?.modalidades?.nome || "Sem modalidade";
      modalidadeCount[nomeMod] = (modalidadeCount[nomeMod] || 0) + 1;
    });

    setTurmasList(Object.keys(turmaCount).map((nome) => ({ nome, alunos: turmaCount[nome] })));
    setModalidadesList(Object.keys(modalidadeCount).map((nome) => ({ nome, qtd: modalidadeCount[nome] })));
  }

  const cards = [
    { title: "Alunos Ativos", value: stats.ativos, icon: Users, color: "text-green-600" },
    { title: "Alunos Inativos", value: stats.inativos, icon: Users, color: "text-gray-500" },
    { title: "Alertas", value: stats.alertas, icon: AlertTriangle, color: "text-red-500" },
    { title: "Turmas", value: stats.turmas, icon: Layers, color: "text-blue-500" },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Visão Geral</h1>
        <p className="text-gray-500">Acompanhe os indicadores da sua academia</p>
      </div>

      {/* WIDGET DE INDICAÇÕES DE ESCOLAS */}
      {escolasPendentes > 0 && (
        <div 
          onClick={() => router.push("/escolas")} // Redireciona para a tela de escolas
          className="bg-blue-50 border border-blue-200 p-4 rounded-xl mb-6 flex justify-between items-center cursor-pointer hover:bg-blue-100 transition"
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
        {/* ... (Mantém os gráficos que já estavam aqui) ... */}
      </div>
    </div>
  );
}