"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginUser } from '@/lib/api/auth'; 

export default function LoginForm({ corPrincipal }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Chama a nova função de login que aponta para /api/accounts/login/
    const result = await loginUser({ username, password });
    
    setIsLoading(false);

    // ALTERADO: Verificamos se recebemos o token E os dados do utilizador
    if (result.token && result.user) {
      // 1. Guarda o token de autenticação, como antes
      localStorage.setItem("authToken", result.token);
      
      // 2. NOVO E IMPORTANTE: Guarda o objeto completo do utilizador (com o cargo)
      localStorage.setItem("userData", JSON.stringify(result.user));

      // 3. Redireciona para o painel de gestão
      router.push("/gestao");
      // Força a atualização dos componentes do lado do servidor para ler o novo estado de login
      router.refresh(); 
    } else {
      setError(result.error || "Ocorreu um erro desconhecido.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4 rounded-md">
        <div>
          <label htmlFor="username" className="sr-only">Nome de Utilizador</label>
          <input
            id="username" name="username" type="text" required
            className="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-3 text-gray-900 placeholder-gray-500 focus:z-10 focus:outline-none focus:ring-2 sm:text-sm"
            placeholder="Nome de Utilizador"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ '--tw-ring-color': corPrincipal, borderColor: error ? '#EF4444' : '#D1D5DB' }}
          />
        </div>
        <div>
          <label htmlFor="password" className="sr-only">Senha</label>
          <input
            id="password" name="password" type="password" required
            className="relative block w-full appearance-none rounded-md border border-gray-300 px-3 py-3 text-gray-900 placeholder-gray-500 focus:z-10 focus:outline-none focus:ring-2 sm:text-sm"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ '--tw-ring-color': corPrincipal, borderColor: error ? '#EF4444' : '#D1D5DB' }}
          />
        </div>
      </div>
      
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-center">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="group relative flex w-full justify-center rounded-md border border-transparent px-4 py-3 text-sm font-medium text-white shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 transition-colors"
          style={{ 
            backgroundColor: isLoading ? '#9CA3AF' : corPrincipal,
            '--tw-ring-color': corPrincipal,
            borderColor: corPrincipal
          }}
        >
          {isLoading ? "A entrar..." : "Entrar"}
        </button>
      </div>
    </form>
  );
}

