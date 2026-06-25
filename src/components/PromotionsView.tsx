/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Promotion, Product } from '../types';
import { 
  Percent, 
  Plus, 
  Trash2, 
  Calendar, 
  Tag, 
  Clock, 
  Search,
  Eye,
  MousePointerClick,
  Ticket,
  Send,
  MessageCircle,
  Link as LinkIcon,
  X,
  Megaphone,
  BarChart3,
  Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PromotionsViewProps {
  promotions: Promotion[];
  products: Product[];
  onAddPromotion: (promo: Omit<Promotion, 'id'>) => void;
  onDeletePromotion: (id: string) => void;
  onTogglePromotion: (id: string, active: boolean) => void;
}

export default function PromotionsView({
  promotions,
  products,
  onAddPromotion,
  onDeletePromotion,
  onTogglePromotion
}: PromotionsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); // +7 days

  const resetForm = () => {
    setName('');
    setDescription('');
    setSelectedProductId('');
    setDiscountPercentage('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !selectedProductId || !discountPercentage) return;

    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    onAddPromotion({
      name,
      description,
      productId: selectedProductId,
      productName: product.name,
      discountPercentage: parseInt(discountPercentage) || 0,
      startDate,
      endDate,
      active: true,
      views: 0,
      clicks: 0,
      couponsUsed: 0
    });

    setIsModalOpen(false);
    resetForm();
  };

  const getProductOriginalPrice = (id: string) => {
    return products.find(p => p.id === id)?.salePrice || 0;
  };
  
  const getProductImage = (id: string) => {
    return products.find(p => p.id === id)?.image || '';
  };

  const filteredPromotions = promotions.filter(p => 
    (p.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
    (p.productName?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const handleSendClients = (e: React.MouseEvent, promo: Promotion) => {
    e.stopPropagation();
    alert(`Campanha enviada para a base de clientes: ${promo.name}`);
  };

  const handleShareWhatsApp = (e: React.MouseEvent, promo: Promotion) => {
    e.stopPropagation();
    const text = encodeURIComponent(`Olha essa oferta! ${promo.productName} com ${promo.discountPercentage}% de desconto na AdegaPro. Aproveite!`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleCopyLink = (e: React.MouseEvent, promo: Promotion) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`https://adegapro.com/oferta/${promo.id}`);
    alert(`Link copiado para a área de transferência!`);
  };

  return (
    <div className="space-y-6 lg:space-y-8" id="promotions-view-root">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl lg:text-4xl font-serif italic text-white mb-2 leading-tight flex items-center gap-3">
            Marketing & Ofertas
          </h1>
          <p className="text-gray-500 text-xs uppercase tracking-[0.2em] font-sans">
            AdegaPro • Campanhas Promocionais
          </p>
        </div>
        
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-[#D4AF37] text-[#121212] px-6 py-3 rounded hover:bg-[#c49e2e] transition-all font-serif italic font-bold uppercase tracking-widest text-xs border border-[#D4AF37]/50 shadow-lg justify-center w-full md:w-auto shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          Criar Campanha
        </button>
      </div>

      {/* FILTER PANEL */}
      <div className="flex flex-col md:flex-row gap-4 justify-between bg-[#1E1E1E] border border-white/5 p-4 rounded-xl">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar campanha ou produto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-premium pl-10 w-full bg-[#121212] border-white/10"
          />
        </div>
        
        <div className="flex items-center gap-2 px-3">
          <BarChart3 className="w-5 h-5 text-gray-500" />
          <span className="text-xs uppercase tracking-widest font-semibold text-gray-400">Desempenho Geral</span>
        </div>
      </div>

      {/* PROMOTIONS LISTING */}
      {filteredPromotions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-[#1E1E1E] rounded-xl border border-white/5">
          <Megaphone className="w-12 h-12 text-white/20 mb-4" />
          <p className="text-gray-400 font-medium">Nenhuma campanha promocional ativa.</p>
          <button onClick={handleOpenAdd} className="mt-4 text-xs text-[#D4AF37] font-semibold hover:underline uppercase tracking-wider">
            Lançar primeira campanha
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredPromotions.map((p) => {
            const originalPrice = getProductOriginalPrice(p.productId);
            const discountedPrice = originalPrice * (1 - p.discountPercentage / 100);
            const imageUrl = getProductImage(p.productId);

            return (
              <div
                key={p.id}
                className={`bg-[#1E1E1E] border border-white/5 hover:border-[#D4AF37]/30 rounded-xl overflow-hidden shadow-sm transition-all duration-300 flex flex-col group ${!p.active ? 'opacity-70 grayscale' : ''}`}
              >
                {/* Header Information */}
                <div className="p-5 flex flex-col md:flex-row gap-5">
                  {/* Thumbnail */}
                  <div className="w-full md:w-28 h-28 bg-[#121212] rounded-lg border border-white/5 overflow-hidden flex-shrink-0 relative">
                    {imageUrl ? (
                      <img src={imageUrl} alt={p.productName} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/10"><ImageIcon className="w-8 h-8" /></div>
                    )}
                    <div className="absolute top-2 left-2 bg-[#7B112C] text-white px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider shadow">
                      -{p.discountPercentage}%
                    </div>
                  </div>

                  {/* Core details */}
                  <div className="flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-1">
                       <h3 className="text-lg font-serif italic text-white line-clamp-1" title={p.name}>{p.name}</h3>
                       <label className="inline-flex items-center cursor-pointer select-none shrink-0" title="Ativar/Pausar">
                          <input 
                            type="checkbox" 
                            checked={p.active} 
                            onChange={(e) => onTogglePromotion(p.id, e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-7 h-4 bg-gray-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#7b112c] relative"></div>
                       </label>
                    </div>
                    
                    <p className="text-xs text-[#D4AF37] font-medium mb-1 line-clamp-1">{p.productName}</p>
                    <p className="text-[10px] text-gray-500 leading-tight mb-3 line-clamp-2">{p.description}</p>
                    
                    <div className="mt-auto flex justify-between items-end">
                       <div className="flex flex-col">
                         <span className="text-[9px] uppercase tracking-wider text-gray-500 line-through">De R$ {originalPrice.toFixed(2)}</span>
                         <span className="text-base font-serif italic text-white leading-none mt-0.5">Por R$ {discountedPrice.toFixed(2)}</span>
                       </div>
                       <div className="text-[9px] uppercase tracking-wider text-gray-500 text-right">
                         <p>Início: <span className="text-gray-300">{new Date(p.startDate + 'T00:00:00').toLocaleDateString('pt-BR')}</span></p>
                         <p>Fim: <span className="text-gray-300">{new Date(p.endDate + 'T00:00:00').toLocaleDateString('pt-BR')}</span></p>
                       </div>
                    </div>
                  </div>
                </div>

                {/* Statistics Row */}
                <div className="bg-[#121212] border-y border-white/5 p-4 py-3 grid grid-cols-3 divide-x divide-white/5 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                      <Eye className="w-3.5 h-3.5" /> <span className="text-[9px] uppercase tracking-wider font-semibold">Visitas</span>
                    </div>
                    <span className="font-mono text-white text-sm">{p.views?.toLocaleString('pt-BR') || 0}</span>
                  </div>
                  <div className="flex flex-col items-center justify-center">
                    <div className="flex items-center gap-1.5 text-gray-400 mb-1">
                      <MousePointerClick className="w-3.5 h-3.5" /> <span className="text-[9px] uppercase tracking-wider font-semibold">Cliques</span>
                    </div>
                    <span className="font-mono text-white text-sm">{p.clicks?.toLocaleString('pt-BR') || 0}</span>
                  </div>
                  <div className="flex flex-col items-center justify-center">
                    <div className="flex items-center gap-1.5 text-[#D4AF37] mb-1">
                      <Ticket className="w-3.5 h-3.5" /> <span className="text-[9px] uppercase tracking-wider font-semibold">Conversões</span>
                    </div>
                    <span className="font-mono text-[#D4AF37] text-sm">{p.couponsUsed?.toLocaleString('pt-BR') || 0}</span>
                  </div>
                </div>

                {/* Actions Row */}
                <div className="flex divide-x divide-white/5">
                  <button 
                    onClick={(e) => handleSendClients(e, p)}
                    className="flex-1 py-3 text-[10px] uppercase tracking-widest font-bold text-gray-400 hover:text-white hover:bg-white/5 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" /> Enviar <span className="hidden sm:inline">para Clientes</span>
                  </button>
                  <button 
                    onClick={(e) => handleShareWhatsApp(e, p)}
                    className="flex-1 py-3 text-[10px] uppercase tracking-widest font-bold text-emerald-500 hover:text-emerald-400 hover:bg-emerald-950/20 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> Compartilhar
                  </button>
                  <button 
                    onClick={(e) => handleCopyLink(e, p)}
                    className="flex-1 py-3 text-[10px] uppercase tracking-widest font-bold text-gray-400 hover:text-white hover:bg-white/5 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <LinkIcon className="w-3.5 h-3.5" /> Gerar Link
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Remover a campanha "${p.name}"?`)) onDeletePromotion(p.id);
                    }}
                    className="w-12 py-3 text-gray-500 hover:text-red-400 hover:bg-red-950/20 flex items-center justify-center transition-colors shrink-0"
                    title="Excluir Campanha"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: CREATE CAMPAIGN */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#121212] border border-[#D4AF37]/20 rounded-2xl w-full max-w-4xl overflow-y-auto md:overflow-hidden shadow-2xl my-8 relative flex flex-col md:flex-row max-h-[90vh]"
            >
              {/* Left side Form */}
              <div className="w-full md:w-2/3 flex flex-col border-r border-white/5 md:overflow-y-auto">
                <div className="bg-[#1E1E1E] p-4 md:p-6 border-b border-white/5 flex items-center justify-between shrink-0">
                  <div>
                    <h2 className="text-xl md:text-2xl font-serif italic text-white flex items-center gap-2">
                       <Megaphone className="w-5 h-5 text-[#D4AF37]" /> Nova Campanha
                    </h2>
                    <p className="text-[10px] uppercase tracking-widest text-[#D4AF37] mt-1">Configure as regras da promoção</p>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 bg-black/20 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors block md:hidden">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-4 md:p-6">
                  <form id="promo-form" onSubmit={handleSubmit} className="space-y-5">
                    {/* Name */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Nome da Campanha <span className="text-red-400">*</span></label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: Oferta Relâmpago de Inverno"
                        className="input-premium w-full"
                      />
                    </div>

                    {/* Description */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Descrição (Pitch de Vendas) <span className="text-red-400">*</span></label>
                      <textarea
                        required
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Escreva um texto chamativo para as redes sociais..."
                        className="input-premium w-full h-20 resize-none text-sm"
                      />
                    </div>

                    {/* Product & Discount */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2 flex flex-col gap-1.5">
                        <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Produto Participante <span className="text-red-400">*</span></label>
                         <select
                          required
                          value={selectedProductId}
                          onChange={(e) => setSelectedProductId(e.target.value)}
                          className="input-premium w-full"
                        >
                          <option value="">-- Selecione o Rótulo --</option>
                          {products.map((p) => {
                            const activePromos = promotions.filter(pr => pr.active).map(pr => pr.productId);
                            const alreadyInPromo = activePromos.includes(p.id);
                            return (
                              <option key={p.id} value={p.id} disabled={alreadyInPromo}>
                                {p.name} {alreadyInPromo ? '(Em Promoção)' : ''}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                      
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Desconto <span className="text-red-400">*</span></label>
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            max="99"
                            required
                            value={discountPercentage}
                            onChange={(e) => setDiscountPercentage(e.target.value)}
                            placeholder="0"
                            className="input-premium w-full pr-8 text-right font-mono font-bold text-white text-lg"
                          />
                          <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        </div>
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Data Início <span className="text-red-400">*</span></label>
                        <input
                          type="date"
                          required
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="input-premium w-full font-mono text-xs"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Data Fim <span className="text-red-400">*</span></label>
                        <input
                          type="date"
                          required
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="input-premium w-full font-mono text-xs"
                        />
                      </div>
                    </div>
                  </form>
                </div>
              </div>

              {/* Right side Mobile App Preview */}
              <div className="w-full md:w-1/3 bg-[#0a0a0a] flex flex-col md:overflow-y-auto">
                <div className="p-4 flex justify-between items-center md:justify-end pb-0">
                  <span className="text-[9px] uppercase font-bold tracking-widest text-gray-500 block md:hidden">Live Preview</span>
                  <button onClick={() => setIsModalOpen(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors hidden md:block">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-center relative">
                  <div className="text-center mb-6">
                    <h4 className="text-[10px] uppercase font-bold tracking-widest text-gray-500 mb-1">Pré-visualização do Anúncio</h4>
                    <p className="text-xs text-gray-600">Como seu cliente verá no link a oferta.</p>
                  </div>

                  {/* Mockup Card */}
                  <div className="bg-[#121212] border border-[#D4AF37]/20 rounded-xl overflow-hidden shadow-2xl scale-100 origin-center mx-auto w-full max-w-sm">
                     <div className="h-32 bg-[#1E1E1E] relative border-b border-white/5 flex items-center justify-center overflow-hidden">
                       {selectedProductId && getProductImage(selectedProductId) ? (
                         <img src={getProductImage(selectedProductId)} className="w-full h-full object-cover opacity-80" alt="Produto" />
                       ) : (
                         <ImageIcon className="w-8 h-8 text-white/5" />
                       )}
                       {discountPercentage && (
                          <div className="absolute top-3 right-3 bg-[#7B112C] text-white px-2 py-1 rounded text-xs font-bold shadow-lg border border-white/10">
                            -{discountPercentage}% OFF
                          </div>
                       )}
                     </div>
                     <div className="p-4">
                        <div className="flex items-center gap-1.5 mb-2">
                           <Tag className="w-3 h-3 text-[#D4AF37]" />
                           <span className="text-[9px] uppercase tracking-widest text-[#D4AF37] font-bold line-clamp-1">
                             {name || 'Nome da Campanha'}
                           </span>
                        </div>
                        <h4 className="text-white font-serif italic line-clamp-2 leading-tight mb-2">
                           {selectedProductId 
                             ? products.find(p => p.id === selectedProductId)?.name 
                             : 'Selecione um Produto'}
                        </h4>
                        <p className="text-[10px] text-gray-400 line-clamp-2 leading-tight mb-4">
                           {description || 'A descrição aparecerá aqui...'}
                        </p>
                        
                        <div className="flex items-end justify-between mt-auto">
                           {selectedProductId ? (
                              <div className="flex flex-col">
                                <span className="text-[10px] text-gray-500 line-through">R$ {getProductOriginalPrice(selectedProductId).toFixed(2)}</span>
                                <span className="text-lg text-emerald-400 font-bold font-mono">
                                  R$ {(getProductOriginalPrice(selectedProductId) * (1 - (parseInt(discountPercentage) || 0) / 100)).toFixed(2)}
                                </span>
                              </div>
                           ) : (
                             <div className="flex flex-col mt-2">
                                <span className="text-[10px] text-gray-600 line-through">R$ 0,00</span>
                                <span className="text-lg text-gray-700 font-bold font-mono">R$ 0,00</span>
                              </div>
                           )}
                           <div className="bg-[#D4AF37] text-black px-3 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider">
                             Comprar
                           </div>
                        </div>
                     </div>
                  </div>
                </div>

                <div className="p-6 border-t border-white/5 bg-[#121212]">
                   <button
                      form="promo-form"
                      type="submit"
                      className="w-full py-3 rounded text-xs font-bold font-serif italic uppercase tracking-widest bg-[#7B112C] text-white hover:bg-[#921435] transition-all border border-[#D4AF37]/30 shadow-lg justify-center flex items-center gap-2"
                   >
                     <Megaphone className="w-4 h-4" /> Lançar Campanha
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

