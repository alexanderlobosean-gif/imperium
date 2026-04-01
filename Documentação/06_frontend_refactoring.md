# REFACTORING FRONTEND - REMOVER MANIPULAÇÃO DIRETA DE DINHEIRO

## 🚨 CRÍTICO: Frontend NÃO deve manipular dinheiro

### ❌ O QUE NÃO FAZER MAIS:

```javascript
// NÃO FAZER: Calcular saldo no frontend
const availableBalance = totalDeposits - totalInvested + totalEarnings;

// NÃO FAZER: Modificar saldos diretamente
await supabase.from('profiles').update({ balance: newBalance });

// NÃO FAZER: Criar transferências diretamente
await supabase.from('transfers').insert({...});
```

### ✅ O QUE FAZER AGORA:

#### 1. Substituir cálculos de saldo por chamadas API

**ANTES:**
```javascript
// src/pages/Dashboard.jsx
const { data: deposits } = useQuery(['deposits', user?.id], fetchDeposits);
const { data: investments } = useQuery(['investments', user?.id], fetchInvestments);

const availableBalance = deposits?.reduce((sum, d) => sum + d.amount, 0) -
                        investments?.reduce((sum, i) => sum + i.amount, 0) +
                        investments?.reduce((sum, i) => sum + i.total_earned, 0);
```

**DEPOIS:**
```javascript
// src/pages/Dashboard.jsx
const { data: balance } = useQuery(['balance', user?.id], async () => {
  const response = await fetch('/api/financial/balance', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.json();
});

const availableBalance = balance?.available_balance || 0;
```

#### 2. Substituir mutations financeiras por chamadas API

**ANTES:**
```javascript
// src/pages/Wallet.jsx
const createTransferMutation = useMutation({
  mutationFn: async (transferData) => {
    // Lógica complexa de cálculo e validação no frontend
    const availableBalance = calculateBalance(); // ❌ PERIGOSO
    if (availableBalance < amount) throw new Error('Saldo insuficiente');

    // Inserir diretamente no banco ❌
    await supabase.from('transfers').insert({...});
    await supabase.from('profiles').update({ balance: ... });
  }
});
```

**DEPOIS:**
```javascript
// src/pages/Wallet.jsx
const createTransferMutation = useMutation({
  mutationFn: async (transferData) => {
    // ✅ Toda lógica no backend
    const response = await fetch('/api/financial/transfer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(transferData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }

    return response.json();
  }
});
```

#### 3. Remover imports desnecessários

**REMOVER:**
```javascript
// ❌ Não precisa mais calcular no frontend
import { calculateAvailableBalance } from '../utils/financial';

// ❌ Não precisa mais acessar tabelas diretamente
import supabase from '../lib/supabase';
```

#### 4. Atualizar estrutura de pastas

```
src/
├── api/           # Novo: Funções para chamar backend
│   ├── financial.js
│   ├── auth.js
│   └── network.js
├── components/    # Manter
├── pages/         # Atualizar para usar API
├── hooks/         # Novo: Hooks customizados
│   ├── useBalance.js
│   └── useFinancial.js
└── lib/           # Manter apenas config
```

#### 5. Criar hooks customizados

**src/hooks/useBalance.js:**
```javascript
import { useQuery } from '@tanstack/react-query';

export const useBalance = (userId) => {
  return useQuery({
    queryKey: ['balance', userId],
    queryFn: async () => {
      const token = localStorage.getItem('supabase_token');
      const response = await fetch('/api/financial/balance', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Erro ao buscar saldo');

      return response.json();
    },
    enabled: !!userId,
    staleTime: 30000, // 30 segundos
  });
};
```

**src/hooks/useFinancial.js:**
```javascript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

export const useTransfer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transferData) => {
      const token = localStorage.getItem('supabase_token');
      const response = await fetch('/api/financial/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(transferData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      return response.json();
    },
    onSuccess: () => {
      toast.success('Transferência realizada!');
      queryClient.invalidateQueries(['balance']);
      queryClient.invalidateQueries(['transactions']);
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });
};
```

#### 6. Atualizar componentes para usar hooks

**src/pages/Wallet.jsx:**
```javascript
import { useBalance, useTransfer } from '../hooks/useFinancial';

const Wallet = () => {
  const { data: balance } = useBalance(user?.id);
  const transferMutation = useTransfer();

  const handleTransfer = (transferData) => {
    transferMutation.mutate(transferData);
  };

  // Remover toda lógica de cálculo de saldo
  // Remover createTransferMutation antigo
  // Usar apenas o hook
};
```

#### 7. Atualizar AuthContext

**REMOVER:**
```javascript
// ❌ Não armazenar token no localStorage diretamente
localStorage.setItem('supabase_token', session.access_token);
```

**ADICIONAR:**
```javascript
// ✅ Centralizar gerenciamento de token
const getAuthToken = () => {
  return localStorage.getItem('supabase_token');
};

const setAuthToken = (token) => {
  localStorage.setItem('supabase_token', token);
};
```

#### 8. Tratamento de erros melhorado

```javascript
// src/utils/errorHandler.js
export const handleApiError = (error) => {
  if (error.response?.status === 401) {
    // Token expirado - redirecionar para login
    window.location.href = '/login';
  } else if (error.response?.status === 403) {
    toast.error('Acesso negado');
  } else {
    toast.error(error.message || 'Erro inesperado');
  }
};
```

## 🚀 Benefícios desta refatoração:

1. **Segurança** - Usuários não manipulam dinheiro
2. **Consistência** - Saldo sempre calculado server-side
3. **Performance** - Menos queries do frontend
4. **Manutenibilidade** - Lógica centralizada no backend
5. **Escalabilidade** - Fácil adicionar novas regras

## 📋 Checklist de migração:

- [ ] Criar hooks customizados
- [ ] Atualizar todas as mutations financeiras
- [ ] Remover cálculos de saldo do frontend
- [ ] Atualizar AuthContext
- [ ] Adicionar tratamento de erros
- [ ] Testar todas as funcionalidades
- [ ] Deploy gradual (feature flags)
