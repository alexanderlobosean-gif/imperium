import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import ForexBackground from '@/components/register/ForexBackground';

export default function Register() {
  const [refCode, setRefCode] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Se já está autenticado, redireciona para o painel
    base44.auth.isAuthenticated().then((authenticated) => {
      if (authenticated) {
        window.location.href = '/';
      }
    });

    const params = new URLSearchParams(window.location.search);
    // Google Translate can alter 'ref' to 'ref__' in the URL
    const ref = params.get('ref') || params.get('ref__') || params.get('ref_');
    if (ref) setRefCode(ref);

    // After signup, Base44 redirects back with is_new_user=true — user is already authenticated
    if (params.get('is_new_user') === 'true') {
      localStorage.setItem('just_registered', 'true');
      // Save ref from URL param (takes priority) or keep existing localStorage value
      const refFromUrl = ref || localStorage.getItem('referral_code');
      if (refFromUrl) localStorage.setItem('referral_code', refFromUrl);
      toast.success('🎉 Cadastro realizado com sucesso! Bem-vindo ao Imperium Club!', { duration: 4000 });
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    }
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Store ref code and redirect to login/register
      if (refCode) {
        localStorage.setItem('referral_code', refCode);
      }
      localStorage.setItem('just_registered', 'true');
      // Pass current URL (with ref param) as nextUrl so it comes back here after signup
      const nextUrl = `${window.location.origin}/register?ref=${refCode || ''}&is_new_user=true`;
      base44.auth.redirectToLogin(nextUrl);
    } catch (err) {
      toast.error('Erro ao redirecionar para o cadastro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <ForexBackground />
      <div className="w-full max-w-md space-y-8 relative" style={{ zIndex: 1 }}>
        {/* Logo / Header */}
        <div className="text-center">
          <img
            src="https://media.base44.com/images/public/69bcddfc28650d09db51b757/9cca35104_PackagingBusinessInstagramProfilePictureinBrightRedBlackBoldStyle1.png"
            alt="Imperium Club"
            className="w-80 h-80 mx-auto object-contain drop-shadow-2xl"
          />
          <p className="text-3xl font-extrabold text-white tracking-widest uppercase mt-3">CADASTRE-SE</p>
          <p className="text-muted-foreground text-sm mt-1">Crie sua conta e comece a investir</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gold/20 bg-card p-8 space-y-6 gold-glow">
          {refCode && (
            <div className="p-3 rounded-xl bg-gold/10 border border-gold/20 text-center">
              <p className="text-xs text-muted-foreground">Você foi indicado por</p>
              <p className="text-sm font-bold gold-text mt-0.5">{refCode}</p>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            {refCode && (
              <div>
                <label className="text-sm font-medium text-foreground">Código de Indicação</label>
                <Input
                  value={refCode}
                  readOnly
                  className="mt-1 bg-secondary border-border text-gold font-mono"
                />
              </div>
            )}

            <div className="p-4 rounded-xl bg-secondary/50 border border-border text-sm text-muted-foreground space-y-2">
              <p className="font-semibold text-foreground">Como criar sua conta:</p>
              <div className="flex items-start gap-2">
                <span className="text-gold font-bold flex-shrink-0">1.</span>
                <p>Clique em <span className="text-foreground font-semibold">"Criar Conta"</span> abaixo.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-gold font-bold flex-shrink-0">2.</span>
                <p>Na próxima tela, clique em <span className="text-gold font-bold">"Need an account? Sign up"</span> para criar seu cadastro.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-gold font-bold flex-shrink-0">3.</span>
                <p>Preencha seu email e crie uma senha. Seu código de indicação será vinculado automaticamente.</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-400 text-center">
              ⚠️ Na tela seguinte, clique em <strong>"Sign up"</strong> — não em "Sign in"!
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gold hover:bg-gold-hover text-primary-foreground font-semibold py-3 text-base"
            >
              {loading ? 'Redirecionando...' : 'Criar Conta'}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            Já tem uma conta?{' '}
            <button
              onClick={() => base44.auth.redirectToLogin()}
              className="text-gold hover:underline"
            >
              Entrar
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}