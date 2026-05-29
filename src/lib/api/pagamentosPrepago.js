import { getApiUrl } from "./config";

export async function getConfigPagamento(slug) {
  try {
    const response = await fetch(
      `${getApiUrl()}/cardapio/${encodeURIComponent(slug)}/config-pagamento/`
    );
    if (!response.ok) {
      return {
        prepago_pagamento_configurado: false,
        carteira_digital_configurada: false,
        mp_public_key: "",
        ambiente: "",
      };
    }
    return await response.json();
  } catch (error) {
    console.error("API Error (getConfigPagamento):", error);
    return {
      prepago_pagamento_configurado: false,
      carteira_digital_configurada: false,
      mp_public_key: "",
      ambiente: "",
    };
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
