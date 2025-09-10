// src/app/gestao/(gestao)/page.js

"use client";

import { useEffect, useState } from "react";
import { getSessions, closeSession, updateItemStatus } from "@/lib/api";
import CancelItemModal from "@/components/gestao/CancelItemModal"; // 1. Importamos a nossa nova modal

const StatusBadge = ({ item, onStatusChange }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const statusConfig = {
    recebido: { styles: 'bg-blue-100 text-blue-800 cursor-pointer hover:bg-blue-200', next: 'em_preparo' },
    em_preparo: { styles: 'bg-yellow-100 text-yellow-800 cursor-pointer hover:bg-yellow-200', next: 'entregue' },
    entregue: { styles: 'bg-green-100 text-green-800 cursor-not-allowed', next: null },
    cancelado: { styles: 'bg-red-100 text-red-800 cursor-not-allowed line-through', next: null },
  };
  const currentStatusConfig = statusConfig[item.status] || { styles: 'bg-gray-100 text-gray-800', next: null };
  const handleClick = async () => {
    if (!currentStatusConfig.next || isUpdating) return;
    setIsUpdating(true);
    await onStatusChange(item.id, currentStatusConfig.next);
    setIsUpdating(false);
  };
  return (
    <button 
      onClick={handleClick}
      disabled={isUpdating || !currentStatusConfig.next}
      className={`px-2 py-0.5 text-xs font-medium rounded-full transition-colors ${currentStatusConfig.styles} ${isUpdating ? 'animate-pulse' : ''}`}
    >
      {item.status.replace('_', ' ')}
    </button>
  );
};

export default function GestaoDashboardPage() {
  const [sessoes, setSessoes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 2. Novo estado para controlar qual item está a ser cancelado na modal
  const [itemToCancel, setItemToCancel] = useState(null);

  const carregarSessoes = async () => {
    if(!isLoading) setIsLoading(true);
    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Token de autenticação não encontrado.");
      setIsLoading(false);
      return;
    }
    const sessoesDaApi = await getSessions(token);
    if (sessoesDaApi) {
      setSessoes(sessoesDaApi);
    } else {
      setError("Não foi possível carregar as sessões.");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    carregarSessoes();
  }, []);

  const handleFecharConta = async (sessaoId) => {
    const token = localStorage.getItem("authToken");
    const result = await closeSession(token, sessaoId);
    if (result && !result.error) {
      alert("Conta fechada com sucesso!");
      setSessoes(prevSessoes => prevSessoes.filter(s => s.id !== sessaoId));
    } else {
      alert("Erro ao fechar a conta. Tente novamente.");
    }
  };

  const handleUpdateItemStatus = async (itemId, newStatus) => {
    const token = localStorage.getItem("authToken");
    const updatedItem = await updateItemStatus(token, itemId, newStatus);
    if (updatedItem && !updatedItem.error) {
      await carregarSessoes();
    } else {
      alert("Erro ao atualizar o status do item.");
    }
  };

  // 3. Nova função que é chamada quando o botão "Sim, cancelar" da modal é clicado
  const handleConfirmCancelItem = async () => {
    if (!itemToCancel) return;
    await handleUpdateItemStatus(itemToCancel.id, 'cancelado');
    setItemToCancel(null); // Fecha a modal após a ação
  };

  if (isLoading) {
    return <div>A carregar as sessões ativas...</div>;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }
  
  const sessoesAbertas = sessoes.filter(s => s.status === 'aberta');

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Sessões Ativas</h1>
      
      {sessoesAbertas.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <p className="text-gray-500">Não há nenhuma conta aberta no momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sessoesAbertas.map((sessao) => {
            const todosOsItens = sessao.pedidos.flatMap(p => p.itens_pedido);
            return (
              <div key={sessao.id} className="bg-white rounded-lg shadow-md p-5 flex flex-col">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-bold text-gray-900">Mesa {sessao.mesa.numero}</h3>
                  <p className="text-xs text-gray-500">Aberta às: {new Date(sessao.data_abertura).toLocaleTimeString('pt-BR')}</p>
                </div>
                <div className="flex-grow space-y-2 mb-4 border-t border-b py-3 max-h-48 overflow-y-auto">
                  {todosOsItens.map(item => (
                    <div key={item.id} className={`flex justify-between items-center text-sm ${item.status === 'cancelado' ? 'opacity-50' : ''}`}>
                      <span className={`text-gray-700 ${item.status === 'cancelado' ? 'line-through' : ''}`}>
                        {item.quantidade}x {item.item_cardapio}
                      </span>
                      <div className="flex items-center space-x-2">
                        <StatusBadge item={item} onStatusChange={handleUpdateItemStatus} />
                        {item.status !== 'cancelado' && item.status !== 'entregue' && (
                          // 4. O botão de cancelar agora abre a modal
                          <button onClick={() => setItemToCancel(item)} title="Cancelar item" className="text-red-400 hover:text-red-600">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-auto">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-gray-600 font-semibold">Total</p>
                    <p className="text-2xl font-bold text-indigo-600">
                      R$ {parseFloat(sessao.total).toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleFecharConta(sessao.id)}
                    className="w-full bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Fechar Conta
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 5. Renderizamos a nossa nova modal de cancelamento */}
      <CancelItemModal 
        item={itemToCancel}
        onClose={() => setItemToCancel(null)}
        onConfirm={handleConfirmCancelItem}
      />
    </div>
  );
}