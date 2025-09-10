"use client"; 

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function GestaoLayout({ children }) {
  const router = useRouter();
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      router.push("/gestao/login");
    } else {
      setIsAuth(true);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    router.push("/gestao/login");
  };

  // Enquanto verifica a autenticação, não mostra nada para evitar um "flash" de conteúdo.
  if (!isAuth) {
    return null; 
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Barra Lateral de Navegação */}
      <aside className="w-64 bg-gray-800 text-white p-6 flex flex-col">
        <div>
          <h2 className="text-2xl font-bold mb-8">Painel</h2>
          <nav className="flex flex-col space-y-4">
            <a href="/gestao" className="font-semibold hover:text-indigo-400">Dashboard</a>
            {/* Outros links virão aqui (Cardápio, Configurações, etc.) */}
          </nav>
        </div>
        <button 
          onClick={handleLogout}
          className="mt-auto w-full text-left font-semibold text-red-400 hover:text-red-300"
        >
          Sair
        </button>
      </aside>

      {/* Área de Conteúdo Principal */}
      <main className="flex-1 p-8">
        {children} {/* Aqui é onde a nossa 'page.js' será renderizada */}
      </main>
    </div>
  );
}