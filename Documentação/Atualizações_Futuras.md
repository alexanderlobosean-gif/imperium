# Local
npm run build
scp -r dist root@69.169.101.230:/var/www/imperium/

# Na VPN (se mudar backend)
cd /var/www/imperium/backend && git pull && pm2 restart imperium-backend