#!/bin/bash
# LocalTunnel - Alternativa simples sem precisar de domínio
# Gera URL HTTPS automaticamente

set -e

echo "🚀 LocalTunnel Setup - Sem domínio necessário"
echo "==============================================="

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}📦 Instalando Node.js...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

# Instalar localtunnel globalmente
if ! command -v lt &> /dev/null; then
    echo -e "${YELLOW}📥 Instalando LocalTunnel...${NC}"
    npm install -g localtunnel
    echo -e "${GREEN}✅ LocalTunnel instalado${NC}"
else
    echo -e "${GREEN}✅ LocalTunnel já existe${NC}"
fi

# Verificar PM2
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi

# Criar script de startup
cat > /root/run-lt.sh << 'EOF'
#!/bin/bash
# Gera URL HTTPS para porta 3001
lt --port 3001 --subdomain imperium-api-$(shuf -i 1000-9999 -n 1)
EOF
chmod +x /root/run-lt.sh

echo ""
echo -e "${GREEN}✅ Setup completo!${NC}"
echo ""
echo -e "${YELLOW}Para iniciar o tunnel:${NC}"
echo "  lt --port 3001"
echo ""
echo -e "${YELLOW}Ou com subdomínio personalizado:${NC}"
echo "  lt --port 3001 --subdomain imperium-api-1234"
echo ""
echo -e "${YELLOW}Vai gerar uma URL como:${NC}"
echo "  https://imperium-api-1234.loca.lt"
echo ""
echo -e "${RED}⚠️  Importante:${NC} Ao acessar a URL, clique em 'Click to Continue'"
echo ""

# Iniciar automaticamente
read -p "Deseja iniciar o tunnel agora? (s/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}🚀 Iniciando tunnel...${NC}"
    lt --port 3001
fi
