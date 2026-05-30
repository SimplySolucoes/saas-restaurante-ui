"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  desconectarMercadoPago,
  getIntegracaoMercadoPago,
  iniciarOAuthMercadoPago,
} from "@/lib/api/pagamentosGestao";

const MP_FEEDBACK = {
  conectado: {
    type: "success",
    text: "Mercado Pago conectado com sucesso. Pagamentos PIX e cartão estão disponíveis.",
  },
  oauth_negado: {
    type: "error",
    text: "Autorização cancelada ou negada no Mercado Pago.",
  },
  state_invalido: {
    type: "error",
    text: "Sessão de conexão expirada ou inválida. Tente conectar novamente.",
  },
  erro_troca: {
    type: "error",
    text: "Não foi possível concluir a conexão. Verifique as credenciais da plataforma e tente de novo.",
  },
  erro_troca_client: {
    type: "error",
    text: "Client ID ou Client Secret inválidos na API. Use o par OAuth em Credenciais de produção no painel MP (não o Access Token de teste). Ative credenciais de produção e atualize a Render.",
  },
  erro_troca_grant: {
    type: "error",
    text: "Código OAuth inválido ou redirect URI diferente do cadastrado no MP. Confira a URL de callback na app e tente Conectar de novo.",
  },
  erro_troca_sem_code: {
    type: "error",
    text: "O Mercado Pago voltou sem código de autorização. Revogue o acesso da app na conta vendedor de teste e conecte novamente.",
  },
  erro_troca_cripto: {
    type: "error",
    text: "Tokens recebidos, mas a API não conseguiu gravá-los. Verifique MERCADOPAGO_TOKEN_ENCRYPTION_KEY na Render.",
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

export default function SecaoMercadoPagoGestao({ onIntegracaoChange }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [integracao, setIntegracao] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const onIntegracaoChangeRef = useRef(onIntegracaoChange);
  const mpQueryHandledRef = useRef(false);

  useEffect(() => {
    onIntegracaoChangeRef.current = onIntegracaoChange;
  }, [onIntegracaoChange]);

  const carregarIntegracao = useCallback(async ({ silent = false } = {}) => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setIsLoading(false);
      return;
    }
    if (!silent) {
      setIsLoading(true);
    }
    const data = await getIntegracaoMercadoPago(token);
    if (!silent) {
      setIsLoading(false);
    }
    if (data.error) {
      setIntegracao(null);
      return;
    }
    setIntegracao(data);
    onIntegracaoChangeRef.current?.(data);
  }, []);

  useEffect(() => {
    carregarIntegracao();
  }, [carregarIntegracao]);

  useEffect(() => {
    const mp = searchParams.get("mp");
    if (!mp || mpQueryHandledRef.current) return;
    mpQueryHandledRef.current = true;

    const msg = MP_FEEDBACK[mp];
    if (msg) {
      setFeedback(msg);
    }
    if (mp === "conectado") {
      carregarIntegracao({ silent: true });
    }
    router.replace("/gestao/configuracoes", { scroll: false });
  }, [searchParams, router, carregarIntegracao]);

  const handleConectar = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      alert("Sessão inválida. Faça login novamente.");
      return;
    }
    setIsConnecting(true);
    const result = await iniciarOAuthMercadoPago(token);
    setIsConnecting(false);
    if (result.error) {
      alert(result.error);
      return;
    }
    if (result.authorize_url) {
      window.location.href = result.authorize_url;
    }
  };

  const handleDesconectar = async () => {
    if (!confirm("Desconectar o Mercado Pago? Os pagamentos PIX e cartão ficarão indisponíveis até reconectar.")) {
      return;
    }
    const token = localStorage.getItem("authToken");
    if (!token) return;
    setIsDisconnecting(true);
    const result = await desconectarMercadoPago(token);
    setIsDisconnecting(false);
    if (result.error) {
      alert(result.error);
      return;
    }
    await carregarIntegracao({ silent: true });
    setFeedback({
      type: "success",
      text: "Mercado Pago desconectado.",
    });
  };

  const conectado = integracao?.conectado && integracao?.habilitado;

  return (
    <div className="mt-6 bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <div className="pb-4 mb-4 border-b border-gray-300">
        <h2 className="text-xl font-semibold text-gray-700">Pagamentos Mercado Pago</h2>
        <p className="mt-1 text-sm text-gray-500">
          Conecte a conta do restaurante para receber PIX e pagamentos com cartão de crédito ou débito.
        </p>
      </div>

      {feedback && (
        <div
          className={`mb-4 rounded-md px-4 py-3 text-sm ${
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
        <p className="text-sm text-gray-500">A carregar status da integração…</p>
      ) : conectado ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
              Conectado
            </span>
            <span className="text-sm text-gray-600">
              Ambiente: {formatAmbiente(integracao.ambiente)}
            </span>
          </div>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-gray-500">ID vendedor MP</dt>
              <dd className="font-mono text-gray-800 truncate">
                {integracao.mp_user_id || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Última atualização</dt>
              <dd className="text-gray-800">{formatData(integracao.atualizado_em)}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Public Key (cartão)</dt>
              <dd className="text-gray-800">
                {integracao.public_key_configurada ? "Configurada" : "Ausente"}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Taxa plataforma</dt>
              <dd className="text-gray-800">
                R$ {integracao.taxa_fixa_brl ?? "0.00"}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500">Taxa repassada ao cliente</dt>
              <dd className="text-gray-800">
                {integracao.repassar_taxa_ao_consumidor ? "Sim (taxa de serviço)" : "Não (absorvida pelo estabelecimento)"}
              </dd>
            </div>
          </dl>
          <button
            type="button"
            onClick={handleDesconectar}
            disabled={isDisconnecting}
            className="text-sm font-semibold text-red-600 hover:text-red-800 disabled:text-gray-400"
          >
            {isDisconnecting ? "A desconectar…" : "Desconectar Mercado Pago"}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-md bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-900">
            Pagamentos PIX e cartão estão indisponíveis até conectar o Mercado Pago.
          </div>
          <button
            type="button"
            onClick={handleConectar}
            disabled={isConnecting}
            className="bg-indigo-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300"
          >
            {isConnecting ? "A redirecionar…" : "Conectar Mercado Pago"}
          </button>
        </div>
      )}
    </div>
  );
}
