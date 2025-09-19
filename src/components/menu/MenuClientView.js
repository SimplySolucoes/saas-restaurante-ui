"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import MenuItemCard from "./MenuItemCard";
import FloatingCartButton from "../cart/FloatingCartButton";
import ResumoPedido from "../cart/ResumoPedido"; 
import CategoryMenu from "./CategoryMenu";
import { createSessionByNumber, submitOrder } from "@/lib/api";
import Toast from "@/components/ui/Toast";
import ModalSelecaoOpcoes from "@/components/ui/ModalSelecaoOpcoes"; 

export default function MenuClientView({ initialData, slug, numeroMesa }) {
  const { restaurante, categorias, itens } = initialData;

  const [carrinho, setCarrinho] = useState([]);
  const [isCarrinhoOpen, setIsCarrinhoOpen] = useState(false);
  const [itemParaOpcoes, setItemParaOpcoes] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [sessao, setSessao] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastState, setToastState] = useState({ show: false, message: '', type: 'success' });

  const cartKey = `carrinho_${slug}_${numeroMesa}`;
  const sessionKey = `sessao_${slug}_${numeroMesa}`;


   useEffect(() => {
    if (!sessao) return;

    const intervalId = setInterval(async () => {
      const sessaoAtualizada = await getSessionStatus(sessao.id);

      if (sessaoAtualizada.status === 'fechada') {
        alert("Esta conta foi encerrada. Obrigado!");
        
        localStorage.removeItem(cartKey);
        localStorage.removeItem(sessionKey);
        window.location.reload(); 
      }
    }, 10000); 

    return () => clearInterval(intervalId);

  }, [sessao, cartKey, sessionKey]); 

  useEffect(() => {
    const storedCart = localStorage.getItem(cartKey);
    if (storedCart) {
      setCarrinho(JSON.parse(storedCart));
    }
    const storedSession = localStorage.getItem(`sessao_${slug}_${numeroMesa}`);
    if (storedSession) {
      setSessao(JSON.parse(storedSession));
    }
    setIsLoading(false);
  }, [slug, numeroMesa, cartKey]);

  useEffect(() => {
    if (carrinho.length > 0) {
      localStorage.setItem(cartKey, JSON.stringify(carrinho));
    } else {
      localStorage.removeItem(cartKey);
    }
  }, [carrinho, cartKey]);


  const handleAdicionarAoCarrinho = (itemParaAdicionar) => {
    const idOpcoes = (itemParaAdicionar.gruposSelecionados || []).flatMap(g => g.opcoes.map(o => o.id));
    const idOpcoesString = idOpcoes.sort().toString();
    
    const itemExistenteIndex = carrinho.findIndex(item => {
      const idOpcoesExistente = (item.gruposSelecionados || []).flatMap(g => g.opcoes.map(o => o.id));
      const idOpcoesExistenteString = idOpcoesExistente.sort().toString();
      return item.produtoId === itemParaAdicionar.produtoId && idOpcoesExistenteString === idOpcoesString;
    });

    if (itemExistenteIndex > -1) {
      const novoCarrinho = [...carrinho];
      novoCarrinho[itemExistenteIndex].quantidade += itemParaAdicionar.quantidade;
      setCarrinho(novoCarrinho);
    } else {
      const novaLinha = { ...itemParaAdicionar, idLinhaCarrinho: Date.now() };
      setCarrinho(prev => [...prev, novaLinha]);
    }
  };
  
  const handleRemoverItem = (itemParaRemover) => {
    setCarrinho(prev => prev.filter(item => item.idLinhaCarrinho !== itemParaRemover.idLinhaCarrinho));
  };
  
  const handleAlterarQuantidade = (itemParaAlterar, quantidade) => {
    setCarrinho(prev => {
      const novoCarrinho = prev.map(item => {
        if (item.idLinhaCarrinho === itemParaAlterar.idLinhaCarrinho) {
          return { ...item, quantidade: Math.max(0, item.quantidade + quantidade) };
        }
        return item;
      });
      return novoCarrinho.filter(item => item.quantidade > 0);
    });
  };

  const handleStartSession = async () => {
    setIsLoading(true);
    setError(null);
    const newSession = await createSessionByNumber(slug, numeroMesa);
    if (newSession) {
      setSessao(newSession);
      localStorage.setItem(`sessao_${slug}_${numeroMesa}`, JSON.stringify(newSession));
    } else {
      setError("Não foi possível iniciar uma nova sessão. Tente novamente.");
    }
    setIsLoading(false);
  };

  const handleSubmitOrder = async () => {
    setIsLoading(true);
    setError(null);
      if (!sessao || !sessao.id) {
      setError("Sessão inválida. Por favor, recarregue a página.");
      setToastState({ show: true, message: 'Sessão inválida. Recarregue a página.', type: 'error' });
      setIsLoading(false);
      return; 
    }
    
    const result = await submitOrder(sessao.id, carrinho);

    if (result && !result.error) {
      setToastState({ show: true, message: "Pedido enviado com sucesso!", type: 'success' });
      setCarrinho([]);
      setIsCarrinhoOpen(false);
      localStorage.removeItem(cartKey);
    } else {
      setToastState({ show: true, message: `Erro: ${result.error}`, type: 'error' });
    }
    setIsLoading(false);
  };

  const totalItemsInCart = carrinho.reduce((total, item) => total + item.quantidade, 0);
  const categoriasParaExibir = selectedCategory ? categorias.filter(cat => cat.nome === selectedCategory) : categorias;

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">A carregar...</div>;
  }
if (error) {
    return <div className="flex h-screen items-center justify-center text-red-500">{error}</div>;
  }
  if (!sessao) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-100 p-4">
        <h1 className="text-4xl font-bold" style={{ color: restaurante.cor_principal }}>Bem-vindo a {restaurante.nome}!</h1>
        <p className="mt-4 text-lg text-gray-600">Mesa {numeroMesa}</p>
        <button onClick={handleStartSession} className="mt-8 rounded-lg px-8 py-4 text-white font-bold shadow-lg transition-transform hover:scale-105" style={{ backgroundColor: restaurante.cor_principal }}>
          Iniciar Novo Pedido
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen relative">
     <header 
        className="p-4 flex items-center justify-center space-x-4 text-white shadow-lg sticky top-0 z-20" 
        style={{ backgroundColor: restaurante.cor_principal }}
      >
        {restaurante.logo && (
          <Image 
            src={restaurante.logo} 
            alt={`Logo de ${restaurante.nome}`}
            width={64}
            height={64}
            className="rounded-full object-cover border-2 border-white"
          />
        )}
        <div className="text-left">
          <h1 className="text-3xl font-bold">{restaurante.nome}</h1>
          <p>Mesa {numeroMesa}</p>
        </div>
      </header>
      <nav className="sticky top-[104px] bg-white/80 backdrop-blur-sm shadow-sm z-10">
        <CategoryMenu 
          categorias={categorias}
          corPrincipal={restaurante.cor_principal}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      </nav>

      <main className="p-4 md:p-8 pb-24">
        {categoriasParaExibir.map((categoria) => (
          <section key={categoria.id} className="mb-12">
            <h3 className="text-2xl font-bold border-b-2 pb-2 mb-6 text-gray-800" style={{ borderColor: restaurante.cor_principal }}>{categoria.nome}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {itens.filter((item) => item.categoria === categoria.nome).map((item) => (
                  <MenuItemCard 
                    key={item.id} 
                    item={item} 
                    corPrincipal={restaurante.cor_principal} 
                    onAddItem={(itemClicado) => {
                      if (itemClicado.tem_opcoes) {
                        setItemParaOpcoes(itemClicado);
                      } else {
                        handleAdicionarAoCarrinho({ produtoId: itemClicado.id, nome: itemClicado.nome, preco: itemClicado.preco, gruposSelecionados: [], quantidade: 1 });
                      }
                    }} 
                  />
              ))}
            </div>
          </section>
        ))}
      </main>

      <div onClick={() => setIsCarrinhoOpen(true)}>
        <FloatingCartButton 
          itemCount={totalItemsInCart} 
          corPrincipal={restaurante.cor_principal} 
        />
      </div>

      {itemParaOpcoes && (
        <ModalSelecaoOpcoes
          item={itemParaOpcoes}
          onCancel={() => setItemParaOpcoes(null)}
          onConfirm={(dadosDoModal) => {
            handleAdicionarAoCarrinho({ produtoId: itemParaOpcoes.id, nome: itemParaOpcoes.nome, preco: itemParaOpcoes.preco, ...dadosDoModal });
            setItemParaOpcoes(null);
          }}
          corPrincipal={restaurante.cor_principal}
        />
      )}

      {isCarrinhoOpen && (
        <ResumoPedido
          itensDoCarrinho={carrinho}
          corPrincipal={restaurante.cor_principal}
          onFechar={() => setIsCarrinhoOpen(false)}
          onConfirmar={handleSubmitOrder}
          onAumentarQtde={(item) => handleAlterarQuantidade(item, 1)}
          onDiminuirQtde={(item) => handleAlterarQuantidade(item, -1)}
          onRemoverItem={handleRemoverItem}
        />
      )}
      
      <Toast 
        message={toastState.message}
        show={toastState.show}
        onHide={() => setToastState({ show: false, message: '', type: 'success' })}
        type={toastState.type}

      />
    </div>
  );
}