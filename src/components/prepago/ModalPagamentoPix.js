"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getPrepagoPagamentoStatus } from "@/lib/api/pedidosPrepago";

const POLL_MS = 3000;

export default function ModalPagamentoPix({
  open,
  onClose,
  pedidoId,
  publicToken,
  pixCopiaCola,
  valorCobrancaPix,
  corPrincipal,
  nomeComprador,
  onPagamentoAprovado,
}) {
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [erroPoll, setErroPoll] = useState("");
  const [copiado, setCopiado] = useState(false);
  const intervalRef = useRef(null);
  const onAprovadoRef = useRef(onPagamentoAprovado);
  useEffect(() => {
    onAprovadoRef.current = onPagamentoAprovado;
  }, [onPagamentoAprovado]);

  useEffect(() => {
    if (!open || !pixCopiaCola) {
      setQrDataUrl("");
      return undefined;
    }
    let cancelled = false;
    import("qrcode")
      .then((QR) =>
        QR.default.toDataURL(pixCopiaCola, { margin: 2, width: 220 })
      )
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl("");
      });
    return () => {
      cancelled = true;
    };
  }, [open, pixCopiaCola]);

  const verificar = useCallback(async () => {
    if (!pedidoId || !publicToken) return;
    const r = await getPrepagoPagamentoStatus(pedidoId, publicToken);
    if (r.error) {
      setErroPoll(r.error);
      return;
    }
    setErroPoll("");
    if (r.status_pagamento === "aprovado") {
      onAprovadoRef.current({
        codigo_retirada: r.codigo_retirada || "",
        nome: nomeComprador,
      });
    }
  }, [pedidoId, publicToken, nomeComprador]);

  useEffect(() => {
    if (!open || !pedidoId || !publicToken) return undefined;
    verificar();
    intervalRef.current = setInterval(verificar, POLL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [open, pedidoId, publicToken, verificar]);

  const copiar = async () => {
    if (!pixCopiaCola) return;
    try {
      await navigator.clipboard.writeText(pixCopiaCola);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      setErroPoll("Não foi possível copiar. Selecione o código e copie manualmente.");
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pix-modal-titulo"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <h2
          id="pix-modal-titulo"
          className="text-lg font-semibold text-gray-900"
        >
          Pagamento PIX
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Escaneie o QR Code ou use copia e cola no app do seu banco. O pedido só
          é confirmado após o pagamento.
        </p>
        {valorCobrancaPix && (
          <p className="mt-3 text-base font-medium text-gray-800">
            Valor:{" "}
            <span style={{ color: corPrincipal }}>
              R$ {Number(valorCobrancaPix).toFixed(2).replace(".", ",")}
            </span>
          </p>
        )}

        {qrDataUrl && (
          <div className="mt-4 flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="QR Code PIX" className="rounded-lg border border-gray-200" />
          </div>
        )}

        <div className="mt-4">
          <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide">
            Copia e cola
          </label>
          <textarea
            readOnly
            className="mt-1 w-full rounded-lg border border-gray-300 bg-gray-50 p-2 text-xs text-gray-800 font-mono break-all min-h-[72px]"
            value={pixCopiaCola || ""}
            rows={3}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={copiar}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: corPrincipal }}
          >
            {copiado ? "Copiado!" : "Copiar código"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700"
          >
            Fechar
          </button>
        </div>

        {erroPoll && (
          <p className="mt-3 text-sm text-red-600" role="alert">
            {erroPoll}
          </p>
        )}
      </div>
    </div>
  );
}
