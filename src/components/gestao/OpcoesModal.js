"use client";

import { useState, useEffect } from 'react';
import { 
    getGruposOpcao,
    createGrupoOpcao, updateGrupoOpcao, deleteGrupoOpcao,
    createItemOpcao, updateItemOpcao, deleteItemOpcao
} from '@/lib/api';

// --- Ícones ---
const EditIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg> );
const DeleteIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg> );
const SaveIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg> );
const AddIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>);
const CancelIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>);


const GrupoEditor = ({ grupo, corPrincipal, onReloadGrupos }) => {
    const [isEditingGrupo, setIsEditingGrupo] = useState(false);
    const [grupoFormData, setGrupoFormData] = useState(grupo);
    
    const [novoItemNome, setNovoItemNome] = useState('');
    const [novoItemPreco, setNovoItemPreco] = useState('');
    
    const [editingItemId, setEditingItemId] = useState(null);
    const [editingItemData, setEditingItemData] = useState({ nome: '', preco_adicional: '' });

    const token = typeof window !== 'undefined' ? localStorage.getItem("authToken") : null;

    useEffect(() => {
        setGrupoFormData(grupo);
    }, [grupo]);

    const handleSaveGrupo = async () => {
        if (!token) return;
        const payload = {
            nome: grupoFormData.nome,
            min_selecoes: grupoFormData.min_selecoes,
            max_selecoes: grupoFormData.max_selecoes,
            obrigatorio: grupoFormData.obrigatorio,
        };
        await updateGrupoOpcao(token, grupo.id, payload);
        onReloadGrupos();
        setIsEditingGrupo(false);
    };

    const handleAddItemOpcao = async () => {
        if (!token || !grupo.id || !novoItemNome) return;
        const payload = {
            nome: novoItemNome,
            preco_adicional: parseFloat(novoItemPreco || 0).toFixed(2),
        };
        await createItemOpcao(token, grupo.id, payload);
        setNovoItemNome('');
        setNovoItemPreco('');
        onReloadGrupos();
    };

    const handleEditItemClick = (item) => {
        setEditingItemId(item.id);
        setEditingItemData({ nome: item.nome, preco_adicional: item.preco_adicional });
    };

    const handleSaveItemOpcao = async (itemId) => {
        if (!token) return;
        const payload = {
            nome: editingItemData.nome,
            preco_adicional: parseFloat(editingItemData.preco_adicional || 0).toFixed(2),
        };
        await updateItemOpcao(token, itemId, payload);
        setEditingItemId(null);
        onReloadGrupos();
    };
    
    const handleDeleteItem = async (itemId) => {
        if (window.confirm('Tem certeza que deseja apagar esta opção?')) {
            await deleteItemOpcao(token, itemId);
            onReloadGrupos();
        }
    };

    return (
        <div className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
            {isEditingGrupo ? (
                <div className="space-y-3">
                    <input type="text" value={grupoFormData.nome} onChange={(e) => setGrupoFormData({...grupoFormData, nome: e.target.value})} className="w-full text-sm p-1 border rounded" placeholder="Nome do Grupo"/>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                        <input type="number" value={grupoFormData.min_selecoes} onChange={(e) => setGrupoFormData({...grupoFormData, min_selecoes: parseInt(e.target.value) || 0})} className="w-full p-1 border rounded" placeholder="Mín. Seleções"/>
                        <input type="number" value={grupoFormData.max_selecoes} onChange={(e) => setGrupoFormData({...grupoFormData, max_selecoes: parseInt(e.target.value) || 1})} className="w-full p-1 border rounded" placeholder="Máx. Seleções"/>
                        <label className="flex items-center gap-1 justify-center"><input type="checkbox" checked={grupoFormData.obrigatorio} onChange={(e) => setGrupoFormData({...grupoFormData, obrigatorio: e.target.checked})}/> Obrigatório</label>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => setIsEditingGrupo(false)} className="text-xs text-gray-600 hover:text-gray-800">Cancelar</button>
                        <button type="button" onClick={handleSaveGrupo} className="text-xs font-bold text-white py-1 px-3 rounded" style={{backgroundColor: corPrincipal}}><SaveIcon /></button>
                    </div>
                </div>
            ) : (
                <div className="flex justify-between items-center">
                    <div>
                        <h4 className="font-semibold text-gray-700">{grupo.nome}</h4>
                        <p className="text-xs text-gray-500">{`Seleção de ${grupo.min_selecoes} a ${grupo.max_selecoes} itens.`} {grupo.obrigatorio && "(Obrigatório)"}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button type="button" onClick={() => setIsEditingGrupo(true)} className="text-gray-500 hover:text-indigo-600"><EditIcon /></button>
                    </div>
                </div>
            )}

            <div className="pl-4 mt-2 border-l-2 border-gray-200 space-y-2">
                {grupo.itens_opcao.map(item => (
                    <div key={item.id}>
                        {editingItemId === item.id ? (
                            <div className="flex gap-2 items-center p-2 bg-white rounded shadow">
                                <input type="text" value={editingItemData.nome} onChange={(e) => setEditingItemData({...editingItemData, nome: e.target.value})} className="flex-grow text-sm p-1 border rounded"/>
                                <input type="number" step="0.01" value={editingItemData.preco_adicional} onChange={(e) => setEditingItemData({...editingItemData, preco_adicional: e.target.value})} className="w-24 text-sm p-1 border rounded" placeholder="Preço Adic."/>
                                <button type="button" onClick={() => handleSaveItemOpcao(item.id)} className="text-green-600 hover:text-green-800"><SaveIcon /></button>
                                <button type="button" onClick={() => setEditingItemId(null)} className="text-gray-500 hover:text-gray-700"><CancelIcon /></button>
                            </div>
                        ) : (
                            <div className="flex justify-between items-center text-sm py-1 px-2">
                                <span className="text-gray-800">{item.nome}</span>
                                <div className="flex items-center gap-3">
                                    <span className="font-medium text-gray-800">+ R$ {parseFloat(item.preco_adicional).toFixed(2)}</span>
                                    <button onClick={() => handleEditItemClick(item)} className="text-gray-500 hover:text-indigo-600"><EditIcon /></button>
                                    <button onClick={() => handleDeleteItem(item.id)} className="text-gray-500 hover:text-red-600"><DeleteIcon /></button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                <div className="flex gap-2 pt-2 border-t mt-2">
                    <input type="text" value={novoItemNome} onChange={(e) => setNovoItemNome(e.target.value)} className="flex-grow text-sm p-1 border rounded" placeholder="Nome da nova opção"/>
                    <input type="number" step="0.01" value={novoItemPreco} onChange={(e) => setNovoItemPreco(e.target.value)} className="w-24 text-sm p-1 border rounded" placeholder="Preço Adic."/>
                    <button type="button" onClick={handleAddItemOpcao} disabled={!novoItemNome} className="text-white p-2 rounded flex items-center justify-center disabled:opacity-50" style={{backgroundColor: corPrincipal}}>
                        <AddIcon />
                    </button>
                </div>
            </div>
        </div>
    );
};


export default function OpcoesModal({ item, onClose, corPrincipal }) {
  const [grupos, setGrupos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [novoGrupoNome, setNovoGrupoNome] = useState('');
  const token = typeof window !== 'undefined' ? localStorage.getItem("authToken") : null;
  console.log("Objeto 'item' recebido pelo OpcoesModal:", item);

  const fetchGrupos = async () => {
    console.log("1. Iniciando busca de grupos para o item ID:", item?.id);

    if (!token || !item?.id) { 
        setError("Item ID ou token de autenticação não disponível."); 
        setIsLoading(false); 
        console.log("-> Busca cancelada, token ou ID ausente.");
        return; 
    }
    
    setIsLoading(true); 
    setError(null);

    try {
        const gruposData = await getGruposOpcao(token, item.id);
        console.log("2. API respondeu com sucesso. Dados recebidos:", gruposData);
        setGrupos(gruposData);
    } catch (e) {
        console.error("-> Erro na busca da API:", e);
        setError("Falha ao carregar os grupos de opções.");
    } finally {
        console.log("3. Finalizando busca, definindo isLoading para false.");
        setIsLoading(false);
    }
  };
  useEffect(() => {
    if (item?.id) {
        fetchGrupos();
    }
  }, [item?.id]);

  if (!item) return null;

  const handleAddGrupo = async () => {
      if (!token || !item.id || !novoGrupoNome) return;
      const payload = {
          nome: novoGrupoNome,
          min_selecoes: 0,
          max_selecoes: 1,
          obrigatorio: false
      };
      await createGrupoOpcao(token, item.id, payload);
      setNovoGrupoNome('');
      await fetchGrupos();
  };
  
  const handleDeleteGrupo = async (grupoId) => {
    if (!token) return;
    if (window.confirm("Tem certeza que deseja apagar este grupo? Todas as opções dentro dele também serão apagadas.")) {
      await deleteGrupoOpcao(token, grupoId);
      await fetchGrupos();
    }
  };

  const renderContent = () => {
    if (isLoading) return <div className="text-center py-8">A carregar opções...</div>;
    if (error) return <div className="text-center py-8 text-red-600">{error}</div>;
    return (
      <div className="space-y-6">
          <div className="flex gap-2 items-center bg-blue-50 p-3 rounded-lg border border-blue-200">
              <input type="text" value={novoGrupoNome} onChange={(e) => setNovoGrupoNome(e.target.value)} className="flex-grow text-sm p-2 border rounded-md" placeholder="Nome do novo grupo (ex: Tamanho)"/>
              <button type="button" onClick={handleAddGrupo} disabled={!novoGrupoNome} className="text-white font-bold py-2 px-4 rounded-lg text-sm disabled:opacity-50 flex items-center gap-1" style={{backgroundColor: corPrincipal}}>
                  <AddIcon /> Adicionar Grupo
              </button>
          </div>
          <div className="space-y-4">
              {grupos.map(grupo => (
                <div key={grupo.id}>
                  <div className="flex justify-between items-center mb-1">
                      <h4 className="font-semibold text-gray-700">{grupo.nome}</h4>
                      <button onClick={() => handleDeleteGrupo(grupo.id)} className="text-gray-400 hover:text-red-600 text-xs">Apagar Grupo</button>
                  </div>
                  <GrupoEditor grupo={grupo} corPrincipal={corPrincipal} onReloadGrupos={fetchGrupos} />
                </div>
              ))}
              {grupos.length === 0 && <p className="text-gray-500 text-sm italic">Ainda não há grupos de opções para este item.</p>}
          </div>
      </div>
    );
  };

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
            Gerir Opções de: {item.nome}
          </h2>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl leading-none">&times;</button>
        </div>
        <div className="p-6">
          {renderContent()}
        </div>
        <div className="flex justify-end p-4 bg-gray-50 rounded-b-lg border-t">
          <button 
            type="button" 
            onClick={onClose} 
            className="rounded-md px-6 py-2 text-sm font-semibold text-white shadow-sm"
            style={{ backgroundColor: corPrincipal }}
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
}