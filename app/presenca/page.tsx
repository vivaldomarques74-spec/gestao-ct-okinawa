"use client";

import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function PresencaPage() {
  const [codigo, setCodigo] = useState("");
  const [loading, setLoading] = useState(false);
  const [professor, setProfessor] = useState<any>(null);
  const [turmas, setTurmas] = useState<any[]>([]);
  const [turmaSelecionada, setTurmaSelecionada] = useState<any>(null);
  const [alunos, setAlunos] = useState<any[]>([]);
  const [presentesIds, setPresentesIds] = useState<Set<string>>(new Set());
  const [busca, setBusca] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function entrar() {
    if (!codigo.trim()) return alert("Digite o código do professor");
    setLoading(true);
    const { data, error } = await supabase
      .from("professores")
      .select("*")
      .eq("codigo_acesso", codigo.trim())
      .maybeSingle();
    if (error || !data) {
      alert("Código inválido");
      setLoading(false);
      return;
    }
    setProfessor(data);
    const { data: turmasData } = await supabase
      .from("turmas")
      .select("*")
      .eq("professor_id", data.id)
      .eq("status", "ativo");
    setTurmas(turmasData || []);
    setLoading(false);
  }

  async function verificarBloqueioFinanceiro(alunoId: string): Promise<boolean> {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const { data: mensalidades } = await supabase
      .from("mensalidades")
      .select("vencimento")
      .eq("aluno_id", alunoId)
      .eq("status", "pendente");

    if (!mensalidades || mensalidades.length === 0) return false;

    for (const m of mensalidades) {
      const vencimento = new Date(m.vencimento);
      vencimento.setHours(0, 0, 0, 0);
      const diffEmDias = Math.floor((hoje.getTime() - vencimento.getTime()) / (1000 * 60 * 60 * 24));
      if (diffEmDias > 5) return true;
    }
    return false;
  }

  async function abrirTurma(turma: any) {
    setTurmaSelecionada(turma);
    setBusca("");
    setAlunos([]);
    setPresentesIds(new Set());

    const hojeStr = new Date().toISOString().slice(0, 10);

    const { data: matriculas, error: errMat } = await supabase
      .from("matriculas")
      .select("aluno_id, alunos(id, nome, cpf, status)")
      .eq("turma_id", turma.id)
      .eq("status", "ativo");

    const listaRegulares = (matriculas || []).map((item: any) => {
      const alunoData = item.alunos;
      return {
        id: item.aluno_id,
        nome: alunoData?.nome || "?",
        cpf: alunoData?.cpf || "",
        status: alunoData?.status || "ativo",
        isExperimental: false
      };
    }).filter(a => a.nome !== "?");

    const { data: experimentais } = await supabase
      .from("aulas_experimentais")
      .select("*")
      .eq("turma_id", turma.id)
      .eq("data_aula", hojeStr)
      .eq("status", "pendente"); // Só mostra se ainda não compareceu

    const listaExperimental = (experimentais || []).map((exp: any) => ({
      id: exp.id,
      nome: exp.nome,
      cpf: exp.telefone || "", 
      status: "experimental",
      isExperimental: true
    }));

    setAlunos([...listaRegulares, ...listaExperimental]);

    const { data: presencasHoje } = await supabase
      .from("presencas")
      .select("aluno_id")
      .eq("turma_id", turma.id)
      .eq("data", hojeStr);
    setPresentesIds(new Set(presencasHoje?.map((p: any) => p.aluno_id) || []));
  }

  async function salvarMultiplasPresencas() {
    if (presentesIds.size === 0 && alunos.length > 0) {
      if (!confirm("Nenhum aluno selecionado. Deseja continuar?")) return;
    }
    setSalvando(true);
    const hoje = new Date().toISOString().slice(0, 10);
    const hora = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    for (const item of presentesIds) {
      const alunoObj = alunos.find(a => a.id === item);
      if (!alunoObj) continue;

      if (alunoObj.isExperimental) {
        // Atualiza o status para "compareceu" (Ele vai pra aba de cobrança no sistema)
        await supabase.from("aulas_experimentais").update({ status: "compareceu" }).eq("id", item);
      } else {
        const bloqueado = await verificarBloqueioFinanceiro(item);
        if (bloqueado) {
          alert(`❌ ALUNO BLOQUEADO!\n\n${alunoObj.nome} está com pendências financeiras.`);
          continue;
        }

        await supabase.from("presencas").upsert({
          aluno_id: item,
          turma_id: turmaSelecionada.id,
          professor_id: professor.id,
          data: hoje,
          hora: hora,
          status: "presente"
        }, { onConflict: "aluno_id, turma_id, data" });
      }
    }
    
    alert("Presenças salvas com sucesso!");
    setSalvando(false);
    await abrirTurma(turmaSelecionada);
  }

  function toggleAluno(alunoId: string) {
    const novos = new Set(presentesIds);
    if (novos.has(alunoId)) {
      novos.delete(alunoId);
    } else {
      novos.add(alunoId);
    }
    setPresentesIds(novos);
  }

  function sair() {
    setProfessor(null);
    setTurmas([]);
    setTurmaSelecionada(null);
    setAlunos([]);
    setPresentesIds(new Set());
    setCodigo("");
  }

  const alunosFiltrados = alunos.filter(a =>
    a.nome.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl font-bold text-red-600 text-center mb-6">CT OKINAWA</h1>
        {!professor ? (
          <>
            <input
              className="w-full p-4 border rounded-xl"
              placeholder="Código do professor"
              value={codigo}
              onChange={e => setCodigo(e.target.value)}
            />
            <button
              onClick={entrar}
              className="w-full mt-3 bg-red-600 text-white p-4 rounded-xl font-bold"
            >
              {loading ? "Entrando..." : "ENTRAR"}
            </button>
          </>
        ) : !turmaSelecionada ? (
          <>
            <p className="text-center mb-4">Professor: <b>{professor.nome}</b></p>
            <div className="space-y-3">
              {turmas.map(t => (
                <button
                  key={t.id}
                  onClick={() => abrirTurma(t)}
                  className="w-full bg-gray-100 p-4 rounded-xl text-left font-bold border"
                >
                  {t.nome}
                </button>
              ))}
            </div>
            <button onClick={sair} className="w-full mt-4 border p-3 rounded-xl">Sair</button>
          </>
        ) : (
          <>
            <button onClick={() => setTurmaSelecionada(null)} className="text-sm text-gray-500 mb-3">← Voltar</button>
            <h2 className="text-2xl font-bold mb-3">{turmaSelecionada.nome}</h2>
            <input
              className="w-full p-3 border rounded-xl mb-4"
              placeholder="Pesquisar aluno..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
            <div className="space-y-2 max-h-125 overflow-y-auto mb-4">
              {alunosFiltrados.map(aluno => {
                const isPresente = presentesIds.has(aluno.id);
                
                let bgClass = "bg-white hover:bg-gray-50 border-gray-200";
                if (isPresente && aluno.isExperimental) bgClass = "bg-purple-100 border-purple-500";
                else if (isPresente) bgClass = "bg-green-100 border-green-500";
                else if (aluno.isExperimental) bgClass = "bg-purple-50 border-purple-200";

                return (
                  <label
                    key={aluno.id}
                    className={`flex items-center p-3 rounded-xl border cursor-pointer transition ${bgClass}`}
                  >
                    <input
                      type="checkbox"
                      checked={isPresente}
                      onChange={() => toggleAluno(aluno.id)}
                      className="mr-3 w-5 h-5"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold">{aluno.nome}</p>
                        {aluno.isExperimental && (
                          <span className="text-[10px] bg-purple-600 text-white px-2 py-0.5 rounded-full font-bold">
                            AULA EXPERIMENTAL
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {aluno.isExperimental ? `WhatsApp: ${aluno.cpf}` : `CPF: ${aluno.cpf || "---"}`}
                      </p>
                    </div>
                  </label>
                );
              })}
              {alunos.length === 0 && <p className="text-gray-500 text-center py-4">Nenhum aluno matriculado ou agendado para esta turma hoje.</p>}
            </div>
            <button
              onClick={salvarMultiplasPresencas}
              disabled={salvando}
              className="w-full bg-red-600 text-white p-3 rounded-xl font-bold disabled:opacity-50"
            >
              {salvando ? "Salvando..." : "Salvar Presenças"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}