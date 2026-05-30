/** Formata código de retirada para exibição (ex.: K7M4R9 → K7M-4R9). */
export function formatarCodigoRetirada(codigo) {
  if (!codigo) return "";
  const c = String(codigo).replace(/-/g, "").toUpperCase();
  if (c.length !== 6) return String(codigo);
  return `${c.slice(0, 3)}-${c.slice(3)}`;
}

export function formatMoeda(valor) {
  const n = Number(valor);
  if (Number.isNaN(n)) return valor ?? "—";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatHoraPedido(iso) {
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

/** Badge de retirada / pagamento para listagem. */
export function getEstadoPedidoBadge(p) {
  if (p.retirado) {
    return { label: "Retirado", className: "bg-green-100 text-green-800" };
  }
  if (p.statusPagamento === "aprovado") {
    return { label: "Aguardando retirada", className: "bg-amber-100 text-amber-900" };
  }
  if (
    p.statusPagamento === "pendente" ||
    p.statusPagamento === "processando" ||
    !p.statusPagamento
  ) {
    return { label: "Pagamento pendente", className: "bg-gray-100 text-gray-700" };
  }
  return { label: "Pagamento não concluído", className: "bg-red-50 text-red-800" };
}

export function labelValorPedido(p) {
  const pago = p.statusPagamento === "aprovado";
  const valor = p.valorCobranca ?? p.total;
  if (pago) return { prefix: "Pago", valor };
  if (
    p.statusPagamento === "pendente" ||
    p.statusPagamento === "processando" ||
    !p.statusPagamento
  ) {
    return { prefix: "Total", valor };
  }
  return { prefix: "Total", valor };
}
