import React from 'react';
import Badge from './Badge';
import { Clock, Users } from 'lucide-react';

const statusVariant = (status) => {
  if (status === 'completed') return 'success';
  if (status === 'in-progress') return 'primary';
  if (status === 'cancelled' || status === 'skipped') return 'danger';
  return 'warning';
};

const TokenCard = ({ token }) => {
  if (!token) return null;

  const isNearing = token.position <= 2 && token.status === 'waiting';

  return (
    <div className={`card relative overflow-hidden p-6 ${isNearing ? 'ring-2 ring-warning' : ''}`}>
      {isNearing && (
        <div className="absolute top-0 right-0 bg-warning px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white rounded-bl-lg animate-pulse">
          Your turn is near!
        </div>
      )}
      
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-medium text-slate-500">{token.serviceId?.name}</h3>
          <p className="branch-tag mt-1 text-xs text-slate-400">{token.serviceId?.branchId?.name}</p>
        </div>
        <Badge variant={statusVariant(token.status)} className="capitalize">
          {token.status?.replace('-', ' ')}
        </Badge>
      </div>

      <div className="mb-8 text-center">
        <div className="text-6xl font-black tracking-tighter text-primary">
          {token.tokenNumber}
        </div>
        <p className="mt-2 text-sm font-medium text-slate-400">Your Token Number</p>
      </div>

      <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-6">
        <div className="flex flex-col items-center gap-1 border-r border-slate-100">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Users size={14} />
            <span className="text-xs font-medium uppercase">Position</span>
          </div>
          <span className="text-lg font-bold text-slate-900">{token.position}</span>
        </div>
        
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Clock size={14} />
            <span className="text-xs font-medium uppercase">Wait Time</span>
          </div>
          <span className="text-lg font-bold text-slate-900">{token.estimatedTime}m</span>
        </div>
      </div>
    </div>
  );
};

export default TokenCard;
