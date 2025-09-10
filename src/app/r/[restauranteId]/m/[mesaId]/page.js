// src/app/r/[restauranteId]/m/[mesaId]/page.js

import { getRestauranteData, getCategorias, getItensCardapio } from "@/lib/api";
import MenuClientView from "@/components/menu/MenuClientView";

// A função de carregamento continua igual, recebendo o ID.
async function loadMenuData(restauranteId) {
  const [restaurante, categorias, itens] = await Promise.all([
    getRestauranteData(restauranteId),
    getCategorias(restauranteId),
    getItensCardapio(restauranteId),
  ]);
  return { restaurante, categorias, itens };
}

// --- A MUDANÇA ESTÁ AQUI ---
// Em vez de receber 'params', desestruturamos diretamente para obter 'restauranteId' e 'mesaId'.
export default async function MenuPage({ params: { restauranteId, mesaId } }) {
  // Agora usamos 'restauranteId' diretamente, que já foi extraído com segurança.
  const { restaurante, categorias, itens } = await loadMenuData(restauranteId);

  if (!restaurante) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-24">
        <h1 className="text-4xl font-bold text-red-600">Restaurante não encontrado</h1>
      </main>
    );
  }

  return (
    <MenuClientView 
      restaurante={restaurante}
      categorias={categorias}
      itens={itens}
      mesaId={mesaId} 
    />
  );
}