"use client"

import { useEffect, useState } from "react"

export default function AlunosPage() {

  const get = (k: string) => {
    try {
      const raw =
        localStorage.getItem("ct_okinawa_" + k) ||
        localStorage.getItem(k)

      if (!raw) return []

      return JSON.parse(raw)
    } catch {
      return []
    }
  }

  const set = (k: string, v: any) =>
    localStorage.setItem("ct_okinawa_" + k, JSON.stringify(v))

  const [turmas, setTurmas] = useState<any[]>([])
  const [modalidades, setModalidades] = useState<any[]>([])
  const [convenios, setConvenios] = useState<any[]>([])

  const [form, setForm] = useState<any>({
    nome: "",
    cpf: "",
    rg: "",
    nascimento: "",
    idade: "",

    whatsapp: "",
    email: "",
    endereco: "",

    responsavelNome: "",
    responsavelCpf: "",
    responsavelRg: "",
    responsavelWhatsapp: "",

    problemasSaude: "",
    medicamentos: "",

    modalidade: "",
    turma: "",
    turmaId: null,

    turmasSelecionadas: [],

    convenio: "Sem convênio",

    valor: 0,
    desconto: 0,
    total: 0,

    formaPagamento: "Pix",
    tipoCartao: "",
    parcelas: "1x",
  })

  useEffect(() => {
    setTurmas(get("turmas"))
    setConvenios(get("convenios"))
    setModalidades(get("modalidades"))
  }, [])

  useEffect(() => {
    if (!form.nascimento) return
    const hoje = new Date()
    const nasc = new Date(form.nascimento)

    let idade = hoje.getFullYear() - nasc.getFullYear()

    if (
      hoje.getMonth() < nasc.getMonth() ||
      (hoje.getMonth() === nasc.getMonth() &&
        hoje.getDate() < nasc.getDate())
    ) idade--

    setForm((prev:any)=>({...prev, idade}))
  }, [form.nascimento])

  useEffect(() => {

    if (!form.modalidade && form.turmasSelecionadas.length === 0) return

    const modalidadePrincipal = modalidades.find(
      (m:any)=>m.nome === form.modalidade
    )

    let valorBase = Number(modalidadePrincipal?.valor || 0)

    form.turmasSelecionadas.forEach((t:any) => {
      const mod = modalidades.find((m:any)=>m.nome === t.modalidade)
      if (mod) valorBase += Number(mod.valor || 0)
    })

    let total = valorBase
    let desconto = 0

    if (form.formaPagamento === "Pix" || form.formaPagamento === "Dinheiro") {
      desconto += 10
      total = valorBase - desconto
    }

    if (form.formaPagamento === "Cartão") {
      total = 110
    }

    if (form.convenio !== "Sem convênio") {
      const c = convenios.find((c:any)=>c.nome === form.convenio)

      if (c) {
        const desc = c.tipoDesconto === "percentual"
          ? valorBase * (c.valorDesconto / 100)
          : Number(c.valorDesconto)

        desconto += desc
        total -= desc
      }
    }

    setForm((prev:any)=>({
      ...prev,
      valor: valorBase,
      desconto: Number(desconto.toFixed(2)),
      total: Number(total.toFixed(2))
    }))

  }, [
    form.modalidade,
    form.turmasSelecionadas,
    form.convenio,
    form.formaPagamento,
    modalidades
  ])

  const adicionarTurma = () => {
    setForm((prev:any)=>({
      ...prev,
      turmasSelecionadas: [
        ...prev.turmasSelecionadas,
        { modalidade: "", turma: "", turmaId: null }
      ]
    }))
  }

  // 🔥 ALTERAÇÃO SOMENTE AQUI
  const salvar = () => {

    const lista = get("alunos")

    const novoAluno = {
      ...form,
      id: Date.now(),
      ativo: true
    }

    lista.push(novoAluno)
    set("alunos", lista)

    const hoje = new Date()
    const mesReferencia = `${String(hoje.getMonth()+1).padStart(2,"0")}/${hoje.getFullYear()}`

    const mensalidades = get("mensalidades") || []

    mensalidades.push({
      id: Date.now(),
      alunoId: novoAluno.id,
      nome: novoAluno.nome,

      modalidade: novoAluno.modalidade,
      formaPagamento: novoAluno.formaPagamento,
      mesReferencia,

      turmas: [
        {
          modalidade: novoAluno.modalidade,
          turma: novoAluno.turma
        },
        ...(novoAluno.turmasSelecionadas || [])
      ],

      valor: novoAluno.valor,
      desconto: novoAluno.desconto,
      total: novoAluno.total,

      status: "pago",
      data: hoje.toLocaleDateString()
    })

    set("mensalidades", mensalidades)

    const pagamentosProf = get("pagamentos_prof") || []

    const turmasAluno = [
      { modalidade: novoAluno.modalidade, turma: novoAluno.turma },
      ...(novoAluno.turmasSelecionadas || [])
    ]

    turmasAluno.forEach(t => {
      if (!t.turma) return

      const turmaObj = turmas.find(tt => tt.nome === t.turma)
      const mod = modalidades.find((m:any)=>m.nome === t.modalidade)

      if (turmaObj && turmaObj.professor) {

        const valorBase = Number(mod?.valor || 0)

        let baseCalculo = valorBase

        if (novoAluno.formaPagamento === "Cartão") {
          baseCalculo = valorBase - 10
        }

        const porcentagem = Number(turmaObj.porcentagemProfessor || 0)

        const valorProfessor = baseCalculo * (porcentagem / 100)

        pagamentosProf.push({
          id: Date.now(),

          professor: turmaObj.professor,
          professorId: turmaObj.professorId,

          aluno: novoAluno.nome,

          modalidade: t.modalidade,
          turma: t.turma,

          valorBaseOriginal: valorBase,
          valorBaseCalculo: baseCalculo,

          porcentagem,
          valorProfessor: Number(valorProfessor.toFixed(2)),

          formaPagamento: novoAluno.formaPagamento,

          data: hoje.toLocaleDateString()
        })
      }
    })

    set("pagamentos_prof", pagamentosProf)

    imprimirRecibo(novoAluno)

    alert("Salvo com sucesso")
  }

  const imprimirRecibo = (f:any) => {

    const agora = new Date()

    const w = window.open("", "", "width=300,height=600")

    w?.document.write(`
      <html>
      <body style="font-family:monospace;width:58mm">

      <div style="text-align:center">
        <img src="${window.location.origin}/logo.png" style="width:100px"/>
      </div>

      <div style="text-align:center"><b>CT OKINAWA</b></div>
      <div style="text-align:center">1ª MENSALIDADE / MATRÍCULA</div>

      <hr/>

      <div>Data: ${agora.toLocaleDateString()}</div>
      <div>Hora: ${agora.toLocaleTimeString()}</div>

      <hr/>

      <div>Aluno: ${f.nome}</div>
      <div>Modalidade: ${f.modalidade}</div>
      <div>Turma: ${f.turma}</div>

      ${f.turmasSelecionadas?.map((t:any)=>`
        <div>+ ${t.modalidade} - ${t.turma}</div>
      `).join("")}

      <hr/>

      <div>Plano: R$ ${f.valor}</div>
      <div>Desconto: R$ ${f.desconto}</div>
      <div><b>Total: R$ ${f.total}</b></div>

      <hr/>

      <div>Pagamento: ${f.formaPagamento}</div>

      ${
        f.formaPagamento === "Cartão"
          ? `
            <div>Tipo: ${f.tipoCartao}</div>
            ${f.tipoCartao === "Crédito" ? `<div>Parcelas: ${f.parcelas}</div>` : ""}
          `
          : ""
      }

      <hr/>

      <div style="text-align:center">(71) 99372-5936</div>

      <hr/>

      <div style="text-align:center">Obrigado! Deus abençoe!!!</div>

      <script>
        window.onload = () => {
          setTimeout(()=>{window.print();window.close()},300)
        }
      </script>

      </body>
      </html>
    `)

    w?.document.close()
  }

  return (
    <div style={{maxWidth:1200, margin:"0 auto", padding:30}}>

      <style>{`
        .grid{display:grid;grid-template-columns:1fr 1fr;gap:25px}
        .card{background:#fff;padding:25px;border-radius:16px}
        .input{width:100%;padding:12px;margin-bottom:12px;border-radius:10px;border:1px solid #ddd}
        .btn{width:100%;padding:14px;background:#111;color:#fff;border:none;border-radius:10px}
      `}</style>

      <h1>Cadastro de Aluno</h1>

      <div className="grid">

        <div className="card">
          <input className="input" placeholder="Nome" onChange={e=>setForm({...form,nome:e.target.value})}/>
          <input className="input" placeholder="CPF" onChange={e=>setForm({...form,cpf:e.target.value})}/>
          <input className="input" placeholder="RG" onChange={e=>setForm({...form,rg:e.target.value})}/>
          <input className="input" type="date" onChange={e=>setForm({...form,nascimento:e.target.value})}/>
          <div>Idade: {form.idade}</div>
          <input className="input" placeholder="WhatsApp" onChange={e=>setForm({...form,whatsapp:e.target.value})}/>
          <input className="input" placeholder="Email" onChange={e=>setForm({...form,email:e.target.value})}/>
          <input className="input" placeholder="Endereço" onChange={e=>setForm({...form,endereco:e.target.value})}/>

          {form.idade < 18 && (
            <>
              <h3>Responsável</h3>
              <input className="input" placeholder="Nome responsável" onChange={e=>setForm({...form,responsavelNome:e.target.value})}/>
              <input className="input" placeholder="CPF responsável" onChange={e=>setForm({...form,responsavelCpf:e.target.value})}/>
              <input className="input" placeholder="RG responsável" onChange={e=>setForm({...form,responsavelRg:e.target.value})}/>
              <input className="input" placeholder="WhatsApp responsável" onChange={e=>setForm({...form,responsavelWhatsapp:e.target.value})}/>
            </>
          )}

          <h3>Saúde</h3>
          <input className="input" placeholder="Problemas" onChange={e=>setForm({...form,problemasSaude:e.target.value})}/>
          <input className="input" placeholder="Medicamentos" onChange={e=>setForm({...form,medicamentos:e.target.value})}/>
        </div>

        <div className="card">

          <select className="input"
            value={form.modalidade}
            onChange={e=>setForm({...form,modalidade:e.target.value, turma:""})}>
            <option value="">Selecione a modalidade</option>
            {modalidades.map((m:any)=>(
              <option key={m.id} value={m.nome}>{m.nome}</option>
            ))}
          </select>

          <select className="input"
            onChange={e=>{
              const turmaObj = turmas.find(t=>t.nome === e.target.value)
              setForm({...form, turma: turmaObj?.nome, turmaId: turmaObj?.id})
            }}>
            <option>Turma</option>
            {turmas
              .filter((t:any)=>t.modalidade === form.modalidade)
              .map((t:any)=><option key={t.id}>{t.nome}</option>)
            }
          </select>

          {form.turmasSelecionadas.map((t:any,i:number)=>(
            <div key={i}>
              <select className="input"
                onChange={e=>{
                  const lista = [...form.turmasSelecionadas]
                  lista[i] = {...lista[i], modalidade: e.target.value, turma:"", turmaId:null}
                  setForm({...form, turmasSelecionadas: lista})
                }}>
                <option value="">Modalidade</option>
                {modalidades.map((m:any)=>(
                  <option key={m.id}>{m.nome}</option>
                ))}
              </select>

              <select className="input"
                onChange={e=>{
                  const turmaObj = turmas.find(tu=>tu.nome === e.target.value)
                  const lista = [...form.turmasSelecionadas]
                  lista[i] = {
                    ...lista[i],
                    turma: turmaObj?.nome,
                    turmaId: turmaObj?.id
                  }
                  setForm({...form, turmasSelecionadas: lista})
                }}>
                <option value="">Turma</option>
                {turmas
                  .filter((tu:any)=>tu.modalidade === t.modalidade)
                  .map((tu:any)=>(
                    <option key={tu.id}>{tu.nome}</option>
                  ))
                }
              </select>
            </div>
          ))}

          <button className="input" onClick={adicionarTurma}>
            + Adicionar outra modalidade/turma
          </button>

          <select className="input"
            onChange={e=>setForm({...form,convenio:e.target.value})}>
            <option>Sem convênio</option>
            {convenios.map((c:any)=><option key={c.id}>{c.nome}</option>)}
          </select>

          <select className="input"
            onChange={e=>setForm({...form,formaPagamento:e.target.value})}>
            <option>Pix</option>
            <option>Dinheiro</option>
            <option>Cartão</option>
          </select>

          {form.formaPagamento === "Cartão" && (
            <>
              <select className="input"
                onChange={e=>setForm({...form,tipoCartao:e.target.value})}>
                <option>Crédito</option>
                <option>Débito</option>
              </select>

              {form.tipoCartao === "Crédito" && (
                <select className="input"
                  onChange={e=>setForm({...form,parcelas:e.target.value})}>
                  <option>1x</option>
                  <option>2x</option>
                  <option>3x</option>
                </select>
              )}
            </>
          )}

          <div className="card" style={{background:"#000",color:"#fff"}}>
            <div>Plano: R$ {form.valor}</div>
            <div>Desconto: R$ {form.desconto}</div>
            <div>Total: R$ {form.total}</div>
          </div>

          <button className="btn" onClick={salvar}>
            Cadastrar aluno + imprimir recibo
          </button>

        </div>

      </div>

    </div>
  )
}