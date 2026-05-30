"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentRequestButtonElement,
  useStripe,
} from "@stripe/react-stripe-js";
import { getPrepagoPagamentoStatus } from "@/lib/api/pedidosPrepago";
import PrepagoResumoValores from "@/components/prepago/PrepagoResumoValores";

const POLL_MS = 4000;

function StripeWalletInner({
  clientSecret,
  amountCents,
  onSuccess,
  onErro,
}) {
  const stripe = useStripe();
  const [paymentRequest, setPaymentRequest] = useState(null);
  const [indisponivel, setIndisponivel] = useState(false);

  useEffect(() => {
    if (!stripe || !amountCents) return undefined;

    const pr = stripe.paymentRequest({
      country: "BR",
      currency: "brl",
      total: {
        label: "Pedido",
        amount: amountCents,
      },
      requestPayerName: true,
      requestPayerEmail: true,
    });

    let cancelled = false;
    pr.canMakePayment().then((result) => {
      if (cancelled) return;
      if (result) {
        setPaymentRequest(pr);
        setIndisponivel(false);
      } else {
        setIndisponivel(true);
      }
    });

    const handler = async (ev) => {
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        { payment_method: ev.paymentMethod.id },
        { handleActions: false }
      );

      if (error) {
        ev.complete("fail");
        onErro?.(error.message || "Pagamento recusado.");
        return;
      }

      if (paymentIntent?.status === "requires_action") {
        const { error: actionError } = await stripe.confirmCardPayment(clientSecret);
        if (actionError) {
          ev.complete("fail");
          onErro?.(actionError.message || "Pagamento recusado.");
          return;
        }
      }

      ev.complete("success");
      onSuccess?.();
    };

    pr.on("paymentmethod", handler);
    return () => {
      cancelled = true;
      pr.off("paymentmethod", handler);
    };
  }, [stripe, amountCents, clientSecret, onSuccess, onErro]);

  if (indisponivel) {
    return (
      <p className="text-sm text-amber-700">
        Apple Pay / Google Pay não está disponível neste dispositivo ou navegador.
      </p>
    );
  }

  if (!paymentRequest) {
    return <p className="text-sm text-gray-500">A carregar carteira digital…</p>;
  }

  return (
    <PaymentRequestButtonElement
      options={{ paymentRequest }}
      className="PaymentRequestButton"
    />
  );
}

export default function ModalCheckoutStripe({
  open,
  onClose,
  stripePublishableKey,
  stripeClientSecret,
  valorCobranca,
  valoresPrepago = null,
  pedidoId,
  publicToken,
  nomeComprador,
  corPrincipal = "#4F46E5",
  onAprovado,
  onErro,
}) {
  const amount = parseFloat(String(valorCobranca || "0")) || 0;
  const amountCents = Math.round(amount * 100);

  const stripePromise = useMemo(() => {
    if (!stripePublishableKey) return null;
    return loadStripe(stripePublishableKey);
  }, [stripePublishableKey]);

  const verificarPoll = useCallback(async () => {
    if (!pedidoId || !publicToken) return;
    const r = await getPrepagoPagamentoStatus(pedidoId, publicToken);
    if (r.error) return;
    if (r.status_pagamento === "aprovado") {
      onAprovado?.({
        codigo_retirada: r.codigo_retirada || "",
        nome: nomeComprador,
      });
    }
  }, [pedidoId, publicToken, nomeComprador, onAprovado]);

  const handleSuccess = useCallback(() => {
    verificarPoll();
    const intervalId = setInterval(verificarPoll, POLL_MS);
    setTimeout(() => clearInterval(intervalId), 120000);
  }, [verificarPoll]);

  if (!open || !stripeClientSecret || !stripePublishableKey) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="stripe-wallet-modal-titulo"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <h2
          id="stripe-wallet-modal-titulo"
          className="text-lg font-bold text-gray-900"
        >
          Apple Pay / Google Pay
        </h2>
        {valoresPrepago ? (
          <PrepagoResumoValores
            valores={valoresPrepago}
            corPrincipal={corPrincipal}
            className="mt-3"
          />
        ) : (
          <p className="mt-1 text-sm text-gray-600">
            Total a pagar:{" "}
            <span className="font-semibold text-gray-900">
              R${" "}
              {amount.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </p>
        )}

        <div className="mt-4 min-h-[48px]">
          <Elements
            stripe={stripePromise}
            options={{ clientSecret: stripeClientSecret }}
          >
            <StripeWalletInner
              clientSecret={stripeClientSecret}
              amountCents={amountCents}
              onSuccess={handleSuccess}
              onErro={onErro}
            />
          </Elements>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
