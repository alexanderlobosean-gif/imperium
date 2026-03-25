import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownCircle, ArrowUpCircle, RefreshCw, Send } from 'lucide-react';

const actions = [
  { label: 'Depositar', icon: ArrowDownCircle, path: '/wallet?tab=deposit', color: 'text-green-400 bg-green-500/10 border-green-500/20' },
  { label: 'Sacar', icon: ArrowUpCircle, path: '/wallet?tab=withdraw', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  { label: 'Transferir', icon: Send, path: '/wallet?tab=transfer', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  { label: 'Reinvestir', icon: RefreshCw, path: '/plans', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
];

export default function QuickActions() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {actions.map((action) => (
        <Link
          key={action.label}
          to={action.path}
          className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all hover:scale-105 ${action.color}`}
        >
          <action.icon className="w-6 h-6" />
          <span className="text-xs font-medium">{action.label}</span>
        </Link>
      ))}
    </div>
  );
}