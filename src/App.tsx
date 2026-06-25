/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { 
  Product, 
  Client, 
  Coupon, 
  Promotion, 
  Campaign, 
  Sale, 
  CellarConfig,
  Order
} from './types';
import { 
  INITIAL_PRODUCTS, 
  INITIAL_CLIENTS, 
  INITIAL_COUPONS, 
  INITIAL_PROMOTIONS, 
  INITIAL_CAMPAIGNS, 
  INITIAL_SALES, 
  DEFAULT_CONFIG 
} from './data/initialData';

// FIREBASE SERVICES
import { useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import { db, handleFirestoreError, OperationType } from './config/firebase';
import { collection, onSnapshot, doc, setDoc, query, where, deleteDoc, getDocs } from 'firebase/firestore';
import { ProdutosService, ClientesService, CuponsService, PromocoesService, CampanhasService } from './services';
import { FirebaseService } from './services/FirebaseService';

// VIEWS COMPONENTS IMPORTS
import DashboardView from './components/DashboardView';
import ProductsView from './components/ProductsView';
import PromotionsView from './components/PromotionsView';
import CouponsView from './components/CouponsView';
import ClientsView from './components/ClientsView';
import CampaignsView from './components/CampaignsView';
import OrdersView from './components/OrdersView';
import ReportsView from './components/ReportsView';
import SettingsView from './components/SettingsView';

import LoyaltyView from './components/LoyaltyView';

// ICONS
import { 
  LayoutDashboard, 
  Wine, 
  Percent, 
  Ticket, 
  Users, 
  Send, 
  FileText, 
  Settings, 
  Menu, 
  X, 
  Sparkles,
  Phone,
  HelpCircle,
  LogOut,
  Moon,
  ChevronDown,
  Clock,
  ArrowRight,
  Award,
  ShoppingBag,
  Lock,
  Shield,
  Store,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const { user, loading, logOut, empresaId, role } = useAuth();
  
  // PERSISTENT DATA STATES
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [config, setConfig] = useState<CellarConfig>(DEFAULT_CONFIG);

  const [currentAdminEmpresaId, setCurrentAdminEmpresaId] = useState<string>('');
  const [adminBranches, setAdminBranches] = useState<CellarConfig[]>([]);

  const [showNewBranchModal, setShowNewBranchModal] = useState<boolean>(false);
  const [newBranchName, setNewBranchName] = useState<string>('');
  const [newBranchAddress, setNewBranchAddress] = useState<string>('');
  const [creatingBranch, setCreatingBranch] = useState<boolean>(false);
  const [detectingBranchLocation, setDetectingBranchLocation] = useState<boolean>(false);

  const handleGetBranchLocationAddress = () => {
    if (!navigator.geolocation) {
      alert("Seu navegador não suporta geolocalização.");
      return;
    }
    setDetectingBranchLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.display_name) {
              setNewBranchAddress(data.display_name);
              alert("Endereço obtido com sucesso pelo seu GPS!");
            } else {
              setNewBranchAddress(`Coord: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
              alert(`Coordenadas obtidas: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
            }
          } else {
            setNewBranchAddress(`Coord: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          }
        } catch (e) {
          console.error(e);
          setNewBranchAddress(`Coord: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        } finally {
          setDetectingBranchLocation(false);
        }
      },
      (error) => {
        console.error(error);
        setDetectingBranchLocation(false);
        alert("Não foi possível obter sua localização. Por favor, forneça as permissões de GPS no seu navegador.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName.trim() || !user) return;
    setCreatingBranch(true);
    try {
      const generatedEmpresaId = 'emp_' + Math.random().toString(36).substr(2, 9);
      const docId = 'config_' + generatedEmpresaId;
      
      const newBranchConfig: CellarConfig = {
        ...DEFAULT_CONFIG,
        id: docId,
        empresaId: generatedEmpresaId,
        name: newBranchName,
        address: newBranchAddress,
        ownerUid: user.uid,
        acceptedPayments: ['pix', 'cartao_credito', 'cartao_debito', 'dinheiro'],
        pixKey: ''
      };
      
      await setDoc(doc(db, 'configuracoes', docId), newBranchConfig);
      
      setCurrentAdminEmpresaId(generatedEmpresaId);
      setShowNewBranchModal(false);
      setNewBranchName('');
      setNewBranchAddress('');
    } catch (err) {
      console.error("Erro ao cadastrar nova adega:", err);
    } finally {
      setCreatingBranch(false);
    }
  };

  const [activeTab, setActiveTab] = useState<string>('Dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [promoFormTrigger, setPromoFormTrigger] = useState<boolean>(false);

  // Sync auth empresaId with admin view focus
  useEffect(() => {
    if (empresaId) {
      setCurrentAdminEmpresaId(empresaId);
    }
  }, [empresaId]);

  // FIREBASE LISTENERS
  useEffect(() => {
    if (!user || !currentAdminEmpresaId || role !== 'admin') return; // Only fetch if logged in, has company scope, and is admin

    const unsubs = [
      onSnapshot(query(collection(db, 'produtos'), where('empresaId', '==', currentAdminEmpresaId)), (snap) => {
        setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'produtos')),
      onSnapshot(query(collection(db, 'clientes'), where('empresaId', '==', currentAdminEmpresaId)), (snap) => {
        setClients(snap.docs.map(d => ({ id: d.id, ...d.data() } as Client)));
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'clientes')),
      onSnapshot(query(collection(db, 'cupons'), where('empresaId', '==', currentAdminEmpresaId)), (snap) => {
        setCoupons(snap.docs.map(d => ({ id: d.id, ...d.data() } as Coupon)));
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'cupons')),
      onSnapshot(query(collection(db, 'promocoes'), where('empresaId', '==', currentAdminEmpresaId)), (snap) => {
        setPromotions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Promotion)));
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'promocoes')),
      onSnapshot(query(collection(db, 'campanhas'), where('empresaId', '==', currentAdminEmpresaId)), (snap) => {
        setCampaigns(snap.docs.map(d => ({ id: d.id, ...d.data() } as Campaign)));
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'campanhas')),
      onSnapshot(query(collection(db, 'vendas'), where('empresaId', '==', currentAdminEmpresaId)), (snap) => {
        setSales(snap.docs.map(d => ({ id: d.id, ...d.data() } as Sale)));
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'vendas')),
      onSnapshot(query(collection(db, 'pedidos'), where('empresaId', '==', currentAdminEmpresaId)), (snap) => {
        setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'pedidos')),
      onSnapshot(query(collection(db, 'configuracoes'), where('ownerUid', '==', user.uid)), (snap) => {
        setAdminBranches(snap.docs.map(d => ({ id: d.id, ...d.data() } as CellarConfig)));
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'configuracoes_filiais')),
      onSnapshot(query(collection(db, 'configuracoes'), where('empresaId', '==', currentAdminEmpresaId)), (snap) => {
        if (snap.empty) {
          const docId = 'config_' + currentAdminEmpresaId;
          const tenantConfig: CellarConfig = { ...DEFAULT_CONFIG, id: docId, empresaId: currentAdminEmpresaId, name: 'Adega ' + currentAdminEmpresaId.toUpperCase(), ownerUid: user.uid };
          setDoc(doc(db, 'configuracoes', docId), tenantConfig);
          setConfig(tenantConfig);
        } else {
          const data = snap.docs[0].data() as CellarConfig;
          if (!data.ownerUid) {
            const docId = snap.docs[0].id || ('config_' + currentAdminEmpresaId);
            setDoc(doc(db, 'configuracoes', docId), { ownerUid: user.uid }, { merge: true });
            data.ownerUid = user.uid;
          }
          setConfig(data);
        }
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'configuracoes'))
    ];

    return () => unsubs.forEach(u => u());
  }, [user, currentAdminEmpresaId, role]);

  // Purge legacy mock configurations and products so they don't clutter the multi-tenant options
  useEffect(() => {
    if (!user || !empresaId || role !== 'admin') return;

    const purgeLegacyData = async () => {
      try {
        const legacyConfigs = ['config_imperial', 'config_executive', 'config_vip'];
        for (const configId of legacyConfigs) {
          await deleteDoc(doc(db, 'configuracoes', configId));
        }

        const q = query(
          collection(db, 'produtos'),
          where('empresaId', 'in', ['imperial', 'executive', 'vip'])
        );
        const snap = await getDocs(q);
        for (const d of snap.docs) {
          await deleteDoc(doc(db, 'produtos', d.id));
        }
      } catch (e) {
        console.warn("Legacy data purge skipped or clean:", e);
      }
    };

    purgeLegacyData();
  }, [user, empresaId, role]);

  // If Auth is checking, or no user
  if (loading) return <div className="min-h-screen bg-[#121212] flex items-center justify-center"><Wine className="w-10 h-10 text-[#D4AF37] animate-pulse" /></div>;
  if (!user) return <Login />;

  // Restrict access to /admin if user is client - redirect straight to storefront (/)
  if (role && role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const updateLocalStorage = (key: string, data: any) => {
    localStorage.setItem(`adegapro_${key}`, JSON.stringify(data));
  };

  // PRODUCTS ACTIONS
  const handleAddProduct = async (prod: Omit<Product, 'id'>) => {
    try {
      await ProdutosService.create({ ...prod, empresaId: currentAdminEmpresaId });
    } catch(err) { console.error(err); }
  };

  const handleEditProduct = async (id: string, updated: Partial<Product>) => {
    try {
      await ProdutosService.update(id, { ...updated, empresaId: currentAdminEmpresaId });
    } catch(err) { console.error(err); }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await ProdutosService.delete(id);
      // Delete associated promotion if exists
      const filteredPromos = promotions.filter(p => p.productId === id);
      for(const promo of filteredPromos) {
        await PromocoesService.delete(promo.id);
      }
    } catch(err) { console.error(err); }
  };

  const handleClearAllProducts = async () => {
    try {
      // 1. Delete all of current tenant's products
      for (const prod of products) {
        await ProdutosService.delete(prod.id);
      }

      // 2. Scan and also delete any other products where empresaId is in the mock set
      const q = query(
        collection(db, 'produtos'),
        where('empresaId', 'in', ['imperial', 'executive', 'vip'])
      );
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        await deleteDoc(doc(db, 'produtos', d.id));
      }
    } catch(err) { console.error(err); }
  };

  // PROMOTIONS ACTIONS
  const handleAddPromotion = async (promo: Omit<Promotion, 'id'>) => {
    try {
      await PromocoesService.create({ ...promo, empresaId: currentAdminEmpresaId });
    } catch(err) { console.error(err); }
  };

  const handleDeletePromotion = async (id: string) => {
    try {
      await PromocoesService.delete(id);
    } catch(err) { console.error(err); }
  };

  const handleTogglePromotion = async (id: string, active: boolean) => {
    try {
      await PromocoesService.update(id, { active, empresaId: currentAdminEmpresaId });
    } catch(err) { console.error(err); }
  };

  // COUPONS ACTIONS
  const handleAddCoupon = async (coupon: Omit<Coupon, 'id'>) => {
    try {
      await CuponsService.create({ ...coupon, empresaId: currentAdminEmpresaId });
    } catch(err) { console.error(err); }
  };

  const handleEditCoupon = async (id: string, updated: Partial<Coupon>) => {
    try {
      await CuponsService.update(id, { ...updated, empresaId: currentAdminEmpresaId });
    } catch(err) { console.error(err); }
  };

  const handleDeleteCoupon = async (id: string) => {
    try {
      await CuponsService.delete(id);
    } catch(err) { console.error(err); }
  };

  const handleToggleCoupon = async (id: string, active: boolean) => {
    try {
      await CuponsService.update(id, { active, empresaId: currentAdminEmpresaId });
    } catch(err) { console.error(err); }
  };

  // CLIENTS ACTIONS
  const handleAddClient = async (client: Omit<Client, 'id'>) => {
    try {
      await ClientesService.create({ ...client, empresaId: currentAdminEmpresaId });
    } catch(err) { console.error(err); }
  };

  const handleEditClient = async (id: string, updated: Partial<Client>) => {
    try {
      await ClientesService.update(id, { ...updated, empresaId: currentAdminEmpresaId });
    } catch(err) { console.error(err); }
  };

  const handleDeleteClient = async (id: string) => {
    try {
      await ClientesService.delete(id);
    } catch(err) { console.error(err); }
  };

  // CAMPAIGNS ACTIONS
  const handleAddCampaign = async (camp: Omit<Campaign, 'id'>) => {
    try {
      await CampanhasService.create({ ...camp, empresaId: currentAdminEmpresaId });
    } catch(err) { console.error(err); }
  };

  const handleDeleteCampaign = async (id: string) => {
    try {
      await CampanhasService.delete(id);
    } catch(err) { console.error(err); }
  };

  const handleSendCampaign = async (id: string, sentCount: number) => {
    try {
      const today = new Date();
      const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')} ${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`;
      await CampanhasService.update(id, { status: 'sent', sentCount, sentDate: formattedDate, empresaId: currentAdminEmpresaId });
    } catch(err) { console.error(err); }
  };

  // Vendas Service since not exported yet:
  const VendasService = new FirebaseService<Sale>('vendas');

  // SALES ACTIONS
  const handleAddSale = async (sale: Omit<Sale, 'id'>) => {
    try {
      await VendasService.create({ ...sale, empresaId: currentAdminEmpresaId });

      // DEDUCT STOCK counts automatically
      const product = products.find(p => p.id === sale.productId);
      if (product) {
        const nextStock = Math.max(0, product.stock - sale.quantity);
        await ProdutosService.update(product.id, {
          stock: nextStock,
          status: nextStock === 0 ? 'out_of_stock' : product.status,
          empresaId: currentAdminEmpresaId
        });
      }

      // UPDATE Client CRM metrics automatically if name exists
      if (sale.clientName) {
        const client = clients.find(c => c.name.toLowerCase() === sale.clientName?.toLowerCase());
        if (client) {
          const pointsEarned = Math.floor(sale.total); // 1 point per 1 R$
          
          await ClientesService.update(client.id, {
            totalSpent: client.totalSpent + sale.total,
            ordersCount: client.ordersCount + 1,
            lastPurchaseDate: sale.date,
            loyaltyPoints: (client.loyaltyPoints || 0) + pointsEarned,
            loyaltyTotalEarned: (client.loyaltyTotalEarned || 0) + pointsEarned,
            empresaId: currentAdminEmpresaId
          });
        }
      }
    } catch(err) { console.error(err); }
  };

  // CONFIGURATION SETTINGS
  const handleSaveConfig = async (newConfig: CellarConfig) => {
    setConfig(newConfig);
    try {
      await setDoc(doc(db, 'configuracoes', newConfig.id || ('config_' + currentAdminEmpresaId)), { ...newConfig, empresaId: currentAdminEmpresaId });
    } catch(err) { console.error(err); }
  };

  const handleResetToDefaults = async () => {
    try {
      // Clear current empresa specific data completely
      for (const prod of products) {
        await ProdutosService.delete(prod.id);
      }
      for (const client of clients) {
        await ClientesService.delete(client.id);
      }
      for (const coupon of coupons) {
        await CuponsService.delete(coupon.id);
      }
      for (const promo of promotions) {
        await PromocoesService.delete(promo.id);
      }
      for (const camp of campaigns) {
        await CampanhasService.delete(camp.id);
      }
      for (const sale of sales) {
        // Since we don't have separate sales delete action in ClientesService, we write directly
        try {
          await new FirebaseService<Sale>('vendas').delete(sale.id);
        } catch(e) {}
      }
      
      const docId = 'config_' + empresaId;
      const tenantConfig: CellarConfig = { ...DEFAULT_CONFIG, id: docId, empresaId, name: 'Adega ' + empresaId.toUpperCase() };
      await setDoc(doc(db, 'configuracoes', docId), tenantConfig);
      setConfig(tenantConfig);
      
      alert('Os dados da sua Adega foram completamente limpos. Você pode começar do zero!');
      setActiveTab('Dashboard');
    } catch (e) {
      console.error(e);
    }
  };

  // SIDEBAR SECTIONS
  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Pedidos', icon: ShoppingBag },
    { name: 'Produtos', icon: Wine },
    { name: 'Promoções', icon: Percent },
    { name: 'Cupons', icon: Ticket },
    { name: 'Clientes', icon: Users },
    { name: 'Fidelidade', icon: Award },
    { name: 'Campanhas', icon: Send },
    { name: 'Relatórios', icon: FileText },
    { name: 'Configurações', icon: Settings }
  ];

  const handleNavigateToTab = (tab: string) => {
    setActiveTab(tab);
    setPromoFormTrigger(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // RENDER CORRESPONDING TAB VIEW
  const renderActiveView = () => {
    switch (activeTab) {
      case 'Dashboard':
        return (
          <DashboardView 
            products={products}
            clients={clients}
            coupons={coupons}
            promotions={promotions}
            sales={sales}
            onCreatePromotionClick={() => {
              setPromoFormTrigger(true);
              setActiveTab('Promoções');
            }}
            onNavigateToTab={handleNavigateToTab}
          />
        );
      case 'Pedidos':
        return (
          <OrdersView 
            orders={orders}
          />
        );
      case 'Produtos':
        return (
          <ProductsView 
            products={products}
            onAddProduct={handleAddProduct}
            onEditProduct={handleEditProduct}
            onDeleteProduct={handleDeleteProduct}
            onClearAllProducts={handleClearAllProducts}
          />
        );
      case 'Promoções':
        return (
          <PromotionsView 
            promotions={promotions}
            products={products}
            onAddPromotion={handleAddPromotion}
            onDeletePromotion={handleDeletePromotion}
            onTogglePromotion={handleTogglePromotion}
          />
        );
      case 'Cupons':
        return (
          <CouponsView 
            coupons={coupons}
            onAddCoupon={handleAddCoupon}
            onEditCoupon={handleEditCoupon}
            onDeleteCoupon={handleDeleteCoupon}
            onToggleCoupon={handleToggleCoupon}
          />
        );
      case 'Clientes':
        return (
          <ClientsView 
            clients={clients}
            onAddClient={handleAddClient}
            onEditClient={handleEditClient}
            onDeleteClient={handleDeleteClient}
            whatsappMessageTemplate={config.whatsappTemplate}
            adegaName={config.name}
          />
        );
      case 'Campanhas':
        return (
          <CampaignsView 
            campaigns={campaigns}
            clients={clients}
            promotions={promotions}
            onAddCampaign={handleAddCampaign}
            onDeleteCampaign={handleDeleteCampaign}
            onSendCampaign={handleSendCampaign}
          />
        );
      case 'Fidelidade':
        return (
          <LoyaltyView
            clients={clients}
            onEditClient={handleEditClient}
          />
        );
      case 'Relatórios':
        return (
          <ReportsView 
            sales={sales}
            products={products}
            clients={clients}
            onAddSale={handleAddSale}
            adegaConfig={config}
          />
        );
      case 'Configurações':
        return (
          <SettingsView 
            config={config}
            onSaveConfig={handleSaveConfig}
            onResetToDefaults={handleResetToDefaults}
          />
        );
      default:
        return <div className="text-sm py-10">Página em construção...</div>;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#121212] font-sans text-gray-200 antialiased" id="adegapro-root-app">
      
      {/* SIDEBAR NAVIGATION - DESKTOP LAYOUT */}
      <aside 
        className="hidden lg:flex flex-col w-64 bg-[#0a0a0a] border-r border-[#D4AF37]/20 text-gray-300 shrink-0 sticky top-0 h-screen select-none z-30" 
        id="desktop-sidebar-pane"
      >
        {/* Brand Logo and Title */}
        <div className="p-8 flex items-center gap-3 border-b border-[#D4AF37]/10">
          <div className="w-8 h-8 bg-[#7B112C] rounded-lg border border-[#D4AF37]/50 flex items-center justify-center shadow">
            <span className="text-[#D4AF37] font-serif font-bold text-lg italic">A</span>
          </div>
          <div>
            <h1 className="text-xl font-serif italic tracking-wider text-[#D4AF37]">AdegaPro</h1>
            <span className="text-[9px] uppercase tracking-[0.2em] text-gray-500 block leading-none mt-0.5">Premium Club</span>
          </div>
        </div>

        {/* Branch / Adega Selector */}
        <div className="p-4 border-b border-[#D4AF37]/10 bg-[#121212]/30 flex flex-col gap-2">
          <label className="text-[9px] uppercase tracking-wider text-gray-400 font-bold flex items-center gap-1">
            <Store className="w-3 h-3 text-[#D4AF37]" /> Minhas Adegas / Filiais
          </label>
          
          <div className="flex gap-1.5 items-center">
            <select
              value={currentAdminEmpresaId}
              onChange={(e) => setCurrentAdminEmpresaId(e.target.value)}
              className="flex-1 bg-[#121212] border border-white/10 text-xs text-white rounded-lg px-2.5 py-2 focus:outline-none focus:border-[#D4AF37] cursor-pointer"
            >
              {adminBranches.map((br) => (
                <option key={br.empresaId} value={br.empresaId}>
                  {br.name}
                </option>
              ))}
              {adminBranches.length === 0 && (
                <option value={currentAdminEmpresaId}>{config.name}</option>
              )}
            </select>
            
            <button
              onClick={() => setShowNewBranchModal(true)}
              className="p-2 bg-[#7B112C]/20 border border-[#D4AF37]/20 rounded-lg hover:bg-[#771C33] text-[#D4AF37] hover:text-white transition cursor-pointer"
              title="Cadastrar Nova Adega"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-4 py-8 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isSelected = activeTab === item.name;

            return (
              <button
                key={item.name}
                onClick={() => handleNavigateToTab(item.name)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-r-md text-sm font-medium transition-all duration-200 cursor-pointer text-left ${
                  isSelected 
                    ? 'bg-[#7B112C]/20 border-l-4 border-[#7B112C] text-[#D4AF37] uppercase tracking-widest text-[12px]' 
                    : 'hover:bg-white/5 text-gray-400 hover:text-white'
                }`}
              >
                <IconComponent className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[#D4AF37]' : 'text-gray-500'}`} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Sidebar Footer info */}
        <div className="p-5 border-t border-[#D4AF37]/10 bg-[#0e0e0e]/50 mt-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-xs">
            <div className="w-2 h-2 rounded-full bg-[#D4AF37] opacity-80 animate-pulse shadow-[0_0_8px_#D4AF37]"></div>
            <div className="truncate">
              <p className="text-xs uppercase tracking-widest text-gray-300 truncate font-semibold">{config.name}</p>
              <p className="text-[10px] uppercase tracking-wider text-[#D4AF37]/70 truncate font-mono mt-0.5">Sommelier Digital</p>
            </div>
          </div>
          <button 
            onClick={() => logOut()}
            className="p-2 hover:bg-[#1E1E1E] rounded-md text-gray-500 hover:text-red-400 transition"
            title="Sair"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER RESPONSIVE RIBBON */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#0a0a0a] border-b border-[#D4AF37]/20 z-40 flex items-center justify-between px-4 select-none" id="mobile-top-ribbon">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#7B112C] border border-[#D4AF37]/30 flex items-center justify-center">
            <span className="text-[#D4AF37] font-serif italic font-bold">A</span>
          </div>
          <span className="font-serif italic text-[#D4AF37] text-lg tracking-wider">AdegaPro</span>
        </div>

        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 border border-[#D4AF37]/20 rounded-xl hover:bg-[#1E1E1E] transition text-[#D4AF37]"
          id="mobile-burger-trigger"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* MOBILE DRAWER OVERLAY PANEL */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-35 bg-black/85 backdrop-blur-md" id="mobile-overlay-pane">
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-72 h-full bg-[#0a0a0a] border-r border-[#D4AF37]/20 flex flex-col justify-between pt-20"
            >
              <div className="px-4 py-4 space-y-1.5 overflow-y-auto">
                {/* Mobile Branch / Adega Selector */}
                <div className="mx-2 mb-4 p-3 bg-[#121212]/30 border border-[#D4AF37]/10 rounded-xl flex flex-col gap-2">
                  <label className="text-[9px] uppercase tracking-wider text-gray-400 font-bold flex items-center gap-1">
                    <Store className="w-3 h-3 text-[#D4AF37]" /> Minhas Adegas / Filiais
                  </label>
                  
                  <div className="flex gap-1.5 items-center">
                    <select
                      value={currentAdminEmpresaId}
                      onChange={(e) => {
                        setCurrentAdminEmpresaId(e.target.value);
                        setMobileMenuOpen(false);
                      }}
                      className="flex-1 bg-[#121212] border border-white/10 text-xs text-white rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#D4AF37] cursor-pointer"
                    >
                      {adminBranches.map((br) => (
                        <option key={br.empresaId} value={br.empresaId}>
                          {br.name}
                        </option>
                      ))}
                      {adminBranches.length === 0 && (
                        <option value={currentAdminEmpresaId}>{config.name}</option>
                      )}
                    </select>
                    
                    <button
                      onClick={() => {
                        setShowNewBranchModal(true);
                        setMobileMenuOpen(false);
                      }}
                      className="p-1.5 bg-[#7B112C]/20 border border-[#D4AF37]/20 rounded-md hover:bg-[#771C33] text-[#D4AF37] hover:text-white transition cursor-pointer"
                      title="Cadastrar Nova Adega"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {menuItems.map((item) => {
                  const IconComp = item.icon;
                  const isSelected = activeTab === item.name;

                  return (
                    <button
                      key={item.name}
                      onClick={() => {
                        handleNavigateToTab(item.name);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-r-md text-xs font-semibold text-left transition uppercase tracking-widest ${
                        isSelected 
                          ? 'bg-[#7B112C]/20 border-l-4 border-[#7B112C] text-[#D4AF37]' 
                          : 'hover:bg-white/5 text-gray-400 hover:text-white'
                      }`}
                    >
                      <IconComp className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[#D4AF37]' : 'text-gray-500'}`} />
                      <span>{item.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Mobile Sidebar Footer */}
              <div className="p-5 bg-[#0e0e0e] border-t border-[#D4AF37]/10">
                <p className="text-[9px] uppercase tracking-[0.2em] text-gray-500">Logado em</p>
                <p className="text-xs font-bold text-white mt-1 uppercase tracking-wide truncate">{config.name}</p>
                <div className="flex items-center gap-4 mt-2.5">
                  <button 
                    onClick={() => { 
                      setMobileMenuOpen(false); 
                      handleNavigateToTab('Configurações'); 
                    }}
                    className="text-[10px] text-[#D4AF37] uppercase tracking-wider font-bold hover:underline flex items-center gap-1"
                  >
                    <Settings className="w-3 h-3" /> Config
                  </button>
                  <button 
                    onClick={() => logOut()}
                    className="text-[10px] text-red-400 uppercase tracking-wider font-bold hover:underline flex items-center gap-1"
                  >
                    <LogOut className="w-3 h-3" /> Sair
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MAIN VIEWPORT LAYOUT */}
      <main className="flex-1 min-w-0 flex flex-col bg-[#121212] pt-16 lg:pt-0" id="main-content-viewport">
        <div className="max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 shrink-0">
          
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, cubicBezier: [0.16, 1, 0.3, 1] }}
            >
              {renderActiveView()}
            </motion.div>
          </AnimatePresence>

        </div>
      </main>

      {/* CADASTRO DE NOVA ADEGA / FILIAL MODAL */}
      <AnimatePresence>
        {showNewBranchModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1C1C1E] border border-[#D4AF37]/30 rounded-2xl w-full max-w-md p-6 overflow-hidden relative shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                <div className="flex items-center gap-2 text-[#D4AF37]">
                  <Store className="w-5 h-5" />
                  <h3 className="font-serif italic text-lg text-white">Cadastrar Nova Adega / Filial</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewBranchModal(false)}
                  className="p-1 px-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateBranch} className="space-y-4">
                <div>
                  <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold block mb-1">
                    Nome da Adega <span className="text-[#D4AF37]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newBranchName}
                    onChange={(e) => setNewBranchName(e.target.value)}
                    placeholder="Ex: Adega Gold, Centro"
                    className="w-full bg-[#121212] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold block">
                      Endereço da Adega
                    </label>
                    <button
                      type="button"
                      onClick={handleGetBranchLocationAddress}
                      disabled={detectingBranchLocation}
                      className="text-[9px] text-[#D4AF37] hover:text-white font-bold uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/20 px-2 py-0.5 rounded disabled:opacity-50"
                    >
                      {detectingBranchLocation ? 'Obtendo GPS...' : '🧭 Usar Meu GPS'}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={newBranchAddress}
                    onChange={(e) => setNewBranchAddress(e.target.value)}
                    placeholder="Ex: R. das Flores, 123 - Centro"
                    className="w-full bg-[#121212] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="pt-4 border-t border-white/5 flex gap-3 justify-end text-xs">
                  <button
                    type="button"
                    onClick={() => setShowNewBranchModal(false)}
                    className="bg-transparent border border-white/10 font-bold uppercase tracking-widest px-4 py-3 rounded-xl hover:bg-white/5 text-white transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={creatingBranch}
                    className="bg-[#D4AF37] text-black font-bold uppercase tracking-widest px-6 py-3 rounded-xl hover:bg-[#ebd074] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {creatingBranch ? 'Cadastrando...' : 'Confirmar e Criar'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
