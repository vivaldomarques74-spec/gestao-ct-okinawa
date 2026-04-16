"use client";

import { useEffect, useMemo, useState } from "react";

type Venda = {
  idVenda: string;
  produto: string;
  categoria: string;
  valorUnitario: number;
  quantidade: number;
  total: number;
  formaPagamento: string;
  dataVenda: string;
  ehKimonoShotokan: boolean;
  observacoes?: string;
};

export default function ListaVendasPage() {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [busca, setBusca] = useState("");
  const [vendaExcluir, setVendaExcluir] = useState<Venda | null>(null);

  useEffect(() => {
    carregar();
  }, []);

  function carregar() {
    const dados = JSON.parse(localStorage.getItem("vendas") || "[]");
    setVendas(dados);
  }

  function excluirConfirmado() {
    if (!vendaExcluir) return;

    const nova = vendas.filter((v) => v.idVenda !== vendaExcluir.idVenda);
    localStorage.setItem("vendas", JSON.stringify(nova));
    setVendas(nova);
    setVendaExcluir(null);
  }

  const filtradas = useMemo(() => {
    const termo = busca.toLowerCase();
    if (!termo) return vendas;

    return vendas.filter(
      (v) =>
        v.produto.toLowerCase().includes(termo) ||
        v.idVenda.toLowerCase().includes(termo)
    );
  }, [vendas, busca]);

  const totalGeral = filtradas.reduce((acc, v) => acc + v.total, 0);

  const totalShotokan = filtradas
    .filter((v) => v.ehKimonoShotokan)
    .reduce((acc, v) => acc + v.total, 0);

  return (
    <div className="min-h-screen bg-slate-100">
      <main className="p-4 md:p-8">
        <div className="mb-6 rounded-3xl bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-bold">Lista de Vendas</h1>
          <p className="text-slate-600">Controle completo das vendas</p>
        </div>

        {/* Busca */}
        <div className="mb-6 bg-white p-5 rounded-3xl shadow-sm">
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar produto ou ID"
            className="w-full rounded-2xl border px-4 py-3"
          />
        </div>

        {/* Totais */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <Card titulo="Total geral" valor={`R$ ${totalGeral.toFixed(2)}`} />
          <Card titulo="Total Shotokan" valor={`R$ ${totalShotokan.toFixed(2)}`} />
          <Card titulo="Qtd vendas" valor={filtradas.length} />
        </div>

        {/* Lista */}
        {filtradas.map((v) => (
          <div key={v.idVenda} className="bg-white p-6 rounded-3xl shadow-sm mb-4">
            <div className="flex justify-between mb-4">
              <div>
                <p className="text-sm text-gray-500">ID</p>
                <h3 className="text-xl font-bold">{v.idVenda}</h3>
              </div>

              {v.ehKimonoShotokan && (
                <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-sm">
                  Shotokan
                </span>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Info label="Produto" value={v.produto} />
              <Info label="Categoria" value={v.categoria} />
              <Info label="Valor" value={`R$ ${v.valorUnitario}`} />
              <Info label="Qtd" value={v.quantidade} />
              <Info label="Total" value={`R$ ${v.total}`} />
              <Info label="Pagamento" value={v.formaPagamento} />
              <Info label="Data" value={v.dataVenda} />
            </div>

            {v.observacoes && (
              <div className="mt-4 text-sm text-gray-600">
                <strong>Obs:</strong> {v.observacoes}
              </div>
            )}

            <button
              onClick={() => setVendaExcluir(v)}
              className="mt-4 text-red-600"
            >
              Excluir
            </button>
          </div>
        ))}

        {/* Modal */}
        {vendaExcluir && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-3xl">
              <h2 className="text-xl font-bold">Confirmar exclusão</h2>
              <p className="mt-2">{vendaExcluir.produto}</p>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={excluirConfirmado}
                  className="bg-red-600 text-white px-4 py-2 rounded"
                >
                  Excluir
                </button>

                <button
                  onClick={() => setVendaExcluir(null)}
                  className="border px-4 py-2 rounded"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function Card({ titulo, valor }: any) {
  return (
    <div className="bg-white p-5 rounded-3xl shadow-sm">
      <p className="text-sm text-gray-500">{titulo}</p>
      <p className="text-2xl font-bold mt-2">{valor}</p>
    </div>
  );
}

function Info({ label, value }: any) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}