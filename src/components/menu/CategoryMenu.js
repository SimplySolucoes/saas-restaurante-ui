"use client";

export default function CategoryMenu({ 
  categorias, 
  corPrincipal, 
  selectedCategory, 
  onSelectCategory 
}) {
  return (
    <div className="overflow-x-auto py-2">
      <div className="flex space-x-4 px-4">
        <button
          onClick={() => onSelectCategory(null)} // Passa 'null' para indicar "Todos"
          className={`px-4 py-2 rounded-full font-semibold transition-colors whitespace-nowrap ${
            !selectedCategory
              ? 'text-white shadow-md'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          style={{ backgroundColor: !selectedCategory ? corPrincipal : undefined }}
        >
          Todos
        </button>

        {categorias.map((categoria) => (
          <button
            key={categoria.id}
            onClick={() => onSelectCategory(categoria.nome)} // Passa o NOME da categoria no clique
            className={`px-4 py-2 rounded-full font-semibold transition-colors whitespace-nowrap ${
              selectedCategory === categoria.nome // Compara pelo NOME da categoria
                ? 'text-white shadow-md'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            style={{ backgroundColor: selectedCategory === categoria.nome ? corPrincipal : undefined }}
          >
            {categoria.nome}
          </button>
        ))}
      </div>
    </div>
  );
}