"use client";

import { useEffect, useMemo, useState } from "react";

type Produto = {
  id: string;
  nome: string;
  categoria: string;
  valor: number;
  origem: "academia" | "parceiro";
  parceiroId: string;
  parceiroNome: string;
  estoque: number;
  estoqueMinimo: number;
  ativo: boolean;
  observacoes: string;
  criadoEm: string;
};

type EntradaEstoque = {
  id: string;
  produtoId: string;
  produtoNome: string;
  quantidade: number;
  estoqueAntes: number;
  estoqueDepois: number;
  dataEntrada: string;
  observacoes: string;
  criadoEm: string;
};

function formatarDataParaInput(data: Date) {
  return data.toISOString().split("T")[0];
}

export default function EntradaEstoquePage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [entradas, setEntradas] = useState<EntradaEstoque[]>([]);

  const [produtoId, setProdutoId] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [dataEntrada, setDataEntrada] = useState(formatarDataParaInput(new Date()));
  const [observacoes, setObservacoes] = useState("");

  const [mensagemSucesso, setMensagemSucesso] = useState("");
  const [mensagemErro, setMensagemErro] = useState("");

  useEffect(() => {
    carregarProdutos();
    carregarEntradas();
  }, []);

  function carregarProdutos() {
    const produtosSalvos = JSON.parse(localStorage.getItem("produtos") || "[]") as Produto[];
    const ativos = produtosSalvos.filter((produto) => produto.ativo);
    setProdutos(ativos);
  }

  function carregarEntradas() {
    const entradasSalvas = JSON.parse(localStorage.getItem("entradas_estoque") || "[]") as EntradaEstoque[];
    const ordenadas = [...entradasSalvas].sort(
      (a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()
    );
    setEntradas(ordenadas);
  }

  const produtoSelecionado = useMemo(() => {
    return produtos.find((produto) => produto.id === produtoId) || null;
  }, [produtos, produtoId]);

  function limparFormulario() {
    setProdutoId("");
    setQuantidade("");
    setDataEntrada(formatarDataParaInput(new Date()));
    setObservacoes("");
  }

  function registrarEntrada() {
    setMensagemErro("");
    setMensagemSucesso("");

    if (!produtoId) {
      setMensagemErro("Selecione um produto.");
      return;
    }

    if (!quantidade || Number(quantidade) <= 0) {
      setMensagemErro("Informe uma quantidade válida.");
      return;
    }

    const produtosSalvos = JSON.parse(localStorage.getItem("produtos") || "[]") as Produto[];
    const produto = produtosSalvos.find((item) => item.id === produtoId);

    if (!produto) {
      setMensagemErro("Produto não encontrado.");
      return;
    }

    const estoqueAntes = Number(produto.estoque || 0);
    const quantidadeEntrada = Number(quantidade);
    const estoqueDepois = estoqueAntes + quantidadeEntrada;

    const produtosAtualizados = produtosSalvos.map((item) =>
      item.id === produtoId
        ? {
            ...item,
            estoque: estoqueDepois,
          }
        : item
    );

    localStorage.setItem("produtos", JSON.stringify(produtosAtualizados));

    const novaEntrada: EntradaEstoque = {
      id: crypto.randomUUID(),
      produtoId: produto.id,
      produtoNome: produto.nome,
      quantidade: quantidadeEntrada,
      estoqueAntes,
      estoqueDepois,
      dataEntrada,
      observacoes: observacoes.trim(),
      criadoEm: new Date().toISOString(),
    };

    const entradasSalvas = JSON.parse(localStorage.getItem("entradas_estoque") || "[]") as EntradaEstoque[];
    const entradasAtualizadas = [novaEntrada, ...entradasSalvas];
    localStorage.setItem("entradas_estoque", JSON.stringify(entradasAtualizadas));

    carregarProdutos();
    carregarEntradas();
    limparFormulario();
    setMensagemSucesso("Entrada de estoque registrada com sucesso!");
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
            <a
              href="/"
              className="mb-2 block rounded-xl px-4 py-3 text-sm text-slate-200 hover:bg-slate-800"
            >
              Dashboard
            </a>

            <a
              href="/alunos"
              className="mb-2 block rounded-xl px-4 py-3 text-sm text-slate-200 hover:bg-slate-800"
            >
              Alunos
            </a>

            <a
              href="/parceiros"
              className="mb-2 block rounded-xl px-4 py-3 text-sm text-slate-200 hover:bg-slate-800"
            >
              Parceiros
            </a>

            <a
              href="/produtos"
              className="mb-2 block rounded-xl px-4 py-3 text-sm text-slate-200 hover:bg-slate-800"
            >
              Produtos
            </a>

            <a
              href="/estoque/entrada"
              className="mb-2 block rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white"
            >
              Entrada de estoque
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
          </nav>
        </aside>

        <main className="flex-1 p-4 md:p-8">
          <div className="mb-6 rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-3xl font-bold text-slate-900">Entrada de estoque</h2>
            <p className="mt-2 text-slate-600">
              Registre a chegada de novos itens e atualize o estoque automaticamente.
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
            <h3 className="mb-5 text-xl font-bold text-slate-900">Nova entrada</h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Campo label="Produto *">
                <select
                  value={produtoId}
                  onChange={(e) => setProdutoId(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Selecione um produto</option>
                  {produtos.map((produto) => (
                    <option key={produto.id} value={produto.id}>
                      {produto.nome}
                    </option>
                  ))}
                </select>
              </Campo>

              <Campo label="Quantidade recebida *">
                <input
                  type="number"
                  min="1"
                  value={quantidade}
                  onChange={(e) => setQuantidade(e.target.value)}
                  className={inputClass}
                />
              </Campo>

              <Campo label="Data da entrada">
                <input
                  type="date"
                  value={dataEntrada}
                  onChange={(e) => setDataEntrada(e.target.value)}
                  className={inputClass}
                />
              </Campo>

              <Campo label="Estoque atual">
                <input
                  value={produtoSelecionado ? String(produtoSelecionado.estoque) : ""}
                  readOnly
                  className={`${inputClass} bg-slate-50`}
                />
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
                onClick={registrarEntrada}
                className="rounded-2xl bg-slate-900 px-6 py-4 font-semibold text-white hover:bg-slate-800"
              >
                Registrar entrada
              </button>
            </div>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h3 className="mb-5 text-xl font-bold text-slate-900">Histórico de entradas</h3>

            {entradas.length === 0 ? (
              <p className="text-slate-500">Nenhuma entrada registrada ainda.</p>
            ) : (
              <div className="space-y-3">
                {entradas.map((entrada) => (
                  <div
                    key={entrada.id}
                    className="rounded-2xl border border-slate-200 p-4"
                  >
                    <p className="font-bold text-slate-900">{entrada.produtoNome}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      Quantidade recebida: {entrada.quantidade}
                    </p>
                    <p className="text-sm text-slate-500">
                      Estoque antes: {entrada.estoqueAntes}
                    </p>
                    <p className="text-sm text-slate-500">
                      Estoque depois: {entrada.estoqueDepois}
                    </p>
                    <p className="text-sm text-slate-500">
                      Data da entrada: {entrada.dataEntrada || "-"}
                    </p>
                    <p className="text-sm text-slate-500">
                      Observações: {entrada.observacoes || "-"}
                    </p>
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