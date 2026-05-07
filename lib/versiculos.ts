// lib/versiculos.ts
export const versiculos = [
  {
    texto: "Confie no Senhor de todo o seu coração e não se apoie em seu próprio entendimento.",
    referencia: "Provérbios 3:5"
  },
  {
    texto: "Tudo posso naquele que me fortalece.",
    referencia: "Filipenses 4:13"
  },
  {
    texto: "O Senhor é o meu pastor; nada me faltará.",
    referencia: "Salmos 23:1"
  },
  {
    texto: "Se Deus é por nós, quem será contra nós?",
    referencia: "Romanos 8:31"
  },
  {
    texto: "O amor é paciente, o amor é bondoso. Não inveja, não se vangloria, não se orgulha.",
    referencia: "1 Coríntios 13:4"
  },
  {
    texto: "Buscai primeiro o Reino de Deus e a sua justiça, e todas essas coisas vos serão acrescentadas.",
    referencia: "Mateus 6:33"
  },
  {
    texto: "Sede fortes e corajosos, não temais, nem vos espanteis, porque o Senhor vosso Deus vai convosco.",
    referencia: "Deuteronômio 31:6"
  },
  {
    texto: "Com Deus faremos proezas; ele mesmo calcará os nossos adversários.",
    referencia: "Salmos 60:12"
  },
  {
    texto: "Toda a Escritura é inspirada por Deus e útil para ensinar, para repreender, para corrigir e para instruir na justiça.",
    referencia: "2 Timóteo 3:16"
  },
  {
    texto: "Orando sem cessar.",
    referencia: "1 Tessalonicenses 5:17"
  },
  {
    texto: "Não se preocupem com nada, mas em todas as coisas, pela oração e súplicas, apresentem seus pedidos a Deus.",
    referencia: "Filipenses 4:6"
  },
  {
    texto: "Alegrem-se sempre no Senhor. Novamente direi: alegrem-se!",
    referencia: "Filipenses 4:4"
  },
  {
    texto: "O Senhor te abençoe e te guarde; o Senhor faça resplandecer o seu rosto sobre ti e te conceda graça.",
    referencia: "Números 6:24-25"
  }
];

export function getVersiculoDoDia() {
  const hoje = new Date();
  const diaDoAno = Math.floor((hoje.getTime() - new Date(hoje.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  const indice = diaDoAno % versiculos.length;
  return versiculos[indice];
}