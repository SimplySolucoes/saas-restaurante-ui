"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getRestaurante, listPedidosPrePago, patchPedidoPrePagoRetirado } from "@/lib/api";
import { navFlagsFromRestaurante } from "@/lib/gestaoNav";

export default function GestaoPedidosPage() {
  const router = useRouter();
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState(null);

  const carregar = useCallback(async () => {
    const token = localStorage.getItem("authToken");
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listPedidosPrePago(token);
      setPedidos(Array.isArray(data) ? data : []);
    } catch {
      setError("Não foi possível carregar os pedidos.");
      setPedidos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = localStorage.getItem("authToken");
      if (!token) return;
      const r = await getRestaurante(token);
      if (cancelled || !r) return;
      if (!navFlagsFromRestaurante(r).pedidos) {
        router.replace("/gestao");
        return;
      }
      await carregar();
    })();
    return () => {
      cancelled = true;
    };
  }, [router, carregar]);

  const toggleRetirado = async (pedidoId, novoRetirado) => {
    const token = localStorage.getItem("authToken");
    if (!token) return;
    setUpdatingId(pedidoId);
    const result = await patchPedidoPrePagoRetirado(token, pedidoId, novoRetirado);
    setUpdatingId(null);
    if (result.error) {
      alert(result.error);
      return;
    }
    setPedidos((prev) =>
      prev.map((p) =>
        p.id === pedidoId
          ? { ...p, retirado: result.retirado, retirado_em: result.retirado_em }
          : p
      )
    );
  };

  return (
    <div className="max-w-5xl">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Pedidos (pré-pago)</h1>
      <p className="text-gray-600 mb-6">
        Lista de pedidos com código de retirada. Marque quando o cliente levantar o pedido.
      </p>

      {loading && <p className="text-gray-500">A carregar…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && pedidos.length === 0 && (
        <p className="text-gray-500">Ainda não há pedidos pré-pago registados.</p>
      )}

      {!loading && pedidos.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-700">
              <tr>
                <th className="px-4 py-3 font-semibold">Data</th>
                <th className="px-4 py-3 font-semibold">Código</th>
                <th className="px-4 py-3 font-semibold">Cliente</th>
                <th className="px-4 py-3 font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">Itens</th>
                <th className="px-4 py-3 font-semibold">Retirado</th>
                <th className="px-4 py-3 font-semibold">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pedidos.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/80">
                  <td className="px-4 py-3 whitespace-nowrap text-gray-800">
                    {p.data_hora
                      ? new Date(p.data_hora).toLocaleString("pt-BR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono font-bold tracking-wide text-indigo-700">
                      {p.codigo_retirada}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700 text-sm max-w-[10rem]">
                    <div className="font-medium truncate" title={p.comprador_nome}>
                      {p.comprador_nome || "—"}
                    </div>
                    <div className="text-gray-500 truncate" title={p.comprador_telefone}>
                      {p.comprador_telefone || "—"}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    R$ {parseFloat(p.total || 0).toFixed(2).replace(".", ",")}
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate" title={p.itens_resumo}>
                    {p.itens_resumo}
                  </td>
                  <td className="px-4 py-3">
                    {p.retirado ? (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                        Sim
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                        Não
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={updatingId === p.id}
                      onClick={() => toggleRetirado(p.id, !p.retirado)}
                      className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {p.retirado ? "Marcar não retirado" : "Marcar retirado"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
