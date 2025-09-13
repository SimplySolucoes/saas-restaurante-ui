"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import MenuItemCard from "./MenuItemCard";
import FloatingCartButton from "../cart/FloatingCartButton";
import CartModal from "../cart/CartModal";
import CategoryMenu from "./CategoryMenu";
// --- ALTERAÇÃO 1: Importamos a nova função de API e removemos a antiga 'checkOpenSession' ---
import { createSessionByNumber, submitOrder } from "@/lib/api";

// --- ALTERAÇÃO 2: As props da função mudaram ---
export default function MenuClientView({ initialData, slug, numeroMesa }) {
  // --- ALTERAÇÃO 3: Desestruturamos os dados que vêm da 'initialData' ---
  const { restaurante, categorias, itens } = initialData;

  const [cart, setCart] = useState([]);
  const [isCartModalOpen, setCartModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [sessao, setSessao] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- ALTERAÇÃO 4: A lógica da sessão foi simplificada ---
  // A página já não faz uma chamada à API ao carregar. Apenas verifica o localStorage.
  useEffect(() => {
    const storedSession = localStorage.getItem(`sessao_${slug}_${numeroMesa}`);
    if (storedSession) {
      setSessao(JSON.parse(storedSession));
    }
    // Como os dados já foram carregados no servidor, podemos parar o 'loading'
    setIsLoading(false);
  }, [slug, numeroMesa]);

  // As suas funções de manipulação do carrinho permanecem as mesmas
  const handleAddItemToCart = (itemToAdd) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === itemToAdd.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === itemToAdd.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...prevCart, { ...itemToAdd, quantity: 1 }];
      }
    });
  };
  const handleIncreaseQuantity = handleAddItemToCart;
  const handleDecreaseQuantity = (itemToDecrease) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === itemToDecrease.id);
      if (existingItem && existingItem.quantity === 1) {
        return prevCart.filter((item) => item.id !== itemToDecrease.id);
      } else {
        return prevCart.map((item) =>
          item.id === itemToDecrease.id
            ? { ...item, quantity: item.quantity - 1 }
            : item
        );
      }
    });
  };

  // --- ALTERAÇÃO 5: A função de iniciar sessão agora usa o slug e o número da mesa ---
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
      setIsLoading(false);
      return; 
    }
    
    const result = await submitOrder(sessao.id, cart);

    if (result && !result.error) {
      alert("Pedido enviado para a cozinha com sucesso!");
      setCart([]);
      setCartModalOpen(false);
    } else {
      alert(`Erro ao enviar o pedido: ${result.error}`);
    }
    setIsLoading(false);
  };

  const totalItemsInCart = cart.reduce((total, item) => total + item.quantity, 0);
  const categoriasParaExibir = selectedCategory
    ? categorias.filter(cat => cat.nome === selectedCategory)
    : categorias;

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">A carregar...</div>;
  }
  if (error) {
    return <div className="flex h-screen items-center justify-center text-red-500">{error}</div>;
  }
  if (!sessao) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-100 p-4">
        <h1 className="text-4xl font-bold" style={{ color: restaurante.cor_principal }}>
          Bem-vindo a {restaurante.nome}!
        </h1>
        {/* --- ALTERAÇÃO 6: Exibimos o número da mesa correto --- */}
        <p className="mt-4 text-lg text-gray-600">Mesa {numeroMesa}</p>
        <button
          onClick={handleStartSession}
          className="mt-8 rounded-lg px-8 py-4 text-white font-bold shadow-lg transition-transform hover:scale-105"
          style={{ backgroundColor: restaurante.cor_principal }}
        >
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
          {/* --- ALTERAÇÃO 7: Exibimos o número da mesa correto --- */}
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
            <h3 className="text-2xl font-bold border-b-2 pb-2 mb-6 text-gray-800" style={{ borderColor: restaurante.cor_principal }}>
              {categoria.nome}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {itens
                .filter((item) => item.categoria === categoria.nome)
                .map((item) => (
                  <MenuItemCard 
                    key={item.id} 
                    item={item} 
                    corPrincipal={restaurante.cor_principal} 
                    onAddItem={handleAddItemToCart} 
                  />
                ))}
            </div>
          </section>
        ))}
      </main>

      <div onClick={() => setCartModalOpen(true)}>
        <FloatingCartButton 
          itemCount={totalItemsInCart} 
          corPrincipal={restaurante.cor_principal} 
        />
      </div>

      {isCartModalOpen && (
        <CartModal 
          cartItems={cart}
          corPrincipal={restaurante.cor_principal}
          onClose={() => setCartModalOpen(false)}
          onSubmit={handleSubmitOrder}
          onIncreaseQuantity={handleIncreaseQuantity}
          onDecreaseQuantity={handleDecreaseQuantity}
        />
      )}
    </div>
  );
}

