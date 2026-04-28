import React from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useAuth } from '@/lib/AuthContext';

export default function Header() {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 w-full h-16 bg-card/80 backdrop-blur-md border-b border-border">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Left side - Mobile menu handled by sidebar */}
        <div className="flex items-center lg:hidden">
          <span className="text-lg font-bold text-gold">Imperium</span>
        </div>

        {/* Center - Title (desktop) */}
        <div className="hidden lg:flex items-center">
          <h1 className="text-lg font-semibold text-foreground">
            {t('nav.dashboard')}
          </h1>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-3">
          {/* Language Switcher */}
          <LanguageSwitcher />
          
          {/* Notifications */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative"
          >
            <Bell className="w-5 h-5 text-muted-foreground" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-gold rounded-full" />
          </Button>

          {/* User avatar */}
          <Button 
            variant="ghost" 
            size="icon"
            className="hidden sm:flex"
          >
            <User className="w-5 h-5 text-muted-foreground" />
          </Button>
        </div>
      </div>
    </header>
  );
}
