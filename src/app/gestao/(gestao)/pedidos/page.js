"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import PedidoPrepagoDetalheModal, {
  linhasItensDeResumo,
} from "@/components/gestao/PedidoPrepagoDetalheModal";
import { getRestaurante, listPedidosPrePago, patchPedidoPrePagoRetirado } from "@/lib/api";
import { navFlagsFromRestaurante } from "@/lib/gestaoNav";

function textoResumoItensTabela(itensResumo) {
  const linhas = linhasItensDeResumo(itensResumo);
  if (linhas.length === 0) return "—";
  if (linhas.length === 1) return linhas[0];
  const mais = linhas.length - 1;
  return `${linhas[0]} e mais ${mais}`;
}

export default function GestaoPedidosPage() {
  const router = useRouter();
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState(null);
  const [modalPedidoId, setModalPedidoId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

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

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 2800);
    return () => clearTimeout(t);
  }, [toastMessage]);

  const toggleRetirado = async (pedidoId, novoRetirado) => {
    const token = localStorage.getItem("authToken");
    if (!token) return false;
    setUpdatingId(pedidoId);
    const result = await patchPedidoPrePagoRetirado(token, pedidoId, novoRetirado);
    setUpdatingId(null);
    if (result.error) {
      alert(result.error);
      return false;
    }
    setPedidos((prev) =>
      prev.map((p) =>
        p.id === pedidoId
          ? { ...p, retirado: result.retirado, retirado_em: result.retirado_em }
          : p
      )
    );
    return true;
  };

  const modalPedido = useMemo(
    () => (modalPedidoId != null ? pedidos.find((x) => x.id === modalPedidoId) ?? null : null),
    [modalPedidoId, pedidos]
  );

  const formatHora = (dataHora) =>
    dataHora
      ? new Date(dataHora).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      : "—";

  const badgeRetirado = (retirado) =>
    retirado ? (
      <span className="inline-block shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
        Sim
      </span>
    ) : (
      <span className="inline-block shrink-0 rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-800">
        Não
      </span>
    );

  const codigoConteudo = (p) => (
    <span className="inline-block max-w-full rounded-md bg-indigo-50 px-2 py-2 font-mono text-base font-extrabold tracking-wide text-indigo-900 ring-1 ring-indigo-200/70 md:bg-transparent md:px-0 md:py-1 md:ring-0 lg:py-0 break-words [overflow-wrap:anywhere]">
      {p.codigo_retirada}
    </span>
  );

  const botaoVerPedido = (p, { table } = {}) => (
    <button
      type="button"
      disabled={updatingId === p.id}
      onClick={() => setModalPedidoId(p.id)}
      className={
        table
          ? "inline-flex rounded-md px-3 py-1 text-sm font-medium text-indigo-700 ring-1 ring-indigo-200/90 transition-colors hover:bg-indigo-50 disabled:opacity-50"
          : "box-border w-full min-h-[2.75rem] min-w-0 rounded-md border border-indigo-200 bg-white px-3 py-2.5 text-center text-sm font-medium text-indigo-800 shadow-sm transition-colors hover:bg-indigo-50 disabled:opacity-50"
      }
    >
      Ver Pedido
    </button>
  );

  const handleMarcarRetiradoModal = async (pedido) => {
    const ok = await toggleRetirado(pedido.id, !pedido.retirado);
    if (ok) {
      setToastMessage(
        pedido.retirado ? "Marcado como não retirado." : "Marcado como retirado."
      );
    }
    return ok;
  };

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col self-stretch">
      <div className="mx-auto flex w-full min-w-0 max-w-screen-2xl flex-1 flex-col">
      <header className="mb-6 shrink-0 border-b border-gray-200 pb-6">
        <h1 className="text-2xl font-bold text-gray-800 sm:text-3xl">Pedidos (pré-pago)</h1>
        <p className="mt-2 text-sm text-gray-600 sm:text-base">
          Lista de pedidos com código de retirada. Marque quando o cliente levantar o pedido.
        </p>
      </header>

      {loading && <p className="text-gray-500">A carregar…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && pedidos.length === 0 && (
        <p className="text-gray-500">Ainda não há pedidos pré-pago registados.</p>
      )}

      {!loading && pedidos.length > 0 && (
        <div className="min-w-0 w-full flex-1 overflow-x-hidden border-y border-gray-200/90">
          <div className="divide-y divide-gray-200 md:hidden">
            {pedidos.map((p) => (
              <div
                key={`m-${p.id}`}
                className="space-y-3 bg-gray-100/30 px-6 py-4 transition-colors duration-150 hover:bg-gray-50"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-1">{codigoConteudo(p)}</div>
                  <div className="shrink-0">{badgeRetirado(p.retirado)}</div>
                </div>
                {botaoVerPedido(p, { table: false })}
              </div>
            ))}
          </div>

          <table className="hidden w-full min-w-0 table-fixed border-collapse text-sm text-gray-800 md:table">
            <thead className="border-b border-gray-200 bg-gray-100/80 text-left text-gray-700">
              <tr>
                <th className="w-[14%] px-4 py-3 text-base font-extrabold text-indigo-900 md:py-3 lg:w-[11%] lg:font-bold">
                  Código
                </th>
                <th className="w-[9%] px-3 py-3 text-center md:py-3 lg:w-[7%]">Retirado</th>
                <th className="min-w-0 w-[40%] px-4 py-3 md:py-3 lg:w-[30%]">Itens</th>
                <th className="hidden px-3 py-3 lg:table-cell lg:w-[9%]">Horário</th>
                <th className="hidden px-3 py-3 lg:table-cell lg:w-[18%]">Cliente</th>
                <th className="w-[37%] px-4 py-3 text-right md:py-3 lg:w-[15%]">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200/80">
              {pedidos.map((p) => (
                <tr
                  key={p.id}
                  className="align-top bg-gray-100/30 transition-colors duration-150 hover:bg-gray-50"
                >
                  <td className="min-w-0 px-4 py-3 md:py-3 lg:py-3">{codigoConteudo(p)}</td>
                  <td className="px-3 py-3 text-center md:py-3 lg:py-3">{badgeRetirado(p.retirado)}</td>
                  <td className="min-w-0 px-4 py-3 md:py-3 lg:py-3" title={p.itens_resumo}>
                    <p className="truncate text-left text-sm leading-snug text-gray-800">
                      {textoResumoItensTabela(p.itens_resumo)}
                    </p>
                  </td>
                  <td className="hidden whitespace-nowrap px-3 py-3 tabular-nums lg:table-cell lg:py-3">
                    {formatHora(p.data_hora)}
                  </td>
                  <td className="hidden min-w-0 px-3 py-3 text-sm text-gray-700 lg:table-cell lg:py-3">
                    <div className="truncate font-medium" title={p.comprador_nome}>
                      {p.comprador_nome || "—"}
                    </div>
                    <div className="truncate text-gray-500" title={p.comprador_telefone}>
                      {p.comprador_telefone || "—"}
                    </div>
                  </td>
                  <td className="min-w-0 px-4 py-3 text-right md:py-3 lg:py-3">
                    <div className="flex justify-end">{botaoVerPedido(p, { table: true })}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </div>

      {modalPedido && (
        <PedidoPrepagoDetalheModal
          pedido={modalPedido}
          onClose={() => setModalPedidoId(null)}
          onMarcarRetirado={handleMarcarRetiradoModal}
          updating={updatingId === modalPedido.id}
        />
      )}

      {toastMessage && (
        <div
          className="pointer-events-none fixed bottom-6 left-1/2 z-[60] max-w-[min(90vw,24rem)] -translate-x-1/2 rounded-lg bg-gray-900 px-4 py-2.5 text-center text-sm font-medium text-white shadow-lg"
          role="status"
        >
          {toastMessage}
        </div>
      )}
    </div>
  );
}
