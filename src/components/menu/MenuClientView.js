"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import MenuItemCard from "./MenuItemCard";
import FloatingCartButton from "../cart/FloatingCartButton";
import ResumoPedido from "../cart/ResumoPedido"; 
import CategoryMenu from "./CategoryMenu";
import { createSessionByNumber, submitOrder, getSessionStatus, createPedidoPrePago } from "@/lib/api";
import { isModoPrePago } from "@/lib/gestaoNav";
import Toast from "@/components/ui/Toast";
import ModalSelecaoOpcoes from "@/components/ui/ModalSelecaoOpcoes";
import ModalDadosCompradorPrepago from "@/components/prepago/ModalDadosCompradorPrepago";
import ModalPagamentoPix from "@/components/prepago/ModalPagamentoPix";
import ModalEscolhaPagamentoPrepago from "@/components/prepago/ModalEscolhaPagamentoPrepago";
import ModalCheckoutCarteira from "@/components/prepago/ModalCheckoutCarteira";
import useCarteiraDigitalDisponivel from "@/hooks/useCarteiraDigitalDisponivel";

export default function MenuClientView({ initialData, slug, numeroMesa }) {
  const router = useRouter();
  const { restaurante, categorias, itens } = initialData;
  const prepago = isModoPrePago(restaurante);
  const prepagoPodePagar =
    prepago && restaurante.prepago_pagamento_configurado === true;
  const prepagoSemConfigPagamento =
    prepago && restaurante.prepago_pagamento_configurado !== true;
  const pedidosForaDoHorario =
    prepago && restaurante.aceita_pedidos_agora === false;

  const [carrinho, setCarrinho] = useState([]);
  const [isCarrinhoOpen, setIsCarrinhoOpen] = useState(false);
  const [modalCompradorAberto, setModalCompradorAberto] = useState(false);
  const [enviandoPrepago, setEnviandoPrepago] = useState(false);
  const [erroApiPrepago, setErroApiPrepago] = useState("");
  const [itemParaOpcoes, setItemParaOpcoes] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [sessao, setSessao] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastState, setToastState] = useState({ show: false, message: '', type: 'success' });
  const [modalPixAberto, setModalPixAberto] = useState(false);
  const [ctxPix, setCtxPix] = useState(null);
  const [modalEscolhaPagamentoAberto, setModalEscolhaPagamentoAberto] = useState(false);
  const [modalCarteiraAberto, setModalCarteiraAberto] = useState(false);
  const [ctxCarteira, setCtxCarteira] = useState(null);
  const [dadosCompradorPendentes, setDadosCompradorPendentes] = useState(null);

  const {
    disponivel: carteiraDisponivel,
    carregando: carteiraCarregando,
    labelCarteira,
    mpPublicKey: mpPublicKeyHook,
  } = useCarteiraDigitalDisponivel(slug, prepago && prepagoPodePagar);

  const cartKey = `carrinho_${slug}_${numeroMesa}`;
  const sessionKey = `sessao_${slug}_${numeroMesa}`;


  useEffect(() => {
    if (!sessao?.id || sessao.prepago) return;

    const intervalId = setInterval(async () => {
      const sessaoAtualizada = await getSessionStatus(sessao.id);

      if (sessaoAtualizada.status === "fechada") {
        alert("Esta conta foi encerrada. Obrigado!");

        localStorage.removeItem(cartKey);
        localStorage.removeItem(sessionKey);
        window.location.reload();
      }
    }, 10000);

    return () => clearInterval(intervalId);
  }, [sessao, cartKey, sessionKey]);

  useEffect(() => {
    const storedCart = localStorage.getItem(cartKey);
    if (storedCart) {
      setCarrinho(JSON.parse(storedCart));
    }
    if (prepago) {
      setSessao({ prepago: true });
    } else {
      const storedSession = localStorage.getItem(`sessao_${slug}_${numeroMesa}`);
      if (storedSession) {
        setSessao(JSON.parse(storedSession));
      }
    }
    setIsLoading(false);
  }, [slug, numeroMesa, cartKey, prepago]);

  useEffect(() => {
    if (carrinho.length > 0) {
      localStorage.setItem(cartKey, JSON.stringify(carrinho));
    } else {
      localStorage.removeItem(cartKey);
    }
  }, [carrinho, cartKey]);


  const handleAdicionarAoCarrinho = (itemParaAdicionar) => {
    const idOpcoes = (itemParaAdicionar.gruposSelecionados || []).flatMap(g => g.opcoes.map(o => o.id));
    const idOpcoesString = idOpcoes.sort().toString();
    
    const itemExistenteIndex = carrinho.findIndex(item => {
      const idOpcoesExistente = (item.gruposSelecionados || []).flatMap(g => g.opcoes.map(o => o.id));
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

 const handleStartSession = async () => {
    setIsLoading(true);
    setError(null);
    
    const segredo = sessionStorage.getItem(`segredo_mesa_${slug}_${numeroMesa}`);
    if (!segredo) {
      setError("autenticação falhou. Por favor, escaneie o QR Code novamente.");
      setIsLoading(false);
      return;
    }

    const newSession = await createSessionByNumber(slug, numeroMesa, segredo);
    if (newSession && !newSession.error) {
      setSessao(newSession);
      localStorage.setItem(`sessao_${slug}_${numeroMesa}`, JSON.stringify(newSession));
    } else {
      setError(newSession.error || "Não foi possível iniciar uma nova sessão.");
    }
    setIsLoading(false);
  };

  const handleResumoConfirmar = async () => {
    if (prepago) {
      if (pedidosForaDoHorario) {
        setToastState({
          show: true,
          message: "Fora do horário de pedidos.",
          type: "error",
        });
        return;
      }
      if (!prepagoPodePagar) {
        setToastState({
          show: true,
          message:
            "Pagamentos não estão configurados para este estabelecimento. Tente mais tarde.",
          type: "error",
        });
        return;
      }
      setIsCarrinhoOpen(false);
      setErroApiPrepago("");
      setModalCompradorAberto(true);
      return;
    }
    await handleSubmitOrderMesa();
  };

  const handlePixPagamentoAprovado = useCallback(
    ({ codigo_retirada, nome }) => {
      setModalPixAberto(false);
      setCtxPix(null);
      setCarrinho([]);
      localStorage.removeItem(cartKey);
      const q = new URLSearchParams();
      if (codigo_retirada) q.set("codigo", codigo_retirada);
      if (nome) q.set("nome", nome);
      router.push(`/cardapio/${slug}/pedido-realizado?${q.toString()}`);
    },
    [slug, router, cartKey]
  );

  const criarPedidoPrepago = async (nome, telefone, metodoPagamento) => {
    setEnviandoPrepago(true);
    setErroApiPrepago("");
    const result = await createPedidoPrePago(slug, carrinho, null, {
      observacoesGerais: "",
      compradorNome: nome,
      compradorTelefone: telefone,
      metodoPagamento,
    });
    setEnviandoPrepago(false);
    if (result?.error) {
      setErroApiPrepago(result.error);
      return null;
    }
    return result;
  };

  const handleModalCompradorConfirmar = async (nome, telefone) => {
    setModalCompradorAberto(false);
    setErroApiPrepago("");
    setDadosCompradorPendentes({ nome, telefone });
    setModalEscolhaPagamentoAberto(true);
  };

  const handleEscolherPix = async () => {
    const { nome, telefone } = dadosCompradorPendentes || {};
    if (!nome) return;
    const result = await criarPedidoPrepago(nome, telefone, "pix");
    if (!result) {
      setModalEscolhaPagamentoAberto(true);
      return;
    }
    setModalEscolhaPagamentoAberto(false);
    setCtxPix({
      pedidoId: result.id,
      publicToken: result.public_token,
      pixCopiaCola: result.pix_copia_cola || "",
      valorCobrancaPix: result.valor_cobranca_pix || result.valor_cobranca,
      nome,
    });
    setModalPixAberto(true);
    setDadosCompradorPendentes(null);
  };

  const handleEscolherCarteira = async () => {
    if (!carteiraDisponivel) return;
    setModalEscolhaPagamentoAberto(false);
    const { nome, telefone } = dadosCompradorPendentes || {};
    if (!nome) return;
    const result = await criarPedidoPrepago(nome, telefone, "carteira");
    if (!result) {
      setModalEscolhaPagamentoAberto(true);
      return;
    }
    setModalEscolhaPagamentoAberto(false);
    setCtxCarteira({
      pedidoId: result.id,
      publicToken: result.public_token,
      mpPublicKey: result.mp_public_key || mpPublicKeyHook,
      valorCobranca: result.valor_cobranca || result.valor_cobranca_pix,
      nome,
    });
    setModalCarteiraAberto(true);
    setDadosCompradorPendentes(null);
  };

  const handleCarteiraPagamentoAprovado = useCallback(
    ({ codigo_retirada, nome }) => {
      setModalCarteiraAberto(false);
      setCtxCarteira(null);
      handlePixPagamentoAprovado({ codigo_retirada, nome });
    },
    [handlePixPagamentoAprovado]
  );

  const handleSubmitOrderMesa = async () => {
    setIsLoading(true);
    setError(null);
    if (pedidosForaDoHorario) {
      setToastState({
        show: true,
        message: "Fora do horário de pedidos.",
        type: "error",
      });
      setIsLoading(false);
      return;
    }

    if (!sessao || !sessao.id) {
      setError("Sessão inválida. Por favor, recarregue a página.");
      setToastState({
        show: true,
        message: "Sessão inválida. Recarregue a página.",
        type: "error",
      });
      setIsLoading(false);
      return;
    }

    const result = await submitOrder(sessao.id, carrinho);

    if (result && !result.error) {
      setToastState({
        show: true,
        message: "Pedido enviado com sucesso!",
        type: "success",
      });
      setCarrinho([]);
      setIsCarrinhoOpen(false);
      localStorage.removeItem(cartKey);
    } else {
      setToastState({
        show: true,
        message: `Erro: ${result.error}`,
        type: "error",
      });
    }
    setIsLoading(false);
  };

  const totalItemsInCart = carrinho.reduce((total, item) => total + item.quantidade, 0);
  const categoriasParaExibir = selectedCategory ? categorias.filter(cat => cat.nome === selectedCategory) : categorias;

  const subtituloMesa =
    prepago && String(numeroMesa).toLowerCase() === "balcao"
      ? "Pedido para retirada"
      : prepago
        ? `Mesa ${numeroMesa} · Retirada`
        : `MESA ${numeroMesa}`;

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">A carregar...</div>;
  }
if (error) {
    return <div className="flex h-screen items-center justify-center text-red-500">{error}</div>;
  }
  if (!sessao && !prepago) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-100 p-4">
        <h1 className="text-4xl font-bold" style={{ color: restaurante.cor_principal }}>Bem-vindo a {restaurante.nome}!</h1>
        <p className="mt-4 text-lg text-gray-600">Mesa {numeroMesa}</p>
        <button onClick={handleStartSession} className="mt-8 rounded-lg px-8 py-4 text-white font-bold shadow-lg transition-transform hover:scale-105" style={{ backgroundColor: restaurante.cor_principal }}>
          Iniciar Novo Pedido
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen relative">
     <div className="sticky top-0 z-20 shadow-lg">
        <header 
          className="p-4 flex items-center justify-center space-x-4 text-white" 
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
            <p>{subtituloMesa}</p>
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
        {pedidosForaDoHorario && (
          <div className="bg-amber-100 text-amber-900 text-center text-sm font-medium py-2 px-4">
            Estamos fora do horário de pedidos. Não é possível finalizar o pedido neste momento.
          </div>
        )}
        {prepagoSemConfigPagamento && (
          <div className="bg-red-50 text-red-900 text-center text-sm font-medium py-2 px-4 border-b border-red-100">
            Pagamentos PIX não estão disponíveis neste momento. O estabelecimento precisa
            concluir a configuração do Mercado Pago.
          </div>
        )}
      </div>

      <main className="p-4 md:p-8 pb-24">
        {categoriasParaExibir.map((categoria) => (
          <section key={categoria.id} className="mb-12">
            <h3 className="text-2xl font-bold border-b-2 pb-2 mb-6 text-gray-800" style={{ borderColor: restaurante.cor_principal }}>{categoria.nome}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {itens.filter((item) => item.categoria === categoria.nome).map((item) => (
                  <MenuItemCard 
                    key={item.id} 
                    item={item} 
                    corPrincipal={restaurante.cor_principal} 
                    onAddItem={(itemClicado) => {
                      if (itemClicado.tem_opcoes) {
                        setItemParaOpcoes(itemClicado);
                      } else {
                        handleAdicionarAoCarrinho({ produtoId: itemClicado.id, nome: itemClicado.nome, preco: itemClicado.preco, gruposSelecionados: [], quantidade: 1 });
                      }
                    }} 
                  />
              ))}
            </div>
          </section>
        ))}
      </main>

      <div onClick={() => setIsCarrinhoOpen(true)}>
        <FloatingCartButton 
          itemCount={totalItemsInCart} 
          corPrincipal={restaurante.cor_principal} 
        />
      </div>

      <ModalDadosCompradorPrepago
        open={modalCompradorAberto}
        onClose={() => {
          if (!enviandoPrepago) {
            setModalCompradorAberto(false);
            setErroApiPrepago("");
          }
        }}
        corPrincipal={restaurante.cor_principal}
        loading={enviandoPrepago}
        apiError={erroApiPrepago}
        onConfirmar={handleModalCompradorConfirmar}
      />

      <ModalEscolhaPagamentoPrepago
        open={modalEscolhaPagamentoAberto}
        onClose={() => {
          setModalEscolhaPagamentoAberto(false);
          setDadosCompradorPendentes(null);
          setModalCompradorAberto(true);
        }}
        onEscolherPix={handleEscolherPix}
        onEscolherCarteira={handleEscolherCarteira}
        mostrarCarteira={carteiraDisponivel && !carteiraCarregando}
        labelCarteira={labelCarteira}
        corPrincipal={restaurante.cor_principal}
        loadingPix={enviandoPrepago}
        apiError={erroApiPrepago}
      />

      {ctxCarteira && (
        <ModalCheckoutCarteira
          open={modalCarteiraAberto}
          onClose={() => {
            setModalCarteiraAberto(false);
            setCtxCarteira(null);
          }}
          mpPublicKey={ctxCarteira.mpPublicKey}
          valorCobranca={ctxCarteira.valorCobranca}
          pedidoId={ctxCarteira.pedidoId}
          publicToken={ctxCarteira.publicToken}
          nomeComprador={ctxCarteira.nome}
          carteiraDisponivel={carteiraDisponivel}
          onAprovado={handleCarteiraPagamentoAprovado}
          onErro={(msg) =>
            setToastState({ show: true, message: msg, type: "error" })
          }
        />
      )}

      {ctxPix && (
        <ModalPagamentoPix
          open={modalPixAberto}
          onClose={() => setModalPixAberto(false)}
          pedidoId={ctxPix.pedidoId}
          publicToken={ctxPix.publicToken}
          pixCopiaCola={ctxPix.pixCopiaCola}
          valorCobrancaPix={ctxPix.valorCobrancaPix}
          corPrincipal={restaurante.cor_principal}
          nomeComprador={ctxPix.nome}
          onPagamentoAprovado={handlePixPagamentoAprovado}
        />
      )}

      {itemParaOpcoes && (
        <ModalSelecaoOpcoes
          item={itemParaOpcoes}
          onCancel={() => setItemParaOpcoes(null)}
          onConfirm={(dadosDoModal) => {
            handleAdicionarAoCarrinho({ produtoId: itemParaOpcoes.id, nome: itemParaOpcoes.nome, preco: itemParaOpcoes.preco, ...dadosDoModal });
            setItemParaOpcoes(null);
          }}
          corPrincipal={restaurante.cor_principal}
        />
      )}

      {isCarrinhoOpen && (
        <ResumoPedido
          itensDoCarrinho={carrinho}
          corPrincipal={restaurante.cor_principal}
          onFechar={() => setIsCarrinhoOpen(false)}
          onConfirmar={handleResumoConfirmar}
          onAumentarQtde={(item) => handleAlterarQuantidade(item, 1)}
          onDiminuirQtde={(item) => handleAlterarQuantidade(item, -1)}
          onRemoverItem={handleRemoverItem}
          textoBotaoPrincipal={prepago ? "Confirmar pedido" : "Enviar Pedido"}
          confirmarDesabilitado={
            pedidosForaDoHorario || (prepago && !prepagoPodePagar)
          }
        />
      )}
      
      <Toast 
        message={toastState.message}
        show={toastState.show}
        onHide={() => setToastState({ show: false, message: '', type: 'success' })}
        type={toastState.type}

      />
    </div>
  );
}