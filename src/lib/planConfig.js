export const PLANS = {
  start: {
    name: 'Start',
    min: 10,
    max: 99,
    baseRate: 1.0,
    minRate: 0.2,
    increment: 0.020,
    maxRate: 3.0,
    clientShare: 50,
    companyShare: 50,
    directCommission: 10,
    reinvestmentCommission: 10,
    residualLevels: 0,
    color: 'blue',
    icon: 'Zap',
  },
  basic: {
    name: 'Basic',
    min: 100,
    max: 299,
    baseRate: 1.2,
    minRate: 0.2,
    increment: 0.020,
    maxRate: 3.0,
    clientShare: 60,
    companyShare: 40,
    directCommission: 10,
    reinvestmentCommission: 10,
    residualLevels: 2,
    color: 'green',
    icon: 'TrendingUp',
  },
  silver: {
    name: 'Silver',
    min: 300,
    max: 999,
    baseRate: 1.4,
    minRate: 0.2,
    increment: 0.020,
    maxRate: 3.0,
    clientShare: 65,
    companyShare: 35,
    directCommission: 10,
    reinvestmentCommission: 10,
    residualLevels: 3,
    color: 'purple',
    icon: 'Award',
  },
  gold: {
    name: 'Gold',
    min: 1000,
    max: 4999,
    baseRate: 1.7,
    minRate: 0.2,
    increment: 0.020,
    maxRate: 3.0,
    clientShare: 70,
    companyShare: 30,
    directCommission: 10,
    reinvestmentCommission: 10,
    residualLevels: 20,
    color: 'amber',
    icon: 'Crown',
  },
  imperium: {
    name: 'Imperium',
    min: 5000,
    max: 10000,
    baseRate: 2.0,
    minRate: 0.2,
    increment: 0.020,
    maxRate: 3.0,
    clientShare: 75,
    companyShare: 25,
    directCommission: 10,
    reinvestmentCommission: 10,
    residualLevels: 20,
    color: 'gold',
    icon: 'Gem',
  },
  leadership_100: {
    name: 'Liderança $100',
    min: 100,
    max: 100,
    baseRate: 0,
    isLeadership: true,
    clientShare: 0,
    companyShare: 0,
    directCommission: 10,
    color: 'purple',
    icon: 'Users',
  },
  leadership_2000: {
    name: 'Liderança $2.000',
    min: 2000,
    max: 2000,
    baseRate: 0,
    isLeadership: true,
    clientShare: 0,
    companyShare: 0,
    residualLevels: 20,
    color: 'gold',
    icon: 'Shield',
  },
};

export const RESIDUAL_PERCENTAGES = {
  1: 2,
  2: 1,
  3: 0.5,
  4: 0.5,
  5: 0.5,
  6: 0.5,
  7: 0.5,
  8: 0.3,
  9: 0.3,
  10: 0.3,
  11: 0.1,
  12: 0.1,
  13: 0.1,
  14: 0.1,
  15: 0.1,
  16: 0.1,
  17: 0.1,
  18: 0.1,
  19: 0.1,
  20: 0.1,
};

export const CAREER_LEVELS = [
  {
    level: 1,
    title: 'IMPERIAL SENIOR',
    vp: 10000,
    prize: 250,
    lines: 2,
    minPerLine: 50,
  },
  {
    level: 2,
    title: 'IMPERIAL PLENO',
    vp: 20000,
    prize: 500,
    lines: 3,
    minPerLine: 33,
  },
  {
    level: 3,
    title: 'IMPERIAL BROCKER',
    vp: 40000,
    prize: 1000,
    lines: 4,
    minPerLine: 25,
  },
  {
    level: 4,
    title: 'IMPERIAL DIRETOR',
    vp: 80000,
    prize: 1500,
    lines: 5,
    minPerLine: 20,
  },
  {
    level: 5,
    title: 'IMPERIAL PRESIDENTE',
    vp: 200000,
    prize: 2000,
    lines: 7,
    minPerLine: 15,
  },
];

export function getUnlockedLevels(totalInvested) {
  return Math.min(Math.floor(totalInvested / 100), 20);
}

export function getWithdrawalPenalty(investmentDays) {
  if (investmentDays <= 30) return 30;
  if (investmentDays <= 60) return 20;
  if (investmentDays <= 90) return 10;
  return 0;
}

export function getPlanForAmount(amount) {
  if (amount >= 5000) return 'imperium';
  if (amount >= 1000) return 'gold';
  if (amount >= 300) return 'silver';
  if (amount >= 100) return 'basic';
  if (amount >= 10) return 'start';
  return null;
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value || 0);
}