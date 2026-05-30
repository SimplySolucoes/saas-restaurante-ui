"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  getRestaurante,
  getGestaoCategorias,
  getGestaoItensCardapio,
  createPedidoPrePago,
  resolveValorCobrancaPrepago,
} from "@/lib/api";
import { navFlagsFromRestaurante, isModoPrePago, MODO_OPERACAO } from "@/lib/gestaoNav";

import GarcomMenu from "@/components/gestao/GarcomMenu";
import Toast from "@/components/ui/Toast";
import ResumoPedido from "@/components/cart/ResumoPedido";
import FloatingCartButton from "@/components/cart/FloatingCartButton";
import ModalDadosCompradorPrepago from "@/components/prepago/ModalDadosCompradorPrepago";
import ModalPagamentoPix from "@/components/prepago/ModalPagamentoPix";
import ModalEscolhaPagamentoPrepago from "@/components/prepago/ModalEscolhaPagamentoPrepago";
import ModalCheckoutCarteira from "@/components/prepago/ModalCheckoutCarteira";
import ModalCheckoutStripe from "@/components/prepago/ModalCheckoutStripe";
import useCarteiraDigitalDisponivel from "@/hooks/useCarteiraDigitalDisponivel";

export default function PedidoBarPage() {
  const router = useRouter();
  const [restaurante, setRestaurante] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [itens, setItens] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [carrinho, setCarrinho] = useState([]);
  const [isCarrinhoOpen, setIsCarrinhoOpen] = useState(false);
  const [toastState, setToastState] = useState({ show: false, message: "" });
  const [modalCompradorAberto, setModalCompradorAberto] = useState(false);
  const [enviandoPrepago, setEnviandoPrepago] = useState(false);
  const [erroApiPrepago, setErroApiPrepago] = useState("");
  const [modalPixAberto, setModalPixAberto] = useState(false);
  const [ctxPix, setCtxPix] = useState(null);
  const [modalEscolhaPagamentoAberto, setModalEscolhaPagamentoAberto] = useState(false);
  const [modalCarteiraAberto, setModalCarteiraAberto] = useState(false);
  const [modalStripeAberto, setModalStripeAberto] = useState(false);
  const [ctxCarteira, setCtxCarteira] = useState(null);
  const [ctxStripe, setCtxStripe] = useState(null);
  const [dadosCompradorPendentes, setDadosCompradorPendentes] = useState(null);

  const carregar = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("Token de autenticação não encontrado.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [r, cats, its] = await Promise.all([
        getRestaurante(token),
        getGestaoCategorias(token),
        getGestaoItensCardapio(token),
      ]);
      setRestaurante(r || null);
      setCategorias(cats || []);
      setItens(its || []);
    } catch {
      setError("Não foi possível carregar os dados.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  useEffect(() => {
    if (!restaurante) return;
    const nav = navFlagsFromRestaurante(restaurante);
    if (!nav.novoPedido) {
      router.replace("/gestao");
      return;
    }
    if (restaurante.modo_operacao !== MODO_OPERACAO.PRE_PAGO_WEB) {
      router.replace("/gestao/novo-pedido");
    }
  }, [restaurante, router]);

  const slug = restaurante?.slug;
  const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
  const foraDoHorario =
    isModoPrePago(restaurante) && restaurante?.aceita_pedidos_agora === false;
  const prepagoPodePagar =
    isModoPrePago(restaurante) && restaurante?.prepago_pagamento_configurado === true;
  const prepagoSemConfigPagamento =
    isModoPrePago(restaurante) && restaurante?.prepago_pagamento_configurado !== true;

  const {
    disponivel: carteiraDisponivel,
    carregando: carteiraCarregando,
    labelCarteira,
    mpPublicKey: mpPublicKeyHook,
    gateway: gatewayPagamento,
  } = useCarteiraDigitalDisponivel(slug, Boolean(slug && prepagoPodePagar));

  const handleAdicionarAoCarrinho = (itemParaAdicionar) => {
    const idOpcoes = (itemParaAdicionar.gruposSelecionados || []).flatMap((g) =>
      g.opcoes.map((o) => o.id)
    );
    const idOpcoesString = idOpcoes.sort().toString();
    const itemExistenteIndex = carrinho.findIndex((item) => {
      const idOpcoesExistente = (item.gruposSelecionados || []).flatMap((g) =>
        g.opcoes.map((o) => o.id)
      );
      return (
        item.produtoId === itemParaAdicionar.produtoId &&
        idOpcoesExistente.sort().toString() === idOpcoesString
      );
    });
    if (itemExistenteIndex > -1) {
      const novo = [...carrinho];
      novo[itemExistenteIndex].quantidade += itemParaAdicionar.quantidade;
      setCarrinho(novo);
    } else {
      setCarrinho((prev) => [...prev, { ...itemParaAdicionar, idLinhaCarrinho: Date.now() }]);
    }
    setToastState({ show: true, message: `${itemParaAdicionar.nome} adicionado!` });
  };

  const handleRemoverItem = (item) => {
    setCarrinho((prev) => prev.filter((i) => i.idLinhaCarrinho !== item.idLinhaCarrinho));
  };

  const handleAlterarQuantidade = (item, delta) => {
    setCarrinho((prev) =>
      prev
        .map((i) =>
          i.idLinhaCarrinho === item.idLinhaCarrinho
            ? { ...i, quantidade: Math.max(0, i.quantidade + delta) }
            : i
        )
        .filter((i) => i.quantidade > 0)
    );
  };

  const handleResumoConfirmar = () => {
    if (carrinho.length === 0) {
      alert("O carrinho está vazio.");
      return;
    }
    if (!token || !slug) {
      alert("Sessão inválida.");
      return;
    }
    if (foraDoHorario) {
      alert("Fora do horário de pedidos.");
      return;
    }
    if (!prepagoPodePagar) {
      setToastState({
        show: true,
        message:
          "Pagamentos não estão configurados para este estabelecimento. Conclua a integração de pagamento.",
      });
      return;
    }
    setIsCarrinhoOpen(false);
    setErroApiPrepago("");
    setModalCompradorAberto(true);
  };

  const handlePixPagamentoAprovado = useCallback(
    ({ codigo_retirada, nome }) => {
      setModalPixAberto(false);
      setCtxPix(null);
      setCarrinho([]);
      const q = new URLSearchParams();
      if (codigo_retirada) q.set("codigo", codigo_retirada);
      if (nome) q.set("nome", nome);
      router.push(`/cardapio/${slug}/pedido-realizado?${q.toString()}`);
    },
    [slug, router]
  );

  const criarPedidoPrepago = async (nome, telefone, metodoPagamento) => {
    if (!token || !slug) return null;
    setEnviandoPrepago(true);
    setErroApiPrepago("");
    const result = await createPedidoPrePago(slug, carrinho, token, {
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
    if (!token || !slug) return;
    setModalCompradorAberto(false);
    setErroApiPrepago("");
    setDadosCompradorPendentes({ nome, telefone });
    setModalEscolhaPagamentoAberto(true);
  };

  const handleEscolherPix = async () => {
    const { nome, telefone } = dadosCompradorPendentes || {};
    if (!nome || !token || !slug) return;
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
      valorCobrancaPix: resolveValorCobrancaPrepago(result),
      nome,
    });
    setModalPixAberto(true);
    setDadosCompradorPendentes(null);
  };

  const handleEscolherCarteira = async () => {
    if (!carteiraDisponivel) return;
    setModalEscolhaPagamentoAberto(false);
    const { nome, telefone } = dadosCompradorPendentes || {};
    if (!nome || !token || !slug) return;

    const gw = restaurante?.gateway_pagamento || gatewayPagamento;
    const metodo = gw === "STRIPE" ? "stripe_wallet" : "carteira";

    const result = await criarPedidoPrepago(nome, telefone, metodo);
    if (!result) {
      setModalEscolhaPagamentoAberto(true);
      return;
    }
    setModalEscolhaPagamentoAberto(false);

    if (metodo === "stripe_wallet") {
      setCtxStripe({
        pedidoId: result.id,
        publicToken: result.public_token,
        stripePublishableKey: result.stripe_publishable_key || "",
        stripeClientSecret: result.stripe_client_secret || "",
        valorCobranca: resolveValorCobrancaPrepago(result),
        nome,
      });
      setModalStripeAberto(true);
    } else {
      setCtxCarteira({
        pedidoId: result.id,
        publicToken: result.public_token,
        mpPublicKey: result.mp_public_key || mpPublicKeyHook,
        valorCobranca: resolveValorCobrancaPrepago(result),
        nome,
      });
      setModalCarteiraAberto(true);
    }
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

  if (isLoading) return <p className="p-6 text-center">A carregar...</p>;
  if (error) return <p className="p-6 text-center text-red-500">{error}</p>;

  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Novo pedido (retirada)</h1>
        <p className="text-gray-600 text-sm mt-1">
          Modo bar — pedido sem mesa; código de retirada gerado automaticamente.
        </p>
        {foraDoHorario && (
          <p className="mt-2 text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm">
            Fora do horário de pedidos configurado para este restaurante.
          </p>
        )}
        {prepagoSemConfigPagamento && (
          <p className="mt-2 text-red-800 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm">
            Mercado Pago / Stripe não está configurado ou habilitado. Não é possível criar pedidos até
            concluir a integração.
          </p>
        )}
      </div>

      <GarcomMenu
        categorias={categorias}
        itens={itens}
        onAdicionarAoCarrinho={handleAdicionarAoCarrinho}
        corPrincipal={restaurante?.cor_principal || "#4F46E5"}
      />

      <FloatingCartButton
        itemCount={carrinho.reduce((t, i) => t + i.quantidade, 0)}
        corPrincipal={restaurante?.cor_principal || "#4F46E5"}
        onClick={() => setIsCarrinhoOpen(true)}
      />

      <ModalDadosCompradorPrepago
        open={modalCompradorAberto}
        onClose={() => {
          if (!enviandoPrepago) {
            setModalCompradorAberto(false);
            setErroApiPrepago("");
          }
        }}
        corPrincipal={restaurante?.cor_principal || "#4F46E5"}
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
        gateway={restaurante?.gateway_pagamento || gatewayPagamento}
        corPrincipal={restaurante?.cor_principal || "#4F46E5"}
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
          onErro={(msg) => setToastState({ show: true, message: msg })}
        />
      )}

      {ctxStripe && (
        <ModalCheckoutStripe
          open={modalStripeAberto}
          onClose={() => {
            setModalStripeAberto(false);
            setCtxStripe(null);
          }}
          stripePublishableKey={ctxStripe.stripePublishableKey}
          stripeClientSecret={ctxStripe.stripeClientSecret}
          valorCobranca={ctxStripe.valorCobranca}
          pedidoId={ctxStripe.pedidoId}
          publicToken={ctxStripe.publicToken}
          nomeComprador={ctxStripe.nome}
          onAprovado={handleCarteiraPagamentoAprovado}
          onErro={(msg) => setToastState({ show: true, message: msg })}
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
          corPrincipal={restaurante?.cor_principal || "#4F46E5"}
          nomeComprador={ctxPix.nome}
          onPagamentoAprovado={handlePixPagamentoAprovado}
          somenteCopiaCola={
            (restaurante?.gateway_pagamento || gatewayPagamento) === "STRIPE"
          }
        />
      )}

      {isCarrinhoOpen && (
        <ResumoPedido
          itensDoCarrinho={carrinho}
          onFechar={() => setIsCarrinhoOpen(false)}
          onConfirmar={handleResumoConfirmar}
          corPrincipal={restaurante?.cor_principal || "#4F46E5"}
          onAumentarQtde={(item) => handleAlterarQuantidade(item, 1)}
          onDiminuirQtde={(item) => handleAlterarQuantidade(item, -1)}
          onRemoverItem={handleRemoverItem}
          textoBotaoPrincipal="Confirmar pedido"
          confirmarDesabilitado={foraDoHorario || !prepagoPodePagar}
        />
      )}

      <Toast
        message={toastState.message}
        show={toastState.show}
        onHide={() => setToastState({ show: false, message: "" })}
      />
    </div>
  );
}
