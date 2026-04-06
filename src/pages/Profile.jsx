import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { financialAPI } from '@/services/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
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

  // Buscar perfil via API
  const { data: profileData, isLoading, error } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const data = await financialAPI.getProfile();
      console.log('Profile API response:', data);
      return data.profile;
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (profileData) {
      setForm({
        full_name: profileData.full_name || '',
        phone: profileData.phone || '',
        document_number: profileData.document_number || '',
        birth_date: profileData.birth_date || '',
        address: profileData.address || '',
        city: profileData.city || '',
        state: profileData.state || '',
        country: profileData.country || 'Brasil',
        postal_code: profileData.postal_code || '',
        bank_name: profileData.bank_name || '',
        bank_agency: profileData.bank_agency || '',
        bank_account: profileData.bank_account || '',
        pix_key: profileData.pix_key || '',
        crypto_wallet: profileData.crypto_wallet || ''
      });
    } else if (user) {
      // Fallback para dados do contexto de autenticação
      setForm(prev => ({
        ...prev,
        full_name: user.full_name || prev.full_name,
      }));
    }
  }, [profileData, user]);

  const handleChange = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const updateProfileMutation = useMutation({
    mutationFn: async (formData) => {
      // Remove empty strings for date fields to avoid PostgreSQL errors
      const cleanedData = { ...formData };
      if (cleanedData.birth_date === '') {
        cleanedData.birth_date = null;
      }
      console.log('Saving profile with data:', cleanedData);
      return await financialAPI.updateProfile(cleanedData);
    },
    onSuccess: (data) => {
      console.log('Profile saved successfully:', data);
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
      toast.success('Perfil atualizado com sucesso!');
      setIsEditing(false);
      setShowSuccess(true);
      // Hide success message after 3 seconds
      setTimeout(() => setShowSuccess(false), 3000);
    },
    onError: (error) => {
      console.error('Error saving profile:', error);
      toast.error('Erro ao atualizar perfil: ' + (error.message || 'Tente novamente.'));
    }
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfileMutation.mutateAsync(form);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
      </div>
    );
  }

  if (error) {
    console.error('Error loading profile:', error);
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
              disabled={!isEditing}
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
              disabled={!isEditing}
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
              disabled={!isEditing}
            />
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Cidade</Label>
            <Input
              value={form.city}
              onChange={(e) => handleChange('city', e.target.value)}
              placeholder="Cidade"
              className="mt-1 bg-secondary border-border"
              disabled={!isEditing}
            />
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Estado</Label>
            <Input
              value={form.state}
              onChange={(e) => handleChange('state', e.target.value)}
              placeholder="UF"
              className="mt-1 bg-secondary border-border"
              disabled={!isEditing}
            />
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">CEP</Label>
            <Input
              value={form.postal_code}
              onChange={(e) => handleChange('postal_code', e.target.value)}
              placeholder="00000-000"
              className="mt-1 bg-secondary border-border"
              disabled={!isEditing}
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
              disabled={!isEditing}
            />
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Agência</Label>
            <Input
              value={form.bank_agency}
              onChange={(e) => handleChange('bank_agency', e.target.value)}
              placeholder="0000"
              className="mt-1 bg-secondary border-border"
              disabled={!isEditing}
            />
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Conta</Label>
            <Input
              value={form.bank_account}
              onChange={(e) => handleChange('bank_account', e.target.value)}
              placeholder="00000-0"
              className="mt-1 bg-secondary border-border"
              disabled={!isEditing}
            />
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Chave PIX</Label>
            <Input
              value={form.pix_key}
              onChange={(e) => handleChange('pix_key', e.target.value)}
              placeholder="Chave PIX"
              className="mt-1 bg-secondary border-border"
              disabled={!isEditing}
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
            disabled={!isEditing}
          />
        </div>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-center">
          <p className="text-green-600 font-medium">✓ Dados atualizados com sucesso!</p>
        </div>
      )}

      <div className="flex gap-3">
        {isEditing ? (
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-gold hover:bg-gold-hover text-primary-foreground font-semibold"
          >
            {saving ? 'Salvando...' : 'Salvar Perfil'}
          </Button>
        ) : (
          <Button
            onClick={() => setIsEditing(true)}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
          >
            Editar Perfil
          </Button>
        )}
      </div>
    </div>
  );
}