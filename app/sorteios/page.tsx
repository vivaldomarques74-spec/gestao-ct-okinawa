"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import AdminGuard from "../../components/AdminGuard";
import { Gift, Plus, Edit, Trash2, Trophy, Users, Award } from "lucide-react";

export default function SorteiosPage() {
  const [campanhas, setCampanhas] = useState<any[]>([]);
  const [premiacoes, setPremiacoes] = useState<any[]>([]);
  const [ganhadores, setGanhadores] = useState<any[]>([]);
  const [alunos, setAlunos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    setLoading(true);
    const { data: camp } = await supabase.from("campanhas").select("*").order("created_at", { ascending: false });
    const { data: prem } = await supabase.from("premiacoes").select("*, campanhas(nome)");
    const { data: ganh } = await supabase.from("campanhas_ganhadores").select("*, campanhas(nome), premiacoes(titulo, percentual_desconto, meses_duracao), alunos(nome, cpf)");
    const { data: alu } = await supabase.from("alunos").select("id, nome, cpf").eq("status", "ativo");
    setCampanhas(camp || []);
    setPremiacoes(prem || []);
    setGanhadores(ganh || []);
    setAlunos(alu || []);
    setLoading(false);
  }

  return (
    <AdminGuard>
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Gift className="text-red-600" /> Sorteios / Promoções
          </h1>
          <button className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700">
            <Plus size={18} /> Nova Campanha
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Campanhas */}
          <div className="bg-white rounded-xl shadow p-4">
            <h2 className="font-bold text-lg mb-3 flex items-center gap-2"><Trophy size={18} /> Campanhas</h2>
            {campanhas.length === 0 ? (
              <p className="text-gray-500">Nenhuma campanha criada.</p>
            ) : (
              <div className="space-y-2">
                {campanhas.map(c => (
                  <div key={c.id} className="border rounded-lg p-3 flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{c.nome}</p>
                      <p className="text-xs text-gray-500 capitalize">{c.tipo} • {c.status}</p>
                    </div>
                    <div className="flex gap-2">
                      <button className="text-blue-500 hover:text-blue-700"><Edit size={16} /></button>
                      <button className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Premiações */}
          <div className="bg-white rounded-xl shadow p-4">
            <h2 className="font-bold text-lg mb-3 flex items-center gap-2"><Award size={18} /> Premiações</h2>
            {premiacoes.length === 0 ? (
              <p className="text-gray-500">Nenhuma premiação cadastrada.</p>
            ) : (
              <div className="space-y-2">
                {premiacoes.map(p => (
                  <div key={p.id} className="border rounded-lg p-3">
                    <p className="font-semibold">{p.titulo}</p>
                    <p className="text-sm">{p.percentual_desconto}% de desconto por {p.meses_duracao} meses</p>
                    <p className="text-xs text-gray-500">Campanha: {p.campanhas?.nome}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Ganhadores */}
        <div className="bg-white rounded-xl shadow p-4 mt-6">
          <h2 className="font-bold text-lg mb-3 flex items-center gap-2"><Users size={18} /> Ganhadores</h2>
          {ganhadores.length === 0 ? (
            <p className="text-gray-500">Nenhum ganhador vinculado.</p>
          ) : (
            <div className="overflow-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-2 text-left">Aluno</th>
                    <th className="p-2 text-left">Campanha</th>
                    <th className="p-2 text-left">Premiação</th>
                    <th className="p-2 text-left">Meses restantes</th>
                    <th className="p-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {ganhadores.map(g => (
                    <tr key={g.id} className="border-t">
                      <td className="p-2">{g.alunos?.nome}</td>
                      <td className="p-2">{g.campanhas?.nome}</td>
                      <td className="p-2">{g.premiacoes?.titulo} ({g.premiacoes?.percentual_desconto}%)</td>
                      <td className="p-2">{g.meses_restantes}</td>
                      <td className="p-2 capitalize">{g.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-6 text-center text-gray-400 text-sm">
          ⚠️ Módulo em desenvolvimento – em breve, sorteios e promoções automáticas!
        </div>
      </div>
    </AdminGuard>
  );
}