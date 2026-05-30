"use client";

import { useEffect, useState } from "react";
import { getConfigPagamento } from "@/lib/api/pagamentosPrepago";

const LABEL_CARTAO = "Pagar com cartão";
const LABEL_STRIPE_WALLET = "Apple Pay / Google Pay";

/**
 * Métodos de carteira digital conforme gateway ativo (MP Brick ou Stripe wallet).
 */
export default function useCarteiraDigitalDisponivel(slug, enabled = true) {
  const [carregando, setCarregando] = useState(Boolean(enabled && slug));
  const [disponivel, setDisponivel] = useState(false);
  const [mpPublicKey, setMpPublicKey] = useState("");
  const [stripeWallet, setStripeWallet] = useState(false);
  const [gateway, setGateway] = useState("MERCADO_PAGO");

  useEffect(() => {
    if (!enabled || !slug) {
      setCarregando(false);
      setDisponivel(false);
      return undefined;
    }

    let cancelled = false;

    (async () => {
      setCarregando(true);
      const cfg = await getConfigPagamento(slug);
      if (cancelled) return;

      const gw = cfg.gateway_pagamento || "MERCADO_PAGO";
      setGateway(gw);

      if (gw === "STRIPE") {
        const walletOk = cfg.stripe_wallet_configurada === true;
        setStripeWallet(walletOk);
        setMpPublicKey("");
        setDisponivel(walletOk);
      } else {
        const key = (cfg.mp_public_key || "").trim();
        const backendOk =
          cfg.carteira_digital_configurada === true && key.length > 0;
        setMpPublicKey(backendOk ? key : "");
        setStripeWallet(false);
        setDisponivel(backendOk);
      }
      setCarregando(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [slug, enabled]);

  const labelCarteira =
    gateway === "STRIPE" ? LABEL_STRIPE_WALLET : LABEL_CARTAO;

  return {
    carregando,
    disponivel,
    mpPublicKey,
    stripeWallet,
    gateway,
    labelCarteira,
  };
}
