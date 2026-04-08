const express = require('express');
const Joi = require('joi');
const router = express.Router();
const { sendTransferVerificationEmail, generateVerificationCode } = require('../services/emailService');

// Validações
const depositSchema = Joi.object({
  amount: Joi.number().positive().precision(2).required(),
  method: Joi.string().valid('pix', 'credit_card', 'bank_transfer', 'usdt').required(),
  reference: Joi.string().optional()
});

// Schema para depósito USDT
const usdtDepositSchema = Joi.object({
  amount: Joi.number().positive().precision(2).required(),
  tx_hash: Joi.string().optional().allow('')
});

// Schema para aprovação de depósito (admin)
const approveDepositSchema = Joi.object({
  deposit_id: Joi.string().uuid().required(),
  action: Joi.string().valid('approve', 'reject').required(),
  notes: Joi.string().optional().allow('')
});

const withdrawalSchema = Joi.object({
  amount: Joi.number().positive().precision(2).required(),
  method: Joi.string().valid('pix', 'bank_transfer', 'usdt', 'crypto', 'manual').required(),
  destination_address: Joi.string().required()
});

const transferSchema = Joi.object({
  amount: Joi.number().positive().precision(2).required(),
  recipient_email: Joi.string().email().required(),
  description: Joi.string().max(255).optional()
});

const initiateTransferSchema = Joi.object({
  amount: Joi.number().positive().precision(2).required(),
  recipient_email: Joi.string().email().required(),
  description: Joi.string().max(255).optional()
});

const confirmTransferSchema = Joi.object({
  transfer_id: Joi.string().uuid().required(),
  verification_code: Joi.string().length(6).pattern(/^\d+$/).required()
});

// @route   POST /api/financial/deposit
// @desc    Criar depósito (apenas registra intenção, admin aprova)
// @access  Private
router.post('/deposit', async (req, res) => {
  try {
    const { error } = depositSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { amount, method, reference } = req.body;
    const userId = req.user.id;

    // Verificar se já existe depósito pendente
    const { data: existingDeposit } = await req.supabase
      .from('deposits')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .single();

    if (existingDeposit) {
      return res.status(400).json({ error: 'Já existe um depósito pendente' });
    }

    // Criar depósito pendente
    const { data: deposit, error: depositError } = await req.supabase
      .from('deposits')
      .insert({
        user_id: userId,
        amount,
        method,
        reference,
        status: 'pending'
      })
      .select()
      .single();

    if (depositError) {
      console.error('Erro ao criar depósito:', depositError);
      return res.status(500).json({ error: 'Erro ao criar depósito' });
    }

    res.json({
      message: 'Depósito criado com sucesso',
      deposit: {
        id: deposit.id,
        amount: deposit.amount,
        method: deposit.method,
        status: deposit.status,
        created_at: deposit.created_at
      }
    });

  } catch (error) {
    console.error('Erro no endpoint deposit:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// @route   POST /api/financial/deposit/usdt
// @desc    Criar depósito USDT - gera QR Code e aguarda confirmação do admin
// @access  Private
router.post('/deposit/usdt', async (req, res) => {
  try {
    console.log('🚀 === DEPÓSITO USDT INICIADO ===');
    console.log('📥 Request body:', req.body);
    console.log('👤 Usuário:', req.user?.email, req.user?.id);
    
    const { error } = usdtDepositSchema.validate(req.body);
    if (error) {
      console.log('❌ Erro de validação:', error.details[0].message);
      return res.status(400).json({ error: error.details[0].message });
    }

    const { amount, tx_hash } = req.body;
    const userId = req.user.id;
    const userEmail = req.user.email;

    // Criar depósito USDT pendente
    console.log('💰 Criando depósito USDT:', {
      user_id: userId,
      amount,
      method: 'usdt',
      method_type: typeof 'usdt',
      method_length: 'usdt'.length,
      reference: tx_hash || null,
      wallet_address: process.env.USDT_WALLET,
      user_email: userEmail
    });

    const { data: deposit, error: depositError } = await req.supabase
      .from('deposits')
      .insert({
        user_id: userId,
        amount,
        method: 'usdt',
        reference: tx_hash || null,
        status: 'pending',
        wallet_address: process.env.USDT_WALLET,
        user_email: userEmail
      })
      .select()
      .single();

    if (depositError) {
      console.error('❌ Erro detalhado ao criar depósito USDT:', {
        code: depositError.code,
        message: depositError.message,
        details: depositError.details,
        hint: depositError.hint
      });
      return res.status(500).json({ 
        error: 'Erro ao criar depósito USDT', 
        details: depositError.message,
        code: depositError.code 
      });
    }

    // Gerar QR Code URL (usando API externa)
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(process.env.USDT_WALLET)}`;

    res.json({
      message: 'Depósito USDT criado. Envie o valor para a carteira abaixo e aguarde aprovação do admin.',
      deposit: {
        id: deposit.id,
        amount: deposit.amount,
        method: 'usdt',
        status: 'pending',
        wallet_address: process.env.USDT_WALLET,
        qr_code_url: qrCodeUrl,
        created_at: deposit.created_at
      },
      instructions: {
        wallet: process.env.USDT_WALLET,
        amount_usdt: amount.toFixed(2),
        network: 'BEP20 (Binance Smart Chain)',
        amount: amount,
        note: `Depósito #${deposit.id}`
      }
    });

  } catch (error) {
    console.error('Erro no endpoint deposit/usdt:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// @route   POST /api/financial/deposit/approve
// @desc    Aprovar ou rejeitar depósito (somente admin)
// @access  Admin
router.post('/deposit/approve', async (req, res) => {
  try {
    const { error } = approveDepositSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { deposit_id, action, notes } = req.body;
    const adminId = req.user.id;

    // Verificar se usuário é admin pelo campo role na tabela profiles
    const { data: profile, error: profileError } = await req.supabase
      .from('profiles')
      .select('role')
      .eq('user_id', adminId)
      .single();
    
    if (profileError || !profile) {
      return res.status(403).json({ error: 'Perfil não encontrado' });
    }

    const isAdmin = profile.role === 'admin';

    if (!isAdmin) {
      return res.status(403).json({ error: 'Acesso negado. Somente admin pode aprovar depósitos.' });
    }

    // Buscar depósito
    const { data: deposit, error: depositError } = await req.supabase
      .from('deposits')
      .select('*')
      .eq('id', deposit_id)
      .single();

    if (depositError || !deposit) {
      return res.status(404).json({ error: 'Depósito não encontrado' });
    }

    if (deposit.status !== 'pending') {
      return res.status(400).json({ error: 'Depósito já foi processado' });
    }

    const newStatus = action === 'approve' ? 'confirmed' : 'rejected';

    // Atualizar status do depósito
    const { data: updatedDeposit, error: updateError } = await req.supabase
      .from('deposits')
      .update({
        status: newStatus,
        approved_by: adminId,
        approved_at: new Date().toISOString(),
        admin_notes: notes || null
      })
      .eq('id', deposit_id)
      .select()
      .single();

    if (updateError) {
      console.error('Erro ao atualizar depósito:', updateError);
      return res.status(500).json({ error: 'Erro ao processar depósito' });
    }

    // Se aprovado, creditar na carteira do usuário
    if (action === 'approve') {
      console.log('💰 Creditando depósito aprovado na carteira do usuário:', deposit.user_id);

      // Buscar saldo atual
      const { data: userBalance, error: balanceError } = await req.supabase
        .from('wallet_balances')
        .select('wallet_balance')
        .eq('user_id', deposit.user_id)
        .single();

      if (balanceError && balanceError.code !== 'PGRST116') {
        console.error('Erro ao buscar saldo:', balanceError);
        return res.status(500).json({ error: 'Erro ao buscar saldo do usuário' });
      }

      // Atualizar ou criar saldo
      const { error: creditError } = await req.supabase
        .from('wallet_balances')
        .upsert({
          user_id: deposit.user_id,
          wallet_balance: (userBalance?.wallet_balance || 0) + deposit.amount,
          updated_at: new Date().toISOString()
        });

      if (creditError) {
        console.error('Erro ao creditar saldo:', creditError);
        return res.status(500).json({ error: 'Erro ao creditar saldo na carteira' });
      }

      console.log('✅ Saldo creditado com sucesso:', deposit.amount);
    }

    res.json({
      message: action === 'approve' ? 'Depósito aprovado e creditado' : 'Depósito rejeitado',
      deposit: updatedDeposit
    });

  } catch (error) {
    console.error('Erro no endpoint deposit/approve:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// @route   POST /api/financial/deposit/transaction-hash
// @desc    Enviar Transaction Hash para depósito USDT
// @access  Private
router.post('/deposit/transaction-hash', async (req, res) => {
  try {
    console.log('🚀 === TRANSACTION HASH RECEBIDO ===');
    console.log('📥 Request body:', req.body);
    console.log('👤 Usuário:', req.user?.email, req.user?.id);

    const { deposit_id, transaction_hash } = req.body;
    const userId = req.user.id;

    // Validações
    if (!deposit_id || !transaction_hash) {
      console.log('❌ Erro: Dados incompletos');
      return res.status(400).json({ error: 'deposit_id e transaction_hash são obrigatórios' });
    }

    // Validar formato do transaction hash (deve ter pelo menos 10 caracteres)
    if (transaction_hash.trim().length < 10) {
      console.log('❌ Erro: Transaction hash muito curto');
      return res.status(400).json({ error: 'Transaction hash inválido' });
    }

    // Buscar depósito
    const { data: deposit, error: depositError } = await req.supabase
      .from('deposits')
      .select('*')
      .eq('id', deposit_id)
      .eq('user_id', userId)
      .single();

    if (depositError || !deposit) {
      console.log('❌ Erro: Depósito não encontrado');
      return res.status(404).json({ error: 'Depósito não encontrado' });
    }

    // Verificar se o depósito é do tipo USDT
    if (deposit.method !== 'usdt') {
      console.log('❌ Erro: Depósito não é USDT');
      return res.status(400).json({ error: 'Transaction hash só pode ser enviado para depósitos USDT' });
    }

    // Verificar se o depósito ainda está pendente
    if (deposit.status !== 'pending') {
      console.log('❌ Erro: Depósito já processado. Status:', deposit.status);
      return res.status(400).json({ error: `Depósito já foi ${deposit.status === 'confirmed' ? 'confirmado' : 'rejeitado'}` });
    }

    // Verificar se já existe um transaction_hash
    if (deposit.transaction_hash) {
      console.log('❌ Erro: Transaction hash já foi enviado');
      return res.status(400).json({ error: 'Transaction hash já foi enviado para este depósito' });
    }

    // Atualizar depósito com o transaction hash
    const { data: updatedDeposit, error: updateError } = await req.supabase
      .from('deposits')
      .update({
        transaction_hash: transaction_hash.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', deposit_id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Erro ao atualizar depósito:', updateError);
      return res.status(500).json({ error: 'Erro ao salvar transaction hash' });
    }

    console.log('✅ Transaction hash salvo com sucesso:', updatedDeposit.id);

    res.json({
      message: 'Transaction hash enviado com sucesso',
      deposit: {
        id: updatedDeposit.id,
        transaction_hash: updatedDeposit.transaction_hash,
        status: updatedDeposit.status
      }
    });

  } catch (error) {
    console.error('Erro no endpoint deposit/transaction-hash:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// @route   GET /api/financial/deposits/pending
// @desc    Listar depósitos pendentes (somente admin)
// @access  Admin
router.get('/deposits/pending', async (req, res) => {
  try {
    const adminId = req.user.id;

    // Verificar se é admin pelo campo role na tabela profiles
    const { data: profile, error: profileError } = await req.supabase
      .from('profiles')
      .select('role')
      .eq('user_id', adminId)
      .single();
    
    if (profileError || !profile) {
      return res.status(403).json({ error: 'Perfil não encontrado' });
    }

    const isAdmin = profile.role === 'admin';

    if (!isAdmin) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const { data: deposits, error } = await req.supabase
      .from('deposits')
      .select(`
        *,
        user:profiles(user_id, full_name, email)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar depósitos:', error);
      return res.status(500).json({ error: 'Erro ao buscar depósitos' });
    }

    res.json({ deposits });

  } catch (error) {
    console.error('Erro no endpoint deposits/pending:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// @route   POST /api/financial/withdrawal
// @desc    Solicitar saque
// @access  Private
router.post('/withdrawal', async (req, res) => {
  try {
    console.log('🚀 === SAQUE INICIADO ===');
    console.log('📥 Request body:', req.body);
    console.log('👤 Usuário:', req.user?.email, req.user?.id);

    const { error } = withdrawalSchema.validate(req.body);
    if (error) {
      console.log('❌ Erro de validação:', error.details[0].message);
      return res.status(400).json({ error: error.details[0].message });
    }

    const { amount, method, destination_address } = req.body;
    const userId = req.user.id;

    console.log('💰 Processando saque:', { amount, method, destination_address, userId });

    // Verificar saldo disponível (buscando direto da tabela)
    const { data: userBalance, error: balanceError } = await req.supabase
      .from('wallet_balances')
      .select('wallet_balance, yield_balance, bonus_balance')
      .eq('user_id', userId)
      .single();

    if (balanceError && balanceError.code !== 'PGRST116') {
      console.error('Erro ao buscar saldo:', balanceError);
      return res.status(500).json({ error: 'Erro ao verificar saldo' });
    }

    const availableBalance = 
      (userBalance?.wallet_balance || 0) + 
      (userBalance?.yield_balance || 0) + 
      (userBalance?.bonus_balance || 0);

    if (availableBalance < amount) {
      return res.status(400).json({
        error: `Saldo insuficiente. Disponível: R$ ${availableBalance.toFixed(2)}`
      });
    }

    // Verificar se já existe saque pendente
    const { data: existingWithdrawal } = await req.supabase
      .from('withdrawals')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .single();

    if (existingWithdrawal) {
      return res.status(400).json({ error: 'Já existe um saque pendente' });
    }

    // Criar saque pendente
    console.log('📝 Criando registro de saque na tabela...');
    const { data: withdrawal, error: withdrawalError } = await req.supabase
      .from('withdrawals')
      .insert({
        user_id: userId,
        amount,
        method,
        destination_address,
        status: 'pending'
      })
      .select()
      .single();

    if (withdrawalError) {
      console.error('❌ Erro ao criar saque:', withdrawalError);
      return res.status(500).json({ error: 'Erro ao criar saque' });
    }

    console.log('✅ Saque criado com sucesso:', withdrawal);

    res.json({
      message: 'Saque solicitado com sucesso',
      withdrawal: {
        id: withdrawal.id,
        amount: withdrawal.amount,
        method: withdrawal.method,
        status: withdrawal.status,
        created_at: withdrawal.created_at
      }
    });

  } catch (error) {
    console.error('Erro no endpoint withdrawal:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// @route   POST /api/financial/withdrawal/approve
// @desc    Aprovar ou rejeitar saque (somente admin)
// @access  Admin
router.post('/withdrawal/approve', async (req, res) => {
  try {
    console.log('🚀 === APROVAÇÃO DE SAQUE INICIADA ===');
    console.log('📥 Request body:', req.body);
    console.log('👤 Admin:', req.user?.email, req.user?.id);

    const { withdrawal_id, action, notes } = req.body;
    const adminId = req.user.id;

    // Verificar se usuário é admin pelo campo role na tabela profiles
    const { data: profile, error: profileError } = await req.supabase
      .from('profiles')
      .select('role')
      .eq('user_id', adminId)
      .single();
    
    if (profileError || !profile) {
      return res.status(403).json({ error: 'Perfil não encontrado' });
    }

    const isAdmin = profile.role === 'admin' || profile.role === 'super_admin';

    if (!isAdmin) {
      console.log('❌ Acesso negado. Role do usuário:', profile.role);
      return res.status(403).json({ error: 'Acesso negado. Somente admin pode aprovar saques.' });
    }

    console.log('✅ Admin verificado. Role:', profile.role);

    // Buscar saque
    const { data: withdrawal, error: withdrawalError } = await req.supabase
      .from('withdrawals')
      .select('*')
      .eq('id', withdrawal_id)
      .single();

    if (withdrawalError || !withdrawal) {
      return res.status(404).json({ error: 'Saque não encontrado' });
    }

    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ error: `Saque já está ${withdrawal.status}` });
    }

    let updatedWithdrawal;

    if (action === 'approve') {
      console.log('✅ Ação: APROVAR saque');
      // Aprovar saque - deduzir saldo do usuário
      console.log('💰 Buscando saldo do usuário:', withdrawal.user_id);
      const { data: userBalance } = await req.supabase
        .from('wallet_balances')
        .select('wallet_balance, yield_balance, bonus_balance')
        .eq('user_id', withdrawal.user_id)
        .single();

      console.log('💰 Saldo encontrado:', userBalance);

      const availableBalance = 
        (userBalance?.wallet_balance || 0) + 
        (userBalance?.yield_balance || 0) + 
        (userBalance?.bonus_balance || 0);

      console.log('💰 Saldo disponível:', availableBalance, 'Valor saque:', withdrawal.amount);

      if (availableBalance < withdrawal.amount) {
        console.log('❌ Saldo insuficiente');
        return res.status(400).json({ 
          error: `Saldo insuficiente do usuário. Disponível: R$ ${availableBalance.toFixed(2)}` 
        });
      }

      console.log('✅ Saldo suficiente, prosseguindo com dedução...');

      // Deduzir do saldo (prioridade: wallet_balance -> yield_balance -> bonus_balance)
      let remainingAmount = withdrawal.amount;
      let newWalletBalance = userBalance.wallet_balance || 0;
      let newYieldBalance = userBalance.yield_balance || 0;
      let newBonusBalance = userBalance.bonus_balance || 0;

      console.log('💰 Saldos antes:', { newWalletBalance, newYieldBalance, newBonusBalance });

      if (newWalletBalance >= remainingAmount) {
        newWalletBalance -= remainingAmount;
        remainingAmount = 0;
      } else {
        remainingAmount -= newWalletBalance;
        newWalletBalance = 0;

        if (newYieldBalance >= remainingAmount) {
          newYieldBalance -= remainingAmount;
          remainingAmount = 0;
        } else {
          remainingAmount -= newYieldBalance;
          newYieldBalance = 0;
          newBonusBalance -= remainingAmount;
        }
      }

      console.log('💰 Saldos depois:', { newWalletBalance, newYieldBalance, newBonusBalance });

      // Atualizar saldo do usuário
      console.log('📝 Atualizando saldo do usuário...');
      const { error: updateError } = await req.supabase
        .from('wallet_balances')
        .update({
          wallet_balance: newWalletBalance,
          yield_balance: newYieldBalance,
          bonus_balance: newBonusBalance,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', withdrawal.user_id);

      if (updateError) {
        console.error('❌ Erro ao atualizar saldo:', updateError);
        return res.status(500).json({ error: 'Erro ao processar saque' });
      }

      console.log('✅ Saldo atualizado com sucesso');

      // Atualizar status do saque
      console.log('📝 Atualizando status do saque para approved...');
      const { data: updated, error: updateWithdrawalError } = await req.supabase
        .from('withdrawals')
        .update({
          status: 'approved',
          admin_notes: notes || null
        })
        .eq('id', withdrawal_id)
        .select()
        .single();

      if (updateWithdrawalError) {
        console.error('❌ Erro ao aprovar saque:', updateWithdrawalError);
        return res.status(500).json({ error: 'Erro ao aprovar saque' });
      }

      console.log('✅ Saque aprovado com sucesso:', updated);
      updatedWithdrawal = updated;

      console.log('✅ Saque aprovado:', {
        withdrawal_id,
        user_id: withdrawal.user_id,
        amount: withdrawal.amount
      });

    } else {
      // Rejeitar saque
      console.log('📝 Rejeitando saque...');
      const { data: updated, error: updateError } = await req.supabase
        .from('withdrawals')
        .update({
          status: 'rejected',
          admin_notes: notes || null
        })
        .eq('id', withdrawal_id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Erro ao rejeitar saque:', updateError);
        return res.status(500).json({ error: 'Erro ao rejeitar saque' });
      }

      updatedWithdrawal = updated;

      console.log('❌ Saque rejeitado:', {
        withdrawal_id,
        notes
      });
    }

    res.json({
      message: action === 'approve' ? 'Saque aprovado e processado' : 'Saque rejeitado',
      withdrawal: updatedWithdrawal
    });

  } catch (error) {
    console.error('Erro no endpoint withdrawal/approve:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// @route   GET /api/financial/withdrawals/pending
// @desc    Listar saques pendentes (somente admin)
// @access  Admin
router.get('/withdrawals/pending', async (req, res) => {
  try {
    const adminId = req.user.id;

    // Verificar se é admin pelo campo role na tabela profiles
    const { data: profile, error: profileError } = await req.supabase
      .from('profiles')
      .select('role')
      .eq('user_id', adminId)
      .single();
    
    if (profileError || !profile) {
      return res.status(403).json({ error: 'Perfil não encontrado' });
    }

    const isAdmin = profile.role === 'admin';

    if (!isAdmin) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const { data: withdrawals, error } = await req.supabase
      .from('withdrawals')
      .select(`
        *,
        user:profiles(user_id, full_name, email)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar saques:', error);
      return res.status(500).json({ error: 'Erro ao buscar saques' });
    }

    res.json({ withdrawals });

  } catch (error) {
    console.error('Erro no endpoint withdrawals/pending:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// @route   POST /api/financial/transfer/initiate
// @desc    Iniciar transferência - envia email com código de verificação
// @access  Private
router.post('/transfer/initiate', async (req, res) => {
  try {
    const { error } = initiateTransferSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { amount, recipient_email, description } = req.body;
    const senderId = req.user.id;
    const senderEmail = req.user.email;

    // Verificar saldo disponível do remetente (buscar direto da tabela, não usar RPC)
    console.log('💰 Verificando saldo para usuário:', senderId);
    console.log('🔧 Usando cliente Supabase:', {
      hasSupabase: !!req.supabase,
      supabaseType: typeof req.supabase,
      hasSupabaseAuth: !!req.supabaseAuth,
      supabaseAuthType: typeof req.supabaseAuth,
      supabaseUrl: req.supabase?.supabaseUrl,
      supabaseKey: req.supabase?.supabaseKey ? '[REDACTED]' : 'undefined'
    });
    
    console.log('🔧 Tentando consultar wallet_balances...');
    const { data: balanceData, error: balanceError } = await req.supabase
      .from('wallet_balances')
      .select('wallet_balance, yield_balance, bonus_balance')
      .eq('user_id', senderId)
      .single();

    console.log('💰 Balance query result:', { 
      hasData: !!balanceData, 
      hasError: !!balanceError,
      errorCode: balanceError?.code,
      errorMessage: balanceError?.message,
      errorDetails: balanceError?.details,
      errorHint: balanceError?.hint
    });

    if (balanceError && balanceError.code !== 'PGRST116') {
      console.error('❌ Erro completo ao buscar saldo:', {
        fullError: JSON.stringify(balanceError, null, 2),
        message: balanceError.message,
        code: balanceError.code,
        hint: balanceError.hint,
        details: balanceError.details
      });
      return res.status(500).json({ 
        error: 'Erro ao verificar saldo',
        details: balanceError.message,
        code: balanceError.code,
        hint: balanceError.hint
      });
    }

    // Calcular saldo disponível (wallet + yield + bonus)
    const availableBalance = 
      (balanceData?.wallet_balance || 0) + 
      (balanceData?.yield_balance || 0) + 
      (balanceData?.bonus_balance || 0);

    console.log('💰 Saldo disponível:', availableBalance);

    if (availableBalance < amount) {
      return res.status(400).json({
        error: `Saldo insuficiente. Disponível: R$ ${availableBalance.toFixed(2)}`
      });
    }

    // Buscar usuário destinatário
    const { data: recipient, error: recipientError } = await req.supabase
      .from('profiles')
      .select('user_id, email')
      .eq('email', recipient_email)
      .single();

    if (recipientError || !recipient) {
      return res.status(404).json({ error: 'Destinatário não encontrado' });
    }

    if (senderId === recipient.user_id) {
      return res.status(400).json({ error: 'Não é possível transferir para si mesmo' });
    }

    // Gerar código de verificação
    const verificationCode = generateVerificationCode();

    // Criar transferência pendente
    const { data: pendingTransfer, error: transferError } = await req.supabase
      .from('transfers')
      .insert({
        from_user_id: senderId,
        to_user_id: recipient.user_id,
        amount: amount,
        description: description || 'Transferência entre usuários',
        status: 'pending_verification',
        verification_code: verificationCode,
        verification_expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutos
      })
      .select()
      .single();

    if (transferError) {
      console.error('Erro ao criar transferência pendente:', transferError);
      return res.status(500).json({ error: 'Erro ao iniciar transferência' });
    }

    // Enviar email com código de verificação
    console.log('📧 Código de verificação gerado:', verificationCode, '- Enviando para:', senderEmail);
    
    const emailResult = await sendTransferVerificationEmail(senderEmail, verificationCode, {
      amount,
      recipientEmail: recipient_email
    });

    if (!emailResult.success) {
      console.error('Erro ao enviar email:', emailResult.error);
      // Não falha a requisição, apenas loga o erro
    }

    res.json({
      message: 'Código de verificação enviado para seu email',
      transfer_id: pendingTransfer.id,
      expires_in: '10 minutos'
    });

  } catch (error) {
    console.error('Erro no endpoint transfer/initiate:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// @route   POST /api/financial/transfer/confirm
// @desc    Confirmar transferência com código de verificação
// @access  Private
router.post('/transfer/confirm', async (req, res) => {
  try {
    const { error } = confirmTransferSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { transfer_id, verification_code } = req.body;
    const senderId = req.user.id;

    // Buscar transferência pendente
    const { data: pendingTransfer, error: findError } = await req.supabase
      .from('transfers')
      .select('*')
      .eq('id', transfer_id)
      .eq('from_user_id', senderId)
      .eq('status', 'pending_verification')
      .single();

    if (findError || !pendingTransfer) {
      return res.status(404).json({ error: 'Transferência não encontrada ou já processada' });
    }

    // Verificar se código expirou
    if (new Date(pendingTransfer.verification_expires_at) < new Date()) {
      // Atualizar status para expirado
      await req.supabase
        .from('transfers')
        .update({ status: 'expired' })
        .eq('id', transfer_id);
      
      return res.status(400).json({ error: 'Código de verificação expirado. Inicie a transferência novamente.' });
    }

    // Verificar código
    if (pendingTransfer.verification_code !== verification_code) {
      return res.status(400).json({ error: 'Código de verificação inválido' });
    }

    // Executar transferência de forma atômica (sem RPC - diretamente no backend)
    console.log('💸 Executando transferência atômica...');
    
    try {
      // 1. Verificar saldo novamente
      const { data: senderBalance, error: balanceError } = await req.supabase
        .from('wallet_balances')
        .select('wallet_balance, yield_balance, bonus_balance')
        .eq('user_id', pendingTransfer.from_user_id)
        .single();
      
      if (balanceError) throw new Error('Erro ao verificar saldo: ' + balanceError.message);
      
      const availableBalance = 
        (senderBalance?.wallet_balance || 0) + 
        (senderBalance?.yield_balance || 0) + 
        (senderBalance?.bonus_balance || 0);
      
      if (availableBalance < pendingTransfer.amount) {
        throw new Error('Saldo insuficiente');
      }

      // 2. Debitar do remetente (wallet_balance)
      console.log('💸 Debitando do remetente:', pendingTransfer.from_user_id, 'Valor:', pendingTransfer.amount);
      const { error: debitError } = await req.supabase
        .from('wallet_balances')
        .update({ 
          wallet_balance: (senderBalance.wallet_balance || 0) - pendingTransfer.amount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', pendingTransfer.from_user_id);
      
      if (debitError) {
        console.error('❌ Erro detalhado ao debitar:', debitError);
        throw new Error('Erro ao debitar: ' + debitError.message);
      }
      console.log('✅ Remetente debitado com sucesso');

      // 3. Creditar no destinatário
      const { data: recipientBalance, error: recipientBalanceError } = await req.supabase
        .from('wallet_balances')
        .select('wallet_balance')
        .eq('user_id', pendingTransfer.to_user_id)
        .single();
      
      const recipientExists = !recipientBalanceError || recipientBalanceError.code !== 'PGRST116';
      
      if (recipientExists && recipientBalance) {
        // Atualizar saldo existente
        const { error: creditError } = await req.supabase
          .from('wallet_balances')
          .update({ 
            wallet_balance: (recipientBalance.wallet_balance || 0) + pendingTransfer.amount,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', pendingTransfer.to_user_id);
        
        if (creditError) {
          console.error('❌ Erro detalhado ao creditar:', creditError);
          throw new Error('Erro ao creditar: ' + creditError.message);
        }
        console.log('✅ Destinatário creditado com sucesso');
      } else {
        // Criar novo registro
        const { error: creditError } = await req.supabase
          .from('wallet_balances')
          .insert({ 
            user_id: pendingTransfer.to_user_id,
            wallet_balance: pendingTransfer.amount,
            yield_balance: 0,
            bonus_balance: 0,
            locked_balance: 0,
            updated_at: new Date().toISOString()
          });
        
        if (creditError) {
          console.error('❌ Erro detalhado ao criar saldo destinatário:', creditError);
          throw new Error('Erro ao criar saldo destinatário: ' + creditError.message);
        }
        console.log('✅ Novo saldo criado para destinatário');
      }

      // 4. Atualizar status da transferência
      const { error: updateError } = await req.supabase
        .from('transfers')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', transfer_id);
      
      if (updateError) throw new Error('Erro ao atualizar transferência: ' + updateError.message);

      console.log('✅ Transferência executada com sucesso:', transfer_id);

    } catch (transferError) {
      console.error('❌ Erro ao executar transferência:', transferError);
      return res.status(500).json({ error: transferError.message || 'Erro ao executar transferência' });
    }

    res.json({
      message: 'Transferência realizada com sucesso',
      transfer: {
        id: transfer_id,
        amount: pendingTransfer.amount,
        sender_id: pendingTransfer.from_user_id,
        recipient_id: pendingTransfer.to_user_id,
        status: 'completed',
        completed_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Erro no endpoint transfer/confirm:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// @route   POST /api/financial/transfer
// @desc    [DEPRECATED] Transferir dinheiro entre usuários - usar /transfer/initiate + /transfer/confirm
// @access  Private
router.post('/transfer', async (req, res) => {
  try {
    return res.status(400).json({ 
      error: 'Endpoint descontinuado. Use POST /transfer/initiate seguido de POST /transfer/confirm com código de verificação'
    });
  } catch (error) {
    console.error('Erro no endpoint transfer:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// @route   GET /api/financial/balance
// @desc    Buscar saldos do usuário
// @access  Private
router.get('/balance', async (req, res) => {
  try {
    const userId = req.user.id;

    // Buscar saldos detalhados
    const { data: balances, error: balancesError } = await req.supabase
      .from('wallet_balances')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (balancesError && balancesError.code !== 'PGRST116') {
      console.error('Erro ao buscar saldos:', balancesError);
      return res.status(500).json({ error: 'Erro ao buscar saldos' });
    }

    // Calcular saldo total disponível diretamente
    const availableBalance = 
      (balances?.wallet_balance || 0) + 
      (balances?.yield_balance || 0) + 
      (balances?.bonus_balance || 0);

    res.json({
      wallet_balance: balances?.wallet_balance || 0,
      yield_balance: balances?.yield_balance || 0,
      bonus_balance: balances?.bonus_balance || 0,
      locked_balance: balances?.locked_balance || 0,
      available_balance: availableBalance
    });

  } catch (error) {
    console.error('Erro no endpoint balance:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// @route   GET /api/financial/transactions
// @desc    Buscar transações do usuário (combina ledger, deposits, withdrawals, transfers)
// @access  Private
router.get('/transactions', async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, type } = req.query;

    console.log('🔍 Buscando transações para userId:', userId);

    // Buscar de múltiplas tabelas em paralelo
    const [
      ledgerResult,
      depositsResult,
      withdrawalsResult,
      transfersResult,
      investmentsResult
    ] = await Promise.all([
      // Financial ledger
      req.supabase
        .from('financial_ledger')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50),
      
      // Deposits
      req.supabase
        .from('deposits')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20),
      
      // Withdrawals
      req.supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20),
      
      // Transfers (enviadas ou recebidas)
      req.supabase
        .from('transfers')
        .select('*')
        .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(20),
      
      // Investments
      req.supabase
        .from('investments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)
    ]);

    // Combinar e normalizar todas as transações
    let allTransactions = [];

    // Ledger entries
    if (ledgerResult.data) {
      allTransactions.push(...ledgerResult.data.map(item => ({
        id: item.id,
        type: item.type || 'transaction',
        amount: Math.abs(parseFloat(item.amount || 0)),
        status: item.status || 'completed',
        description: item.description || '',
        created_date: item.created_at,
        reference_id: item.reference_id,
        reference_type: item.reference_type,
        source: 'ledger'
      })));
    }

    // Deposits
    if (depositsResult.data) {
      allTransactions.push(...depositsResult.data.map(item => ({
        id: item.id,
        type: 'deposit',
        amount: parseFloat(item.amount || 0),
        status: item.status === 'confirmed' ? 'completed' : item.status,
        description: `Depósito via ${item.method || 'N/A'}`,
        created_date: item.created_at,
        reference_id: item.id,
        reference_type: 'deposit',
        source: 'deposits'
      })));
    }

    // Withdrawals
    if (withdrawalsResult.data) {
      allTransactions.push(...withdrawalsResult.data.map(item => ({
        id: item.id,
        type: 'withdrawal',
        amount: parseFloat(item.amount || 0),
        status: item.status === 'approved' ? 'completed' : item.status,
        description: `Saque para ${item.bank_name || 'conta bancária'}`,
        created_date: item.created_at,
        reference_id: item.id,
        reference_type: 'withdrawal',
        source: 'withdrawals'
      })));
    }

    // Transfers
    if (transfersResult.data) {
      allTransactions.push(...transfersResult.data.map(item => {
        const isOutgoing = item.from_user_id === userId;
        return {
          id: item.id,
          type: 'transfer',
          amount: parseFloat(item.amount || 0),
          status: 'completed',
          description: isOutgoing ? `Transferência enviada` : `Transferência recebida`,
          created_date: item.created_at,
          reference_id: item.id,
          reference_type: 'transfer',
          direction: isOutgoing ? 'out' : 'in',
          source: 'transfers'
        };
      }));
    }

    // Investments
    if (investmentsResult.data) {
      allTransactions.push(...investmentsResult.data.map(item => ({
        id: item.id,
        type: 'investment',
        amount: parseFloat(item.amount || 0),
        status: item.status,
        description: `Investimento em ${item.plan_slug || 'plano'}`,
        created_date: item.created_at,
        reference_id: item.id,
        reference_type: 'investment',
        source: 'investments'
      })));
    }

    // Ordenar por data (mais recente primeiro)
    allTransactions.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

    // Aplicar filtro de tipo se especificado
    if (type) {
      allTransactions = allTransactions.filter(t => t.type === type);
    }

    const offset = (page - 1) * limit;
    const paginatedTransactions = allTransactions.slice(offset, offset + parseInt(limit));

    console.log('✅ Total de transações combinadas:', allTransactions.length);
    console.log('📋 Retornando:', paginatedTransactions.length, 'transações');

    res.json({
      transactions: paginatedTransactions,
      page: parseInt(page),
      limit: parseInt(limit),
      total: allTransactions.length
    });

  } catch (error) {
    console.error('❌ Erro no endpoint transactions:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// @route   GET /api/financial/deposits
// @desc    Buscar depósitos do usuário
// @access  Private
router.get('/deposits', async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 20 } = req.query;

    const offset = (page - 1) * limit;

    let query = req.supabase
      .from('deposits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: deposits, error } = await query;

    if (error) {
      console.error('Erro ao buscar depósitos:', error);
      return res.status(500).json({ error: 'Erro ao buscar depósitos' });
    }

    res.json({
      deposits: deposits || [],
      page: parseInt(page),
      limit: parseInt(limit)
    });

  } catch (error) {
    console.error('Erro no endpoint deposits:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// @route   GET /api/financial/withdrawals
// @desc    Buscar saques do usuário
// @access  Private
router.get('/withdrawals', async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 20 } = req.query;

    const offset = (page - 1) * limit;

    let query = req.supabase
      .from('withdrawals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    const { data: withdrawals, error } = await query;

    if (error) {
      console.error('Erro ao buscar saques:', error);
      return res.status(500).json({ error: 'Erro ao buscar saques' });
    }

    res.json({
      withdrawals: withdrawals || [],
      page: parseInt(page),
      limit: parseInt(limit)
    });

  } catch (error) {
    console.error('Erro no endpoint withdrawals:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// @route   GET /api/financial/transfers
// @desc    Buscar transferências do usuário
// @access  Private
router.get('/transfers', async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const offset = (page - 1) * limit;

    // Query simplificada sem joins complexos
    const { data: transfers, error } = await req.supabase
      .from('transfers')
      .select('*')
      .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Erro ao buscar transferências:', error);
      // Retornar array vazio em vez de erro 500
      return res.json({ transfers: [], page: parseInt(page), limit: parseInt(limit) });
    }

    // Buscar nomes dos usuários separadamente
    const userIds = [...new Set([
      ...(transfers || []).map(t => t.from_user_id),
      ...(transfers || []).map(t => t.to_user_id)
    ])].filter(Boolean);

    let userMap = {};
    if (userIds.length > 0) {
      const { data: profiles } = await req.supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds);
      
      if (profiles) {
        profiles.forEach(p => {
          userMap[p.user_id] = p;
        });
      }
    }

    // Enriquecer dados
    const enrichedTransfers = (transfers || []).map(t => ({
      ...t,
      sender: userMap[t.from_user_id] || { full_name: 'N/A', email: '' },
      recipient: userMap[t.to_user_id] || { full_name: 'N/A', email: '' }
    }));

    res.json({
      transfers: enrichedTransfers,
      page: parseInt(page),
      limit: parseInt(limit)
    });

  } catch (error) {
    console.error('Erro no endpoint transfers:', error);
    res.json({ transfers: [], page: 1, limit: 20 });
  }
});

// @route   GET /api/financial/investments
// @desc    Buscar investimentos do usuário
// @access  Private
router.get('/investments', async (req, res) => {
  try {
    const userId = req.user.id;
    const { status = 'active' } = req.query;

    console.log('🔍 Buscando investimentos para userId:', userId, 'status:', status);

    // Testar se tabela existe
    try {
      const { data: test, error: testError } = await req.supabase
        .from('investments')
        .select('count')
        .limit(1);
      
      if (testError) {
        console.error('❌ Tabela investments não existe ou sem acesso:', testError);
        return res.status(500).json({ 
          error: 'Erro ao acessar tabela investments', 
          details: testError.message,
          code: testError.code 
        });
      }
      
      console.log('✅ Tabela investments OK, count:', test?.length || 0);
    } catch (testErr) {
      console.error('❌ Erro ao testar tabela investments:', testErr);
      return res.status(500).json({ 
        error: 'Erro ao testar tabela investments', 
        details: testErr.message 
      });
    }

    let query = req.supabase
      .from('investments')
      .select('*')
      .eq('user_id', userId);

    if (status) {
      query = query.eq('status', status);
    }

    // Adicionar order separadamente para evitar erro se coluna não existir
    try {
      query = query.order('created_at', { ascending: false });
    } catch (orderErr) {
      console.warn('⚠️ Erro ao adicionar order, continuando sem order:', orderErr.message);
    }

    const { data: investments, error } = await query;

    if (error) {
      console.error('❌ Erro ao buscar investimentos:', error);
      console.error('Detalhes do erro:', JSON.stringify(error, null, 2));
      return res.status(500).json({ 
        error: 'Erro ao buscar investimentos', 
        details: error.message,
        code: error.code,
        hint: error.hint 
      });
    }

    console.log('✅ Investimentos encontrados:', investments?.length || 0);
    res.json({
      investments: investments || []
    });

  } catch (error) {
    console.error('❌ Erro no endpoint investments:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
});

// @route   GET /api/financial/admin-accounts
// @desc    Buscar contas bancárias do admin (para depósitos)
// @access  Private
router.get('/admin-accounts', async (req, res) => {
  try {
    const { data: accounts, error } = await req.supabase
      .from('admin_banking_accounts')
      .select('*')
      .eq('is_active', true)
      .order('is_default', { ascending: false });

    if (error) {
      console.error('Erro ao buscar contas admin:', error);
      return res.status(500).json({ error: 'Erro ao buscar contas' });
    }

    res.json({
      accounts: accounts || []
    });

  } catch (error) {
    console.error('Erro no endpoint admin-accounts:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// @route   GET /api/financial/network
// @desc    Buscar dados da rede/network do usuário (indicados diretos e indiretos)
// @access  Private
router.get('/network', async (req, res) => {
  try {
    const userId = req.user.id;

    // Buscar relações de rede da tabela network_relations
    const { data: networkRelations, error: networkError } = await req.supabase
      .from('network_relations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (networkError) {
      console.error('Erro ao buscar rede:', networkError);
      // Fallback para profiles.referred_by se network_relations não existir
      const { data: fallbackProfiles, error: fallbackError } = await req.supabase
        .from('profiles')
        .select('user_id, full_name, email, referred_by, referral_code, created_at')
        .eq('referred_by', userId)
        .order('created_at', { ascending: false });
      
      if (fallbackError) {
        console.error('Fallback também falhou:', fallbackError);
        return res.status(500).json({ error: 'Erro ao buscar rede', details: networkError.message });
      }

      const network = (fallbackProfiles || []).map((profile) => ({
        id: profile.user_id,
        referred_id: profile.user_id,
        referred_name: profile.full_name || 'N/A',
        referred_email: profile.email || '',
        level: 1,
        referral_code: profile.referral_code || '',
        created_at: profile.created_at
      }));

      const memberIds = network.map(m => m.referred_id);
      let indirectInvestments = {};
      if (memberIds.length > 0) {
        const { data: investments } = await req.supabase
          .from('investments')
          .select('*')
          .in('user_id', memberIds)
          .eq('status', 'active');
        
        if (investments) {
          investments.forEach(inv => {
            indirectInvestments[inv.user_id] = inv;
          });
        }
      }

      return res.json({ network: network || [], indirectInvestments });
    }

    // Buscar dados dos perfis referenciados
    const referredIds = networkRelations.map(r => r.referred_id);
    let profileMap = {};
    
    if (referredIds.length > 0) {
      const { data: profiles } = await req.supabase
        .from('profiles')
        .select('user_id, full_name, email, referral_code')
        .in('user_id', referredIds);
      
      if (profiles) {
        profiles.forEach(p => {
          profileMap[p.user_id] = p;
        });
      }
    }

    // Mapear para o formato esperado pelo frontend
    const network = networkRelations.map((relation) => {
      const profile = profileMap[relation.referred_id] || {};
      return {
        id: relation.id,
        referred_id: relation.referred_id,
        referred_name: profile.full_name || 'N/A',
        referred_email: profile.email || '',
        level: relation.level || 1,
        referral_code: relation.referral_code || profile.referral_code || '',
        status: relation.status,
        created_at: relation.created_at
      };
    });

    // Buscar investments dos membros da rede
    let indirectInvestments = {};
    if (referredIds.length > 0) {
      const { data: investments, error: invError } = await req.supabase
        .from('investments')
        .select('*')
        .in('user_id', referredIds)
        .eq('status', 'active');

      if (!invError && investments) {
        investments.forEach(inv => {
          indirectInvestments[inv.user_id] = inv;
        });
      }
    }

    res.json({
      network: network || [],
      indirectInvestments
    });

  } catch (error) {
    console.error('Erro no endpoint network:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// @route   GET /api/financial/plans
// @desc    Buscar planos disponíveis
// @access  Private
router.get('/plans', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Verificar se usuário é admin
    const { data: profile } = await req.supabase
      .from('profiles')
      .select('role')
      .eq('user_id', userId)
      .single();

    let query = req.supabase
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    // Se não for admin, esconder planos de liderança
    if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
      query = query.eq('is_leadership', false);
    }

    const { data: plans, error } = await query;

    if (error) {
      console.error('Erro ao buscar planos:', error);
      return res.status(500).json({ error: 'Erro ao buscar planos' });
    }

    res.json({ plans: plans || [] });

  } catch (error) {
    console.error('Erro no endpoint plans:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// @route   POST /api/financial/investments
// @desc    Criar novo investimento
// @access  Private
router.post('/investments', async (req, res) => {
  try {
    const userId = req.user.id;
    const { plan_slug, amount, client_share = 50, company_share = 50, daily_yield = 0.01 } = req.body;

    if (!plan_slug || !amount) {
      return res.status(400).json({ error: 'Plano e valor são obrigatórios' });
    }

    // Verificar saldo
    const { data: balance } = await req.supabase.rpc('get_available_balance', { p_user_id: userId });
    if (balance < amount) {
      return res.status(400).json({ error: 'Saldo insuficiente' });
    }

    // Criar investimento
    const { data: investment, error } = await req.supabase
      .from('investments')
      .insert({
        user_id: userId,
        plan_slug,
        amount,
        client_share,
        company_share,
        status: 'active',
        daily_yield,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar investimento:', error);
      return res.status(500).json({ error: 'Erro ao criar investimento' });
    }

    // Deduzir saldo da carteira do usuário
    console.log('💰 Deduzindo saldo do usuário:', userId, 'Valor:', amount);
    
    // Buscar saldo atual
    const { data: currentBalance, error: balanceFetchError } = await req.supabase
      .from('wallet_balances')
      .select('wallet_balance')
      .eq('user_id', userId)
      .single();
    
    if (balanceFetchError) {
      console.error('⚠️ Erro ao buscar saldo atual:', balanceFetchError);
    } else {
      const newWalletBalance = (currentBalance?.wallet_balance || 0) - amount;
      
      // Atualizar saldo
      const { error: balanceUpdateError } = await req.supabase
        .from('wallet_balances')
        .update({
          wallet_balance: newWalletBalance,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
      
      if (balanceUpdateError) {
        console.error('❌ Erro ao atualizar saldo:', balanceUpdateError);
      } else {
        console.log('✅ Saldo atualizado! Novo valor:', newWalletBalance);
      }
    }

    // Registrar saída no financial_ledger para deduzir saldo
    const { error: ledgerError } = await req.supabase
      .from('financial_ledger')
      .insert({
        user_id: userId,
        type: 'investment',
        amount: -amount, // Valor negativo (saída)
        description: `Investimento no plano ${plan_slug}`,
        reference_id: investment.id,
        reference_type: 'investment',
        status: 'completed',
        created_at: new Date().toISOString()
      });

    if (ledgerError) {
      console.error('Erro ao registrar no ledger:', ledgerError);
      // Não falhar o investimento se o ledger falhar, apenas logar
    }

    // Gerar comissões para a rede
    console.log('💰 Gerando comissões para investimento:', investment.id, 'usuário:', userId, 'valor:', amount);
    await generateNetworkCommissions(req.supabase, investment);
    console.log('✅ Comissões geradas para investimento:', investment.id);

    res.json({ investment });

  } catch (error) {
    console.error('Erro no endpoint investments POST:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// @route   GET /api/financial/profile
// @desc    Buscar perfil do usuário
// @access  Private
router.get('/profile', async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('🔍 Buscando perfil para userId:', userId);

    const { data: profile, error } = await req.supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Erro ao buscar perfil:', error);
      return res.status(500).json({ error: 'Erro ao buscar perfil' });
    }

    // Se não encontrou perfil, retornar objeto vazio (perfil novo)
    if (!profile) {
      console.log('⚠️ Perfil não encontrado para userId:', userId);
      return res.json({ 
        profile: {
          user_id: userId,
          full_name: req.user.user_metadata?.full_name || '',
          email: req.user.email,
          phone: '',
          document_number: '',
          birth_date: '',
          address: '',
          city: '',
          state: '',
          country: 'Brasil',
          postal_code: '',
          bank_name: '',
          bank_agency: '',
          bank_account: '',
          pix_key: '',
          crypto_wallet: ''
        }
      });
    }

    console.log('✅ Perfil encontrado:', profile.id);
    res.json({ profile });

  } catch (error) {
    console.error('Erro no endpoint profile:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// @route   PUT /api/financial/profile
// @desc    Atualizar perfil do usuário
// @access  Private
router.put('/profile', async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;
    console.log('💾 Atualizando perfil para userId:', userId, 'Dados:', updates);

    // Campos permitidos para atualização
    const allowedFields = [
      'full_name', 'phone', 'document_number', 'birth_date', 
      'address', 'city', 'state', 'country', 'postal_code',
      'bank_name', 'bank_agency', 'bank_account', 'pix_key', 'crypto_wallet'
    ];

    const filteredUpdates = {};
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    });

    filteredUpdates.updated_at = new Date().toISOString();

    // Verificar se perfil existe
    const { data: existingProfile } = await req.supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .single();

    let result;
    if (existingProfile) {
      // Atualizar perfil existente
      result = await req.supabase
        .from('profiles')
        .update(filteredUpdates)
        .eq('user_id', userId)
        .select()
        .single();
    } else {
      // Criar novo perfil
      result = await req.supabase
        .from('profiles')
        .insert({
          user_id: userId,
          ...filteredUpdates,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
    }

    if (result.error) {
      console.error('Erro ao salvar perfil:', result.error);
      return res.status(500).json({ error: 'Erro ao salvar perfil' });
    }

    console.log('✅ Perfil salvo com sucesso:', result.data?.id);
    res.json({ profile: result.data });

  } catch (error) {
    console.error('Erro no endpoint profile PUT:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// @route   GET /api/financial/referral
// @desc    Buscar código de indicação do usuário
// @access  Private
router.get('/referral', async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('🔍 Buscando referral para userId:', userId);

    const { data: profile, error } = await req.supabase
      .from('profiles')
      .select('referral_code, full_name')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao buscar referral:', error);
      return res.status(500).json({ error: 'Erro ao buscar código de indicação' });
    }

    let referralCode = profile?.referral_code;
    let fullName = profile?.full_name || req.user.user_metadata?.full_name || req.user.email?.split('@')[0];

    // Se não tiver código, gerar um
    if (!referralCode) {
      referralCode = (fullName?.replace(/\s+/g, '').toUpperCase().slice(0, 4) || 'USER') +
        Math.random().toString(36).substring(2, 7).toUpperCase();

      // Criar ou atualizar perfil com o código
      if (profile) {
        await req.supabase
          .from('profiles')
          .update({ referral_code: referralCode })
          .eq('user_id', userId);
      } else {
        await req.supabase
          .from('profiles')
          .insert({
            user_id: userId,
            referral_code: referralCode,
            full_name: fullName,
            created_at: new Date().toISOString()
          });
      }
    }

    const origin = req.headers.origin || process.env.FRONTEND_URL || 'http://localhost:5173';
    const referralLink = `${origin}/register?ref=${referralCode}`;

    console.log('✅ Referral gerado:', referralCode);
    res.json({ 
      referral_code: referralCode,
      referral_link: referralLink
    });

  } catch (error) {
    console.error('Erro no endpoint referral:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// @route   GET /api/financial/admin/check-network-schema
// @desc    Verificar schema da tabela network_relations
// @access  Admin
router.get('/admin/check-network-schema', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Verificar se é admin
    const { data: profile } = await req.supabase
      .from('profiles')
      .select('role')
      .eq('user_id', userId)
      .single();
    
    if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Tentar buscar uma linha para ver o schema
    const { data: sample, error } = await req.supabase
      .from('network_relations')
      .select('*')
      .limit(1);

    if (error) {
      return res.json({ 
        error: error.message,
        hint: 'Tabela pode não existir ou sem permissão'
      });
    }

    // Se tem dados, mostrar as colunas
    if (sample && sample.length > 0) {
      return res.json({
        columns: Object.keys(sample[0]),
        sample: sample[0]
      });
    }

    // Tabela vazia, tentar descobrir colunas via information_schema
    const { data: columns, error: colError } = await req.supabase
      .rpc('get_table_columns', { table_name: 'network_relations' });

    if (colError) {
      return res.json({
        message: 'Tabela existe mas está vazia',
        sampleColumns: ['id', 'user_id', 'referee_id', 'level', 'created_at'], // chutes comuns
        note: 'Não foi possível detectar colunas automaticamente'
      });
    }

    res.json({ columns });

  } catch (error) {
    console.error('Erro ao verificar schema:', error);
    res.status(500).json({ error: 'Erro interno', details: error.message });
  }
});
// @desc    Migrar dados de profiles para network_relations (admin only)
// @access  Admin
router.post('/admin/migrate-network-relations', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Verificar se é admin
    const { data: profile } = await req.supabase
      .from('profiles')
      .select('role')
      .eq('user_id', userId)
      .single();
    
    if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    console.log('🚀 Iniciando migração de network_relations...');

    // Buscar todos os perfis que têm referred_by (foram indicados por alguém)
    const { data: profilesWithReferrer, error: profilesError } = await req.supabase
      .from('profiles')
      .select('user_id, referred_by, referral_code, created_at')
      .not('referred_by', 'is', null);

    if (profilesError) {
      console.error('Erro ao buscar profiles:', profilesError);
      return res.status(500).json({ error: 'Erro ao buscar profiles', details: profilesError.message });
    }

    console.log(`📊 Encontrados ${profilesWithReferrer?.length || 0} perfis com indicador`);

    if (!profilesWithReferrer || profilesWithReferrer.length === 0) {
      return res.json({ message: 'Nenhum perfil com referred_by encontrado', migrated: 0 });
    }

    // Buscar referral codes existentes para mapear referrer_id
    const { data: allProfiles, error: allProfilesError } = await req.supabase
      .from('profiles')
      .select('user_id, referral_code');

    if (allProfilesError) {
      console.error('Erro ao buscar todos os profiles:', allProfilesError);
      return res.status(500).json({ error: 'Erro ao buscar profiles para mapeamento' });
    }

    // Criar mapa de referral_code -> user_id
    const referralCodeToUserId = {};
    allProfiles.forEach(p => {
      if (p.referral_code) {
        referralCodeToUserId[p.referral_code] = p.user_id;
      }
    });

    // Inserir registros em network_relations
    let migrated = 0;
    let errors = 0;
    const errorDetails = [];

    for (const profile of profilesWithReferrer) {
      try {
        // Buscar dados do referrer (quem indicou)
        const referrerProfile = allProfiles.find(p => p.user_id === profile.referred_by);
        
        const referrerId = profile.referred_by;
        const referredId = profile.user_id;

        // Verificar se já existe esta relação
        const { data: existing } = await req.supabase
          .from('network_relations')
          .select('id')
          .eq('user_id', referrerId)
          .eq('referred_id', referredId)
          .single();

        if (existing) {
          console.log(`⏭️  Relação já existe: ${referrerId} -> ${referredId}`);
          continue;
        }

        // Criar relação
        const { error: insertError } = await req.supabase
          .from('network_relations')
          .insert({
            user_id: referrerId,
            user_email: referrerProfile?.email || '',
            user_name: referrerProfile?.full_name || '',
            referred_id: referredId,
            referred_email: profile.email || '',
            referred_name: profile.full_name || '',
            level: 1,
            status: 'active',
            total_generated: 0,
            created_at: profile.created_at || new Date().toISOString()
          });

        if (insertError) {
          console.error(`❌ Erro ao inserir relação ${referrerId} -> ${referredId}:`, insertError);
          errors++;
          errorDetails.push({ referrerId, referredId, error: insertError.message });
        } else {
          migrated++;
          console.log(`✅ Relação criada: ${referrerId} -> ${referredId}`);
        }
      } catch (err) {
        console.error(`❌ Erro ao processar perfil ${profile.user_id}:`, err);
        errors++;
        errorDetails.push({ profile: profile.user_id, error: err.message });
      }
    }

    res.json({
      message: 'Migração concluída',
      totalProcessed: profilesWithReferrer.length,
      migrated,
      errors,
      errorDetails: errorDetails.slice(0, 10) // Limitar detalhes
    });

  } catch (error) {
    console.error('Erro na migração:', error);
    res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
  }
});

// @route   POST /api/financial/admin/create-multi-level-relations
// @desc    Criar relações de nível 2-5 baseado na cadeia de indicações
// @access  Admin
router.post('/admin/create-multi-level-relations', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Verificar se é admin
    const { data: profile } = await req.supabase
      .from('profiles')
      .select('role')
      .eq('user_id', userId)
      .single();
    
    if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    console.log('🚀 Criando relações multi-nível...');

    // Buscar todas as relações nível 1
    const { data: level1Relations, error } = await req.supabase
      .from('network_relations')
      .select('*')
      .eq('level', 1);

    if (error) {
      return res.status(500).json({ error: 'Erro ao buscar relações nível 1' });
    }

    // Criar mapa de user_id -> referrer_id (referred_id -> user_id)
    const userToReferrer = {};
    level1Relations.forEach(r => {
      userToReferrer[r.referred_id] = r.user_id;
    });

    let created = 0;
    let errors = 0;

    // Para cada usuário, calcular a cadeia até o topo
    for (const userId of Object.keys(userToReferrer)) {
      let currentUserId = userId;
      let level = 1;
      const chain = [];

      // Construir cadeia de referência
      while (userToReferrer[currentUserId] && level < 5) {
        const referrerId = userToReferrer[currentUserId];
        level++;
        chain.push({ referred_id: userId, user_id: referrerId, level });
        currentUserId = referrerId;
      }

      // Inserir relações de nível 2-5
      for (const relation of chain.slice(1)) { // Skip level 1 (já existe)
        try {
          const { data: existing } = await req.supabase
            .from('network_relations')
            .select('id')
            .eq('user_id', relation.user_id)
            .eq('referred_id', relation.referred_id)
            .eq('level', relation.level)
            .single();

          if (existing) continue;

          const { error: insertError } = await req.supabase
            .from('network_relations')
            .insert({
              user_id: relation.user_id,
              user_email: relation.user_email,
              user_name: relation.user_name,
              referred_id: relation.referred_id,
              level: relation.level,
              status: 'active',
              total_generated: 0,
              created_at: new Date().toISOString()
            });

          if (insertError) {
            errors++;
          } else {
            created++;
          }
        } catch (err) {
          errors++;
        }
      }
    }

    res.json({
      message: 'Relações multi-nível criadas',
      created,
      errors
    });

  } catch (error) {
    console.error('Erro ao criar relações multi-nível:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});
// @route   GET /api/financial/commissions
// @desc    Buscar comissões do usuário
// @access  Private
router.get('/commissions', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const { data: commissions, error } = await req.supabase
      .from('commissions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar comissões:', error);
      return res.status(500).json({ error: 'Erro ao buscar comissões', details: error.message });
    }

    res.json({ commissions: commissions || [] });

  } catch (error) {
    console.error('Erro no endpoint commissions:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// @route   GET /api/financial/admin/check-commissions
// @desc    Verificar todas as comissões (admin)
// @access  Admin
router.get('/admin/check-commissions', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Verificar se é admin
    const { data: profile } = await req.supabase
      .from('profiles')
      .select('role')
      .eq('user_id', userId)
      .single();
    
    if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const { data: commissions, error, count } = await req.supabase
      .from('commissions')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return res.status(500).json({ error: 'Erro ao buscar comissões', details: error.message });
    }

    // Verificar schema da tabela
    const { data: sample } = await req.supabase
      .from('commissions')
      .select('*')
      .limit(1);

    res.json({ 
      count,
      commissions: commissions || [],
      sampleColumns: sample && sample.length > 0 ? Object.keys(sample[0]) : null
    });

  } catch (error) {
    console.error('Erro ao verificar comissões:', error);
    res.status(500).json({ error: 'Erro interno', details: error.message });
  }
});

async function generateNetworkCommissions(supabase, investment) {
  try {
    console.log('🚀 Iniciando generateNetworkCommissions para investimento:', investment.id);
    
    const investmentAmount = parseFloat(investment.amount);
    let currentUserId = investment.user_id;
    let level = 1;
    const maxLevels = 5;
    const commissionRates = { 1: 0.10, 2: 0.05, 3: 0.03, 4: 0.02, 5: 0.01 };

    console.log('📊 Valor do investimento:', investmentAmount, 'Usuário:', currentUserId);

    while (level <= maxLevels) {
      console.log(`🔍 Buscando perfil para nível ${level}, userId:`, currentUserId);
      
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('referred_by')
        .eq('user_id', currentUserId)
        .single();

      if (profileError) {
        console.error(`❌ Erro ao buscar perfil nível ${level}:`, profileError);
        break;
      }

      if (!userProfile?.referred_by) {
        console.log(`⚠️ Sem referred_by encontrado no nível ${level} para user:`, currentUserId);
        break;
      }

      const referrerId = userProfile.referred_by;
      const commissionRate = commissionRates[level] || 0;
      const commissionAmount = parseFloat((investmentAmount * commissionRate).toFixed(2));

      console.log(`💵 Nível ${level}: referrerId=${referrerId}, rate=${commissionRate}, amount=${commissionAmount}`);

      if (commissionAmount > 0) {
        const { error: insertError } = await supabase.from('commissions').insert({
          user_id: referrerId,
          source_user_id: investment.user_id,
          investment_id: investment.id,
          amount: commissionAmount,
          percentage: commissionRate * 100,
          commission_type: level === 1 ? 'direct' : 'residual',
          level: level,
          status: 'pending',
          created_at: new Date().toISOString()
        });

        if (insertError) {
          console.error(`❌ Erro ao inserir comissão nível ${level}:`, insertError);
        } else {
          console.log(`✅ Comissão nível ${level} criada: ${commissionAmount} para ${referrerId}`);
        }
      }

      currentUserId = referrerId;
      level++;
    }
    
    console.log('🏁 generateNetworkCommissions concluído para investimento:', investment.id);
  } catch (err) {
    console.error('❌ Erro ao gerar comissões:', err);
  }
}

module.exports = router;
