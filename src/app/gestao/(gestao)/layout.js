"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

const DashboardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10zm0 5.25a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z" clipRule="evenodd" /></svg>;
const NewOrderIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM2 10a8 8 0 1116 0 8 8 0 01-16 0z" clipRule="evenodd" /></svg>;
const MenuIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6"><path d="M3 4.75A.75.75 0 013.75 4h12.5a.75.75 0 010 1.5H3.75A.75.75 0 013 4.75zM3 10a.75.75 0 01.75-.75h12.5a.75.75 0 010 1.5H3.75A.75.75 0 013 10zm0 5.25a.75.75 0 01.75-.75h12.5a.75.75 0 010 1.5H3.75a.75.75 0 01-.75-.75z" /></svg>;


export default function GestaoLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuth, setIsAuth] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.push("/login/simplydev");
    } else {
      setIsAuth(true);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    router.push("/login/simplydev");
  };

if (isAuth === null) {
    return <div className="flex h-screen w-full items-center justify-center bg-gray-100">A verificar autenticação...</div>;
  }

  const navLinks = [
    { href: "/gestao", label: "Dashboard", icon: <DashboardIcon /> },
    { href: "/gestao/novo-pedido", label: "Novo Pedido", icon: <NewOrderIcon /> },
    { href: "/gestao/configuracoes", label: "Configurações", icon: <MenuIcon /> },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="hidden lg:flex w-64 bg-gray-800 text-white p-6 flex-col">
        <div>
          <h2 className="text-2xl font-bold mb-8">Painel</h2>
          <nav className="flex flex-col space-y-2">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href} className={`flex items-center space-x-3 rounded-md px-3 py-2 text-lg font-semibold transition-colors ${
                pathname === link.href ? 'bg-indigo-600 text-white' : 'hover:bg-gray-700'
              }`}>
                {link.icon}
                <span>{link.label}</span>
              </Link>
            ))}
          </nav>
        </div>
        <button 
          onClick={handleLogout}
          className="mt-auto w-full text-left font-semibold text-red-400 hover:text-red-300"
        >
          Sair
        </button>
      </aside>

      <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-20 lg:pb-8">
        {children}
      </main>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-gray-800 text-white flex justify-around p-2 border-t border-gray-700">
        {navLinks.map(link => (
          <Link key={`mobile-${link.href}`} href={link.href} className={`flex flex-col items-center justify-center p-2 rounded-md transition-colors w-full ${
            pathname.startsWith(link.href) && pathname !== '/gestao/novo-pedido' && pathname !== '/gestao/configuracoes' ? 'bg-indigo-600' :
            pathname === link.href ? 'bg-indigo-600' : 'hover:bg-gray-700'
          }`}>
            {link.icon}
            <span className="text-xs mt-1">{link.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}