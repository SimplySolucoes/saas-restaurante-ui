import { getRestauranteData, getCategorias, getItensCardapio } from "@/lib/api";
import MenuClientView from "@/components/menu/MenuClientView";

async function loadMenuData(restauranteId) {
  const [restaurante, categorias, itens] = await Promise.all([
    getRestauranteData(restauranteId),
    getCategorias(restauranteId),
    getItensCardapio(restauranteId),
  ]);
  return { restaurante, categorias, itens };
}


export default async function MenuPage({ params: { restauranteId, mesaId } }) {
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