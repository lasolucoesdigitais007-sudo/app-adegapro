import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Wine, Lock, Mail, Sparkles, User, Shield, HelpCircle, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const { signIn, signInWithGoogle } = useAuth();
  const [role, setRoleState] = useState<'cliente' | 'admin'>(() => {
    const saved = localStorage.getItem('login_role_preference');
    if (saved === 'admin' || saved === 'cliente') return saved;
    return window.location.pathname.includes('/admin') ? 'admin' : 'cliente';
  });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [error, setError] = useState('');
  const [agreedToRole, setAgreedToRole] = useState(false);

  const setRole = (newRole: 'cliente' | 'admin') => {
    setRoleState(newRole);
    localStorage.setItem('login_role_preference', newRole);
    localStorage.setItem('pending_auth_role', newRole);
  };

  const handleSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToRole) {
      alert("Por favor, confirme que está ciente do vínculo definitivo de perfil marcando a caixa indicada acima antes de prosseguir.");
      return;
    }
    setLoadingEmail(true);
    setError('');
    try {
      await signIn(email, password);
    } catch (err: any) {
      setError('Credenciais de e-mail inválidas ou erro ao acessar.');
    } finally {
      setLoadingEmail(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!agreedToRole) {
      alert("Por favor, confirme que está ciente do vínculo definitivo de perfil marcando a caixa indicada acima antes de prosseguir.");
      return;
    }
    setLoadingGoogle(true);
    setError('');
    try {
      await signInWithGoogle(role);
    } catch (err: any) {
      console.error(err);
      setError('Falha ao autenticar com a conta do Google.');
    } finally {
      setLoadingGoogle(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-4">
      {/* Background radial highlight */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(123,17,44,0.15)_0%,transparent_65%)] pointer-events-none" />

      <div className="w-full max-w-md bg-[#121212]/95 border border-[#D4AF37]/20 rounded-2xl p-8 shadow-2xl relative z-10 backdrop-blur-md">
        
        {/* Header Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-[#7B112C] rounded-full flex items-center justify-center border-2 border-[#D4AF37] mb-4 shadow-[0_0_20px_rgba(212,175,55,0.25)]">
            <Wine className="w-8 h-8 text-[#D4AF37]" />
          </div>
          <h1 className="text-3xl font-serif italic text-white mb-1">AdegaPro</h1>
          <p className="text-[10px] uppercase tracking-widest text-[#D4AF37] text-center font-bold">Reserva, Inteligência & Fidelidade</p>
        </div>

        {/* Role Toggle Switcher */}
        <div className="bg-[#1E1E1E] p-1.5 rounded-xl border border-white/5 flex mb-6">
          <button
            type="button"
            onClick={() => {
              setRole('cliente');
              setError('');
            }}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              role === 'cliente'
                ? 'bg-[#7B112C] text-white shadow-md border border-[#D4AF37]/20'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Cliente</span>
          </button>
          
          <button
            type="button"
            onClick={() => {
              setRole('admin');
              setError('');
            }}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              role === 'admin'
                ? 'bg-[#7B112C] text-white shadow-md border border-[#D4AF37]/20'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Dono de Adega</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-950/40 border border-red-500/30 text-red-200 p-3 rounded-xl mb-6 text-xs text-center leading-relaxed">
            {error}
          </div>
        )}

        {/* Informative text about the choice */}
        <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/5 text-center">
          {role === 'cliente' ? (
            <div>
              <p className="text-xs text-[#D4AF37] font-semibold flex items-center justify-center gap-1 mb-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Clube de Vantagens
              </p>
              <p className="text-gray-400 text-[11px] leading-relaxed">
                Entre com sua Conta Google para resgatar cupons exclusivos, acumular pontos de cashback nas compras e consultar seu histórico com facilidade!
              </p>
            </div>
          ) : (
            <div>
              <p className="text-xs text-[#D4AF37] font-semibold flex items-center justify-center gap-1 mb-1.5">
                <Wine className="w-3.5 h-3.5" /> Painel Corporativo AdegaPro
              </p>
              <p className="text-gray-400 text-[11px] leading-relaxed">
                Gerencie múltiplas adegas, acompanhe pedidos em tempo real, crie cupons de desconto automáticos e impulsione suas vendas.
              </p>
            </div>
          )}
        </div>

        {/* Profile Lock Notice */}
        <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 text-center">
          <p className="text-xs text-amber-550 font-bold flex items-center justify-center gap-1.5 mb-1.5 uppercase tracking-wider">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 animate-pulse" /> Atenção: Vínculo Único de Perfil
          </p>
          <p className="text-gray-300 text-[10px] leading-relaxed">
            Uma vez logado como <strong>{role === 'cliente' ? 'Cliente' : 'Dono de Adega'}</strong>, sua conta ficará permanentemente vinculada a esse tipo e você não poderá alterar esse perfil posteriormente.
          </p>
          
          <label className="flex items-center justify-center gap-2 mt-3 p-1.5 bg-[#0a0a0a]/60 rounded-lg border border-amber-500/20 cursor-pointer hover:border-amber-500/40 transition-colors">
            <input 
              type="checkbox" 
              checked={agreedToRole} 
              onChange={(e) => setAgreedToRole(e.target.checked)} 
              className="accent-[#D4AF37] w-3.5 h-3.5 cursor-pointer"
            />
            <span className="text-gray-200 text-[10px] select-none font-bold">Ciente e desejo prosseguir</span>
          </label>
        </div>

        {/* Auth Actions Block */}
        <div className="space-y-5">
          {/* Main Google Login Button (Required) */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loadingGoogle || loadingEmail}
            className="w-full bg-[#1E1E1E] hover:bg-white/5 border border-white/10 text-white font-bold tracking-wide text-xs py-3.5 px-4 rounded-xl flex items-center justify-center gap-3 transition-all relative overflow-hidden shadow-lg"
          >
            {loadingGoogle ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.65 1.58 14.99 1 12 1 7.39 1 3.4 3.65 1.44 7.5L5 10.26C5.83 7.21 8.65 5.04 12 5.04z"
                />
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.43 3.59l3.77 2.92c2.2-2.03 3.49-5.04 3.49-8.66z"
                />
                <path
                  fill="#FBBC05"
                  d="M5 13.74c-.21-.63-.33-1.3-.33-2s.12-1.37.33-2L1.44 6.98C.52 8.84 0 10.87 0 13c0 2.13.52 4.16 1.44 6.02l3.56-2.76-1-.52z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.24 0 5.97-1.08 7.96-2.91l-3.77-2.92c-1.07.72-2.45 1.15-4.19 1.15-3.35 0-6.17-2.17-7-5.22L1.44 15.82C3.4 19.67 7.39 22 12 23z"
                />
              </svg>
            )}
            <span className="uppercase tracking-widest text-[11px]">
              {loadingGoogle ? 'Autenticando...' : 'Entrar com o Google'}
            </span>
          </button>

          {/* Separator for Admins who still want legacy creds */}
          {role === 'admin' && (
            <>
              <div className="flex items-center gap-4 my-5 select-none">
                <div className="h-px bg-white/10 flex-1"></div>
                <span className="text-[9px] uppercase tracking-wider text-gray-500 font-bold">Ou via credenciais</span>
                <div className="h-px bg-white/10 flex-1"></div>
              </div>

              <form onSubmit={handleSubmitEmail} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">E-mail corporativo</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input 
                      type="email" 
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required={role === 'admin'}
                      className="w-full bg-[#1E1E1E] border border-white/10 rounded-xl px-10 py-3 text-white text-sm focus:outline-none focus:border-[#D4AF37]/50"
                      placeholder="adega@adegapro.com"
                    />
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Senha secreta</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input 
                      type="password" 
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required={role === 'admin'}
                      className="w-full bg-[#1E1E1E] border border-white/10 rounded-xl px-10 py-3 text-white text-sm focus:outline-none focus:border-[#D4AF37]/50"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loadingGoogle || loadingEmail}
                  className="w-full bg-[#7B112C] hover:bg-[#921435] text-white font-bold uppercase tracking-widest text-[10px] py-3.5 rounded-xl border border-[#D4AF37]/30 transition-all shadow-md flex items-center justify-center gap-2"
                >
                  {loadingEmail && <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1" />}
                  Acessar Painel
                </button>
              </form>
            </>
          )}
        </div>
      </div>
      
      {/* Footer support citation */}
      <div className="mt-6 text-center text-[10px] text-gray-600 max-w-sm flex flex-col items-center gap-1.5 z-10 selection:bg-[#7b112c]/40">
        <p className="flex items-center gap-1 text-center justify-center uppercase tracking-wider font-bold text-gray-500">
          <Wine className="w-3 h-3 text-[#D4AF37]" /> AdegaPro Ecosystem
        </p>
        <p>Login unificado e verificado por barreira criptográfica do Google Firebase Auth.</p>
      </div>
    </div>
  );
}
