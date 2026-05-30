"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { getPublicCardapioData } from "@/lib/api";
import { getPrepagoPagamentoStatus } from "@/lib/api/pedidosPrepago";
import PrepagoCardapioHeader from "@/components/menu/PrepagoCardapioHeader";
import {
  entryFromStatusApi,
  getPedidoLocal,
  upsertPedidoLocal,
} from "@/lib/prepagoPedidosLocal";
import PrepagoResumoValores from "@/components/prepago/PrepagoResumoValores";
import {
  formatarCodigoRetirada,
  formatHoraPedido,
  formatMoeda,
  getEstadoPedidoBadge,
} from "@/lib/prepagoPedidosUi";
import { buildPrepagoValoresFromStatus } from "@/lib/prepagoTaxaUi";

const POLL_MS = 4000;

function pagamentoPendente(st) {
  return st === "pendente" || st === "processando" || st == null || st === "";
}

function statusPagamentoLabel(st) {
  if (!st) return "Aguardando pagamento";
  if (st === "aprovado") return "Pagamento confirmado";
  if (st === "pendente" || st === "processando") return "Aguardando confirmação do pagamento";
  if (st === "cancelado" || st === "rejeitado") return "Pagamento não concluído";
  return st;
}

function PedidoDetalheContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params?.slug;
  const pedidoId = params?.id;
  const token = searchParams?.get("token") || "";

  const [restaurante, setRestaurante] = useState(null);
  const [local, setLocal] = useState(null);
  const [api, setApi] = useState(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);

  const cor = restaurante?.cor_principal || "#4F46E5";

  useEffect(() => {
    if (!slug) return;
    getPublicCardapioData(slug).then((data) => {
      if (data?.restaurante) setRestaurante(data.restaurante);
    });
  }, [slug]);

  const carregar = useCallback(async () => {
    if (!pedidoId || !token) {
      setErro("Link inválido. Falta o identificador do pedido.");
      setCarregando(false);
      return;
    }
    if (slug) {
      setLocal(getPedidoLocal(slug, pedidoId));
    }
    const r = await getPrepagoPagamentoStatus(pedidoId, token);
    if (r.error) {
      setErro(r.error);
      setApi(null);
    } else {
      setErro("");
      setApi(r);
      if (slug && r.status_pagamento === "aprovado") {
        upsertPedidoLocal(slug, {
          pedidoId: Number(pedidoId),
          publicToken: token,
          ...entryFromStatusApi(r),
        });
        setLocal(getPedidoLocal(slug, pedidoId));
      } else if (slug) {
        setLocal(null);
      }
    }
    setCarregando(false);
  }, [pedidoId, token, slug]);

  useEffect(() => {
    setCarregando(true);
    carregar();
  }, [carregar]);

  useEffect(() => {
    if (!pedidoId || !token || !api) return undefined;
    const st = api.status_pagamento;
    if (!pagamentoPendente(st)) {
      return undefined;
    }
    const id = setInterval(carregar, POLL_MS);
    return () => clearInterval(id);
  }, [pedidoId, token, api?.status_pagamento, carregar]);

  const codigo = api?.codigo_retirada || local?.codigoRetirada || "";
  const nome = api?.comprador_nome || local?.compradorNome || "";
  const dataHora = api?.data_hora || local?.criadoEm;
  const itens = api?.itens || [];

  const estadoLocal = local || {
    statusPagamento: api?.status_pagamento,
    retirado: api?.retirado,
  };
  const badge = getEstadoPedidoBadge({
    ...estadoLocal,
    statusPagamento: api?.status_pagamento ?? estadoLocal.statusPagamento,
    retirado: api?.retirado ?? estadoLocal.retirado,
  });
  const valoresResumo = api ? buildPrepagoValoresFromStatus(api) : null;

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
        <p className="text-red-600">Link inválido.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {restaurante ? (
        <PrepagoCardapioHeader
          restaurante={restaurante}
          slug={slug}
          subtitulo="Ver pedido"
          linkHref={`/cardapio/${slug}`}
          linkLabel="Cardápio"
        />
      ) : (
        <div className="h-20 bg-gray-200 animate-pulse" />
      )}

      <div className="p-4 md:p-8">
        <div className="mx-auto max-w-md">
          {carregando && !api ? (
            <p className="text-center text-gray-500">A carregar…</p>
          ) : erro && !api ? (
            <div className="rounded-xl bg-white p-6 text-center shadow">
              <p className="text-red-600">{erro}</p>
              <Link
                href={slug ? `/cardapio/${slug}` : "/"}
                className="mt-6 inline-block font-semibold"
                style={{ color: cor }}
              >
                Voltar ao cardápio
              </Link>
            </div>
          ) : (
            <div className="rounded-xl bg-white p-6 shadow-lg">
              {nome ? <p className="text-gray-600">{nome}</p> : null}
              {dataHora ? (
                <p className="mt-1 text-sm text-gray-500">{formatHoraPedido(dataHora)}</p>
              ) : null}

              <span
                className={`mt-3 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}
              >
                {badge.label}
              </span>

              <p className="mt-3 text-sm text-gray-600">
                {statusPagamentoLabel(api?.status_pagamento)}
              </p>

              {codigo ? (
                <p
                  className="mt-4 font-mono text-3xl font-bold tracking-widest text-center"
                  style={{ color: cor }}
                >
                  {formatarCodigoRetirada(codigo)}
                </p>
              ) : (
                <p className="mt-4 text-center text-sm text-amber-700">
                  Aguardando confirmação do pagamento. O código aparecerá aqui quando o pagamento for confirmado.
                </p>
              )}

              {valoresResumo ? (
                <PrepagoResumoValores
                  valores={valoresResumo}
                  corPrincipal={cor}
                  className="mt-4"
                />
              ) : null}

              {itens.length > 0 ? (
                <ul className="mt-6 divide-y divide-gray-100 border-t border-gray-100 pt-4">
                  {itens.map((item, idx) => (
                    <li key={idx} className="py-2 flex justify-between gap-2 text-sm">
                      <span className="text-gray-800">
                        {item.quantidade}x {item.nome}
                        {item.observacoes ? (
                          <span className="block text-gray-500 text-xs">{item.observacoes}</span>
                        ) : null}
                      </span>
                      <span className="font-medium text-gray-900 shrink-0">
                        {formatMoeda(item.subtotal)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}

              <div className="mt-8 flex flex-col gap-2">
                <Link
                  href={slug ? `/cardapio/${slug}/meus-pedidos` : "/"}
                  className="w-full rounded-lg border border-gray-300 py-3 text-center font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Meus pedidos
                </Link>
                <Link
                  href={slug ? `/cardapio/${slug}` : "/"}
                  className="w-full rounded-lg py-3 text-center font-semibold text-white hover:opacity-90"
                  style={{ backgroundColor: cor }}
                >
                  Voltar ao cardápio
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PedidoDetalhePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-100 text-gray-600">
          A carregar…
        </div>
      }
    >
      <PedidoDetalheContent />
    </Suspense>
  );
}
