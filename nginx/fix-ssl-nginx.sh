#!/bin/bash
# FIX URGENTE - Corrige NGINX com SSL

echo "=== CORREÇÃO NGINX + SSL ==="

# 1. Backup e limpar configs quebradas
cp /etc/nginx/sites-enabled/api /etc/nginx/sites-enabled/api.broken
cp /etc/nginx/sites-enabled/imperium /etc/nginx/sites-enabled/imperium.broken

# 2. Configuração TEMPORÁRIA sem SSL (para gerar certificados)
cat > /etc/nginx/sites-enabled/api << 'EOF'
server {
    listen 80;
    server_name api.imperiumclub.asia;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

cat > /etc/nginx/sites-enabled/imperium << 'EOF'
server {
    listen 80;
    server_name imperiumclub.asia www.imperiumclub.asia;
    
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location / {
        root /var/www/imperium/dist;
        try_files $uri $uri/ /index.html;
    }
}
EOF

# 3. Testar e recarregar NGINX (sem SSL)
echo "Testando configuração básica..."
nginx -t && systemctl reload nginx

if [ $? -ne 0 ]; then
    echo "❌ Erro na configuração básica! Restaurando..."
    cp /etc/nginx/sites-enabled/api.broken /etc/nginx/sites-enabled/api
    cp /etc/nginx/sites-enabled/imperium.broken /etc/nginx/sites-enabled/imperium
    systemctl reload nginx
    exit 1
fi

echo "✅ Configuração básica OK!"

# 4. Parar NGINX temporariamente para gerar certificados
echo "Gerando certificados SSL..."
systemctl stop nginx

# 5. Gerar certificados com standalone
certbot certonly --standalone -d api.imperiumclub.asia -d imperiumclub.asia -d www.imperiumclub.asia --agree-tos --non-interactive --email admin@imperiumclub.asia

# 6. Verificar se certificados foram criados
if [ ! -f /etc/letsencrypt/live/api.imperiumclub.asia/fullchain.pem ]; then
    echo "❌ Falha ao gerar certificados!"
    systemctl start nginx
    exit 1
fi

echo "✅ Certificados SSL gerados!"

# 7. Aplicar configuração com SSL
cat > /etc/nginx/sites-enabled/api << 'EOF'
server {
    listen 80;
    server_name api.imperiumclub.asia;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.imperiumclub.asia;
    
    ssl_certificate /etc/letsencrypt/live/api.imperiumclub.asia/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.imperiumclub.asia/privkey.pem;
    
    ssl_session_cache shared:SSL:50m;
    ssl_session_timeout 1d;
    ssl_protocols TLSv1.2 TLSv1.3;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
    }
}
EOF

cat > /etc/nginx/sites-enabled/imperium << 'EOF'
server {
    listen 80;
    server_name imperiumclub.asia www.imperiumclub.asia;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name imperiumclub.asia www.imperiumclub.asia;
    
    ssl_certificate /etc/letsencrypt/live/imperiumclub.asia/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/imperiumclub.asia/privkey.pem;
    
    ssl_session_cache shared:SSL:50m;
    ssl_session_timeout 1d;
    ssl_protocols TLSv1.2 TLSv1.3;
    
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
    }
    
    location / {
        root /var/www/imperium/dist;
        try_files $uri $uri/ /index.html;
    }
}
EOF

# 8. Testar e iniciar NGINX
echo "Testando configuração final..."
nginx -t

if [ $? -eq 0 ]; then
    systemctl start nginx
    echo "✅ NGINX com SSL configurado com sucesso!"
    echo ""
    echo "Testando:"
    curl -s https://api.imperiumclub.asia/api/health
else
    echo "❌ Erro na configuração final!"
    systemctl start nginx
    exit 1
fi
