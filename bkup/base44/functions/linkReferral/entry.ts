import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { referral_code } = await req.json();
    if (!referral_code) return Response.json({ error: 'referral_code required' }, { status: 400 });

    // Find the referrer by referral_code
    const referrers = await base44.asServiceRole.entities.User.filter({ referral_code });
    if (referrers.length === 0) return Response.json({ error: 'Referrer not found' }, { status: 404 });

    const referrer = referrers[0];

    // Prevent self-referral
    if (referrer.id === user.id) {
      return Response.json({ error: 'Cannot use your own referral code' }, { status: 400 });
    }

    // Check if level 1 relation already exists
    const existing = await base44.asServiceRole.entities.NetworkRelation.filter({
      user_id: referrer.id,
      referred_id: user.id,
    });

    if (existing.length > 0) {
      return Response.json({ message: 'Relation already exists' });
    }

    // Create level 1 (direct) relation
    await base44.asServiceRole.entities.NetworkRelation.create({
      user_id: referrer.id,
      user_email: referrer.email,
      user_name: referrer.full_name,
      referred_id: user.id,
      referred_email: user.email,
      referred_name: user.full_name,
      level: 1,
      status: 'active',
      total_generated: 0,
    });

    // Propagate up the chain: find all ancestors who have the referrer in their network
    const ancestorRelations = await base44.asServiceRole.entities.NetworkRelation.filter({
      referred_id: referrer.id,
    });

    for (const ancestorRel of ancestorRelations) {
      const alreadyExists = await base44.asServiceRole.entities.NetworkRelation.filter({
        user_id: ancestorRel.user_id,
        referred_id: user.id,
      });
      if (alreadyExists.length === 0) {
        await base44.asServiceRole.entities.NetworkRelation.create({
          user_id: ancestorRel.user_id,
          user_email: ancestorRel.user_email,
          user_name: ancestorRel.user_name,
          referred_id: user.id,
          referred_email: user.email,
          referred_name: user.full_name,
          level: ancestorRel.level + 1,
          status: 'active',
          total_generated: 0,
        });
      }
    }

    return Response.json({ success: true, message: 'Referral linked successfully' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});