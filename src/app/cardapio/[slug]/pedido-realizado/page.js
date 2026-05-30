"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { getPublicCardapioData } from "@/lib/api";
import PrepagoCardapioHeader from "@/components/menu/PrepagoCardapioHeader";

function PedidoRealizadoContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params?.slug;
  const codigo = searchParams?.get("codigo") || "";
  const pedidoId = searchParams?.get("pedidoId") || "";
  const token = searchParams?.get("token") || "";
  const nomeRaw = searchParams?.get("nome") || "";
  const [restaurante, setRestaurante] = useState(null);

  let nome = "";
  try {
    nome = nomeRaw ? decodeURIComponent(nomeRaw) : "";
  } catch {
    nome = nomeRaw;
  }

  const cor = restaurante?.cor_principal || "#4F46E5";

  useEffect(() => {
    if (!slug) return;
    getPublicCardapioData(slug).then((data) => {
      if (data?.restaurante) setRestaurante(data.restaurante);
    });
  }, [slug]);

  const verPedidoHref =
    slug && pedidoId && token
      ? `/cardapio/${slug}/pedido/${pedidoId}?token=${encodeURIComponent(token)}`
      : null;

  return (
    <div className="min-h-screen bg-gray-100">
      {restaurante ? (
        <PrepagoCardapioHeader
          restaurante={restaurante}
          slug={slug}
          subtitulo="Pedido realizado"
          linkHref={`/cardapio/${slug}`}
          linkLabel="Cardápio"
        />
      ) : (
        <div className="h-20 bg-gray-200 animate-pulse" />
      )}

      <div className="flex flex-col items-center justify-center p-6 min-h-[calc(100vh-5rem)]">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
          <h1 className="text-2xl font-bold text-gray-900">Pedido realizado</h1>
          <p className="mt-3 text-gray-600">
            Obrigado{nome ? `, ${nome}` : ""}! Apresente o código abaixo na retirada.
          </p>
          {codigo ? (
            <p
              className="mt-6 font-mono text-3xl font-bold tracking-widest"
              style={{ color: cor }}
            >
              {codigo}
            </p>
          ) : (
            <p className="mt-6 text-sm text-amber-700">Código não disponível neste link.</p>
          )}
          {verPedidoHref ? (
            <Link
              href={verPedidoHref}
              className="mt-6 inline-block w-full rounded-lg border py-3 font-semibold hover:bg-gray-50"
              style={{ borderColor: cor, color: cor }}
            >
              Ver pedido
            </Link>
          ) : null}
          <Link
            href={slug ? `/cardapio/${slug}` : "/"}
            className={`inline-block w-full rounded-lg py-3 font-semibold text-white hover:opacity-90 ${verPedidoHref ? "mt-3" : "mt-8"}`}
            style={{ backgroundColor: cor }}
          >
            Voltar ao cardápio
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PedidoRealizadoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-100 text-gray-600">
          A carregar…
        </div>
      }
    >
      <PedidoRealizadoContent />
    </Suspense>
  );
}
