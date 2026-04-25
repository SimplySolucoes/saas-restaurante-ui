const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001/api";

// --- Gestão de Categorias ---
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


// --- Gestão de Itens do Cardápio ---
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


// --- Gestão de Opções ---

/** Junta mensagens de validação / detail do DRF num único texto legível. */
export function formatDrfApiErrors(data) {
  if (data == null) return 'Ocorreu um erro.';
  if (typeof data === 'string') return data.trim() || 'Ocorreu um erro.';
  if (typeof data !== 'object') return 'Ocorreu um erro.';

  const collect = (node, acc) => {
    if (node === null || node === undefined) return;
    if (typeof node === 'string' || typeof node === 'number' || typeof node === 'boolean') {
      const s = String(node).trim();
      if (s) acc.push(s);
      return;
    }
    if (Array.isArray(node)) {
      for (const el of node) collect(el, acc);
      return;
    }
    if (typeof node === 'object') {
      for (const v of Object.values(node)) collect(v, acc);
    }
  };

  const parts = [];
  collect(data, parts);
  return parts.join(' ') || 'Ocorreu um erro.';
}

export async function getGruposOpcao(token, itemId) {
  const headers = {};
  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }

  try {
    const response = await fetch(`${API_URL}/itens-cardapio/${itemId}/grupos-opcao/`, {
      headers: headers,
      cache: 'no-store',
    });
    if (!response.ok) throw new Error('Falha ao buscar grupos de opção.');
    return await response.json();
  } catch (error) {
    console.error("API Error (getGruposOpcao):", error);
    return [];
  }
}

export async function createGrupoOpcao(token, itemId, grupoData) {
  if (!token) return { error: "Token em falta." };
  try {
    const response = await fetch(`${API_URL}/itens-cardapio/${itemId}/grupos-opcao/`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(grupoData),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(formatDrfApiErrors(data));
    return data;
  } catch (error) {
    return { error: error.message };
  }
}

export async function updateGrupoOpcao(token, grupoId, grupoData) {
  if (!token) return { error: "Token em falta." };
  try {
    const response = await fetch(`${API_URL}/grupos-opcao/${grupoId}/`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(grupoData),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(formatDrfApiErrors(data));
    return data;
  } catch (error) {
    return { error: error.message };
  }
}

export async function deleteGrupoOpcao(token, grupoId) {
    if (!token) return { error: "Token em falta." };
    try {
        const response = await fetch(`${API_URL}/grupos-opcao/${grupoId}/`, {
            method: 'DELETE',
            headers: { 'Authorization': `Token ${token}` },
        });
        if (!response.ok) {
            let msg = 'Falha ao apagar o grupo.';
            try {
                const data = await response.json();
                msg = formatDrfApiErrors(data);
            } catch {
                /* corpo vazio ou não-JSON */
            }
            throw new Error(msg);
        }
        return { success: true };
    } catch (error) {
        return { error: error.message };
    }
}

export async function createItemOpcao(token, grupoId, itemData) {
  if (!token) return { error: "Token em falta." };
  try {
    const response = await fetch(`${API_URL}/grupos-opcao/${grupoId}/itens-opcao/`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(itemData),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(formatDrfApiErrors(data));
    return data;
  } catch (error) {
    return { error: error.message };
  }
}

export async function updateItemOpcao(token, itemId, itemData) {
    if (!token) return { error: "Token em falta." };
    try {
        const response = await fetch(`${API_URL}/itens-opcao/${itemId}/`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Token ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(itemData),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(formatDrfApiErrors(data));
        return data;
    } catch (error) {
        return { error: error.message };
    }
}

export async function deleteItemOpcao(token, itemId) {
    if (!token) return { error: "Token em falta." };
    try {
        const response = await fetch(`${API_URL}/itens-opcao/${itemId}/`, {
            method: 'DELETE',
            headers: { 'Authorization': `Token ${token}` },
        });
        if (!response.ok) {
            let msg = 'Falha ao apagar o item de opção.';
            try {
                const data = await response.json();
                msg = formatDrfApiErrors(data);
            } catch {
                /* corpo vazio ou não-JSON */
            }
            throw new Error(msg);
        }
        return { success: true };
    } catch (error) {
        return { error: error.message };
    }
}

