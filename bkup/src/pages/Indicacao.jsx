import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Copy, CheckCheck, Users, Share2, Link } from 'lucide-react';
import { toast } from 'sonner';

export default function Indicacao() {
  const { user, setUser } = useAuth();
  const [copied, setCopied] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);

  useEffect(() => {
    if (user && !user.referral_code) {
      generateReferralCode();
    }
  }, [user]);

  const generateReferralCode = async () => {
    if (generatingCode) return;
    setGeneratingCode(true);
    try {
      const code = (user.full_name?.replace(/\s+/g, '').toUpperCase().slice(0, 4) || 'USER') +
        Math.random().toString(36).substring(2, 7).toUpperCase();
      await base44.auth.updateMe({ referral_code: code });
      window.location.reload();
    } catch (e) {
      toast.error('Erro ao gerar código de indicação');
    } finally {
      setGeneratingCode(false);
    }
  };

  const referralLink = user?.referral_code
    ? `${window.location.origin}?ref=${user.referral_code}`
    : '';

  const handleCopy = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success('Link copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: 'Imperium Club', text: 'Entre na plataforma pelo meu link!', url: referralLink });
    } else {
      handleCopy();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Indicação</h1>
        <p className="text-sm text-muted-foreground mt-1">Compartilhe seu link e ganhe bônus por cada indicado</p>
      </div>

      {/* Card do link */}
      <div className="rounded-xl border border-gold/30 bg-gradient-to-br from-gold/10 to-transparent p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gold/10 border border-gold/20">
            <Link className="w-6 h-6 text-gold" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Seu Link de Indicação</p>
            <p className="text-xs text-muted-foreground">Compartilhe com amigos e ganhe 10% de bônus</p>
          </div>
        </div>

        {generatingCode ? (
          <p className="text-sm text-gold text-center py-4 animate-pulse">Gerando seu código...</p>
        ) : referralLink ? (
          <>
            <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary border border-border">
              <span className="text-sm text-gold font-mono truncate flex-1">{referralLink}</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCopy}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gold/10 border border-gold/30 hover:bg-gold/20 transition text-gold font-medium text-sm"
              >
                {copied ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copiado!' : 'Copiar Link'}
              </button>
              <button
                onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-green-500/10 border border-green-500/30 hover:bg-green-500/20 transition text-green-400 font-medium text-sm"
              >
                <Share2 className="w-4 h-4" />
                Compartilhar
              </button>
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Seu código de indicação ainda não foi gerado
          </p>
        )}
      </div>

      {/* Código de indicação */}
      {user?.referral_code && (
        <div className="rounded-xl border border-border bg-card p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Seu Código</p>
            <p className="text-2xl font-bold gold-text mt-1">{user.referral_code}</p>
          </div>
          <button
            onClick={() => { navigator.clipboard.writeText(user.referral_code); toast.success('Código copiado!'); }}
            className="p-3 rounded-lg bg-gold/10 hover:bg-gold/20 transition border border-gold/20"
          >
            <Copy className="w-5 h-5 text-gold" />
          </button>
        </div>
      )}

      {/* Info bônus */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Users className="w-4 h-4 text-purple-400" />
          Como funciona
        </h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <span className="text-gold font-bold mt-0.5">1.</span>
            <p>Compartilhe seu link com amigos e conhecidos.</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-gold font-bold mt-0.5">2.</span>
            <p>Quando seu indicado fizer um investimento, você recebe <span className="text-gold font-semibold">10% de bônus</span> sobre o valor aportado.</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-gold font-bold mt-0.5">3.</span>
            <p>Além disso, você ganha comissões residuais de até 20 níveis de profundidade.</p>
          </div>
        </div>
      </div>
    </div>
  );
}