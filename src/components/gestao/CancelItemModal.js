// src/components/gestao/CancelItemModal.js

"use client";

export default function CancelItemModal({ item, onClose, onConfirm }) {
  if (!item) return null;

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-lg shadow-xl w-full max-w-sm"
      >
        <div className="p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            {/* Ícone de aviso */}
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            Cancelar Item
          </h3>
          <div className="mt-2 text-sm text-gray-600">
            <p>Tem a certeza de que quer cancelar o seguinte item?</p>
            <p className="font-bold mt-2">
              {item.quantidade}x {item.item_cardapio}
            </p>
          </div>
        </div>
        
        <div className="flex bg-gray-50 px-4 py-3 rounded-b-lg space-x-3">
          <button
            onClick={onConfirm}
            className="w-full rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
          >
            Sim, cancelar
          </button>
          <button
            onClick={onClose}
            className="w-full rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Não
          </button>
        </div>
      </div>
    </div>
  );
}