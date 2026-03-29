# LIMPAR CACHE DO NAVEGADOR

## Passos para limpar o cache e testar o login:

### 1. Limpar cache do navegador
- Pressione **F12** para abrir o DevTools
- Vá para a aba **Application**
- Clique com o botão direito em **Storage**
- Selecione **Clear storage** ou **Clear site data**
- Recarregue a página com **Ctrl+R**

### 2. Limpar localStorage manualmente
```javascript
// No console do navegador:
localStorage.clear()
sessionStorage.clear()
location.reload()
```

### 3. Verificar se o loop parou
- Abra: http://localhost:5173
- Faça login
- Verifique no console se aparece apenas um "Auth state changed: SIGNED_IN"
- Deve redirecionar para dashboard sem loop

### 4. Se ainda persistir o loop
- Feche todas as abas do navegador
- Abra em aba anônima (Ctrl+Shift+N)
- Teste novamente

## Status esperado após correções:
✅ Apenas uma instância do Supabase client
✅ Sem "Multiple GoTrueClient instances"
✅ Login funciona sem loop infinito
✅ Redirecionamento correto para dashboard
