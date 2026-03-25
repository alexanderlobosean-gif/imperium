import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { user_email, amount } = await req.json();
    if (!user_email || !amount) {
      return Response.json({ error: 'user_email and amount required' }, { status: 400 });
    }

    // Find the user
    const targetUsers = await base44.asServiceRole.entities.User.filter({ email: user_email });
    if (targetUsers.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }
    const targetUser = targetUsers[0];

    // Find duplicate reinvestment transactions with the same amount
    const transactions = await base44.asServiceRole.entities.Transaction.filter({
      user_id: targetUser.id,
      type: 'reinvestment',
      amount: amount,
    });

    if (transactions.length === 0) {
      return Response.json({ error: 'No transactions found' }, { status: 404 });
    }

    // Delete all duplicates except the first one
    const deletedCount = transactions.length - 1;
    for (let i = 1; i < transactions.length; i++) {
      await base44.asServiceRole.entities.Transaction.delete(transactions[i].id);
    }

    // Restore the user's available_balance by refunding duplicates
    const refundAmount = amount * deletedCount;
    await base44.asServiceRole.entities.User.update(targetUser.id, {
      available_balance: (targetUser.available_balance || 0) + refundAmount,
    });

    return Response.json({
      success: true,
      message: `${deletedCount} transação(ões) duplicada(s) removida(s). Reembolsado: $${refundAmount}`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});