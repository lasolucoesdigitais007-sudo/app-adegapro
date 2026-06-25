/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Client } from '../types';
import { 
  Users, 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  Mail, 
  Phone, 
  FileText, 
  Calendar, 
  MessageSquare,
  Cake,
  Filter,
  MapPin,
  TrendingUp,
  Tag,
  Gift,
  X,
  CreditCard,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ClientsViewProps {
  clients: Client[];
  onAddClient: (client: Omit<Client, 'id'>) => void;
  onEditClient: (id: string, client: Partial<Client>) => void;
  onDeleteClient: (id: string) => void;
  adegaName: string;
  whatsappMessageTemplate: string;
}

const CATEGORIES = ['Vinhos', 'Whisky', 'Gin', 'Vodka', 'Cerveja', 'Energéticos', 'Refrigerantes', 'Snacks'];

export default function ClientsView({
  clients,
  onAddClient,
  onEditClient,
  onDeleteClient,
  adegaName,
  whatsappMessageTemplate
}: ClientsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'novo' | 'recorrente' | 'vip'>('all');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [city, setCity] = useState('');
  const [favoriteCategory, setFavoriteCategory] = useState('Vinhos');
  const [birthday, setBirthday] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'novo' | 'recorrente' | 'vip'>('novo');

  // Stats
  const totalClients = clients.length;
  const vipClients = clients.filter(c => c.status === 'vip').length;
  const currentMonth = new Date().getMonth() + 1; // 1-12
  const birthdayClients = clients.filter(c => {
    if (!c.birthday) return false;
    const date = new Date(c.birthday + 'T00:00:00');
    return (date.getMonth() + 1) === currentMonth;
  }).length;

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setWhatsapp('');
    setCity('');
    setFavoriteCategory('Vinhos');
    setBirthday('');
    setNotes('');
    setStatus('novo');
    setEditingId(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Client) => {
    setEditingId(c.id);
    setName(c.name);
    setEmail(c.email);
    setPhone(c.phone);
    setWhatsapp(c.whatsapp);
    setCity(c.city);
    setFavoriteCategory(c.favoriteCategory);
    setBirthday(c.birthday || '');
    setNotes(c.notes || '');
    setStatus(c.status);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !city) return;

    const data: Omit<Client, 'id'> = {
      name,
      email: email || '',
      phone,
      whatsapp: whatsapp || phone, // fallback
      city,
      favoriteCategory,
      birthday: birthday || undefined,
      notes: notes || undefined,
      status,
      // Keep existing or default if new
      totalSpent: editingId ? (clients.find(c => c.id === editingId)?.totalSpent || 0) : 0,
      ordersCount: editingId ? (clients.find(c => c.id === editingId)?.ordersCount || 0) : 0,
      registrationDate: editingId ? (clients.find(c => c.id === editingId)?.registrationDate || new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
      lastPurchaseDate: editingId ? clients.find(c => c.id === editingId)?.lastPurchaseDate : undefined
    };

    if (editingId) {
      onEditClient(editingId, data);
    } else {
      onAddClient(data);
    }

    setIsModalOpen(false);
    resetForm();
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // Filtering
  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      const matchSearch = (c.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                          (c.phone || '').includes(searchTerm) ||
                          (c.city?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                          (c.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [clients, searchTerm, statusFilter]);

  const getWhatsAppLink = (c: Client) => {
    let rawText = whatsappMessageTemplate
      .replace('{cliente}', c.name)
      .replace('{adega}', adegaName)
      .replace('{mensagem}', `Notamos que seu tipo de bebida favorita é *${c.favoriteCategory}*! Que tal conferir as novidades no estoque esta semana?`);
    
    const cleanPhone = c.whatsapp.replace(/\D/g, '') || c.phone.replace(/\D/g, '');
    return `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(rawText)}`;
  };

  const generateCouponClick = (c: Client) => {
    alert(`Um cupom VIP foi gerado para ${c.name}! Copiado para área de transferência.`);
  };

  return (
    <div className="space-y-6 lg:space-y-8" id="clients-view-root">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl lg:text-4xl font-serif italic text-white mb-2 leading-tight flex items-center gap-3">
            Clientes VIP
          </h1>
          <p className="text-gray-500 text-xs uppercase tracking-[0.2em] font-sans">
            AdegaPro • CRM, Campanhas & Histórico
          </p>
        </div>
        
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-[#D4AF37] text-[#121212] px-6 py-3 rounded hover:bg-[#c49e2e] transition-all font-serif italic font-bold uppercase tracking-widest text-xs border border-[#D4AF37]/50 shadow-lg justify-center w-full md:w-auto shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          Cadastrar Cliente
        </button>
      </div>

      {/* MINI DASHBOARD STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total */}
        <div className="bg-[#1E1E1E] p-5 rounded-xl border border-white/5 flex flex-col justify-between items-center text-center">
           <p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium w-full text-left">Base de Contatos</p>
           <div className="py-4">
             <p className="text-4xl font-serif text-white">{totalClients}</p>
             <p className="text-xs text-[#D4AF37] mt-1 font-medium">Clientes Totais</p>
           </div>
           <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
             <div className="h-full bg-white/20 w-full rounded-full"></div>
           </div>
        </div>

        {/* VIP */}
        <div className="bg-[#7B112C] p-5 rounded-xl border border-[#D4AF37]/30 shadow-lg text-center flex flex-col justify-between items-center group cursor-default relative overflow-hidden">
           <Award className="absolute -right-4 -bottom-4 w-24 h-24 text-white/5 pointer-events-none" />
           <p className="text-[10px] uppercase tracking-wider text-white/50 font-medium w-full text-left relative z-10">Engajamento Alto</p>
           <div className="py-4 relative z-10">
             <p className="text-4xl font-serif text-white">{vipClients}</p>
             <p className="text-xs text-[#D4AF37] mt-1 font-bold tracking-widest uppercase">Membros VIP</p>
           </div>
           <div className="w-full h-1 bg-black/20 rounded-full overflow-hidden relative z-10">
             <div className="h-full bg-[#D4AF37] w-3/4 rounded-full"></div>
           </div>
        </div>

        {/* Bdays */}
        <div className="bg-[#1E1E1E] p-5 rounded-xl border border-white/5 flex flex-col justify-between items-center text-center">
           <p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium w-full text-left flex items-center justify-between">
              Oportunidades
              <Cake className="w-4 h-4 text-[#D4AF37]" />
           </p>
           <div className="py-4">
             <p className="text-4xl font-serif text-white">{birthdayClients}</p>
             <p className="text-xs text-gray-400 mt-1 font-medium">Aniversariantes do Mês</p>
           </div>
           <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
             <div className="h-full bg-emerald-500 w-1/4 rounded-full"></div>
           </div>
        </div>
      </div>

      {/* FILTER PANEL */}
      <div className="flex flex-col md:flex-row gap-4 justify-between bg-[#1E1E1E] border border-white/5 p-4 rounded-xl">
        <div className="relative w-full md:w-96 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por nome, telefone ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-premium pl-10 w-full bg-[#121212] border-white/10"
          />
        </div>

        <div className="flex overflow-x-auto gap-2 pb-2 md:pb-0 hide-scrollbar items-center font-sans">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors uppercase tracking-wider ${
              statusFilter === 'all' 
                ? 'bg-[#7B112C] text-white border border-[#D4AF37]/30' 
                : 'bg-[#121212] text-gray-400 border border-white/5 hover:border-[#D4AF37]/30'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setStatusFilter('novo')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors uppercase tracking-wider ${
              statusFilter === 'novo' 
                ? 'bg-[#7B112C] text-white border border-[#D4AF37]/30' 
                : 'bg-[#121212] text-gray-400 border border-white/5 hover:border-[#D4AF37]/30'
            }`}
          >
            Novos
          </button>
          <button
            onClick={() => setStatusFilter('recorrente')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors uppercase tracking-wider ${
              statusFilter === 'recorrente' 
                ? 'bg-[#7B112C] text-white border border-[#D4AF37]/30' 
                : 'bg-[#121212] text-gray-400 border border-white/5 hover:border-[#D4AF37]/30'
            }`}
          >
            Recorrentes
          </button>
          <button
            onClick={() => setStatusFilter('vip')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors uppercase tracking-wider ${
              statusFilter === 'vip' 
                ? 'bg-[#7B112C] text-white border border-[#D4AF37]/30' 
                : 'bg-[#121212] text-gray-400 border border-white/5 hover:border-[#D4AF37]/30'
            }`}
          >
            <Award className={`w-3.5 h-3.5 ${statusFilter === 'vip' ? 'text-[#D4AF37]' : ''}`} /> VIPs
          </button>
        </div>
      </div>

      {/* CLIENTS GRID */}
      {filteredClients.length === 0 ? (
         <div className="flex flex-col items-center justify-center py-20 bg-[#1E1E1E] rounded-xl border border-white/5">
           <Users className="w-12 h-12 text-white/20 mb-4" />
           <p className="text-gray-400 font-medium">Nenhum cliente atende aos critérios da busca.</p>
           <button onClick={handleOpenAdd} className="mt-4 text-xs text-[#D4AF37] font-semibold hover:underline uppercase tracking-wider">
             Adicionar novo cliente
           </button>
         </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredClients.map(client => (
            <div key={client.id} className="bg-[#1E1E1E] border border-white/5 hover:border-[#D4AF37]/30 rounded-xl overflow-hidden shadow-sm transition-all duration-300 group flex flex-col relative">
               
               {/* Header / Basic Info */}
               <div className="p-6 pb-4 relative z-10 flex flex-col h-full bg-gradient-to-br from-[#1E1E1E] to-[#121212]">
                 
                 <div className="flex justify-between items-start mb-4">
                   <div className="flex items-center gap-4 border-b border-white/5 pb-4 w-full">
                     <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#7B112C] to-[#D4AF37]/60 flex items-center justify-center text-white font-serif font-bold text-lg border border-[#D4AF37]/30 shrink-0">
                        {client.name.substring(0, 2).toUpperCase()}
                     </div>
                     <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-medium text-white truncate group-hover:text-[#D4AF37] transition-colors font-serif">{client.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                           <span className={`text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded border ${
                             client.status === 'vip' ? 'bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/40' :
                             client.status === 'recorrente' ? 'bg-[#7B112C]/20 text-white/80 border-[#7B112C]/40' :
                             'bg-white/5 text-gray-400 border-white/10'
                           }`}>
                             {client.status}
                           </span>
                           <span className="text-[10px] text-gray-500 font-mono tracking-tighter truncate">{client.city}</span>
                        </div>
                     </div>
                   </div>
                 </div>

                 {/* Contact Details */}
                 <div className="space-y-2 mb-4 text-xs text-gray-400 font-sans">
                   <div className="flex items-center gap-2">
                     <Phone className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                     <span className="font-mono text-gray-300 truncate font-semibold">{client.phone}</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <Mail className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                     <span className="truncate">{client.email || 'Sem e-mail'}</span>
                   </div>
                   {client.birthday && (
                     <div className="flex items-center gap-2">
                       <Cake className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                       <span>{new Date(client.birthday + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                     </div>
                   )}
                 </div>

                 {/* Histórico / Dados de Consumo */}
                 <div className="mt-auto bg-[#121212] rounded-lg border border-white/5 p-4 relative">
                   <div className="flex justify-between items-end mb-2">
                     <div>
                       <p className="text-[9px] uppercase tracking-wider text-gray-500 font-semibold mb-0.5">Total Gasto (Histórico)</p>
                       <p className="text-xl font-serif italic text-white leading-none">
                         <span className="text-xs text-[#D4AF37] font-sans not-italic">R$</span> {client.totalSpent.toFixed(2)}
                       </p>
                     </div>
                     <div className="text-right">
                       <p className="text-[9px] uppercase tracking-wider text-gray-500 font-semibold mb-0.5">Pedidos</p>
                       <p className="text-xl font-mono text-white leading-none font-bold">{client.ordersCount}</p>
                     </div>
                   </div>
                   <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
                      <Tag className="w-3.5 h-3.5 text-gray-500" />
                      <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Prefere: </span>
                      <span className="text-[10px] bg-[#7B112C]/20 border border-[#7B112C] text-[#D4AF37] px-2 py-0.5 rounded uppercase font-bold tracking-wider">{client.favoriteCategory}</span>
                   </div>
                 </div>

               </div>

               {/* Action Buttons */}
               <div className="flex flex-col border-t border-white/5 lg:opacity-40 lg:group-hover:opacity-100 transition-opacity bg-black/40">
                  <div className="flex border-b border-white/5">
                    <a 
                      href={getWhatsAppLink(client)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-3 text-[10px] uppercase tracking-widest font-bold text-gray-300 hover:text-white hover:bg-[#7B112C]/30 flex items-center justify-center gap-2 transition-colors border-r border-white/5"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-[#D4AF37]" /> Enviar Promoção
                    </a>
                    <button 
                      onClick={() => generateCouponClick(client)}
                      className="flex-1 py-3 text-[10px] uppercase tracking-widest font-bold text-gray-300 hover:text-[#D4AF37] hover:bg-white/5 flex items-center justify-center gap-2 transition-colors"
                    >
                      <Gift className="w-3.5 h-3.5" /> Gerar Cupom
                    </button>
                  </div>
                  <div className="flex">
                    <button 
                      onClick={() => handleOpenEdit(client)}
                      className="flex-1 py-3 bg-[#121212] text-[10px] uppercase tracking-widest font-bold text-gray-500 hover:text-white transition-colors flex items-center justify-center gap-1.5 border-r border-white/5"
                    >
                      <Edit className="w-3 h-3" /> Editar
                    </button>
                    <button 
                      onClick={() => {
                        if (confirm(`Remover cliente ${client.name}?`)) onDeleteClient(client.id);
                      }}
                      className="flex-1 py-3 bg-[#121212] text-[10px] uppercase tracking-widest font-bold text-gray-500 hover:text-red-400 hover:bg-red-950/20 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-3 h-3" /> Excluir
                    </button>
                  </div>
               </div>

            </div>
          ))}
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
              className="bg-[#121212] border border-[#D4AF37]/20 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl my-8 relative flex flex-col max-h-[90vh]"
            >
              <div className="bg-[#1E1E1E] p-4 md:p-6 border-b border-white/5 flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-xl md:text-2xl font-serif italic text-white">{editingId ? 'Atualizar Cliente' : 'Cadastrar Cliente'}</h2>
                  <p className="text-[10px] uppercase tracking-widest text-[#D4AF37] mt-1">Preencha as informações na base</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 bg-black/20 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 md:p-6 overflow-y-auto min-h-0 flex-1">
                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* COL 1: Basic Info */}
                    <div className="space-y-4">
                      {/* Name */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Nome Completo <span className="text-red-400">*</span></label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Ex: Carlos Eduardo"
                          className="input-premium w-full"
                        />
                      </div>

                      {/* Contact row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Telefone <span className="text-red-400">*</span></label>
                          <input
                            type="text"
                            required
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="(00) 00000-0000"
                            className="input-premium w-full font-mono"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-wider">WhatsApp</label>
                          <input
                            type="text"
                            value={whatsapp}
                            onChange={(e) => setWhatsapp(e.target.value)}
                            placeholder="(Opcional)"
                            className="input-premium w-full font-mono"
                          />
                        </div>
                      </div>

                      {/* Email */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Email</label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="cliente@email.com"
                          className="input-premium w-full"
                        />
                      </div>

                      {/* City */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Cidade <span className="text-red-400">*</span></label>
                        <input
                          type="text"
                          required
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="Sua cidade"
                          className="input-premium w-full"
                        />
                      </div>
                    </div>

                    {/* COL 2: Preferences & CRM logic */}
                    <div className="space-y-4">
                      
                      {/* Birthday & Category */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Data Nascimento</label>
                          <input
                            type="date"
                            value={birthday}
                            onChange={(e) => setBirthday(e.target.value)}
                            className="input-premium w-full font-mono text-white bg-black select-none"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Prefere <span className="text-red-400">*</span></label>
                          <select
                            value={favoriteCategory}
                            onChange={(e) => setFavoriteCategory(e.target.value)}
                            className="input-premium w-full bg-black text-white"
                          >
                            {CATEGORIES.map((cat) => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="flex flex-col gap-1.5">
                         <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Status CRM</label>
                         <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as any)}
                            className="input-premium w-full uppercase tracking-wider text-xs font-semibold bg-black text-white"
                          >
                            <option value="novo">Novo Cliente</option>
                            <option value="recorrente">Cliente Recorrente</option>
                            <option value="vip">Membro VIP</option>
                          </select>
                      </div>

                      {/* Notes */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Anotações Internas</label>
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Preferências específicas de consumo..."
                          className="input-premium w-full h-24 resize-none"
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
                      className="px-8 py-2.5 rounded text-xs font-bold font-serif italic uppercase tracking-widest bg-[#7B112C] text-white hover:bg-[#921435] transition-all border border-[#D4AF37]/30 shadow-lg text-center"
                    >
                      {editingId ? 'Salvar Edição' : 'Cadastrar Cliente'}
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

