# Local
npm run build
scp -r dist root@69.169.101.230:/var/www/imperium/

# Na VPN (se mudar backend)



cd /var/www/imperium && bash deploy_from_git.sh