"use client";

import Image from "next/image"; 

export default function MenuItemCard({ item, corPrincipal, onAddItem }) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden flex items-center space-x-4 p-3">
      
      <div className="w-28 h-28 flex-shrink-0 rounded-md bg-gray-200 relative overflow-hidden">
        {item.foto ? (
          <Image
            src={item.foto} 
            alt={`Foto de ${item.nome}`}
            fill 
            className="object-cover" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-gray-400 text-xs text-center">[ Imagem ]</span>
          </div>
        )}
      </div>
      
      <div className="flex flex-col flex-grow self-stretch">
        <h4 className="text-lg font-bold text-gray-800">{item.nome}</h4>
        <p className="text-sm text-gray-600 my-1 flex-grow">{item.descricao}</p>
        
        <div className="flex justify-between items-end mt-2">
          <p className="text-base font-bold text-gray-900">
            R$ {parseFloat(item.preco).toFixed(2).replace('.', ',')}
          </p>
          <button 
            className="text-white font-bold py-2 px-4 rounded-lg shadow hover:opacity-90 transition-opacity"
            style={{ backgroundColor: corPrincipal }}
            onClick={() => onAddItem(item)}
          >
            Adicionar
          </button>
        </div>
      </div>
    </div>
  );
}