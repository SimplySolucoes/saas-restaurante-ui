"use client";

export default function CartModal({ 
  cartItems, 
  corPrincipal, 
  onClose, 
  onSubmit,
  onIncreaseQuantity,
  onDecreaseQuantity,
}) {
  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex justify-center items-center p-4"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-lg shadow-xl w-full max-w-md"
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Confirmar Itens</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl leading-none">&times;</button>
        </div>

        <div className="p-4 max-h-64 overflow-y-auto">
          {cartItems.length === 0 ? (
            <p className="text-gray-500">Nenhum item para enviar.</p>
          ) : (
            <ul>
              {cartItems.map(item => (
                <li key={item.id} className="flex justify-between items-center py-3 border-b last:border-b-0">
                  <div className="flex-grow">
                    <p className="font-semibold text-gray-800">{item.nome}</p>
                    <p className="text-sm text-gray-500">
                      R$ {parseFloat(item.preco).toFixed(2).replace('.', ',')}
                    </p>
                  </div>
                  
                  {/* --- BOTÕES COM ESTILO MELHORADO --- */}
                  <div className="flex items-center space-x-3">
                    <button 
                      onClick={() => onDecreaseQuantity(item)}
                      // Adicionamos 'border-gray-300' e 'text-gray-700' para maior contraste
                      className="h-8 w-8 rounded-full border border-gray-300 text-lg font-bold flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      -
                    </button>
                    <span className="font-bold text-lg w-8 text-center text-gray-800">{item.quantity}</span>
                    <button 
                      onClick={() => onIncreaseQuantity(item)}
                      // Adicionamos 'border-gray-300' e 'text-gray-700' para maior contraste
                      className="h-8 w-8 rounded-full border border-gray-300 text-lg font-bold flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div className="p-4 bg-gray-50 rounded-b-lg">
          <button
            onClick={onSubmit}
            className="w-full text-white font-bold py-3 px-6 rounded-lg shadow-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
            style={{ backgroundColor: corPrincipal }}
            disabled={cartItems.length === 0}
          >
            <span>Enviar para a Cozinha</span>
          </button>
        </div>
      </div>
    </div>
  );
}

