"use client";

import { useEffect } from "react";
import { formatarCodigoRetirada } from "@/lib/prepagoPedidosUi";

export function linhasItensDeResumo(itensResumo) {
  if (!itensResumo || String(itensResumo).trim() === "—") return [];
  return String(itensResumo)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function contarItensResumo(itensResumo) {
  return linhasItensDeResumo(itensResumo).length;
}

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden>
    <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export default function PedidoPrepagoDetalheModal({ pedido, onClose, onMarcarRetirado, updating }) {
  useEffect(() => {
    if (!pedido) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [pedido]);

  useEffect(() => {
    if (!pedido) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pedido, onClose]);

  if (!pedido) return null;

  const linhas = linhasItensDeResumo(pedido.itens_resumo);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="prepago-modal-titulo"
      onClick={onClose}
    >
      <div
        className="flex max-h-[min(90vh,40rem)] w-full max-w-lg flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-200 bg-gray-50/80 px-5 py-4">
          <div className="min-w-0 flex-1">
            <p id="prepago-modal-titulo" className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Código de retirada
            </p>
            <p className="mt-1 break-all font-mono text-2xl font-extrabold tracking-wide text-indigo-900 sm:text-3xl">
              {formatarCodigoRetirada(pedido.codigo_retirada)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md p-2 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-800"
            aria-label="Fechar"
          >
            <CloseIcon />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6">
          <h3 className="text-sm font-semibold tracking-wide text-gray-800">Itens do pedido</h3>
          {linhas.length === 0 ? (
            <p className="mt-5 text-base leading-relaxed text-gray-500">Sem detalhe de itens.</p>
          ) : (
            <ul className="mt-5 space-y-4">
              {linhas.map((linha, i) => (
                <li
                  key={`${i}-${linha.slice(0, 24)}`}
                  className="flex gap-4 rounded-lg border border-gray-100 bg-white px-4 py-4 text-lg font-normal leading-relaxed tracking-normal text-gray-900 shadow-sm"
                >
                  <span
                    className="mt-1.5 flex h-4 w-4 shrink-0 rounded border-2 border-indigo-300 bg-indigo-50"
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">{linha}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-gray-200 bg-gray-50 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-4 py-2.5 text-sm font-semibold text-gray-700 ring-1 ring-gray-300 transition-colors hover:bg-gray-100"
          >
            Fechar
          </button>
          <button
            type="button"
            disabled={updating}
            onClick={async () => {
              const ok = await onMarcarRetirado(pedido);
              if (ok === true) onClose();
            }}
            className="rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-50 sm:min-w-[12rem]"
          >
            {updating
              ? "A atualizar…"
              : pedido.retirado
                ? "Marcar como não retirado"
                : "Marcar como retirado"}
          </button>
        </footer>
      </div>
    </div>
  );
}
