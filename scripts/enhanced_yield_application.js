// Enhanced yield application with commission tracking
const applyDailyYieldWithCommissions = async ({ rate }) => {
  // Get all active investments with user referral info
  const { data: investments, error: investmentsError } = await supabase
    .from('investments')
    .select(`
      *,
      profiles!inner(
        user_id,
        full_name,
        email,
        referred_by,
        available_balance,
        total_earned
      )
    `)
    .eq('status', 'active');

  if (investmentsError) throw investmentsError;

  const results = [];
  const today = new Date().toISOString().split('T')[0];

  // Process each investment
  for (const investment of investments) {
    const dailyYield = parseFloat(investment.amount) * parseFloat(rate);
    const clientYield = dailyYield * (investment.client_share / 100);
    const companyYield = dailyYield * (investment.company_share / 100);

    // 1. Create yield record (HISTÓRICO DE RENDIMENTOS)
    const { data: yieldRecord, error: yieldError } = await supabase
      .from('yields')
      .insert({
        investment_id: investment.id,
        user_id: investment.user_id,
        amount: dailyYield,
        rate: parseFloat(rate),
        client_yield: clientYield,
        company_yield: companyYield,
        date: new Date().toISOString()
      })
      .select()
      .single();

    if (yieldError) throw yieldError;

    // 2. Update investment totals
    const { error: updateError } = await supabase
      .from('investments')
      .update({
        daily_yield: dailyYield,
        total_yield: (parseFloat(investment.total_yield || 0) + dailyYield),
        last_yield_calculated: new Date().toISOString()
      })
      .eq('id', investment.id);

    if (updateError) throw updateError;

    // 3. Update user total earned
    const previousBalance = parseFloat(investment.profiles?.total_earned || 0);
    const newBalance = previousBalance + clientYield;

    const { error: userUpdateError } = await supabase
      .from('profiles')
      .update({
        total_earned: newBalance,
        available_balance: (parseFloat(investment.profiles?.available_balance || 0) + clientYield)
      })
      .eq('user_id', investment.user_id);

    if (userUpdateError) throw userUpdateError;

    // 4. Create commission history record
    const { error: historyError } = await supabase
      .from('commission_history')
      .insert({
        commission_id: null, // Will be updated when commission is created
        user_id: investment.user_id,
        amount: clientYield,
        previous_balance: previousBalance,
        new_balance: newBalance,
        description: `Rendimento diário - ${(parseFloat(rate) * 100).toFixed(2)}% sobre ${formatCurrency(investment.amount)}`
      });

    if (historyError) console.warn('History record error:', historyError);

    // 5. Process direct commission if user has referrer
    if (investment.profiles?.referred_by) {
      const directCommissionAmount = clientYield * (investment.direct_commission / 100);
      
      // Get referrer info
      const { data: referrer, error: referrerError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, available_balance, total_earned')
        .eq('user_id', investment.profiles.referred_by)
        .single();

      if (!referrerError && referrer) {
        // Create commission record
        const { data: commissionRecord, error: commissionError } = await supabase
          .from('commissions')
          .insert({
            user_id: referrer.user_id,
            source_user_id: investment.user_id,
            investment_id: investment.id,
            yield_id: yieldRecord.id,
            commission_type: 'direct',
            amount: directCommissionAmount,
            percentage: investment.direct_commission / 100,
            level: 1,
            status: 'paid'
          })
          .select()
          .single();

        if (!commissionError && commissionRecord) {
          // Update referrer's balance
          const referrerPreviousBalance = parseFloat(referrer.total_earned || 0);
          const referrerNewBalance = referrerPreviousBalance + directCommissionAmount;

          await supabase
            .from('profiles')
            .update({
              total_earned: referrerNewBalance,
              available_balance: (parseFloat(referrer.available_balance || 0) + directCommissionAmount)
            })
            .eq('user_id', referrer.user_id);

          // Create commission history for referrer
          await supabase
            .from('commission_history')
            .insert({
              commission_id: commissionRecord.id,
              user_id: referrer.user_id,
              amount: directCommissionAmount,
              previous_balance: referrerPreviousBalance,
              new_balance: referrerNewBalance,
              description: `Comissão direta de ${investment.profiles.full_name} - ${formatCurrency(directCommissionAmount)}`
            });
        }
      }
    }

    // 6. Process residual commissions (if applicable)
    if (investment.residual_levels > 0 && investment.profiles?.referred_by) {
      await processResidualCommissions(investment, yieldRecord.id, clientYield, investment.residual_levels);
    }

    results.push({
      yieldRecord,
      clientYield,
      companyYield,
      investment: investment.profiles?.full_name
    });
  }

  return results;
};

// Process residual commissions up to specified levels
const processResidualCommissions = async (investment, yieldId, baseAmount, maxLevels) => {
  let currentReferrer = investment.profiles?.referred_by;
  let currentLevel = 1;

  while (currentReferrer && currentLevel <= maxLevels) {
    // Get current referrer
    const { data: referrer, error: referrerError } = await supabase
      .from('profiles')
      .select('user_id, full_name, email, referred_by, available_balance, total_earned')
      .eq('user_id', currentReferrer)
      .single();

    if (referrerError || !referrer) break;

    // Calculate residual commission rate (decreases by level)
    const residualRate = Math.max(0.01, (investment.direct_commission / 100) * (1 - (currentLevel * 0.2))); // 20% reduction per level
    const commissionAmount = baseAmount * residualRate;

    if (commissionAmount > 0.01) { // Only process if amount is significant
      // Create commission record
      const { data: commissionRecord, error: commissionError } = await supabase
        .from('commissions')
        .insert({
          user_id: referrer.user_id,
          source_user_id: investment.user_id,
          investment_id: investment.id,
          yield_id: yieldId,
          commission_type: 'residual',
          amount: commissionAmount,
          percentage: residualRate,
          level: currentLevel,
          status: 'paid'
        })
        .select()
        .single();

      if (!commissionError && commissionRecord) {
        // Update referrer's balance
        const previousBalance = parseFloat(referrer.total_earned || 0);
        const newBalance = previousBalance + commissionAmount;

        await supabase
          .from('profiles')
          .update({
            total_earned: newBalance,
            available_balance: (parseFloat(referrer.available_balance || 0) + commissionAmount)
          })
          .eq('user_id', referrer.user_id);

        // Create commission history
        await supabase
          .from('commission_history')
          .insert({
            commission_id: commissionRecord.id,
            user_id: referrer.user_id,
            amount: commissionAmount,
            previous_balance: previousBalance,
            new_balance: newBalance,
            description: `Comissão residual nível ${currentLevel} de ${investment.profiles.full_name}`
          });
      }
    }

    // Move to next level
    currentReferrer = referrer.referred_by;
    currentLevel++;
  }
};
