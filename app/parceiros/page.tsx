"use client";

import { useEffect, useState } from "react";

type Parceiro = {
  id: string;
  nome: string;
  responsavel: string;
  telefone: string;
  email: string;
  observacoes: string;
  ativo: boolean;
  criadoEm: string;
};

export default function ParceirosPage() {
  const [nome, setNome] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [parceiros, setParceiros] = useState<Parceiro[]>([]);
  const [mensagemSucesso, setMensagemSucesso] = useState("");
  const [mensagemErro, setMensagemErro] = useState("");

  useEffect(() => {
    carregarParceiros();
  }, []);

  function carregarParceiros() {
    const salvos = JSON.parse(localStorage.getItem("parceiros") || "[]");
    setParceiros(salvos);
  }

  function limparFormulario() {
    setNome("");
    setResponsavel("");
    setTelefone("");
    setEmail("");
    setObservacoes("");
  }

  function salvarParceiro() {
    setMensagemErro("");
    setMensagemSucesso("");

    if (!nome.trim()) {
      setMensagemErro("Informe o nome do parceiro.");
      return;
    }

    const nomeJaExiste = parceiros.some(
      (parceiro) => parceiro.nome.trim().toLowerCase() === nome.trim().toLowerCase()
    );

    if (nomeJaExiste) {
      setMensagemErro("Já existe um parceiro com esse nome.");
      return;
    }

    const novoParceiro: Parceiro = {
      id: crypto.randomUUID(),
      nome: nome.trim(),
      responsavel: responsavel.trim(),
      telefone: telefone.trim(),
      email: email.trim(),
      observacoes: observacoes.trim(),
      ativo: true,
      criadoEm: new Date().toISOString(),
    };

    const atualizados = [...parceiros, novoParceiro];
    localStorage.setItem("parceiros", JSON.stringify(atualizados));
    setParceiros(atualizados);

    setMensagemSucesso("Parceiro cadastrado com sucesso!");
    limparFormulario();
  }

  function inativarParceiro(id: string) {
    const atualizados = parceiros.map((parceiro) =>
      parceiro.id === id ? { ...parceiro, ativo: false } : parceiro
    );

    localStorage.setItem("parceiros", JSON.stringify(atualizados));
    setParceiros(atualizados);
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 bg-slate-900 text-white lg:block">
          <div className="border-b border-slate-800 p-6">
            <h1 className="text-2xl font-bold">CT Okinawa</h1>
            <p className="mt-2 text-sm text-slate-300">Sistema de Gestão</p>
          </div>

          <nav className="p-4">
            <a href="/" className="mb-2 block rounded-xl px-4 py-3 text-sm text-slate-200 hover:bg-slate-800">
              Dashboard
            </a>
            <a href="/alunos" className="mb-2 block rounded-xl px-4 py-3 text-sm text-slate-200 hover:bg-slate-800">
              Alunos
            </a>
            <a href="/parceiros" className="mb-2 block rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white">
              Parceiros
            </a>
            <a href="/produtos" className="mb-2 block rounded-xl px-4 py-3 text-sm text-slate-200 hover:bg-slate-800">
              Produtos
            </a>
            <a href="/vendas" className="mb-2 block rounded-xl px-4 py-3 text-sm text-slate-200 hover:bg-slate-800">
              Vendas
            </a>
            <a href="/financeiro" className="mb-2 block rounded-xl px-4 py-3 text-sm text-slate-200 hover:bg-slate-800">
              Financeiro
            </a>
          </nav>
        </aside>

        <main className="flex-1 p-4 md:p-8">
          <div className="mb-6 rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-3xl font-bold text-slate-900">Parceiros</h2>
            <p className="mt-2 text-slate-600">
              Cadastre os parceiros vinculados aos produtos vendidos.
            </p>
          </div>

          {mensagemSucesso && (
            <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-800 shadow-sm">
              {mensagemSucesso}
            </div>
          )}

          {mensagemErro && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-red-700 shadow-sm">
              {mensagemErro}
            </div>
          )}

          <section className="mb-6 rounded-3xl bg-white p-6 shadow-sm">
            <h3 className="mb-5 text-xl font-bold text-slate-900">Novo parceiro</h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Campo label="Nome do parceiro *">
                <input value={nome} onChange={(e) => setNome(e.target.value)} className={inputClass} />
              </Campo>

              <Campo label="Responsável">
                <input value={responsavel} onChange={(e) => setResponsavel(e.target.value)} className={inputClass} />
              </Campo>

              <Campo label="Telefone">
                <input value={telefone} onChange={(e) => setTelefone(e.target.value)} className={inputClass} />
              </Campo>

              <Campo label="Email">
                <input value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
              </Campo>

              <div className="md:col-span-2">
                <Campo label="Observações">
                  <textarea
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    className={`${inputClass} min-h-[120px]`}
                  />
                </Campo>
              </div>
            </div>

            <div className="mt-5">
              <button
                type="button"
                onClick={salvarParceiro}
                className="rounded-2xl bg-slate-900 px-6 py-4 font-semibold text-white hover:bg-slate-800"
              >
                Salvar parceiro
              </button>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h3 className="mb-5 text-xl font-bold text-slate-900">Parceiros cadastrados</h3>

            {parceiros.length === 0 ? (
              <p className="text-slate-500">Nenhum parceiro cadastrado ainda.</p>
            ) : (
              <div className="space-y-3">
                {parceiros.map((parceiro) => (
                  <div
                    key={parceiro.id}
                    className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="font-bold text-slate-900">
                        {parceiro.nome} {!parceiro.ativo && "(Inativo)"}
                      </p>
                      <p className="text-sm text-slate-500">
                        Responsável: {parceiro.responsavel || "-"}
                      </p>
                      <p className="text-sm text-slate-500">
                        Telefone: {parceiro.telefone || "-"}
                      </p>
                      <p className="text-sm text-slate-500">
                        Email: {parceiro.email || "-"}
                      </p>
                    </div>

                    {parceiro.ativo && (
                      <button
                        type="button"
                        onClick={() => inativarParceiro(parceiro.id)}
                        className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
                      >
                        Inativar
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

function Campo({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100";