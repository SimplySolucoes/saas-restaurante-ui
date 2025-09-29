"use client";

import { useState, useEffect } from 'react';

export default function useAuth() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true); 

  useEffect(() => {
    const storedToken = localStorage.getItem('authToken');
    const storedUserData = localStorage.getItem('userData');

    if (storedToken) {
      setToken(storedToken);
    }
    if (storedUserData) {
      try {
        setUser(JSON.parse(storedUserData));
      } catch (e) {
        console.error("Erro ao ler os dados do utilizador do localStorage:", e);
        setUser(null);
      }
    }
    setIsLoading(false);
  }, []);

  return { 
    user, 
    token,
    isLoading,
    isAdmin: user?.cargo === 'ADMIN' 
  };
}

