"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";

function PedidoRealizadoContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params?.slug;
  const codigo = searchParams?.get("codigo") || "";
  const nomeRaw = searchParams?.get("nome") || "";
  let nome = "";
  try {
    nome = nomeRaw ? decodeURIComponent(nomeRaw) : "";
  } catch {
    nome = nomeRaw;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-lg">
        <h1 className="text-2xl font-bold text-gray-900">Pedido realizado</h1>
        <p className="mt-3 text-gray-600">
          Obrigado{nome ? `, ${nome}` : ""}! Apresente o código abaixo na retirada.
        </p>
        {codigo ? (
          <p className="mt-6 font-mono text-3xl font-bold tracking-widest text-indigo-700">{codigo}</p>
        ) : (
          <p className="mt-6 text-sm text-amber-700">Código não disponível neste link.</p>
        )}
        <Link
          href={slug ? `/cardapio/${slug}` : "/"}
          className="mt-8 inline-block w-full rounded-lg bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700"
        >
          Voltar ao cardápio
        </Link>
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
