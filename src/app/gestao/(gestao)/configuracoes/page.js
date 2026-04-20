"use client";

import { useEffect, useState } from "react";
import { 
  getGestaoCategorias, 
  getGestaoItensCardapio,
  getMesas, 
  getRestaurante,
  baixarQrcodeCardapioPublico,
  updateRestaurante,
  createMenuItem, updateMenuItem, deleteMenuItem,
  createCategory, updateCategory, deleteCategory,
  toggleItemDisponibilidade 
} from "@/lib/api/index";
import ItemFormModal from "@/components/gestao/ItemFormModal";
import CategoryFormModal from "@/components/gestao/CategoryFormModal";
import OpcoesModal from '@/components/gestao/OpcoesModal';
import useAuth from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { navFlagsFromRestaurante, MODO_LABEL } from '@/lib/gestaoNav';


const WhatsAppIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.894 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.886-.001 2.269.655 4.502 1.906 6.344l-.295 1.023 1.07 1.031zM18.33 13.925c-.217-.112-.524-.26-1.517-.756-.471-.235-.82-.372-1.127-.088-.31.28-.6.732-.737.886-.137.155-.276.173-.523.062-.247-.11-.926-.34-.1763-1.057-.652-.569-1.104-1.26-1.225-1.485-.121-.225-.012-.354.099-.464.111-.111.247-.277.37-.423.122-.144.162-.24.24-.403.078-.166.038-.31-.02-.423-.058-.112-.51-.121-1.127-1.319-1.182-1.16-1.16-1.16-1.745-.698-.396.315-1.002.973-1.127 2.113-.125 1.14.83 2.522.95 2.671.12.149 1.942 3.018 4.819 4.223 2.877 1.205 2.877.803 3.402.746.525-.057 1.517-.613 1.73-1.227.212-.613.212-1.14-.049-1.258z"/></svg> );
const DownloadIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /> </svg> );

const GerirCardapio = ({ categorias, itensFiltrados, onEditItem, onDeleteItem, onEditCategory, onDeleteCategory, onToggleDisponibilidade, searchTerm }) => {
  return ( <div className="space-y-8 mt-6"> {categorias.map((categoria) => { const itemsInCategory = itensFiltrados.filter(item => item.categoria === categoria.nome); if (itemsInCategory.length === 0 && searchTerm.length > 0) return null; return ( <div key={categoria.id} className="bg-white p-6 rounded-lg shadow-md"> <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-300"> <h2 className="text-xl font-semibold text-gray-700">{categoria.nome}</h2> <div className="space-x-3"> <button onClick={() => onEditCategory(categoria)} className="text-sm text-indigo-600 hover:underline">Editar</button> <button onClick={() => onDeleteCategory(categoria)} className="text-sm text-red-600 hover:underline">Apagar</button> </div> </div> <ul className="divide-y divide-gray-200"> {itemsInCategory.map(item => ( <li key={item.id} className="py-3 flex justify-between items-center"> <div className="flex items-center gap-4"> <input type="checkbox" className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer" checked={item.disponivel} onChange={() => onToggleDisponibilidade(item)} /> <span className={`font-medium ${item.disponivel ? 'text-gray-800' : 'text-gray-400 line-through'}`}> {item.nome} </span> </div> <div className="space-x-3"> <button onClick={() => onEditItem(item)} className="text-sm text-indigo-600 hover:underline">Editar</button> <button onClick={() => onDeleteItem(item)} className="text-sm text-red-600 hover:underline">Apagar</button> </div> </li> ))} {itemsInCategory.length === 0 && ( <li className="py-3 text-sm text-gray-500">Nenhum item nesta categoria.</li> )} </ul> </div> ); })} </div> );
};
const GerirMesas = ({ mesas, restaurante }) => { 
  const [isZipping, setIsZipping] = useState(false); const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001/api"; const handleDownloadUnico = async (mesaId, numeroMesa) => { const token = localStorage.getItem("authToken"); if (!token) { alert("Erro de autenticação. Por favor, faça login novamente."); return; } const url = `${API_URL}/mesas/${mesaId}/baixar-qrcode/`; try { const response = await fetch(url, { headers: { 'Authorization': `Token ${token}` } }); if (!response.ok) throw new Error(`Falha ao baixar a imagem (Status: ${response.status})`); const blob = await response.blob(); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `qrcode-mesa-${numeroMesa}.png`; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(link.href); } catch (error) { console.error("Erro ao baixar o QR code:", error); alert("Não foi possível baixar o QR code. Verifique a consola para mais detalhes."); } }; const handleDownloadTodos = async () => { const token = localStorage.getItem("authToken"); if (!token) { alert("Erro de autenticação. Por favor, faça login novamente."); return; } if (typeof JSZip === 'undefined') { alert("Aguarde um momento e tente novamente."); return; } setIsZipping(true); const zip = new JSZip(); try { await Promise.all(mesas.map(async (mesa) => { const url = `${API_URL}/mesas/${mesa.id}/baixar-qrcode/`; const response = await fetch(url, { headers: { 'Authorization': `Token ${token}` } }); if (response.ok) { const blob = await response.blob(); zip.file(`qrcode-mesa-${mesa.numero}.png`, blob); } })); const content = await zip.generateAsync({ type: "blob" }); const link = document.createElement('a'); link.href = URL.createObjectURL(content); link.download = `qrcodes-${restaurante?.slug || 'mesas'}.zip`; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(link.href); } catch (error) { console.error("Erro ao gerar o ficheiro .zip:", error); alert("Ocorreu um erro ao gerar o ficheiro .zip."); } finally { setIsZipping(false); } }; return ( <div className="mt-6 bg-white p-6 rounded-lg shadow-md"> <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-300"> <h2 className="text-xl font-semibold text-gray-700">Mesas do Restaurante</h2> {mesas.length > 0 && ( <button onClick={handleDownloadTodos} disabled={isZipping} className="flex items-center gap-2 bg-gray-700 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-800 disabled:bg-gray-400"> <DownloadIcon /> {isZipping ? 'A gerar...' : 'Baixar Todos'} </button> )} </div> {mesas.length > 0 ? ( <ul className="divide-y divide-gray-200"> {mesas.map(mesa => ( <li key={mesa.id} className="py-3 flex justify-between items-center"> <span className="font-medium text-gray-800">Mesa {mesa.numero}</span> <button onClick={() => handleDownloadUnico(mesa.id, mesa.numero)} className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-2"> <DownloadIcon /> Baixar QR Code </button> </li> ))} </ul> ) : ( <p className="text-gray-500 py-3">Ainda não há mesas configuradas.</p> )} </div> );
};
const GerirRestaurante = ({ restaurante, onSave, ocultarCamposMesas }) => {
  const [formData, setFormData] = useState({ nome: '', cor_principal: '#4F46E5', quantidade_mesas: 0 });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [siteOrigin, setSiteOrigin] = useState('');
  const [isGerandoQrCardapio, setIsGerandoQrCardapio] = useState(false);

  useEffect(() => {
    setSiteOrigin(typeof window !== 'undefined' ? window.location.origin : '');
  }, []);

  const linkCardapioPublico =
    restaurante?.slug && siteOrigin ? `${siteOrigin}/cardapio/${restaurante.slug}` : '';

  const handleGerarQrCardapio = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    if (!token) {
      alert('Sessão inválida. Faça login novamente.');
      return;
    }
    setIsGerandoQrCardapio(true);
    try {
      const result = await baixarQrcodeCardapioPublico(token);
      if (result.error) {
        alert(result.error);
        return;
      }
      const link = document.createElement('a');
      link.href = URL.createObjectURL(result.blob);
      link.download = `qrcode-cardapio-${restaurante.slug}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error('Erro ao obter QR code do cardápio:', err);
      alert('Não foi possível obter o QR code. Tente novamente.');
    } finally {
      setIsGerandoQrCardapio(false);
    }
  };

  useEffect(() => {
    if (restaurante) {
      setFormData({
        nome: restaurante.nome || '',
        cor_principal: restaurante.cor_principal || '#4F46E5',
        quantidade_mesas: restaurante.quantidade_mesas || 0,
      });
      setLogoPreview(restaurante.logo || '');
    }
  }, [restaurante]);
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    await onSave({ ...formData, logo: logoFile });
    setIsSaving(false);
  };
  return (
    <form onSubmit={handleSubmit} className="mt-6 bg-white p-6 rounded-lg shadow-md">
      <div className="pb-4 mb-6 border-b border-gray-300">
        <h2 className="text-xl font-semibold text-gray-700">Configurações do Restaurante</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        <div className="space-y-6">
          <div>
            <label htmlFor="nome" className="block text-sm font-medium text-gray-700">Nome do Restaurante</label>
            <input type="text" name="nome" id="nome" value={formData.nome} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
            {restaurante?.slug && (
              <div className="mt-3 max-w-xl">
                <label htmlFor="link-cardapio-publico" className="text-xs font-medium text-gray-500">
                  Cardápio público (só leitura)
                </label>
                <div className="mt-1 flex flex-wrap items-stretch gap-2">
                  <input
                    id="link-cardapio-publico"
                    type="text"
                    readOnly
                    tabIndex={-1}
                    value={linkCardapioPublico || 'A carregar…'}
                    className="min-w-[12rem] flex-1 rounded-md border border-gray-300 bg-gray-50 px-2 py-1.5 text-sm text-gray-800 shadow-sm cursor-default"
                  />
                  <button
                    type="button"
                    onClick={handleGerarQrCardapio}
                    disabled={isGerandoQrCardapio}
                    className="rounded-md bg-gray-800 px-3 py-1.5 text-sm font-semibold text-white hover:bg-gray-900 disabled:cursor-not-allowed disabled:bg-gray-400"
                  >
                    {isGerandoQrCardapio ? 'A obter…' : 'QR Code'}
                  </button>
                </div>
              </div>
            )}
          </div>
          {!ocultarCamposMesas && (
            <div>
              <label htmlFor="quantidade_mesas" className="block text-sm font-medium text-gray-700">Número Total de Mesas</label>
              <input type="number" name="quantidade_mesas" id="quantidade_mesas" value={formData.quantidade_mesas} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
              <p className="mt-1 text-xs text-gray-500">O sistema irá criar ou apagar mesas para corresponder a este número.</p>
            </div>
          )}
        </div>
        <div className="space-y-6">
          <div>
            <label htmlFor="cor_principal" className="block text-sm font-medium text-gray-700">Cor Principal</label>
            <div className="mt-1 flex items-center gap-3">
              <input type="color" name="cor_principal" id="cor_principal" value={formData.cor_principal} onChange={handleChange} className="h-10 w-14 rounded-md border-gray-300 p-1" />
              <span className="font-mono text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">{formData.cor_principal}</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Logo</label>
            <div className="mt-1 flex items-center space-x-4">
              {logoPreview ? <img src={logoPreview} alt="Logo preview" className="h-16 w-16 rounded-full object-cover" /> : <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">?</div>}
              <input type="file" onChange={handleLogoChange} accept="image/*" className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer" />
            </div>
          </div>
        </div>
      </div>
      <div className="pt-6 mt-6 border-t border-gray-200 text-right">
        <button type="submit" disabled={isSaving} className="bg-indigo-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300">
          {isSaving ? 'A Guardar...' : 'Guardar Alterações'}
        </button>
      </div>
    </form>
  );
};

export default function ConfiguracoesPage() {

  const { user, isAdmin, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthLoading) {

      if (!isAdmin) {
        alert("Acesso negado. Apenas administradores podem aceder a esta página.");
        router.push('/gestao'); 
      }
    }
  }, [isAuthLoading, isAdmin, router]);
  const [categorias, setCategorias] = useState([]);
  const [itens, setItens] = useState([]);
  const [mesas, setMesas] = useState([]);
  const [restaurante, setRestaurante] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('cardapio');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isItemModalOpen, setItemModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);
  const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState(null);

  const [itemParaGerirOpcoes, setItemParaGerirOpcoes] = useState(null);


  const carregarDados = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Token de autenticação não encontrado.");
      setIsLoading(false); return;
    }
    try {
      const [categoriasData, itensData, mesasData, restauranteData] = await Promise.all([
        getGestaoCategorias(token), 
        getGestaoItensCardapio(token),
        getMesas(token),
        getRestaurante(token)
      ]);
      setCategorias(categoriasData);
      setItens(itensData);
      setMesas(mesasData);
      setRestaurante(restauranteData);
    } catch (e) {
      setError("Falha ao carregar os dados.");
    } finally {
      if (isLoading) setIsLoading(false); 
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const nav = navFlagsFromRestaurante(restaurante);

  useEffect(() => {
    if (!restaurante) return;
    const mostrarMesas = restaurante.gestao_config_mostrar_gerir_mesas !== false;
    if (!mostrarMesas && activeTab === 'mesas') {
      setActiveTab('cardapio');
    }
  }, [restaurante, activeTab]);

  const handleOpenCreateItemModal = () => { setItemToEdit(null); setItemModalOpen(true); };
  const handleOpenEditItemModal = (item) => { setItemToEdit(item); setItemModalOpen(true); };
  const handleCloseItemModal = () => { setItemModalOpen(false); setItemToEdit(null); };

  const handleItemFormSubmit = async (itemData) => {
    const token = localStorage.getItem("authToken");
    if (!token) {
        return { success: false, error: "Autenticação em falta." };
    }

    const formData = new FormData();
    formData.append('nome', itemData.nome);
    formData.append('descricao', itemData.descricao);
    formData.append('preco', itemData.preco);
    formData.append('categoria', itemData.categoria);

    if (itemData.foto instanceof File) {
        formData.append('foto', itemData.foto);
    } else if (itemToEdit && itemToEdit.foto && itemData.foto === null) {
        formData.append('foto_clear', 'true');
    }

    try {
        let result;
        if (itemToEdit) {
            result = await updateMenuItem(token, itemToEdit.id, formData);
        } else {
            result = await createMenuItem(token, formData);
        }

        if (result && !result.error) {
            setItemModalOpen(false);
            setItemParaGerirOpcoes(result); 
            await carregarDados();
            return;
        } else {
            const errorMessage = itemToEdit ? "Falha ao atualizar o item." : "Falha ao criar o item.";
            return { success: false, error: result?.error || errorMessage };
        }
    } catch (e) {
        console.error("Erro na submissão do formulário do item:", e);
        return { success: false, error: "Falha na comunicação com o servidor." };
    }
  };

  const handleDeleteItem = async (item) => {
    if (window.confirm(`Tem a certeza de que quer apagar o item "${item.nome}"?`)) {
      const token = localStorage.getItem("authToken");
      const result = await deleteMenuItem(token, item.id);
      if (result.success) { 
        await carregarDados(); 
      } else { 
        alert(`Erro ao apagar item: ${result.error}`); 
      }
    }
  };

   const handleToggleDisponibilidade = async (item) => {
    const token = localStorage.getItem("authToken");
    if (!token) return;
    const originalItens = [...itens];
    const updatedItens = itens.map(i => i.id === item.id ? { ...i, disponivel: !i.disponivel } : i);
    setItens(updatedItens);
    const result = await toggleItemDisponibilidade(token, item.id, { disponivel: !item.disponivel });
    if (result.error) {
      alert(`Erro ao atualizar o item: ${result.error}`);
      setItens(originalItens);
    }
  };

  const handleOpenCreateCategoryModal = () => { setCategoryToEdit(null); setCategoryModalOpen(true); };
  const handleOpenEditCategoryModal = (cat) => { setCategoryToEdit(cat); setCategoryModalOpen(true); };
  const handleCloseCategoryModal = () => { setCategoryModalOpen(false); setCategoryToEdit(null); };

  const handleCategoryFormSubmit = async (formData) => {
    const token = localStorage.getItem("authToken");
    const result = categoryToEdit 
      ? await updateCategory(token, categoryToEdit.id, formData) 
      : await createCategory(token, formData);
    if (result && !result.error) { 
      await carregarDados(); 
      return { success: true }; 
    }
    return { success: false, error: result.error };
  };

  const handleDeleteCategory = async (cat) => {
    if (window.confirm(`Tem a certeza de que quer apagar a categoria "${cat.nome}"? Isto não irá apagar os itens dentro dela.`)) {
      const token = localStorage.getItem("authToken");
      const result = await deleteCategory(token, cat.id);
      if (result.success) { 
        await carregarDados(); 
      } else { 
        alert(`Erro ao apagar categoria: ${result.error}`); 
      }
    }
  };

  const handleSaveRestaurante = async (data) => {
    const token = localStorage.getItem("authToken");
    const result = await updateRestaurante(token, data);
    if (result && !result.error) {
      alert("Restaurante atualizado com sucesso!");
      await carregarDados(); 
    } else {
      alert(`Erro: ${result.error}`);
    }
  };

  const filteredItems = itens.filter(item => item.nome.toLowerCase().includes(searchTerm.toLowerCase()));

  if (isLoading) return <div className="p-6 text-center text-gray-500">A carregar configurações...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div>
      <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold text-gray-800">Configurações</h1>
          {restaurante?.modo_operacao && (
            <span className="text-sm font-medium rounded-full bg-gray-200 text-gray-800 px-3 py-1">
              Modo: {MODO_LABEL[restaurante.modo_operacao] || restaurante.modo_operacao}
            </span>
          )}
        </div>
        <a 
          href="https://wa.me/553499999999" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 py-2 px-4 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <WhatsAppIcon />
          <span>Contatar Suporte</span>
        </a>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          <button onClick={() => setActiveTab('cardapio')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'cardapio' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
            Gerir Cardápio
          </button>
          {nav.gerirMesas && (
            <button type="button" onClick={() => setActiveTab('mesas')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'mesas' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
              Gerir Mesas
            </button>
          )}
          <button onClick={() => setActiveTab('restaurante')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'restaurante' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
            Gerir Restaurante
          </button>
        </nav>
      </div>

      {activeTab === 'cardapio' && (
        <>
          <div className="flex items-center gap-4 mt-6">
            <div className="relative flex-grow">
              <input 
                type="text"
                placeholder="Pesquisar item no cardápio..."
                className="block w-full rounded-md border-0 py-2.5 pl-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex-shrink-0 space-x-2">
              <button onClick={handleOpenCreateItemModal} className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700">Adicionar Item</button>
              <button onClick={handleOpenCreateCategoryModal} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300">Adicionar Categoria</button>
            </div>
          </div>
          <GerirCardapio 
            categorias={categorias} 
            itensFiltrados={filteredItems} 
            onEditItem={handleOpenEditItemModal}
            onDeleteItem={handleDeleteItem}
            onEditCategory={handleOpenEditCategoryModal}
            onDeleteCategory={handleDeleteCategory}
            onToggleDisponibilidade={handleToggleDisponibilidade}
            searchTerm={searchTerm}
          />
        </>
      )}
      
      {activeTab === 'mesas' && nav.gerirMesas && <GerirMesas mesas={mesas} restaurante={restaurante} />}
      
      {activeTab === 'restaurante' && (
        <GerirRestaurante
          restaurante={restaurante}
          onSave={handleSaveRestaurante}
          ocultarCamposMesas={!nav.gerirMesas}
        />
      )}

      <ItemFormModal isOpen={isItemModalOpen} onClose={handleCloseItemModal} onSubmit={handleItemFormSubmit} itemToEdit={itemToEdit} categorias={categorias} corPrincipal={restaurante?.cor_principal || "#4F46E5"} />
      
      <CategoryFormModal isOpen={isCategoryModalOpen} onClose={handleCloseCategoryModal} onSubmit={handleCategoryFormSubmit} categoryToEdit={categoryToEdit} corPrincipal={restaurante?.cor_principal || "#4F46E5"} />

      {itemParaGerirOpcoes && (
        <OpcoesModal
          item={itemParaGerirOpcoes}
          onClose={() => setItemParaGerirOpcoes(null)}
          corPrincipal={restaurante?.cor_principal || "#4F46E5"}
        />
      )}
    </div>
  );
}