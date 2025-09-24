// Em src/app/cardapio/[slug]/page.js

import { getPublicCardapioData } from "@/lib/api";
import MenuPublicoView from "@/components/menu-publico/MenuPublicoView"; 
import { notFound } from 'next/navigation';

export const revalidate = 3600; 

export default async function CardapioPublicoPage({ params }) {
  const { slug } = params;

  const data = await getPublicCardapioData(slug);

  if (!data) {
    notFound();
  }

  return (
    <MenuPublicoView 
      restaurante={data.restaurante}
      categorias={data.categorias}
      itens={data.itens}
    />
  );
}