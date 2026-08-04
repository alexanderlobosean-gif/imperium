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
  sponsor_email: Joi.string().email().optional(),
  referral_code: Joi.string().optional()
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

    const { email, password, full_name, sponsor_email, referral_code } = req.body;

    // Verificar se usuário já existe
    const { data: existingUser } = await req.supabase
      .from('profiles')
      .select('email')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    // Criar usuário no Supabase Auth usando ANON key (igual ao frontend)
    const { data: authData, error: authError } = await req.supabaseAuth.auth.signUp({
      email,
      password,
      options: {
        data: { full_name }
      }
    });

    if (authError) {
      console.error('❌ Erro no cadastro:', authError);
      return res.status(500).json({ 
        error: 'Erro ao criar conta',
        details: authError.message 
      });
    }

    if (!authData || !authData.user) {
      return res.status(400).json({ error: 'Erro ao criar usuário' });
    }

    const newUser = authData.user;

    // Aguardar um momento para o trigger (se existir)
    await new Promise(resolve => setTimeout(resolve, 300));

    // Verificar se perfil foi criado pelo trigger
    let { data: newProfile, error: profileError } = await req.supabase
      .from('profiles')
      .select('id, user_id, referral_code')
      .eq('user_id', newUser.id)
      .single();

    // Se não existe perfil, criar manualmente
    if (profileError || !newProfile) {
      console.log('⚠️ Perfil não encontrado, criando manualmente...');
      
      // Gerar referral_code único
      const generatedReferralCode = `IMP${newUser.id.substring(0, 8).toUpperCase()}`;
      
      const { data: createdProfile, error: createError } = await req.supabase
        .from('profiles')
        .insert({
          user_id: newUser.id,
          email: email,
          full_name: full_name,
          referral_code: generatedReferralCode,
          referral_cod: referral_code || null,  // Código do indicador do formulário
          referred_by: null,  // Será preenchido abaixo se tiver indicador
          status: 'active',
          role: 'user',
          available_balance: 0,
          total_earned: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Erro ao criar perfil manualmente:', createError);
      } else {
        newProfile = createdProfile;
        console.log('✅ Perfil criado manualmente:', newProfile);
      }
    }

      // Se tem perfil, atualizar com dados do indicador
      if (newProfile) {
        // Gerar referral_code se não tiver
        const userReferralCode = newProfile.referral_code || 
          `IMP${newUser.id.substring(0, 8).toUpperCase()}`;

        // Atualizar perfil com referral_cod e código próprio
        const updates = {
          referral_code: userReferralCode,
          updated_at: new Date().toISOString()
        };

        let resolvedReferrerId = null;

        // Se tem código de indicação no formulário, preencher referral_cod
        if (referral_code) {
          updates.referral_cod = referral_code;
          
          // Buscar o user_id do indicador pelo código
          const { data: referrer } = await req.supabase
            .from('profiles')
            .select('user_id')
            .eq('referral_code', referral_code)
            .single();
          
          if (referrer) {
            updates.referred_by = referrer.user_id;
            resolvedReferrerId = referrer.user_id;
            console.log('✅ Indicador encontrado:', referrer.user_id);
          }
        }

        const { error: updateError } = await req.supabase
          .from('profiles')
          .update(updates)
          .eq('id', newProfile.id);

        if (updateError) {
          console.error('❌ Erro ao atualizar perfil:', updateError);
        } else {
          console.log('✅ Perfil atualizado:', updates);
        }

        // Adicionar à rede (network_relations/user_network) se indicado por código
        if (resolvedReferrerId && resolvedReferrerId !== newUser.id) {
          const { error: networkError } = await req.supabase
            .rpc('add_to_network', {
              p_user_id: newUser.id,
              p_sponsor_id: resolvedReferrerId
            });

          if (networkError) {
            console.error('Erro ao adicionar à rede via código de indicação:', networkError);
          } else {
            console.log('✅ Rede atualizada via add_to_network:', resolvedReferrerId);
          }
        }
      }

    // Adicionar à rede se tiver sponsor
    if (sponsor_email) {
      const { data: sponsor } = await req.supabase
        .from('profiles')
        .select('user_id')
        .eq('email', sponsor_email)
        .single();

      if (sponsor) {
        const { error: networkError } = await req.supabase
          .rpc('add_to_network', {
            p_user_id: newUser.id,
            p_sponsor_id: sponsor.user_id
          });

        if (networkError) {
          console.error('Erro ao adicionar à rede:', networkError);
        }
      }
    }

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user: {
        id: newUser.id,
        email: newUser.email,
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

    // Fazer login no Supabase Auth usando ANON key
    const { data: authData, error: authError } = await req.supabaseAuth.auth.signInWithPassword({
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
    const { error } = await req.supabaseAuth.auth.signOut();

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

// @route   POST /api/auth/create-oauth-profile
// @desc    Criar perfil para usuário OAuth (Google SSO)
// @access  Private (requer token válido do Supabase)
router.post('/create-oauth-profile', async (req, res) => {
  try {
    const { user_id, email, full_name } = req.body;

    if (!user_id || !email) {
      return res.status(400).json({ error: 'user_id e email são obrigatórios' });
    }

    console.log('🔍 Criando perfil OAuth para:', email);

    // Verificar se perfil já existe
    const { data: existingProfile } = await req.supabase
      .from('profiles')
      .select('id, user_id, email')
      .eq('user_id', user_id)
      .single();

    if (existingProfile) {
      console.log('✅ Perfil já existe:', existingProfile);
      return res.json({ 
        success: true, 
        message: 'Perfil já existe',
        profile: existingProfile 
      });
    }

    // Criar perfil usando service role (bypass RLS)
    const { data: newProfile, error: createError } = await req.supabase
      .from('profiles')
      .insert({
        user_id,
        email,
        full_name: full_name || email.split('@')[0],
        role: 'user',
        status: 'active'
      })
      .select('id, user_id, email, full_name, role, referral_code')
      .single();

    if (createError) {
      // Se o perfil já existe (erro de duplicado), buscar e retornar
      if (createError.code === '23505') {
        console.log('⚠️ Perfil já existe (erro 23505), buscando...');
        const { data: existingProfile, error: fetchError } = await req.supabase
          .from('profiles')
          .select('id, user_id, email, full_name, role, referral_code')
          .eq('user_id', user_id)
          .single();
        
        if (fetchError) {
          console.error('❌ Erro ao buscar perfil existente:', fetchError);
          return res.status(500).json({ 
            error: 'Erro ao buscar perfil existente',
            details: fetchError.message 
          });
        }
        
        console.log('✅ Perfil existente retornado:', existingProfile);
        return res.json({ 
          success: true, 
          message: 'Perfil já existe',
          profile: existingProfile 
        });
      }
      
      console.error('❌ Erro ao criar perfil OAuth:', createError);
      return res.status(500).json({ 
        error: 'Erro ao criar perfil',
        details: createError.message 
      });
    }

    console.log('✅ Perfil OAuth criado com sucesso:', newProfile);

    res.json({ 
      success: true, 
      message: 'Perfil criado com sucesso',
      profile: newProfile 
    });

  } catch (error) {
    console.error('❌ Erro no endpoint create-oauth-profile:', error);
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
