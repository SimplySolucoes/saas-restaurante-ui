"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  getRestaurante,
  getGestaoCategorias,
  getGestaoItensCardapio,
  createPedidoPrePago,
} from "@/lib/api";
import { navFlagsFromRestaurante, isModoPrePago, MODO_OPERACAO } from "@/lib/gestaoNav";

import GarcomMenu from "@/components/gestao/GarcomMenu";
import Toast from "@/components/ui/Toast";
import ResumoPedido from "@/components/cart/ResumoPedido";
import FloatingCartButton from "@/components/cart/FloatingCartButton";
import ModalDadosCompradorPrepago from "@/components/prepago/ModalDadosCompradorPrepago";

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
    setIsCarrinhoOpen(false);
    setErroApiPrepago("");
    setModalCompradorAberto(true);
  };

  const handleModalCompradorConfirmar = async (nome, telefone) => {
    if (!token || !slug) return;
    setEnviandoPrepago(true);
    setErroApiPrepago("");
    const result = await createPedidoPrePago(slug, carrinho, token, {
      observacoesGerais: "",
      compradorNome: nome,
      compradorTelefone: telefone,
    });
    setEnviandoPrepago(false);
    if (result?.error) {
      setErroApiPrepago(result.error);
      return;
    }
    setModalCompradorAberto(false);
    setCarrinho([]);
    const codigo = result.codigo_retirada || "";
    const q = new URLSearchParams();
    if (codigo) q.set("codigo", codigo);
    if (nome) q.set("nome", nome);
    router.push(`/cardapio/${slug}/pedido-realizado?${q.toString()}`);
  };

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
          confirmarDesabilitado={foraDoHorario}
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
