import { getApiUrl } from "./config";

async function analyticsFetch(token, path, params = {}) {
  if (!token) return { error: "Token em falta." };
  const url = new URL(`${getApiUrl()}/analytics/${path}/`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });
  try {
    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return { error: data.detail || `Erro ${response.status}` };
    }
    return data;
  } catch (error) {
    console.error(`API Error (analytics/${path}):`, error);
    return { error: error.message };
  }
}

export function getAnalyticsFaturamento(token, periodo = "7d") {
  return analyticsFetch(token, "faturamento", { periodo });
}

export function getAnalyticsProdutos(token, periodo = "7d") {
  return analyticsFetch(token, "produtos", { periodo });
}

export function getAnalyticsPedidos(token, { periodo = "7d", page = 1, pageSize = 20, busca = "" } = {}) {
  return analyticsFetch(token, "pedidos", {
    periodo,
    page,
    page_size: pageSize,
    busca,
  });
}
