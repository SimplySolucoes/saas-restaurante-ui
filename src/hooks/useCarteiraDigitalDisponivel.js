"use client";

import { useEffect, useState } from "react";
import { getConfigPagamento } from "@/lib/api/pagamentosPrepago";

const LABEL_CARTAO = "Pagar com cartão";

/**
 * Cartão via Card Payment Brick (Mercado Pago).
 * Disponível quando a integração MP tem public_key configurada.
 */
export default function useCarteiraDigitalDisponivel(slug, enabled = true) {
  const [carregando, setCarregando] = useState(Boolean(enabled && slug));
  const [disponivel, setDisponivel] = useState(false);
  const [mpPublicKey, setMpPublicKey] = useState("");

  useEffect(() => {
    if (!enabled || !slug) {
      setCarregando(false);
      setDisponivel(false);
      return undefined;
    }

    let cancelled = false;

    (async () => {
      setCarregando(true);
      const cfg = await getConfigPagamento(slug);
      if (cancelled) return;

      const key = (cfg.mp_public_key || "").trim();
      const backendOk =
        cfg.carteira_digital_configurada === true && key.length > 0;

      setMpPublicKey(backendOk ? key : "");
      setDisponivel(backendOk);
      setCarregando(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [slug, enabled]);

  return {
    carregando,
    disponivel,
    mpPublicKey,
    labelCarteira: LABEL_CARTAO,
  };
}
