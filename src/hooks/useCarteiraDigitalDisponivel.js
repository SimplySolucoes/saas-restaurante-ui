"use client";

import { useEffect, useState } from "react";
import { getConfigPagamento } from "@/lib/api/pagamentosPrepago";

const LABEL_STRIPE_WALLET = "Apple Pay / Google Pay";

async function detectApplePay() {
  if (typeof window === "undefined") return false;
  if (!window.isSecureContext) return false;
  try {
    const APS = window.ApplePaySession;
    if (!APS || typeof APS.canMakePayments !== "function") return false;
    return APS.canMakePayments();
  } catch {
    return false;
  }
}

async function detectGooglePay() {
  if (typeof window === "undefined") return false;
  if (!window.isSecureContext) return false;
  if (typeof window.PaymentRequest === "undefined") return false;
  try {
    const pr = new PaymentRequest(
      [
        {
          supportedMethods: "https://google.com/pay",
          data: {
            apiVersion: 2,
            apiVersionMinor: 0,
            allowedPaymentMethods: [
              {
                type: "CARD",
                parameters: {
                  allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
                  allowedCardNetworks: ["VISA", "MASTERCARD", "AMEX", "ELO"],
                },
              },
            ],
          },
        },
      ],
      { total: { label: "Test", amount: { currency: "BRL", value: "1.00" } } }
    );
    return await pr.canMakePayment();
  } catch {
    return false;
  }
}

/**
 * Métodos de carteira digital conforme gateway ativo (MP Brick ou Stripe wallet).
 */
export default function useCarteiraDigitalDisponivel(slug, enabled = true) {
  const [carregando, setCarregando] = useState(Boolean(enabled && slug));
  const [disponivel, setDisponivel] = useState(false);
  const [mpPublicKey, setMpPublicKey] = useState("");
  const [applePay, setApplePay] = useState(false);
  const [googlePay, setGooglePay] = useState(false);
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
        setApplePay(false);
        setGooglePay(false);
        setDisponivel(walletOk);
      } else {
        const key = (cfg.mp_public_key || "").trim();
        const backendOk =
          cfg.carteira_digital_configurada === true && key.length > 0;

        if (!backendOk) {
          setMpPublicKey("");
          setApplePay(false);
          setGooglePay(false);
          setStripeWallet(false);
          setDisponivel(false);
          setCarregando(false);
          return;
        }

        const [ap, gp] = await Promise.all([
          detectApplePay(),
          detectGooglePay(),
        ]);
        if (cancelled) return;

        setMpPublicKey(key);
        setApplePay(ap);
        setGooglePay(gp);
        setStripeWallet(false);
        setDisponivel(ap || gp);
      }
      setCarregando(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [slug, enabled]);

  const labelCarteira =
    gateway === "STRIPE"
      ? LABEL_STRIPE_WALLET
      : applePay && googlePay
        ? "Apple Pay ou Google Pay"
        : applePay
          ? "Apple Pay"
          : googlePay
            ? "Google Pay"
            : "";

  return {
    carregando,
    disponivel,
    mpPublicKey,
    applePay,
    googlePay,
    stripeWallet,
    gateway,
    labelCarteira,
  };
}
