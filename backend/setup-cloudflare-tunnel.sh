#!/bin/bash
# Script de instalação automática do Cloudflare Tunnel para Imperium Backend
# Execute no servidor VPS como root

set -e

echo "🚀 Instalador Cloudflare Tunnel - Imperium Backend"
echo "=================================================="

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar se está como root
if [ "$EUID" -ne 0 ]; then 
   echo -e "${RED}❌ Por favor, execute como root (sudo)${NC}"
   exit 1
fi

# 1. Atualizar sistema
echo -e "${YELLOW}📦 Atualizando sistema...${NC}"
apt update -qq > /dev/null 2>&1

# 2. Baixar cloudflared
echo -e "${YELLOW}📥 Baixando cloudflared...${NC}"
if [ ! -f /usr/local/bin/cloudflared ]; then
    wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -O /usr/local/bin/cloudflared
    chmod +x /usr/local/bin/cloudflared
    echo -e "${GREEN}✅ Cloudflared instalado${NC}"
else
    echo -e "${GREEN}✅ Cloudflared já existe${NC}"
fi

# 3. Verificar se já existe tunnel
echo ""
echo -e "${YELLOW}🔍 Verificando tunnels existentes...${NC}"
if [ -f /root/.cloudflared/config.yml ]; then
    echo -e "${GREEN}✅ Tunnel já configurado!${NC}"
    echo ""
    echo -e "${YELLOW}URLs ativas:${NC}"
    cloudflared tunnel list 2>/dev/null | grep -E "imperium|ID" || true
    echo ""
    echo -e "${YELLOW}Para reiniciar o tunnel:${NC}"
    echo "  pm2 restart cloudflare-tunnel"
    exit 0
fi

# 4. Autenticar no Cloudflare
echo ""
echo -e "${YELLOW}🔐 Autenticação Cloudflare${NC}"
echo "================================"
echo "Um link será gerado abaixo."
echo "1. Copie o link e abra no navegador"
echo "2. Autorize o acesso à sua conta Cloudflare"
echo "3. Volte aqui e continue"
echo ""
read -p "Pressione ENTER quando estiver pronto..."

cloudflared tunnel login

if [ ! -f /root/.cloudflared/cert.pem ]; then
    echo -e "${RED}❌ Autenticação falhou. Execute novamente.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Autenticado com sucesso!${NC}"

# 5. Criar tunnel
echo ""
echo -e "${YELLOW}🚇 Criando tunnel 'imperium-backend'...${NC}"
TUNNEL_OUTPUT=$(cloudflared tunnel create imperium-backend 2>&1)
echo "$TUNNEL_OUTPUT"

# Extrair UUID
TUNNEL_ID=$(echo "$TUNNEL_OUTPUT" | grep -oP '[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}' | head -1)

if [ -z "$TUNNEL_ID" ]; then
    echo -e "${RED}❌ Não foi possível extrair o Tunnel ID${NC}"
    echo "Output: $TUNNEL_OUTPUT"
    exit 1
fi

echo -e "${GREEN}✅ Tunnel criado: $TUNNEL_ID${NC}"

# 6. Criar configuração
echo -e "${YELLOW}📝 Criando configuração...${NC}"

cat > /root/.cloudflared/config.yml << EOF
tunnel: ${TUNNEL_ID}
credentials-file: /root/.cloudflared/${TUNNEL_ID}.json

ingress:
  - hostname: imperium-api-$(date +%s | tail -c 5).trycloudflare.com
    service: http://localhost:3001
  - service: http_status:404
EOF

echo -e "${GREEN}✅ Configuração criada${NC}"

# 7. Instalar PM2 se não existir
echo -e "${YELLOW}📦 Verificando PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
    echo -e "${GREEN}✅ PM2 instalado${NC}"
else
    echo -e "${GREEN}✅ PM2 já existe${NC}"
fi

# 8. Criar script do tunnel
cat > /root/run-tunnel.sh << 'EOF'
#!/bin/bash
/usr/local/bin/cloudflared tunnel run imperium-backend
EOF
chmod +x /root/run-tunnel.sh

# 9. Iniciar com PM2
echo -e "${YELLOW}🚀 Iniciando tunnel com PM2...${NC}"
cd /root
pm2 start run-tunnel.sh --name "cloudflare-tunnel" --restart-delay 5000
pm2 save

# 10. Mostrar URL
echo ""
echo -e "${GREEN}🎉 Setup completo!${NC}"
echo "================================"
echo ""
echo -e "${YELLOW}Aguardando tunnel iniciar...${NC}"
sleep 5

echo ""
echo -e "${YELLOW}Tunnel ativo:${NC}"
cloudflared tunnel list 2>/dev/null | head -10

echo ""
echo -e "${YELLOW}Logs em tempo real:${NC}"
echo "  pm2 logs cloudflare-tunnel"
echo ""
echo -e "${YELLOW}Para reiniciar:${NC}"
echo "  pm2 restart cloudflare-tunnel"
echo ""
echo -e "${YELLOW}Para parar:${NC}"
echo "  pm2 stop cloudflare-tunnel"
echo ""
echo -e "${GREEN}✅ Backend agora acessível via HTTPS!${NC}"
