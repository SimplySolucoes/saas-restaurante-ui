"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { getPrepagoPagamentoStatus } from "@/lib/api/pedidosPrepago";
import { getPedidoLocal, upsertPedidoLocal } from "@/lib/prepagoPedidosLocal";

const POLL_MS = 4000;

function pagamentoPendente(st) {
  return st === "pendente" || st === "processando" || st == null || st === "";
}

function formatHora(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function formatTotal(total) {
  const n = Number(total);
  if (Number.isNaN(n)) return total ?? "—";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
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

  const [local, setLocal] = useState(null);
  const [api, setApi] = useState(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);

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
      if (slug && r.codigo_retirada) {
        upsertPedidoLocal(slug, {
          pedidoId: Number(pedidoId),
          publicToken: token,
          codigoRetirada: r.codigo_retirada,
          total: r.total,
          compradorNome: r.comprador_nome || "",
          criadoEm: r.data_hora || new Date().toISOString(),
        });
        setLocal(getPedidoLocal(slug, pedidoId));
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
  const total = api?.total ?? local?.total;
  const nome = api?.comprador_nome || local?.compradorNome || "";
  const dataHora = api?.data_hora || local?.criadoEm;
  const itens = api?.itens || [];

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
        <p className="text-red-600">Link inválido.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="mx-auto max-w-md">
        {carregando && !api ? (
          <p className="text-center text-gray-500">A carregar…</p>
        ) : erro && !api ? (
          <div className="rounded-xl bg-white p-6 text-center shadow">
            <p className="text-red-600">{erro}</p>
            <Link
              href={slug ? `/cardapio/${slug}` : "/"}
              className="mt-6 inline-block text-indigo-600 font-semibold"
            >
              Voltar ao cardápio
            </Link>
          </div>
        ) : (
          <div className="rounded-xl bg-white p-6 shadow-lg">
            <h1 className="text-xl font-bold text-gray-900">Pedido</h1>
            {nome ? <p className="mt-1 text-gray-600">{nome}</p> : null}
            {dataHora ? (
              <p className="mt-1 text-sm text-gray-500">{formatHora(dataHora)}</p>
            ) : null}

            <p className="mt-4 text-sm text-gray-600">
              {statusPagamentoLabel(api?.status_pagamento)}
            </p>

            {codigo ? (
              <p className="mt-4 font-mono text-3xl font-bold tracking-widest text-indigo-700 text-center">
                {codigo}
              </p>
            ) : (
              <p className="mt-4 text-center text-sm text-amber-700">
                Aguardando confirmação do pagamento. O código aparecerá aqui quando o pagamento for confirmado.
              </p>
            )}

            {api?.retirado ? (
              <p className="mt-2 text-center text-sm font-medium text-green-700">Já retirado</p>
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
                      {formatTotal(item.subtotal)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}

            {total != null ? (
              <p className="mt-4 text-right text-lg font-bold text-gray-900">
                Total: {formatTotal(total)}
              </p>
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
                className="w-full rounded-lg bg-indigo-600 py-3 text-center font-semibold text-white hover:bg-indigo-700"
              >
                Voltar ao cardápio
              </Link>
            </div>
          </div>
        )}
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
