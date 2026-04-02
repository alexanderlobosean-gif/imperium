# Aumentar Rate Limit no Supabase Dashboard

## Acesso:
1. Vá para: https://supabase.com/dashboard
2. Projeto: okazavmygdoglzpsgxgv
3. Menu: Authentication → Settings

## Configure os seguintes valores:

### Rate Limits:
- **Rate limit per IP:** 1000 (aumentar drasticamente)
- **Email sent per minute:** 100 (aumentar)
- **Email sent per hour:** 1000 (aumentar)

### Email Settings:
- **Enable email confirmations:** OFF (desmarcar)
- **Site URL:** http://localhost:5173

## Alternativa: Modo Debug

### Desabilitar completamente:
```
Authentication → Settings → Security
Toggle: "Disable rate limiting" (se disponível)
```

## SQL Alternativo (se dashboard não funcionar):

```sql
-- Isso pode não funcionar, mas tentar
UPDATE auth.config 
SET value = '{"enabled": false}'::jsonb 
WHERE key = 'rate_limiting_enabled';
```

## Teste após configurar:

1. Limpe cache do navegador
2. Use incognito/private window
3. Teste com email completamente novo
4. Aguarde 2-3 minutos entre tentativas

## Se ainda persistir:

### Criar projeto de teste:
1. Novo projeto Supabase
2. Copiar estrutura das tabelas
3. Usar para desenvolvimento
4. Manter projeto original para produção
