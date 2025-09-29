const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001/api";

export async function loginUser(credentials) {
  try {
    // Aponta para o novo endpoint de login no app 'accounts'
    const response = await fetch(`${API_URL}/accounts/login/`, {
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

