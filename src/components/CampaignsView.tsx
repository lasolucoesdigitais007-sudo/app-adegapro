import React, { useState, useMemo } from 'react';
import { Campaign, Client, Promotion } from '../types';
import { 
  Megaphone, 
  Send, 
  MessageSquare, 
  Mail, 
  Smartphone,
  Users, 
  Plus, 
  Trash2, 
  CheckCircle, 
  BarChart, 
  Play, 
  Eye,
  MousePointerClick,
  RefreshCw,
  Search,
  X,
  Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CampaignsViewProps {
  campaigns: Campaign[];
  clients: Client[];
  promotions?: Promotion[];
  onAddCampaign: (camp: Omit<Campaign, 'id'>) => void;
  onDeleteCampaign: (id: string) => void;
  onSendCampaign: (id: string, sentCount: number) => void; // Keeping original sig to avoid breaking App.tsx immediately, we can update later if needed
}

export default function CampaignsView({
  campaigns,
  clients,
  promotions = [],
  onAddCampaign,
  onDeleteCampaign,
  onSendCampaign
}: CampaignsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [targetAudience, setTargetAudience] = useState<Campaign['targetAudience']>('all');
  const [channel, setChannel] = useState<Campaign['channel']>('whatsapp');
  const [message, setMessage] = useState('');
  const [promotionId, setPromotionId] = useState('');

  // Simulation states
  const [activeSimulationId, setActiveSimulationId] = useState<string | null>(null);
  const [simulationProgress, setSimulationProgress] = useState(0);

  // Analytics
  const totalSent = useMemo(() => campaigns.reduce((acc, c) => acc + c.sentCount, 0), [campaigns]);
  const totalDelivered = useMemo(() => campaigns.reduce((acc, c) => acc + (c.deliveredCount || 0), 0), [campaigns]);
  const totalClicked = useMemo(() => campaigns.reduce((acc, c) => acc + (c.clickedCount || 0), 0), [campaigns]);
  const deliveredRate = totalSent > 0 ? ((totalDelivered / totalSent) * 100).toFixed(1) : '0.0';
  const clickedRate = totalDelivered > 0 ? ((totalClicked / totalDelivered) * 100).toFixed(1) : '0.0';

  const resetForm = () => {
    setTitle('');
    setTargetAudience('all');
    setChannel('whatsapp');
    setMessage('');
    setPromotionId('');
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const getTargetClientsCount = (audience: Campaign['targetAudience']) => {
    switch (audience) {
      case 'all': return clients.length;
      case 'vip': return clients.filter(c => c.status === 'vip').length;
      // Pretend everyone has a birthday in next 30 days for demo, or calculate from DOB if we had it
      // Since we don't have DOB in Client type, let's just make a fake number
      case 'birthdays': return Math.floor(clients.length * 0.1) || 1; 
      case 'inactive': return clients.filter(c => {
        if (!c.lastPurchaseDate) return true;
        const lastPurchase = new Date(c.lastPurchaseDate);
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        return lastPurchase < threeMonthsAgo;
      }).length;
      default: return 0;
    }
  };

  const getTargetAudienceName = (audience: Campaign['targetAudience']) => {
    switch (audience) {
      case 'all': return 'Todos os Clientes';
      case 'vip': return 'Clientes VIP';
      case 'birthdays': return 'Aniversariantes do Mês';
      case 'inactive': return 'Clientes Inativos';
    }
  };

  const getChannelIcon = (ch: string, className = "w-4 h-4") => {
    switch (ch) {
      case 'whatsapp': return <MessageSquare className={`${className} text-emerald-400`} />;
      case 'email': return <Mail className={`${className} text-indigo-400`} />;
      case 'sms': return <Smartphone className={`${className} text-sky-400`} />;
      default: return <Send className={className} />;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;

    onAddCampaign({
      title,
      targetAudience,
      channel,
      message,
      promotionId: promotionId || undefined,
      status: 'draft',
      sentCount: 0,
      deliveredCount: 0,
      clickedCount: 0
    });

    setIsModalOpen(false);
    resetForm();
  };

  const handleTriggerDispatch = (camp: Campaign) => {
    const totalContacts = getTargetClientsCount(camp.targetAudience);
    if (totalContacts === 0) {
      alert('Não há contatos neste segmento para enviar a campanha.');
      return;
    }

    setActiveSimulationId(camp.id);
    setSimulationProgress(0);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setSimulationProgress(progress);

      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          onSendCampaign(camp.id, totalContacts);
          setActiveSimulationId(null);
          setSimulationProgress(0);
        }, 800);
      }
    }, 300);
  };

  const filteredCampaigns = campaigns.filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6 lg:space-y-8" id="campaigns-view-root">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl lg:text-4xl font-serif italic text-white mb-2 leading-tight flex items-center gap-3">
            Campanhas & Disparos
          </h1>
          <p className="text-gray-500 text-xs uppercase tracking-[0.2em] font-sans">
            AdegaPro • Automação de Marketing
          </p>
        </div>
        
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-[#D4AF37] text-[#121212] px-6 py-3 rounded hover:bg-[#c49e2e] transition-all font-serif italic font-bold uppercase tracking-widest text-xs border border-[#D4AF37]/50 shadow-lg justify-center w-full md:w-auto shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          Nova Campanha
        </button>
      </div>

      {/* DASHBOARD STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Enviados */}
        <div className="bg-[#1E1E1E] p-5 rounded-xl border border-white/5 flex flex-col justify-between">
           <div className="flex items-center justify-between mb-2">
             <p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Total Enviado</p>
             <Send className="w-4 h-4 text-gray-400" />
           </div>
           <div className="mt-2">
             <p className="text-3xl font-serif text-white">{totalSent.toLocaleString('pt-BR')}</p>
             <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">Volume histórico</p>
           </div>
        </div>

        {/* Entregues */}
        <div className="bg-[#1E1E1E] p-5 rounded-xl border border-white/5 flex flex-col justify-between">
           <div className="flex items-center justify-between mb-2">
             <p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Taxa de Entrega</p>
             <CheckCircle className="w-4 h-4 text-emerald-400" />
           </div>
           <div className="mt-2 flex items-end justify-between">
             <div>
               <p className="text-3xl font-serif text-white">{deliveredRate}%</p>
               <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">{totalDelivered.toLocaleString('pt-BR')} Entregues</p>
             </div>
             <div className="w-12 h-12 rounded-full border-[3px] border-emerald-500/20 flex items-center justify-center relative">
               <svg className="absolute inset-0 w-full h-full -rotate-90">
                 <circle cx="21" cy="21" r="18" fill="none" stroke="currentColor" strokeWidth="3" className="text-emerald-500" strokeDasharray="113" strokeDashoffset={113 - (113 * parseFloat(deliveredRate)) / 100} strokeLinecap="round" />
               </svg>
             </div>
           </div>
        </div>

        {/* Clicados / Conversão */}
        <div className="bg-[#1E1E1E] p-5 rounded-xl border border-white/5 flex flex-col justify-between">
           <div className="flex items-center justify-between mb-2">
             <p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Taxa de Clique (CTR)</p>
             <MousePointerClick className="w-4 h-4 text-[#D4AF37]" />
           </div>
           <div className="mt-2 flex items-end justify-between">
             <div>
               <p className="text-3xl font-serif text-[#D4AF37]">{clickedRate}%</p>
               <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">{totalClicked.toLocaleString('pt-BR')} Cliques Únicos</p>
             </div>
             <div className="w-12 h-12 rounded-full border-[3px] border-[#D4AF37]/20 flex items-center justify-center relative">
               <svg className="absolute inset-0 w-full h-full -rotate-90">
                 <circle cx="21" cy="21" r="18" fill="none" stroke="currentColor" strokeWidth="3" className="text-[#D4AF37]" strokeDasharray="113" strokeDashoffset={113 - (113 * parseFloat(clickedRate)) / 100} strokeLinecap="round" />
               </svg>
             </div>
           </div>
        </div>
      </div>

      {/* SEARCH / FILTER */}
      <div className="relative w-full md:w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Buscar campanha..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="input-premium pl-10 w-full bg-[#1E1E1E] border-white/5"
        />
      </div>

      {/* CAMPAIGNS LIST */}
      <div className="space-y-4">
        {filteredCampaigns.length === 0 ? (
          <div className="py-20 text-center bg-[#1E1E1E] rounded-xl border border-white/5">
            <Megaphone className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-gray-400 font-medium">Nenhuma campanha encontrada.</p>
          </div>
        ) : (
          filteredCampaigns.map((camp) => {
            const isSent = camp.status === 'sent';
            const targetsTotal = getTargetClientsCount(camp.targetAudience);
            
            // Random stats for demo simulation if sent but empty
            const displayedDelivered = isSent ? (camp.deliveredCount || Math.floor(camp.sentCount * 0.95)) : 0;
            const displayedClicks = isSent ? (camp.clickedCount || Math.floor(displayedDelivered * 0.3)) : 0;
            
            const pDelivered = camp.sentCount ? Math.round((displayedDelivered / camp.sentCount) * 100) : 0;
            const pClicks = displayedDelivered ? Math.round((displayedClicks / displayedDelivered) * 100) : 0;

            const linkedPromo = promotions.find(p => p.id === camp.promotionId);

            return (
              <div key={camp.id} className="bg-[#1E1E1E] border border-white/5 hover:border-[#D4AF37]/30 rounded-xl overflow-hidden transition-all duration-300">
                <div className="p-5 md:p-6 flex flex-col xl:flex-row gap-6 xl:items-center">
                  
                  {/* Info column */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                       <div className="p-2 bg-black/40 rounded-lg border border-white/5">
                         {getChannelIcon(camp.channel)}
                       </div>
                       <h3 className="font-serif italic font-bold text-white text-lg">{camp.title}</h3>
                       {isSent ? (
                          <span className="text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-400 border border-emerald-900/40 ml-auto xl:ml-0">
                            Concluída
                          </span>
                       ) : (
                          <span className="text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded bg-amber-950/40 text-amber-400 border border-amber-900/40 ml-auto xl:ml-0">
                            Rascunho
                          </span>
                       )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-xs mt-3">
                      <span className="text-gray-400 flex items-center gap-1.5 bg-black/20 px-2 py-1 rounded">
                        <Target className="w-3.5 h-3.5" /> <span className="text-gray-300">{getTargetAudienceName(camp.targetAudience)}</span>
                      </span>
                      {linkedPromo && (
                        <span className="text-[#D4AF37] flex items-center gap-1.5 bg-[#D4AF37]/10 px-2 py-1 rounded">
                          <Megaphone className="w-3.5 h-3.5" /> <span className="font-medium">{linkedPromo.name}</span>
                        </span>
                      )}
                      {isSent && camp.sentDate && (
                         <span className="text-gray-500 font-mono">Disparada em: {camp.sentDate}</span>
                      )}
                    </div>

                    <p className="text-sm text-gray-400 mt-4 line-clamp-2 italic pr-4 border-l-2 border-[#D4AF37]/30 pl-3">
                      "{camp.message}"
                    </p>
                  </div>

                  {/* Analytics column */}
                  <div className="xl:w-1/3 flex flex-col justify-center gap-3 bg-[#121212] p-4 rounded-xl border border-white/5">
                    {isSent ? (
                      <>
                        {/* Sent */}
                        <div className="flex items-center justify-between text-xs">
                           <span className="text-gray-500 flex items-center gap-1.5 uppercase font-semibold text-[10px] tracking-wider"><Send className="w-3 h-3"/> Enviados</span>
                           <span className="font-mono text-white font-bold">{camp.sentCount}</span>
                        </div>
                        {/* Delivered */}
                        <div className="flex items-center justify-between text-xs">
                           <span className="text-gray-500 flex items-center gap-1.5 uppercase font-semibold text-[10px] tracking-wider"><CheckCircle className="w-3 h-3 text-emerald-400"/> Entregues</span>
                           <span className="font-mono text-white flex items-center gap-2">
                             {displayedDelivered} <span className="text-[10px] text-emerald-400 font-sans">({pDelivered}%)</span>
                           </span>
                        </div>
                        {/* Clicks */}
                        <div className="flex items-center justify-between text-xs">
                           <span className="text-gray-500 flex items-center gap-1.5 uppercase font-semibold text-[10px] tracking-wider"><MousePointerClick className="w-3 h-3 text-[#D4AF37]"/> Aberturas/Cliques</span>
                           <span className="font-mono text-white flex items-center gap-2">
                             {displayedClicks} <span className="text-[10px] text-[#D4AF37] font-sans">({pClicks}%)</span>
                           </span>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-2 flex flex-col items-center justify-center">
                         <Users className="w-8 h-8 text-gray-600 mb-2" />
                         <p className="text-sm font-semibold text-white">{targetsTotal}</p>
                         <p className="text-[10px] uppercase text-gray-500 tracking-wider">Contatos Qualificados</p>
                      </div>
                    )}
                  </div>

                  {/* Actions Column */}
                  <div className="xl:w-40 flex xl:flex-col justify-end gap-2 border-t xl:border-t-0 xl:border-l border-white/5 pt-4 xl:pt-0 xl:pl-4">
                    {!isSent && (
                       <button
                         onClick={() => handleTriggerDispatch(camp)}
                         disabled={targetsTotal === 0 || activeSimulationId !== null}
                         className="flex-1 xl:flex-none flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs bg-[#7B112C] hover:bg-[#921435] text-white font-bold uppercase tracking-wider rounded transition-colors disabled:opacity-50"
                       >
                         {activeSimulationId === camp.id ? (
                           <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                         ) : (
                           <><Send className="w-3.5 h-3.5" /> Disparar</>
                         )}
                       </button>
                    )}
                    <button
                      onClick={() => {
                        if (confirm(`Excluir campanha "${camp.title}"?`)) onDeleteCampaign(camp.id);
                      }}
                      className="py-2.5 px-3 text-xs bg-[#121212] hover:bg-red-950/40 text-gray-500 hover:text-red-400 font-bold uppercase tracking-wider rounded transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> {isSent ? 'Apagar' : 'Excluir'}
                    </button>
                  </div>

                </div>
                
                {/* Simulation Progress Bar inline */}
                {activeSimulationId === camp.id && (
                  <div className="h-1.5 w-full bg-[#121212] overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#7B112C] to-[#D4AF37] transition-all duration-300" style={{ width: `${simulationProgress}%` }}></div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* CREATE CAMPAIGN MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#121212] border border-[#D4AF37]/20 rounded-2xl w-full max-w-3xl overflow-y-auto md:overflow-hidden shadow-2xl my-8 relative flex flex-col md:flex-row max-h-[90vh]"
            >
              <div className="w-full md:w-2/3 border-r border-white/5 flex flex-col md:overflow-y-auto">
                <div className="bg-[#1E1E1E] p-4 md:p-6 border-b border-white/5 flex items-center justify-between shrink-0">
                  <div>
                    <h2 className="text-xl md:text-2xl font-serif italic text-white flex items-center gap-2">
                       <Send className="w-5 h-5 text-[#D4AF37]" /> Nova Campanha
                    </h2>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 bg-black/20 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors block md:hidden">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-4 md:p-6">
                  <form id="campaign-form" onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Nome da Campanha <span className="text-red-400">*</span></label>
                      <input
                        type="text"
                        required
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ex: Oferta de Vinhos de Inverno"
                        className="input-premium w-full"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Canal <span className="text-red-400">*</span></label>
                        <select
                          value={channel}
                          onChange={(e) => setChannel(e.target.value as any)}
                          className="input-premium w-full bg-black text-white"
                        >
                          <option value="whatsapp">WhatsApp</option>
                          <option value="email">E-mail</option>
                          <option value="sms">SMS (API)</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Segmento (Público) <span className="text-red-400">*</span></label>
                        <select
                          value={targetAudience}
                          onChange={(e) => setTargetAudience(e.target.value as any)}
                          className="input-premium w-full bg-black text-white"
                        >
                          <option value="all">Todos os Clientes</option>
                          <option value="vip">Apenas Clientes VIP</option>
                          <option value="birthdays">Aniversariantes do Mês</option>
                          <option value="inactive">Clientes Inativos</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Vincular a uma Promoção Ativa (Opcional)</label>
                      <select
                        value={promotionId}
                        onChange={(e) => setPromotionId(e.target.value)}
                        className="input-premium w-full bg-black text-white"
                      >
                        <option value="">Nenhuma promoção vinculada</option>
                        {promotions?.filter(p => p.active)?.map(promo => (
                          <option key={promo.id} value={promo.id}>{promo.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5 mt-2">
                       <div className="flex justify-between">
                         <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Mensagem <span className="text-red-400">*</span></label>
                         <span className="text-[9px] text-[#D4AF37]">Use {'{cliente}'} para o nome</span>
                       </div>
                       <textarea
                         required
                         rows={5}
                         value={message}
                         onChange={(e) => setMessage(e.target.value)}
                         placeholder="Olá {cliente}, preparamos descontos imperdíveis..."
                         className="input-premium resize-none"
                       />
                    </div>
                  </form>
                </div>
              </div>

              {/* Preview Side */}
              <div className="w-full md:w-1/3 bg-[#0a0a0a] flex flex-col md:overflow-y-auto">
                <div className="p-4 flex justify-between items-center md:justify-end pb-0">
                  <span className="text-[9px] uppercase font-bold tracking-widest text-gray-500 block md:hidden">Live Preview</span>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors hidden md:block">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="p-6 flex-1 flex flex-col">
                   <h4 className="text-[10px] uppercase font-bold tracking-widest text-gray-500 mb-4 text-center">Pré-visualização do Disparo</h4>
                   
                   {/* Phone Mockup for WhatsApp/SMS, Email for Email */}
                   <div className="flex-1 bg-[#dff5e3] rounded-2xl border-4 border-[#121212] overflow-hidden flex flex-col relative shadow-lg">
                      <div className="bg-[#075E54] text-white p-3 flex items-center gap-2">
                         <div className="w-8 h-8 rounded-full bg-white/20 flex flex-shrink-0 items-center justify-center font-bold">A</div>
                         <div className="leading-tight">
                           <p className="font-semibold text-sm">AdegaPro O...</p>
                         </div>
                      </div>
                      <div className="p-4 flex-1 overflow-y-auto pattern-bg">
                         <div className="bg-white text-gray-800 p-3 rounded-tr-xl rounded-bl-xl rounded-br-xl text-[13px] shadow-sm relative ml-2 mt-2 break-words">
                            <span className="absolute -left-2 top-0 border-[6px] border-transparent border-t-white border-r-white"></span>
                            {message ? (
                              <span className="whitespace-pre-line">{message.replace('{cliente}', 'Marcos')}</span>
                            ) : (
                              <span className="text-gray-400 italic">Sua mensagem aparecerá aqui...</span>
                            )}
                         </div>
                      </div>
                   </div>

                   <div className="mt-6 flex flex-col items-center bg-[#1E1E1E] p-3 rounded-xl border border-white/5">
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">Alcance Estimado</p>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-[#D4AF37]" />
                        <span className="text-lg font-mono font-bold text-white">{getTargetClientsCount(targetAudience)}</span>
                      </div>
                   </div>
                </div>

                <div className="p-6 border-t border-white/5 bg-[#121212]">
                   <button
                      form="campaign-form"
                      type="submit"
                      className="w-full py-3 rounded text-xs font-bold font-serif italic uppercase tracking-widest bg-[#7B112C] text-white hover:bg-[#921435] transition-all border border-[#D4AF37]/30 shadow-lg justify-center flex items-center gap-2"
                   >
                     <Plus className="w-4 h-4" /> Criar Rascunho
                   </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

// Add a simple pattern for the WhatsApp mockup background
const style = document.createElement('style');
style.textContent = `
  .pattern-bg {
    background-color: #E5DDD5;
    background-image: url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23d1d1d1' fill-opacity='0.4' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E");
  }
`;
document.head.appendChild(style);
