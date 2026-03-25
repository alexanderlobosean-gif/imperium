import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { name_search } = await req.json();
    if (!name_search) {
      return Response.json({ error: 'name_search required' }, { status: 400 });
    }

    const allUsers = await base44.asServiceRole.entities.User.list();
    const matching = allUsers.filter(u => 
      u.full_name?.toLowerCase().includes(name_search.toLowerCase()) ||
      u.email?.toLowerCase().includes(name_search.toLowerCase())
    );

    return Response.json({ 
      matching: matching.map(u => ({
        id: u.id,
        full_name: u.full_name,
        email: u.email
      }))
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});