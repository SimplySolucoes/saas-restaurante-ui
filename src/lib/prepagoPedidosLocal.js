/** Pedidos pré-pago no mesmo dispositivo (janela rolante de 12h), por slug do restaurante. */

export const JANELA_MS = 12 * 60 * 60 * 1000;

function storageKey(slug) {
  return `prepago_pedidos_${slug}`;
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
    compradorNome: entry.compradorNome || "",
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

/** Monta entrada a partir da resposta POST prepago-pedidos. */
export function entryFromCreateResponse(result, compradorNome) {
  if (!result?.id || !result?.public_token) return null;
  return {
    pedidoId: result.id,
    publicToken: result.public_token,
    criadoEm: result.data_hora || new Date().toISOString(),
    codigoRetirada: result.codigo_retirada || "",
    total: result.total != null ? String(result.total) : "0",
    compradorNome: compradorNome || result.comprador_nome || "",
  };
}
