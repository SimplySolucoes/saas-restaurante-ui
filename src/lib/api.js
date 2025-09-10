const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001/api";


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



export async function checkOpenSession(mesaId) {
  try {
    const response = await fetch(`${API_URL}/sessoes/?mesa=${mesaId}&status=aberta`);
    if (!response.ok) throw new Error('Falha ao verificar sessão.');
    const data = await response.json();
    return data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error("API Error:", error);
    return null;
  }
}

export async function createSession(mesaId) {
  try {
    const response = await fetch(`${API_URL}/sessoes/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mesa: mesaId }),
    });
    if (!response.ok) throw new Error('Falha ao criar sessão.');
    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    return null;
  }
}

export async function submitOrder(sessaoId, cartItems) {
  const itensFormatados = cartItems.map(item => ({
    item_cardapio: item.id,
    quantidade: item.quantity,
    observacoes: item.observacoes || ''
  }));

  const payload = {
    sessao: sessaoId,
    itens: itensFormatados,
  };

  try {
    const response = await fetch(`${API_URL}/pedidos/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Falha ao enviar o pedido.');
    }
    
    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    return { error: error.message };
  }
}

export async function loginUser(credentials) {
  try {
    const response = await fetch(`${API_URL}/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.non_field_errors || 'Falha na autenticação.');
    }
    
    return data; 
  } catch (error) {
    console.error("Erro na API ao fazer login:", error);
    return { error: error.message };
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

export async function getSessions(token) {
  if (!token) return [];

  try {
    const response = await fetch(`${API_URL}/sessoes/`, {
      headers: {
        'Authorization': `Token ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Falha ao buscar as sessões.');
    }
    
    return await response.json();
  } catch (error) {
    console.error("API Error ao buscar sessões:", error);
    return [];
  }
}

export async function closeSession(token, sessaoId) {
  if (!token || !sessaoId) return { error: "Token ou ID da sessão em falta." };

  try {
    const response = await fetch(`${API_URL}/sessoes/${sessaoId}/`, {
      method: 'PATCH', 
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'fechada' }),
    });

    if (!response.ok) {
      throw new Error('Falha ao fechar a conta.');
    }
    
    return await response.json();
  } catch (error) {
    console.error("API Error ao fechar sessão:", error);
    return { error: error.message };
  }
}

export async function updateItemStatus(token, itemId, newStatus) {
  if (!token || !itemId || !newStatus) return { error: "Dados em falta para atualizar o status." };

  try {
    const response = await fetch(`${API_URL}/itens-pedido/${itemId}/`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: newStatus }),
    });

    if (!response.ok) {
      throw new Error('Falha ao atualizar o status do item.');
    }
    
    return await response.json();
  } catch (error) {
    console.error("API Error ao atualizar status:", error);
    return { error: error.message };
  }
}


export async function getGestaoCategorias(token) {
  if (!token) return [];
  try {
    const response = await fetch(`${API_URL}/categorias/`, {
      headers: { 'Authorization': `Token ${token}` },
    });
    if (!response.ok) throw new Error('Falha ao buscar categorias.');
    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    return [];
  }
}


export async function getGestaoItensCardapio(token) {
  if (!token) return [];
  try {
    const response = await fetch(`${API_URL}/itens-cardapio/`, {
      headers: { 'Authorization': `Token ${token}` },
    });
    if (!response.ok) throw new Error('Falha ao buscar itens do cardápio.');
    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    return [];
  }
}