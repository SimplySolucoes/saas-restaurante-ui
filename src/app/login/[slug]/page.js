import { getBrandingBySlug } from "@/lib/api";
import LoginForm from "@/components/auth/LoginForm";
import Image from "next/image";

export default async function LoginPage({ params }) {
  const { slug } = await params;
  
  const branding = await getBrandingBySlug(slug);

  if (!branding) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 text-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Restaurante não encontrado</h1>
          <p className="mt-2 text-gray-600">O endereço que acedeu não parece ser válido.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-stretch bg-gray-100">
      {/* PAINEL ESQUERDO (MARCA DO RESTAURANTE) */}
      <div 
        className="hidden md:flex md:w-2/5 flex-col items-center justify-center text-white p-8"
        style={{ backgroundColor: branding.cor_principal }}
      >
        <div className="w-full max-w-sm text-center">
          {branding.logo ? (
            <Image 
              src={branding.logo} 
              alt={`Logo de ${branding.nome}`} 
              width={96}
              height={96}
              className="mx-auto h-24 w-24 rounded-full object-cover border-4 border-white/50 shadow-lg" 
            />
          ) : (
            <div className="mx-auto h-24 w-24 rounded-full bg-white/20" />
          )}
          <h1 className="mt-6 text-4xl font-bold">
            {branding.nome}
          </h1>
          <p className="mt-4 opacity-80">
            Bem-vindo ao seu painel de gestão.
          </p>
        </div>
      </div>
      <div className="flex flex-1 md:w-3/5 flex-col items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center md:text-left mb-8">
            <h2 className="text-3xl font-bold text-gray-800">
              Acesso ao Painel
            </h2>
            <p className="mt-2 text-gray-500">
              Faça login para continuar.
            </p>
          </div>
          <LoginForm corPrincipal={branding.cor_principal} />
        </div>
      </div>
    </div>
  );
}