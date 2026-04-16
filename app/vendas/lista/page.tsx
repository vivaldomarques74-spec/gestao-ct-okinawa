"use client";

import { useEffect, useState } from "react";

const SENHA = "170296";

export default function ListaVendasPage() {

  const [logado, setLogado] = useState(false);
  const [senha, setSenha] = useState("");

  const [vendas, setVendas] = useState<any[]>([]);
  const [filtroData, setFiltroData] = useState("");

  const get = () => {
    try {
      return JSON.parse(localStorage.getItem("vendas") || "[]");
    } catch {
      return [];
    }
  };

  const set = (lista:any[]) => {
    localStorage.setItem("vendas", JSON.stringify(lista));
  };

  useEffect(() => {
    setVendas(get());
  }, []);

  // 🔐 LOGIN
  if (!logado) {
    return (
      <div style={{padding:40, maxWidth:400, margin:"0 auto"}}>
        <h2>🔒 Acesso restrito</h2>

        <input
          placeholder="Senha"
          value={senha}
          onChange={e=>setSenha(e.target.value)}
          style={{width:"100%", padding:12}}
        />

        <button
          onClick={()=>{
            if (senha === SENHA) setLogado(true);
            else alert("Senha incorreta");
          }}
          style={{marginTop:10, padding:12, width:"100%"}}
        >
          Entrar
        </button>
      </div>
    );
  }

  // 🔍 FILTRO
  const listaFiltrada = vendas.filter(v =>
    !filtroData || v.dataVenda === filtroData
  );

  // 📊 TOTAIS
  const total = listaFiltrada.reduce((s, v)=> s + Number(v.valorTotalGeral), 0);

  const totalCT = listaFiltrada
    .filter(v=>v.origem === "ct")
    .reduce((s, v)=> s + Number(v.valorTotalGeral), 0);

  const totalParceiros = listaFiltrada
    .filter(v=>v.origem === "parceiro")
    .reduce((s, v)=> s + Number(v.valorTotalGeral), 0);

  // ❌ EXCLUIR
  const excluir = (id:string) => {
    if (!confirm("Excluir venda?")) return;

    const nova = vendas.filter(v => v.idVenda !== id);
    set(nova);
    setVendas(nova);
  };

  // 🧾 RECIBO
  const imprimirRecibo = (v:any) => {

    const w = window.open("", "", "width=400,height=700");

    w?.document.write(`
      <html>
      <body style="font-family: monospace; padding:20px; max-width:300px; margin:auto;">

      <div style="text-align:center">
        <img src="/logo.png" style="width:60px"/>
        <h3>CT OKINAWA</h3>
        <p>Recibo de vendas</p>
      </div>

      <hr/>

      <p>Data: ${v.dataVenda}</p>
      <p>Hora: ${v.hora}</p>

      <p>Origem: ${v.origem === "ct" ? "CT" : "Parceiro"}</p>
      ${v.parceiro ? `<p>Parceiro: ${v.parceiro}</p>` : ""}

      <hr/>

      <b>PRODUTOS</b><br/><br/>

      ${v.itens.map((i:any)=>`
        <div style="display:flex;justify-content:space-between;">
          <span>${i.produto} (${i.quantidade}x)</span>
          <span>R$ ${i.valorTotal}</span>
        </div>
      `).join("")}

      <hr/>

      <h3 style="display:flex;justify-content:space-between;">
        <span>Total:</span>
        <span>R$ ${v.valorTotalGeral}</span>
      </h3>

      <p>Pagamento: ${v.formaPagamento}</p>

      <br/>

      <div style="text-align:center">
        (71) 99372-5936<br/>
        Obrigado! Deus abençoe!!!
      </div>

      <script>
        window.onload = () => setTimeout(()=>window.print(),300)
      </script>

      </body>
      </html>
    `);

    w?.document.close();
  };

  // 📊 RELATÓRIO
  const imprimirRelatorio = () => {

    const w = window.open("", "", "width=900,height=700");

    w?.document.write(`
      <html>
      <body style="font-family:Arial;padding:30px">

      <h2>Relatório de Vendas</h2>
      <p>Data: ${filtroData || "Todas"}</p>

      <table border="1" cellpadding="8" cellspacing="0" width="100%">
        <tr>
          <th>ID</th>
          <th>Data</th>
          <th>Origem</th>
          <th>Parceiro</th>
          <th>Total</th>
        </tr>

        ${listaFiltrada.map(v=>`
          <tr>
            <td>${v.idVenda}</td>
            <td>${v.dataVenda}</td>
            <td>${v.origem}</td>
            <td>${v.parceiro || "-"}</td>
            <td>R$ ${v.valorTotalGeral}</td>
          </tr>
        `).join("")}

      </table>

      <h3>Total: R$ ${total}</h3>
      <h4>CT: R$ ${totalCT}</h4>
      <h4>Parceiros: R$ ${totalParceiros}</h4>

      <script>
        window.onload = () => setTimeout(()=>window.print(),300)
      </script>

      </body>
      </html>
    `);

    w?.document.close();
  };

  return (
    <div style={{maxWidth:900, margin:"0 auto", padding:30}}>

      <h1>📋 Lista de Vendas</h1>

      <input
        type="date"
        value={filtroData}
        onChange={e=>setFiltroData(e.target.value)}
        style={{padding:10, width:"100%", marginBottom:10}}
      />

      <button onClick={imprimirRelatorio}>
        📊 Imprimir Relatório
      </button>

      <div style={{marginTop:20}}>

        {listaFiltrada.map(v => (
          <div key={v.idVenda}
            style={{
              border:"1px solid #ddd",
              padding:15,
              borderRadius:10,
              marginBottom:10
            }}
          >

            <strong>{v.idVenda}</strong><br/>
            {v.dataVenda} • {v.origem === "ct" ? "CT" : "Parceiro"}<br/>
            💰 R$ {v.valorTotalGeral}

            <div style={{marginTop:10, display:"flex", gap:10}}>

              <button onClick={()=>imprimirRecibo(v)}>
                🧾 Recibo
              </button>

              <button onClick={()=>excluir(v.idVenda)}>
                ❌ Excluir
              </button>

            </div>

          </div>
        ))}

      </div>

    </div>
  );
}