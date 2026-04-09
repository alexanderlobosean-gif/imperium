require('dotenv').config({ path: '.env.local' });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');

const authRoutes = require('./routes/auth');
const financialRoutes = require('./routes/financial');
const networkRoutes = require('./routes/network');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3001;

//
// =============================
// SECURITY
// =============================
//

app.set('trust proxy', 1);

app.use(
  helmet({
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

//
// =============================
// CORS DEFINITIVO (ANTES DE TUDO)
// =============================
//

const allowedOrigins = [
  'https://imperiumclub.asia',
  'https://www.imperiumclub.asia',
  'https://api.imperiumclub.asia',
  'https://imperiumclub.vercel.app',
  'https://homolog.imperiumclub.vercel.app',
  'http://localhost:5173',
  'http://localhost:3001',
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.log('CORS BLOQUEADO:', origin);
    return callback(null, true); // liberar temporariamente
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// PRE-FLIGHT
app.options('*', cors(corsOptions));
// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Muitas requisições deste IP, tente novamente mais tarde.'
});
app.use(limiter);

//
// =============================
// BODY PARSER
// =============================
//

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//
// =============================
// SUPABASE
// =============================
//

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const supabaseAuth = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

app.use((req, res, next) => {
  req.supabase = supabase;
  req.supabaseAuth = supabaseAuth;
  next();
});

//
// =============================
// AUTH MIDDLEWARE
// =============================
//

const authenticateToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const { data: { user }, error } =
      await req.supabaseAuth.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno' });
  }
};

//
// =============================
// ROUTES
// =============================
//

// Rotas públicas
app.use('/api/auth', authRoutes);

// Rotas protegidas
app.use('/api/financial', authenticateToken, financialRoutes);
app.use('/api/network', authenticateToken, networkRoutes);
app.use('/api/admin', authenticateToken, adminRoutes);

//
// =============================
// HEALTH CHECK
// =============================
//

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

//
// =============================
// 404 HANDLER
// =============================
//

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

//
// =============================
// ERROR HANDLER
// =============================
//

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

//
// =============================
// START SERVER
// =============================
//

app.listen(PORT, () => {
  console.log(`🚀 API rodando na porta ${PORT}`);
});
