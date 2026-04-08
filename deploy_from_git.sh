#!/bin/bash

# Deploy Backend na VPN - Baixando direto do GitHub
# Salvar como: /var/www/imperium/deploy_from_git.sh
# Executar na VPN: bash deploy_from_git.sh

REPO_URL="https://github.com/alexanderlobosean-gif/imperium.git"
BRANCH="develop"
BACKEND_DIR="/var/www/imperium/backend"
BACKUP_DIR="/var/www/imperium/backups"
TEMP_DIR="/tmp/imperium_deploy"

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log() {
    echo -e "${GREEN}[$(date +%H:%M:%S)]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[AVISO]${NC} $1"
}

error() {
    echo -e "${RED}[ERRO]${NC} $1"
}

# 1. Criar diretórios necessários
log "Criando diretórios..."
mkdir -p "$BACKUP_DIR"
mkdir -p "$TEMP_DIR"

# 2. Backup do backend atual
BACKUP_NAME="backend_backup_$(date +%Y%m%d_%H%M%S)"
if [ -d "$BACKEND_DIR" ]; then
    log "Criando backup: $BACKUP_NAME"
    cp -r "$BACKEND_DIR" "$BACKUP_DIR/$BACKUP_NAME"
    log "Backup salvo em: $BACKUP_DIR/$BACKUP_NAME"
else
    warn "Diretório backend não existe, criando novo..."
    mkdir -p "$BACKEND_DIR"
fi

# 3. Clonar repositório
log "Clonando repositório do GitHub (branch: $BRANCH)..."
cd "$TEMP_DIR"
rm -rf imperium

if ! git clone -b "$BRANCH" --single-branch --depth 1 "$REPO_URL"; then
    error "Falha ao clonar repositório"
    exit 1
fi

# 4. Verificar se backend existe no repo
if [ ! -d "$TEMP_DIR/imperium/backend" ]; then
    error "Diretório 'backend' não encontrado no repositório"
    exit 1
fi

# 5. Parar serviço
log "Parando serviço PM2..."
pm2 stop imperium-backend 2>/dev/null || warn "Serviço não estava rodando"

# 6. Preservar .env.local
log "Preservando .env.local..."
if [ -f "$BACKEND_DIR/.env.local" ]; then
    cp "$BACKEND_DIR/.env.local" /tmp/.env.local.backup
    log ".env.local salvo temporariamente"
fi

# 7. Atualizar arquivos
log "Atualizando arquivos do backend..."
rm -rf "$BACKEND_DIR"
cp -r "$TEMP_DIR/imperium/backend" "$BACKEND_DIR"

# 8. Restaurar .env.local
if [ -f /tmp/.env.local.backup ]; then
    log "Restaurando .env.local..."
    cp /tmp/.env.local.backup "$BACKEND_DIR/.env.local"
    rm /tmp/.env.local.backup
fi

# 9. Instalar dependências
log "Instalando dependências..."
cd "$BACKEND_DIR"
if ! npm install --production; then
    error "Falha ao instalar dependências"
    exit 1
fi

# 10. Iniciar serviço
log "Iniciando serviço com PM2..."
if pm2 start server.js --name imperium-backend; then
    log "Serviço iniciado com sucesso!"
    pm2 save
else
    error "Falha ao iniciar serviço"
    exit 1
fi

# 11. Limpeza
log "Limpando arquivos temporários..."
rm -rf "$TEMP_DIR"

# 12. Verificação
log "Verificando status..."
PM2_STATUS=$(pm2 status imperium-backend | grep -c "online" || echo "0")
if [ "$PM2_STATUS" -gt 0 ]; then
    log "===================================="
    log "  DEPLOY CONCLUÍDO COM SUCESSO!"
    log "===================================="
    log "Status: ONLINE"
    log "Backup: $BACKUP_DIR/$BACKUP_NAME"
    log ""
    log "Comandos úteis:"
    log "  pm2 logs imperium-backend    - Ver logs"
    log "  pm2 status                   - Status geral"
    log "  pm2 restart imperium-backend - Reiniciar"
else
    error "Serviço não está online. Verificar logs:"
    error "  pm2 logs imperium-backend"
    exit 1
fi
