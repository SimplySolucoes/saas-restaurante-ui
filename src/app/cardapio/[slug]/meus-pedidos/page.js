"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getPublicCardapioData } from "@/lib/api";
import { getPrepagoPagamentoStatus } from "@/lib/api/pedidosPrepago";
import PrepagoCardapioHeader from "@/components/menu/PrepagoCardapioHeader";
import { syncPedidosPagosLocal } from "@/lib/prepagoPedidosLocal";
import {
  formatarCodigoRetirada,
  formatHoraPedido,
  formatMoeda,
  getEstadoPedidoBadge,
  labelValorPedido,
} from "@/lib/prepagoPedidosUi";

export default function MeusPedidosPage() {
  const params = useParams();
  const slug = params?.slug;
  const [restaurante, setRestaurante] = useState(null);
  const [pedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const cor = restaurante?.cor_principal || "#4F46E5";

  const sincronizarPedidos = useCallback(async () => {
    if (!slug) return [];
    const pagos = await syncPedidosPagosLocal(slug, getPrepagoPagamentoStatus);
    setPedidos(pagos);
    return pagos;
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    getPublicCardapioData(slug).then((data) => {
      if (data?.restaurante) setRestaurante(data.restaurante);
    });
  }, [slug]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setCarregando(true);
      await sincronizarPedidos();
      if (!cancelled) setCarregando(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [sincronizarPedidos]);

  return (
    <div className="min-h-screen bg-gray-100">
      {restaurante ? (
        <PrepagoCardapioHeader
          restaurante={restaurante}
          slug={slug}
          subtitulo="Meus pedidos"
          linkHref={`/cardapio/${slug}`}
          linkLabel="Cardápio"
        />
      ) : (
        <div className="h-20 bg-gray-200 animate-pulse" />
      )}

      <div className="p-4 md:p-8">
        <div className="mx-auto max-w-md">
          {carregando ? (
            <p className="text-center text-gray-500 py-8">A carregar…</p>
          ) : pedidos.length === 0 ? (
            <div className="rounded-xl bg-white p-8 text-center shadow">
              <p className="text-gray-600">
                Nenhum pedido pago nas últimas 12 horas.
              </p>
              <Link
                href={slug ? `/cardapio/${slug}` : "/"}
                className="mt-6 inline-block rounded-lg px-6 py-3 font-semibold text-white hover:opacity-90"
                style={{ backgroundColor: cor }}
              >
                Voltar ao cardápio
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {pedidos.map((p) => {
                const badge = getEstadoPedidoBadge(p);
                const { prefix, valor } = labelValorPedido(p);
                return (
                  <li key={p.pedidoId}>
                    <Link
                      href={`/cardapio/${slug}/pedido/${p.pedidoId}?token=${encodeURIComponent(p.publicToken)}`}
                      className="block rounded-xl bg-white p-4 shadow hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p
                            className="font-mono text-lg font-bold"
                            style={{ color: cor }}
                          >
                            {p.codigoRetirada ? formatarCodigoRetirada(p.codigoRetirada) : "—"}
                          </p>
                          <p className="mt-1 text-sm text-gray-500">
                            {formatHoraPedido(p.criadoEm)}
                          </p>
                          <span
                            className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-gray-500">{prefix}</p>
                          <p className="font-semibold text-gray-900">
                            {formatMoeda(valor)}
                          </p>
                          <span
                            className="mt-2 inline-block text-sm font-semibold"
                            style={{ color: cor }}
                          >
                            Ver pedido
                          </span>
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
