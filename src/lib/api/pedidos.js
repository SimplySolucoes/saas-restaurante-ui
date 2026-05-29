import { getApiUrl } from "./config";

// --- Gestão de Sessões ---
export async function getSessions(token) {
  if (!token) return [];

  try {
    const response = await fetch(`${getApiUrl()}/sessoes/`, {
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
    const response = await fetch(`${getApiUrl()}/sessoes/${sessaoId}/`, {
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

export async function getSessionStatus(sessaoId) {
  try {
    const response = await fetch(`${getApiUrl()}/sessoes/${sessaoId}/`);
    if (!response.ok) {
      if (response.status === 404) return { status: 'fechada' };
      throw new Error('Falha ao buscar status da sessão.');
    }
    return await response.json();
  } catch (error) {
    console.error("API Error (getSessionStatus):", error);
    return { error: error.message, status: 'fechada' };
  }
}

export async function checkOpenSession(mesaId) {
  try {
    const response = await fetch(`${getApiUrl()}/sessoes/?mesa=${mesaId}&status=aberta`);
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
    const response = await fetch(`${getApiUrl()}/sessoes/`, {
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


// --- Gestão de Pedidos ---
export async function submitOrder(sessaoId, cartItems) {
  const itensFormatados = cartItems.map(item => {
    const idsDasOpcoes = (item.gruposSelecionados || [])
      .flatMap(grupo => grupo.opcoes.map(opcao => opcao.id));

    return {
      item_cardapio: item.produtoId, 
      quantidade: item.quantidade,
      observacoes: item.observacoes || '',
      opcoes_selecionadas: idsDasOpcoes, 
    };
  });

  const payload = {
    sessao: sessaoId,
    itens: itensFormatados,
  };

  try {
    const response = await fetch(`${getApiUrl()}/pedidos/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Erro de validação do backend:", errorData);
      throw new Error(Object.values(errorData).flat().join(' ') || 'Falha ao enviar o pedido.');
    }
    
    return await response.json();
  } catch (error) {
    console.error("API Error ao enviar pedido:", error);
    return { error: error.message };
  }
}

export async function submitOrderGarcom(token, sessaoId, cartItems) {
  if (!token) {
    return { error: "Token de autenticação do garçom é obrigatório." };
  }

  // A lógica de formatação do carrinho é a mesma
  const itensFormatados = cartItems.map(item => {
    const idsDasOpcoes = (item.gruposSelecionados || [])
      .flatMap(grupo => grupo.opcoes.map(opcao => opcao.id));

    return {
      item_cardapio: item.produtoId,
      quantidade: item.quantidade,
      observacoes: item.observacoes || '',
      opcoes_selecionadas: idsDasOpcoes,
    };
  });

  const payload = {
    sessao: sessaoId,
    itens: itensFormatados,
    // O garçom não precisa enviar PIN, então não incluímos o campo aqui
  };

  try {
    const response = await fetch(`${getApiUrl()}/pedidos/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // A diferença crucial está aqui:
        'Authorization': `Token ${token}`, 
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Erro de validação do backend:", errorData);
      throw new Error(Object.values(errorData).flat().join(' ') || 'Falha ao enviar o pedido.');
    }

    return await response.json();
  } catch (error) {
    console.error("API Error ao enviar pedido (Garçom):", error);
    return { error: error.message };
  }
}

export async function updateItemStatus(token, itemId, newStatus) {
  if (!token || !itemId || !newStatus) return { error: "Dados em falta para atualizar o status." };

  try {
    const response = await fetch(`${getApiUrl()}/itens-pedido/${itemId}/`, {
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

export async function abrirSessaoGarcom(token, mesaId) {
  if (!token || !mesaId) return { error: "Token ou ID da mesa em falta." };

  try {
    const response = await fetch(`${getApiUrl()}/sessoes/`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mesa: mesaId }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(Object.values(data).flat().join(' ') || 'Falha ao abrir sessão.');
    }
    return data;
  } catch (error) {
    console.error("API Error (abrirSessaoGarcom):", error);
    return { error: error.message };
  }
}

