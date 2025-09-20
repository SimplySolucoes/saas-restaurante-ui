// Em src/app/gestao/(gestao)/page.js

"use client";

import { useEffect, useState } from "react";
import Link from 'next/link';
import { getRestaurante } from "@/lib/api";

// Ícones simples para os cards
const MesasIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mb-3 text-indigo-500"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 018.25 20.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>;
const PedidoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mb-3 text-indigo-500"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75c0-.231-.035-.454-.1-.664M6.75 7.5h4.5a.75.75 0 00.75-.75c0-.231-.035-.454-.1-.664m-5.801 0A48.424 48.424 0 006 3.75c-1.131 0-2.186.91-2.25 2.035v10.113c0 .597.234 1.17.659 1.591l.652.652c.24.24.522.428.823.568h3.218a.75.75 0 00.75-.75c0-.414-.336-.75-.75-.75H6.75v-1.5a.75.75 0 00-.75-.75H3.75Z" /></svg>;
const ConfigIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 mb-3 text-indigo-500"><path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-1.007 1.11-1.226.55-.22 1.156-.22 1.706 0 .55.219 1.02.684 1.11 1.226l.044.266c.273.165.556.353.845.564.289.21.596.444.92.704.324.26.66.544 1.01.854.35.31.71.644 1.08.995.37.35.75.717 1.15.1.09.4.4.78.43.39.03.78.04 1.17.04.39.01.78.01 1.17-.04.39-.03.78-.44 1.15-.1.09-.4-.4-.78-.43-.39-.03-.78-.04-1.17-.04-.39 0-.78-.01-1.17.04a.973.973 0 01-.43.78c-.37.35-.71.685-1.08.995-.35.31-.686.594-1.01.854-.325.26-.63.494-.92.704-.29.21-.572.398-.845.563l-.044.266c-.09.542-.56 1.007-1.11 1.226-.55.22-1.156.22-1.706 0-.55-.219-1.02-.684-1.11-1.226l-.044-.266a12.03 12.03 0 01-.845-.563c-.289-.21-.596-.444-.92-.704-.324-.26-.66-.544-1.01-.854-.35-.31-.71-.644-1.08-.995a.973.973 0 01-.43-.78c-.01-.39-.01-.78.04-1.17s.04-.78.43-1.17c.37-.35.71-.685 1.08-.995.35-.31.686-.594 1.01-.854.325-.26.63.494.92.704.29.21.572.398.845.563l.044.266zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" /></svg>;

export default function GestaoHomePage() {
  const [restaurante, setRestaurante] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRestaurante = async () => {
      const token = localStorage.getItem("authToken");
      if (token) {
        const data = await getRestaurante(token);
        setRestaurante(data);
      }
      setIsLoading(false);
    };
    fetchRestaurante();
  }, []);

  if (isLoading) {
    return <div className="p-6">Carregando...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-2">
        Bem-vindo, {restaurante?.nome || 'Gestor'}!
      </h1>
      <p className="text-gray-600 mb-8">Este é o seu painel de controle. O que você gostaria de fazer hoje?</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        <Link href="/gestao/mesa-ativa" className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-transform">
          <MesasIcon />
          <h2 className="font-bold text-xl text-gray-800">Ver Mesas Ativas</h2>
          <p className="text-sm text-gray-600 mt-1">Monitore os pedidos em tempo real e gerencie as contas.</p>
        </Link>
        
        <Link href="/gestao/novo-pedido" className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-transform">
          <PedidoIcon />
          <h2 className="font-bold text-xl text-gray-800">Lançar Novo Pedido</h2>
          <p className="text-sm text-gray-600 mt-1">Abra uma nova comanda ou adicione itens a uma mesa existente.</p>
        </Link>
        
        <Link href="/gestao/configuracoes" className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-transform">
          <ConfigIcon />
          <h2 className="font-bold text-xl text-gray-800">Configurações</h2>
          <p className="text-sm text-gray-600 mt-1">Edite seu cardápio, mesas e as informações do restaurante.</p>
        </Link>

      </div>
    </div>
  );
}