# Imperium Backend API

Backend API enterprise para sistema financeiro MLM construído com Node.js, Express e Supabase.

## 🚀 Funcionalidades

- ✅ **Sistema de Ledger Financeiro** - Controle preciso de saldos
- ✅ **Múltiplos Saldos** - wallet_balance, yield_balance, bonus_balance, locked_balance
- ✅ **Transferências Seguras** - Entre usuários com validação completa
- ✅ **Estrutura MLM** - Até 20 níveis com Closure Table Pattern
- ✅ **Autenticação JWT** - Supabase Auth integration
- ✅ **Rate Limiting** - Proteção contra abuso
- ✅ **RLS Security** - Row Level Security aplicada
- ✅ **API RESTful** - Endpoints bem documentados

## 📋 Pré-requisitos

- Node.js 18+
- NPM ou Yarn
- Projeto Supabase configurado
- PostgreSQL (via Supabase)

## 🛠️ Instalação

1. **Clonar o repositório**
```bash
cd backend
```

2. **Instalar dependências**
```bash
npm install
```

3. **Configurar variáveis de ambiente**
```bash
cp .env.example .env.local
```

Preencha o `.env.local` com suas chaves do Supabase:

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

4. **Executar migrações do banco**

Execute os arquivos SQL na pasta `../Documentação/` em ordem:
- `01_ledger_financial.sql`
- `02_wallet_balances.sql`
- `03_mlm_structure.sql`
- `04_transfer_functions.sql`
- `05_rls_policies.sql`

## 🚀 Executando

### Desenvolvimento
```bash
npm run dev
```

### Produção
```bash
npm start
```

O servidor iniciará na porta definida em `PORT` (padrão: 3001).

## 📚 API Endpoints

### Autenticação

#### POST /api/auth/register
Registra novo usuário
```json
{
  "email": "user@example.com",
  "password": "password123",
  "full_name": "Nome Completo",
  "sponsor_email": "sponsor@example.com" // opcional
}
```

#### POST /api/auth/login
Faz login
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### GET /api/auth/me
Busca dados do usuário logado (requer auth)

### Financeiro

#### POST /api/financial/deposit
Cria depósito pendente
```json
{
  "amount": 100.00,
  "method": "pix",
  "reference": "DEP123"
}
```

#### POST /api/financial/withdrawal
Solicita saque
```json
{
  "amount": 50.00,
  "method": "pix",
  "destination_address": "chave@pix.com"
}
```

#### POST /api/financial/transfer
Transfere dinheiro entre usuários
```json
{
  "amount": 25.00,
  "recipient_email": "destinatario@example.com",
  "description": "Pagamento de serviço"
}
```

#### GET /api/financial/balance
Busca saldos do usuário
```json
{
  "wallet_balance": 100.00,
  "yield_balance": 50.00,
  "bonus_balance": 25.00,
  "locked_balance": 0.00,
  "available_balance": 175.00
}
```

#### GET /api/financial/transactions
Busca histórico de transações
```
?page=1&limit=20&type=transfer_received
```

### Rede MLM

#### GET /api/network/downline
Busca rede de indicações
```
?level=20
```

#### GET /api/network/stats
Estatísticas da rede
```json
{
  "level_stats": [
    {"level": 1, "count": 5},
    {"level": 2, "count": 12}
  ],
  "total_commissions": 250.00,
  "total_members": 17
}
```

#### POST /api/network/referral
Indica novo membro
```json
{
  "email": "novo@example.com",
  "full_name": "Novo Membro"
}
```

## 🔒 Segurança

- **Row Level Security (RLS)** aplicada em todas as tabelas
- Usuários NÃO manipulam dinheiro diretamente
- Apenas **service role** pode modificar saldos e ledger
- Autenticação obrigatória em todas as rotas financeiras
- Rate limiting para prevenir abuso
- Validação rigorosa de entrada

## 🏗️ Arquitetura

```
Frontend (React) → Backend API (Node.js) → Supabase (PostgreSQL)
                        ↓
                  Service Role Only
                        ↓
               Financial Ledger (Truth)
```

### Componentes Principais

1. **Ledger Financeiro** - Única fonte da verdade para saldos
2. **Múltiplos Saldos** - Separação clara de tipos de saldo
3. **Funções de Banco** - Lógica crítica executada server-side
4. **RLS Policies** - Segurança granular por usuário
5. **API RESTful** - Interface limpa para o frontend

## 🧪 Testes

```bash
npm test
```

## 📊 Monitoramento

- Health check: `GET /api/health`
- Logs estruturados
- Integração com Sentry (opcional)

## 🚀 Deploy

### Railway
```bash
# 1. Conectar repositório
# 2. Configurar variáveis de ambiente
# 3. Deploy automático
```

### Heroku
```bash
# 1. Criar app
heroku create imperium-backend

# 2. Configurar variáveis
heroku config:set SUPABASE_URL=...
heroku config:set SUPABASE_SERVICE_ROLE_KEY=...

# 3. Deploy
git push heroku main
```

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT.

## 🆘 Suporte

Para suporte, abra uma issue no GitHub ou entre em contato com a equipe de desenvolvimento.
