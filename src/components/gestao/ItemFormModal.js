"use client";

import { useState, useEffect } from "react";

export default function ItemFormModal({
  isOpen, onClose, onSubmit, itemToEdit, categorias, corPrincipal,
}) {

  const [formData, setFormData] = useState({ nome: '', descricao: '', preco: '', categoria: '' });
  const [fotoFile, setFotoFile] = useState(null); 
  const [fotoPreview, setFotoPreview] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setIsLoading(false);

      if (itemToEdit) {
        setFormData({
          nome: itemToEdit.nome || '',
          descricao: itemToEdit.descricao || '',
          preco: itemToEdit.preco || '',
          categoria: itemToEdit.categoria_id || categorias.find(c => c.nome === itemToEdit.categoria)?.id || '',
        });
        setFotoPreview(itemToEdit.foto || '');
        setFotoFile(null); 
      } else {
        setFormData({ nome: '', descricao: '', preco: '', categoria: '' });
        setFotoPreview('');
        setFotoFile(null);
      }
    }
  }, [isOpen, itemToEdit, categorias]); 
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFotoFile(file);
      setFotoPreview(URL.createObjectURL(file));
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const dadosParaEnviar = { ...formData, foto: fotoFile }; 
    
    const result = await onSubmit(dadosParaEnviar);

    setIsLoading(false);
    if (result && !result.success) {
      setError(result.error || "Ocorreu um erro desconhecido.");
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-start p-4 overflow-y-auto"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl my-8"
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-2xl font-bold text-gray-800">
            {itemToEdit ? `Editar Item: ${itemToEdit.nome}` : "Adicionar Novo Item"}
          </h2>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
              <label htmlFor="nome" className="block text-sm font-medium text-gray-700">Nome do Item</label>
              <input type="text" name="nome" id="nome" value={formData.nome} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"/>
            </div>
            <div>
              <label htmlFor="descricao" className="block text-sm font-medium text-gray-700">Descrição</label>
              <textarea name="descricao" id="descricao" value={formData.descricao} onChange={handleChange} rows="3" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"></textarea>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="preco" className="block text-sm font-medium text-gray-700">Preço Base (R$)</label>
                <input type="number" name="preco" id="preco" value={formData.preco} onChange={handleChange} required step="0.01" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm" placeholder="ex: 45.50"/>
              </div>
              <div>
                <label htmlFor="categoria" className="block text-sm font-medium text-gray-700">Categoria</label>
                <select name="categoria" id="categoria" value={formData.categoria} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                  <option value="" disabled>Selecione...</option>
                  {categorias.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nome}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Foto do Item</label>
              <div className="mt-1 flex items-center space-x-4">
                {fotoPreview ? <img src={fotoPreview} alt="Pré-visualização" className="h-20 w-20 rounded-md object-cover"/> : <div className="h-20 w-20 rounded-md bg-gray-100 flex items-center justify-center text-gray-400 text-sm">Sem foto</div>}
                <input type="file" onChange={handleFotoChange} accept="image/*" className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"/>
              </div>
            </div>
          </div>
          
          {error && <p className="text-sm text-red-600 px-6 pb-4">{error}</p>}

          <div className="flex justify-end p-4 bg-gray-50 rounded-b-lg border-t space-x-3">
            <button type="button" onClick={onClose} className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit" disabled={isLoading} className="rounded-md px-6 py-2 text-sm font-semibold text-white shadow-sm transition-opacity disabled:opacity-50" style={{ backgroundColor: corPrincipal }}>
              {isLoading ? "Salvando..." : (itemToEdit ? "Salvar Alterações" : "Salvar Item")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}