import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Phone, FileText, MapPin, Calendar, Building, CreditCard, Wallet, Globe, Building2 } from 'lucide-react';
import { toast } from 'sonner';

const Field = React.memo(({ label, field, placeholder, icon: Icon, value, onChange }) => (
  <div>
    <Label className="text-sm text-muted-foreground flex items-center gap-1.5">
      {Icon && <Icon className="w-3.5 h-3.5" />} {label}
    </Label>
    <Input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="mt-1 bg-secondary border-border"
    />
  </div>
));

export default function Profile() {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const userIdStr = String(user?.id);
      console.log('Fetching profile for user:', userIdStr);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userIdStr)
        .single();

      if (error) throw error;

      console.log('Profile fetched:', data);
      setProfile(data);
      setForm({
        full_name: data.full_name || '',
        phone: data.phone || '',
        document_number: data.document_number || '',
        birth_date: data.birth_date || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        country: data.country || 'Brasil',
        postal_code: data.postal_code || '',
        bank_name: data.bank_name || '',
        bank_agency: data.bank_agency || '',
        bank_account: data.bank_account || '',
        pix_key: data.pix_key || '',
        crypto_wallet: data.crypto_wallet || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    document_number: '',
    birth_date: '',
    address: '',
    city: '',
    state: '',
    country: 'Brasil',
    postal_code: '',
    bank_name: '',
    bank_agency: '',
    bank_account: '',
    pix_key: '',
    crypto_wallet: ''
  });

  const handleChange = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: form.full_name,
          phone: form.phone,
          document_number: form.document_number,
          birth_date: form.birth_date || null, // Envia null se estiver vazio
          address: form.address,
          city: form.city,
          state: form.state,
          country: form.country,
          postal_code: form.postal_code,
          bank_name: form.bank_name,
          bank_agency: form.bank_agency,
          bank_account: form.bank_account,
          pix_key: form.pix_key,
          crypto_wallet: form.crypto_wallet,
          updated_at: new Date().toISOString()
        })
        .filter('user_id', 'eq', user.id);

      if (error) {
        console.error('Error saving profile:', error);
        toast.error('Erro ao atualizar perfil: ' + error.message);
      } else {
        toast.success('Perfil atualizado com sucesso!');
        fetchProfile(); // Refresh data
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Erro ao atualizar perfil. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Meu Perfil</h1>
        <p className="text-sm text-muted-foreground mt-1">Gerencie suas informações pessoais</p>
      </div>

      {/* Personal info - read only */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-gold" /> Dados Pessoais
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm text-muted-foreground">Nome</Label>
            <p className="text-sm font-medium text-foreground mt-1">{form.full_name || user?.full_name}</p>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Email</Label>
            <p className="text-sm font-medium text-foreground mt-1">{user?.email}</p>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" /> Telefone
            </Label>
            <Input
              value={form.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="(00) 00000-0000"
              className="mt-1 bg-secondary border-border"
            />
          </div>
          <div>
            <Label className="text-sm text-muted-foreground flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> CPF
            </Label>
            <Input
              value={form.document_number}
              onChange={(e) => handleChange('document_number', e.target.value)}
              placeholder="000.000.000-00"
              className="mt-1 bg-secondary border-border"
            />
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-blue-400" /> Endereço
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Label className="text-sm text-muted-foreground flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> Endereço
            </Label>
            <Input
              value={form.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder="Rua, número, complemento"
              className="mt-1 bg-secondary border-border"
            />
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Cidade</Label>
            <Input
              value={form.city}
              onChange={(e) => handleChange('city', e.target.value)}
              placeholder="Cidade"
              className="mt-1 bg-secondary border-border"
            />
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Estado</Label>
            <Input
              value={form.state}
              onChange={(e) => handleChange('state', e.target.value)}
              placeholder="UF"
              className="mt-1 bg-secondary border-border"
            />
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">CEP</Label>
            <Input
              value={form.postal_code}
              onChange={(e) => handleChange('postal_code', e.target.value)}
              placeholder="00000-000"
              className="mt-1 bg-secondary border-border"
            />
          </div>
        </div>
      </div>

      {/* Bank */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-green-400" /> Dados Bancários
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" /> Banco
            </Label>
            <Input
              value={form.bank_name}
              onChange={(e) => handleChange('bank_name', e.target.value)}
              placeholder="Nome do banco"
              className="mt-1 bg-secondary border-border"
            />
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Agência</Label>
            <Input
              value={form.bank_agency}
              onChange={(e) => handleChange('bank_agency', e.target.value)}
              placeholder="0000"
              className="mt-1 bg-secondary border-border"
            />
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Conta</Label>
            <Input
              value={form.bank_account}
              onChange={(e) => handleChange('bank_account', e.target.value)}
              placeholder="00000-0"
              className="mt-1 bg-secondary border-border"
            />
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Chave PIX</Label>
            <Input
              value={form.pix_key}
              onChange={(e) => handleChange('pix_key', e.target.value)}
              placeholder="Chave PIX"
              className="mt-1 bg-secondary border-border"
            />
          </div>
        </div>
      </div>

      {/* Crypto */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Wallet className="w-4 h-4 text-purple-400" /> Carteira Cripto
        </h3>
        <div>
            <Label className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5" /> Endereço da Carteira
            </Label>
            <Input
              value={form.crypto_wallet}
              onChange={(e) => handleChange('crypto_wallet', e.target.value)}
              placeholder="bc1q..."
              className="mt-1 bg-secondary border-border"
            />
          </div>
      </div>

      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-gold hover:bg-gold-hover text-primary-foreground font-semibold"
      >
        {saving ? 'Salvando...' : 'Salvar Perfil'}
      </Button>
    </div>
  );
}