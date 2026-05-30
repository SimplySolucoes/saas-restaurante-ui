"use client";

import { useCallback, useEffect, useState } from "react";
import { initMercadoPago, CardPayment } from "@mercadopago/sdk-react";
import { getPrepagoPagamentoStatus } from "@/lib/api/pedidosPrepago";
import { pagarCarteira } from "@/lib/api/pagamentosPrepago";
import PrepagoResumoValores from "@/components/prepago/PrepagoResumoValores";

const POLL_MS = 4000;

export default function ModalCheckoutCarteira({
  open,
  onClose,
  mpPublicKey,
  valorCobranca,
  valoresPrepago = null,
  pedidoId,
  publicToken,
  nomeComprador,
  corPrincipal = "#4F46E5",
  carteiraDisponivel,
  onAprovado,
  onErro,
}) {
  const [mpReady, setMpReady] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [erroLocal, setErroLocal] = useState("");
  const [brickErro, setBrickErro] = useState(false);

  const amount = parseFloat(String(valorCobranca || "0")) || 0;

  useEffect(() => {
    if (!open || !mpPublicKey || !carteiraDisponivel) {
      setMpReady(false);
      return undefined;
    }
    try {
      initMercadoPago(mpPublicKey, { locale: "pt-BR" });
      setMpReady(true);
      setBrickErro(false);
      setErroLocal("");
    } catch (e) {
      console.error("initMercadoPago:", e);
      setMpReady(false);
      setBrickErro(true);
    }
    return undefined;
  }, [open, mpPublicKey, carteiraDisponivel]);

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

  const handleSubmit = useCallback(
    async (formData) => {
      if (!pedidoId || !publicToken) return;
      setProcessando(true);
      setErroLocal("");
      const payload = {
        ...formData,
        description: formData?.description || `Pedido ${pedidoId}`,
      };
      const result = await pagarCarteira(pedidoId, publicToken, payload);
      setProcessando(false);

      if (result.error) {
        setErroLocal(result.error);
        onErro?.(result.error);
        return;
      }

      if (result.status_pagamento === "aprovado") {
        onAprovado?.({
          codigo_retirada: result.codigo_retirada || "",
          nome: nomeComprador,
        });
        return;
      }

      if (
        result.status_pagamento === "pendente" ||
        result.status_pagamento === "processando"
      ) {
        const intervalId = setInterval(verificarPoll, POLL_MS);
        verificarPoll();
        setTimeout(() => clearInterval(intervalId), 120000);
      }
    },
    [pedidoId, publicToken, nomeComprador, onAprovado, onErro, verificarPoll]
  );

  const handleBrickError = useCallback(() => {
    setBrickErro(true);
    onClose?.();
    onErro?.("Não foi possível abrir o pagamento com cartão.");
  }, [onClose, onErro]);

  if (!open || !carteiraDisponivel) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="carteira-modal-titulo"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <h2
          id="carteira-modal-titulo"
          className="text-lg font-bold text-gray-900"
        >
          Pagamento com cartão
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

        {mpReady && amount > 0 && !brickErro ? (
          <div className="mt-4 min-h-[120px]">
            <CardPayment
              initialization={{ amount }}
              customization={{
                paymentMethods: {
                  maxInstallments: 1,
                },
              }}
              onSubmit={handleSubmit}
              onError={handleBrickError}
            />
          </div>
        ) : (
          <p className="mt-4 text-sm text-gray-500">A carregar pagamento…</p>
        )}

        {processando && (
          <p className="mt-3 text-sm text-gray-600">Processando pagamento…</p>
        )}
        {erroLocal && (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {erroLocal}
          </p>
        )}

        <button
          type="button"
          onClick={onClose}
          disabled={processando}
          className="mt-6 w-full rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
