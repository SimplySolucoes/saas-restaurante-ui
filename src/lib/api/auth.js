import { getApiUrl } from "./config";

export async function loginUser(credentials) {
  try {
    // Aponta para o novo endpoint de login no app 'accounts'
    const response = await fetch(`${getApiUrl()}/accounts/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || data.non_field_errors?.join(' ') || 'Falha na autenticação.');
    }
    return data; 
  } catch (error) {
    console.error("Erro na API ao fazer login:", error);
    return { error: error.message };
  }
}

