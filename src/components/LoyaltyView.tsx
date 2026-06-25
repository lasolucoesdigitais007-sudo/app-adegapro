import React, { useState, useMemo } from 'react';
import { Client } from '../types';
import { 
  Award,
  Star,
  Shield,
  Crown,
  Search,
  Gift,
  ArrowDownRight,
  ArrowUpRight,
  Users,
  Trophy,
  History,
  X,
  CheckCircle,
  Gem,
  Link
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LoyaltyViewProps {
  clients: Client[];
  onEditClient: (id: string, updated: Partial<Client>) => void;
}

const REDEEM_OPTIONS = [
  { id: 'discount_10', points: 500, title: 'R$ 10,00 de Desconto', Icon: Award },
  { id: 'discount_25', points: 1000, title: 'R$ 25,00 de Desconto', Icon: Star },
  { id: 'discount_50', points: 1800, title: 'R$ 50,00 de Desconto', Icon: Shield },
  { id: 'frete_gratis', points: 800, title: 'Frete Grátis na região', Icon: Trophy },
  { id: 'brinde_vinho', points: 3500, title: 'Vinho Reserva Surpresa', Icon: Gift },
];

export default function LoyaltyView({ clients, onEditClient }: LoyaltyViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const handleCopyLink = () => {
    const link = `${window.location.origin}/clube`;
    navigator.clipboard.writeText(link);
    alert('Link da página de cadastro copiado: ' + link);
  };

  // Compute levels
  const getLevelInfo = (totalEarned: number) => {
    if (totalEarned >= 10000) return { name: 'Diamante', color: 'text-cyan-400', bg: 'bg-cyan-950/30', border: 'border-cyan-500/50', icon: <Gem className="w-4 h-4 text-cyan-400" /> };
    if (totalEarned >= 5000) return { name: 'Ouro', color: 'text-[#D4AF37]', bg: 'bg-[#D4AF37]/10', border: 'border-[#D4AF37]/50', icon: <Crown className="w-4 h-4 text-[#D4AF37]" /> };
    if (totalEarned >= 1000) return { name: 'Prata', color: 'text-gray-300', bg: 'bg-gray-800/50', border: 'border-gray-400/50', icon: <Shield className="w-4 h-4 text-gray-300" /> };
    return { name: 'Bronze', color: 'text-amber-600', bg: 'bg-amber-950/30', border: 'border-amber-700/50', icon: <Star className="w-4 h-4 text-amber-600" /> };
  };

  const getNextLevelReq = (totalEarned: number) => {
    if (totalEarned >= 10000) return null;
    if (totalEarned >= 5000) return 10000;
    if (totalEarned >= 1000) return 5000;
    return 1000;
  };

  // Stats
  const totalPointsEarned = useMemo(() => clients.reduce((acc, c) => acc + (c.loyaltyTotalEarned || 0), 0), [clients]);
  const totalPointsRedeemed = useMemo(() => clients.reduce((acc, c) => acc + (c.loyaltyTotalRedeemed || 0), 0), [clients]);
  const currentlyAvailable = useMemo(() => clients.reduce((acc, c) => acc + (c.loyaltyPoints || 0), 0), [clients]);
  
  const activeClients = useMemo(() => clients.filter(c => (c.loyaltyTotalEarned || 0) > 0), [clients]);
  
  const topClients = useMemo(() => {
    return [...activeClients].sort((a, b) => (b.loyaltyTotalEarned || 0) - (a.loyaltyTotalEarned || 0)).slice(0, 10);
  }, [activeClients]);

  const filteredClients = useMemo(() => {
    if (!searchTerm) return topClients;
    return activeClients.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.email.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [searchTerm, topClients, activeClients]);

  const handleRedeem = (client: Client, option: typeof REDEEM_OPTIONS[0]) => {
    if ((client.loyaltyPoints || 0) < option.points) {
      alert('Pontos insuficientes!');
      return;
    }

    if (confirm(`Confirmar resgate de "${option.title}" por ${option.points} pontos para o cliente ${client.name}?`)) {
      onEditClient(client.id, {
        loyaltyPoints: (client.loyaltyPoints || 0) - option.points,
        loyaltyTotalRedeemed: (client.loyaltyTotalRedeemed || 0) + option.points
      });
      alert('Resgate realizado com sucesso! Registre o desconto no PDV.');
      setSelectedClient(null);
    }
  };

  return (
    <div className="space-y-6 lg:space-y-8" id="loyalty-view-root">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl lg:text-4xl font-serif italic text-white mb-2 leading-tight flex items-center gap-3">
            Clube Fidelidade
          </h1>
          <p className="text-gray-500 text-xs uppercase tracking-[0.2em] font-sans">
            AdegaPro • Gestão de Pontos
          </p>
        </div>
        <button 
          onClick={handleCopyLink}
          className="bg-[#1E1E1E] hover:bg-white/5 border border-white/10 text-white text-xs font-bold uppercase tracking-wider py-2.5 px-4 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Link className="w-4 h-4 text-[#D4AF37]" />
          Página de Captura (Landing Page)
        </button>
      </div>

      {/* DASHBOARD STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#1E1E1E] p-5 rounded-xl border border-white/5 flex flex-col justify-between">
           <div className="flex items-center justify-between mb-2">
             <p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Pontos Emitidos</p>
             <ArrowUpRight className="w-4 h-4 text-[#D4AF37]" />
           </div>
           <div className="mt-2">
             <p className="text-3xl font-mono text-white">{totalPointsEarned.toLocaleString('pt-BR')}</p>
             <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">Histórico Total</p>
           </div>
        </div>

        <div className="bg-[#1E1E1E] p-5 rounded-xl border border-white/5 flex flex-col justify-between">
           <div className="flex items-center justify-between mb-2">
             <p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Pontos Resgatados</p>
             <ArrowDownRight className="w-4 h-4 text-emerald-400" />
           </div>
           <div className="mt-2 text-emerald-400">
             <p className="text-3xl font-mono">{totalPointsRedeemed.toLocaleString('pt-BR')}</p>
             <p className="text-[10px] text-emerald-600 mt-1 uppercase tracking-wider">Convertidos em prêmios</p>
           </div>
        </div>

        <div className="bg-[#1E1E1E] p-5 rounded-xl border border-white/5 flex flex-col justify-between">
           <div className="flex items-center justify-between mb-2">
             <p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Caixa Atual</p>
             <Shield className="w-4 h-4 text-amber-500" />
           </div>
           <div className="mt-2 text-amber-500">
             <p className="text-3xl font-mono">{currentlyAvailable.toLocaleString('pt-BR')}</p>
             <p className="text-[10px] text-amber-700 mt-1 uppercase tracking-wider">Acúmulo aguardando</p>
           </div>
        </div>

        <div className="bg-[#1E1E1E] p-5 rounded-xl border border-white/5 flex flex-col justify-between">
           <div className="flex items-center justify-between mb-2">
             <p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Participantes</p>
             <Users className="w-4 h-4 text-indigo-400" />
           </div>
           <div className="mt-2 text-indigo-400">
             <p className="text-3xl font-mono">{activeClients.length}</p>
             <p className="text-[10px] text-indigo-600 mt-1 uppercase tracking-wider">Membros com pontos</p>
           </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-serif italic text-white flex items-center gap-2">
               <Trophy className="w-5 h-5 text-[#D4AF37]" />
               Ranking de Membros
            </h2>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar membro..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-premium pl-10 w-full bg-[#1E1E1E] border-white/5 text-xs py-2"
              />
            </div>
          </div>
          
          <div className="bg-[#1E1E1E] rounded-xl border border-white/5 overflow-hidden">
             {filteredClients.length === 0 ? (
                <div className="p-8 text-center text-gray-500">Nenhum membro encontrado.</div>
             ) : (
                <div className="overflow-x-auto">
                   <table className="w-full text-left text-sm border-collapse min-w-[700px]">
                     <thead>
                       <tr className="bg-[#121212] text-gray-400 uppercase tracking-wider text-[10px] font-bold border-b border-white/5">
                         <th className="p-4 rounded-tl-xl w-12">Pos</th>
                         <th className="p-4">Cliente</th>
                         <th className="p-4">Nível</th>
                         <th className="p-4 text-right">Acúmulo Total</th>
                         <th className="p-4 text-right">Saldo Atual</th>
                         <th className="p-4 text-center rounded-tr-xl">Ação</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-white/5 text-gray-300">
                       {filteredClients.map((client, index) => {
                         const earned = client.loyaltyTotalEarned || 0;
                         const points = client.loyaltyPoints || 0;
                         const lvl = getLevelInfo(earned);
                         const rank = searchTerm ? '-' : index + 1;
                         
                         return (
                           <tr key={client.id} className="hover:bg-white/[0.02] transition-colors group">
                             <td className="p-4 text-center font-mono text-gray-500">{rank}</td>
                             <td className="p-4">
                               <p className="font-bold text-white mb-0.5 truncate max-w-[150px]" title={client.name}>{client.name}</p>
                               <p className="text-[10px] text-gray-500 truncate max-w-[150px]">{client.email}</p>
                             </td>
                             <td className="p-4">
                               <div className={`inline-flex items-center gap-1.5 px-2 bg-[#121212] py-1 rounded border ${lvl.border} ${lvl.bg} ${lvl.color} text-[10px] uppercase font-bold tracking-widest`}>
                                 {lvl.icon} {lvl.name}
                               </div>
                             </td>
                             <td className="p-4 text-right">
                               <span className="font-mono text-gray-400">{earned.toLocaleString()} pts</span>
                             </td>
                             <td className="p-4 text-right">
                               <span className="font-mono font-bold text-[#D4AF37]">{points.toLocaleString()} pts</span>
                             </td>
                             <td className="p-4 text-center">
                               <button 
                                 onClick={() => setSelectedClient(client)}
                                 className="px-3 py-1.5 bg-[#7B112C] hover:bg-[#921435] text-white text-[10px] uppercase font-bold tracking-wider rounded transition-all lg:opacity-0 lg:group-hover:opacity-100 cursor-pointer"
                               >
                                 Resgatar
                               </button>
                             </td>
                           </tr>
                         );
                       })}
                     </tbody>
                   </table>
                </div>
             )}
          </div>
        </div>

        {/* REWARDS CATALOG / RESGATE */}
        <div className="bg-[#1E1E1E] border border-white/5 rounded-xl p-6 sticky top-24">
          <h2 className="text-xl font-serif italic text-white flex items-center gap-2 mb-6">
             <Gift className="w-5 h-5 text-emerald-400" />
             Catálogo de Prêmios
          </h2>

          <div className="space-y-3">
             {REDEEM_OPTIONS.map(opt => (
                <div key={opt.id} className="flex flex-col p-4 border border-white/5 bg-[#121212] rounded-xl hover:border-[#D4AF37]/30 transition-colors">
                   <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-[#1E1E1E] flex items-center justify-center border border-white/10 shrink-0">
                         <opt.Icon className="w-4 h-4 text-[#D4AF37]" />
                      </div>
                      <p className="text-sm font-bold text-gray-200">{opt.title}</p>
                   </div>
                   <div className="flex items-center justify-between mt-2 pl-11">
                      <span className="text-xs text-gray-500 uppercase tracking-widest font-semibold flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5" />
                        {opt.points} pts
                      </span>
                   </div>
                </div>
             ))}
          </div>
          
          <div className="mt-6 p-4 bg-black/40 rounded-xl text-xs text-gray-400">
             <p className="font-bold text-gray-300 uppercase tracking-wider mb-2 text-[10px]">Como Funciona</p>
             <p className="mb-1">1 BRL em compras = 1 Ponto acumulado.</p>
             <p>Os pontos expiram em 12 meses. O nível do cliente não cai após o resgate, é baseado no acúmulo histórico.</p>
          </div>
        </div>
      </div>

      {/* REDEEM MODAL */}
      <AnimatePresence>
        {selectedClient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#121212] border border-[#D4AF37]/20 rounded-2xl w-full max-w-lg mb-8 shadow-2xl overflow-hidden"
            >
              <div className="bg-[#1E1E1E] p-6 border-b border-white/5 flex items-center justify-between">
                 <h3 className="text-xl font-serif italic text-white flex items-center gap-2">
                   <Award className="w-5 h-5 text-[#D4AF37]" /> Resgatar Pontos
                 </h3>
                 <button onClick={() => setSelectedClient(null)} className="p-2 text-gray-400 hover:text-white transition-colors">
                   <X className="w-5 h-5" />
                 </button>
              </div>
              
              <div className="p-6">
                 <div className="flex items-center gap-4 bg-[#1E1E1E] p-4 rounded-xl border border-white/5 mb-6">
                    <div className="w-12 h-12 bg-[#7B112C] rounded-full flex items-center justify-center text-white font-serif italic font-bold">
                       {selectedClient.name.substring(0, 1).toUpperCase()}
                    </div>
                    <div>
                       <p className="font-bold text-white text-lg leading-tight">{selectedClient.name}</p>
                       <p className="text-xs text-gray-400 mt-1">Saldo Disponível: <span className="font-mono text-[#D4AF37] font-bold">{selectedClient.loyaltyPoints || 0} pts</span></p>
                    </div>
                 </div>

                 <p className="text-[10px] uppercase font-bold tracking-widest text-gray-500 mb-4">Escolha a Recompensa</p>
                 
                 <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {REDEEM_OPTIONS.map(opt => {
                       const canRedeem = (selectedClient.loyaltyPoints || 0) >= opt.points;
                       
                       return (
                          <div 
                            key={opt.id} 
                            className={`flex flex-col p-4 border rounded-xl transition-all ${
                              canRedeem 
                                ? 'border-[#D4AF37]/30 bg-[#1E1E1E] hover:border-[#D4AF37]' 
                                : 'border-white/5 bg-[#121212] opacity-50'
                            }`}
                          >
                             <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                   <div className="w-8 h-8 rounded-full bg-[#121212] flex items-center justify-center border border-white/10 shrink-0">
                                      <opt.Icon className="w-4 h-4 text-gray-400" />
                                   </div>
                                   <div>
                                      <p className="text-sm font-bold text-gray-200">{opt.title}</p>
                                      <p className="text-[10px] font-mono text-gray-400 mt-1">{opt.points} pontos</p>
                                   </div>
                                </div>
                                <button
                                   onClick={() => handleRedeem(selectedClient, opt)}
                                   disabled={!canRedeem}
                                   className={`px-4 py-2 text-[10px] uppercase font-bold tracking-wider rounded transition-colors ${
                                      canRedeem 
                                        ? 'bg-[#D4AF37] text-black hover:bg-[#ebd074]'
                                        : 'bg-white/5 text-gray-600 cursor-not-allowed'
                                   }`}
                                >
                                   Resgatar
                                </button>
                             </div>
                          </div>
                       )
                    })}
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
