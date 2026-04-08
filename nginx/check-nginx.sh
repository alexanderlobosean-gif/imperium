#!/bin/bash
# Script para diagnosticar problemas de NGINX na VPS

echo "=== DIAGNÓSTICO NGINX ==="
echo ""

echo "1. Verificando se NGINX está rodando..."
systemctl status nginx --no-pager

echo ""
echo "2. Testando configuração do NGINX..."
nginx -t

echo ""
echo "3. Verificando erros recentes..."
tail -50 /var/log/nginx/error.log

echo ""
echo "4. Verificando timeouts atuais..."
grep -i "timeout" /etc/nginx/nginx.conf /etc/nginx/sites-enabled/* 2>/dev/null || echo "Nenhuma configuração de timeout encontrada"

echo ""
echo "5. Verificando DNS resolution..."
time nslookup imperiumclub.asia
time curl -I -s -o /dev/null -w "%{time_total}s" http://imperiumclub.asia

echo ""
echo "6. Verificando conexões ativas..."
netstat -tn | grep :80 | wc -l
netstat -tn | grep :443 | wc -l

echo ""
echo "7. Testando backend diretamente..."
time curl -s -o /dev/null -w "%{http_code} - %{time_total}s" http://localhost:3001/api/health 2>/dev/null || echo "Backend não respondeu"

echo ""
echo "=== FIM DO DIAGNÓSTICO ==="
