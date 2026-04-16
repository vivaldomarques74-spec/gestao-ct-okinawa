"use client";

import { useEffect, useMemo, useState } from "react";

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

type OrigemProduto = "academia" | "parceiro";

type Produto = {
  id: string;
  nome: string;
  categoria: string;
  valor: number;
  origem: OrigemProduto;
  parceiroId: string;
  parceiroNome: string;
  estoque: number;
  estoqueMinimo: number;
  ativo: boolean;
  observacoes: string;
  criadoEm: string;
};

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function obterStatusEstoque(estoque: number, estoqueMinimo: number) {
  if (estoque <= 0) return "Esgotado";
  if (estoque <= estoqueMinimo) return "Acabando";
  return "Normal";
}

export default function ProdutosPage() {
  const [parceiros, setParceiros] = useState<Parceiro[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);

  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("");
  const [valor, setValor] = useState("");
  const [origem, setOrigem] = useState<OrigemProduto>("academia");
  const [parceiroId, setParceiroId] = useState("");
  const [parceiroNome, setParceiroNome] = useState("");
  const [estoque, setEstoque] = useState("");
  const [estoqueMinimo, setEstoqueMinimo] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const [produtoEditandoId, setProdutoEditandoId] = useState("");
  const [quantidadeMov, setQuantidadeMov] = useState("");

  const [mensagemSucesso, setMensagemSucesso] = useState("");
  const [mensagemErro, setMensagemErro] = useState("");

  useEffect(() => {
    carregarParceiros();
    carregarProdutos();
  }, []);

  function carregarParceiros() {
    const parceirosSalvos = JSON.parse(localStorage.getItem("parceiros") || "[]") as Parceiro[];
    const ativos = parceirosSalvos.filter((parceiro) => parceiro.ativo);
    setParceiros(ativos);
  }

  function carregarProdutos() {
    const produtosSalvos = JSON.parse(localStorage.getItem("produtos") || "[]") as Produto[];
    setProdutos(produtosSalvos);
  }

  const produtosAcabando = useMemo(() => {
    return produtos.filter(
      (produto) => produto.ativo && produto.estoque <= produto.estoqueMinimo
    );
  }, [produtos]);

  function limparFormulario() {
    setNome("");
    setCategoria("");
    setValor("");
    setOrigem("academia");
    setParceiroId("");
    setParceiroNome("");
    setEstoque("");
    setEstoqueMinimo("");
    setObservacoes("");
  }

  function selecionarParceiro(id: string) {
    setParceiroId(id);

    const parceiroSelecionado = parceiros.find((parceiro) => parceiro.id === id);

    if (!parceiroSelecionado) {
      setParceiroNome("");
      return;
    }

    setParceiroNome(parceiroSelecionado.nome);
  }

  function salvarProduto() {
    setMensagemErro("");
    setMensagemSucesso("");

    if (!nome.trim()) {
      setMensagemErro("Informe o nome do produto.");
      return;
    }

    if (!valor || Number(valor) <= 0) {
      setMensagemErro("Informe um valor válido.");
      return;
    }

    if (origem === "parceiro" && !parceiroId) {
      setMensagemErro("Selecione um parceiro.");
      return;
    }

    if (Number(estoque || 0) < 0) {
      setMensagemErro("O estoque não pode ser negativo.");
      return;
    }

    if (Number(estoqueMinimo || 0) < 0) {
      setMensagemErro("O estoque mínimo não pode ser negativo.");
      return;
    }

    const produtoJaExiste = produtos.some(
      (produto) =>
        produto.nome.trim().toLowerCase() === nome.trim().toLowerCase() &&
        produto.ativo
    );

    if (produtoJaExiste) {
      setMensagemErro("Já existe um produto ativo com esse nome.");
      return;
    }

    const novoProduto: Produto = {
      id: crypto.randomUUID(),
      nome: nome.trim(),
      categoria: categoria.trim(),
      valor: Number(valor),
      origem,
      parceiroId: origem === "parceiro" ? parceiroId : "",
      parceiroNome: origem === "parceiro" ? parceiroNome : "",
      estoque: Number(estoque || 0),
      estoqueMinimo: Number(estoqueMinimo || 0),
      ativo: true,
      observacoes: observacoes.trim(),
      criadoEm: new Date().toISOString(),
    };

    const atualizados = [...produtos, novoProduto];
    localStorage.setItem("produtos", JSON.stringify(atualizados));
    setProdutos(atualizados);

    setMensagemSucesso("Produto cadastrado com sucesso!");
    limparFormulario();
  }

  function inativarProduto(id: string) {
    const atualizados = produtos.map((produto) =>
      produto.id === id ? { ...produto, ativo: false } : produto
    );

    localStorage.setItem("produtos", JSON.stringify(atualizados));
    setProdutos(atualizados);
    setMensagemSucesso("Produto inativado com sucesso!");
    setMensagemErro("");
  }

  function abrirEdicaoEstoque(produto: Produto) {
    setProdutoEditandoId(produto.id);
    setQuantidadeMov("");
    setMensagemErro("");
    setMensagemSucesso("");
  }

  /* 🔥 ESTOQUE PROFISSIONAL */

  function adicionarEstoque() {
    if (!quantidadeMov || Number(quantidadeMov) <= 0) {
      setMensagemErro("Informe uma quantidade válida.");
      return;
    }

    const atualizados = produtos.map((produto) =>
      produto.id === produtoEditandoId
        ? { ...produto, estoque: produto.estoque + Number(quantidadeMov) }
        : produto
    );

    localStorage.setItem("produtos", JSON.stringify(atualizados));
    setProdutos(atualizados);
    setProdutoEditandoId("");
    setQuantidadeMov("");
    setMensagemSucesso("Estoque adicionado com sucesso!");
  }

  function removerEstoque() {
    if (!quantidadeMov || Number(quantidadeMov) <= 0) {
      setMensagemErro("Informe uma quantidade válida.");
      return;
    }

    const atualizados = produtos.map((produto) => {
      if (produto.id !== produtoEditandoId) return produto;

      const novo = produto.estoque - Number(quantidadeMov);

      return {
        ...produto,
        estoque: novo < 0 ? 0 : novo,
      };
    });

    localStorage.setItem("produtos", JSON.stringify(atualizados));
    setProdutos(atualizados);
    setProdutoEditandoId("");
    setQuantidadeMov("");
    setMensagemSucesso("Estoque removido com sucesso!");
  }

  function cancelarEdicaoEstoque() {
    setProdutoEditandoId("");
    setQuantidadeMov("");
  }
  return (
    <div className="p-6 space-y-6">

      <h1 className="text-2xl font-bold">📦 Produtos</h1>

      {/* MENSAGENS */}
      {mensagemSucesso && (
        <div className="rounded-xl bg-green-100 p-3 text-green-700">
          {mensagemSucesso}
        </div>
      )}

      {mensagemErro && (
        <div className="rounded-xl bg-red-100 p-3 text-red-700">
          {mensagemErro}
        </div>
      )}

      {/* FORMULÁRIO */}
      <div className="bg-white rounded-2xl shadow p-5 space-y-4">

        <h2 className="font-semibold">Novo Produto</h2>

        <input
          placeholder="Nome do produto"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          className="w-full border rounded-xl px-3 py-2"
        />

        <input
          placeholder="Categoria"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="w-full border rounded-xl px-3 py-2"
        />

        <input
          type="number"
          placeholder="Valor"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          className="w-full border rounded-xl px-3 py-2"
        />

        <select
          value={origem}
          onChange={(e) => setOrigem(e.target.value as OrigemProduto)}
          className="w-full border rounded-xl px-3 py-2"
        >
          <option value="academia">Produto do CT</option>
          <option value="parceiro">Produto de parceiro</option>
        </select>

        {origem === "parceiro" && (
          <select
            value={parceiroId}
            onChange={(e) => selecionarParceiro(e.target.value)}
            className="w-full border rounded-xl px-3 py-2"
          >
            <option value="">Selecione o parceiro</option>

            {parceiros.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        )}

        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            placeholder="Estoque inicial"
            value={estoque}
            onChange={(e) => setEstoque(e.target.value)}
            className="w-full border rounded-xl px-3 py-2"
          />

          <input
            type="number"
            placeholder="Estoque mínimo"
            value={estoqueMinimo}
            onChange={(e) => setEstoqueMinimo(e.target.value)}
            className="w-full border rounded-xl px-3 py-2"
          />
        </div>

        <textarea
          placeholder="Observações"
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          className="w-full border rounded-xl px-3 py-2"
        />

        <button
          onClick={salvarProduto}
          className="w-full bg-black text-white py-3 rounded-xl font-semibold"
        >
          Salvar Produto
        </button>
      </div>

      {/* ALERTA ESTOQUE */}
      {produtosAcabando.length > 0 && (
        <div className="bg-yellow-100 p-4 rounded-xl">
          ⚠ {produtosAcabando.length} produto(s) com estoque baixo
        </div>
      )}

      {/* LISTA DE PRODUTOS */}
      <div className="space-y-4">

        {produtos
          .filter((p) => p.ativo)
          .map((produto) => (
            <div
              key={produto.id}
              className="border rounded-2xl p-4 bg-white shadow-sm space-y-2"
            >
              <div className="flex justify-between items-center">
                <h3 className="font-semibold">{produto.nome}</h3>

                <span className="text-sm text-gray-500">
                  {produto.categoria || "Sem categoria"}
                </span>
              </div>

              <p className="text-sm">
                {formatarMoeda(produto.valor)}
              </p>

              <p className="text-sm">
                Estoque: <strong>{produto.estoque}</strong>
              </p>

              <p className="text-xs text-gray-500">
                Status: {obterStatusEstoque(produto.estoque, produto.estoqueMinimo)}
              </p>

              {produto.origem === "parceiro" && (
                <p className="text-xs text-gray-500">
                  Parceiro: {produto.parceiroNome}
                </p>
              )}

              {/* BOTÕES */}
              <div className="flex gap-2 pt-2 flex-wrap">

                <button
                  onClick={() => abrirEdicaoEstoque(produto)}
                  className="text-sm bg-gray-200 px-3 py-1 rounded"
                >
                  Estoque
                </button>

                <button
                  onClick={() => inativarProduto(produto.id)}
                  className="text-sm text-red-600"
                >
                  Inativar
                </button>

              </div>

              {/* MOVIMENTAÇÃO */}
              {produtoEditandoId === produto.id && (
                <div className="mt-3 space-y-2 border-t pt-3">

                  <input
                    type="number"
                    placeholder="Quantidade"
                    value={quantidadeMov}
                    onChange={(e) => setQuantidadeMov(e.target.value)}
                    className="w-full border rounded-xl px-3 py-2"
                  />

                  <div className="flex gap-2 flex-wrap">

                    <button
                      onClick={adicionarEstoque}
                      className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm"
                    >
                      + Entrada
                    </button>

                    <button
                      onClick={removerEstoque}
                      className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm"
                    >
                      - Saída
                    </button>

                    <button
                      onClick={cancelarEdicaoEstoque}
                      className="bg-gray-300 px-4 py-2 rounded-xl text-sm"
                    >
                      Cancelar
                    </button>

                  </div>
                </div>
              )}

            </div>
          ))}

      </div>
    </div>
  );
}