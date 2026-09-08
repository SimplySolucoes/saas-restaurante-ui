"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import useAuth from "@/hooks/useAuth";
import useGestaoRestaurante from "@/hooks/useGestaoRestaurante";
import {
  getAnalyticsFaturamento,
  getAnalyticsPedidos,
  getAnalyticsProdutos,
  getRestaurante,
} from "@/lib/api";
import { isModoPrePago, navFlagsFromRestaurante } from "@/lib/gestaoNav";
import { formatarCodigoRetirada } from "@/lib/prepagoPedidosUi";

const PERIODOS = [
  { id: "hoje", label: "Hoje" },
  { id: "7d", label: "7 dias" },
  { id: "30d", label: "30 dias" },
];

const ABAS = [
  { id: "faturamento", label: "Faturamento" },
  { id: "produtos", label: "Produtos" },
  { id: "pedidos", label: "Pedidos" },
];

const PIE_COLORS = ["#4f46e5", "#10b981"];

function formatBRL(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(value) || 0
  );
}

function formatDataCurta(isoDate) {
  if (!isoDate) return "";
  const [, m, d] = isoDate.split("-");
  return `${d}/${m}`;
}

function formatDataHora(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function PeriodoSelector({ periodo, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {PERIODOS.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => onChange(p.id)}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            periodo === p.id
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50"
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

function KpiCard({ label, value, sub }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
      {sub ? <p className="mt-1 text-xs text-gray-400">{sub}</p> : null}
    </div>
  );
}

function ChartCard({ title, children, className = "" }) {
  return (
    <div className={`rounded-xl bg-white p-5 shadow-sm ring-1 ring-gray-100 ${className}`}>
      <h3 className="mb-4 text-base font-semibold text-gray-800">{title}</h3>
      {children}
    </div>
  );
}

function EmptyChart({ message = "Sem dados no período." }) {
  return (
    <div className="flex h-64 items-center justify-center text-sm text-gray-400">{message}</div>
  );
}

function FaturamentoTab({ token, periodo }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const prepago = data?.modo_operacao === "PRE_PAGO_WEB";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const result = await getAnalyticsFaturamento(token, periodo);
      if (cancelled) return;
      if (result.error) {
        setError(result.error);
        setData(null);
      } else {
        setData(result);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [token, periodo]);

  if (loading) return <p className="text-gray-500">A carregar faturamento…</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!data) return null;

  const kpis = data.kpis || {};
  const serie = data.serie_diaria || [];
  const categorias = data.por_categoria || [];
  const metodos = data.por_metodo || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Faturamento total" value={formatBRL(kpis.faturamento_total)} />
        <KpiCard label="Ticket médio" value={formatBRL(kpis.ticket_medio)} />
        <KpiCard
          label={prepago ? "Pedidos pagos" : "Registos"}
          value={String(kpis.transacoes ?? 0)}
        />
        <KpiCard label="Média diária" value={formatBRL(kpis.media_diaria)} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Faturamento por dia">
          {serie.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={serie} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillFat" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="data"
                  tickFormatter={formatDataCurta}
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                />
                <YAxis
                  tickFormatter={(v) => `R$${v}`}
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  width={72}
                />
                <Tooltip
                  formatter={(v) => [formatBRL(v), "Faturamento"]}
                  labelFormatter={(l) => formatDataCurta(l)}
                />
                <Area
                  type="monotone"
                  dataKey="valor"
                  stroke="#4f46e5"
                  strokeWidth={2}
                  fill="url(#fillFat)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Faturamento por categoria">
          {categorias.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={categorias} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => `R$${v}`} tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="nome"
                  width={100}
                  tick={{ fontSize: 11, fill: "#374151" }}
                />
                <Tooltip formatter={(v) => [formatBRL(v), "Faturamento"]} />
                <Bar dataKey="valor" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {prepago && metodos.length > 0 && (
        <ChartCard title="Receita por método de pagamento" className="max-w-md">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={metodos}
                dataKey="valor"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
              >
                {metodos.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => formatBRL(v)} />
            </PieChart>
          </ResponsiveContainer>
          <ul className="mt-2 space-y-1 text-sm text-gray-600">
            {metodos.map((m) => (
              <li key={m.metodo} className="flex justify-between gap-4">
                <span>{m.label}</span>
                <span className="font-medium tabular-nums">{formatBRL(m.valor)}</span>
              </li>
            ))}
          </ul>
        </ChartCard>
      )}
    </div>
  );
}

function RankingList({ items, tipo }) {
  if (!items?.length) {
    return <p className="py-8 text-center text-sm text-gray-400">Sem dados no período.</p>;
  }
  return (
    <ol className="space-y-2">
      {items.map((item, idx) => (
        <li
          key={`${item.id}-${idx}`}
          className="flex items-start gap-3 rounded-lg bg-gray-50 px-3 py-2.5"
        >
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
            {idx + 1}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-gray-900">{item.nome}</p>
            <p className="text-xs text-gray-500">{item.categoria}</p>
          </div>
          <div className="shrink-0 text-right">
            {tipo === "quantidade" ? (
              <span className="text-sm font-semibold tabular-nums text-gray-800">
                {item.quantidade} un.
              </span>
            ) : (
              <>
                <span className="block text-sm font-semibold tabular-nums text-gray-800">
                  {formatBRL(item.valor)}
                </span>
                {item.percentual != null && (
                  <span className="text-xs text-gray-400">{item.percentual}%</span>
                )}
              </>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

function truncarLabel(nome, max = 14) {
  if (!nome) return "";
  return nome.length > max ? `${nome.slice(0, max)}…` : nome;
}

function ProdutosBarChart({ data, dataKey, label }) {
  if (!data?.length) return <EmptyChart />;
  const isValor = dataKey === "valor";
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis
          dataKey="nome"
          tick={{ fontSize: 11, fill: "#374151" }}
          tickFormatter={(v) => truncarLabel(v)}
          interval={0}
          angle={-35}
          textAnchor="end"
          height={72}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#6b7280" }}
          width={isValor ? 72 : 40}
          tickFormatter={isValor ? (v) => `R$${v}` : undefined}
        />
        <Tooltip
          labelFormatter={(_, payload) => payload?.[0]?.payload?.nome ?? ""}
          formatter={(v) =>
            isValor ? [formatBRL(v), label] : [`${v} un.`, label]
          }
        />
        <Bar dataKey={dataKey} fill="#6366f1" barSize={28} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function ProdutosTab({ token, periodo }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const result = await getAnalyticsProdutos(token, periodo);
      if (cancelled) return;
      if (result.error) {
        setError(result.error);
        setData(null);
      } else {
        setData(result);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [token, periodo]);

  if (loading) return <p className="text-gray-500">A carregar produtos…</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (!data) return null;

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <ChartCard title="Mais vendidos (quantidade)">
        <ProdutosBarChart
          data={data.por_quantidade}
          dataKey="quantidade"
          label="Quantidade"
        />
        <div className="mt-4 border-t border-gray-100 pt-4">
          <RankingList items={data.por_quantidade} tipo="quantidade" />
        </div>
      </ChartCard>
      <ChartCard title="Maior faturamento">
        <ProdutosBarChart data={data.por_faturamento} dataKey="valor" label="Faturamento" />
        <div className="mt-4 border-t border-gray-100 pt-4">
          <RankingList items={data.por_faturamento} tipo="faturamento" />
        </div>
      </ChartCard>
    </div>
  );
}

function PedidosTab({ token, periodo, prepago }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [busca, setBusca] = useState("");
  const [buscaInput, setBuscaInput] = useState("");

  const carregar = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await getAnalyticsPedidos(token, { periodo, page, busca });
    if (result.error) {
      setError(result.error);
      setData(null);
    } else {
      setData(result);
    }
    setLoading(false);
  }, [token, periodo, page, busca]);

  useEffect(() => {
    setPage(1);
  }, [periodo, busca]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const totalPages = data ? Math.max(1, Math.ceil(data.count / data.page_size)) : 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-600">
          Histórico completo de {prepago ? "pedidos pagos" : "registos"} no período.
        </p>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setBusca(buscaInput.trim());
          }}
        >
          <input
            type="search"
            value={buscaInput}
            onChange={(e) => setBuscaInput(e.target.value)}
            placeholder={prepago ? "Código ou cliente…" : "Buscar…"}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Buscar
          </button>
        </form>
      </div>

      {loading && <p className="text-gray-500">A carregar pedidos…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && data && (
        <>
          {data.results.length === 0 ? (
            <p className="rounded-xl bg-white py-12 text-center text-gray-500 shadow-sm ring-1 ring-gray-100">
              Nenhum registo no período.
            </p>
          ) : (
            <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="border-b border-gray-100 bg-gray-50 text-left text-gray-600">
                    <tr>
                      <th className="px-4 py-3 font-semibold">
                        {prepago ? "Código" : "Ref."}
                      </th>
                      <th className="px-4 py-3 font-semibold">Data</th>
                      <th className="px-4 py-3 font-semibold">Total</th>
                      <th className="hidden px-4 py-3 font-semibold md:table-cell">Itens</th>
                      {prepago && (
                        <>
                          <th className="hidden px-4 py-3 font-semibold lg:table-cell">Cliente</th>
                          <th className="hidden px-4 py-3 font-semibold lg:table-cell">Pagamento</th>
                          <th className="px-4 py-3 font-semibold">Retirado</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.results.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50/80">
                        <td className="px-4 py-3 font-mono font-semibold text-indigo-900">
                          {prepago ? formatarCodigoRetirada(row.identificador) : row.identificador}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 tabular-nums text-gray-700">
                          {formatDataHora(row.data_hora)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-medium tabular-nums">
                          {formatBRL(row.total)}
                        </td>
                        <td
                          className="hidden max-w-xs truncate px-4 py-3 text-gray-600 md:table-cell"
                          title={row.itens_resumo}
                        >
                          {row.itens_resumo}
                        </td>
                        {prepago && (
                          <>
                            <td className="hidden px-4 py-3 lg:table-cell">
                              <div className="font-medium text-gray-800">
                                {row.comprador_nome || "—"}
                              </div>
                              <div className="text-xs text-gray-400">
                                {row.comprador_telefone || ""}
                              </div>
                            </td>
                            <td className="hidden px-4 py-3 text-gray-600 lg:table-cell">
                              {row.metodo_pagamento_label || "—"}
                            </td>
                            <td className="px-4 py-3">
                              {row.retirado ? (
                                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                                  Sim
                                </span>
                              ) : (
                                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                                  Não
                                </span>
                              )}
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {data.count > data.page_size && (
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                {data.count} registo{data.count !== 1 ? "s" : ""} · página {data.page} de{" "}
                {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 disabled:opacity-40"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 disabled:opacity-40"
                >
                  Seguinte
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  const router = useRouter();
  const { isAdmin, isLoading: authLoading, token } = useAuth();
  const { restaurante } = useGestaoRestaurante(token);
  const [aba, setAba] = useState("faturamento");
  const [periodo, setPeriodo] = useState("7d");
  const prepago = isModoPrePago(restaurante);

  useEffect(() => {
    if (authLoading) return;
    if (!isAdmin) {
      router.replace("/gestao");
      return;
    }
    let cancelled = false;
    (async () => {
      const r = await getRestaurante(token);
      if (cancelled || !r) return;
      if (!navFlagsFromRestaurante(r).analytics) {
        router.replace("/gestao");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, isAdmin, router, token]);

  if (authLoading) {
    return <div className="text-gray-500">A verificar acesso…</div>;
  }

  if (!isAdmin || !token) {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-screen-2xl">
      <header className="mb-6 border-b border-gray-200 pb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 sm:text-3xl">Analytics</h1>
            <p className="mt-1 text-sm text-gray-600">
              Faturamento e desempenho do cardápio
              {prepago ? " · modo bar" : " · cardápio digital"}.
            </p>
          </div>
          <PeriodoSelector periodo={periodo} onChange={setPeriodo} />
        </div>

        <div className="mt-5 flex gap-1 rounded-lg bg-gray-200/60 p-1">
          {ABAS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setAba(t.id)}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold transition-colors sm:flex-none ${
                aba === t.id
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      {aba === "faturamento" && <FaturamentoTab token={token} periodo={periodo} />}
      {aba === "produtos" && <ProdutosTab token={token} periodo={periodo} />}
      {aba === "pedidos" && (
        <PedidosTab token={token} periodo={periodo} prepago={prepago} />
      )}
    </div>
  );
}
