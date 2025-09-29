"use client";

import { useState } from "react";
import ModalSelecaoOpcoes from '@/components/ui/ModalSelecaoOpcoes';

export default function GarcomMenu({ 
  categorias, 
  itens, 
  onAdicionarAoCarrinho,
  corPrincipal 
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [itemParaOpcoes, setItemParaOpcoes] = useState(null);

  const filteredItems = itens.filter(item => 
    item.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdicionarClick = (item) => {
    if (item.tem_opcoes) {
      setItemParaOpcoes(item);
    } else {
      onAdicionarAoCarrinho({
        produtoId: item.id,
        nome: item.nome,
        preco: item.preco,
        gruposSelecionados: [],
        quantidade: 1
      });
    }
  };
  
  const handleConfirmarOpcoes = (dadosDoModal) => {
    // dadosDoModal = { gruposSelecionados: [ ... ], quantidade: X }
    
    // Repassa o objeto completo para a página pai
    onAdicionarAoCarrinho({
      produtoId: itemParaOpcoes.id,
      nome: itemParaOpcoes.nome,
      preco: itemParaOpcoes.preco,
      gruposSelecionados: dadosDoModal.gruposSelecionados, // Estrutura correta
      quantidade: dadosDoModal.quantidade
    });
    
    setItemParaOpcoes(null); // Fecha o modal
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow space-y-6">
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-gray-400">
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
          </svg>
        </div>
        <input 
          type="text"
          placeholder="Pesquisar item..."
          className="block w-full rounded-md border-0 py-2 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6"
          style={{ '--tw-ring-color': corPrincipal }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div>
        {categorias.map(categoria => {
          const itemsInCategory = filteredItems.filter(item => item.categoria === categoria.nome);
          if (itemsInCategory.length === 0) return null;

          return (
            <div key={categoria.id} className="mb-6">
              <h3 className="font-bold text-gray-800 border-b pb-2 mb-3 text-lg">{categoria.nome}</h3>
              <ul className="divide-y divide-gray-100">
                {itemsInCategory.map(item => (
                  <li key={item.id} className="flex justify-between items-center py-3">
                    <div>
                        <p className="text-gray-900 font-medium">{item.nome}</p>
                        <p className="text-sm text-gray-500">R$ {parseFloat(item.preco).toFixed(2)}</p>
                    </div>
                    <button 
                      onClick={() => handleAdicionarClick(item)}
                      className="bg-indigo-50 text-indigo-700 font-bold py-2 px-4 rounded-lg hover:bg-indigo-100 text-sm flex-shrink-0"
                    >
                      + Adicionar
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {itemParaOpcoes && (
        <ModalSelecaoOpcoes
          item={itemParaOpcoes}
          onCancel={() => setItemParaOpcoes(null)}
          onConfirm={handleConfirmarOpcoes}
          corPrincipal={corPrincipal}
        />
      )}
    </div>
  );
}

