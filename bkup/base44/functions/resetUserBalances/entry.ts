import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (user?.role !== 'admin') {
            return Response.json({ error: 'Acesso negado. Apenas admins.' }, { status: 403 });
        }

        const users = await base44.asServiceRole.entities.User.list();

        let updated = 0;
        for (const u of users) {
            await base44.asServiceRole.entities.User.update(u.id, {
                total_earnings: 0,
            });
            updated++;
        }

        return Response.json({ success: true, updated });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});