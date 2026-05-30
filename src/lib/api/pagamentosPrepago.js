import { getApiUrl } from "./config";

const DEFAULT_CONFIG = {
  gateway_pagamento: "MERCADO_PAGO",
  metodos_disponiveis: {
    gateway: "MERCADO_PAGO",
    pix: false,
    carteira_mp: false,
    stripe_wallet: false,
  },
  prepago_pagamento_configurado: false,
  carteira_digital_configurada: false,
  stripe_wallet_configurada: false,
  mp_public_key: "",
  stripe_publishable_key: "",
  ambiente: "",
  repassar_taxa_ao_consumidor: false,
  taxa_servico_brl: "0.00",
};

export async function getConfigPagamento(slug) {
  try {
    const response = await fetch(
      `${getApiUrl()}/cardapio/${encodeURIComponent(slug)}/config-pagamento/`
    );
    if (!response.ok) {
      return { ...DEFAULT_CONFIG };
    }
    return await response.json();
  } catch (error) {
    console.error("API Error (getConfigPagamento):", error);
    return { ...DEFAULT_CONFIG };
  }
}

export async function pagarCarteira(pedidoId, publicToken, formData) {
  const response = await fetch(
    `${getApiUrl()}/prepago-pedidos/${pedidoId}/pagar-carteira/`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: publicToken,
        form_data: formData,
      }),
    }
  );
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const msg =
      data.detail ||
      (typeof data === "object"
        ? Object.values(data).flat().filter(Boolean).join(" ")
        : "") ||
      "Falha ao processar pagamento.";
    return { error: msg };
  }
  return data;
}
