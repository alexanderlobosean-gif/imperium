#!/bin/bash

# Script de Deploy do Backend - Imperium VPN
# Executar na VPN: bash deploy_backend.sh

echo "🚀 Iniciando deploy do backend..."

# 1. Navegar ao diretório
cd /var/www/imperium/backend

# 2. Backup (opcional)
echo "📦 Criando backup..."
cp -r /var/www/imperium/backend /var/www/imperium/backend_backup_$(date +%Y%m%d_%H%M%S) 2>/dev/null || echo "Sem backup anterior"

# 3. Parar serviço
echo "🛑 Parando serviço..."
pm2 stop imperium-backend 2>/dev/null || echo "Serviço não estava rodando"

# 4. Atualizar código
echo "📥 Atualizando código..."
git pull origin develop

# 5. Instalar dependências
echo "📦 Instalando dependências..."
npm install

# 6. Verificar .env
echo "🔍 Verificando variáveis de ambiente..."
if [ ! -f .env.local ]; then
    echo "⚠️  Arquivo .env.local não encontrado!"
    exit 1
fi

# 7. Testar início
echo "🧪 Testando inicialização..."
timeout 5s npm start || echo "Teste concluído"

# 8. Iniciar com PM2
echo "▶️  Iniciando serviço..."
pm2 start server.js --name imperium-backend

# 9. Salvar configuração PM2
pm2 save

echo "✅ Deploy concluído!"
echo ""
echo "Comandos úteis:"
echo "  pm2 logs imperium-backend  - Ver logs"
echo "  pm2 status                 - Ver status"
echo "  pm2 restart imperium-backend - Reiniciar"
