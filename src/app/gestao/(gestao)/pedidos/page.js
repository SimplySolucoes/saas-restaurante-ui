"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getRestaurante } from "@/lib/api";
import { navFlagsFromRestaurante } from "@/lib/gestaoNav";

export default function GestaoPedidosPage() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = localStorage.getItem("authToken");
      if (!token) return;
      const r = await getRestaurante(token);
      if (cancelled || !r) return;
      if (!navFlagsFromRestaurante(r).pedidos) router.replace("/gestao");
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Pedidos</h1>
      <p className="text-gray-600">
        Esta área será preenchida na Etapa 2: lista de pedidos, código de retirada e filtros.
      </p>
    </div>
  );
}
