/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CellarConfig } from '../types';
import { 
  Settings, 
  Save, 
  MapPin, 
  Phone, 
  Mail, 
  FileCheck, 
  MessageSquare, 
  Wine, 
  Database,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { motion } from 'motion/react';

interface SettingsViewProps {
  config: CellarConfig;
  onSaveConfig: (cfg: CellarConfig) => void;
  onResetToDefaults: () => void;
}

export default function SettingsView({
  config,
  onSaveConfig,
  onResetToDefaults
}: SettingsViewProps) {
  // Config states
  const [name, setName] = useState(config.name);
  const [cnpj, setCnpj] = useState(config.cnpj);
  const [phone, setPhone] = useState(config.phone);
  const [address, setAddress] = useState(config.address);
  const [email, setEmail] = useState(config.email);
  const [whatsappTemplate, setWhatsappTemplate] = useState(config.whatsappTemplate);
  const [acceptedPayments, setAcceptedPayments] = useState<string[]>(config.acceptedPayments || ['pix', 'cartao_credito', 'cartao_debito', 'dinheiro']);
  const [pixKey, setPixKey] = useState(config.pixKey || '');

  const [saving, setSaving] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);

  const handleGetCurrentLocationAddress = () => {
    if (!navigator.geolocation) {
      alert("Seu navegador não suporta geolocalização.");
      return;
    }
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.display_name) {
              setAddress(data.display_name);
              alert("Endereço obtido com sucesso pelo seu GPS!");
            } else {
              setAddress(`Coord: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
              alert(`Coordenadas obtidas: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
            }
          } else {
            setAddress(`Coord: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          }
        } catch (e) {
          console.error(e);
          setAddress(`Coord: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        } finally {
          setDetectingLocation(false);
        }
      },
      (error) => {
        console.error(error);
        setDetectingLocation(false);
        alert("Não foi possível obter sua localização. Por favor, forneça as permissões de GPS no seu navegador.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Sync state when config changes (e.g. user selects a different branch)
  React.useEffect(() => {
    setName(config.name);
    setCnpj(config.cnpj || '');
    setPhone(config.phone);
    setAddress(config.address || '');
    setEmail(config.email || '');
    setWhatsappTemplate(config.whatsappTemplate);
    setAcceptedPayments(config.acceptedPayments || ['pix', 'cartao_credito', 'cartao_debito', 'dinheiro']);
    setPixKey(config.pixKey || '');
  }, [config]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    setTimeout(() => {
      onSaveConfig({
        id: config.id,
        empresaId: config.empresaId,
        name,
        cnpj,
        phone,
        address,
        email,
        currency: 'R$',
        whatsappTemplate,
        deliveryTaxa: config.deliveryTaxa ?? 15,
        deliveryRaio: config.deliveryRaio ?? 10,
        deliveryTempo: config.deliveryTempo ?? '30-45',
        acceptedPayments,
        pixKey
      });
      setSaving(false);
    }, 800);
  };

  return (
    <div className="space-y-6" id="settings-view-root">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-white tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-bordo-500" />
            Configurações da Adega
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Configure informações comerciais da sua empresa, CNPJ e os templates inteligentes de disparo do WhatsApp.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="settings-layout">
        
        {/* FORM CONTENT */}
        <form onSubmit={handleSave} className="space-y-6 lg:col-span-8">
          <div className="bg-dark-card border border-dark-border rounded-xl p-5 space-y-4">
            
            <div className="flex items-center gap-2 mb-2 border-b border-dark-border/40 pb-3">
              <Wine className="w-5 h-5 text-gold-500" />
              <h3 className="text-sm font-serif font-bold text-white uppercase tracking-wider">Identidade Corporativa</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Cellar/Adega Name */}
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-xs text-gray-400 font-semibold uppercase">Nome da Adega <span className="text-bordo-500">*</span></label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-premium w-full"
                />
              </div>

              {/* telephone contact */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400 font-semibold uppercase">Telefone de Atendimento <span className="text-bordo-500">*</span></label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-550" />
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input-premium pl-10 w-full font-mono"
                  />
                </div>
              </div>

              {/* CNPJ identifier optionally */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400 font-semibold uppercase">CNPJ Comercial</label>
                <div className="relative">
                  <FileCheck className="absolute left-3 top-3 w-4 h-4 text-gray-555" />
                  <input
                    type="text"
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    className="input-premium pl-10 w-full font-mono"
                    placeholder="00.000.000/0001-00"
                  />
                </div>
              </div>

              {/* Store Address */}
              <div className="flex flex-col gap-1 md:col-span-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs text-gray-400 font-semibold uppercase">Endereço Comercial</label>
                  <button
                    type="button"
                    onClick={handleGetCurrentLocationAddress}
                    disabled={detectingLocation}
                    className="text-[10px] text-[#D4AF37] hover:text-white font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/20 px-2.5 py-0.5 rounded disabled:opacity-50"
                  >
                    {detectingLocation ? 'Obtendo GPS...' : '🧭 Usar Meu GPS'}
                  </button>
                </div>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="input-premium pl-10 w-full"
                    placeholder="Rua, Número, Bairro, Cidade"
                  />
                </div>
              </div>

              {/* Premium email address */}
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-xs text-gray-400 font-semibold uppercase">E-mail de Recebimento</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-550" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-premium pl-10 w-full"
                  />
                </div>
              </div>

            </div>

          </div>

          {/* CRM DISPATCH CONFIG PANE */}
          <div className="bg-dark-card border border-dark-border rounded-xl p-5 space-y-4">
            
            <div className="flex items-center gap-2 mb-2 border-b border-dark-border/40 pb-3">
              <MessageSquare className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-serif font-bold text-white uppercase tracking-wider">Configuração de CRM (WhatsApp)</h3>
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs text-gray-400 font-semibold uppercase">Mensagem Padrão de Contato Direto</label>
                <span className="text-[10px] text-emerald-400 font-mono">Disponível em Cartões de Clientes</span>
              </div>
              
              <textarea
                rows={4}
                value={whatsappTemplate}
                onChange={(e) => setWhatsappTemplate(e.target.value)}
                className="input-premium font-sans text-gray-250 leading-relaxed"
              />

              <div className="mt-2.5 bg-black/40 border border-dark-border p-3.5 rounded-xl space-y-2 text-xs text-gray-500">
                <p className="font-semibold text-white">Tags disponíveis para preenchimento automático:</p>
                <ul className="list-disc list-inside space-y-1 pl-1 font-mono text-[10px] text-gray-400">
                  <li><strong className="text-emerald-400">{"{cliente}"}</strong> - Substitui pelo nome cadastrado do cliente.</li>
                  <li><strong className="text-emerald-400">{"{adega}"}</strong> - Substitui pelo Nome da Adega definido acima.</li>
                  <li><strong className="text-emerald-400">{"{mensagem}"}</strong> - Insere uma saudação automática sugerindo rótulos finos da categoria preferida do contato.</li>
                </ul>
              </div>
            </div>

          </div>

          {/* FORMAS DE PAGAMENTO ACEITAS */}
          <div className="bg-dark-card border border-dark-border rounded-xl p-5 space-y-4">
            
            <div className="flex items-center gap-2 mb-2 border-b border-dark-border/40 pb-3">
              <Database className="w-5 h-5 text-[#D4AF37]" />
              <h3 className="text-sm font-serif font-bold text-white uppercase tracking-wider">Formas de Pagamento & PIX</h3>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-gray-400">
                Selecione as formas de pagamento que sua adega aceita e defina sua chave Pix para receber transferências diretas dos clientes.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'pix', label: 'Pix' },
                  { id: 'cartao_credito', label: 'Crédito na entrega' },
                  { id: 'cartao_debito', label: 'Débito na entrega' },
                  { id: 'dinheiro', label: 'Dinheiro' }
                ].map((pay) => {
                  const isChecked = acceptedPayments.includes(pay.id);
                  return (
                    <label 
                      key={pay.id} 
                      className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer select-none transition-all ${
                        isChecked 
                          ? 'bg-[#7B112C]/10 border-[#D4AF37]/40 text-white font-semibold' 
                          : 'bg-[#121212]/50 border-white/5 text-gray-400 hover:border-white/10'
                      }`}
                    >
                      <input 
                        type="checkbox" 
                        checked={isChecked}
                        onChange={() => {
                          if (isChecked) {
                            setAcceptedPayments(acceptedPayments.filter(p => p !== pay.id));
                          } else {
                            setAcceptedPayments([...acceptedPayments, pay.id]);
                          }
                        }}
                        className="rounded border-white/10 text-[#7B112C] focus:ring-[#7B112C]"
                      />
                      <span className="text-xs">{pay.label}</span>
                    </label>
                  );
                })}
              </div>

              {acceptedPayments.includes('pix') && (
                <div className="space-y-1.5 animate-pulse-once">
                  <label className="text-[11px] text-[#D4AF37] font-bold uppercase">Chave Pix para Recebimento</label>
                  <input
                    type="text"
                    required={acceptedPayments.includes('pix')}
                    placeholder="E-mail, CNPJ, celular ou chave aleatória"
                    value={pixKey}
                    onChange={(e) => setPixKey(e.target.value)}
                    className="input-premium w-full font-mono text-xs bg-[#121212] border-white/10 text-white rounded-lg p-3.5"
                  />
                  <p className="text-[10px] text-gray-500">
                    A chave Pix cadastrada será exibida para o cliente fazer a transferência na hora do fechamento do pedido no carrinho.
                  </p>
                </div>
              )}
            </div>

          </div>

          {/* SUBMIT BUTTON */}
          <div className="flex justify-between items-center pt-2">
            
            <button
              type="button"
              onClick={() => {
                if (confirm('Tem certeza que deseja redefinir os dados e começar do zero? Todos os produtos, clientes, cupons e relatórios serão excluídos permanentemente.')) {
                  onResetToDefaults();
                  // Reset states accordingly to clean start
                  setName('Minha Nova Adega');
                  setCnpj('');
                  setPhone('');
                  setAddress('');
                  setEmail('');
                  setWhatsappTemplate('Olá {cliente}! Tudo bem? Veja as novidades e ofertas na *{adega}*: {mensagem} 🍷 Clique aqui para fazer seu pedido pelo WhatsApp!');
                  setAcceptedPayments(['pix', 'cartao_credito', 'cartao_debito', 'dinheiro']);
                  setPixKey('');
                }
              }}
              className="text-xs text-red-400 hover:underline flex items-center gap-1 bg-transparent border-none cursor-pointer"
            >
              <Database className="w-4 h-4" /> Resetar Banco de Dados
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center justify-center gap-2 bg-bordo-800 hover:bg-bordo-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition duration-150 shadow-md cursor-pointer disabled:opacity-60"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Salvar Configurações
                </>
              )}
            </button>

          </div>
        </form>

        {/* SIDE PREVIEW CARD */}
        <div className="lg:col-span-4 bg-dark-card border border-dark-border rounded-xl p-5 flex flex-col justify-between" id="settings-preview-card">
          <div className="space-y-4">
            <span className="text-[10px] bg-gold-950 text-gold-400 font-mono font-bold px-2 py-0.5 rounded-full uppercase">
              Assinatura Ativa
            </span>
            
            <h3 className="text-lg font-serif font-bold text-white">AdegaPro Enterprise</h3>
            <p className="text-xs text-gray-400">Aqui está uma simulação visual de como se parecerá o cabeçalho impresso dos relatórios do seu negócio.</p>

            {/* Simulated letterhead */}
            <div className="bg-black/60 border border-dark-border p-4 rounded-xl space-y-2 text-[11px] text-gray-400 font-sans">
              <div className="flex items-center gap-1 text-gold-500 font-bold font-serif text-xs border-b border-dark-border/40 pb-1.5 uppercase tracking-wide">
                <Wine className="w-3.5 h-3.5 text-bordo-500" />
                {name || 'Nome da sua Adega'}
              </div>
              <p>CNPJ: {cnpj || '00.000.000/0001-00'}</p>
              <p>Contato: {phone || '(00) 00000-0000'}</p>
              <p>E-mail: {email || 'adega@exemplo.com'}</p>
              <p className="leading-snug">Endereço: {address || 'Endereço Comercial da Loja'}</p>
            </div>
          </div>

          <div className="text-[10px] text-gray-550 pt-10 border-t border-[#D4AF37]/10 mt-6 leading-relaxed">
            As configurações são salvas diretamente no banco de dados em nuvem de forma isolada e segura.
          </div>
        </div>

      </div>

    </div>
  );
}
