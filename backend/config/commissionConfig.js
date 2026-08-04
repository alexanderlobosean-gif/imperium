// Configuração única de comissões da rede.
// FONTE DA VERDADE das regras de comissão.
// Manter sincronizado com src/lib/planConfig.js (RESIDUAL_PERCENTAGES) no frontend.
//
// Regra: a profundidade é definida POR PLANO (coluna plans.residual_levels).
//   - Nível 1 (direta): plans.direct_commission (padrão 10%)
//   - Níveis 2..1+residual_levels: RESIDUAL_RATES abaixo, limitado a MAX_LEVELS.
//   Ex.: start(0)=direta apenas, basic(2)=direta+2 residuais, gold/imperium(20)=20 níveis.

const MAX_LEVELS = 20;

// Comissão direta padrão (nível 1) em decimal — sobrescrita pelo direct_commission do plano
const DIRECT_RATE = 0.10; // 10%

// Comissão residual por nível da rede (nível = distância até o indicado).
// Espelha RESIDUAL_PERCENTAGES de src/lib/planConfig.js.
// Nível 1 é sobrescrito por DIRECT_RATE (o residual de nível 1 não é usado).
const RESIDUAL_RATES = {
  1: 0.02,
  2: 0.01,
  3: 0.005,
  4: 0.005,
  5: 0.005,
  6: 0.005,
  7: 0.005,
  8: 0.003,
  9: 0.003,
  10: 0.003,
  11: 0.001,
  12: 0.001,
  13: 0.001,
  14: 0.001,
  15: 0.001,
  16: 0.001,
  17: 0.001,
  18: 0.001,
  19: 0.001,
  20: 0.001,
};

function getCommissionRate(level) {
  if (level === 1) return DIRECT_RATE;
  return RESIDUAL_RATES[level] || 0;
}

module.exports = { MAX_LEVELS, DIRECT_RATE, RESIDUAL_RATES, getCommissionRate };
