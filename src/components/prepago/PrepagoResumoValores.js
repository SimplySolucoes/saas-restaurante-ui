"use client";

/**
 * Subtotal, taxa de serviço (se repassada) e total a pagar.
 * @param {object} valores — retorno de buildPrepagoValores*
 * @param {string} [corPrincipal]
 * @param {string} [className]
 */
export default function PrepagoResumoValores({
  valores,
  corPrincipal = "#4F46E5",
  className = "",
}) {
  if (!valores) return null;

  return (
    <div className={`rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm ${className}`}>
      <div className="flex justify-between text-gray-700">
        <span>Subtotal</span>
        <span>{valores.subtotalFmt}</span>
      </div>
      {valores.mostrarTaxa ? (
        <div className="mt-1 flex justify-between text-gray-700">
          <span>Taxa de serviço</span>
          <span>{valores.taxaFmt}</span>
        </div>
      ) : null}
      <div
        className="mt-2 flex justify-between border-t border-gray-200 pt-2 font-semibold text-gray-900"
      >
        <span>Total a pagar</span>
        <span style={{ color: corPrincipal }}>{valores.totalFmt}</span>
      </div>
    </div>
  );
}
