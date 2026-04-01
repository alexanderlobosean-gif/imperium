const express = require('express');
const Joi = require('joi');
const router = express.Router();

// Validações
const referralSchema = Joi.object({
  email: Joi.string().email().required(),
  full_name: Joi.string().min(2).max(100).required()
});

// @route   GET /api/network/downline
// @desc    Buscar rede de indicações
// @access  Private
router.get('/downline', async (req, res) => {
  try {
    const userId = req.user.id;
    const { level = 20 } = req.query;

    const { data: network, error: networkError } = await req.supabase
      .rpc('get_network_downline', {
        p_user_id: userId,
        p_max_level: parseInt(level)
      });

    if (networkError) {
      console.error('Erro ao buscar rede:', networkError);
      return res.status(500).json({ error: 'Erro ao buscar rede' });
    }

    // Buscar informações dos usuários na rede
    const userIds = network.map(n => n.user_id);
    let users = [];

    if (userIds.length > 0) {
      const { data: profiles, error: profilesError } = await req.supabase
        .from('profiles')
        .select('user_id, full_name, email, created_at')
        .in('user_id', userIds);

      if (profilesError) {
        console.error('Erro ao buscar perfis:', profilesError);
      } else {
        users = profiles || [];
      }
    }

    // Combinar dados
    const networkWithProfiles = network.map(n => {
      const profile = users.find(u => u.user_id === n.user_id);
      return {
        user_id: n.user_id,
        level: n.level,
        full_name: profile?.full_name || 'N/A',
        email: profile?.email || 'N/A',
        created_at: profile?.created_at
      };
    });

    res.json({
      network: networkWithProfiles,
      total_members: networkWithProfiles.length
    });

  } catch (error) {
    console.error('Erro no endpoint downline:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// @route   GET /api/network/stats
// @desc    Estatísticas da rede
// @access  Private
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.id;

    // Contar membros por nível
    const { data: levelStats, error: levelError } = await req.supabase
      .rpc('get_network_stats', { p_user_id: userId });

    if (levelError) {
      console.error('Erro ao buscar estatísticas:', levelError);
      return res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }

    // Calcular comissões totais
    const { data: commissionTotal, error: commissionError } = await req.supabase
      .from('financial_ledger')
      .select('amount')
      .eq('user_id', userId)
      .eq('type', 'commission');

    let totalCommissions = 0;
    if (!commissionError && commissionTotal) {
      totalCommissions = commissionTotal.reduce((sum, c) => sum + parseFloat(c.amount), 0);
    }

    res.json({
      level_stats: levelStats || [],
      total_commissions: totalCommissions,
      total_members: levelStats?.reduce((sum, level) => sum + parseInt(level.count), 0) || 0
    });

  } catch (error) {
    console.error('Erro no endpoint stats:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// @route   POST /api/network/referral
// @desc    Indicar novo membro
// @access  Private
router.post('/referral', async (req, res) => {
  try {
    const { error } = referralSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { email, full_name } = req.body;
    const sponsorId = req.user.id;

    // Verificar se email já existe
    const { data: existingUser } = await req.supabase
      .from('profiles')
      .select('user_id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    // Gerar senha temporária
    const tempPassword = Math.random().toString(36).slice(-12);

    // Criar usuário
    const { data: authData, error: authError } = await req.supabase.auth.signUp({
      email,
      password: tempPassword,
      options: {
        data: {
          full_name,
          sponsor_email: req.user.email
        }
      }
    });

    if (authError) {
      console.error('Erro ao criar usuário indicado:', authError);
      return res.status(500).json({ error: 'Erro ao criar usuário' });
    }

    // Criar perfil
    const { error: profileError } = await req.supabase
      .from('profiles')
      .insert({
        user_id: authData.user.id,
        email,
        full_name,
        sponsor_email: req.user.email
      });

    if (profileError) {
      console.error('Erro ao criar perfil:', profileError);
      await req.supabase.auth.admin.deleteUser(authData.user.id);
      return res.status(500).json({ error: 'Erro ao criar perfil' });
    }

    // Adicionar à rede
    const { error: networkError } = await req.supabase
      .rpc('add_to_network', {
        p_user_id: authData.user.id,
        p_sponsor_id: sponsorId
      });

    if (networkError) {
      console.error('Erro ao adicionar à rede:', networkError);
      // Não falhar por causa disso
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
      message: 'Usuário indicado com sucesso',
      referral: {
        user_id: authData.user.id,
        email,
        full_name,
        temp_password: tempPassword // Em produção, enviar por email
      }
    });

  } catch (error) {
    console.error('Erro no endpoint referral:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
