"use client";

import { useState, useEffect } from "react";

export default function CategoryFormModal({
  isOpen,           
  onClose,          
  onSubmit,         
  categoryToEdit,   
  corPrincipal,
}) {
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      if (categoryToEdit) {
        setName(categoryToEdit.nome || '');
      } else {
        setName(''); 
      }
      setError(null);
    }
  }, [isOpen, categoryToEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    const result = await onSubmit({ nome: name });

    setIsLoading(false);
    if (result.success) {
      onClose();
    } else {
      setError(result.error || "Ocorreu um erro.");
    }
  };

  if (!isOpen) return null;

  const isEditMode = !!categoryToEdit;

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-lg shadow-xl w-full max-w-md"
      >
        <form onSubmit={handleSubmit}>
          <div className="flex justify-between items-center p-4 border-b">
            <h2 className="text-2xl font-bold text-gray-800">
              {isEditMode ? "Editar Categoria" : "Adicionar Nova Categoria"}
            </h2>
            <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl leading-none">&times;</button>
          </div>

          <div className="p-6">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome da Categoria</label>
            <input 
              type="text" 
              name="name" 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Ex: Pizzas Tradicionais"
            />
          </div>
          
          {error && <p className="text-sm text-red-600 px-6 pb-4">{error}</p>}

          <div className="flex justify-end p-4 bg-gray-50 rounded-b-lg border-t space-x-3">
            <button type="button" onClick={onClose} className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm transition-opacity disabled:opacity-50"
              style={{ backgroundColor: corPrincipal }}
            >
              {isLoading ? "A guardar..." : (isEditMode ? "Salvar Alterações" : "Adicionar Categoria")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
