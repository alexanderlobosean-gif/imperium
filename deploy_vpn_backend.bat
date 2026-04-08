@echo off
chcp 65001 >nul
echo ==========================================
echo  DEPLOY BACKEND - IMPERIUM VPN
echo  IP: 69.169.101.230
echo ==========================================
echo.

echo [1/5] Fazendo backup do backend na VPN...
ssh root@69.169.101.230 "cd /opt/imperium/backend && tar -czf backup_$(date +%%Y%%m%%d_%%H%%M%%S).tar.gz . --exclude='node_modules' --exclude='*.tar.gz'" 2>nul
if %ERRORLEVEL% neq 0 (
  echo [AVISO] Nao foi possivel fazer backup, continuando...
)

echo [2/5] Parando PM2...
ssh root@69.169.101.230 "pm2 stop backend" 2>nul

echo [3/5] Atualizando codigo do Git...
ssh root@69.169.101.230 "cd /opt/imperium/backend && git pull origin develop"
if %ERRORLEVEL% neq 0 (
  echo [ERRO] Falha no git pull!
  exit /b 1
)

echo [4/5] Instalando dependencias...
ssh root@69.169.101.230 "cd /opt/imperium/backend && npm install"
if %ERRORLEVEL% neq 0 (
  echo [ERRO] Falha no npm install!
  exit /b 1
)

echo [5/5] Iniciando backend com PM2...
ssh root@69.169.101.230 "cd /opt/imperium/backend && pm2 restart backend --update-env || pm2 start server.js --name backend"
if %ERRORLEVEL% neq 0 (
  echo [ERRO] Falha ao iniciar backend!
  exit /b 1
)

echo.
echo ==========================================
echo  DEPLOY CONCLUIDO COM SUCESSO!
echo ==========================================
echo.
echo Verificando status:
ssh root@69.169.101.230 "pm2 status backend"

pause
