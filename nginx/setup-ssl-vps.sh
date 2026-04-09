#!/bin/bash
# Script para configurar SSL/HTTPS na VPS

echo "=== CONFIGURAÇÃO SSL NGINX ==="
echo ""

# Verificar se Certbot está instalado
if ! command -v certbot &> /dev/null; then
    echo "Instalando Certbot..."
    apt update
    apt install -y certbot python3-certbot-nginx
fi

# Parar NGINX temporariamente
systemctl stop nginx

# Gerar certificados para ambos os domínios
echo "Gerando certificados SSL..."
certbot certonly --standalone -d api.imperiumclub.asia -d imperiumclub.asia -d www.imperiumclub.asia --agree-tos --non-interactive --email admin@imperiumclub.asia

# Se certbot falhar, criar certificados auto-assinados temporários
if [ ! -f /etc/letsencrypt/live/api.imperiumclub.asia/fullchain.pem ]; then
    echo "Criando certificados auto-assinados temporários..."
    mkdir -p /etc/letsencrypt/live/api.imperiumclub.asia
    mkdir -p /etc/letsencrypt/live/imperiumclub.asia
    
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/letsencrypt/live/api.imperiumclub.asia/privkey.pem \
        -out /etc/letsencrypt/live/api.imperiumclub.asia/fullchain.pem \
        -subj "/CN=api.imperiumclub.asia"
    
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/letsencrypt/live/imperiumclub.asia/privkey.pem \
        -out /etc/letsencrypt/live/imperiumclub.asia/fullchain.pem \
        -subj "/CN=imperiumclub.asia"
fi

# Backup das configurações antigas
cp /etc/nginx/sites-enabled/api /etc/nginx/sites-enabled/api.bak
cp /etc/nginx/sites-enabled/imperium /etc/nginx/sites-enabled/imperium.bak

# Aplicar nova configuração
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
    ssl_prefer_server_ciphers off;
    
    client_body_timeout 60s;
    client_header_timeout 60s;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        
        proxy_buffering off;
        proxy_cache off;
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
    ssl_prefer_server_ciphers off;
    
    client_body_timeout 60s;
    client_header_timeout 60s;
    
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_buffering off;
        proxy_cache off;
    }
    
    location / {
        root /var/www/imperium/dist;
        try_files $uri $uri/ /index.html;
        
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
EOF

# Testar configuração
nginx -t

# Se OK, reiniciar
if [ $? -eq 0 ]; then
    systemctl start nginx
    echo "✅ NGINX configurado com SSL!"
    echo ""
    echo "Domínios configurados:"
    echo "- https://api.imperiumclub.asia"
    echo "- https://imperiumclub.asia"
    echo "- https://www.imperiumclub.asia"
else
    echo "❌ Erro na configuração. Restaurando backup..."
    cp /etc/nginx/sites-enabled/api.bak /etc/nginx/sites-enabled/api
    cp /etc/nginx/sites-enabled/imperium.bak /etc/nginx/sites-enabled/imperium
    systemctl start nginx
fi
