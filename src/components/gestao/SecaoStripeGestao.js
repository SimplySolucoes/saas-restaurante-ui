"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  desconectarStripe,
  getIntegracaoStripe,
  iniciarOAuthStripe,
} from "@/lib/api/pagamentosGestao";

const STRIPE_FEEDBACK = {
  conectado: {
    type: "success",
    text: "Stripe conectado com sucesso. Pagamentos PIX e carteira digital estão disponíveis.",
  },
  oauth_negado: {
    type: "error",
    text: "Autorização cancelada ou negada na Stripe.",
  },
  state_invalido: {
    type: "error",
    text: "Sessão de conexão expirada ou inválida. Tente conectar novamente.",
  },
  erro_troca: {
    type: "error",
    text: "Não foi possível concluir a conexão. Verifique as credenciais da plataforma e tente de novo.",
  },
  erro_troca_sem_code: {
    type: "error",
    text: "A Stripe voltou sem código de autorização. Tente conectar novamente.",
  },
  erro_troca_cripto: {
    type: "error",
    text: "Conta recebida, mas a API não conseguiu gravá-la. Verifique MERCADOPAGO_TOKEN_ENCRYPTION_KEY na Render.",
  },
};

function formatAmbiente(ambiente) {
  if (ambiente === "production") return "Produção";
  if (ambiente === "sandbox") return "Sandbox";
  return ambiente || "—";
}

function formatData(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("pt-BR");
  } catch {
    return iso;
  }
}

function mascararAccountId(id) {
  if (!id || id.length < 8) return id || "—";
  return `${id.slice(0, 8)}…${id.slice(-4)}`;
}

export default function SecaoStripeGestao({ onIntegracaoChange }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [integracao, setIntegracao] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const onIntegracaoChangeRef = useRef(onIntegracaoChange);
  const stripeQueryHandledRef = useRef(false);

  useEffect(() => {
    onIntegracaoChangeRef.current = onIntegracaoChange;
  }, [onIntegracaoChange]);

  const carregarIntegracao = useCallback(async ({ silent = false } = {}) => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setIsLoading(false);
      return;
    }
    if (!silent) setIsLoading(true);
    const data = await getIntegracaoStripe(token);
    if (data.error) {
      if (!silent) setIsLoading(false);
      return;
    }
    setIntegracao(data);
    if (!silent) setIsLoading(false);
    onIntegracaoChangeRef.current?.(data);
  }, []);

  useEffect(() => {
    carregarIntegracao();
  }, [carregarIntegracao]);

  useEffect(() => {
    const stripeParam = searchParams.get("stripe");
    if (!stripeParam || stripeQueryHandledRef.current) return;
    stripeQueryHandledRef.current = true;

    const fb = STRIPE_FEEDBACK[stripeParam];
    if (fb) setFeedback(fb);

    if (stripeParam === "conectado") {
      carregarIntegracao({ silent: true });
    }

    const params = new URLSearchParams(searchParams.toString());
    params.delete("stripe");
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : "?", { scroll: false });
  }, [searchParams, router, carregarIntegracao]);

  const handleConectar = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) return;
    setIsConnecting(true);
    setFeedback(null);
    const result = await iniciarOAuthStripe(token);
    setIsConnecting(false);
    if (result.error) {
      setFeedback({ type: "error", text: result.error });
      return;
    }
    if (result.authorize_url) {
      window.location.href = result.authorize_url;
    }
  };

  const handleDesconectar = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) return;
    if (!window.confirm("Desconectar a conta Stripe deste restaurante?")) return;
    setIsDisconnecting(true);
    const result = await desconectarStripe(token);
    setIsDisconnecting(false);
    if (result.error) {
      setFeedback({ type: "error", text: result.error });
      return;
    }
    setFeedback({
      type: "success",
      text: "Integração Stripe desconectada.",
    });
    await carregarIntegracao({ silent: true });
  };

  const conectado = integracao?.conectado === true;

  return (
    <div className="mt-6 bg-white p-6 rounded-lg shadow-md border border-indigo-100">
      <h2 className="text-xl font-semibold text-gray-800 mb-1">
        Pagamentos Stripe (Connect)
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        Conecte a conta Stripe do estabelecimento para receber PIX e pagamentos via
        Apple Pay / Google Pay no cardápio pré-pago.
      </p>

      {feedback && (
        <div
          className={`mb-4 rounded-lg px-4 py-3 text-sm ${
            feedback.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
          role="alert"
        >
          {feedback.text}
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-gray-500">A carregar integração…</p>
      ) : conectado ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
              Conectado com sucesso
            </span>
          </div>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            <div>
              <dt className="text-gray-500">Conta Stripe</dt>
              <dd className="font-mono text-gray-900">
                {mascararAccountId(integracao.stripe_account_id)}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Ambiente</dt>
              <dd className="text-gray-900">{formatAmbiente(integracao.ambiente)}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Taxa plataforma</dt>
              <dd className="text-gray-900">R$ {integracao.taxa_fixa_brl || "0.00"}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Atualizado em</dt>
              <dd className="text-gray-900">{formatData(integracao.atualizado_em)}</dd>
            </div>
          </dl>
          <button
            type="button"
            onClick={handleDesconectar}
            disabled={isDisconnecting}
            className="mt-2 text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
          >
            {isDisconnecting ? "A desconectar…" : "Desconectar Stripe"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleConectar}
          disabled={isConnecting}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {isConnecting ? "A redirecionar…" : "Conectar com Stripe"}
        </button>
      )}
    </div>
  );
}
