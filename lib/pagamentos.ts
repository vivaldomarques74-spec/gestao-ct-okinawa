// src/lib/pagamentos.ts

// Tabela de taxas da Ton (Visa/Master) para Crédito Parcelado
export const TON_RATES = {
  credito2: 10.86,
  credito3: 12.24,
  credito4: 13.59,
  credito5: 14.92,
  credito6: 16.22,
  credito7: 17.50,
  credito8: 18.76,
  credito9: 19.99,
  credito10: 21.19,
  credito11: 21.39,
  credito12: 21.99,
  credito13: 23.03,
  credito14: 24.15,
  credito15: 24.45,
  credito16: 25.95,
  credito17: 26.58,
  credito18: 27.58,
  credito19: 28.08,
  credito20: 28.58,
  credito21: 29.08,
};

export function calcularPagamento(
  valorBase: number,
  formaPagamento: string,
  tipoCartao: string,
  parcelas: string,
  descontoPixDinheiro: number = 10
) {
  let valorFinal = valorBase;
  let taxaAplicada = 0;

  // REGRA: Pix e Dinheiro dão R$ 10 de desconto
  if (formaPagamento === "Pix" || formaPagamento === "Dinheiro") {
    valorFinal = Math.max(0, valorBase - descontoPixDinheiro);
  } 
  // REGRA: Cartão de Crédito Parcelado (2x a 21x) aplica juros da Ton
  else if (formaPagamento === "Cartão" && tipoCartao === "Crédito") {
    const numParcelas = parseInt(parcelas.replace("x", "")) || 1;
    if (numParcelas >= 2 && numParcelas <= 21) {
      const chave = `credito${numParcelas}`;
      taxaAplicada = TON_RATES[chave as keyof typeof TON_RATES] || 0;
      valorFinal = valorBase * (1 + taxaAplicada / 100);
    }
  }
  // Débito e Crédito à vista não têm juros adicionais para o aluno

  const numParcelasFinal = formaPagamento === "Cartão" && tipoCartao === "Crédito" 
    ? (parseInt(parcelas.replace("x", "")) || 1) 
    : 1;

  const valorParcela = valorFinal / numParcelasFinal;

  return {
    valorFinal: Number(valorFinal.toFixed(2)),
    taxaAplicada,
    valorParcela: Number(valorParcela.toFixed(2)),
    numParcelas: numParcelasFinal
  };
}