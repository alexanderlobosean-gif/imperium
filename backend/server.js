require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');

// Ler SERVICE_ROLE_KEY diretamente do arquivo para evitar truncamento
let serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
try {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const match = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);
  if (match) {
    serviceRoleKey = match[1].trim();
    console.log('🔧 Lido diretamente do arquivo:', serviceRoleKey.length, 'caracteres');
  }
} catch (e) {
  console.log('⚠️ Não foi possível ler diretamente:', e.message);
}

// Debug: Verificar variáveis de ambiente
console.log('🔧 Environment Check:');
console.log('  SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Existe' : '❌ Não existe');
console.log('  SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? `✅ Existe (${process.env.SUPABASE_ANON_KEY.substring(0, 20)}...)` : '❌ Não existe');
console.log('  SUPABASE_SERVICE_ROLE_KEY:', serviceRoleKey ? `✅ Existe (${serviceRoleKey.length} chars)` : '❌ Não existe');

// Import routes
const authRoutes = require('./routes/auth');
const financialRoutes = require('./routes/financial');
const networkRoutes = require('./routes/network');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware de segurança
app.use(helmet());
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// Handle OPTIONS preflight
app.options('*', cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite de 100 requisições por windowMs
  message: 'Muitas requisições deste IP, tente novamente mais tarde.'
});
app.use(limiter);

// Middleware para parsing JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Supabase client (service role para operações financeiras administrativas)
console.log('🔧 Creating Supabase clients:');
console.log('  URL:', process.env.SUPABASE_URL);
console.log('  SERVICE_ROLE_KEY length:', serviceRoleKey?.length);

const supabase = createClient(
  process.env.SUPABASE_URL,
  serviceRoleKey  // Usar a chave lida diretamente do arquivo
);

// Supabase client (anon key para validar tokens de usuários)
const supabaseAuth = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Middleware para injetar supabase nas requisições
app.use((req, res, next) => {
  req.supabase = supabase;
  req.supabaseAuth = supabaseAuth;
  next();
});

// Teste direto do cliente service role
console.log('🧪 Testando cliente Supabase service role...');
supabase.from('profiles').select('count').limit(1).then(result => {
  if (result.error) {
    console.log('❌ Teste service role FALHADO:', result.error.message);
  } else {
    console.log('✅ Teste service role OK - cliente funcionando');
  }
}).catch(err => {
  console.log('❌ Teste service role ERROR:', err.message);
});

// Middleware de autenticação
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');
    
    console.log('🔐 Auth middleware:', { 
      hasAuthHeader: !!authHeader, 
      hasToken: !!token,
      tokenLength: token?.length,
      tokenPrefix: token?.substring(0, 20) + '...'
    });

    if (!token) {
      console.log('❌ Token não fornecido');
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    // Usar supabaseAuth (anon key) para validar token do usuário
    const { data: { user }, error } = await req.supabaseAuth.auth.getUser(token);
    
    if (error) {
      console.log('❌ Erro ao validar token:', error.message);
      return res.status(401).json({ error: 'Token inválido: ' + error.message });
    }

    if (!user) {
      console.log('❌ Usuário não encontrado no token');
      return res.status(401).json({ error: 'Token inválido' });
    }

    console.log('✅ Usuário autenticado:', user.email);
    req.user = user;
    next();
  } catch (error) {
    console.error('❌ Erro na autenticação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Rotas públicas
app.use('/api/auth', authRoutes);

// Rotas protegidas
app.use('/api/financial', authenticateToken, financialRoutes);
app.use('/api/network', authenticateToken, networkRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Erro não tratado:', error);
  res.status(500).json({
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend API rodando na porta ${PORT}`);
  console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
});
