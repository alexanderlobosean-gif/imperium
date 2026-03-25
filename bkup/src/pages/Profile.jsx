import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { User, MapPin, Building2, Wallet } from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    phone: user?.phone || '',
    cpf: user?.cpf || '',
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    zip_code: user?.zip_code || '',
    crypto_wallet: user?.crypto_wallet || '',
    bank_name: user?.bank_name || '',
    bank_agency: user?.bank_agency || '',
    bank_account: user?.bank_account || '',
    pix_key: user?.pix_key || '',
  });

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    await base44.auth.updateMe({ ...form, profile_completed: true });
    toast.success('Perfil atualizado com sucesso!');
    setSaving(false);
  };

  const Field = ({ label, field, placeholder, icon: Icon }) => (
    <div>
      <Label className="text-sm text-muted-foreground flex items-center gap-1.5">
        {Icon && <Icon className="w-3.5 h-3.5" />} {label}
      </Label>
      <Input
        value={form[field]}
        onChange={(e) => handleChange(field, e.target.value)}
        placeholder={placeholder}
        className="mt-1 bg-secondary border-border"
      />
    </div>
  );

  return (
    <div className="space-y-6 max-w-2xl">
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
            <p className="text-sm font-medium text-foreground mt-1">{user?.full_name}</p>
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Email</Label>
            <p className="text-sm font-medium text-foreground mt-1">{user?.email}</p>
          </div>
          <Field label="Telefone" field="phone" placeholder="(00) 00000-0000" icon={User} />
          <Field label="CPF" field="cpf" placeholder="000.000.000-00" icon={User} />
        </div>
      </div>

      {/* Address */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-blue-400" /> Endereço
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Field label="Endereço" field="address" placeholder="Rua, número, complemento" icon={MapPin} />
          </div>
          <Field label="Cidade" field="city" placeholder="Cidade" />
          <Field label="Estado" field="state" placeholder="UF" />
          <Field label="CEP" field="zip_code" placeholder="00000-000" />
        </div>
      </div>

      {/* Bank */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-green-400" /> Dados Bancários
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Banco" field="bank_name" placeholder="Nome do banco" icon={Building2} />
          <Field label="Agência" field="bank_agency" placeholder="0000" />
          <Field label="Conta" field="bank_account" placeholder="00000-0" />
          <Field label="Chave PIX" field="pix_key" placeholder="Chave PIX" />
        </div>
      </div>

      {/* Crypto */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Wallet className="w-4 h-4 text-purple-400" /> Carteira Cripto
        </h3>
        <Field label="Endereço da Carteira" field="crypto_wallet" placeholder="bc1q..." icon={Wallet} />
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