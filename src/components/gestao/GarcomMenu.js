"use client";

import { useState } from "react";

export default function GarcomMenu({ 
  categorias, 
  itens, 
  onBack, 
  onSubmitOrder, 
  corPrincipal 
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [comanda, setComanda] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredItems = itens.filter(item => 
    item.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleQuantityChange = (item, amount) => {
    setComanda(prev => {
      const currentQuantity = prev[item.id] || 0;
      const newQuantity = Math.max(0, currentQuantity + amount);
      const newComanda = { ...prev };
      if (newQuantity === 0) {
        delete newComanda[item.id];
      } else {
        newComanda[item.id] = newQuantity;
      }
      return newComanda;
    });
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    const itensParaEnviar = Object.entries(comanda).map(([itemId, quantity]) => ({
      id: parseInt(itemId),
      quantity: quantity,
    }));
    await onSubmitOrder(itensParaEnviar);
    setIsSubmitting(false);
  };
  
  const totalItems = Object.values(comanda).reduce((sum, qty) => sum + qty, 0);

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] bg-white p-4 rounded-lg shadow-md">
      {/* --- BARRA DE PESQUISA MELHORADA --- */}
      <div className="relative mb-4">
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

      {/* --- LISTA DE ITENS DO CARDÁPIO --- */}
      <div className="flex-grow overflow-y-auto pr-2">
        {categorias.map(categoria => {
          const itemsInCategory = filteredItems.filter(item => item.categoria === categoria.nome);
          if (itemsInCategory.length === 0) return null;

          return (
            <div key={categoria.id} className="mb-4">
              <h3 className="font-bold text-gray-800 border-b pb-1 mb-2">{categoria.nome}</h3>
              <ul className="divide-y divide-gray-100">
                {itemsInCategory.map(item => (
                  <li key={item.id} className="flex justify-between items-center py-3">
                    <span className="text-gray-900 font-medium">{item.nome}</span>
                    <div className="flex items-center space-x-3">
                      <button 
                        onClick={() => handleQuantityChange(item, -1)} 
                        className="h-8 w-8 rounded-full border border-gray-300 text-lg font-bold flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        -
                      </button>
                      <span className="font-bold text-lg w-8 text-center text-gray-800">{comanda[item.id] || 0}</span>
                      <button 
                        onClick={() => handleQuantityChange(item, 1)} 
                        className="h-8 w-8 rounded-full border border-gray-300 text-lg font-bold flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="mt-4 border-t pt-4 flex gap-4">
        <button onClick={onBack} className="w-1/3 text-center text-sm text-gray-700 bg-gray-200 hover:bg-gray-300 font-bold py-3 px-4 rounded-lg transition-colors">
          Cancelar
        </button>
        <button
          onClick={handleFinalSubmit}
          disabled={totalItems === 0 || isSubmitting}
          className="w-2/3 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-opacity disabled:opacity-50"
          style={{ backgroundColor: corPrincipal }}
        >
          {isSubmitting ? "A enviar..." : `Enviar Pedido (${totalItems} Itens)`}
        </button>
      </div>
    </div>
  );
}

