import React, { useState, useEffect } from 'react';
import { Wine, Gift, CheckCircle, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ClientesService } from '../services';
import { collection, onSnapshot, getFirestore, doc, setDoc } from 'firebase/firestore';
import { getApp } from 'firebase/app';

export default function LandingPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({ name: '', whatsapp: '', city: '' });
  const [loading, setLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [adegasList, setAdegasList] = useState<any[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState('imperial');

  useEffect(() => {
    const db = getFirestore(getApp());
    const unsub = onSnapshot(collection(db, 'configuracoes'), (snap) => {
      const list = snap.docs
        .map(d => d.data() as any)
        .filter(c => c.empresaId && !['imperial', 'executive', 'vip', 'default', 'empresa_default'].includes(c.empresaId));
      setAdegasList(list);
      if (list.length > 0) {
        setSelectedTenantId(list[0].empresaId);
      }
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.whatsapp || !formData.city) return;
    
    setLoading(true);
    try {
      await ClientesService.create({
        empresaId: selectedTenantId,
        name: formData.name,
        email: `${formData.whatsapp.replace(/\D/g, '')}@whatsapp.com`, // mock email to satisfy required field
        phone: formData.whatsapp,
        whatsapp: formData.whatsapp,
        city: formData.city,
        favoriteCategory: 'Não informado',
        totalSpent: 0,
        ordersCount: 0,
        registrationDate: new Date().toISOString().split('T')[0],
        lastPurchaseDate: '',
        status: 'novo',
        notes: 'Lead capturado via Landing Page promocional',
        loyaltyPoints: 0,
        loyaltyTotalEarned: 0,
        loyaltyTotalRedeemed: 0
      });
      
      // Generate a coupon specifically for this lead
      const code = `BEMVINDO${Math.floor(100 + Math.random() * 900)}`;
      
      // Save coupon to 'cupons' collection so it works in the store!
      const db = getFirestore(getApp());
      await setDoc(doc(db, 'cupons', `${code}_${selectedTenantId}`), {
        empresaId: selectedTenantId,
        code: code,
        discountType: 'percentage',
        discountValue: 15, // 15% discount
        minOrderValue: 40,
        description: 'Cupom de Boas-Vindas da Landing Page',
        active: true,
        expiryDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });

      setCouponCode(code);
      setStep(2);
    } catch (error) {
      console.error(error);
      alert('Erro ao realizar cadastro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col font-sans overflow-x-hidden relative">
      {/* Background Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[#7B112C] opacity-20 rounded-full blur-[150px] pointer-events-none -z-10"></div>
      
      {/* Header */}
      <header className="py-6 px-8 flex justify-between items-center z-10 border-b border-white/5 bg-black/20 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#7B112C] rounded-full flex items-center justify-center border border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.3)]">
            <Wine className="w-5 h-5 text-[#D4AF37]" />
          </div>
          <div>
            <h1 className="text-xl font-serif italic text-white leading-none">AdegaPro</h1>
            <p className="text-[9px] uppercase tracking-widest text-[#D4AF37]">Clube Exclusivo</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6 z-10">
        <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Column - Copy */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-full text-[#D4AF37] text-[10px] font-bold uppercase tracking-widest">
               <Gift className="w-3.5 h-3.5" /> Presente de Boas-vindas
            </div>
            
            <h2 className="text-4xl lg:text-6xl font-serif italic text-white leading-tight">
              Aprecie o lado <span className="text-[#D4AF37]">exclusivo</span> do vinho.
            </h2>
            
            <p className="text-gray-400 text-sm lg:text-base leading-relaxed max-w-md border-l-2 border-[#D4AF37]/50 pl-4">
              Junte-se a milhares de apreciadores. Cadastre-se agora em nosso clube e receba um cupom com <strong>desconto especial</strong> na sua primeira compra.
            </p>

            <ul className="space-y-3 pt-4 text-sm text-gray-300">
              <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-emerald-400" /> Programa de fidelidade e cashback</li>
              <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-emerald-400" /> Acesso a rótulos de importação exclusiva</li>
              <li className="flex items-center gap-3"><CheckCircle className="w-4 h-4 text-emerald-400" /> Convites para degustações premium</li>
            </ul>
          </div>

          {/* Right Column - Form / Success */}
          <div className="relative">
             <div className="absolute inset-0 bg-gradient-to-tr from-[#7B112C]/20 to-[#D4AF37]/5 rounded-3xl blur-2xl"></div>
             
             <div className="relative bg-[#121212] border border-white/10 rounded-3xl p-8 lg:p-10 shadow-2xl">
                <AnimatePresence mode="wait">
                  {step === 1 ? (
                    <motion.div
                      key="form"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <h3 className="text-2xl font-serif text-white mb-6">Desbloqueie seu benefício</h3>
                      <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Seu Nome Completo</label>
                          <input 
                            type="text" 
                            required
                            placeholder="Ex: João da Silva"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            className="w-full bg-[#1E1E1E] border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-[#D4AF37]/50 transition-colors"
                          />
                        </div>
                        
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">WhatsApp com DDD</label>
                          <input 
                            type="tel" 
                            required
                            placeholder="(00) 90000-0000"
                            value={formData.whatsapp}
                            onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                            className="w-full bg-[#1E1E1E] border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-[#D4AF37]/50 transition-colors"
                          />
                        </div>
                        
                        <div className="space-y-1.5">
                          <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Sua Cidade</label>
                          <input 
                            type="text" 
                            required
                            placeholder="Ex: São Paulo"
                            value={formData.city}
                            onChange={(e) => setFormData({...formData, city: e.target.value})}
                            className="w-full bg-[#1E1E1E] border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-[#D4AF37]/50 transition-colors"
                          />
                        </div>

                        {adegasList.length > 0 && (
                          <div className="space-y-1.5">
                            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Escolha a Adega mais próxima</label>
                            <select
                              value={selectedTenantId}
                              onChange={(e) => setSelectedTenantId(e.target.value)}
                              className="w-full bg-[#1E1E1E] border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-[#D4AF37]/50 transition-colors cursor-pointer text-sm font-medium"
                            >
                              {adegasList.map(adega => (
                                <option key={adega.empresaId} value={adega.empresaId}>
                                  {adega.name || 'Adega'}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        <button 
                          type="submit" 
                          disabled={loading}
                          className="w-full mt-4 bg-[#D4AF37] hover:bg-[#ebd074] text-black font-bold uppercase tracking-widest text-xs py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:shadow-[0_0_30px_rgba(212,175,55,0.4)] disabled:opacity-50 flex items-center justify-center gap-2 group"
                        >
                          {loading ? 'Processando...' : 'Quero meu desconto'}
                          {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                        </button>
                        <p className="text-[10px] text-center text-gray-500 mt-4 leading-relaxed">
                          Ao se cadastrar, você concorda em ingressar no Clube AdegaPro e receber nossas ofertas exclusivas pelo WhatsApp.
                        </p>
                      </form>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-6"
                    >
                      <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-emerald-400" />
                      </div>
                      <h3 className="text-3xl font-serif text-white mb-2 italic">Parabéns!</h3>
                      <p className="text-gray-400 text-sm mb-8">Seu cadastro foi concluído com sucesso e você já faz parte do Clube AdegaPro.</p>
                      
                      <div className="bg-[#1E1E1E] border border-dashed border-[#D4AF37]/50 rounded-2xl p-6 relative">
                        <p className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-widest mb-1">Seu Cupom de Desconto</p>
                        <p className="text-3xl font-mono text-white font-bold tracking-wider">{couponCode}</p>
                      </div>
                      
                      <p className="text-xs text-gray-500 mt-8 mb-6">Apresente este código no nosso PDV ou loja online para ganhar seu desconto especial.</p>
                      
                      <button 
                        onClick={() => window.location.reload()}
                        className="text-[#D4AF37] text-xs font-bold uppercase hover:underline"
                      >
                        Fazer Novo Cadastro
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}
