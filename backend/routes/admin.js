const express = require('express');
const Joi = require('joi');
const router = express.Router();

// Middleware to check admin role
const requireAdmin = async (req, res, next) => {
  try {
    const { data: profile, error } = await req.supabase
      .from('profiles')
      .select('role')
      .eq('user_id', req.user.id)
      .single();

    if (error || !profile) {
      return res.status(403).json({ error: 'Perfil não encontrado' });
    }

    if (profile.role !== 'admin' && profile.role !== 'super_admin') {
      return res.status(403). json({ error: 'Acesso negado. Somente administradores.' });
    }

    next();
  } catch (error) {
    console.error('Erro no middleware requireAdmin:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// ==================== USERS ====================

// @route   GET /api/admin/users
// @desc    Listar todos os usuários (incluindo não confirmados)
// @access  Admin
router.get('/users', requireAdmin, async (req, res) => {
  try {
    // Buscar de auth.users via service role
    const { data: authUsers, error: authError } = await req.supabase.auth.admin.listUsers();

    if (authError) throw authError;

    // Buscar perfis
    const { data: profiles, error: profilesError } = await req.supabase
      .from('profiles')
      .select('*');

    if (profilesError) throw profilesError;

    // Criar mapa de perfis
    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

    // Mesclar dados
    const mergedUsers = authUsers?.users?.map(authUser => {
      const profile = profileMap.get(authUser.id);
      return {
        id: authUser.id,
        user_id: authUser.id,
        email: authUser.email,
        full_name: profile?.full_name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0],
        phone: profile?.phone || '',
        document_number: profile?.document_number || '',
        status: profile?.status || (authUser.email_confirmed_at ? 'active' : 'pending'),
        role: profile?.role || 'user',
        referral_code: profile?.referral_code || '',
        referred_by: profile?.referred_by || '',
        available_balance: profile?.available_balance || 0,
        total_earned: profile?.total_earned || 0,
        created_at: authUser.created_at || profile?.created_at,
        email_confirmed_at: authUser.email_confirmed_at,
        email_verified: !!authUser.email_confirmed_at
      };
    }) || [];

    res.json({ users: mergedUsers.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ error: 'Erro ao listar usuários' });
  }
});

// @route   PUT /api/admin/users/:id
// @desc    Atualizar usuário
// @access  Admin
router.put('/users/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, phone, document_number, status, role, referral_cod, referred_by } = req.body;

    console.log('📝 Dados recebidos para atualizar usuário:', {
      id,
      full_name,
      email,
      referral_cod,
      referred_by,
      allFields: req.body
    });

    // Verificar se perfil existe
    const { data: existingProfile, error: checkError } = await req.supabase
      .from('profiles')
      .select('user_id')
      .eq('user_id', id)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    let result;

    if (existingProfile) {
      // Atualizar perfil existente
      const { data, error } = await req.supabase
        .from('profiles')
        .update({
          full_name,
          email,
          phone,
          document_number,
          status,
          role,
          referral_cod: referral_cod || null,  // Código do indicador (pode ser duplicado)
          referred_by: referred_by || null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Criar novo perfil
      const { data, error } = await req.supabase
        .from('profiles')
        .insert({
          user_id: id,
          full_name: full_name || email?.split('@')[0] || 'Usuário',
          email,
          phone: phone || '',
          document_number: document_number || '',
          status: status || 'active',
          role: role || 'user',
          referral_cod: referral_cod || null,  // Código do indicador
          referred_by: referred_by || null,
          available_balance: 0,
          total_earned: 0,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    res.json({ message: 'Usuário atualizado', user: result });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ error: 'Erro ao atualizar usuário: ' + (error.message || 'Erro desconhecido') });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Desativar usuário
// @access  Admin
router.delete('/users/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await req.supabase
      .from('profiles')
      .update({ status: 'inactive', updated_at: new Date().toISOString() })
      .eq('user_id', id);

    if (error) throw error;

    res.json({ message: 'Usuário desativado' });
  } catch (error) {
    console.error('Erro ao desativar usuário:', error);
    res.status(500).json({ error: 'Erro ao desativar usuário' });
  }
});

// ==================== DEPOSITS ====================

// @route   GET /api/admin/deposits
// @desc    Listar todos os depósitos
// @access  Admin
router.get('/deposits', requireAdmin, async (req, res) => {
  try {
    // Buscar depósitos
    const { data: deposits, error: depositsError } = await req.supabase
      .from('deposits')
      .select('*')
      .order('created_at', { ascending: false });

    if (depositsError) throw depositsError;

    // Buscar perfis dos usuários separadamente
    const userIds = deposits?.map(d => d.user_id).filter(Boolean) || [];
    let profilesMap = new Map();
    
    if (userIds.length > 0) {
      const { data: profiles, error: profilesError } = await req.supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', [...new Set(userIds)]);
      
      if (!profilesError && profiles) {
        profilesMap = new Map(profiles.map(p => [p.user_id, p]));
      }
    }

    // Combinar dados
    const depositsWithUsers = deposits?.map(d => ({
      ...d,
      profiles: profilesMap.get(d.user_id) || null
    })) || [];

    res.json({ deposits: depositsWithUsers });
  } catch (error) {
    console.error('Erro ao listar depósitos:', error);
    res.status(500).json({ error: 'Erro ao listar depósitos' });
  }
});

// @route   PUT /api/admin/deposits/:id
// @desc    Atualizar status do depósito
// @access  Admin
router.put('/deposits/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body;

    console.log('🔍 ========== ATUALIZANDO DEPÓSITO ==========');
    console.log('ID:', id);
    console.log('Status recebido:', status);
    console.log('Admin notes:', admin_notes);
    console.log('Tipo do status:', typeof status);
    console.log('Status === confirmed?:', status === 'confirmed');
    console.log('===========================================');

    const { data: deposit, error } = await req.supabase
      .from('deposits')
      .update({
        status,
        admin_notes,
        confirmed_at: status === 'confirmed' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao atualizar depósito:', error);
      console.error('Detalhes:', JSON.stringify(error, null, 2));
      return res.status(500).json({ 
        error: 'Erro ao atualizar depósito', 
        details: error.message,
        code: error.code 
      });
    }

    console.log('✅ Depósito atualizado:', deposit?.id, 'novo status:', deposit?.status);

    // Se aprovado, creditar na carteira
    if (status === 'confirmed') {
      const depositAmount = parseFloat(deposit.amount);
      console.log('💰 ========== CREDITANDO CARTEIRA ==========');
      console.log('User ID:', deposit.user_id);
      console.log('Deposit ID:', deposit.id);
      console.log('Amount:', depositAmount);
      console.log('Original amount type:', typeof deposit.amount);
      console.log('Parsed amount type:', typeof depositAmount);
      
      try {
        console.log('🔍 Buscando saldo atual...');
        const { data: balance, error: balanceError } = await req.supabase
          .from('wallet_balances')
          .select('*')
          .eq('user_id', deposit.user_id)
          .single();

        if (balanceError) {
          console.log('⚠️ Erro ao buscar saldo:', balanceError.message, '| Código:', balanceError.code);
          console.log('⚠️ Provavelmente não existe registro, criando novo...');
        } else {
          console.log('✅ Saldo encontrado:', balance);
        }

        const currentBalance = parseFloat(balance?.wallet_balance || 0);
        const newBalance = currentBalance + depositAmount;
        
        console.log('💰 Cálculo:');
        console.log('  - Saldo atual:', currentBalance);
        console.log('  - Valor depósito:', depositAmount);
        console.log('  - Novo saldo:', newBalance);

        console.log('📝 Executando UPDATE na wallet_balances...');
        const updateData = {
          wallet_balance: newBalance,
          updated_at: new Date().toISOString()
        };
        console.log('  - Dados do update:', updateData);

        const { data: updateResult, error: updateError } = await req.supabase
          .from('wallet_balances')
          .update(updateData)
          .eq('user_id', deposit.user_id)
          .select();

        if (updateError) {
          console.error('❌ ERRO no update:', updateError);
          console.error('  - Mensagem:', updateError.message);
          console.error('  - Código:', updateError.code);
          console.error('  - Detalhes:', updateError.details);
        } else if (!updateResult || updateResult.length === 0) {
          console.log('⚠️ UPDATE não retornou linhas - registro não existe, criando novo...');
          
          const { data: insertResult, error: insertError } = await req.supabase
            .from('wallet_balances')
            .insert({
              user_id: deposit.user_id,
              wallet_balance: newBalance,
              yield_balance: 0,
              bonus_balance: 0,
              locked_balance: 0,
              updated_at: new Date().toISOString()
            })
            .select();
          
          if (insertError) {
            console.error('❌ ERRO no insert:', insertError);
          } else {
            console.log('✅ INSERT executado! Novo saldo criado:', insertResult);
          }
        } else {
          console.log('✅ UPDATE executado!');
          console.log('  - Resultado:', updateResult);
        }
        
        console.log('💰 ========== FIM CREDITO ==========');
      } catch (walletErr) {
        console.error('❌ ERRO GERAL ao processar carteira:', walletErr);
        console.error('  - Stack:', walletErr.stack);
      }
    }

    res.json({ message: 'Depósito atualizado', deposit });
  } catch (error) {
    console.error('❌ Erro no endpoint deposits PUT:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      error: 'Erro ao atualizar depósito',
      details: error.message 
    });
  }
});

// ==================== WITHDRAWALS ====================

// @route   GET /api/admin/withdrawals
// @desc    Listar todos os saques
// @access  Admin
router.get('/withdrawals', requireAdmin, async (req, res) => {
  try {
    // Buscar saques
    const { data: withdrawals, error: withdrawalsError } = await req.supabase
      .from('withdrawals')
      .select('*')
      .order('created_at', { ascending: false });

    if (withdrawalsError) throw withdrawalsError;

    // Buscar perfis dos usuários separadamente
    const userIds = withdrawals?.map(w => w.user_id).filter(Boolean) || [];
    let profilesMap = new Map();
    
    if (userIds.length > 0) {
      const { data: profiles, error: profilesError } = await req.supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', [...new Set(userIds)]);
      
      if (!profilesError && profiles) {
        profilesMap = new Map(profiles.map(p => [p.user_id, p]));
      }
    }

    // Combinar dados
    const withdrawalsWithUsers = withdrawals?.map(w => ({
      ...w,
      users: profilesMap.get(w.user_id) || null
    })) || [];

    res.json({ withdrawals: withdrawalsWithUsers });
  } catch (error) {
    console.error('Erro ao listar saques:', error);
    res.status(500).json({ error: 'Erro ao listar saques' });
  }
});

// @route   PUT /api/admin/withdrawals/:id
// @desc    Aprovar/Rejeitar saque
// @access  Admin
router.put('/withdrawals/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_notes } = req.body;

    // Buscar saque
    const { data: withdrawal, error: findError } = await req.supabase
      .from('withdrawals')
      .select('*')
      .eq('id', id)
      .single();

    if (findError || !withdrawal) {
      return res.status(404).json({ error: 'Saque não encontrado' });
    }

    if (status === 'approved') {
      // Verificar saldo
      const { data: balance } = await req.supabase
        .from('wallet_balances')
        .select('wallet_balance, yield_balance, bonus_balance')
        .eq('user_id', withdrawal.user_id)
        .single();

      const availableBalance = 
        (balance?.wallet_balance || 0) + 
        (balance?.yield_balance || 0) + 
        (balance?.bonus_balance || 0);

      if (availableBalance < withdrawal.amount) {
        return res.status(400).json({ error: 'Saldo insuficiente do usuário' });
      }

      // Deduzir saldo
      let remaining = withdrawal.amount;
      let newWallet = balance?.wallet_balance || 0;
      let newYield = balance?.yield_balance || 0;
      let newBonus = balance?.bonus_balance || 0;

      if (newWallet >= remaining) {
        newWallet -= remaining;
        remaining = 0;
      } else {
        remaining -= newWallet;
        newWallet = 0;
        if (newYield >= remaining) {
          newYield -= remaining;
          remaining = 0;
        } else {
          remaining -= newYield;
          newYield = 0;
          newBonus -= remaining;
        }
      }

      await req.supabase
        .from('wallet_balances')
        .update({
          wallet_balance: newWallet,
          yield_balance: newYield,
          bonus_balance: newBonus,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', withdrawal.user_id);
    }

    const { data, error } = await req.supabase
      .from('withdrawals')
      .update({
        status,
        admin_notes,
        confirmed_at: status === 'approved' ? new Date().toISOString() : null
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ message: 'Saque atualizado', withdrawal: data });
  } catch (error) {
    console.error('Erro ao atualizar saque:', error);
    res.status(500).json({ error: 'Erro ao atualizar saque' });
  }
});

// ==================== INVESTMENTS/YIELDS ====================

// @route   GET /api/admin/investments
// @desc    Listar todos os investimentos
// @access  Admin
router.get('/investments', requireAdmin, async (req, res) => {
  try {
    // Buscar investimentos
    const { data: investments, error: investmentsError } = await req.supabase
      .from('investments')
      .select('*')
      .order('created_at', { ascending: false });

    if (investmentsError) throw investmentsError;

    // Buscar perfis dos usuários separadamente
    const userIds = investments?.map(inv => inv.user_id).filter(Boolean) || [];
    let profilesMap = new Map();
    
    if (userIds.length > 0) {
      const { data: profiles, error: profilesError } = await req.supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', [...new Set(userIds)]);
      
      if (!profilesError && profiles) {
        profilesMap = new Map(profiles.map(p => [p.user_id, p]));
      }
    }

    // Combinar dados
    const investmentsWithUsers = investments?.map(inv => ({
      ...inv,
      profiles: profilesMap.get(inv.user_id) || null
    })) || [];

    res.json({ investments: investmentsWithUsers });
  } catch (error) {
    console.error('Erro ao listar investimentos:', error);
    res.status(500).json({ error: 'Erro ao listar investimentos' });
  }
});

// @route   GET /api/admin/yields
// @desc    Listar todos os rendimentos
// @access  Admin
router.get('/yields', requireAdmin, async (req, res) => {
  try {
    // Buscar rendimentos
    const { data: yields, error: yieldsError } = await req.supabase
      .from('yields')
      .select('*')
      .order('date', { ascending: false });

    if (yieldsError) throw yieldsError;

    // Buscar investimentos ativos
    const { data: investments, error: investmentsError } = await req.supabase
      .from('investments')
      .select('*')
      .eq('status', 'active');

    if (investmentsError) throw investmentsError;

    // Buscar perfis dos usuários
    const userIds = yields?.map(y => y.user_id).filter(Boolean) || [];
    let profilesMap = new Map();
    
    if (userIds.length > 0) {
      const { data: profiles, error: profilesError } = await req.supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', [...new Set(userIds)]);
      
      if (!profilesError && profiles) {
        profilesMap = new Map(profiles.map(p => [p.user_id, p]));
      }
    }

    const stats = {
      totalYields: yields?.reduce((sum, y) => sum + parseFloat(y.amount || 0), 0) || 0,
      totalClientYields: yields?.reduce((sum, y) => sum + parseFloat(y.client_yield || 0), 0) || 0,
      totalCompanyYields: yields?.reduce((sum, y) => sum + parseFloat(y.company_yield || 0), 0) || 0,
      todayYields: yields
        ?.filter(y => y.date >= new Date().toISOString().split('T')[0])
        .reduce((sum, y) => sum + parseFloat(y.amount || 0), 0) || 0,
      activeInvestments: investments?.length || 0
    };

    // Combinar yields com perfis
    const yieldsWithUsers = yields?.map(y => ({
      ...y,
      profiles: profilesMap.get(y.user_id) || null
    })) || [];

    res.json({ yields: yieldsWithUsers, investments, stats });
  } catch (error) {
    console.error('Erro ao listar rendimentos:', error);
    res.status(500).json({ error: 'Erro ao listar rendimentos' });
  }
});

// @route   POST /api/admin/yields/apply
// @desc    Aplicar rendimento diário
// @access  Admin
router.post('/yields/apply', requireAdmin, async (req, res) => {
  try {
    const { rate } = req.body;

    const { data: investments, error } = await req.supabase
      .from('investments')
      .select('*')
      .eq('status', 'active');

    if (error) throw error;

    const results = [];
    const today = new Date().toISOString();

    for (const investment of investments || []) {
      const dailyYield = parseFloat(investment.amount) * parseFloat(rate);
      const clientYield = dailyYield * (investment.client_share / 100);
      const companyYield = dailyYield * (investment.company_share / 100);

      // Criar registro de rendimento
      const { data: yieldRecord } = await req.supabase
        .from('yields')
        .insert({
          investment_id: investment.id,
          user_id: investment.user_id,
          amount: dailyYield,
          rate: parseFloat(rate),
          client_yield: clientYield,
          company_yield: companyYield,
          date: today
        })
        .select()
        .single();

      // Atualizar investimento
      await req.supabase
        .from('investments')
        .update({
          daily_yield: dailyYield,
          total_yield: (parseFloat(investment.total_yield || 0) + dailyYield),
          last_yield_calculated: today
        })
        .eq('id', investment.id);

      // Atualizar saldo do usuário
      const { data: profile } = await req.supabase
        .from('profiles')
        .select('total_earned')
        .eq('user_id', investment.user_id)
        .single();

      await req.supabase
        .from('profiles')
        .update({
          total_earned: (parseFloat(profile?.total_earned || 0) + clientYield),
          updated_at: today
        })
        .eq('user_id', investment.user_id);

      results.push(yieldRecord);
    }

    res.json({ message: `Rendimento aplicado para ${results.length} investimentos`, results });
  } catch (error) {
    console.error('Erro ao aplicar rendimento:', error);
    res.status(500).json({ error: 'Erro ao aplicar rendimento' });
  }
});

// ==================== PLANS ====================

// @route   GET /api/admin/plans
// @desc    Listar todos os planos
// @access  Admin
router.get('/plans', requireAdmin, async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('plans')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;

    res.json({ plans: data });
  } catch (error) {
    console.error('Erro ao listar planos:', error);
    res.status(500).json({ error: 'Erro ao listar planos' });
  }
});

// @route   POST /api/admin/plans
// @desc    Criar plano
// @access  Admin
router.post('/plans', requireAdmin, async (req, res) => {
  try {
    const planData = req.body;

    const { data, error } = await req.supabase
      .from('plans')
      .insert({
        ...planData,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ message: 'Plano criado', plan: data });
  } catch (error) {
    console.error('Erro ao criar plano:', error);
    res.status(500).json({ error: 'Erro ao criar plano' });
  }
});

// @route   PUT /api/admin/plans/:id
// @desc    Atualizar plano
// @access  Admin
router.put('/plans/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const planData = req.body;

    const { data, error } = await req.supabase
      .from('plans')
      .update({
        ...planData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ message: 'Plano atualizado', plan: data });
  } catch (error) {
    console.error('Erro ao atualizar plano:', error);
    res.status(500).json({ error: 'Erro ao atualizar plano' });
  }
});

// @route   DELETE /api/admin/plans/:id
// @desc    Desativar plano
// @access  Admin
router.delete('/plans/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await req.supabase
      .from('plans')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Plano desativado' });
  } catch (error) {
    console.error('Erro ao desativar plano:', error);
    res.status(500).json({ error: 'Erro ao desativar plano' });
  }
});

// ==================== BANKING ACCOUNTS ====================

// @route   GET /api/admin/banking
// @desc    Listar contas bancárias
// @access  Admin
router.get('/banking', requireAdmin, async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from('admin_banking_accounts')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ accounts: data });
  } catch (error) {
    console.error('Erro ao listar contas bancárias:', error);
    res.status(500).json({ error: 'Erro ao listar contas bancárias' });
  }
});

// @route   POST /api/admin/banking
// @desc    Criar conta bancária
// @access  Admin
router.post('/banking', requireAdmin, async (req, res) => {
  try {
    const accountData = req.body;

    const { data, error } = await req.supabase
      .from('admin_banking_accounts')
      .insert({
        ...accountData,
        is_active: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ message: 'Conta bancária criada', account: data });
  } catch (error) {
    console.error('Erro ao criar conta bancária:', error);
    res.status(500).json({ error: 'Erro ao criar conta bancária' });
  }
});

// @route   PUT /api/admin/banking/:id
// @desc    Atualizar conta bancária
// @access  Admin
router.put('/banking/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const accountData = req.body;

    const { data, error } = await req.supabase
      .from('admin_banking_accounts')
      .update({
        ...accountData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ message: 'Conta bancária atualizada', account: data });
  } catch (error) {
    console.error('Erro ao atualizar conta bancária:', error);
    res.status(500).json({ error: 'Erro ao atualizar conta bancária' });
  }
});

// @route   DELETE /api/admin/banking/:id
// @desc    Desativar conta bancária
// @access  Admin
router.delete('/banking/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await req.supabase
      .from('admin_banking_accounts')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Conta bancária desativada' });
  } catch (error) {
    console.error('Erro ao desativar conta bancária:', error);
    res.status(500).json({ error: 'Erro ao desativar conta bancária' });
  }
});

// ==================== DASHBOARD STATS ====================

// @route   GET /api/admin/stats
// @desc    Estatísticas do dashboard
// @access  Admin
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const [
      usersResult,
      depositsResult,
      withdrawalsResult,
      investmentsResult,
      yieldsResult,
      profilesResult,
      recentDeposits,
      recentWithdrawals,
      recentUsers
    ] = await Promise.all([
      req.supabase.from('profiles').select('id').eq('status', 'active'),
      req.supabase.from('deposits').select('amount').eq('status', 'confirmed'),
      req.supabase.from('withdrawals').select('amount').eq('status', 'approved'),
      req.supabase.from('investments').select('amount, status').eq('status', 'active'),
      req.supabase.from('yields').select('amount').gte('date', new Date().toISOString().split('T')[0]),
      req.supabase.from('profiles').select('available_balance, total_earned, total_invested, total_withdrawn'),
      req.supabase.from('deposits').select('*').eq('status', 'confirmed').order('created_at', { ascending: false }).limit(5),
      req.supabase.from('withdrawals').select('*').eq('status', 'approved').order('created_at', { ascending: false }).limit(5),
      req.supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(5)
    ]);

    const stats = {
      totalUsers: usersResult.data?.length || 0,
      totalDeposits: depositsResult.data?.reduce((sum, d) => sum + parseFloat(d.amount || 0), 0) || 0,
      totalWithdrawals: withdrawalsResult.data?.reduce((sum, w) => sum + parseFloat(w.amount || 0), 0) || 0,
      activeInvestments: investmentsResult.data?.reduce((sum, i) => sum + parseFloat(i.amount || 0), 0) || 0,
      todayYields: yieldsResult.data?.reduce((sum, y) => sum + parseFloat(y.amount || 0), 0) || 0,
      totalWalletBalance: profilesResult.data?.reduce((sum, p) => sum + parseFloat(p.available_balance || 0), 0) || 0,
      totalEarned: profilesResult.data?.reduce((sum, p) => sum + parseFloat(p.total_earned || 0), 0) || 0,
      recentActivity: [
        ...recentDeposits.data?.map(d => ({ ...d, type: 'deposit' })) || [],
        ...recentWithdrawals.data?.map(w => ({ ...w, type: 'withdrawal' })) || [],
        ...recentUsers.data?.map(u => ({ ...u, type: 'user' })) || []
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10)
    };

    res.json(stats);
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

module.exports = router;
