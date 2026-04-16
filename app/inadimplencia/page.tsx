"use client";

import { useEffect, useMemo, useState } from "react";

type LancamentoFinanceiro = {
  idLancamento: string;
  matriculaAluno: string;
  nomeAluno: string;
  modalidade: string;
  referencia: string;
  valorBase: number;
  desconto: number;
  valorFinal: number;
  formaPagamento: string;
  tipoPagamentoCartao?: string;
  parcelas?: number;
  dataPagamento: string;
  status: "pago" | "pendente";
  observacoes?: string;
  criadoEm: string;
};

function getMesAtual() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  return `${ano}-${mes}`;
}

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarReferencia(referencia: string) {
  if (!referencia) return "--";
  const [ano, mes] = referencia.split("-");
  return `${mes}/${ano}`;
}

export default function InadimplenciaPage() {
  const [lancamentos, setLancamentos] = useState<LancamentoFinanceiro[]>([]);
  const [mesSelecionado, setMesSelecionado] = useState(getMesAtual());
  const [busca, setBusca] = useState("");

  useEffect(() => {
    const dados = JSON.parse(localStorage.getItem("financeiro") || "[]");
    setLancamentos(dados);
  }, []);

  const pendentesDoMes = useMemo(() => {
    return lancamentos.filter(
      (item) => item.status === "pendente" && item.referencia === mesSelecionado
    );
  }, [lancamentos, mesSelecionado]);

  const pendentesFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return pendentesDoMes.filter((item) => {
      if (!termo) return true;

      return (
        item.nomeAluno?.toLowerCase().includes(termo) ||
        item.matriculaAluno?.toLowerCase().includes(termo) ||
        item.modalidade?.toLowerCase().includes(termo) ||
        item.idLancamento?.toLowerCase().includes(termo)
      );
    });
  }, [pendentesDoMes, busca]);

  const totalPendenteMes = useMemo(() => {
    return pendentesDoMes.reduce(
      (acc, item) => acc + Number(item.valorFinal || 0),
      0
    );
  }, [pendentesDoMes]);

  const totalPendenteFiltrado = useMemo(() => {
    return pendentesFiltrados.reduce(
      (acc, item) => acc + Number(item.valorFinal || 0),
      0
    );
  }, [pendentesFiltrados]);

  const quantidadePendentes = pendentesDoMes.length;
  const quantidadeFiltrada = pendentesFiltrados.length;

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 bg-slate-900 text-white lg:block">
          <div className="border-b border-slate-800 p-6">
            <h1 className="text-2xl font-bold">CT Okinawa</h1>
            <p className="mt-2 text-sm text-slate-300">Sistema de Gestão</p>
          </div>

          <nav className="p-4">
            <a
              href="/"
              className="mb-2 block rounded-xl px-4 py-3 text-sm text-slate-200 hover:bg-slate-800"
            >
              Dashboard
            </a>
            <a
              href="/modalidades"
              className="mb-2 block rounded-xl px-4 py-3 text-sm text-slate-200 hover:bg-slate-800"
            >
              Modalidades
            </a>
            <a
              href="/alunos"
              className="mb-2 block rounded-xl px-4 py-3 text-sm text-slate-200 hover:bg-slate-800"
            >
              Alunos
            </a>
            <a
              href="/vendas"
              className="mb-2 block rounded-xl px-4 py-3 text-sm text-slate-200 hover:bg-slate-800"
            >
              Vendas
            </a>
            <a
              href="/financeiro"
              className="mb-2 block rounded-xl px-4 py-3 text-sm text-slate-200 hover:bg-slate-800"
            >
              Financeiro
            </a>
            <a
              href="/financeiro/lista"
              className="mb-2 block rounded-xl px-4 py-3 text-sm text-slate-200 hover:bg-slate-800"
            >
              Lista financeira
            </a>
            <a
              href="/inadimplencia"
              className="mb-2 block rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white"
            >
              Inadimplência
            </a>
            <a
              href="/relatorios"
              className="block rounded-xl px-4 py-3 text-sm text-slate-200 hover:bg-slate-800"
            >
              Relatórios
            </a>
          </nav>
        </aside>

        <main className="flex-1 p-4 md:p-8">
          <div className="mb-6 rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-3xl font-bold text-slate-900">
                  Inadimplência por mês
                </h2>
                <p className="mt-2 text-slate-600">
                  Veja quem está com mensalidade pendente no período selecionado.
                </p>
              </div>

              <div className="w-full max-w-xs">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">
                    Selecionar mês
                  </span>
                  <input
                    type="month"
                    value={mesSelecionado}
                    onChange={(e) => setMesSelecionado(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  Buscar por aluno, matrícula, modalidade ou ID
                </span>
                <input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Ex: João, OK0001, Karatê..."
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
              </label>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-sm flex items-end">
              <a
                href="/financeiro"
                className="w-full rounded-2xl bg-slate-900 px-5 py-3 text-center font-semibold text-white transition hover:bg-slate-800"
              >
                Lançar mensalidade
              </a>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
            <CardResumo
              titulo="Pendentes no mês"
              valor={String(quantidadePendentes)}
            />
            <CardResumo
              titulo="Total pendente no mês"
              valor={formatarMoeda(totalPendenteMes)}
            />
            <CardResumo
              titulo="Pendentes encontrados"
              valor={String(quantidadeFiltrada)}
            />
            <CardResumo
              titulo="Total filtrado"
              valor={formatarMoeda(totalPendenteFiltrado)}
            />
          </div>

          {pendentesDoMes.length === 0 ? (
            <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
              <h3 className="text-2xl font-bold text-slate-900">
                Nenhuma inadimplência no mês
              </h3>
              <p className="mt-3 text-slate-600">
                Não há mensalidades pendentes para o período selecionado.
              </p>
            </div>
          ) : pendentesFiltrados.length === 0 ? (
            <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
              <h3 className="text-2xl font-bold text-slate-900">
                Nenhum aluno encontrado
              </h3>
              <p className="mt-3 text-slate-600">
                Tente mudar a busca para localizar os pendentes.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              {pendentesFiltrados.map((item) => (
                <div
                  key={item.idLancamento}
                  className="rounded-3xl bg-white p-6 shadow-sm"
                >
                  <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm text-slate-500">ID do lançamento</p>
                      <h3 className="text-2xl font-bold text-slate-900">
                        {item.idLancamento}
                      </h3>
                    </div>

                    <span className="rounded-full bg-amber-100 px-4 py-2 text-sm font-medium text-amber-700">
                      Pendente
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Info label="Aluno" value={item.nomeAluno || "--"} />
                    <Info label="Matrícula" value={item.matriculaAluno || "--"} />
                    <Info label="Modalidade" value={item.modalidade || "--"} />
                    <Info label="Referência" value={formatarReferencia(item.referencia)} />
                    <Info label="Valor base" value={formatarMoeda(Number(item.valorBase || 0))} />
                    <Info label="Desconto" value={formatarMoeda(Number(item.desconto || 0))} />
                    <Info label="Valor final" value={formatarMoeda(Number(item.valorFinal || 0))} />
                  </div>

                  {item.observacoes && (
                    <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                      <p className="mb-2 text-sm font-semibold text-slate-700">
                        Observações
                      </p>
                      <p className="text-sm text-slate-600">{item.observacoes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function CardResumo({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string;
}) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{titulo}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{valor}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}