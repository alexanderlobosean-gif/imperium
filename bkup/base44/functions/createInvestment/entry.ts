import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();
    const { amount, plan } = data;

    if (!amount || !plan) {
      return Response.json({ error: 'amount and plan required' }, { status: 400 });
    }

    // Get user's own record (no need to filter, we have the authenticated user)
    const userRecord = await base44.auth.me();
    const availableBalance = userRecord.available_balance || 0;

    // Validate balance
    if (amount > availableBalance) {
      return Response.json({ 
        error: `Saldo de depósito insuficiente. Disponível: $${availableBalance}` 
      }, { status: 400 });
    }

    // Create activation date
    const activationDate = new Date();
    activationDate.setHours(activationDate.getHours() + 24);

    // Create investment
    const investment = await base44.asServiceRole.entities.Investment.create({
      user_id: user.id,
      user_email: user.email,
      user_name: user.full_name,
      plan: plan,
      amount: amount,
      status: 'active',
      deposit_confirmed: true,
      activation_date: activationDate.toISOString(),
      base_rate: data.base_rate || 0,
      current_daily_rate: data.current_daily_rate || 0.2,
      earning_cap: amount * 3,
      client_share: data.client_share || 0,
      company_share: data.company_share || 0,
      unlocked_levels: data.unlocked_levels || 0,
    });

    // Update user: deduct balance and add to invested
    await base44.asServiceRole.entities.User.update(userRecord.id, {
      available_balance: Math.max(0, availableBalance - amount),
      total_invested: (userRecord.total_invested || 0) + amount,
    });

    // Create transaction record
    await base44.asServiceRole.entities.Transaction.create({
      user_id: user.id,
      user_email: user.email,
      user_name: user.full_name,
      type: 'reinvestment',
      amount: amount,
      net_amount: amount,
      fee: 0,
      status: 'completed',
      description: `Investimento no plano ${plan} - $${amount}`,
      investment_id: investment.id,
    });

    // Handle referral bonus
    try {
      const relations = await base44.asServiceRole.entities.NetworkRelation.filter({ 
        referred_id: user.id, 
        level: 1 
      });

      if (relations.length > 0) {
        const relation = relations[0];
        if (relation.user_id && relation.user_id !== user.id) {
          const bonusAmount = amount * 0.10;

          // Create bonus transaction
          await base44.asServiceRole.entities.Transaction.create({
            user_id: relation.user_id,
            user_email: relation.user_email,
            user_name: relation.user_name,
            type: 'referral_bonus',
            amount: bonusAmount,
            net_amount: bonusAmount,
            status: 'completed',
            related_user_id: user.id,
            description: `Bônus de indicação direta (10%) — plano ${plan} de ${user.full_name}: $${amount}`,
          });

          // Update referrer
          const referrers = await base44.asServiceRole.entities.User.filter({ email: relation.user_email });
          if (referrers.length > 0) {
            const referrer = referrers[0];
            await base44.asServiceRole.entities.User.update(referrer.id, {
              total_earnings: (referrer.total_earnings || 0) + bonusAmount,
            });
          }

          // Update network relation
          await base44.asServiceRole.entities.NetworkRelation.update(relation.id, {
            total_generated: (relation.total_generated || 0) + bonusAmount,
          });
        }
      }
    } catch (e) {
      console.log('Referral bonus error (non-fatal):', e.message);
    }

    return Response.json({ 
      success: true, 
      investment: {
        id: investment.id,
        amount: investment.amount,
        plan: investment.plan,
        activation_date: investment.activation_date,
        unlocked_levels: investment.unlocked_levels,
      }
    });
  } catch (error) {
    console.error('Investment creation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});