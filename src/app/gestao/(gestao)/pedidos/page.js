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

function formatHora(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDesde(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function minutosRestantes(expiraEm) {
  if (!expiraEm) return null;
  const diff = Date.parse(expiraEm) - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / 60000);
}

function badgeExpira(expiraEm) {
  const min = minutosRestantes(expiraEm);
  if (min == null) return null;
  if (min <= 0) {
    return (
      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
        Expirado
      </span>
    );
  }
  if (min <= 120) {
    return (
      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900">
        Expira em {min < 60 ? `${min} min` : `${Math.floor(min / 60)}h ${min % 60}min`}
      </span>
    );
  }
  return null;
}

export default function GestaoPedidosPage() {
  const router = useRouter();
  const [pedidos, setPedidos] = useState([]);
  const [meta, setMeta] = useState({ janela_horas: 12, desde: null, count: 0, pendentes_retirada: 0 });
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState(null);
  const [modalPedidoId, setModalPedidoId] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [buscaInput, setBuscaInput] = useState("");
  const [buscaCodigo, setBuscaCodigo] = useState("");
  const [acessoOk, setAcessoOk] = useState(false);

  const carregar = useCallback(async () => {
    const token = localStorage.getItem("authToken");
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listPedidosPrePago(token, { operacional: true, codigo: buscaCodigo });
      if (data?.error) {
        setError("Não foi possível carregar os pedidos.");
        setPedidos([]);
        return;
      }
      setPedidos(Array.isArray(data?.results) ? data.results : []);
      setMeta({
        janela_horas: data?.janela_horas ?? 12,
        desde: data?.desde ?? null,
        count: data?.count ?? 0,
        pendentes_retirada: data?.pendentes_retirada ?? 0,
      });
    } catch {
      setError("Não foi possível carregar os pedidos.");
      setPedidos([]);
    } finally {
      setLoading(false);
    }
  }, [buscaCodigo]);

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
      setAcessoOk(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (!acessoOk) return;
    carregar();
  }, [acessoOk, buscaCodigo, carregar]);

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
      const msg =
        typeof result.error === "string"
          ? result.error
          : result.error?.detail || "Não foi possível atualizar.";
      setToastMessage(msg);
      return false;
    }
    setPedidos((prev) =>
      prev.map((p) =>
        p.id === pedidoId
          ? { ...p, retirado: result.retirado, retirado_em: result.retirado_em }
          : p
      )
    );
    setMeta((m) => ({
      ...m,
      pendentes_retirada: Math.max(
        0,
        m.pendentes_retirada + (result.retirado ? -1 : 1)
      ),
    }));
    return true;
  };

  const modalPedido = useMemo(
    () => (modalPedidoId != null ? pedidos.find((x) => x.id === modalPedidoId) ?? null : null),
    [modalPedidoId, pedidos]
  );

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
    <span className="inline-block max-w-full break-words rounded-md bg-indigo-50 px-2 py-2 font-mono text-base font-extrabold tracking-wide text-indigo-900 ring-1 ring-indigo-200/70 [overflow-wrap:anywhere] md:bg-transparent md:px-0 md:py-1 md:ring-0 lg:py-0">
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
          : "box-border min-h-[2.75rem] w-full min-w-0 rounded-md border border-indigo-200 bg-white px-3 py-2.5 text-center text-sm font-medium text-indigo-800 shadow-sm transition-colors hover:bg-indigo-50 disabled:opacity-50"
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

  const rowClass = (p) =>
    `transition-colors duration-150 hover:bg-gray-50 ${
      !p.retirado ? "bg-orange-50/40 ring-1 ring-inset ring-orange-100/80" : "bg-gray-100/30"
    }`;

  const emptyMessage = buscaCodigo
    ? "Nenhum pedido com este código nas últimas 12 horas."
    : "Nenhum pedido nas últimas 12 horas.";

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col self-stretch">
      <div className="mx-auto flex w-full min-w-0 max-w-screen-2xl flex-1 flex-col">
        <header className="mb-6 shrink-0 border-b border-gray-200 pb-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-gray-800 sm:text-3xl">Pedidos (pré-pago)</h1>
              <p className="mt-2 text-sm text-gray-600 sm:text-base">
                Pedidos das últimas {meta.janela_horas} horas. Não retirados expiram após{" "}
                {meta.janela_horas} horas.
              </p>
              {meta.desde && !loading && (
                <p className="mt-1 text-xs text-gray-500 sm:text-sm">
                  Desde {formatDesde(meta.desde)} · {meta.count} pedido
                  {meta.count !== 1 ? "s" : ""}
                  {meta.pendentes_retirada > 0 && (
                    <span className="font-medium text-orange-700">
                      {" "}
                      · {meta.pendentes_retirada} por retirar
                    </span>
                  )}
                </p>
              )}
            </div>
            <form
              className="flex w-full shrink-0 flex-col gap-2 sm:max-w-sm sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault();
                setBuscaCodigo(buscaInput.trim());
              }}
            >
              <input
                type="search"
                value={buscaInput}
                onChange={(e) => setBuscaInput(e.target.value)}
                placeholder="Buscar por código…"
                className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Buscar
              </button>
            </form>
          </div>
        </header>

        {loading && <p className="text-gray-500">A carregar…</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!loading && !error && pedidos.length === 0 && (
          <p className="text-gray-500">{emptyMessage}</p>
        )}

        {!loading && pedidos.length > 0 && (
          <div className="min-w-0 w-full flex-1 overflow-x-hidden border-y border-gray-200/90">
            <div className="divide-y divide-gray-200 md:hidden">
              {pedidos.map((p) => (
                <div key={`m-${p.id}`} className={`space-y-3 px-4 py-4 sm:px-6 ${rowClass(p)}`}>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="min-w-0 flex-1">{codigoConteudo(p)}</div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      {badgeRetirado(p.retirado)}
                      {!p.retirado && badgeExpira(p.expira_em)}
                    </div>
                  </div>
                  {!p.retirado && p.itens_resumo && (
                    <p className="truncate text-sm text-gray-600" title={p.itens_resumo}>
                      {textoResumoItensTabela(p.itens_resumo)}
                    </p>
                  )}
                  {botaoVerPedido(p, { table: false })}
                </div>
              ))}
            </div>

            <table className="hidden w-full min-w-0 table-fixed border-collapse text-sm text-gray-800 md:table">
              <thead className="border-b border-gray-200 bg-gray-100/80 text-left text-gray-700">
                <tr>
                  <th className="w-[14%] px-4 py-3 text-base font-extrabold text-indigo-900 lg:w-[11%] lg:font-bold">
                    Código
                  </th>
                  <th className="w-[9%] px-3 py-3 text-center lg:w-[7%]">Retirado</th>
                  <th className="min-w-0 w-[34%] px-4 py-3 lg:w-[26%]">Itens</th>
                  <th className="hidden px-3 py-3 lg:table-cell lg:w-[9%]">Horário</th>
                  <th className="hidden px-3 py-3 lg:table-cell lg:w-[16%]">Cliente</th>
                  <th className="hidden px-3 py-3 md:table-cell lg:w-[10%]">Prazo</th>
                  <th className="w-[37%] px-4 py-3 text-right lg:w-[15%]">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/80">
                {pedidos.map((p) => (
                  <tr key={p.id} className={`align-top ${rowClass(p)}`}>
                    <td className="min-w-0 px-4 py-3">{codigoConteudo(p)}</td>
                    <td className="px-3 py-3 text-center">{badgeRetirado(p.retirado)}</td>
                    <td className="min-w-0 px-4 py-3" title={p.itens_resumo}>
                      <p className="truncate text-left text-sm leading-snug text-gray-800">
                        {textoResumoItensTabela(p.itens_resumo)}
                      </p>
                    </td>
                    <td className="hidden whitespace-nowrap px-3 py-3 tabular-nums lg:table-cell">
                      {formatHora(p.data_hora)}
                    </td>
                    <td className="hidden min-w-0 px-3 py-3 text-sm text-gray-700 lg:table-cell">
                      <div className="truncate font-medium" title={p.comprador_nome}>
                        {p.comprador_nome || "—"}
                      </div>
                      <div className="truncate text-gray-500" title={p.comprador_telefone}>
                        {p.comprador_telefone || "—"}
                      </div>
                    </td>
                    <td className="hidden px-3 py-3 md:table-cell">
                      {!p.retirado ? badgeExpira(p.expira_em) : "—"}
                    </td>
                    <td className="min-w-0 px-4 py-3 text-right">
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
