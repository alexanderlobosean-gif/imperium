// Mock Auth Service - Para testes sem rate limit
// Salve como: src/api/mockAuthService.js

const mockUsers = new Map();
const mockProfiles = new Map();

export const mockAuthService = {
  // Simular signUp sem rate limit
  async signUp(email, password, metadata = {}) {
    const userId = crypto.randomUUID();
    
    // Criar usuário mock
    const user = {
      id: userId,
      email: email,
      email_confirmed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      user_metadata: metadata
    };
    
    mockUsers.set(userId, user);
    
    // Criar perfil mock
    const referralCode = this.generateReferralCode();
    const profile = {
      id: crypto.randomUUID(),
      user_id: userId,
      email: email,
      full_name: metadata.full_name || email,
      referral_code: referralCode,
      referred_by: metadata.referred_by || null,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    mockProfiles.set(userId, profile);
    
    console.log('MockAuthService: Usuário criado:', user);
    console.log('MockAuthService: Perfil criado:', profile);
    
    return { data: { user }, error: null };
  },
  
  // Simular signIn
  async signIn(email, password) {
    for (const [userId, user] of mockUsers) {
      if (user.email === email) {
        console.log('MockAuthService: Login bem-sucedido:', user);
        return { data: { user }, error: null };
      }
    }
    
    return { data: null, error: { message: 'Usuário não encontrado' } };
  },
  
  // Gerar referral code
  generateReferralCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },
  
  // Obter perfil
  async getProfile(userId) {
    return mockProfiles.get(userId) || null;
  },
  
  // Listar todos os perfis
  async getAllProfiles() {
    return Array.from(mockProfiles.values());
  },
  
  // Limpar dados
  clear() {
    mockUsers.clear();
    mockProfiles.clear();
  }
};

// Para usar no Register.jsx:
// import { mockAuthService } from '@/api/mockAuthService';
// const { data, error } = await mockAuthService.signUp(...)
