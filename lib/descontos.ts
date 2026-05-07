// lib/descontos.ts
import { supabase } from "./supabase";

export async function aplicarDescontoCampanha(alunoId: string, valorOriginal: number): Promise<{ valorFinal: number; mesesRestantes: number | null }> {
  // Buscar ganhador ativo com meses restantes > 0
  const { data: ganhador, error } = await supabase
    .from("campanhas_ganhadores")
    .select("id, meses_restantes, premiacoes ( percentual_desconto )")
    .eq("aluno_id", alunoId)
    .eq("status", "ativo")
    .gt("meses_restantes", 0)
    .maybeSingle();

  if (error) {
    console.error("Erro ao buscar ganhador:", error);
    return { valorFinal: valorOriginal, mesesRestantes: null };
  }

  if (!ganhador) {
    return { valorFinal: valorOriginal, mesesRestantes: null };
  }

  // O Supabase retorna premiacoes como array
  let percentual = 0;
  if (ganhador.premiacoes && Array.isArray(ganhador.premiacoes) && ganhador.premiacoes.length > 0) {
    percentual = ganhador.premiacoes[0].percentual_desconto || 0;
  } else if (ganhador.premiacoes && !Array.isArray(ganhador.premiacoes)) {
    percentual = (ganhador.premiacoes as any).percentual_desconto || 0;
  }

  let valorFinal = valorOriginal;
  if (percentual === 100) {
    valorFinal = 0;
  } else if (percentual > 0) {
    valorFinal = valorOriginal * (1 - percentual / 100);
  }

  // Decrementar meses restantes
  const novosMeses = ganhador.meses_restantes - 1;
  const novoStatus = novosMeses <= 0 ? "expirado" : "ativo";

  await supabase
    .from("campanhas_ganhadores")
    .update({ meses_restantes: novosMeses, status: novoStatus })
    .eq("id", ganhador.id);

  return { valorFinal, mesesRestantes: novosMeses };
}