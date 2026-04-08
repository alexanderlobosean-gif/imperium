@echo off
REM Deploy do Backend para VPN via SCP
REM Execute no Windows: deploy_backend.bat

echo ==========================================
echo  DEPLOY BACKEND - IMPERIUM VPN
echo ==========================================
echo.
echo IP: 69.169.101.230
echo Destino: /var/www/imperium/backend
echo.
echo Certifique-se de que:
echo - O backend local esta atualizado (git pull)
echo - As dependencias estao instaladas (npm install)
echo - O arquivo .env.local esta configurado na VPN
echo.
pause

echo.
echo [1/4] Criando backup na VPN...
ssh root@69.169.101.230 "cp -r /var/www/imperium/backend /var/www/imperium/backend_backup_%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2% 2>nul || echo Sem backup anterior"

echo.
echo [2/4] Parando servico...
ssh root@69.169.101.230 "pm2 stop imperium-backend 2>nul || echo Servico parado"

echo.
echo [3/4] Enviando arquivos do backend...
REM Excluir node_modules, .git e logs
scp -r backend root@69.169.101.230:/var/www/imperium/

echo.
echo [4/4] Iniciando servico...
ssh root@69.169.101.230 "cd /var/www/imperium/backend && npm install && pm2 start server.js --name imperium-backend && pm2 save"

echo.
echo ==========================================
echo  DEPLOY CONCLUIDO!
echo ==========================================
echo.
echo Comandos uteis na VPN:
echo   pm2 logs imperium-backend
echo   pm2 status
echo   pm2 restart imperium-backend
echo.
pause
