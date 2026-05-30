"use client";

import PrepagoResumoValores from "@/components/prepago/PrepagoResumoValores";

export default function ModalEscolhaPagamentoPrepago({
  open,
  onClose,
  onEscolherPix,
  onEscolherCarteira,
  mostrarCarteira = false,
  labelCarteira = "Pagar com cartão",
  gateway = "MERCADO_PAGO",
  corPrincipal = "#4F46E5",
  loadingPix = false,
  apiError = "",
  valoresPrepago = null,
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-gray-900">Como deseja pagar?</h2>
        <p className="mt-1 text-sm text-gray-600">
          Escolha a forma de pagamento para confirmar o pedido.
        </p>
        {valoresPrepago ? (
          <PrepagoResumoValores
            valores={valoresPrepago}
            corPrincipal={corPrincipal}
            className="mt-4"
          />
        ) : null}
        {apiError ? (
          <p className="mt-4 text-sm text-red-600" role="alert">
            {apiError}
          </p>
        ) : null}
        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={onEscolherPix}
            disabled={loadingPix}
            className="w-full rounded-lg px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
            style={{ backgroundColor: corPrincipal }}
          >
            {loadingPix ? "A gerar PIX…" : "Pagar com PIX"}
          </button>
          {mostrarCarteira && (
            <button
              type="button"
              onClick={onEscolherCarteira}
              disabled={loadingPix}
              className="w-full rounded-lg border-2 border-gray-800 bg-white px-4 py-3 text-sm font-semibold text-gray-900 hover:bg-gray-50 disabled:opacity-60"
            >
              {labelCarteira}
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full text-center text-sm text-gray-500 hover:text-gray-700"
        >
          Voltar
        </button>
      </div>
    </div>
  );
}
