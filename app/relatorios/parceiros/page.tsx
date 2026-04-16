"use client";

import { useEffect, useMemo, useState } from "react";

type ItemVenda = {
  id: string;
  produtoId: string;
  produto: string;
  categoria: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  origem: "academia" | "parceiro";
  parceiroId: string;
  parceiroNome: string;
};

type Venda = {
  idVenda: string;
  cliente: string;
  formaPagamento: string;
  tipoPagamentoCartao?: string;
  parcelas?: number;
  dataVenda: string;
  observacoes: string;
  itens: ItemVenda[];
  valorTotalGeral: number;
  criadoEm: string;
};

type ResumoParceiro = {
  parceiroId: string;
  parceiroNome: string;
  quantidadeItens: number;
  totalVendido: number;
  produtos: {
    nome: string;
    quantidade: number;
    total: number;
  }[];
};

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarMesReferencia(valor: string) {
  if (!valor) return "--";
  const [ano, mes] = valor.split("-");
  return `${mes}/${ano}`;
}

function getMesAtual() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  return `${ano}-${mes}`;
}

export default function RelatorioParceirosPage() {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [mesReferencia, setMesReferencia] = useState(getMesAtual());

  useEffect(() => {
    const vendasSalvas = JSON.parse(localStorage.getItem("vendas") || "[]") as Venda[];
    setVendas(vendasSalvas);
  }, []);

  const vendasFiltradas = useMemo(() => {
    return vendas.filter((venda) => {
      if (!venda.dataVenda) return false;
      return venda.dataVenda.slice(0, 7) === mesReferencia;
    });
  }, [vendas, mesReferencia]);

  const resumoParceiros = useMemo(() => {
    const mapa = new Map<string, ResumoParceiro>();

    vendasFiltradas.forEach((venda) => {
      venda.itens
        .filter((item) => item.origem === "parceiro" && item.parceiroNome)
        .forEach((item) => {
          const chave = item.parceiroId || item.parceiroNome;

          if (!mapa.has(chave)) {
            mapa.set(chave, {
              parceiroId: item.parceiroId || "",
              parceiroNome: item.parceiroNome,
              quantidadeItens: 0,
              totalVendido: 0,
              produtos: [],
            });
          }

          const parceiro = mapa.get(chave)!;
          parceiro.quantidadeItens += item.quantidade;
          parceiro.totalVendido += item.valorTotal;

          const produtoExistente = parceiro.produtos.find(
            (produto) => produto.nome === item.produto
          );

          if (produtoExistente) {
            produtoExistente.quantidade += item.quantidade;
            produtoExistente.total += item.valorTotal;
          } else {
            parceiro.produtos.push({
              nome: item.produto,
              quantidade: item.quantidade,
              total: item.valorTotal,
            });
          }
        });
    });

    return Array.from(mapa.values()).sort((a, b) => b.totalVendido - a.totalVendido);
  }, [vendasFiltradas]);

  const totalParceirosMes = useMemo(() => {
    return resumoParceiros.reduce((total, parceiro) => total + parceiro.totalVendido, 0);
  }, [resumoParceiros]);

  const totalItensParceirosMes = useMemo(() => {
    return resumoParceiros.reduce((total, parceiro) => total + parceiro.quantidadeItens, 0);
  }, [resumoParceiros]);

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
            <a href="/vendas" className="mb-2 block rounded-xl px-4 py-3 text-sm text-slate-200 hover:bg-slate-800">
              Vendas
            </a>
            <a href="/vendas/lista" className="mb-2 block rounded-xl px-4 py-3 text-sm text-slate-200 hover:bg-slate-800">
              Lista de vendas
            </a>
            <a href="/relatorios/parceiros" className="mb-2 block rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white">
              Relatório parceiros
            </a>
            <a href="/financeiro" className="mb-2 block rounded-xl px-4 py-3 text-sm text-slate-200 hover:bg-slate-800">
              Financeiro
            </a>
          </nav>
        </aside>

        <main className="flex-1 p-4 md:p-8">
          <div className="mb-6 rounded-3xl bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-3xl font-bold text-slate-900">Relatório de vendas por parceiro</h2>
                <p className="mt-2 text-slate-600">
                  Acompanhe o total vendido de cada parceiro por mês.
                </p>
              </div>

              <div className="w-full md:w-56">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Mês de referência</span>
                  <input
                    type="month"
                    value={mesReferencia}
                    onChange={(e) => setMesReferencia(e.target.value)}
                    className={inputClass}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <CardResumo titulo="Parceiros com venda no mês" valor={String(resumoParceiros.length)} />
            <CardResumo titulo="Itens vendidos de parceiros" valor={String(totalItensParceirosMes)} />
            <CardResumo titulo="Total vendido parceiros" valor={formatarMoeda(totalParceirosMes)} />
          </div>

          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h3 className="mb-2 text-xl font-bold text-slate-900">
              Resultado de {formatarMesReferencia(mesReferencia)}
            </h3>

            {resumoParceiros.length === 0 ? (
              <p className="mt-4 text-slate-500">Nenhuma venda de parceiro encontrada nesse mês.</p>
            ) : (
              <div className="mt-5 space-y-4">
                {resumoParceiros.map((parceiro) => (
                  <div key={parceiro.parceiroId || parceiro.parceiroNome} className="rounded-2xl border border-slate-200 p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-lg font-bold text-slate-900">{parceiro.parceiroNome}</p>
                        <p className="text-sm text-slate-500">
                          Itens vendidos: {parceiro.quantidadeItens}
                        </p>
                        <p className="mt-2 text-base font-bold text-slate-900">
                          Total vendido: {formatarMoeda(parceiro.totalVendido)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
                      <table className="w-full border-collapse text-sm">
                        <thead className="bg-slate-100">
                          <tr>
                            <th className="px-4 py-3 text-left">Produto</th>
                            <th className="px-4 py-3 text-left">Quantidade</th>
                            <th className="px-4 py-3 text-left">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parceiro.produtos.map((produto) => (
                            <tr key={`${parceiro.parceiroNome}-${produto.nome}`} className="border-t border-slate-200">
                              <td className="px-4 py-3">{produto.nome}</td>
                              <td className="px-4 py-3">{produto.quantidade}</td>
                              <td className="px-4 py-3">{formatarMoeda(produto.total)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
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

function CardResumo({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{titulo}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{valor}</p>
    </div>
  );
}

const inputClass =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100";