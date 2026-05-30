"use client";

import PrepagoResumoValores from "@/components/prepago/PrepagoResumoValores";

export default function ResumoPedido({
  itensDoCarrinho,
  titulo = "Resumo do Pedido",
  corPrincipal,
  textoBotaoPrincipal = "Enviar Pedido",
  onConfirmar,
  onFechar,
  onAumentarQtde,
  onDiminuirQtde,
  onRemoverItem,
  confirmarDesabilitado = false,
  prepagoValores = null,
}) {

  const calcularSubtotalLinha = (item) => {
    const precoBase = parseFloat(item.preco || 0);
    
    // Soma o preço adicional de cada opção em cada grupo
    const precoOpcoes = item.gruposSelecionados?.reduce((totalGrupo, grupo) => {
      const totalOpcoesNoGrupo = grupo.opcoes.reduce((subtotalOpcao, opcao) => {
        return subtotalOpcao + parseFloat(opcao.preco_adicional || 0);
      }, 0);
      return totalGrupo + totalOpcoesNoGrupo;
    }, 0) || 0;

    return (precoBase + precoOpcoes) * item.quantidade;
  };

  const totalPedido = itensDoCarrinho.reduce((total, item) => {
    return total + calcularSubtotalLinha(item);
  }, 0);

  return (
    <div
      onClick={onFechar}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-lg shadow-xl w-full max-w-md flex flex-col"
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-2xl font-bold text-gray-800">{titulo}</h2>
          <button onClick={onFechar} className="text-gray-500 hover:text-gray-800 text-3xl leading-none">&times;</button>
        </div>

        <div className="p-4 flex-grow" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {itensDoCarrinho.length === 0 ? (
            <p className="text-gray-500 text-center py-8">O carrinho está vazio.</p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {itensDoCarrinho.map(item => (
                <li key={item.idLinhaCarrinho} className="py-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-grow pr-4">
                      <p className="font-semibold text-gray-800">{item.quantidade}x {item.nome}</p>
                      
                      {/* Lógica para exibir os grupos e suas opções */}
                      {item.gruposSelecionados && item.gruposSelecionados.length > 0 && (
                        <div className="mt-1 pl-1 space-y-1">
                          {item.gruposSelecionados.map(grupo => (
                            <div key={grupo.grupoId}>
                              <span className="text-xs font-semibold text-gray-500">{grupo.grupoNome}:</span>
                              <ul className="pl-2">
                                {grupo.opcoes.map(opcao => (
                                  <li key={opcao.id} className="text-xs text-gray-500">
                                    ↳ {opcao.nome} (+ R$ {parseFloat(opcao.preco_adicional).toFixed(2)})
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="text-sm text-gray-700 mt-2 font-bold">
                        Subtotal: R$ {calcularSubtotalLinha(item).toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                    
                    <div className="flex flex-col items-center space-y-2">
                      <div className="flex items-center space-x-2">
                        <button onClick={() => onDiminuirQtde(item)} className="h-7 w-7 rounded-full border border-gray-300 text-lg font-bold flex items-center justify-center text-gray-700 hover:bg-gray-100">-</button>
                        <span className="font-bold text-lg w-7 text-center text-gray-800">{item.quantidade}</span>
                        <button onClick={() => onAumentarQtde(item)} className="h-7 w-7 rounded-full border border-gray-300 text-lg font-bold flex items-center justify-center text-gray-700 hover:bg-gray-100">+</button>
                      </div>
                      <button onClick={() => onRemoverItem(item)} className="text-red-500 hover:text-red-700 text-xs font-semibold">
                          Remover
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div className="p-4 bg-gray-50 rounded-b-lg border-t">
          {prepagoValores ? (
            <PrepagoResumoValores
              valores={prepagoValores}
              corPrincipal={corPrincipal}
              className="mb-4 bg-white"
            />
          ) : (
            <div className="flex justify-between font-bold text-lg mb-4">
              <span>Total</span>
              <span>R$ {totalPedido.toFixed(2).replace(".", ",")}</span>
            </div>
          )}
          <button
            onClick={onConfirmar}
            className="w-full text-white font-bold py-3 px-6 rounded-lg shadow-md hover:opacity-90 transition-opacity disabled:opacity-50"
            style={{ backgroundColor: corPrincipal || '#4F46E5'}}
            disabled={itensDoCarrinho.length === 0 || confirmarDesabilitado}
          >
            <span>{textoBotaoPrincipal}</span>
          </button>
        </div>
      </div>
    </div>
  );
}