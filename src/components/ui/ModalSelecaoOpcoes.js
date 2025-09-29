"use client";

import { useState, useEffect } from 'react';
import { getGruposOpcao } from '@/lib/api';

export default function ModalSelecaoOpcoes({ item, onConfirm, onCancel, corPrincipal }) {
  const [grupos, setGrupos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selecionados, setSelecionados] = useState({});
  const [quantidade, setQuantidade] = useState(1);

  useEffect(() => {
    const fetchOpcoes = async () => { 
      setIsLoading(true); 
      const token = localStorage.getItem("authToken"); 
      const data = await getGruposOpcao(token, item.id); 
      setGrupos(data); 
      setIsLoading(false); 
    }; 
    if (item?.id) { 
      fetchOpcoes(); 
    }
  }, [item]);

  const handleSelectionChange = (grupo, opcaoId) => {
    const grupoId = grupo.id; 
    const maxSelecoes = grupo.max_selecoes; 
    setSelecionados(prev => { 
      const atuais = prev[grupoId] || []; 
      const isSelecionado = atuais.includes(opcaoId); 
      let novos; 
      if (maxSelecoes === 1) { 
        novos = isSelecionado ? [] : [opcaoId]; 
      } else { 
        if (isSelecionado) { 
          novos = atuais.filter(id => id !== opcaoId); 
        } else { 
          if (atuais.length < maxSelecoes) { 
            novos = [...atuais, opcaoId]; 
          } else { 
            novos = atuais; 
          } 
        } 
      } 
      return { ...prev, [grupoId]: novos }; 
    });
  };

  const handleConfirmar = () => {
    // Validação de itens obrigatórios
    for (const grupo of grupos) { 
      const selecionadosNoGrupo = selecionados[grupo.id]?.length || 0; 
      if (grupo.obrigatorio && selecionadosNoGrupo < grupo.min_selecoes) { 
        alert(`É obrigatório escolher pelo menos ${grupo.min_selecoes} opção(ões) para "${grupo.nome}".`); 
        return; 
      } 
    }
    
    // Monta a estrutura de dados com os grupos
    const gruposSelecionados = [];
    for (const grupo of grupos) {
      const opcoesDesteGrupo = [];
      for (const opcao of grupo.itens_opcao) {
        if ((selecionados[grupo.id] || []).includes(opcao.id)) {
          opcoesDesteGrupo.push(opcao);
        }
      }
      if (opcoesDesteGrupo.length > 0) {
        gruposSelecionados.push({
          grupoId: grupo.id,
          grupoNome: grupo.nome,
          opcoes: opcoesDesteGrupo
        });
      }
    }

    onConfirm({
      gruposSelecionados: gruposSelecionados,
      quantidade: quantidade
    });
  };

  const renderContent = () => {
    if (isLoading) return <div className="text-center p-8">Carregando opções...</div>;
    
    return (
      <>
        {grupos.map(grupo => (
          <div key={grupo.id} className="mb-4 border-b last:border-b-0 pb-4">
            <h3 className="font-bold">{grupo.nome}</h3>
            <p className="text-xs text-gray-500 mb-2">Selecione de {grupo.min_selecoes} a {grupo.max_selecoes} opções. {grupo.obrigatorio && <span className="text-red-500 font-semibold">(Obrigatório)</span>}</p>
            {grupo.itens_opcao.map(opcao => (
              <div key={opcao.id} className="flex items-center">
                <input id={`opcao-${opcao.id}`} type={grupo.max_selecoes === 1 ? 'radio' : 'checkbox'} name={`grupo-${grupo.id}`} checked={(selecionados[grupo.id] || []).includes(opcao.id)} onChange={() => handleSelectionChange(grupo, opcao.id)} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"/>
                <label htmlFor={`opcao-${opcao.id}`} className="ml-3 block text-sm font-medium text-gray-700 w-full flex justify-between">
                  <span>{opcao.nome}</span>
                  <span>+ R$ {parseFloat(opcao.preco_adicional).toFixed(2)}</span>
                </label>
              </div>
            ))}
          </div>
        ))}
      </>
    );
  };

  return (
    <div onClick={onCancel} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold text-gray-800">Opções para: {item.nome}</h2>
        </div>
        <div className="p-4 max-h-[60vh] overflow-y-auto">{renderContent()}</div>
        <div className="p-4 bg-gray-50 rounded-b-lg border-t flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <button onClick={() => setQuantidade(q => Math.max(1, q - 1))} className="h-10 w-10 rounded-full border border-gray-300 text-xl font-bold flex items-center justify-center text-gray-700 hover:bg-gray-100">-</button>
            <span className="font-bold text-xl w-10 text-center">{quantidade}</span>
            <button onClick={() => setQuantidade(q => q + 1)} className="h-10 w-10 rounded-full border border-gray-300 text-xl font-bold flex items-center justify-center text-gray-700 hover:bg-gray-100">+</button>
          </div>
          <button onClick={handleConfirmar} className="text-white font-bold py-2 px-6 rounded-lg" style={{ backgroundColor: corPrincipal }}>
            Adicionar {quantidade} ao Pedido
          </button>
        </div>
      </div>
    </div>
  );
}