# Guia: Rate Limit Supabase

## Problema: Erro 429 - Email Rate Limit Exceeded

## Causas Comuns:
1. **Múltiplos cadastros** em curto período
2. **Mesmo email/IP** testando repetidamente
3. **Rate limit** do Supabase Auth

## Soluções:

### 1. Aguardar Reset (Imediato)
- Aguardar 5-10 minutos
- Rate limit reseta automaticamente

### 2. Usar Emails Diferentes
- Use emails únicos para cada teste
- Ex: test+1@email.com, test+2@email.com

### 3. Configurar Rate Limit (Supabase Dashboard)

#### Aumentar Rate Limit:
1. Acessar Supabase Dashboard
2. Ir para Authentication > Settings
3. Ajustar "Rate limits"
4. Aumentar "Email sent per minute"

#### Desabilitar Rate Limit (Teste):
1. Em Authentication > Settings
2. Desabilitar "Enable email confirmations"
3. Reduzir "Rate limits" para teste

### 4. Usar ambiente de desenvolvimento
- Criar projeto separado para testes
- Usar chaves diferentes de produção

## Teste Recomendado:
1. Aguardar 10 minutos
2. Usar email novo: teste+timestamp@email.com
3. Testar cadastro com indicação
4. Verificar logs do console

## Configuração Sugerida (Supabase):
```
Email sent per minute: 10
Email sent per hour: 100
Rate limit per IP: 100
```

## Verificação:
- Console: Verificar logs de indicação
- Supabase: Verificar tabela network_relations
- Database: Executar check_network.sql
