# Deploy Backend para VPN - PowerShell Automatizado
# Execute: .\deploy_backend_auto.ps1

$ErrorActionPreference = "Stop"
$VPNServer = "root@69.169.101.230"
$RemotePath = "/var/www/imperium"
$BackupName = "backend_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "  DEPLOY AUTOMATICO BACKEND - IMPERIUM VPN" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

try {
    # 1. Compactar localmente (excluindo node_modules, .git, logs)
    Write-Host "[1/6] Compactando backend..." -ForegroundColor Yellow
    $exclude = @('node_modules', '.git', 'logs', '*.log', 'npm-debug.log*', 'yarn-debug.log*', 'yarn-error.log*')
    Compress-Archive -Path "backend\*" -DestinationPath "backend_deploy.zip" -Force
    
    # 2. Backup remoto
    Write-Host "[2/6] Criando backup na VPN..." -ForegroundColor Yellow
    ssh $VPNServer "cp -r $RemotePath/backend $RemotePath/$BackupName 2>/dev/null; echo 'Backup: $BackupName'"
    
    # 3. Parar serviço
    Write-Host "[3/6] Parando servico..." -ForegroundColor Yellow
    ssh $VPNServer "pm2 stop imperium-backend 2>/dev/null || echo 'Servico parado'"
    
    # 4. Enviar (um arquivo só = rapido)
    Write-Host "[4/6] Enviando para VPN..." -ForegroundColor Yellow
    scp backend_deploy.zip "${VPNServer}:${RemotePath}/"
    
    # 5. Descompactar e instalar
    Write-Host "[5/6] Instalando na VPN..." -ForegroundColor Yellow
    $installCmd = @"
cd $RemotePath && 
rm -rf backend && 
mkdir backend && 
unzip -q backend_deploy.zip -d backend && 
cd backend && 
npm install --production && 
pm2 start server.js --name imperium-backend && 
pm2 save && 
rm ../backend_deploy.zip &&
echo 'Deploy concluido'
"@
    ssh $VPNServer $installCmd
    
    # 6. Verificar status
    Write-Host "[6/6] Verificando status..." -ForegroundColor Yellow
    ssh $VPNServer "pm2 status imperium-backend"
    
    Write-Host ""
    Write-Host "==============================================" -ForegroundColor Green
    Write-Host "  DEPLOY CONCLUIDO COM SUCESSO!" -ForegroundColor Green
    Write-Host "==============================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Logs: ssh $VPNServer 'pm2 logs imperium-backend'" -ForegroundColor Gray
    Write-Host "Status: ssh $VPNServer 'pm2 status'" -ForegroundColor Gray
    
} catch {
    Write-Host "ERRO: $_" -ForegroundColor Red
    exit 1
} finally {
    # Limpar arquivo local
    Remove-Item "backend_deploy.zip" -ErrorAction SilentlyContinue
}
