"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { 
  getSessions, 
  getMesas, 
  getRestaurante, 
  getGestaoCategorias, 
  getGestaoItensCardapio,
  abrirSessaoGarcom,
  submitOrderGarcom
} from "@/lib/api";
import { navFlagsFromRestaurante, MODO_OPERACAO } from "@/lib/gestaoNav";

import GarcomMenu from "@/components/gestao/GarcomMenu";
import Toast from "@/components/ui/Toast";
import ResumoPedido from "@/components/cart/ResumoPedido";
import FloatingCartButton from "@/components/cart/FloatingCartButton";

const LinhaMesa = ({ mesa, onAbrirSessao, onSelecionarParaAdicionar }) => {
  // ... (código do componente LinhaMesa não precisa de alteração)
  const isOcupada = !!mesa.sessao;
  return (
    <div className={`p-4 rounded-lg shadow-sm flex items-center justify-between transition-all ${isOcupada ? 'bg-white' : 'bg-green-50'}`}>
      <div className="flex items-center gap-4">
        <span className={`px-3 py-1 text-sm font-semibold rounded-full w-20 text-center ${isOcupada ? 'bg-orange-100 text-orange-800' : 'bg-green-200 text-green-800'}`}>
          {isOcupada ? 'Ocupada' : 'Livre'}
        </span>
        <h3 className="text-lg font-bold text-gray-800">Mesa {mesa.numero}</h3>
      </div>
      <div className="flex items-center gap-4">
        {isOcupada ? (
          <>
            <p className="text-gray-600 text-sm hidden sm:block">Total: <span className="font-bold">R$ {parseFloat(mesa.sessao.total).toFixed(2)}</span></p>
            <button onClick={() => onSelecionarParaAdicionar(mesa.sessao)} className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 text-sm">
              Adicionar Itens
            </button>
          </>
        ) : (
          <button onClick={() => onAbrirSessao(mesa.id)} className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 text-sm">
            Abrir Sessão
          </button>
        )}
      </div>
    </div>
  );
};

export default function NovoPedidoPage({ params, searchParams }) {
  const router = useRouter();
  const [sessoesAbertas, setSessoesAbertas] = useState([]);
  const [mesas, setMesas] = useState([]);
  const [restaurante, setRestaurante] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [etapa, setEtapa] = useState('selecao'); 
  const [selectedSessao, setSelectedSessao] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [itens, setItens] = useState([]);
  const [toastState, setToastState] = useState({ show: false, message: '' });
  const [carrinho, setCarrinho] = useState([]);
  const [isCarrinhoOpen, setIsCarrinhoOpen] = useState(false);


  const carregarDados = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Token de autenticação não encontrado.");
      setIsLoading(false); return;
    }
    setIsLoading(true);
    try {
      // --- AJUSTE AQUI ---
      // Removemos o prefixo "api." de todas as chamadas
      const [sessoesDaApi, mesasData, restauranteData, categoriasData, itensData] = await Promise.all([
        getSessions(token),
        getMesas(token),
        getRestaurante(token),
        getGestaoCategorias(token),
        getGestaoItensCardapio(token)
      ]);

      if (sessoesDaApi) {
        setSessoesAbertas(sessoesDaApi.filter(s => s.status === 'aberta'));
      }
      setMesas(mesasData || []);
      setRestaurante(restauranteData || null);
      setCategorias(categoriasData || []);
      setItens(itensData || []);

    } catch (e) {
      setError("Não foi possível carregar os dados.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    if (!restaurante) return;
    if (!navFlagsFromRestaurante(restaurante).novoPedido) {
      router.replace("/gestao");
      return;
    }
    if (restaurante.modo_operacao === MODO_OPERACAO.PRE_PAGO_WEB) {
      router.replace("/gestao/pedido-bar");
    }
  }, [restaurante, router]);

  const handleSelectSessao = (sessao) => {
    setCarrinho([]);
    setSelectedSessao(sessao);
    setEtapa('adicao');
  };

  const handleVoltarParaMesas = () => {
    setEtapa('selecao');
    setSelectedSessao(null);
    carregarDados();
  };
  
  const handleAbrirSessao = async (mesaId) => {
    const token = localStorage.getItem("authToken");
    
    // --- AJUSTE AQUI ---
    const novaSessao = await abrirSessaoGarcom(token, mesaId);
    if (novaSessao && !novaSessao.error) {
      await carregarDados();
      setToastState({ show: true, message: `Sessão para a Mesa ${novaSessao.mesa.numero} aberta com sucesso!` });
    } else {
      alert(`Erro ao abrir sessão: ${novaSessao?.error || 'Erro desconhecido'}`);
    }
  };

   const handleAdicionarAoCarrinho = (itemParaAdicionar) => {
    // ... (lógica interna não precisa de alteração)
    const idOpcoes = (itemParaAdicionar.gruposSelecionados || [])
      .flatMap(g => g.opcoes.map(o => o.id));
    const idOpcoesString = idOpcoes.sort().toString();
    
    const itemExistenteIndex = carrinho.findIndex(item => {
      const idOpcoesExistente = (item.gruposSelecionados || [])
        .flatMap(g => g.opcoes.map(o => o.id));
      const idOpcoesExistenteString = idOpcoesExistente.sort().toString();
      return item.produtoId === itemParaAdicionar.produtoId && idOpcoesExistenteString === idOpcoesString;
    });

    if (itemExistenteIndex > -1) {
      const novoCarrinho = [...carrinho];
      novoCarrinho[itemExistenteIndex].quantidade += itemParaAdicionar.quantidade;
      setCarrinho(novoCarrinho);
    } else {
      const novaLinha = { ...itemParaAdicionar, idLinhaCarrinho: Date.now() };
      setCarrinho(prev => [...prev, novaLinha]);
    }
    setToastState({ show: true, message: `${itemParaAdicionar.nome} adicionado!` });
  };
  const handleRemoverItem = (itemParaRemover) => {
    setCarrinho(prev => prev.filter(item => item.idLinhaCarrinho !== itemParaRemover.idLinhaCarrinho));
  };
  
  const handleAlterarQuantidade = (itemParaAlterar, quantidade) => {
    setCarrinho(prev => {
      const novoCarrinho = prev.map(item => {
        if (item.idLinhaCarrinho === itemParaAlterar.idLinhaCarrinho) {
          return { ...item, quantidade: Math.max(0, item.quantidade + quantidade) };
        }
        return item;
      });
      return novoCarrinho.filter(item => item.quantidade > 0);
    });
  };

  const handleSubmitPedido = async () => {
  if (carrinho.length === 0) {
    alert("O carrinho está vazio.");
    return;
  }
  const token = localStorage.getItem("authToken");
  if (!token) {
    alert("Erro de autenticação. Faça login novamente.");
    return;
  }
  const result = await submitOrderGarcom(token, selectedSessao.id, carrinho); 
  if (result && !result.error) {
    setToastState({ show: true, message: "Pedido enviado com sucesso!" });
    handleVoltarParaMesas();
  } else {
    alert(`Erro ao enviar pedido: ${result.error || 'Ocorreu um erro desconhecido.'}`);
  }
};

  // ... (restante do código JSX não precisa de alteração)
  if (isLoading) return <p className="p-6 text-center">A carregar...</p>;
  if (error) return <p className="p-6 text-center text-red-500">{error}</p>;

  if (etapa === 'adicao' && selectedSessao) {
    return (
      <div className="p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Mesa {selectedSessao.mesa.numero}
          </h1>
          <button onClick={handleVoltarParaMesas} className="text-sm font-semibold text-gray-700 hover:text-indigo-600">
            &larr; Ver todas as mesas
          </button>
        </div>
        
        <GarcomMenu
          categorias={categorias}
          itens={itens}
          onAdicionarAoCarrinho={handleAdicionarAoCarrinho}
          corPrincipal={restaurante?.cor_principal || '#4F46E5'}
        />

        <FloatingCartButton
          itemCount={carrinho.reduce((total, item) => total + item.quantidade, 0)}
          corPrincipal={restaurante?.cor_principal || '#4F46E5'}
          onClick={() => setIsCarrinhoOpen(true)}
        />

        {isCarrinhoOpen && (
          <ResumoPedido
            itensDoCarrinho={carrinho}
            onFechar={() => setIsCarrinhoOpen(false)}
            onConfirmar={handleSubmitPedido}
            corPrincipal={restaurante?.cor_principal || '#4F46E5'}
            onAumentarQtde={(item) => handleAlterarQuantidade(item, 1)}
            onDiminuirQtde={(item) => handleAlterarQuantidade(item, -1)}
            onRemoverItem={handleRemoverItem}
          />
        )}
      </div>
    );
  }

  const mesasParaExibir = mesas.map(mesa => {
    const sessaoAtiva = sessoesAbertas.find(s => s.mesa.id === mesa.id);
    return { ...mesa, sessao: sessaoAtiva || null };
  }).sort((a, b) => {
    if (a.sessao && !b.sessao) return -1; 
    if (!a.sessao && b.sessao) return 1; 
    return a.numero - b.numero;            
  });
  
  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Comanda Digital</h1>
      <div className="space-y-4">
        {mesas.length === 0 ? (
          <p className="text-gray-500">Não há mesas cadastradas.</p>
        ) : (
         mesasParaExibir.map((mesa) => (
            <LinhaMesa 
              key={mesa.id}
              mesa={mesa}
              onAbrirSessao={() => handleAbrirSessao(mesa.id)}
              onSelecionarParaAdicionar={handleSelectSessao}
            />
          ))
        )}
      </div>
      <Toast message={toastState.message} show={toastState.show} onHide={() => setToastState({ show: false, message: '' })} />
    </div>
  );
}