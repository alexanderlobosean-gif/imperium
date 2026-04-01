const express = require('express');
const Joi = require('joi');
const router = express.Router();
const { sendTransferVerificationEmail, generateVerificationCode } = require('../services/emailService');

// Validações
const depositSchema = Joi.object({
  amount: Joi.number().positive().precision(2).required(),
  method: Joi.string().valid('pix', 'credit_card', 'bank_transfer').required(),
  reference: Joi.string().optional()
});

const withdrawalSchema = Joi.object({
  amount: Joi.number().positive().precision(2).required(),
  method: Joi.string().valid('pix', 'bank_transfer').required(),
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

// @route   POST /api/financial/withdrawal
// @desc    Solicitar saque
// @access  Private
router.post('/withdrawal', async (req, res) => {
  try {
    const { error } = withdrawalSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { amount, method, destination_address } = req.body;
    const userId = req.user.id;

    // Verificar saldo disponível
    const { data: availableBalance, error: balanceError } = await req.supabase
      .rpc('get_available_balance', { p_user_id: userId });

    if (balanceError) {
      console.error('Erro ao buscar saldo:', balanceError);
      return res.status(500).json({ error: 'Erro ao verificar saldo' });
    }

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
      console.error('Erro ao criar saque:', withdrawalError);
      return res.status(500).json({ error: 'Erro ao criar saque' });
    }

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
// @desc    Buscar transações do usuário
// @access  Private
router.get('/transactions', async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, type } = req.query;

    const offset = (page - 1) * limit;

    let query = req.supabase
      .from('financial_ledger')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (type) {
      query = query.eq('type', type);
    }

    const { data: transactions, error: transactionsError } = await query;

    if (transactionsError) {
      console.error('Erro ao buscar transações:', transactionsError);
      return res.status(500).json({ error: 'Erro ao buscar transações' });
    }

    res.json({
      transactions: transactions || [],
      page: parseInt(page),
      limit: parseInt(limit)
    });

  } catch (error) {
    console.error('Erro no endpoint transactions:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
