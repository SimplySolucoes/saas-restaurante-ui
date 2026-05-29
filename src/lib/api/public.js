import { getApiUrl } from "./config";

// --- Cardápio Público (Cliente) ---
export async function getPublicCardapioData(slug) {
  try {
    const response = await fetch(`${getApiUrl()}/cardapio/${slug}/`);
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error('Falha ao buscar os dados do cardápio.');
    }
    return await response.json();
  } catch (error) {
    console.error("API Error (getPublicCardapioData):", error);
    return null;
  }
}

export async function getBrandingBySlug(slug) {
  try {
    const response = await fetch(`${getApiUrl()}/branding/${slug}/`, {
      cache: "no-store"
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("API Error ao buscar branding:", error);
    return null;
  }
}

export async function createSessionByNumber(slug, numeroMesa, segredo) {
  try {
    const response = await fetch(`${getApiUrl()}/sessoes/iniciar/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        restaurante_slug: slug, 
        mesa_numero: numeroMesa,
        segredo: segredo 
      }),
    });
    if (!response.ok) throw new Error('Falha ao criar sessão. Verifique o QR Code.');
    return await response.json();
  } catch (error) {
    console.error("API Error (createSessionByNumber):", error);
    return { error: error.message };
  }
}

// --- Funções antigas (podem ser úteis ou removidas) ---
export async function getRestauranteData(restauranteId) {
  try {
    const response = await fetch(`${getApiUrl()}/restaurantes/${restauranteId}/`);
    if (!response.ok) throw new Error('Restaurante não encontrado.');
    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    return null;
  }
}

export async function getCategorias(restauranteId) {
  try {
    const response = await fetch(`${getApiUrl()}/categorias/?restaurante=${restauranteId}`);
    if (!response.ok) throw new Error('Falha ao buscar categorias.');
    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    return [];
  }
}

export async function getItensCardapio(restauranteId) {
  try {
    const response = await fetch(`${getApiUrl()}/itens-cardapio/?restaurante=${restauranteId}`);
    if (!response.ok) throw new Error('Falha ao buscar itens do cardápio.');
    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    return [];
  }
}

