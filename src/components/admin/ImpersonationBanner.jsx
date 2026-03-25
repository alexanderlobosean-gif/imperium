import React from 'react';
import { Eye, X } from 'lucide-react';

export default function ImpersonationBanner({ impersonatedUser, onExit }) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-black px-4 py-2 flex items-center justify-between text-sm font-semibold shadow-lg">
      <div className="flex items-center gap-2">
        <Eye className="w-4 h-4" />
        <span>Visualizando como: <strong>{impersonatedUser.full_name || impersonatedUser.email}</strong> ({impersonatedUser.email})</span>
      </div>
      <button
        onClick={onExit}
        className="flex items-center gap-1 px-3 py-1 bg-black/20 hover:bg-black/30 rounded-lg transition"
      >
        <X className="w-4 h-4" />
        Sair
      </button>
    </div>
  );
}