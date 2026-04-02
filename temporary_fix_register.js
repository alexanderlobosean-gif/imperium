// Fix temporário para Register.jsx - Modo de teste
// Adicione isso ao handleSubmit em Register.jsx

// No início do handleSubmit, adicione:
const handleSubmit = async (e) => {
  e.preventDefault()
  
  if (!validateForm()) return
  
  setIsLoading(true)
  setError('')

  try {
    // MODO TESTE - Simular cadastro sem Supabase
    if (process.env.NODE_ENV === 'development') {
      console.log('MODO TESTE: Simulando cadastro...')
      
      // Simular criação de usuário
      const mockUser = {
        id: crypto.randomUUID(),
        email: formData.email,
        created_at: new Date().toISOString()
      }
      
      // Simular criação de perfil
      const mockProfile = {
        user_id: mockUser.id,
        email: formData.email,
        full_name: formData.fullName,
        referral_code: 'TEST' + Math.random().toString(36).substr(2, 6).toUpperCase(),
        referred_by: formData.referralCode ? 'MOCK_REFERRER_ID' : null,
        status: 'active'
      }
      
      console.log('MODO TESTE: Usuário mock criado:', mockUser)
      console.log('MODO TESTE: Perfil mock criado:', mockProfile)
      
      // Salvar no localStorage para testes
      localStorage.setItem('mockUser', JSON.stringify(mockUser))
      localStorage.setItem('mockProfile', JSON.stringify(mockProfile))
      
      // Mostrar sucesso
      toast.success('Cadastro simulado com sucesso! (Modo teste)')
      
      // Redirecionar para dashboard
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 2000)
      
      return
    }
    
    // Código original do Supabase (só em produção)
    const { data, error } = await authService.signUp(
      formData.email,
      formData.password,
      {
        full_name: formData.fullName,
        phone: formData.phone,
        document_number: formData.documentNumber,
        referral_code: formData.referralCode,
        skip_email_confirmation: true
      }
    )
    
    // ... resto do código original
    
  } catch (error) {
    console.error('Erro no cadastro:', error)
    setError(error.message)
  } finally {
    setIsLoading(false)
  }
}

// Adicione ao .env.local:
VITE_TEST_MODE=true
