# Deploy Backend na VPN - Imperium

## 📋 Pré-requisitos

- Acesso SSH ao servidor VPN
- Usuário com permissões sudo
- Git instalado no servidor
- Node.js e npm instalados
- PM2 instalado globalmente (`npm install -g pm2`)

## 🚀 Passo a Passo

### 1. Conectar ao servidor via SSH

```bash
ssh usuario@IP_DO_SERVIDOR_VPN
```

### 2. Navegar até o diretório do backend

```bash
cd /var/www/imperium/backend
```

### 3. Fazer backup (opcional mas recomendado)

```bash
# Criar backup do diretório atual
cp -r /var/www/imperium/backend /var/www/imperium/backend_backup_$(date +%Y%m%d_%H%M%S)
```

### 4. Parar o serviço atual

```bash
# Verificar se está rodando com PM2
pm2 list

# Parar o processo
pm2 stop imperium-backend
# ou
pm2 delete imperium-backend
```

### 5. Atualizar código do Git

```bash
# Verificar branch atual
git branch

# Fazer pull das últimas alterações
git pull origin develop

# Se houver conflitos, resolver ou usar:
# git reset --hard origin/develop
```

### 6. Instalar dependências

```bash
npm install
```

### 7. Verificar variáveis de ambiente

```bash
# Verificar se .env.local existe e está configurado
cat .env.local

# Deve conter:
# SUPABASE_URL=
# SUPABASE_ANON_KEY=
# SUPABASE_SERVICE_ROLE_KEY=
# JWT_SECRET=
# PORT=3001
```

### 8. Testar o backend

```bash
# Testar se inicia sem erros
npm start

# Deve mostrar:
# ✅ Teste service role OK - cliente funcionando
# 🚀 Backend API rodando na porta 3001
```

**Pressione Ctrl+C para parar após testar**

### 9. Iniciar com PM2 (produção)

```bash
# Iniciar com PM2
pm2 start server.js --name imperium-backend

# Configurar para iniciar automaticamente
pm2 save
pm2 startup
```

### 10. Verificar se está rodando

```bash
pm2 list
pm2 logs imperium-backend
```

## 🔄 Rollback (em caso de problemas)

```bash
# Parar o novo
cd /var/www/imperium/backend
pm2 stop imperium-backend

# Restaurar backup
cd /var/www/imperium
rm -rf backend
cp -r backend_backup_YYYYMODD_HHMMSS backend
cd backend
npm install
pm2 start server.js --name imperium-backend
```

## 📊 Comandos úteis

```bash
# Ver logs em tempo real
pm2 logs imperium-backend

# Reiniciar
pm2 restart imperium-backend

# Monitor
pm2 monit

# Status
pm2 status
```

## ⚠️ Checklist antes do deploy

- [ ] Código commitado no Git (branch develop)
- [ ] Testado localmente
- [ ] Backup do servidor atual
- [ ] Variáveis de ambiente configuradas
- [ ] PM2 configurado para iniciar automaticamente
