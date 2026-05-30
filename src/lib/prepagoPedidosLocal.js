/** Pedidos pré-pago no mesmo dispositivo (janela rolante de 12h), por slug do restaurante. */

export const JANELA_MS = 12 * 60 * 60 * 1000;

function storageKey(slug) {
  return `prepago_pedidos_${slug}`;
}

function compradorKey(slug) {
  return `prepago_comprador_${slug}`;
}

function isBrowser() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function parseRaw(slug) {
  if (!isBrowser() || !slug) return [];
  try {
    const raw = localStorage.getItem(storageKey(slug));
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function persist(slug, entries) {
  if (!isBrowser() || !slug) return;
  localStorage.setItem(storageKey(slug), JSON.stringify(entries));
}

function withinWindow(criadoEm) {
  const t = Date.parse(criadoEm);
  if (Number.isNaN(t)) return false;
  return Date.now() - t < JANELA_MS;
}

function normalizeEntry(entry) {
  if (!entry || entry.pedidoId == null || !entry.publicToken) return null;
  return {
    pedidoId: Number(entry.pedidoId),
    publicToken: String(entry.publicToken),
    criadoEm: entry.criadoEm || new Date().toISOString(),
    codigoRetirada: entry.codigoRetirada || "",
    total: entry.total != null ? String(entry.total) : "0",
    valorCobranca:
      entry.valorCobranca != null
        ? String(entry.valorCobranca)
        : entry.total != null
          ? String(entry.total)
          : "0",
    compradorNome: entry.compradorNome || "",
    retirado: Boolean(entry.retirado),
    statusPagamento: entry.statusPagamento ?? null,
  };
}

/** Remove expirados, ordena do mais recente ao mais antigo. */
export function getPedidosRecentes(slug) {
  const fresh = parseRaw(slug)
    .map(normalizeEntry)
    .filter(Boolean)
    .filter((e) => withinWindow(e.criadoEm))
    .sort((a, b) => Date.parse(b.criadoEm) - Date.parse(a.criadoEm));
  persist(slug, fresh);
  return fresh;
}

export function getPedidoLocal(slug, pedidoId) {
  const id = Number(pedidoId);
  return getPedidosRecentes(slug).find((e) => e.pedidoId === id) || null;
}

/**
 * Insere ou atualiza por pedidoId. Mantém criadoEm original se já existir.
 */
export function upsertPedidoLocal(slug, partial) {
  const normalized = normalizeEntry({
    criadoEm: new Date().toISOString(),
    ...partial,
  });
  if (!normalized || !slug) return null;

  const all = parseRaw(slug).map(normalizeEntry).filter(Boolean);
  const idx = all.findIndex((e) => e.pedidoId === normalized.pedidoId);
  if (idx >= 0) {
    const prev = all[idx];
    all[idx] = {
      ...prev,
      ...normalized,
      criadoEm: prev.criadoEm || normalized.criadoEm,
    };
  } else {
    all.push(normalized);
  }

  const fresh = all
    .filter((e) => withinWindow(e.criadoEm))
    .sort((a, b) => Date.parse(b.criadoEm) - Date.parse(a.criadoEm));
  persist(slug, fresh);
  return fresh.find((e) => e.pedidoId === normalized.pedidoId) || normalized;
}

/** Atualiza campos vindos de status-pagamento (API pública). */
export function entryFromStatusApi(api) {
  if (!api) return {};
  return {
    codigoRetirada: api.codigo_retirada || "",
    total: api.total != null ? String(api.total) : undefined,
    valorCobranca:
      api.valor_cobranca != null
        ? String(api.valor_cobranca)
        : api.total != null
          ? String(api.total)
          : undefined,
    retirado: Boolean(api.retirado),
    statusPagamento: api.status_pagamento ?? null,
    compradorNome: api.comprador_nome || undefined,
    criadoEm: api.data_hora || undefined,
  };
}

/** Nome e telefone do comprador no mesmo dispositivo (12h, por slug). */
export function getCompradorLocal(slug) {
  if (!isBrowser() || !slug) return null;
  try {
    const raw = localStorage.getItem(compradorKey(slug));
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data?.atualizadoEm || !withinWindow(data.atualizadoEm)) {
      localStorage.removeItem(compradorKey(slug));
      return null;
    }
    const nome = (data.nome || "").trim();
    const telefone = (data.telefone || "").trim();
    if (!nome && !telefone) return null;
    return { nome, telefone };
  } catch {
    return null;
  }
}

export function saveCompradorLocal(slug, nome, telefone) {
  if (!isBrowser() || !slug) return;
  const n = (nome || "").trim();
  const t = (telefone || "").trim();
  if (!n && !t) return;
  localStorage.setItem(
    compradorKey(slug),
    JSON.stringify({
      nome: n,
      telefone: t,
      atualizadoEm: new Date().toISOString(),
    })
  );
}

/** Monta entrada a partir da resposta POST prepago-pedidos. */
export function entryFromCreateResponse(result, compradorNome) {
  if (!result?.id || !result?.public_token) return null;
  const valor =
    result.valor_cobranca ||
    result.valor_cobranca_pix ||
    result.total ||
    "0";
  return {
    pedidoId: result.id,
    publicToken: result.public_token,
    criadoEm: result.data_hora || new Date().toISOString(),
    codigoRetirada: result.codigo_retirada || "",
    total: result.total != null ? String(result.total) : "0",
    valorCobranca: String(valor),
    compradorNome: compradorNome || result.comprador_nome || "",
    retirado: Boolean(result.retirado),
    statusPagamento: result.status_pagamento ?? null,
  };
}
