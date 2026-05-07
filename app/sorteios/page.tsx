"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getVersiculoDoDia } from "../lib/versiculos";

export default function Home() {
  const [saudacao, setSaudacao] = useState("");
  const [versiculo, setVersiculo] = useState({ texto: "", referencia: "" });
  const [dataAtual, setDataAtual] = useState("");

  useEffect(() => {
    const hora = new Date().getHours();
    if (hora < 12) setSaudacao("Bom dia");
    else if (hora < 18) setSaudacao("Boa tarde");
    else setSaudacao("Boa noite");

    setVersiculo(getVersiculoDoDia());
    setDataAtual(new Date().toLocaleDateString("pt-BR", { weekday: "long", year: "numeric", month: "long", day: "numeric" }));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center p-4">
      <div className="text-center p-8 bg-white/5 backdrop-blur-sm rounded-3xl shadow-2xl max-w-2xl border border-gray-800">
        <div className="flex justify-center mb-6">
          <img src="/logo-color.png" alt="CT Okinawa" className="h-28 w-auto" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">{saudacao}, Equipe!</h1>
        <p className="text-xl text-red-500 mb-3">CT OKINAWA – Disciplina e Respeito</p>
        <p className="text-gray-400 text-sm mb-6">{dataAtual}</p>
        <div className="h-px w-24 bg-red-600 mx-auto rounded-full mb-6"></div>
        <div className="bg-gray-800/50 rounded-2xl p-6 mb-6 border border-gray-700">
          <p className="text-gray-300 text-lg italic mb-2">“{versiculo.texto}”</p>
          <p className="text-red-400 font-semibold">{versiculo.referencia}</p>
        </div>
        <Link
          href="/dashboard"
          className="inline-block bg-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-700 transition shadow-md"
        >
          Acessar o Sistema →
        </Link>
        <div className="mt-8 pt-4 border-t border-gray-800 text-gray-500 text-sm">Sistema de Gestão – Versão 2.0</div>
      </div>
    </div>
  );
}