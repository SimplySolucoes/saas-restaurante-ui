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

/**
 * @param {object|null|undefined} restaurante — objeto restaurante da API ou de user.restaurante
 */
export function navFlagsFromRestaurante(restaurante) {
  const r = restaurante || {};
  return {
    modoOperacao: r.modo_operacao || MODO_OPERACAO.TRADICIONAL_MESA,
    mesaAtiva: r.gestao_nav_mesa_ativa !== false,
    novoPedido: r.gestao_nav_novo_pedido !== false,
    pedidos: r.gestao_nav_pedidos === true,
    gerirMesas: r.gestao_config_mostrar_gerir_mesas !== false,
  };
}
