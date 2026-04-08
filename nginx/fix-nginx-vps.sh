#!/bin/bash
# Execute na VPS para corrigir NGINX

echo "Atualizando configuração NGINX..."

# Backup
sudo cp /etc/nginx/sites-enabled/default /etc/nginx/sites-enabled/default.bak.$(date +%s)

# Criar nova configuração
sudo tee /etc/nginx/sites-enabled/imperium << 'EOF'
server {
    listen 80;
    server_name imperiumclub.asia www.imperiumclub.asia _;
    
    # Aumentar timeouts
    client_body_timeout 60s;
    client_header_timeout 60s;
    
    # Proxy para backend com timeouts aumentados
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        
        # TIMEOUTS AUMENTADOS (corrigem demora no login)
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Desativar buffering para respostas em tempo real
        proxy_buffering off;
        proxy_cache off;
    }
    
    # Frontend
    location / {
        root /var/www/imperium/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache assets estáticos
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
EOF

# Testar configuração
sudo nginx -t

# Se OK, recarregar
if [ $? -eq 0 ]; then
    sudo systemctl reload nginx
    echo "✅ NGINX recarregado com sucesso!"
else
    echo "❌ Erro na configuração. Verifique:"
    sudo nginx -t
fi
