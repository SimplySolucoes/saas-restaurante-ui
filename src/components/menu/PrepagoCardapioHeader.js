"use client";

import Link from "next/link";
import Image from "next/image";

/**
 * Header público pré-pago (mesmo visual do cardápio).
 * @param {object} restaurante - { nome, logo?, cor_principal }
 * @param {string} slug
 * @param {string} linkHref
 * @param {string} linkLabel - ex. "Meus pedidos" | "Cardápio"
 * @param {string} [subtitulo]
 */
export default function PrepagoCardapioHeader({
  restaurante,
  slug,
  linkHref,
  linkLabel,
  subtitulo = "Pedido para retirada",
  /** Se true, só o header (para agrupar com nav num sticky pai). */
  embedded = false,
}) {
  const cor = restaurante?.cor_principal || "#4F46E5";
  const nome = restaurante?.nome || "";

  const headerEl = (
      <header
        className="p-4 flex items-center justify-between gap-3 text-white"
        style={{ backgroundColor: cor }}
      >
        <div className="flex min-w-0 flex-1 items-center justify-center space-x-4">
          {restaurante?.logo ? (
            <Image
              src={restaurante.logo}
              alt={nome ? `Logo de ${nome}` : "Logo"}
              width={64}
              height={64}
              className="rounded-md object-cover shrink-0"
            />
          ) : null}
          <div className="text-left min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold truncate">{nome}</h1>
            {subtitulo ? (
              <p className="text-sm sm:text-base opacity-95">{subtitulo}</p>
            ) : null}
          </div>
        </div>
        {linkHref && linkLabel ? (
          <Link
            href={linkHref}
            className="shrink-0 rounded-lg border border-white/40 bg-white/10 px-3 py-2 text-sm font-semibold hover:bg-white/20 transition-colors"
          >
            {linkLabel}
          </Link>
        ) : null}
      </header>
  );

  if (embedded) return headerEl;
  return <div className="sticky top-0 z-20 shadow-lg">{headerEl}</div>;
}
