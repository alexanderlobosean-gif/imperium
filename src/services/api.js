// API Service para comunicação com backend
// Todas as operações financeiras devem passar pelo backend

import { supabase } from '@/lib/supabase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

console.log('API Base URL:', API_BASE_URL);

// Helper para fazer requests com auth token
const apiRequest = async (endpoint, options = {}) => {
  // Tentar pegar token do Supabase client primeiro
  let token = null;
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    token = session?.access_token;
    console.log('🔍 Token do Supabase session:', token ? `existe (${token.length} chars)` : 'não encontrado');
  } catch (e) {
    console.error('❌ Erro ao pegar sessão do Supabase:', e);
  }
  
  // Fallback: verificar localStorage
  if (!token) {
    const localStorageKeys = Object.keys(localStorage);
    console.log('🔍 localStorage keys:', localStorageKeys);
    
    for (const key of localStorageKeys) {
      const value = localStorage.getItem(key);
      console.log(`🔍 ${key}:`, value ? `${value.length} chars` : 'vazio');
      
      if (value && value.startsWith('{')) {
        try {
          const parsed = JSON.parse(value);
          if (parsed.access_token) {
            token = parsed.access_token;
            console.log(`✅ Token encontrado em ${key}`);
            break;
          }
        } catch (e) {
          // não é JSON
        }
      }
    }
  }
  
  // Fallback: verificar sessionStorage
  if (!token) {
    const sessionStorageKeys = Object.keys(sessionStorage);
    console.log('🔍 sessionStorage keys:', sessionStorageKeys);
    
    for (const key of sessionStorageKeys) {
      const value = sessionStorage.getItem(key);
      if (value && value.startsWith('{')) {
        try {
          const parsed = JSON.parse(value);
          if (parsed.access_token) {
            token = parsed.access_token;
            console.log(`✅ Token encontrado em sessionStorage.${key}`);
            break;
          }
        } catch (e) {
          // não é JSON
        }
      }
    }
  }
  
  console.log(`🔐 API Request: ${endpoint}`, { hasToken: !!token, tokenLength: token?.length });
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    console.error(`❌ API Error ${response.status}:`, error);
    throw new Error(error.error || error.message || `HTTP ${response.status}`);
  }

  return response.json();
};

// API de Autenticação
export const authAPI = {
  login: (email, password) => apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }),
  
  register: (userData) => apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),
  
  logout: () => apiRequest('/auth/logout', { method: 'POST' }),
  
  me: () => apiRequest('/auth/me'),
};

// API Financeira
export const financialAPI = {
  // [DEPRECATED] Criar transferência direta - usar initiateTransfer + confirmTransfer
  transfer: (data) => apiRequest('/financial/transfer', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  // Iniciar transferência - envia email com código de verificação
  initiateTransfer: (data) => apiRequest('/financial/transfer/initiate', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  // Confirmar transferência com código de verificação
  confirmTransfer: (data) => apiRequest('/financial/transfer/confirm', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  // Criar depósito USDT - gera QR Code
  createUSDTDeposit: (data) => apiRequest('/financial/deposit/usdt', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Aprovar/Rejeitar depósito (Admin)
  approveDeposit: (data) => apiRequest('/financial/deposit/approve', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Listar depósitos pendentes (Admin)
  getPendingDeposits: () => apiRequest('/financial/deposits/pending'),
  
  // Solicitar saque
  withdrawal: (data) => apiRequest('/financial/withdrawal', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  // Aprovar/Rejeitar saque (Admin)
  approveWithdrawal: (data) => apiRequest('/financial/withdrawal/approve', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  // Listar saques pendentes (Admin)
  getPendingWithdrawals: () => apiRequest('/financial/withdrawals/pending'),
  
  // Consultar saldo
  getBalance: () => apiRequest('/financial/balance'),
  
  // Histórico de transações
  getTransactions: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/financial/transactions?${query}`);
  },
};

// API de Rede MLM
export const networkAPI = {
  // Buscar downline
  getDownline: () => apiRequest('/network/downline'),
  
  // Estatísticas da rede
  getStats: () => apiRequest('/network/stats'),
  
  // Indicar novo membro
  inviteMember: (data) => apiRequest('/network/invite', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
};

export default { authAPI, financialAPI, networkAPI };
