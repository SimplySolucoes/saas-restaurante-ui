// Em src/components/menu-publico/MenuPublicoView.js

"use client";

import { useState } from "react";
import Image from "next/image";
import CategoryMenu from "@/components/menu/CategoryMenu"; // Reutilizamos o menu de categorias
import MenuItemCardPublico from "./MenuItemCardPublico"; // Usaremos um novo card "só de leitura"

export default function MenuPublicoView({ restaurante, categorias, itens }) {
  const [selectedCategory, setSelectedCategory] = useState(null);

  const categoriasParaExibir = selectedCategory
    ? categorias.filter(cat => cat.nome === selectedCategory)
    : categorias;

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="sticky top-0 z-20 shadow-lg">
        <header 
          className="p-4 flex items-start justify-start space-x-4 text-white" 
          style={{ backgroundColor: restaurante.cor_principal }}
        >
          {restaurante.logo && (
            <Image 
              src={restaurante.logo} 
              alt={`Logo de ${restaurante.nome}`}
              width={64}
              height={64}
              className="rounded-md object-cover"
            />
          )}
          <div className="text-left">
            <h1 className="text-3xl font-bold">{restaurante.nome}</h1>
            <p>Nosso Cardápio Digital</p>
          </div>
        </header>
        
        <nav className="bg-white/80 backdrop-blur-sm">
          <CategoryMenu 
            categorias={categorias}
            corPrincipal={restaurante.cor_principal}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </nav>
      </div>
     

      <main className="p-4 md:p-8">
        {categoriasParaExibir.map((categoria) => (
          <section key={categoria.id} className="mb-12">
            <h3 className="text-2xl font-bold border-b-2 pb-2 mb-6 text-gray-800" style={{ borderColor: restaurante.cor_principal }}>
              {categoria.nome}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {itens
                .filter((item) => item.categoria === categoria.nome)
                .map((item) => (
                  <MenuItemCardPublico 
                    key={item.id} 
                    item={item} 
                    corPrincipal={restaurante.cor_principal} 
                  />
                ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}