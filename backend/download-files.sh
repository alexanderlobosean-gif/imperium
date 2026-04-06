#!/bin/bash
# Script para baixar arquivos do Git quando backend está vazio

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🚀 Baixando arquivos do Git${NC}"
echo "==========================="

# 1. Ir para raiz do projeto
cd /var/www/imperium
echo -e "${GREEN}✅ Diretório: $(pwd)${NC}"

# 2. Verificar se é um repositório git
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ Não é um repositório Git${NC}"
    exit 1
fi

# 3. Forçar checkout dos arquivos (restaura tudo do git)
echo -e "${YELLOW}📥 Baixando arquivos da branch main...${NC}"
git fetch origin main
git checkout origin/main -- backend/
echo -e "${GREEN}✅ Arquivos restaurados${NC}"

# 4. Ir para pasta backend
cd /var/www/imperium/backend
echo -e "${GREEN}✅ Backend: $(pwd)${NC}"

# 5. Instalar dependências
echo -e "${YELLOW}📦 Instalando dependências...${NC}"
npm install
echo -e "${GREEN}✅ Dependências OK${NC}"

# 6. Reiniciar serviço
echo -e "${YELLOW}🔄 Reiniciando backend...${NC}"
pm2 restart imperium-backend || pm2 start server.js --name imperium-backend
pm2 save
echo -e "${GREEN}✅ Serviço reiniciado${NC}"

# 7. Verificar
echo -e "${YELLOW}🧪 Verificando...${NC}"
sleep 2
if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend funcionando!${NC}"
else
    echo -e "${YELLOW}⚠️ Verificando logs...${NC}"
    pm2 logs imperium-backend --lines 10
fi

echo ""
echo -e "${GREEN}🎉 Concluído!${NC}"
