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

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function EditarFinanceiroPage() {
  const [carregando, setCarregando] = useState(true);
  const [encontrado, setEncontrado] = useState(true);

  const [idLancamento, setIdLancamento] = useState("");
  const [matriculaAluno, setMatriculaAluno] = useState("");
  const [nomeAluno, setNomeAluno] = useState("");
  const [modalidade, setModalidade] = useState("");
  const [referencia, setReferencia] = useState("");
  const [valorBase, setValorBase] = useState(0);
  const [desconto, setDesconto] = useState(0);
  const [valorFinal, setValorFinal] = useState(0);
  const [formaPagamento, setFormaPagamento] = useState("");
  const [tipoPagamentoCartao, setTipoPagamentoCartao] = useState("");
  const [parcelas, setParcelas] = useState("1");
  const [dataPagamento, setDataPagamento] = useState("");
  const [status, setStatus] = useState<"pago" | "pendente">("pago");
  const [observacoes, setObservacoes] = useState("");
  const [mensagemSucesso, setMensagemSucesso] = useState("");
  const [mensagemErro, setMensagemErro] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    if (!id) {
      setEncontrado(false);
      setCarregando(false);
      return;
    }

    const lista: LancamentoFinanceiro[] = JSON.parse(
      localStorage.getItem("financeiro") || "[]"
    );

    const lancamento = lista.find((item) => item.idLancamento === id);

    if (!lancamento) {
      setEncontrado(false);
      setCarregando(false);
      return;
    }

    setIdLancamento(lancamento.idLancamento);
    setMatriculaAluno(lancamento.matriculaAluno || "");
    setNomeAluno(lancamento.nomeAluno || "");
    setModalidade(lancamento.modalidade || "");
    setReferencia(lancamento.referencia || "");
    setValorBase(Number(lancamento.valorBase || 0));
    setDesconto(Number(lancamento.desconto || 0));
    setValorFinal(Number(lancamento.valorFinal || 0));
    setFormaPagamento(lancamento.formaPagamento || "");
    setTipoPagamentoCartao(lancamento.tipoPagamentoCartao || "");
    setParcelas(String(lancamento.parcelas || 1));
    setDataPagamento(lancamento.dataPagamento || "");
    setStatus(lancamento.status);
    setObservacoes(lancamento.observacoes || "");
    setCarregando(false);
  }, []);

  const previewValor = useMemo(() => valorFinal, [valorFinal]);

  function limparMensagens() {
    setMensagemSucesso("");
    setMensagemErro("");
  }

  function recalcularValorFinal(novoValorBase: number, novoDesconto: number) {
    const valor = novoValorBase - novoDesconto;
    setValorFinal(valor > 0 ? valor : 0);
  }

  function salvarAlteracoes() {
    limparMensagens();

    if (!referencia) {
      setMensagemErro("Informe o mês de referência.");
      return;
    }

    if (valorFinal <= 0) {
      setMensagemErro("O valor final precisa ser maior que zero.");
      return;
    }

    if (status === "pago" && !formaPagamento) {
      setMensagemErro("Informe a forma de pagamento.");
      return;
    }

    if (status === "pago" && !dataPagamento) {
      setMensagemErro("Informe a data do pagamento.");
      return;
    }

    if (status === "pago" && formaPagamento === "Cartão de crédito" && !tipoPagamentoCartao) {
      setMensagemErro("Informe se o cartão foi à vista ou parcelado.");
      return;
    }

    if (
      status === "pago" &&
      formaPagamento === "Cartão de crédito" &&
      tipoPagamentoCartao === "Parcelado" &&
      (!parcelas || Number(parcelas) < 2)
    ) {
      setMensagemErro("Informe uma quantidade de parcelas válida.");
      return;
    }

    const lista: LancamentoFinanceiro[] = JSON.parse(
      localStorage.getItem("financeiro") || "[]"
    );

    const novaLista = lista.map((item) => {
      if (item.idLancamento !== idLancamento) return item;

      return {
        ...item,
        referencia,
        valorBase,
        desconto,
        valorFinal,
        formaPagamento: status === "pago" ? formaPagamento : "",
        tipoPagamentoCartao:
          status === "pago" && formaPagamento === "Cartão de crédito"
            ? tipoPagamentoCartao
            : "",
        parcelas:
          status === "pago" &&
          formaPagamento === "Cartão de crédito" &&
          tipoPagamentoCartao === "Parcelado"
            ? Number(parcelas)
            : 1,
        dataPagamento: status === "pago" ? dataPagamento : "",
        status,
        observacoes,
      };
    });

    localStorage.setItem("financeiro", JSON.stringify(novaLista));
    setMensagemSucesso("Lançamento atualizado com sucesso!");
  }

  if (carregando) {
    return (
      <main className="min-h-screen bg-slate-100 p-8">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Carregando lançamento...</h1>
        </div>
      </main>
    );
  }

  if (!encontrado) {
    return (
      <main className="min-h-screen bg-slate-100 p-8">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Lançamento não encontrado</h1>
          <a
            href="/financeiro/lista"
            className="mt-6 inline-block rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white"
          >
            Voltar para lista
          </a>
        </div>
      </main>
    );
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
            <a href="/financeiro" className="mb-2 block rounded-xl px-4 py-3 text-sm text-slate-200 hover:bg-slate-800">
              Financeiro
            </a>
            <a href="/financeiro/lista" className="mb-2 block rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white">
              Lista financeira
            </a>
          </nav>
        </aside>

        <main className="flex-1 p-4 md:p-8">
          <div className="mb-6 rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-3xl font-bold text-slate-900">Editar lançamento financeiro</h2>
                <p className="mt-2 text-slate-600">
                  Atualize os dados do lançamento selecionado.
                </p>
              </div>

              <a
                href="/financeiro/lista"
                className="rounded-2xl bg-slate-900 px-5 py-3 text-center font-semibold text-white transition hover:bg-slate-800"
              >
                Voltar para lista
              </a>
            </div>
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

          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
            <CardResumo titulo="ID do lançamento" valor={idLancamento} />
            <CardResumo titulo="Aluno" valor={nomeAluno || "--"} />
            <CardResumo titulo="Modalidade" valor={modalidade || "--"} />
            <CardResumo titulo="Valor final" valor={formatarMoeda(previewValor)} />
          </div>

          <form className="space-y-6">
            <section className="rounded-3xl bg-white p-6 shadow-sm">
              <h3 className="mb-5 text-xl font-bold text-slate-900">Dados do lançamento</h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Campo label="ID">
                  <input value={idLancamento} readOnly className={inputClass} />
                </Campo>

                <Campo label="Matrícula">
                  <input value={matriculaAluno} readOnly className={inputClass} />
                </Campo>

                <Campo label="Aluno">
                  <input value={nomeAluno} readOnly className={inputClass} />
                </Campo>

                <Campo label="Modalidade">
                  <input value={modalidade} readOnly className={inputClass} />
                </Campo>

                <Campo label="Mês de referência">
                  <input
                    type="month"
                    value={referencia}
                    onChange={(e) => setReferencia(e.target.value)}
                    className={inputClass}
                  />
                </Campo>

                <Campo label="Valor base">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={valorBase}
                    onChange={(e) => {
                      const novo = Number(e.target.value || 0);
                      setValorBase(novo);
                      recalcularValorFinal(novo, desconto);
                    }}
                    className={inputClass}
                  />
                </Campo>

                <Campo label="Desconto">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={desconto}
                    onChange={(e) => {
                      const novo = Number(e.target.value || 0);
                      setDesconto(novo);
                      recalcularValorFinal(valorBase, novo);
                    }}
                    className={inputClass}
                  />
                </Campo>

                <Campo label="Valor final">
                  <input value={formatarMoeda(valorFinal)} readOnly className={inputClass} />
                </Campo>

                <Campo label="Status">
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as "pago" | "pendente")}
                    className={inputClass}
                  >
                    <option value="pago">Pago</option>
                    <option value="pendente">Pendente</option>
                  </select>
                </Campo>

                <Campo label="Forma de pagamento">
                  <select
                    value={formaPagamento}
                    onChange={(e) => setFormaPagamento(e.target.value)}
                    className={inputClass}
                    disabled={status === "pendente"}
                  >
                    <option value="">Selecione</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Pix">Pix</option>
                    <option value="Cartão de débito">Cartão de débito</option>
                    <option value="Cartão de crédito">Cartão de crédito</option>
                    <option value="Transferência">Transferência</option>
                  </select>
                </Campo>

                <Campo label="Data do pagamento">
                  <input
                    type="date"
                    value={dataPagamento}
                    onChange={(e) => setDataPagamento(e.target.value)}
                    className={inputClass}
                    disabled={status === "pendente"}
                  />
                </Campo>

                {status === "pago" && formaPagamento === "Cartão de crédito" && (
                  <>
                    <Campo label="No cartão foi">
                      <select
                        value={tipoPagamentoCartao}
                        onChange={(e) => setTipoPagamentoCartao(e.target.value)}
                        className={inputClass}
                      >
                        <option value="">Selecione</option>
                        <option value="À vista">À vista</option>
                        <option value="Parcelado">Parcelado</option>
                      </select>
                    </Campo>

                    <Campo label="Parcelas">
                      <input
                        type="number"
                        min={tipoPagamentoCartao === "Parcelado" ? 2 : 1}
                        value={parcelas}
                        onChange={(e) => setParcelas(e.target.value)}
                        className={inputClass}
                        disabled={tipoPagamentoCartao !== "Parcelado"}
                      />
                    </Campo>
                  </>
                )}
              </div>

              <div className="mt-4">
                <Campo label="Observações">
                  <textarea
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    className={textareaClass}
                  />
                </Campo>
              </div>
            </section>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={salvarAlteracoes}
                className="rounded-2xl bg-slate-900 px-6 py-4 font-semibold text-white transition hover:bg-slate-800"
              >
                Salvar alterações
              </button>

              <a
                href="/financeiro/lista"
                className="rounded-2xl border border-slate-300 bg-white px-6 py-4 text-center font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancelar
              </a>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}

function CardResumo({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{titulo}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{valor}</p>
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
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:bg-slate-100";

const textareaClass =
  "min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100";