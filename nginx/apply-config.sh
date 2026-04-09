#!/bin/bash
# Execute na VPS para aplicar configuração HTTPS

echo "=== Aplicando configuração NGINX com HTTPS ==="

# 1. Instalar Certbot (se não tiver)
apt update && apt install -y certbot python3-certbot-nginx

# 2. Obter certificados SSL
certbot --nginx -d api.imperiumclub.asia -d imperiumclub.asia -d www.imperiumclub.asia --non-interactive --agree-tos --email admin@imperiumclub.asia

# 3. Configurar api.imperiumclub.asia
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
        
        proxy_buffering off;
    }
}
EOF

# 4. Configurar imperiumclub.asia
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
    }
    
    location / {
        root /var/www/imperium/dist;
        try_files $uri $uri/ /index.html;
    }
}
EOF

# 5. Testar e reiniciar
nginx -t && systemctl restart nginx

echo "✅ Configuração aplicada!"
