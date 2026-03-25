import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { user_email } = await req.json();
    if (!user_email) {
      return Response.json({ error: 'user_email required' }, { status: 400 });
    }

    // Get user
    const userData = await base44.asServiceRole.entities.User.filter({ email: user_email });
    if (userData.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }
    const userRecord = userData[0];

    // Get all transactions
    const allTransactions = await base44.asServiceRole.entities.Transaction.filter({ user_id: userRecord.id });

    // Calculate correct balance from transactions
    let calculatedBalance = 0;
    allTransactions.forEach(tx => {
      const isCredit = ['deposit', 'yield', 'network_bonus', 'referral_bonus', 'career_bonus'].includes(tx.type);
      if (isCredit) {
        calculatedBalance += tx.amount;
      } else {
        calculatedBalance -= tx.amount;
      }
    });

    const oldBalance = userRecord.available_balance;
    const newBalance = Math.max(0, calculatedBalance);

    // Update user balance
    await base44.asServiceRole.entities.User.update(userRecord.id, {
      available_balance: newBalance,
    });

    return Response.json({
      success: true,
      user_email: user_email,
      old_balance: oldBalance,
      new_balance: newBalance,
      calculated_from_transactions: calculatedBalance,
      difference: oldBalance - newBalance,
      total_transactions: allTransactions.length,
      message: `Saldo corrigido de $${oldBalance.toFixed(2)} para $${newBalance.toFixed(2)}`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});