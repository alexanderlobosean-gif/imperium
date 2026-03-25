import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user data
    const userData = await base44.entities.User.filter({ email: user.email });
    if (userData.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }
    const userRecord = userData[0];

    // Get all transactions for this user
    const allTransactions = await base44.asServiceRole.entities.Transaction.filter({ user_id: user.id });

    // Sort by date descending
    const sortedTransactions = allTransactions.sort((a, b) => {
      const dateA = new Date(a.created_date || 0);
      const dateB = new Date(b.created_date || 0);
      return dateB - dateA;
    });

    // Calculate running balance
    let runningBalance = 0;
    const transactionLog = sortedTransactions.map(tx => {
      const isCredit = ['deposit', 'yield', 'network_bonus', 'referral_bonus', 'career_bonus'].includes(tx.type);
      const amount = isCredit ? tx.amount : -tx.amount;
      runningBalance += amount;
      return {
        date: tx.created_date,
        type: tx.type,
        amount: tx.amount,
        net_amount: tx.net_amount,
        fee: tx.fee,
        status: tx.status,
        description: tx.description,
        direction: isCredit ? '+' : '-',
        running_balance: runningBalance,
      };
    }).reverse(); // Reverse to show oldest first

    return Response.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        current_balance: userRecord.available_balance,
        total_invested: userRecord.total_invested,
        total_earnings: userRecord.total_earnings,
      },
      transactions: transactionLog,
      total_transactions: allTransactions.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});