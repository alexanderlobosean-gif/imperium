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

    // Find all reinvestment transactions of this amount
    const allTransactions = await base44.asServiceRole.entities.Transaction.filter({ user_id: userData.id });
    const reinvestmentTxs = allTransactions.filter(tx => tx.type === 'reinvestment' && tx.amount === amount);

    if (reinvestmentTxs.length === 0) {
      return Response.json({ 
        error: 'No reinvestment transactions found with this amount',
        user_email,
        amount,
        allTransactions: allTransactions.map(tx => ({
          type: tx.type,
          amount: tx.amount,
          status: tx.status
        }))
      }, { status: 404 });
    }

    // Delete all reinvestment transactions of this amount
    for (const tx of reinvestmentTxs) {
      try {
        await base44.asServiceRole.entities.Transaction.delete(tx.id);
      } catch (e) {
        console.log(`Failed to delete transaction ${tx.id}:`, e.message);
      }
    }

    // Subtract from total_invested and available_balance
    const totalDeleted = amount * reinvestmentTxs.length;
    await base44.asServiceRole.entities.User.update(userData.id, {
      total_invested: Math.max(0, (userData.total_invested || 0) - totalDeleted),
      available_balance: Math.max(0, (userData.available_balance || 0) - totalDeleted),
    });

    return Response.json({ 
      success: true, 
      message: `Deletadas ${reinvestmentTxs.length} transações de reenvestimento de ${amount} cada (Total: ${totalDeleted})`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});