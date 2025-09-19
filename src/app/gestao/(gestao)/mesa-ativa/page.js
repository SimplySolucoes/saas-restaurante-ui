"use client";

import { useEffect, useState, useRef } from "react";
import { getSessions, closeSession, updateItemStatus } from "@/lib/api";
import CancelItemModal from "@/components/gestao/CancelItemModal";

const StatusBadge = ({ item, onStatusChange }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const statusConfig = {
    recebido: { styles: 'bg-blue-100 text-blue-800 cursor-pointer hover:bg-blue-200', next: 'em_preparo', label: 'Recebido' },
    em_preparo: { styles: 'bg-yellow-100 text-yellow-800 cursor-pointer hover:bg-yellow-200', next: 'entregue', label: 'Em Preparo' },
    entregue: { styles: 'bg-green-100 text-green-800 cursor-not-allowed', next: null, label: 'Entregue' },
    cancelado: { styles: 'bg-red-100 text-red-800 cursor-not-allowed line-through', next: null, label: 'Cancelado' },
  };
  const currentStatus = statusConfig[item.status] || { styles: 'bg-gray-100 text-gray-800', next: null, label: item.status };

  const handleClick = async () => {
    if (!currentStatus.next || isUpdating) return;
    setIsUpdating(true);
    await onStatusChange(item.id, currentStatus.next);
    setIsUpdating(false);
  };
  return (
    <button onClick={handleClick} disabled={isUpdating || !currentStatus.next} className={`px-2 py-0.5 text-xs font-medium rounded-full transition-colors ${currentStatus.styles} ${isUpdating ? 'animate-pulse' : ''}`}>
      {currentStatus.label}
    </button>
  );
};

const getSessionPriority = (sessao) => {
  const todosOsItens = sessao.pedidos.flatMap(p => p.itens_pedido);
  if (todosOsItens.some(item => item.status === 'recebido')) return 1;
  if (todosOsItens.some(item => item.status === 'em_preparo')) return 2;
  return 3;
};

export default function GestaoDashboardPage() {
  const [sessoes, setSessoes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [itemToCancel, setItemToCancel] = useState(null);
  const sessoesRef = useRef([]);

  const carregarSessoes = async (isInitialLoad = false) => {
    if (isInitialLoad) setIsLoading(true);
    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Token de autenticação não encontrado.");
      setIsLoading(false);
      return;
    }
    const sessoesDaApi = await getSessions(token);
    if (sessoesDaApi) {
      if (JSON.stringify(sessoesDaApi) !== JSON.stringify(sessoesRef.current)) {
        setSessoes(sessoesDaApi);
        sessoesRef.current = sessoesDaApi;
      }
    } else {
      if(isInitialLoad) setError("Não foi possível carregar as sessões.");
    }
    if (isInitialLoad) setIsLoading(false);
  };

  useEffect(() => {
    carregarSessoes(true);
    const intervalId = setInterval(() => carregarSessoes(false), 5000);
    return () => clearInterval(intervalId);
  }, []);

  const handleFecharConta = async (sessaoId) => {
    const token = localStorage.getItem("authToken");
    const result = await closeSession(token, sessaoId);
    if (result && !result.error) {
      alert("Conta fechada com sucesso!");
      await carregarSessoes(false);
    } else {
      alert("Erro ao fechar a conta. Tente novamente.");
    }
  };

  const handleUpdateItemStatus = async (itemId, newStatus) => {
    const token = localStorage.getItem("authToken");
    const updatedItem = await updateItemStatus(token, itemId, newStatus);
    if (updatedItem && !updatedItem.error) {
      await carregarSessoes(false);
    } else {
      alert("Erro ao atualizar o status do item.");
    }
  };

  const handleConfirmCancelItem = async () => {
    if (!itemToCancel) return;
    await handleUpdateItemStatus(itemToCancel.id, 'cancelado');
    setItemToCancel(null);
  };

  if (isLoading) {
    return <div>A carregar as sessões ativas...</div>;
  }
  if (error) {
    return <div className="text-red-500">{error}</div>;
  }
  
  const sessoesAbertas = sessoes
    .filter(s => s.status === 'aberta')
    .sort((a, b) => getSessionPriority(a) - getSessionPriority(b));

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
            
            // --- LÓGICA DE ORDENAÇÃO DE ITENS ADICIONADA AQUI ---
            const statusOrder = {
              'recebido': 1,
              'em_preparo': 2,
              'entregue': 3,
              'cancelado': 4,
            };

            const todosOsItens = sessao.pedidos
              .flatMap(p => p.itens_pedido)
              .sort((a, b) => {
                const priorityA = statusOrder[a.status] || 99;
                const priorityB = statusOrder[b.status] || 99;
                return priorityA - priorityB;
              });
            // --- FIM DA LÓGICA DE ORDENAÇÃO ---

            const hasNewItems = todosOsItens.some(item => item.status === 'recebido');

            return (
              <div key={sessao.id} className={`bg-white rounded-lg shadow-md p-5 flex flex-col border-2 transition-colors ${hasNewItems ? 'border-indigo-500' : 'border-transparent'}`}>
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-bold text-gray-900">Mesa {sessao.mesa.numero}</h3>
                  <p className="text-xs text-gray-500">Aberta às: {new Date(sessao.data_abertura).toLocaleTimeString('pt-BR')}</p>
                </div>
                <div className="flex-grow space-y-3 mb-4 border-t border-b py-3 max-h-48 overflow-y-auto">
                  {todosOsItens.map(item => {
                    const groupedOptions = (item.opcoes_selecionadas || []).reduce((acc, option) => {
                      const groupName = option.grupo_opcao?.nome || 'Adicionais';
                      if (!acc[groupName]) {
                        acc[groupName] = [];
                      }
                      acc[groupName].push(option);
                      return acc;
                    }, {});

                    return (
                      <div key={item.id} className={`text-sm ${item.status === 'cancelado' ? 'opacity-50' : ''}`}>
                        <div className="flex justify-between items-center">
                          <span className={`font-semibold text-gray-700 ${item.status === 'cancelado' ? 'line-through' : ''}`}>
                            {item.quantidade}x {item.item_cardapio}
                          </span>
                          <div className="flex items-center space-x-2">
                            <StatusBadge item={item} onStatusChange={handleUpdateItemStatus} />
                            {item.status !== 'cancelado' && item.status !== 'entregue' && (
                              <button onClick={() => setItemToCancel(item)} title="Cancelar item" className="text-red-400 hover:text-red-600">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" /></svg>
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {Object.entries(groupedOptions).map(([groupName, options]) => (
                         <div key={groupName} className="pl-2 mt-1">
                           <span className="text-xs font-semibold text-gray-500">{groupName}:</span>
                             <ul className="pl-2">
                             {options.map(option => (
                             <li key={option.id} className="text-xs text-gray-600">
                              ↳ {option.nome}
                            </li>
                        ))}
                             </ul>
                          </div>
                        ))}
                      </div>
                    )
                  })}
                </div>
                <div className="mt-auto">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-gray-600 font-semibold">Total</p>
                    <p className="text-2xl font-bold text-indigo-600">R$ {parseFloat(sessao.total).toFixed(2).replace('.', ',')}</p>
                  </div>
                  <button onClick={() => handleFecharConta(sessao.id)} className="w-full bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors">
                    Fechar Conta
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
      <CancelItemModal 
        item={itemToCancel}
        onClose={() => setItemToCancel(null)}
        onConfirm={handleConfirmCancelItem}
      />
    </div>
  );
}