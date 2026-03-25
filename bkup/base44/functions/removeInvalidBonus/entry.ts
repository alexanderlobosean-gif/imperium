import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { user_email, bonus_amount } = await req.json();
    if (!user_email || !bonus_amount) {
      return Response.json({ error: 'user_email and bonus_amount required' }, { status: 400 });
    }

    // Find the user
    const targetUsers = await base44.asServiceRole.entities.User.filter({ email: user_email });
    if (targetUsers.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }
    const targetUser = targetUsers[0];

    // Find the invalid referral_bonus transaction (self-referral)
    const transactions = await base44.asServiceRole.entities.Transaction.filter({
      user_id: targetUser.id,
      type: 'referral_bonus',
    });

    // Find the transaction matching the bonus amount
    const invalidTx = transactions.find(tx => tx.amount === bonus_amount);
    if (!invalidTx) {
      return Response.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Delete the transaction
    await base44.asServiceRole.entities.Transaction.delete(invalidTx.id);

    // Update user's total_earnings
    await base44.asServiceRole.entities.User.update(targetUser.id, {
      total_earnings: Math.max(0, (targetUser.total_earnings || 0) - bonus_amount),
    });

    // Find and update the NetworkRelation total_generated
    const relations = await base44.asServiceRole.entities.NetworkRelation.filter({
      user_id: targetUser.id,
    });

    for (const relation of relations) {
      if ((relation.total_generated || 0) >= bonus_amount) {
        await base44.asServiceRole.entities.NetworkRelation.update(relation.id, {
          total_generated: (relation.total_generated || 0) - bonus_amount,
        });
      }
    }

    return Response.json({
      success: true,
      message: `Bônus de ${bonus_amount} removido para ${user_email}`,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});