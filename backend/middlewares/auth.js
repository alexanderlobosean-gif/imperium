const jwt = require('jsonwebtoken');

// Middleware para verificar se é admin (futuro uso)
const requireAdmin = async (req, res, next) => {
  try {
    // Verificar se usuário tem role de admin no perfil
    const { data: profile, error } = await req.supabase
      .from('profiles')
      .select('role')
      .eq('user_id', req.user.id)
      .single();

    if (error || profile?.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
    }

    next();
  } catch (error) {
    console.error('Erro no middleware requireAdmin:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Middleware para logging de requisições
const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
  });

  next();
};

// Middleware para validação de entrada financeira
const validateFinancialInput = (req, res, next) => {
  const { amount } = req.body;

  if (amount !== undefined) {
    const numAmount = parseFloat(amount);

    if (isNaN(numAmount) || numAmount <= 0 || numAmount > 1000000) {
      return res.status(400).json({
        error: 'Valor inválido. Deve ser um número positivo até R$ 1.000.000,00'
      });
    }

    // Adicionar valor formatado ao req para uso posterior
    req.body.amount = numAmount;
  }

  next();
};

// Middleware para verificar se usuário está ativo
const requireActiveUser = async (req, res, next) => {
  try {
    const { data: profile, error } = await req.supabase
      .from('profiles')
      .select('status')
      .eq('user_id', req.user.id)
      .single();

    if (error || profile?.status !== 'active') {
      return res.status(403).json({ error: 'Conta inativa ou suspensa' });
    }

    next();
  } catch (error) {
    console.error('Erro no middleware requireActiveUser:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

module.exports = {
  requireAdmin,
  requestLogger,
  validateFinancialInput,
  requireActiveUser
};
