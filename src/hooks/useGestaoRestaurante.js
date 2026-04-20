"use client";

import { useEffect, useState, useCallback } from "react";
import { getRestaurante } from "@/lib/api";

/**
 * Dados completos do restaurante na gestão (alinha login + API /restaurantes/meu/).
 */
export default function useGestaoRestaurante(token) {
  const [restaurante, setRestaurante] = useState(null);
  const [loading, setLoading] = useState(!!token);

  const refresh = useCallback(async () => {
    if (!token) {
      setRestaurante(null);
      setLoading(false);
      return null;
    }
    setLoading(true);
    const data = await getRestaurante(token);
    setRestaurante(data);
    setLoading(false);
    if (data && typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("userData");
        if (raw) {
          const u = JSON.parse(raw);
          if (u?.restaurante?.slug === data.slug) {
            u.restaurante = {
              ...u.restaurante,
              modo_operacao: data.modo_operacao,
              gestao_nav_mesa_ativa: data.gestao_nav_mesa_ativa,
              gestao_nav_novo_pedido: data.gestao_nav_novo_pedido,
              gestao_nav_pedidos: data.gestao_nav_pedidos,
              gestao_config_mostrar_gerir_mesas: data.gestao_config_mostrar_gerir_mesas,
              permite_compra_publica: data.permite_compra_publica,
            };
            localStorage.setItem("userData", JSON.stringify(u));
          }
        }
      } catch (_) {
        /* ignore */
      }
    }
    return data;
  }, [token]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { restaurante, loading, refresh };
}
