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

    // Find the user
    const users = await base44.asServiceRole.entities.User.filter({ email: user_email });
    if (users.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }
    const userData = users[0];

    // Find all transactions for this user
    const allTransactions = await base44.asServiceRole.entities.Transaction.filter({ user_id: userData.id });
    
    // Find reinvestment transactions
    const reinvestmentTxs = allTransactions.filter(tx => tx.type === 'reinvestment');

    if (reinvestmentTxs.length === 0) {
      return Response.json({ 
        error: 'No reinvestment transactions found',
        allTransactions: allTransactions.map(tx => ({
          type: tx.type,
          amount: tx.amount,
          status: tx.status
        }))
      }, { status: 404 });
    }

    // Calculate total to subtract
    const totalToSubtract = reinvestmentTxs.reduce((sum, tx) => sum + (tx.amount || 0), 0);

    // Delete all reinvestment transactions
    for (const tx of reinvestmentTxs) {
      try {
        await base44.asServiceRole.entities.Transaction.delete(tx.id);
      } catch (e) {
        console.log(`Failed to delete transaction ${tx.id}:`, e.message);
      }
    }

    // Update user balance
    await base44.asServiceRole.entities.User.update(userData.id, {
      total_invested: Math.max(0, (userData.total_invested || 0) - totalToSubtract),
      available_balance: Math.max(0, (userData.available_balance || 0) - totalToSubtract),
    });

    return Response.json({ 
      success: true, 
      message: `Deletadas ${reinvestmentTxs.length} transações de reenvestimento, Total removido: $${totalToSubtract}`,
      details: reinvestmentTxs.map(tx => ({ amount: tx.amount, status: tx.status }))
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});