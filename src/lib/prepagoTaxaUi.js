import { formatMoeda } from "@/lib/prepagoPedidosUi";

/**
 * Monta breakdown de valores para exibição (carrinho, modais, resposta API).
 * @param {object} opts
 * @param {string|number} opts.subtotal — total do pedido / carrinho
 * @param {boolean} [opts.repassar]
 * @param {string|number} [opts.taxaServicoBrl]
 * @param {string|number} [opts.totalPagar] — se omitido, calcula
 */
export function buildPrepagoValores({
  subtotal,
  repassar = false,
  taxaServicoBrl = "0",
  totalPagar,
}) {
  const sub = parseFloat(String(subtotal ?? "0")) || 0;
  const taxa = repassar ? parseFloat(String(taxaServicoBrl ?? "0")) || 0 : 0;
  const total =
    totalPagar != null
      ? parseFloat(String(totalPagar)) || 0
      : sub + taxa;
  return {
    subtotal: sub,
    taxaServico: taxa,
    totalPagar: total,
    repassar: Boolean(repassar),
    mostrarTaxa: Boolean(repassar) && taxa > 0,
    subtotalFmt: formatMoeda(sub),
    taxaFmt: formatMoeda(taxa),
    totalFmt: formatMoeda(total),
  };
}

/** A partir de GET config-pagamento + subtotal do carrinho. */
export function buildPrepagoValoresFromConfig(config, subtotalCarrinho) {
  const repassar = config?.repassar_taxa_ao_consumidor === true;
  return buildPrepagoValores({
    subtotal: subtotalCarrinho,
    repassar,
    taxaServicoBrl: repassar ? config?.taxa_servico_brl : "0",
  });
}

/** A partir da resposta POST prepago-pedidos. */
export function buildPrepagoValoresFromPedido(result) {
  if (!result) return buildPrepagoValores({ subtotal: 0 });
  return buildPrepagoValores({
    subtotal: result.subtotal_pedido ?? result.total,
    repassar: result.repassar_taxa_ao_consumidor,
    taxaServicoBrl: result.taxa_servico_brl,
    totalPagar: result.valor_cobranca ?? result.valor_cobranca_pix,
  });
}

/** A partir de status-pagamento público. */
export function buildPrepagoValoresFromStatus(api) {
  if (!api) return buildPrepagoValores({ subtotal: 0 });
  return buildPrepagoValores({
    subtotal: api.subtotal_pedido ?? api.total,
    repassar: api.repassar_taxa_ao_consumidor,
    taxaServicoBrl: api.taxa_servico_brl,
    totalPagar: api.valor_cobranca,
  });
}
