"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getPedidosRecentes } from "@/lib/prepagoPedidosLocal";

function formatHora(iso) {
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
  if (Number.isNaN(n)) return total;
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function MeusPedidosPage() {
  const params = useParams();
  const slug = params?.slug;
  const [pedidos, setPedidos] = useState([]);

  useEffect(() => {
    if (!slug) return;
    setPedidos(getPedidosRecentes(slug));
  }, [slug]);

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="mx-auto max-w-md">
        <div className="mb-6 flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Meus pedidos</h1>
          <Link
            href={slug ? `/cardapio/${slug}` : "/"}
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
          >
            Cardápio
          </Link>
        </div>

        {pedidos.length === 0 ? (
          <div className="rounded-xl bg-white p-8 text-center shadow">
            <p className="text-gray-600">Nenhum pedido nas últimas 12 horas.</p>
            <Link
              href={slug ? `/cardapio/${slug}` : "/"}
              className="mt-6 inline-block rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700"
            >
              Voltar ao cardápio
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {pedidos.map((p) => (
              <li key={p.pedidoId}>
                <Link
                  href={`/cardapio/${slug}/pedido/${p.pedidoId}?token=${encodeURIComponent(p.publicToken)}`}
                  className="block rounded-xl bg-white p-4 shadow hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-mono text-lg font-bold text-indigo-700">
                        {p.codigoRetirada || "—"}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">{formatHora(p.criadoEm)}</p>
                      {p.compradorNome ? (
                        <p className="mt-1 text-sm text-gray-700 truncate">{p.compradorNome}</p>
                      ) : null}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-gray-900">{formatTotal(p.total)}</p>
                      <span className="mt-2 inline-block text-sm font-semibold text-indigo-600">
                        Ver pedido
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
