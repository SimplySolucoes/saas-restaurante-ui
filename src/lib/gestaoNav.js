/**
 * Flags de navegação da gestão (vêm do modelo Restaurante; editáveis só no Django admin).
 * Valores em falta no objeto (ex.: userData antigo no localStorage) assumem o comportamento legado.
 */

export const MODO_OPERACAO = {
  TRADICIONAL_MESA: 'TRADICIONAL_MESA',
  PRE_PAGO_WEB: 'PRE_PAGO_WEB',
};

export const MODO_LABEL = {
  TRADICIONAL_MESA: 'Restaurante / mesas',
  PRE_PAGO_WEB: 'Bar — pré-pago (web)',
};

/** Cardápio / gestão: usar para escolher endpoint de pedido (mesa vs pré-pago). */
export function isModoPrePago(restaurante) {
  const r = restaurante || {};
  if (r.permite_compra_publica === true) return true;
  return r.modo_operacao === MODO_OPERACAO.PRE_PAGO_WEB;
}

/**
 * @param {object|null|undefined} restaurante — objeto restaurante da API ou de user.restaurante
 */
export function navFlagsFromRestaurante(restaurante) {
  const r = restaurante || {};
  const prepago = isModoPrePago(r);
  return {
    modoOperacao: r.modo_operacao || MODO_OPERACAO.TRADICIONAL_MESA,
    mesaAtiva: r.gestao_nav_mesa_ativa !== false,
    novoPedido: r.gestao_nav_novo_pedido !== false,
    /** Lista pré-pago: visível no modo bar ou se a flag admin estiver ligada (mesa / futuro). */
    pedidos: r.gestao_nav_pedidos === true || prepago,
    gerirMesas: r.gestao_config_mostrar_gerir_mesas !== false,
    analytics: r.gestao_nav_analytics === true,
  };
}
