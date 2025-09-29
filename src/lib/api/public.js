const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001/api";

// --- Cardápio Público (Cliente) ---
export async function getPublicCardapioData(slug) {
  try {
    const response = await fetch(`${API_URL}/cardapio/${slug}/`);
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
    const response = await fetch(`${API_URL}/branding/${slug}/`);
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
    const response = await fetch(`${API_URL}/sessoes/iniciar/`, {
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
    const response = await fetch(`${API_URL}/restaurantes/${restauranteId}/`);
    if (!response.ok) throw new Error('Restaurante não encontrado.');
    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    return null;
  }
}

export async function getCategorias(restauranteId) {
  try {
    const response = await fetch(`${API_URL}/categorias/?restaurante=${restauranteId}`);
    if (!response.ok) throw new Error('Falha ao buscar categorias.');
    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    return [];
  }
}

export async function getItensCardapio(restauranteId) {
  try {
    const response = await fetch(`${API_URL}/itens-cardapio/?restaurante=${restauranteId}`);
    if (!response.ok) throw new Error('Falha ao buscar itens do cardápio.');
    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    return [];
  }
}

