"use client";

export default function SessaoDetalhesModal({ sessao, onClose, onFecharConta }) {
  if (!sessao) return null;

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex justify-center items-center p-4"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-lg shadow-xl w-full max-w-lg"
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-2xl font-bold text-gray-800">
            Detalhes da Conta - Mesa {sessao.mesa.numero}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-3xl leading-none">&times;</button>
        </div>

        <div className="p-4 max-h-[60vh] overflow-y-auto">
          <h3 className="font-bold text-lg mb-2">Pedidos Realizados:</h3>
          {sessao.pedidos.length === 0 ? (
            <p className="text-gray-500">Nenhum pedido foi feito nesta sessão ainda.</p>
          ) : (
            <ul className="space-y-3">
              {sessao.pedidos.map(pedido => (
                <li key={pedido.id} className="text-sm">
                  <p className="font-semibold">Pedido #{pedido.id} - {new Date(pedido.data_hora).toLocaleTimeString('pt-BR')}</p>
                  <ul className="list-disc list-inside pl-4 text-gray-700">
                    {pedido.itens_pedido.map(item => (
                      <li key={item.id}>
                        {item.quantidade}x {item.item_cardapio}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div className="flex justify-between items-center p-4 border-t bg-gray-50 rounded-b-lg">
          <div>
            <p className="text-lg font-bold text-gray-800">Total da Conta</p>
            <p className="text-3xl font-extrabold text-indigo-600">
              R$ {parseFloat(sessao.total).toFixed(2).replace('.', ',')}
            </p>
          </div>
          <button
            onClick={() => onFecharConta(sessao.id)}
            className="bg-red-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-red-700 transition-opacity disabled:opacity-50"
          >
            Fechar Conta
          </button>
        </div>
      </div>
    </div>
  );
}