"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import AdminGuard from "../../components/AdminGuard";
import { Package, Plus, Search } from "lucide-react";

export default function EstoquePage() {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState<any>(null);
  const [quantidade, setQuantidade] = useState(1);
  const [observacao, setObservacao] = useState("");
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    carregarProdutos();
  }, []);

  async function carregarProdutos() {
    setLoading(true);
    const { data } = await supabase.from("produtos").select("*").order("nome");
    setProdutos(data || []);
    setLoading(false);
  }

  const produtosFiltrados = produtos.filter(p =>
    p.nome.toLowerCase().includes(busca.toLowerCase())
  );

  async function adicionarEstoque() {
    if (!produtoSelecionado) return alert("Selecione um produto");
    if (quantidade <= 0) return alert("Quantidade deve ser maior que zero");

    setSalvando(true);
    const novaQuantidade = (produtoSelecionado.estoque || 0) + quantidade;

    // 1. Atualizar estoque do produto
    const { error: errProd } = await supabase
      .from("produtos")
      .update({ estoque: novaQuantidade })
      .eq("id", produtoSelecionado.id);

    if (errProd) {
      alert("Erro ao atualizar: " + errProd.message);
      setSalvando(false);
      return;
    }

    // 2. Registrar movimentação
    const { error: errMov } = await supabase.from("estoque_movimentacoes").insert([{
      produto_id: produtoSelecionado.id,
      produto: produtoSelecionado.nome,
      tipo: "entrada",
      quantidade: quantidade,
      custo: produtoSelecionado.custo || 0,
      observacao: observacao || "Entrada manual",
      created_at: new Date().toISOString()
    }]);

    if (errMov) console.error("Erro ao registrar movimentação:", errMov);

    alert(`✅ Adicionado ${quantidade} unidade(s) de ${produtoSelecionado.nome}`);
    setProdutoSelecionado(null);
    setQuantidade(1);
    setObservacao("");
    carregarProdutos();
    setSalvando(false);
  }

  return (
    <AdminGuard>
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Package className="text-red-600" /> Entrada de Estoque
        </h1>

        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="font-semibold text-lg mb-4">Adicionar Estoque</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Buscar Produto</label>
            <div className="relative">
              <Search size={18} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                className="w-full p-2 pl-10 border rounded"
                placeholder="Digite o nome do produto..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
              />
            </div>
            {busca && produtosFiltrados.length > 0 && (
              <div className="absolute z-10 mt-1 w-full max-w-sm bg-white border rounded shadow-lg max-h-60 overflow-y-auto">
                {produtosFiltrados.map(p => (
                  <div
                    key={p.id}
                    className="p-2 hover:bg-gray-100 cursor-pointer border-b"
                    onClick={() => {
                      setProdutoSelecionado(p);
                      setBusca(p.nome);
                    }}
                  >
                    <p className="font-semibold">{p.nome}</p>
                    <p className="text-xs text-gray-500">Estoque atual: {p.estoque || 0} un | R$ {p.preco}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {produtoSelecionado && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Produto Selecionado</label>
                <div className="bg-gray-100 p-3 rounded">
                  <p className="font-semibold">{produtoSelecionado.nome}</p>
                  <p className="text-sm text-gray-600">Estoque atual: {produtoSelecionado.estoque || 0} unidades</p>
                  <p className="text-sm text-gray-600">Preço: R$ {produtoSelecionado.preco}</p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Quantidade a adicionar</label>
                <input
                  type="number"
                  className="w-full p-2 border rounded"
                  value={quantidade}
                  onChange={e => setQuantidade(parseInt(e.target.value) || 0)}
                  min="1"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Observação (opcional)</label>
                <textarea
                  className="w-full p-2 border rounded"
                  rows={2}
                  placeholder="Ex: Compra de fornecedor, devolução, etc."
                  value={observacao}
                  onChange={e => setObservacao(e.target.value)}
                />
              </div>

              <button
                onClick={adicionarEstoque}
                disabled={salvando}
                className="w-full bg-red-600 text-white p-2 rounded flex items-center justify-center gap-2 hover:bg-red-700"
              >
                <Plus size={18} /> {salvando ? "Processando..." : "Adicionar Estoque"}
              </button>
            </>
          )}
        </div>

        {/* Lista de produtos com estoque baixo */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <h2 className="font-semibold text-lg p-4 border-b">Produtos com Estoque Baixo</h2>
          <div className="overflow-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left">Produto</th>
                  <th className="p-3 text-left">Estoque</th>
                  <th className="p-3 text-left">Mínimo</th>
                  <th className="p-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {produtos.filter(p => (p.estoque || 0) <= (p.estoque_minimo || 0)).map(p => (
                  <tr key={p.id} className="border-t">
                    <td className="p-3">{p.nome}</td>
                    <td className="p-3">{p.estoque || 0} un</td>
                    <td className="p-3">{p.estoque_minimo || 0} un</td>
                    <td className="p-3"><span className="text-red-600 font-semibold">⚠️ Estoque baixo</span></td>
                  </tr>
                ))}
                {produtos.filter(p => (p.estoque || 0) <= (p.estoque_minimo || 0)).length === 0 && (
                  <tr><td colSpan={4} className="p-4 text-center text-gray-500">Todos os produtos com estoque adequado</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}