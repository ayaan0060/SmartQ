import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Badge from './Badge';
import Card from './Card';

const QueueList = memo(({ tokens, currentTokenId }) => {
  const activeTokens = tokens.filter(t => t.status === 'waiting' || t.status === 'in-progress');

  return (
    <Card className="border-none bg-white shadow-premium overflow-hidden rounded-4xl h-full flex flex-col">
      <div className="bg-slate-50/80 px-6 py-4 border-b border-slate-100">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Live Queue Stream</h3>
      </div>
      <div className="max-h-[500px] overflow-y-auto no-scrollbar relative" aria-live="polite">
        <AnimatePresence mode="popLayout">
          {activeTokens.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 text-center px-6"
            >
              <div className="h-16 w-16 rounded-2xl bg-slate-50 flex items-center justify-center text-4xl mb-4 grayscale opacity-50">
                📭
              </div>
              <h4 className="text-xl font-bold text-slate-900 font-display">Queue Is Empty</h4>
              <p className="text-sm text-slate-400 font-medium mt-1">New tokens will appear here in real-time.</p>
            </motion.div>
          ) : (
            activeTokens.map((token) => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, x: -20 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                key={token._id} 
                className={`flex items-center justify-between px-6 py-5 transition-colors duration-300 ${
                  token._id === currentTokenId 
                    ? 'bg-primary/5 border-l-4 border-primary' 
                    : 'hover:bg-slate-50/50 border-l-4 border-transparent'
                }`}
              >
                <div className="flex items-center gap-5">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-black shadow-sm transition-all ${
                    token._id === currentTokenId 
                      ? 'bg-primary text-white scale-110 shadow-primary/20' 
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {token.tokenNumber}
                  </div>
                  <div>
                    <p className={`text-base font-black transition-colors ${
                      token._id === currentTokenId ? 'text-primary' : 'text-slate-900'
                    }`}>
                      {token.userId?.name || 'Guest User'}
                    </p>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Position: <span className={token._id === currentTokenId ? 'text-primary' : 'text-slate-600'}>{token.position}</span>
                    </p>
                  </div>
                </div>
                <Badge 
                  variant={
                    token.status === 'completed' ? 'success' : 
                    token.status === 'processing' ? 'primary' : 
                    token.status === 'pending' ? 'warning' : 'neutral'
                  }
                  className="capitalize font-black text-[10px] tracking-widest px-3 py-1.5"
                >
                  {token.status}
                </Badge>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
});

QueueList.displayName = 'QueueList';

export default QueueList;
