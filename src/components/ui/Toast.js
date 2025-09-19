"use client";

import { useEffect, useState } from 'react';

// --- Ícones ---
const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const ErrorIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

// --- Componente Toast ---
// Agora ele aceita uma nova prop: 'type', que pode ser 'success' ou 'error'
export default function Toast({ message, show, onHide, type = 'success' }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onHide, 300); 
      }, 3000); 

      return () => clearTimeout(timer);
    }
  }, [show, onHide]);

  if (!show) return null;

  // Escolhe o ícone e a cor com base no tipo da notificação
  const isSuccess = type === 'success';
  const Icon = isSuccess ? CheckIcon : ErrorIcon;

  return (
    <div 
      className={`fixed bottom-5 right-5 z-50 flex items-center gap-4 rounded-lg bg-white p-4 shadow-lg ring-1 ring-black ring-opacity-5 transition-all duration-300 ease-in-out
                  ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
    >
      <Icon />
      <p className="font-semibold text-gray-800">{message}</p>
    </div>
  );
}

