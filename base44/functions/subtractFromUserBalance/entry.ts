import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { user_email, amount_to_subtract } = await req.json();
    if (!user_email || !amount_to_subtract) {
      return Response.json({ error: 'user_email and amount_to_subtract required' }, { status: 400 });
    }

    // Find the user
    const users = await base44.asServiceRole.entities.User.filter({ email: user_email });
    if (users.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }
    const userData = users[0];

    const oldBalance = userData.available_balance || 0;
    const oldInvested = userData.total_invested || 0;
    const newBalance = Math.max(0, oldBalance - amount_to_subtract);
    const newInvested = Math.max(0, oldInvested - amount_to_subtract);

    // Update user balance
    await base44.asServiceRole.entities.User.update(userData.id, {
      total_invested: newInvested,
      available_balance: newBalance,
    });

    return Response.json({ 
      success: true,
      old_balance: oldBalance,
      new_balance: newBalance,
      amount_subtracted: amount_to_subtract,
      old_total_invested: oldInvested,
      new_total_invested: newInvested
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});