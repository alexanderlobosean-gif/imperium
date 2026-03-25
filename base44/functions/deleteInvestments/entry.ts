import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { user_email, amount } = await req.json();
    if (!user_email || !amount) {
      return Response.json({ error: 'user_email and amount required' }, { status: 400 });
    }

    // Find the user
    const users = await base44.asServiceRole.entities.User.filter({ email: user_email });
    if (users.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }
    const userData = users[0];

    // Find all investments of this amount for this user
    const investments = await base44.asServiceRole.entities.Investment.filter({ 
      user_id: userData.id,
      amount: amount 
    });

    if (investments.length === 0) {
      return Response.json({ error: 'No investments found with this amount' }, { status: 404 });
    }

    // Delete each investment
    for (const inv of investments) {
      await base44.asServiceRole.entities.Investment.delete(inv.id);
    }

    // Subtract from total_invested and available_balance
    const totalDeleted = amount * investments.length;
    await base44.asServiceRole.entities.User.update(userData.id, {
      total_invested: Math.max(0, (userData.total_invested || 0) - totalDeleted),
      available_balance: Math.max(0, (userData.available_balance || 0) - totalDeleted),
    });

    // Delete all related transactions
    const allTransactions = await base44.asServiceRole.entities.Transaction.filter({ user_id: userData.id });
    
    for (const inv of investments) {
      // Delete transaction by investment_id
      const invTransactions = allTransactions.filter(tx => tx.investment_id === inv.id);
      for (const tx of invTransactions) {
        try {
          await base44.asServiceRole.entities.Transaction.delete(tx.id);
        } catch (e) {
          // Ignore if transaction already deleted
        }
      }
    }
    
    // Delete reinvestment transactions by amount
    const reinvestmentTxs = allTransactions.filter(tx => tx.type === 'reinvestment' && tx.amount === amount);
    for (const tx of reinvestmentTxs) {
      try {
        await base44.asServiceRole.entities.Transaction.delete(tx.id);
      } catch (e) {
        // Ignore if transaction already deleted
      }
    }

    return Response.json({ 
      success: true, 
      message: `Deletados ${investments.length} investimentos de ${amount} cada.`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});