# Guia: Desabilitar Confirmação de Email no Supabase

## Passo a Passo:

### 1. Acessar Supabase Dashboard
- Acesse: https://supabase.com/dashboard
- Faça login com sua conta
- Selecione seu projeto: okazavmygdoglzpsgxgv

### 2. Ir para Configurações de Autenticação
- No menu lateral: **Authentication**
- Clique em **Settings** (ícone de engrenagem)

### 3. Desabilitar Confirmação de Email
- Role até encontrar **Email Settings**
- Desmarque a opção: **"Enable email confirmations"**
- Clique em **Save**

### 4. Ajustar Rate Limits (Opcional)
- Na mesma página, role até **Rate limits**
- Aumente os valores para testes:
  - Email sent per minute: 10 → 50
  - Email sent per hour: 100 → 500
- Clique em **Save**

### 5. Configurar Sign Up (Alternativa)
Se preferir manter confirmação, ajuste o Register.jsx:

```javascript
// Em Register.jsx, mude a chamada signUp:
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: metadata,
    emailRedirectTo: `${window.location.origin}/dashboard` // Redireciona direto
  }
})
```

## Configuração Sugerida para Testes:

```
✅ Enable email confirmations: OFF
✅ Email sent per minute: 50
✅ Email sent per hour: 500
✅ Rate limit per IP: 100
```

## Benefícios:
- Cadastro instantâneo
- Sem rate limits para testes
- Login imediato após cadastro
- Facilita testes de indicação

## Após alterar:
- Limpe cache do navegador
- Teste novo cadastro
- Verifique se login funciona imediatamente
