"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import AdminGuard from "../../components/AdminGuard";
import { Gift, Plus, Edit, Trash2, Trophy, Users, Award, Check, X, Search } from "lucide-react";

type Campanha = {
  id: string;
  nome: string;
  tipo: string;
  status: string;
};

type Premiacao = {
  id: string;
  campanha_id: string;
  titulo: string;
  percentual_desconto: number;
  meses_duracao: number;
};

type Ganhador = {
  id: string;
  campanha_id: string;
  premiacao_id: string;
  aluno_id: string;
  meses_restantes: number;
  status: string;
  campanhas?: { nome: string };
  premiacoes?: { titulo: string; percentual_desconto: number };
  alunos?: { nome: string; cpf: string };
};

export default function SorteiosPage() {
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [premiacoes, setPremiacoes] = useState<Premiacao[]>([]);
  const [ganhadores, setGanhadores] = useState<Ganhador[]>([]);
  const [alunos, setAlunos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estado para modais
  const [showCampanhaModal, setShowCampanhaModal] = useState(false);
  const [showPremiacaoModal, setShowPremiacaoModal] = useState(false);
  const [showGanhadorModal, setShowGanhadorModal] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);

  // Formulários
  const [formCampanha, setFormCampanha] = useState({ nome: "", tipo: "sorteio", status: "ativo" });
  const [formPremiacao, setFormPremiacao] = useState({ campanha_id: "", titulo: "", percentual_desconto: "", meses_duracao: "" });
  const [formGanhador, setFormGanhador] = useState({ campanha_id: "", premiacao_id: "", aluno_id: "" });
  const [buscaAluno, setBuscaAluno] = useState("");
  const [alunosFiltrados, setAlunosFiltrados] = useState<any[]>([]);

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    if (buscaAluno.length > 1) {
      setAlunosFiltrados(alunos.filter(a => a.nome.toLowerCase().includes(buscaAluno.toLowerCase())));
    } else {
      setAlunosFiltrados([]);
    }
  }, [buscaAluno, alunos]);

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

  async function salvarCampanha() {
    if (!formCampanha.nome) return alert("Nome da campanha é obrigatório");
    let error;
    if (editandoId) {
      const { error: e } = await supabase.from("campanhas").update(formCampanha).eq("id", editandoId);
      error = e;
    } else {
      const { error: e } = await supabase.from("campanhas").insert([formCampanha]);
      error = e;
    }
    if (error) alert("Erro: " + error.message);
    else {
      alert(editandoId ? "Campanha atualizada" : "Campanha criada");
      setShowCampanhaModal(false);
      setEditandoId(null);
      setFormCampanha({ nome: "", tipo: "sorteio", status: "ativo" });
      carregarDados();
    }
  }

  async function salvarPremiacao() {
    if (!formPremiacao.campanha_id || !formPremiacao.titulo) return alert("Preencha todos os campos");
    const payload = {
      campanha_id: formPremiacao.campanha_id,
      titulo: formPremiacao.titulo,
      percentual_desconto: Number(formPremiacao.percentual_desconto) || 0,
      meses_duracao: Number(formPremiacao.meses_duracao) || 0,
    };
    const { error } = await supabase.from("premiacoes").insert([payload]);
    if (error) alert("Erro: " + error.message);
    else {
      alert("Premiação adicionada");
      setShowPremiacaoModal(false);
      setFormPremiacao({ campanha_id: "", titulo: "", percentual_desconto: "", meses_duracao: "" });
      carregarDados();
    }
  }

  async function excluirPremiacao(id: string) {
    if (!confirm("Excluir esta premiação?")) return;
    const { error } = await supabase.from("premiacoes").delete().eq("id", id);
    if (error) alert("Erro: " + error.message);
    else carregarDados();
  }

  async function alternarStatusCampanha(campanha: Campanha) {
    const novoStatus = campanha.status === "ativo" ? "inativo" : "ativo";
    const { error } = await supabase.from("campanhas").update({ status: novoStatus }).eq("id", campanha.id);
    if (error) alert("Erro: " + error.message);
    else carregarDados();
  }

  async function excluirCampanha(id: string) {
    if (!confirm("Excluir campanha? Todas as premiações e ganhadores serão removidos.")) return;
    const { error } = await supabase.from("campanhas").delete().eq("id", id);
    if (error) alert("Erro: " + error.message);
    else carregarDados();
  }

  async function salvarGanhador() {
    if (!formGanhador.campanha_id || !formGanhador.premiacao_id || !formGanhador.aluno_id) {
      return alert("Selecione campanha, premiação e aluno");
    }
    const premiacao = premiacoes.find(p => p.id === formGanhador.premiacao_id);
    if (!premiacao) return alert("Premiação não encontrada");
    const { error } = await supabase.from("campanhas_ganhadores").insert([{
      campanha_id: formGanhador.campanha_id,
      premiacao_id: formGanhador.premiacao_id,
      aluno_id: formGanhador.aluno_id,
      meses_restantes: premiacao.meses_duracao,
      status: "ativo"
    }]);
    if (error) alert("Erro: " + error.message);
    else {
      alert("Ganhador vinculado!");
      setShowGanhadorModal(false);
      setFormGanhador({ campanha_id: "", premiacao_id: "", aluno_id: "" });
      setBuscaAluno("");
      carregarDados();
    }
  }

  async function excluirGanhador(id: string) {
    if (!confirm("Remover este ganhador?")) return;
    const { error } = await supabase.from("campanhas_ganhadores").delete().eq("id", id);
    if (error) alert("Erro: " + error.message);
    else carregarDados();
  }

  function editarCampanha(campanha: Campanha) {
    setEditandoId(campanha.id);
    setFormCampanha({ nome: campanha.nome, tipo: campanha.tipo, status: campanha.status });
    setShowCampanhaModal(true);
  }

  return (
    <AdminGuard>
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Gift className="text-red-600" /> Sorteios / Promoções
          </h1>
          <div className="flex gap-2">
            <button onClick={() => { setEditandoId(null); setFormCampanha({ nome: "", tipo: "sorteio", status: "ativo" }); setShowCampanhaModal(true); }} className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700">
              <Plus size={18} /> Nova Campanha
            </button>
            <button onClick={() => { setShowPremiacaoModal(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
              <Plus size={18} /> Nova Premiação
            </button>
            <button onClick={() => { setFormGanhador({ campanha_id: "", premiacao_id: "", aluno_id: "" }); setBuscaAluno(""); setShowGanhadorModal(true); }} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700">
              <Plus size={18} /> Adicionar Ganhador
            </button>
          </div>
        </div>

        {/* Campanhas */}
        <div className="bg-white rounded-xl shadow p-4 mb-6">
          <h2 className="font-bold text-lg mb-3 flex items-center gap-2"><Trophy size={18} /> Campanhas</h2>
          {campanhas.length === 0 ? (
            <p className="text-gray-500">Nenhuma campanha criada.</p>
          ) : (
            <div className="overflow-auto">
              <table className="w-full">
                <thead className="bg-gray-100"><tr><th className="p-2 text-left">Nome</th><th className="p-2 text-left">Tipo</th><th className="p-2 text-left">Status</th><th className="p-2 text-left">Ações</th></tr></thead>
                <tbody>
                  {campanhas.map(c => (
                    <tr key={c.id} className="border-t">
                      <td className="p-2">{c.nome}</td>
                      <td className="p-2 capitalize">{c.tipo}</td>
                      <td className="p-2"><span className={`px-2 py-1 rounded text-xs ${c.status === "ativo" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{c.status}</span></td>
                      <td className="p-2 flex gap-2">
                        <button onClick={() => editarCampanha(c)} className="text-blue-500 hover:text-blue-700"><Edit size={16} /></button>
                        <button onClick={() => alternarStatusCampanha(c)} className="text-yellow-500 hover:text-yellow-700">{c.status === "ativo" ? "Inativar" : "Ativar"}</button>
                        <button onClick={() => excluirCampanha(c.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Premiações */}
        <div className="bg-white rounded-xl shadow p-4 mb-6">
          <h2 className="font-bold text-lg mb-3 flex items-center gap-2"><Award size={18} /> Premiações</h2>
          {premiacoes.length === 0 ? (
            <p className="text-gray-500">Nenhuma premiação cadastrada.</p>
          ) : (
            <div className="overflow-auto">
              <table className="w-full">
                <thead className="bg-gray-100"><tr><th className="p-2 text-left">Título</th><th className="p-2 text-left">Campanha</th><th className="p-2 text-left">Desconto</th><th className="p-2 text-left">Meses</th><th className="p-2 text-left">Ações</th></tr></thead>
                <tbody>
                  {premiacoes.map(p => {
                    const campanha = campanhas.find(c => c.id === p.campanha_id);
                    return (
                      <tr key={p.id} className="border-t">
                        <td className="p-2">{p.titulo}</td>
                        <td className="p-2">{campanha?.nome || "-"}</td>
                        <td className="p-2">{p.percentual_desconto}%</td>
                        <td className="p-2">{p.meses_duracao}</td>
                        <td className="p-2"><button onClick={() => excluirPremiacao(p.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Ganhadores */}
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="font-bold text-lg mb-3 flex items-center gap-2"><Users size={18} /> Ganhadores</h2>
          {ganhadores.length === 0 ? (
            <p className="text-gray-500">Nenhum ganhador vinculado.</p>
          ) : (
            <div className="overflow-auto">
              <table className="w-full">
                <thead className="bg-gray-100"><tr><th className="p-2 text-left">Aluno</th><th className="p-2 text-left">Campanha</th><th className="p-2 text-left">Premiação</th><th className="p-2 text-left">Meses rest.</th><th className="p-2 text-left">Status</th><th className="p-2 text-left">Ações</th></tr></thead>
                <tbody>
                  {ganhadores.map(g => (
                    <tr key={g.id} className="border-t">
                      <td className="p-2">{g.alunos?.nome} ({g.alunos?.cpf})</td>
                      <td className="p-2">{g.campanhas?.nome}</td>
                      <td className="p-2">{g.premiacoes?.titulo} ({g.premiacoes?.percentual_desconto}%)</td>
                      <td className="p-2">{g.meses_restantes}</td>
                      <td className="p-2 capitalize">{g.status}</td>
                      <td className="p-2"><button onClick={() => excluirGanhador(g.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MODAL CAMPANHA */}
      {showCampanhaModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96">
            <h2 className="text-xl font-bold mb-4">{editandoId ? "Editar Campanha" : "Nova Campanha"}</h2>
            <input className="w-full p-2 border rounded mb-3" placeholder="Nome" value={formCampanha.nome} onChange={e => setFormCampanha({ ...formCampanha, nome: e.target.value })} />
            <select className="w-full p-2 border rounded mb-3" value={formCampanha.tipo} onChange={e => setFormCampanha({ ...formCampanha, tipo: e.target.value })}>
              <option value="sorteio">Sorteio</option><option value="promocao">Promoção</option>
            </select>
            <select className="w-full p-2 border rounded mb-4" value={formCampanha.status} onChange={e => setFormCampanha({ ...formCampanha, status: e.target.value })}>
              <option value="ativo">Ativo</option><option value="inativo">Inativo</option><option value="encerrado">Encerrado</option>
            </select>
            <div className="flex gap-2">
              <button onClick={salvarCampanha} className="bg-red-600 text-white px-4 py-2 rounded flex-1">Salvar</button>
              <button onClick={() => { setShowCampanhaModal(false); setEditandoId(null); }} className="bg-gray-300 px-4 py-2 rounded">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PREMIAÇÃO */}
      {showPremiacaoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-96">
            <h2 className="text-xl font-bold mb-4">Nova Premiação</h2>
            <select className="w-full p-2 border rounded mb-3" value={formPremiacao.campanha_id} onChange={e => setFormPremiacao({ ...formPremiacao, campanha_id: e.target.value })}>
              <option value="">Selecione a campanha</option>
              {campanhas.filter(c => c.status === "ativo").map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
            <input className="w-full p-2 border rounded mb-3" placeholder="Título (ex: 1º Lugar)" value={formPremiacao.titulo} onChange={e => setFormPremiacao({ ...formPremiacao, titulo: e.target.value })} />
            <input className="w-full p-2 border rounded mb-3" type="number" placeholder="% Desconto" value={formPremiacao.percentual_desconto} onChange={e => setFormPremiacao({ ...formPremiacao, percentual_desconto: e.target.value })} />
            <input className="w-full p-2 border rounded mb-4" type="number" placeholder="Meses de duração" value={formPremiacao.meses_duracao} onChange={e => setFormPremiacao({ ...formPremiacao, meses_duracao: e.target.value })} />
            <div className="flex gap-2">
              <button onClick={salvarPremiacao} className="bg-red-600 text-white px-4 py-2 rounded flex-1">Salvar</button>
              <button onClick={() => setShowPremiacaoModal(false)} className="bg-gray-300 px-4 py-2 rounded">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL GANHADOR */}
      {showGanhadorModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[500px]">
            <h2 className="text-xl font-bold mb-4">Adicionar Ganhador</h2>
            <select className="w-full p-2 border rounded mb-3" value={formGanhador.campanha_id} onChange={e => setFormGanhador({ ...formGanhador, campanha_id: e.target.value, premiacao_id: "" })}>
              <option value="">Selecione a campanha</option>
              {campanhas.filter(c => c.status === "ativo").map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
            {formGanhador.campanha_id && (
              <select className="w-full p-2 border rounded mb-3" value={formGanhador.premiacao_id} onChange={e => setFormGanhador({ ...formGanhador, premiacao_id: e.target.value })}>
                <option value="">Selecione a premiação</option>
                {premiacoes.filter(p => p.campanha_id === formGanhador.campanha_id).map(p => <option key={p.id} value={p.id}>{p.titulo} ({p.percentual_desconto}% - {p.meses_duracao} meses)</option>)}
              </select>
            )}
            <div className="relative mb-4">
              <input className="w-full p-2 border rounded pl-8" placeholder="Buscar aluno..." value={buscaAluno} onChange={e => setBuscaAluno(e.target.value)} />
              <Search size={16} className="absolute left-2 top-3 text-gray-400" />
              {alunosFiltrados.length > 0 && (
                <div className="absolute z-10 w-full bg-white border rounded shadow-lg max-h-40 overflow-y-auto">
                  {alunosFiltrados.map(a => (
                    <div key={a.id} className="p-2 hover:bg-gray-100 cursor-pointer" onClick={() => { setFormGanhador({ ...formGanhador, aluno_id: a.id }); setBuscaAluno(a.nome); setAlunosFiltrados([]); }}>
                      {a.nome} - {a.cpf}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={salvarGanhador} className="bg-red-600 text-white px-4 py-2 rounded flex-1">Vincular Ganhador</button>
              <button onClick={() => setShowGanhadorModal(false)} className="bg-gray-300 px-4 py-2 rounded">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </AdminGuard>
  );
}