"use client";

import { useState, useEffect } from "react";

/**
 * Passo antes do POST: nome e telefone do comprador (pedido pré-pago).
 */
export default function ModalDadosCompradorPrepago({
  open,
  onClose,
  corPrincipal = "#4F46E5",
  loading = false,
  apiError = "",
  onConfirmar,
}) {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [erroLocal, setErroLocal] = useState("");

  useEffect(() => {
    if (!open) {
      setNome("");
      setTelefone("");
      setErroLocal("");
    }
  }, [open]);

  if (!open) return null;

  const validar = () => {
    const n = nome.trim();
    const t = telefone.trim();
    const digitos = t.replace(/\D/g, "");
    if (n.length < 2) {
      setErroLocal("Indique o seu nome (mínimo 2 caracteres).");
      return false;
    }
    if (digitos.length < 8 || digitos.length > 15) {
      setErroLocal("Indique um telefone com 8 a 15 dígitos.");
      return false;
    }
    setErroLocal("");
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validar()) return;
    onConfirmar(nome.trim(), telefone.trim());
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-gray-900">Dados para o pedido</h2>
        <p className="mt-1 text-sm text-gray-600">
          Precisamos do nome e telefone para identificar a sua encomenda na retirada.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="prepago-comprador-nome" className="block text-sm font-medium text-gray-700">
              Nome
            </label>
            <input
              id="prepago-comprador-nome"
              type="text"
              autoComplete="name"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="prepago-comprador-telefone" className="block text-sm font-medium text-gray-700">
              Telefone
            </label>
            <input
              id="prepago-comprador-telefone"
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={loading}
            />
          </div>

          {(erroLocal || apiError) && (
            <p className="text-sm text-red-600" role="alert">
              {erroLocal || apiError}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-lg border border-gray-300 py-2.5 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg py-2.5 font-semibold text-white shadow disabled:opacity-50"
              style={{ backgroundColor: corPrincipal }}
            >
              {loading ? "A enviar…" : "Confirmar pedido"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
