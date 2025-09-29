const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001/api";

// --- Gestão do Restaurante ---
export async function getRestaurante(token) {
  if (!token) return null;
  try {
    const response = await fetch(`${API_URL}/restaurantes/meu/`, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`Falha ao buscar dados do restaurante (Status: ${response.status})`);
    }
    return await response.json();
  } catch (error) {
    console.error("API Error (getRestaurante):", error);
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


// --- Gestão de Mesas ---
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

export async function getUrlSeguraMesa(token, mesaId) {
  if (!token) return { error: "Token em falta." };
  try {
    const response = await fetch(`${API_URL}/mesas/${mesaId}/url-segura/`, {
      headers: { 'Authorization': `Token ${token}` },
    });
    if (!response.ok) throw new Error('Falha ao buscar URL segura.');
    return await response.json(); 
  } catch (error) {
    console.error("API Error (getUrlSeguraMesa):", error);
    return { error: error.message };
  }
}

