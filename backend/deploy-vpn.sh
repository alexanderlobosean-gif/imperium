#!/bin/bash
# Script rápido de deploy - Atualizar backend na VPN

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🚀 Deploy Backend - Imperium${NC}"
echo "============================"

# 1. Navegar à RAIZ do projeto (onde está o .git)
cd /var/www/imperium
echo -e "${GREEN}✅ Diretório raiz: $(pwd)${NC}"

# 2. Git Pull na raiz (branch main - produção)
echo -e "${YELLOW}📥 Atualizando código (produção)...${NC}"
git pull origin main
echo -e "${GREEN}✅ Código atualizado${NC}"

# 3. Agora ir para pasta backend
cd /var/www/imperium/backend
echo -e "${GREEN}✅ Diretório backend: $(pwd)${NC}"

# 4. Backup (manter apenas últimos 3)
echo -e "${YELLOW}📦 Criando backup...${NC}"
cp -r /var/www/imperium/backend /var/www/imperium/backend_backup_$(date +%Y%m%d_%H%M%S)
# Remover backups antigos (mais de 3)
ls -t /var/www/imperium/backend_backup_* 2>/dev/null | tail -n +4 | xargs -r rm -rf
echo -e "${GREEN}✅ Backup criado${NC}"

# 4. Instalar dependências (se package.json mudou)
echo -e "${YELLOW}📦 Verificando dependências...${NC}"
npm install
echo -e "${GREEN}✅ Dependências OK${NC}"

# 5. Reiniciar serviço
echo -e "${YELLOW}🔄 Reiniciando backend...${NC}"
pm2 restart imperium-backend || pm2 start server.js --name imperium-backend
pm2 save
echo -e "${GREEN}✅ Serviço reiniciado${NC}"

# 6. Testar saúde
echo -e "${YELLOW}🧪 Testando...${NC}"
sleep 3
if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend respondendo!${NC}"
else
    echo -e "${RED}⚠️ Backend pode estar iniciando, verifique:${NC}"
    echo "  pm2 logs imperium-backend"
fi

echo ""
echo -e "${GREEN}🎉 Deploy completo!${NC}"
echo ""
echo "Comandos úteis:"
echo "  pm2 logs imperium-backend  - Ver logs"
echo "  pm2 status                 - Status do serviço"
echo "  curl http://localhost:3001/api/health - Testar API"
