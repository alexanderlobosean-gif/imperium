const express = require('express');
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const router = express.Router();

// Validações
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  full_name: Joi.string().min(2).max(100).required(),
  sponsor_email: Joi.string().email().optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// @route   POST /api/auth/register
// @desc    Registrar novo usuário
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { error } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { email, password, full_name, sponsor_email } = req.body;

    // Verificar se usuário já existe
    const { data: existingUser } = await req.supabase
      .from('profiles')
      .select('email')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    // Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await req.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name
        }
      }
    });

    if (authError) {
      console.error('Erro no cadastro:', authError);
      return res.status(500).json({ error: 'Erro ao criar conta' });
    }

    if (!authData.user) {
      return res.status(400).json({ error: 'Erro ao criar usuário' });
    }

    // Criar perfil
    const { error: profileError } = await req.supabase
      .from('profiles')
      .insert({
        user_id: authData.user.id,
        email,
        full_name,
        sponsor_email
      });

    if (profileError) {
      console.error('Erro ao criar perfil:', profileError);
      // Tentar deletar usuário do auth se perfil falhar
      await req.supabase.auth.admin.deleteUser(authData.user.id);
      return res.status(500).json({ error: 'Erro ao criar perfil' });
    }

    // Se tem sponsor, adicionar à rede
    if (sponsor_email) {
      const { data: sponsor } = await req.supabase
        .from('profiles')
        .select('user_id')
        .eq('email', sponsor_email)
        .single();

      if (sponsor) {
        const { error: networkError } = await req.supabase
          .rpc('add_to_network', {
            p_user_id: authData.user.id,
            p_sponsor_id: sponsor.user_id
          });

        if (networkError) {
          console.error('Erro ao adicionar à rede:', networkError);
          // Não falhar o cadastro por causa disso
        }
      }
    }

    // Inicializar saldos
    const { error: balanceError } = await req.supabase
      .rpc('update_wallet_balance', {
        p_user_id: authData.user.id,
        p_wallet_delta: 0,
        p_yield_delta: 0,
        p_bonus_delta: 0,
        p_locked_delta: 0
      });

    if (balanceError) {
      console.error('Erro ao inicializar saldos:', balanceError);
    }

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        full_name
      }
    });

  } catch (error) {
    console.error('Erro no endpoint register:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// @route   POST /api/auth/login
// @desc    Fazer login
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { error } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { email, password } = req.body;

    // Fazer login no Supabase Auth
    const { data: authData, error: authError } = await req.supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      console.error('Erro no login:', authError);
      return res.status(401).json({ error: 'Email ou senha incorretos' });
    }

    if (!authData.user || !authData.session) {
      return res.status(401).json({ error: 'Erro na autenticação' });
    }

    res.json({
      message: 'Login realizado com sucesso',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        full_name: authData.user.user_metadata?.full_name
      },
      session: {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        expires_at: authData.session.expires_at
      }
    });

  } catch (error) {
    console.error('Erro no endpoint login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// @route   POST /api/auth/logout
// @desc    Fazer logout
// @access  Private
router.post('/logout', async (req, res) => {
  try {
    const { error } = await req.supabase.auth.signOut();

    if (error) {
      console.error('Erro no logout:', error);
      return res.status(500).json({ error: 'Erro ao fazer logout' });
    }

    res.json({ message: 'Logout realizado com sucesso' });

  } catch (error) {
    console.error('Erro no endpoint logout:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// @route   GET /api/auth/me
// @desc    Buscar dados do usuário logado
// @access  Private
router.get('/me', async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: profile, error: profileError } = await req.supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError) {
      console.error('Erro ao buscar perfil:', profileError);
      return res.status(500).json({ error: 'Erro ao buscar dados do usuário' });
    }

    res.json({
      user: {
        id: profile.user_id,
        email: profile.email,
        full_name: profile.full_name,
        sponsor_email: profile.sponsor_email,
        created_at: profile.created_at
      }
    });

  } catch (error) {
    console.error('Erro no endpoint me:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
