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

    const users = await base44.asServiceRole.entities.User.filter({ email: user_email });
    if (users.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = users[0];
    const investments = await base44.asServiceRole.entities.Investment.filter({ user_id: userData.id });

    return Response.json({ 
      user: { id: userData.id, email: userData.email, name: userData.full_name },
      investments: investments.map(inv => ({
        id: inv.id,
        plan: inv.plan,
        amount: inv.amount,
        status: inv.status,
        created_date: inv.created_date
      }))
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});