"use client";

import { useEffect, useState } from "react";
import { getConfigPagamento } from "@/lib/api/pagamentosPrepago";

/**
 * Config pública de pagamento pré-pago (gateway, taxa, chaves).
 */
export default function usePrepagoPagamentoConfig(slug, enabled = true) {
  const [carregando, setCarregando] = useState(Boolean(enabled && slug));
  const [config, setConfig] = useState({
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
    repassar_taxa_ao_consumidor: false,
    taxa_servico_brl: "0.00",
  });

  useEffect(() => {
    if (!enabled || !slug) {
      setCarregando(false);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      setCarregando(true);
      const cfg = await getConfigPagamento(slug);
      if (!cancelled) {
        setConfig({
          gateway_pagamento: cfg.gateway_pagamento || "MERCADO_PAGO",
          metodos_disponiveis: cfg.metodos_disponiveis || {
            gateway: cfg.gateway_pagamento || "MERCADO_PAGO",
            pix: false,
            carteira_mp: false,
            stripe_wallet: false,
          },
          prepago_pagamento_configurado: cfg.prepago_pagamento_configurado === true,
          carteira_digital_configurada: cfg.carteira_digital_configurada === true,
          stripe_wallet_configurada: cfg.stripe_wallet_configurada === true,
          mp_public_key: cfg.mp_public_key || "",
          stripe_publishable_key: cfg.stripe_publishable_key || "",
          repassar_taxa_ao_consumidor: cfg.repassar_taxa_ao_consumidor === true,
          taxa_servico_brl: cfg.taxa_servico_brl || "0.00",
        });
        setCarregando(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, enabled]);

  return { config, carregando };
}
