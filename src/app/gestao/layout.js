"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import useAuth from "@/hooks/useAuth";
import useGestaoRestaurante from "@/hooks/useGestaoRestaurante";
import { navFlagsFromRestaurante, MODO_OPERACAO } from "@/lib/gestaoNav";

const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6" aria-hidden>
    <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6" aria-hidden>
    <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
  </svg>
);

const MesaAtivaIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10zm0 5.25a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z" clipRule="evenodd" /></svg>;
const NewOrderIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM2 10a8 8 0 1116 0 8 8 0 01-16 0z" clipRule="evenodd" /></svg>;
const PedidosIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
    <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm0 2h12v10H4V5zm2 2h8v2H6V7zm0 4h5v2H6v-2z" />
  </svg>
);

const ConfiguracoesIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-6 h-6"
  >
    <path d="M19.43 12.98c.04-.32.07-.65.07-.98s-.03-.66-.07-.98l2.11-1.65a.5.5 0 0 0 .12-.64l-2-3.46a.5.5 0 0 0-.6-.22l-2.49 1a6.77 6.77 0 0 0-1.69-.98l-.38-2.65A.5.5 0 0 0 14 2h-4a.5.5 0 0 0-.5.42l-.38 2.65c-.63.25-1.2.57-1.69.98l-2.49-1a.5.5 0 0 0-.6.22l-2 3.46a.5.5 0 0 0 .12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65a.5.5 0 0 0-.12.64l2 3.46c.14.24.43.34.6.22l2.49-1c.49.41 1.06.74 1.69.98l.38 2.65A.5.5 0 0 0 10 22h4c.25 0 .46-.18.5-.42l.38-2.65c.63-.25 1.2-.57 1.69-.98l2.49 1c.17.12.46.02.6-.22l2-3.46a.5.5 0 0 0-.12-.64l-2.11-1.65zM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7z" />
  </svg>
);


export default function GestaoLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAdmin, isLoading, token } = useAuth();
  const { restaurante: restauranteApi } = useGestaoRestaurante(token);
  const nav = navFlagsFromRestaurante(restauranteApi || user?.restaurante);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !token) {
      const slug = user?.restaurante?.slug || "default"; 
      router.push(`/login/${slug}`);
    }
  }, [isLoading, token, router, user]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileNavOpen]);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");
    const slug = user?.restaurante?.slug || "default";
    router.push(`/login/${slug}`);
  };

  if (isLoading) {
    return <div className="flex h-screen w-full items-center justify-center bg-gray-100">A verificar autenticação...</div>;
  }

  const novoPedidoHref =
    nav.modoOperacao === MODO_OPERACAO.PRE_PAGO_WEB
      ? "/gestao/pedido-bar"
      : "/gestao/novo-pedido";

  const navLinks = [
    { href: "/gestao/mesa-ativa", label: "Mesas Ativas", icon: <MesaAtivaIcon />, show: nav.mesaAtiva },
    { href: novoPedidoHref, label: "Novo Pedido", icon: <NewOrderIcon />, show: nav.novoPedido },
    { href: "/gestao/pedidos", label: "Pedidos", icon: <PedidosIcon />, show: nav.pedidos },
    { href: "/gestao/configuracoes", label: "Configurações", icon: <ConfiguracoesIcon />, show: isAdmin },
  ];

  const linksVisiveis = navLinks.filter(link => link.show);

  const linkClass = (href) =>
    `flex items-center gap-3 rounded-md px-3 py-2.5 text-base font-semibold transition-colors md:text-lg ${
      pathname === href ? "bg-indigo-600 text-white" : "hover:bg-gray-700"
    }`;

  const navLinksEl = (afterNavigate) => (
    <nav className="flex flex-col gap-1">
      {linksVisiveis.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={linkClass(link.href)}
          onClick={afterNavigate}
        >
          {link.icon}
          <span>{link.label}</span>
        </Link>
      ))}
    </nav>
  );

  const logoutClass = "mt-auto w-full pt-6 text-left font-semibold text-red-400 hover:text-red-300";

  return (
    <div className="flex min-h-screen w-full min-w-0 max-w-none flex-col bg-gray-100 md:flex-row md:items-stretch md:justify-start">
      <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-gray-700 bg-gray-800 px-4 text-white md:hidden">
        <span className="min-w-0 truncate text-sm font-semibold sm:text-base">
          Painel {user?.restaurante?.nome ? `· ${user.restaurante.nome}` : ""}
        </span>
        <button
          type="button"
          className="flex shrink-0 items-center justify-center rounded-md p-2 hover:bg-gray-700"
          aria-expanded={mobileNavOpen}
          aria-controls="gestao-mobile-nav"
          aria-label={mobileNavOpen ? "Fechar menu" : "Abrir menu"}
          onClick={() => setMobileNavOpen((o) => !o)}
        >
          {mobileNavOpen ? <CloseIcon /> : <MenuIcon />}
        </button>
      </header>

      {mobileNavOpen && (
        <div
          className="fixed bottom-0 left-0 right-0 top-14 z-40 flex md:hidden"
          id="gestao-mobile-nav"
          role="dialog"
          aria-modal="true"
          aria-label="Menu de navegação"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Fechar menu"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="relative z-10 flex h-full w-[min(20rem,88vw)] flex-col overflow-y-auto border-r border-gray-700 bg-gray-800 p-5 text-white">
            {navLinksEl(() => setMobileNavOpen(false))}
            <button
              type="button"
              className={logoutClass}
              onClick={() => {
                setMobileNavOpen(false);
                handleLogout();
              }}
            >
              Sair
            </button>
          </aside>
        </div>
      )}

      <aside className="hidden w-56 shrink-0 flex-col bg-gray-800 p-5 text-white md:flex md:min-h-screen md:flex-col lg:w-64 lg:p-6">
        <h2 className="mb-6 text-xl font-bold leading-tight lg:mb-8 lg:text-2xl">
          Painel
          {user?.restaurante?.nome ? (
            <span className="mt-1 block text-base font-semibold text-gray-300 lg:text-lg">{user.restaurante.nome}</span>
          ) : null}
        </h2>
        <div className="flex min-h-0 flex-1 flex-col">
          {navLinksEl(undefined)}
          <button type="button" className={logoutClass} onClick={handleLogout}>
            Sair
          </button>
        </div>
      </aside>

      <main className="flex min-h-0 w-full min-w-0 flex-1 flex-col bg-gray-100 px-6 py-6 md:min-h-screen">
        {children}
      </main>
    </div>
  );
}