import { getApiUrl } from "./config";

function formatItensFromCart(cartItems) {
  return cartItems.map((item) => {
    const idsDasOpcoes = (item.gruposSelecionados || []).flatMap((grupo) =>
      grupo.opcoes.map((opcao) => opcao.id)
    );
    return {
      item_cardapio: item.produtoId,
      quantidade: item.quantidade,
      observacoes: item.observacoes || "",
      opcoes_selecionadas: idsDasOpcoes,
    };
  });
}

function normalizeCreateOpts(optsOrString) {
  if (typeof optsOrString === "string") {
    return {
      observacoesGerais: optsOrString || "",
      compradorNome: undefined,
      compradorTelefone: undefined,
      metodoPagamento: "pix",
    };
  }
  const o = optsOrString || {};
  return {
    observacoesGerais: o.observacoesGerais ?? "",
    compradorNome: o.compradorNome,
    compradorTelefone: o.compradorTelefone,
    metodoPagamento: o.metodoPagamento ?? "pix",
  };
}

/**
 * Cliente público ou staff: cria pedido pré-pago (modo bar).
 * @param {string} restauranteSlug
 * @param {Array} cartItems — mesmo formato que submitOrder
 * @param {string|null} token — opcional; se enviado, associa criado_por
 * @param {string|object} [opts] — string legada = observacoesGerais; ou { observacoesGerais, compradorNome, compradorTelefone }
 */
export async function createPedidoPrePago(
  restauranteSlug,
  cartItems,
  token = null,
  opts = ""
) {
  const { observacoesGerais, compradorNome, compradorTelefone, metodoPagamento } =
    normalizeCreateOpts(opts);

  const headers = { "Content-Type": "application/json" };
  if (token) {
    headers.Authorization = `Token ${token}`;
  }
  const payload = {
    restaurante_slug: restauranteSlug,
    metodo_pagamento: metodoPagamento,
    observacoes_gerais: observacoesGerais || "",
    comprador_nome: compradorNome,
    comprador_telefone: compradorTelefone,
    itens: formatItensFromCart(cartItems),
  };
  const response = await fetch(`${getApiUrl()}/prepago-pedidos/`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const msg =
      data.detail ||
      Object.values(data)
        .flat()
        .filter(Boolean)
        .join(" ") ||
      "Falha ao criar pedido.";
    return { error: msg };
  }
  return data;
}

/** Valor total a cobrar (pedido + taxa), com fallback legado. */
export function resolveValorCobrancaPrepago(result) {
  if (!result) return "0";
  return (
    result.valor_cobranca ||
    result.valor_cobranca_pix ||
    result.total ||
    "0"
  );
}

/**
 * Consulta status do pagamento PIX (público; requer token opaco do pedido).
 */
export async function getPrepagoPagamentoStatus(pedidoId, publicToken) {
  const url = new URL(
    `${getApiUrl()}/prepago-pedidos/${pedidoId}/status-pagamento/`
  );
  url.searchParams.set("token", publicToken);
  const response = await fetch(url.toString());
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return {
      error: data.detail || "Não foi possível consultar o pagamento.",
    };
  }
  return data;
}

export async function listPedidosPrePago(token) {
  if (!token) return [];
  const response = await fetch(`${getApiUrl()}/prepago-pedidos/`, {
    headers: { Authorization: `Token ${token}` },
  });
  if (!response.ok) return [];
  return response.json();
}

export async function patchPedidoPrePagoRetirado(token, pedidoId, retirado) {
  if (!token || !pedidoId) return { error: "Dados em falta." };
  const response = await fetch(`${getApiUrl()}/prepago-pedidos/${pedidoId}/`, {
    method: "PATCH",
    headers: {
      Authorization: `Token ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ retirado }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return {
      error: data.detail || "Falha ao atualizar.",
    };
  }
  return data;
}
