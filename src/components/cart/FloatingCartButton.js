// src/components/cart/FloatingCartButton.js

// Este componente recebe o número de itens no carrinho e exibe-o.
export default function FloatingCartButton({ itemCount, corPrincipal }) {
  // Se não houver itens, não exibe nada.
  if (itemCount === 0) {
    return null;
  }

  return (
    // Botão flutuante fixo no canto inferior direito
    <button
      className="fixed bottom-6 right-6 h-16 w-16 rounded-full text-white shadow-lg flex items-center justify-center transform transition-transform hover:scale-110"
      style={{ backgroundColor: corPrincipal }}
    >
      {/* Ícone do Carrinho (SVG) */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="h-8 w-8"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c.51 0 .962-.343 1.087-.835l1.821-6.831a1.5 1.5 0 00-1.422-2.074H4.795a1.5 1.5 0 00-1.422 2.074l1.821 6.831z"
        />
      </svg>

      {/* Badge com o número de itens */}
      <span className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-sm font-bold">
        {itemCount}
      </span>
    </button>
  );
}