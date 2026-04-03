import React, { useState } from 'react';
import { LogOut, User, LayoutDashboard, History, Menu, X, Building2, CreditCard } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';

// Stores
import { useAuthStore } from '../features/auth/useAuthStore';
import { useHospitalStore } from '../features/hospital/useHospitalStore';
import { AuthService } from '../features/auth/AuthService';

const Navbar = () => {
  const user = useAuthStore((state) => state.user);
  const selectedHospital = useHospitalStore((state) => state.selectedHospital);
  const clearSelectedHospital = useHospitalStore((state) => state.clearSelectedHospital);
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    AuthService.logout();
    navigate('/login');
  };

  const handleChangeHospital = () => {
    clearSelectedHospital();
    navigate('/select-hospital');
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 max-w-7xl">
        <div className="flex items-center gap-8">
          <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-lg shadow-slate-200 group-hover:scale-110 transition-transform">
              <LayoutDashboard size={24} />
            </div>
            <span className="text-2xl font-black tracking-tight text-slate-900 font-display">SmartQ</span>
          </Link>

          <div className="hidden h-8 w-px bg-slate-100 md:block" />

          <nav className="hidden items-center gap-6 md:flex">
            <Link to="/history" className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-primary transition-all">
              <History size={18} />
              History
            </Link>
            <Link to="/payments" className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-primary transition-all">
              <CreditCard size={18} />
              Payments
            </Link>
            <Link to="/for-hospitals" className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-primary transition-all">
              <Building2 size={18} />
              For Hospitals
            </Link>
            
            {selectedHospital && user?.role !== 'admin' && (
              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-2 border border-slate-100">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none">Current</span>
                  <span className="text-sm font-bold text-slate-900 truncate max-w-[120px]">{selectedHospital.name}</span>
                </div>
                <button 
                  onClick={handleChangeHospital}
                  className="rounded-lg bg-white p-1.5 text-primary shadow-sm hover:bg-primary hover:text-white transition-all"
                >
                  <User size={14} className="rotate-0 group-hover:rotate-12 transition-transform" />
                </button>
              </div>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-6">
          {/* Desktop User Info & Sign Out */}
          <div className="hidden items-center gap-6 md:flex">
            <div className="flex items-center gap-3">
              <div className="flex flex-col text-right">
                <span className="text-sm font-black text-slate-900 leading-none mb-1">{user?.name}</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-primary leading-none">{user?.role}</span>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 border border-slate-200 shadow-sm">
                <User size={20} />
              </div>
            </div>
            
            <button 
              onClick={handleLogout}
              className="flex h-10 items-center justify-center gap-2 rounded-xl bg-red-50 px-4 text-sm font-bold text-red-500 transition-all hover:bg-red-500 hover:text-white group shadow-sm shadow-red-100/50"
            >
              <LogOut size={18} className="group-hover:-translate-x-0.5 transition-transform" />
              <span>Sign Out</span>
            </button>
          </div>

          {/* Mobile Menu Toggle button */}
          <button 
            className="md:hidden flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors focus-visible:ring-4 focus-visible:ring-primary/40 focus-visible:outline-none"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            id="mobile-menu"
            role="region"
            aria-label="Mobile Navigation"
            initial={{ height: 0, opacity: 0 }}

            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="md:hidden overflow-hidden bg-white border-t border-slate-100 shadow-2xl"
          >
            <div className="px-4 py-6 flex flex-col gap-6">
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-slate-600 border border-slate-200 shadow-sm">
                  <User size={24} />
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-black text-slate-900">{user?.name}</span>
                  <span className="text-xs font-black uppercase tracking-widest text-primary">{user?.role}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Link 
                  to="/history" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 p-4 rounded-2xl text-base font-bold text-slate-600 hover:bg-slate-50 hover:text-primary transition-colors"
                >
                  <History size={20} />
                  Token History
                </Link>

                <Link 
                  to="/payments" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 p-4 rounded-2xl text-base font-bold text-slate-600 hover:bg-slate-50 hover:text-primary transition-colors"
                >
                  <CreditCard size={20} />
                  Payment History
                </Link>

                <Link 
                  to="/for-hospitals" 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 p-4 rounded-2xl text-base font-bold text-slate-600 hover:bg-slate-50 hover:text-primary transition-colors"
                >
                  <Building2 size={20} />
                  For Hospitals
                </Link>

                {selectedHospital && user?.role !== 'admin' && (
                  <button 
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleChangeHospital();
                    }}
                    className="flex items-center justify-between p-4 rounded-2xl bg-primary/5 border border-primary/10 text-primary w-full"
                  >
                    <div className="flex items-center gap-3 text-left">
                      <Building2 size={20} />
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-80 leading-none">Current Hospital</span>
                        <span className="text-sm font-bold truncate max-w-[180px]">{selectedHospital.name}</span>
                      </div>
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest bg-white px-3 py-1.5 rounded-lg shadow-sm">Change</span>
                  </button>
                )}
              </div>

              <button 
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleLogout();
                }}
                className="flex items-center justify-center gap-2 p-4 w-full rounded-2xl bg-red-50 text-base font-bold text-red-500 hover:bg-red-500 hover:text-white transition-colors"
              >
                <LogOut size={20} />
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
