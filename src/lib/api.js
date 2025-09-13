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

export async function createMenuItem(token, formData) { 
  if (!token) return { error: "Token de autenticação em falta." };

  try {
    const response = await fetch(`${API_URL}/itens-cardapio/`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${token}`,
      },
      body: formData, 
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = Object.values(data).flat().join(' ');
      throw new Error(errorMessage || 'Falha ao criar o item.');
    }
    
    return data;
  } catch (error) {
    console.error("API Error ao criar item:", error);
    return { error: error.message };
  }
}

export async function updateMenuItem(token, itemId, formData) { 
  if (!token) return { error: "Token de autenticação em falta." };

  try {
    const response = await fetch(`${API_URL}/itens-cardapio/${itemId}/`, {
      method: 'PATCH', 
      headers: {
        'Authorization': `Token ${token}`,
      },
      body: formData, 
    });

    const data = await response.json();
    if (!response.ok) {
      const errorMessage = Object.values(data).flat().join(' ');
      throw new Error(errorMessage || 'Falha ao atualizar o item.');
    }
    return data;
  } catch (error) {
    console.error("API Error ao atualizar item:", error);
    return { error: error.message };
  }
}

export async function deleteMenuItem(token, itemId) {
  if (!token) return { error: "Token de autenticação em falta." };

  try {
    const response = await fetch(`${API_URL}/itens-cardapio/${itemId}/`, {
      method: 'DELETE',
      headers: { 'Authorization': `Token ${token}` },
    });

    if (!response.ok) {
      throw new Error('Falha ao apagar o item.');
    }
    return { success: true };
  } catch (error) {
    console.error("API Error ao apagar item:", error);
    return { error: error.message };
  }
}

export async function createCategory(token, categoryData) {
  if (!token) return { error: "Token de autenticação em falta." };

  try {
    const response = await fetch(`${API_URL}/categorias/`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(categoryData),
    });
    const data = await response.json();
    if (!response.ok) {
      const errorMessage = Object.values(data).flat().join(' ');
      throw new Error(errorMessage || 'Falha ao criar a categoria.');
    }
    return data;
  } catch (error) {
    console.error("API Error ao criar categoria:", error);
    return { error: error.message };
  }
}

export async function updateCategory(token, categoryId, categoryData) {
  if (!token) return { error: "Token de autenticação em falta." };

  try {
    const response = await fetch(`${API_URL}/categorias/${categoryId}/`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(categoryData),
    });
    const data = await response.json();
    if (!response.ok) {
      const errorMessage = Object.values(data).flat().join(' ');
      throw new Error(errorMessage || 'Falha ao atualizar a categoria.');
    }
    return data;
  } catch (error) {
    console.error("API Error ao atualizar categoria:", error);
    return { error: error.message };
  }
}

export async function deleteCategory(token, categoryId) {
  if (!token) return { error: "Token de autenticação em falta." };

  try {
    const response = await fetch(`${API_URL}/categorias/${categoryId}/`, {
      method: 'DELETE',
      headers: { 'Authorization': `Token ${token}` },
    });

    if (!response.ok) {
      throw new Error('Falha ao apagar a categoria. Verifique se ela não contém itens.');
    }
    return { success: true };
  } catch (error) {
    console.error("API Error ao apagar categoria:", error);
    return { error: error.message };
  }
}

export async function getMesas(token) {
  if (!token) return [];
  try {
    const response = await fetch(`${API_URL}/mesas/`, {
      headers: { 'Authorization': `Token ${token}` },
    });
    if (!response.ok) throw new Error('Falha ao buscar mesas.');
    return await response.json();
  } catch (error) {
    console.error("API Error ao buscar mesas:", error);
    return [];
  }
}


export async function getRestaurante(token) {
  if (!token) return null;
  try {
    const response = await fetch(`${API_URL}/restaurantes/meu/`, {
      headers: { 'Authorization': `Token ${token}` },
    });
    if (!response.ok) throw new Error('Falha ao buscar dados do restaurante.');
    return await response.json();
  } catch (error) {
    console.error("API Error ao buscar restaurante:", error);
    return null;
  }
}

export async function updateRestaurante(token, restauranteData) {
  if (!token) return { error: "Token de autenticação em falta." };

  try {
    const formData = new FormData();
    for (const key in restauranteData) {
      const value = restauranteData[key];
      if (value !== null && value !== undefined) {
        if (key === 'logo' && typeof value === 'string') {
            continue; 
        }
        formData.append(key, value);
      }
    }

    const response = await fetch(`${API_URL}/restaurantes/meu/`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Token ${token}`,
      },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      const errorMessage = Object.values(data).flat().join(' ');
      throw new Error(errorMessage || 'Falha ao atualizar o restaurante.');
    }
    return data;
  } catch (error) {
    console.error("API Error ao atualizar restaurante:", error);
    return { error: error.message };
  }
}

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

export async function createSessionByNumber(slug, numeroMesa) {
  try {
    const response = await fetch(`${API_URL}/sessoes/iniciar/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        restaurante_slug: slug, 
        mesa_numero: numeroMesa 
      }),
    });
    if (!response.ok) throw new Error('Falha ao criar sessão.');
    return await response.json();
  } catch (error) {
    console.error("API Error (createSessionByNumber):", error);
    return null;
  }
}

export async function toggleItemDisponibilidade(token, itemId, data) {
  if (!token) return { error: "Token de autenticação em falta." };

  try {
    const response = await fetch(`${API_URL}/itens-cardapio/${itemId}/`, {
      method: 'PATCH', 
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = Object.values(errorData).flat().join(' ');
      throw new Error(errorMessage || 'Falha ao atualizar o item.');
    }
    return await response.json();
  } catch (error) {
    console.error("API Error ao atualizar disponibilidade:", error);
    return { error: error.message };
  }
}

