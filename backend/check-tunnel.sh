#!/bin/bash
# Script de diagnóstico e recuperação do Cloudflare Tunnel

set -e

echo "🔍 Diagnóstico Cloudflare Tunnel"
echo "================================"

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Verificar se cloudflared existe
if [ ! -f /usr/local/bin/cloudflared ]; then
    echo -e "${RED}❌ Cloudflared não instalado${NC}"
    echo "Execute primeiro: ./setup-cloudflare-tunnel.sh"
    exit 1
fi

echo -e "${YELLOW}📊 Status dos Tunnels:${NC}"
echo ""
cloudflared tunnel list 2>/dev/null || echo "Nenhum tunnel encontrado"

echo ""
echo -e "${YELLOW}📁 Arquivos de configuração:${NC}"
ls -la /root/.cloudflared/ 2>/dev/null || echo "Diretório não existe"

echo ""
echo -e "${YELLOW}🔄 Status PM2:${NC}"
pm2 status 2>/dev/null || echo "PM2 não está rodando"

echo ""
echo -e "${YELLOW}🔧 Verificando certificado:${NC}"
if [ -f /root/.cloudflared/cert.pem ]; then
    echo -e "${GREEN}✅ Certificado existe${NC}"
    ls -la /root/.cloudflared/cert.pem
else
    echo -e "${RED}❌ Certificado não encontrado${NC}"
    echo "Precisa fazer login: cloudflared tunnel login"
fi

echo ""
echo -e "${YELLOW}📝 Configuração atual:${NC}"
if [ -f /root/.cloudflared/config.yml ]; then
    cat /root/.cloudflared/config.yml
else
    echo -e "${RED}❌ Arquivo config.yml não existe${NC}"
fi

echo ""
echo "================================"
echo -e "${GREEN}✅ Diagnóstico completo${NC}"
