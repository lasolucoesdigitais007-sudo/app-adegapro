import React, { useState, useMemo } from 'react';
import { Coupon } from '../types';
import { 
  Ticket, 
  Plus, 
  Trash2, 
  Calendar, 
  Percent, 
  DollarSign, 
  Search,
  MessageCircle,
  X,
  Edit,
  BarChart3,
  Users,
  Award,
  Gift,
  Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CouponsViewProps {
  coupons: Coupon[];
  onAddCoupon: (coupon: Omit<Coupon, 'id'>) => void;
  onEditCoupon?: (id: string, updated: Partial<Coupon>) => void; // Made optional if App doesn't pass it yet
  onDeleteCoupon: (id: string) => void;
  onToggleCoupon: (id: string, active: boolean) => void;
}

export default function CouponsView({
  coupons,
  onAddCoupon,
  onEditCoupon,
  onDeleteCoupon,
  onToggleCoupon
}: CouponsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [minOrderValue, setMinOrderValue] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  const [type, setType] = useState<'primeira_compra' | 'vip' | 'aniversariante' | 'promocao_especial'>('promocao_especial');

  // Stats
  const totalCoupons = coupons.length;
  const activeCoupons = coupons.filter(c => c.active).length;
  const totalUsages = coupons.reduce((sum, c) => sum + (c.usageCount || 0), 0);

  const resetForm = () => {
    setCode('');
    setDiscountType('percentage');
    setDiscountValue('');
    setMinOrderValue('');
    setExpiryDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setUsageLimit('');
    setType('promocao_especial');
    setEditingId(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Coupon) => {
    setEditingId(c.id);
    setCode(c.code);
    setDiscountType(c.discountType);
    setDiscountValue(c.discountValue.toString());
    setMinOrderValue(c.minOrderValue.toString());
    setExpiryDate(c.expiryDate);
    setUsageLimit(c.usageLimit.toString());
    setType(c.type || 'promocao_especial');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !discountValue) return;

    const uppercaseCode = code.toUpperCase().trim().replace(/\s+/g, '');

    const data: Omit<Coupon, 'id'> = {
      code: uppercaseCode,
      discountType,
      discountValue: parseFloat(discountValue) || 0,
      minOrderValue: parseFloat(minOrderValue) || 0,
      expiryDate: expiryDate || '2026-12-31',
      active: editingId ? (coupons.find(c => c.id === editingId)?.active ?? true) : true,
      usageLimit: parseInt(usageLimit) || 100,
      usageCount: editingId ? (coupons.find(c => c.id === editingId)?.usageCount || 0) : 0,
      type
    };

    if (editingId && onEditCoupon) {
      onEditCoupon(editingId, data);
    } else {
      onAddCoupon(data);
    }

    setIsModalOpen(false);
    resetForm();
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const handleShareWhatsApp = (e: React.MouseEvent, c: Coupon) => {
    e.stopPropagation();
    const discountText = c.discountType === 'percentage' ? `${c.discountValue}%` : `R$ ${c.discountValue}`;
    const text = encodeURIComponent(`Ganhe ${discountText} de desconto na AdegaPro! Use o cupom *${c.code}*. Aproveite!`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const filteredCoupons = useMemo(() => {
    return coupons.filter(c => {
      const matchSearch = c.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = typeFilter === 'all' || c.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [coupons, searchTerm, typeFilter]);

  const getTypeLabel = (t: string) => {
    switch (t) {
      case 'primeira_compra': return 'Primeira Compra';
      case 'vip': return 'Cliente VIP';
      case 'aniversariante': return 'Aniversariantes';
      case 'promocao_especial': return 'Promoção Especial';
      default: return 'Geral';
    }
  };

  const getTypeIcon = (t: string) => {
    switch (t) {
      case 'primeira_compra': return <Users className="w-3.5 h-3.5" />;
      case 'vip': return <Award className="w-3.5 h-3.5" />;
      case 'aniversariante': return <Gift className="w-3.5 h-3.5" />;
      case 'promocao_especial': return <Star className="w-3.5 h-3.5" />;
      default: return <Ticket className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="space-y-6 lg:space-y-8" id="coupons-view-root">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl lg:text-4xl font-serif italic text-white mb-2 leading-tight flex items-center gap-3">
            Cupons de Desconto
          </h1>
          <p className="text-gray-500 text-xs uppercase tracking-[0.2em] font-sans">
            AdegaPro • Fidelização & Vendas
          </p>
        </div>
        
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-[#D4AF37] text-[#121212] px-6 py-3 rounded hover:bg-[#c49e2e] transition-all font-serif italic font-bold uppercase tracking-widest text-xs border border-[#D4AF37]/50 shadow-lg justify-center w-full md:w-auto shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          Criar Cupom
        </button>
      </div>

      {/* DASHBOARD STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total */}
        <div className="bg-[#1E1E1E] p-5 rounded-xl border border-white/5 flex flex-col justify-between items-center text-center">
           <p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium w-full text-left">Quantidade Cadastrada</p>
           <div className="py-4 flex flex-col items-center">
             <Ticket className="w-8 h-8 text-[#D4AF37] mb-2" />
             <p className="text-4xl font-serif text-white">{totalCoupons}</p>
             <p className="text-xs text-gray-400 mt-1 font-medium">Cupons Totais</p>
           </div>
        </div>

        {/* Ativos */}
        <div className="bg-[#1E1E1E] p-5 rounded-xl border border-white/5 flex flex-col justify-between items-center text-center">
           <p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium w-full text-left">Disponibilidade</p>
           <div className="py-4 flex flex-col items-center">
             <div className="w-8 h-8 rounded bg-[#7B112C]/20 border border-[#7B112C] text-[#D4AF37] flex items-center justify-center mb-2">
               <Percent className="w-5 h-5" />
             </div>
             <p className="text-4xl font-serif text-white">{activeCoupons}</p>
             <p className="text-xs text-gray-400 mt-1 font-medium">Cupons Ativos</p>
           </div>
        </div>

        {/* Usos */}
        <div className="bg-[#1E1E1E] p-5 rounded-xl border border-white/5 flex flex-col justify-between items-center text-center">
           <p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium w-full text-left">Desempenho</p>
           <div className="py-4 flex flex-col items-center">
             <BarChart3 className="w-8 h-8 text-emerald-500 mb-2" />
             <p className="text-4xl font-serif text-white">{totalUsages}</p>
             <p className="text-xs text-gray-400 mt-1 font-medium">Usos Registrados</p>
           </div>
        </div>
      </div>

      {/* FILTER PANEL */}
      <div className="flex flex-col md:flex-row gap-4 justify-between bg-[#1E1E1E] border border-white/5 p-4 rounded-xl">
        <div className="relative w-full md:w-96 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-premium pl-10 w-full bg-[#121212] border-white/10"
          />
        </div>

        <div className="flex overflow-x-auto gap-2 pb-2 md:pb-0 hide-scrollbar items-center font-sans">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors uppercase tracking-wider ${
              typeFilter === 'all' 
                ? 'bg-[#7B112C] text-white border border-[#D4AF37]/30' 
                : 'bg-[#121212] text-gray-400 border border-white/5 hover:border-[#D4AF37]/30'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setTypeFilter('primeira_compra')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors uppercase tracking-wider ${
              typeFilter === 'primeira_compra' 
                ? 'bg-[#7B112C] text-white border border-[#D4AF37]/30' 
                : 'bg-[#121212] text-gray-400 border border-white/5 hover:border-[#D4AF37]/30'
            }`}
          >
            Primeira Compra
          </button>
          <button
            onClick={() => setTypeFilter('vip')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors uppercase tracking-wider ${
              typeFilter === 'vip' 
                ? 'bg-[#7B112C] text-white border border-[#D4AF37]/30' 
                : 'bg-[#121212] text-gray-400 border border-white/5 hover:border-[#D4AF37]/30'
            }`}
          >
            VIP
          </button>
          <button
            onClick={() => setTypeFilter('aniversariante')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors uppercase tracking-wider ${
              typeFilter === 'aniversariante' 
                ? 'bg-[#7B112C] text-white border border-[#D4AF37]/30' 
                : 'bg-[#121212] text-gray-400 border border-white/5 hover:border-[#D4AF37]/30'
            }`}
          >
            Aniversário
          </button>
        </div>
      </div>

      {/* COUPONS GRID */}
      {filteredCoupons.length === 0 ? (
         <div className="flex flex-col items-center justify-center py-20 bg-[#1E1E1E] rounded-xl border border-white/5">
           <Ticket className="w-12 h-12 text-white/20 mb-4" />
           <p className="text-gray-400 font-medium">Nenhum cupom encontrado.</p>
           <button onClick={handleOpenAdd} className="mt-4 text-xs text-[#D4AF37] font-semibold hover:underline uppercase tracking-wider">
             Criar novo cupom
           </button>
         </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCoupons.map(c => {
            const usagePercent = Math.min(100, Math.round(((c.usageCount || 0) / (c.usageLimit || 1)) * 100));
            // Ensure remaining is calculated correctly, avoiding negative numbers if overallocated
            const usosRestantes = Math.max(0, (c.usageLimit || 0) - (c.usageCount || 0));

            return (
            <div key={c.id} className={`bg-[#1E1E1E] border border-white/5 hover:border-[#D4AF37]/30 rounded-xl overflow-hidden shadow-sm transition-all duration-300 group flex flex-col relative ${!c.active ? 'opacity-70 grayscale' : ''}`}>
               
               {/* Left/Right cutouts for ticket effect */}
               <div className="absolute -left-3 top-[80px] w-6 h-6 bg-[#121212] rounded-full border-r border-[#D4AF37]/20 z-10 hidden md:block"></div>
               <div className="absolute -right-3 top-[80px] w-6 h-6 bg-[#121212] rounded-full border-l border-[#D4AF37]/20 z-10 hidden md:block"></div>

               <div className="p-6 relative z-10 flex flex-col h-full bg-gradient-to-br from-[#1E1E1E] to-[#121212]">
                 
                 <div className="flex justify-between items-start mb-4 border-b border-white/5 pb-4 border-dashed border-b-2">
                   <div className="flex flex-col px-3 py-1.5 bg-[#7B112C]/20 border border-[#7B112C]/50 rounded text-[#D4AF37] max-w-max">
                     <span className="text-[9px] uppercase tracking-widest text-[#D4AF37]/70 font-semibold mb-0.5">Código</span>
                     <span className="font-mono font-bold text-lg tracking-wider">{c.code}</span>
                   </div>
                   
                   <div className="flex flex-col items-end">
                      <label className="inline-flex items-center cursor-pointer select-none mb-1" title="Ativar/Inativar">
                        <input 
                          type="checkbox" 
                          checked={c.active} 
                          onChange={(e) => onToggleCoupon(c.id, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-7 h-4 bg-gray-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#7b112c] relative"></div>
                      </label>
                      <span className="text-xs font-semibold text-white">
                        {c.discountType === 'percentage' ? (
                          <span className="text-emerald-400 font-mono text-xl">{c.discountValue}% OFF</span>
                        ) : (
                          <span className="text-amber-400 font-mono text-xl">R$ {c.discountValue} OFF</span>
                        )}
                      </span>
                   </div>
                 </div>

                 {/* Type & Dates */}
                 <div className="flex items-center gap-2 mb-3">
                   <span className="flex items-center gap-1.5 px-2 py-1 bg-white/5 border border-white/10 rounded text-[9px] uppercase font-bold tracking-widest text-gray-300">
                     {getTypeIcon(c.type || '')} {getTypeLabel(c.type || '')}
                   </span>
                 </div>

                 <div className="space-y-2 mb-4 text-xs text-gray-400 font-sans">
                   <div className="flex items-center justify-between">
                     <span className="font-semibold text-gray-500 uppercase text-[10px] tracking-wider">Compra Mínima</span>
                     <span className="font-mono text-gray-300">{formatCurrency(c.minOrderValue)}</span>
                   </div>
                   <div className="flex items-center justify-between">
                     <span className="font-semibold text-gray-500 uppercase text-[10px] tracking-wider">Validade</span>
                     <span className="font-mono text-gray-300 flex items-center gap-1.5">
                       <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                       {new Date(c.expiryDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                     </span>
                   </div>
                 </div>

                 {/* Usage Stats (Progress) */}
                 <div className="mt-auto bg-[#121212] rounded-lg border border-white/5 p-4 relative">
                   <div className="flex justify-between items-end mb-2">
                     <div>
                       <p className="text-[9px] uppercase tracking-wider text-gray-500 font-semibold mb-0.5">Usados</p>
                       <p className="text-xl font-mono text-white leading-none font-bold">
                         {c.usageCount}
                       </p>
                     </div>
                     <div className="text-right">
                       <p className="text-[9px] uppercase tracking-wider text-gray-500 font-semibold mb-0.5">Restantes</p>
                       <p className="text-xl font-mono text-[#D4AF37] leading-none font-bold">{usosRestantes}</p>
                     </div>
                   </div>
                   <div className="w-full bg-white/5 rounded-full h-1.5 mt-3 overflow-hidden border border-white/5">
                      <div className="bg-[#D4AF37] h-full rounded-full transition-all duration-500" style={{ width: `${usagePercent}%` }}></div>
                   </div>
                 </div>

               </div>

               {/* Action Buttons */}
               <div className="flex flex-col border-t border-white/5 lg:opacity-40 lg:group-hover:opacity-100 transition-opacity bg-black/40">
                  <button 
                    onClick={(e) => handleShareWhatsApp(e, c)}
                    className="w-full py-3 text-[10px] uppercase tracking-widest font-bold text-emerald-500 hover:text-emerald-400 hover:bg-emerald-950/20 flex items-center justify-center gap-2 transition-colors border-b border-white/5"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> Enviar para WhatsApp
                  </button>
                  <div className="flex">
                    <button 
                      onClick={() => handleOpenEdit(c)}
                      className="flex-1 py-3 bg-[#121212] text-[10px] uppercase tracking-widest font-bold text-gray-500 hover:text-white transition-colors flex items-center justify-center gap-1.5 border-r border-white/5"
                    >
                      <Edit className="w-3 h-3" /> Editar
                    </button>
                    <button 
                      onClick={() => {
                        if (confirm(`Excluir cupom ${c.code}?`)) onDeleteCoupon(c.id);
                      }}
                      className="flex-1 py-3 bg-[#121212] text-[10px] uppercase tracking-widest font-bold text-gray-500 hover:text-red-400 hover:bg-red-950/20 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-3 h-3" /> Excluir
                    </button>
                  </div>
               </div>

            </div>
          )})}
        </div>
      )}

      {/* FORM MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#121212] border border-[#D4AF37]/20 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl my-8 relative flex flex-col max-h-[90vh]"
            >
              <div className="bg-[#1E1E1E] p-4 md:p-6 border-b border-white/5 flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-xl md:text-2xl font-serif italic text-white flex items-center gap-2">
                     <Ticket className="w-5 h-5 text-[#D4AF37]" /> {editingId ? 'Editar Cupom' : 'Criar Novo Cupom'}
                  </h2>
                  <p className="text-[10px] uppercase tracking-widest text-[#D4AF37] mt-1">Configure o código promocional e as regras de ativação</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 bg-black/20 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 md:p-6 overflow-y-auto min-h-0 flex-1">
                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Código & Tipo de Campanha */}
                    <div className="flex flex-col gap-1.5 border border-white/5 p-4 rounded-xl bg-[#1E1E1E]">
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Código Promocional <span className="text-red-400">*</span></label>
                      <input
                        type="text"
                        required
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="Ex: WINE15"
                        className="input-premium w-full font-mono font-bold tracking-wider uppercase text-lg text-white"
                        style={{textTransform: 'uppercase'}}
                      />
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-3">Tipo de Uso <span className="text-red-400">*</span></label>
                      <select
                        value={type}
                        onChange={(e) => setType(e.target.value as any)}
                        className="input-premium w-full bg-black text-white"
                      >
                        <option value="promocao_especial">Promoção Especial</option>
                        <option value="primeira_compra">Primeira Compra</option>
                        <option value="vip">Cliente VIP</option>
                        <option value="aniversariante">Aniversariante</option>
                      </select>
                    </div>

                    {/* Regras do Desconto */}
                    <div className="flex flex-col gap-4 border border-white/5 p-4 rounded-xl bg-[#1E1E1E]">
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                         <div className="flex flex-col gap-1.5">
                           <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Tipo <span className="text-red-400">*</span></label>
                           <select
                             value={discountType}
                             onChange={(e) => setDiscountType(e.target.value as any)}
                             className="input-premium w-full bg-black text-white"
                           >
                             <option value="percentage">% OFF</option>
                             <option value="fixed">R$ Fixo</option>
                           </select>
                         </div>
                         <div className="flex flex-col gap-1.5">
                           <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Valor <span className="text-red-400">*</span></label>
                           <input
                             type="number"
                             min="1"
                             required
                             value={discountValue}
                             onChange={(e) => setDiscountValue(e.target.value)}
                             placeholder="Ex: 15"
                             className="input-premium w-full font-mono text-white text-right"
                           />
                         </div>
                       </div>
                       
                       <div className="flex flex-col gap-1.5">
                         <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Pedido Mínimo (R$)</label>
                         <input
                           type="number"
                           min="0"
                           value={minOrderValue}
                           onChange={(e) => setMinOrderValue(e.target.value)}
                           placeholder="0.00"
                           className="input-premium w-full font-mono text-white bg-black"
                         />
                       </div>
                    </div>

                    {/* Limites & Validade */}
                    <div className="col-span-1 md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6 border border-white/5 p-4 rounded-xl bg-[#1E1E1E]">
                       <div className="flex flex-col gap-1.5">
                         <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Validade <span className="text-red-400">*</span></label>
                         <input
                           type="date"
                           required
                           value={expiryDate}
                           onChange={(e) => setExpiryDate(e.target.value)}
                           className="input-premium w-full font-mono text-sm text-white bg-black select-none"
                         />
                       </div>
                       <div className="flex flex-col gap-1.5">
                         <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Limite Max. de Uso <span className="text-red-400">*</span></label>
                         <input
                           type="number"
                           min="1"
                           required
                           value={usageLimit}
                           onChange={(e) => setUsageLimit(e.target.value)}
                           placeholder="Ex: 100"
                           className="input-premium w-full font-mono"
                         />
                       </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-6 border-t border-white/5 flex flex-col-reverse sm:flex-row gap-3 justify-end shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-6 py-2.5 rounded text-xs font-semibold uppercase tracking-wider text-gray-400 hover:text-white hover:bg-white/5 transition-all text-center"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-8 py-2.5 rounded text-xs font-bold font-serif italic uppercase tracking-widest bg-[#7B112C] text-white hover:bg-[#921435] transition-all border border-[#D4AF37]/30 shadow-lg flex items-center gap-2 justify-center"
                    >
                      <Ticket className="w-4 h-4" /> {editingId ? 'Salvar Alterações' : 'Criar Cupom'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
