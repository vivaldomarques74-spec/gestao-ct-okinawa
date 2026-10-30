import { supabase } from "./supabase";

export async function calcularDescontosMensalidade(alunoId: string, valorBase: number): Promise<{ valorFinal: number; isento: boolean }> {
  let valorAtual = valorBase;

  // 1. Desconto de Diretoria (Recorrente ou Temporário)
  const { data: descDiretoria } = await supabase
    .from("descontos_especiais")
    .select("*")
    .eq("aluno_id", alunoId)
    .eq("status", "ativo")
    .maybeSingle();

  if (descDiretoria) {
    if (descDiretoria.recorrente || descDiretoria.meses_restantes > 0) {
      if (descDiretoria.tipo === "percentual") {
        valorAtual = Math.max(0, valorAtual - (valorAtual * (descDiretoria.valor / 100)));
      } else {
        valorAtual = Math.max(0, valorAtual - descDiretoria.valor);
      }
    }
  }

  // 2. Desconto de Campanha/Sorteio
  const { data: ganhador } = await supabase
    .from("campanhas_ganhadores")
    .select("*, premiacoes(percentual_desconto)")
    .eq("aluno_id", alunoId)
    .eq("status", "ativo")
    .gt("meses_restantes", 0)
    .maybeSingle();

  if (ganhador && ganhador.premiacoes) {
    const pct = ganhador.premiacoes[0]?.percentual_desconto || 0;
    if (pct === 100) valorAtual = 0;
    else if (pct > 0) valorAtual = Math.max(0, valorAtual - (valorAtual * (pct / 100)));
  }

  return {
    valorFinal: Number(valorAtual.toFixed(2)),
    isento: valorAtual <= 0
  };
}