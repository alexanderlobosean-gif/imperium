# Guia: Confirmar Email Manualmente no Supabase

## Método 1: Supabase Dashboard (Manual)

### Passos:
1. Acesse: https://supabase.com/dashboard
2. Selecione projeto: okazavmygdoglzpsgxgv
3. Menu lateral: **Authentication**
4. Clique em **Users**
5. Encontre o usuário cadastrado
6. Clique nos 3 pontos (...) ao lado do usuário
7. Selecione **"Confirm email"**
8. Confirme a ação

## Método 2: SQL direto no Database

### SQL para confirmar usuário:
```sql
-- Encontrar usuário pelo email
SELECT id, email, email_confirmed_at 
FROM auth.users 
WHERE email = 'usuario@teste.com';

-- Confirmar manualmente
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email = 'usuario@teste.com';

-- Verificar se foi confirmado
SELECT id, email, email_confirmed_at 
FROM auth.users 
WHERE email = 'usuario@teste.com';
```

## Método 3: Confirmar todos os usuários pendentes

### SQL para confirmar múltiplos:
```sql
-- Confirmar todos os usuários não confirmados
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- Verificar resultado
SELECT COUNT(*) as usuarios_confirmados 
FROM auth.users 
WHERE email_confirmed_at IS NOT NULL;
```

## Método 4: Script Automático (Node.js)

### Criar script para confirmar:
```javascript
// confirm-email.js
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://okazavmygdoglzpsgxgv.supabase.co',
  'sua-service-role-key'
)

async function confirmUser(email) {
  const { data, error } = await supabase.auth.admin.updateUserById(
    userId, // precisa do ID do usuário
    { email_confirm: true }
  )
  
  if (error) {
    console.error('Erro:', error)
  } else {
    console.log('Usuário confirmado:', data)
  }
}

// Uso: confirmUser('usuario@teste.com')
```

## Recomendação:

### Para testes rápidos:
**Use a Opção 1 (desabilitar confirmação)**

### Para produção:
**Mantenha confirmação ativa** e use Método 1 quando necessário

### Para desenvolvimento:
**Use o SQL direto** para confirmar múltiplos usuários de uma vez
