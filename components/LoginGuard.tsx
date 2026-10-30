"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function LoginGuard({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const auth = localStorage.getItem("auth_token");
    if (auth === "true") {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  // Verifica se a URL tem algo depois de /escolas/ (ex: /escolas/ESC-TESTE)
  const isRotaPublicaEscola = pathname?.startsWith("/escolas/") && pathname !== "/escolas" && pathname !== "/escolas/";

  // Rotas que NÃO exigem a senha do sistema
  const isPublicRoute = 
    pathname === "/presenca" || 
    pathname?.startsWith("/parceiros/dashboard") || 
    isRotaPublicaEscola;

  // Se for uma rota pública, permite o acesso
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // Se não for pública e não estiver logado, mostra a tela de senha do sistema
  if (!isAuthenticated) {
    return <LoginScreen onAuth={() => setIsAuthenticated(true)} />;
  }

  return <>{children}</>;
}

function LoginScreen({ onAuth }: { onAuth: () => void }) {
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");

  const handleLogin = () => {
    if (senha === "1702") { // Senha de entrada do sistema
      localStorage.setItem("auth_token", "true");
      onAuth();
    } else {
      setErro("Senha incorreta");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-96 text-center">
        <div className="mb-6">
          <img src="/logo-color.png" alt="Logo" className="w-32 mx-auto" />
          <h1 className="text-3xl font-bold text-red-600 mt-4">CT OKINAWA</h1>
          <p className="text-gray-500 mt-2">Sistema de Gestão</p>
        </div>
        <input
          type="password"
          placeholder="Digite a senha de acesso"
          className="w-full p-3 border border-gray-300 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-red-500"
          value={senha}
          onChange={e => setSenha(e.target.value)}
          onKeyPress={e => e.key === "Enter" && handleLogin()}
        />
        <button
          onClick={handleLogin}
          className="w-full bg-red-600 text-white p-3 rounded-xl font-semibold hover:bg-red-700 transition"
        >
          Entrar
        </button>
        {erro && <p className="text-red-500 mt-3 text-sm">{erro}</p>}
      </div>
    </div>
  );
}