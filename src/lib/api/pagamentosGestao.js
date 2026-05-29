import { getApiUrl } from "./config";

async function parseError(response) {
  try {
    const data = await response.json();
    if (data.detail) return String(data.detail);
    return Object.values(data).flat().join(" ") || `Erro ${response.status}`;
  } catch {
    return `Erro ${response.status}`;
  }
}

export async function getIntegracaoMercadoPago(token) {
  if (!token) return { error: "Token em falta." };
  try {
    const response = await fetch(`${getApiUrl()}/pagamentos/integracao/meu/`, {
      headers: { Authorization: `Token ${token}` },
    });
    if (!response.ok) {
      throw new Error(await parseError(response));
    }
    return await response.json();
  } catch (error) {
    console.error("API Error (getIntegracaoMercadoPago):", error);
    return { error: error.message };
  }
}

export async function iniciarOAuthMercadoPago(token) {
  if (!token) return { error: "Token em falta." };
  try {
    const response = await fetch(`${getApiUrl()}/pagamentos/oauth/iniciar/`, {
      headers: { Authorization: `Token ${token}` },
    });
    if (!response.ok) {
      throw new Error(await parseError(response));
    }
    return await response.json();
  } catch (error) {
    console.error("API Error (iniciarOAuthMercadoPago):", error);
    return { error: error.message };
  }
}

export async function desconectarMercadoPago(token) {
  if (!token) return { error: "Token em falta." };
  try {
    const response = await fetch(`${getApiUrl()}/pagamentos/integracao/desconectar/`, {
      method: "POST",
      headers: { Authorization: `Token ${token}` },
    });
    if (!response.ok) {
      throw new Error(await parseError(response));
    }
    return await response.json();
  } catch (error) {
    console.error("API Error (desconectarMercadoPago):", error);
    return { error: error.message };
  }
}
