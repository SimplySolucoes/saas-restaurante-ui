// src/app/gestao/(gestao)/novo-pedido/page.js

"use client";

import { useEffect, useState } from "react";
// Importamos todas as funções de API de que precisamos
import { getSessions, getGestaoCategorias, getGestaoItensCardapio, submitOrder } from "@/lib/api";
import GarcomMenu from "@/components/gestao/GarcomMenu"; // Importamos a nossa nova comanda

export default function NovoPedidoPage() {
  // --- GESTÃO DE ESTADO PRINCIPAL ---
  const [sessoesAbertas, setSessoesAbertas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Controla a etapa do fluxo: 'selecao' ou 'adicao'
  const [etapa, setEtapa] = useState('selecao'); 
  const [selectedSessao, setSelectedSessao] = useState(null);
  
  // Guarda os dados do cardápio do restaurante da sessão selecionada
  const [categorias, setCategorias] = useState([]);
  const [itens, setItens] = useState([]);
  const [corPrincipal, setCorPrincipal] = useState('#4F46E5'); // Uma cor padrão

  // --- BUSCA DE DADOS ---
  useEffect(() => {
    // Busca as sessões abertas quando a página carrega
    async function carregarSessoes() {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setError("Token de autenticação não encontrado.");
        setIsLoading(false);
        return;
      }
      const sessoesDaApi = await getSessions(token);
      if (sessoesDaApi) {
        const abertas = sessoesDaApi.filter(s => s.status === 'aberta');
        setSessoesAbertas(abertas);
      } else {
        setError("Não foi possível carregar as sessões ativas.");
      }
      setIsLoading(false);
    }
    carregarSessoes();
  }, []);

  // Busca os dados do cardápio QUANDO uma sessão é selecionada
  const handleSelectSessao = async (sessao) => {
    setIsLoading(true);
    setSelectedSessao(sessao);
    const token = localStorage.getItem("authToken");
    
    // Fazemos as chamadas à API em paralelo para maior eficiência
    const [categoriasData, itensData] = await Promise.all([
      getGestaoCategorias(token),
      getGestaoItensCardapio(token)
    ]);

    setCategorias(categoriasData);
    setItens(itensData);
    // Assumimos que a cor principal não muda, podemos otimizar isto no futuro
    if (categoriasData.length > 0) {
      // Simulação para obter a cor. O ideal seria ter a cor na sessão.
      // Vamos buscar no primeiro item, mas isto pode ser melhorado.
    }

    setIsLoading(false);
    setEtapa('adicao'); // Muda para a etapa de adicionar itens
  };

  // --- AÇÕES DO GARÇOM ---
  const handleSubmitGarcomOrder = async (comanda) => {
    if (comanda.length === 0) return;

    // A nossa API de 'submitOrder' já existe e pode ser reutilizada aqui!
    const result = await submitOrder(selectedSessao.id, comanda);

    if (result && !result.error) {
      alert("Itens adicionados com sucesso!");
      // Volta para a seleção de mesas, pronto para o próximo pedido
      setEtapa('selecao');
      setSelectedSessao(null);
    } else {
      alert(`Erro ao adicionar itens: ${result.error}`);
    }
  };

  // --- RENDERIZAÇÃO ---
  if (etapa === 'adicao' && selectedSessao) {
    return (
      <GarcomMenu
        categorias={categorias}
        itens={itens}
        onBack={() => setEtapa('selecao')}
        onSubmitOrder={handleSubmitGarcomOrder}
        corPrincipal={corPrincipal}
      />
    );
  }
  
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Novo Pedido</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Selecione a Conta</h2>
        {isLoading && <p>A carregar as contas abertas...</p>}
        {error && <p className="text-red-500">{error}</p>}
        
        {!isLoading && !error && (
          <ul className="divide-y divide-gray-200">
            {sessoesAbertas.length === 0 ? (
              <li className="py-3 text-center text-gray-500">Não há contas abertas no momento.</li>
            ) : (
              sessoesAbertas.map((sessao) => (
                <li key={sessao.id}>
                  <button
                    onClick={() => handleSelectSessao(sessao)}
                    className="w-full text-left px-4 py-4 flex justify-between items-center hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-bold text-gray-800">Mesa {sessao.mesa.numero}</span>
                    <span className="text-sm text-gray-500">
                      Total: R$ {parseFloat(sessao.total).toFixed(2).replace('.', ',')}
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </div>
  );
}