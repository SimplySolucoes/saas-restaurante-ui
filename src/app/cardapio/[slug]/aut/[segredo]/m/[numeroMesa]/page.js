"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function QrAuthPage({ params }) {
  const router = useRouter();
  const { slug, segredo, numeroMesa } = params;

  useEffect(() => {
    if (segredo) {

      sessionStorage.setItem(`segredo_mesa_${slug}_${numeroMesa}`, segredo);

      const destinationUrl = `/cardapio/${slug}/m/${numeroMesa}`;
      router.replace(destinationUrl);
    }
  }, [segredo, slug, numeroMesa, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-100">
      <p className="text-lg font-semibold">Autenticando mesa, por favor aguarde....</p>
    </div>
  );

}