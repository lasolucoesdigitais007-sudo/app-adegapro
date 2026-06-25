/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Product, Client, Coupon, Promotion, Sale } from '../types';
import { 
  Wine, 
  Users, 
  Ticket, 
  TrendingUp, 
  Percent, 
  Plus, 
  ArrowUpRight, 
  AlertTriangle, 
  Sparkles,
  Phone,
  Tag,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DashboardViewProps {
  products: Product[];
  clients: Client[];
  coupons: Coupon[];
  promotions: Promotion[];
  sales: Sale[];
  onCreatePromotionClick: () => void;
  onNavigateToTab: (tab: string) => void;
}

export default function DashboardView({
  products,
  clients,
  coupons,
  promotions,
  sales,
  onCreatePromotionClick,
  onNavigateToTab
}: DashboardViewProps) {
  // Current time state
  const currentDate = new Date('2026-06-20T11:32:27-07:00');
  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho'];
  const monthAbbr = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];

  // Metrics Calculations
  const totalProducts = products.length;
  const totalClients = clients.length;
  
  // Coupons Used: sum of coupon uses
  const couponsUsed = coupons.reduce((sum, c) => sum + (c.usageCount || 0), 0);

  // Vendas do Mês format (June 2026 sales)
  const juneSales = sales.filter(s => s.date.startsWith('2026-06'));
  const monthlySalesValue = juneSales.reduce((sum, s) => sum + s.total, 0);

  // Produtos mais vendidos count
  const productSalesMap: { [productName: string]: number } = {};
  sales.forEach(s => {
    productSalesMap[s.productName] = (productSalesMap[s.productName] || 0) + s.quantity;
  });
  
  const mostSoldProducts = Object.entries(productSalesMap)
    .map(([name, qty]) => ({ name, qty }))
    .sort((a, b) => b.qty - a.qty);

  const topSoldProductName = mostSoldProducts[0]?.name || 'Nenhum';
  const topSoldProductCount = mostSoldProducts[0]?.qty || 0;

  // Monthly Sales Chart Data
  const monthlySalesData = [
    { month: 'Jan', value: sales.filter(s => s.date.startsWith('2026-01')).reduce((sum, s) => sum + s.total, 0) },
    { month: 'Fev', value: sales.filter(s => s.date.startsWith('2026-02')).reduce((sum, s) => sum + s.total, 0) },
    { month: 'Mar', value: sales.filter(s => s.date.startsWith('2026-03')).reduce((sum, s) => sum + s.total, 0) },
    { month: 'Abr', value: sales.filter(s => s.date.startsWith('2026-04')).reduce((sum, s) => sum + s.total, 0) },
    { month: 'Mai', value: sales.filter(s => s.date.startsWith('2026-05')).reduce((sum, s) => sum + s.total, 0) },
    { month: 'Jun', value: sales.filter(s => s.date.startsWith('2026-06')).reduce((sum, s) => sum + s.total, 0) },
  ];

  // New Clients Chart Data
  const monthlyNewClientsData = [
    { month: 'Jan', count: clients.filter(c => c.registrationDate.startsWith('2026-01')).length },
    { month: 'Fev', count: clients.filter(c => c.registrationDate.startsWith('2026-02')).length },
    { month: 'Mar', count: clients.filter(c => c.registrationDate.startsWith('2026-03')).length },
    { month: 'Abr', count: clients.filter(c => c.registrationDate.startsWith('2026-04')).length },
    { month: 'Mai', count: clients.filter(c => c.registrationDate.startsWith('2026-05')).length },
    { month: 'Jun', count: clients.filter(c => c.registrationDate.startsWith('2026-06')).length },
  ];

  // Active Promotions
  const activePromoList = promotions.filter(p => p.active);

  // Recent Clients
  const sortedClients = [...clients].sort((a, b) => b.registrationDate.localeCompare(a.registrationDate));
  const recentClients = sortedClients.slice(0, 4);

  // Low Stock Alert Products
  const lowStockProducts = products.filter(p => p.stock <= p.minStock);

  // Hover states for tooltips on charts
  const [activeTooltip, setActiveTooltip] = useState<{ x: number, y: number, month: string, value: string } | null>(null);
  const [activeClientTooltip, setActiveClientTooltip] = useState<{ x: number, y: number, month: string, count: number } | null>(null);

  // Custom Formatter for Currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  return (
    <div className="space-y-6" id="dashboard-view-root">
      
      {/* Header with Welcome and Stock-Alert Alerts */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-4xl font-serif italic text-white mb-2 leading-tight">
            Resumo da Adega
          </h1>
          <p className="text-gray-500 text-xs uppercase tracking-[0.2em] font-sans">
            AdegaPro • Performance de Vendas & Engajamento • {currentDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        
        {lowStockProducts.length > 0 && (
          <div 
            onClick={() => onNavigateToTab('Produtos')}
            className="flex items-center gap-3 bg-[#7B112C]/10 border border-[#7B112C]/40 rounded-lg px-4 py-2.5 text-amber-200 text-sm cursor-pointer hover:bg-[#7B112C]/20 transition-all shadow-md self-start md:self-auto"
            id="low-stock-alert-pill"
          >
            <AlertTriangle className="w-4 h-4 text-[#D4AF37] animate-pulse shrink-0" />
            <div>
              <p className="font-semibold text-[10px] uppercase tracking-wider text-[#D4AF37]">Alerta de Estoque</p>
              <p className="text-xs text-gray-300 font-mono mt-0.5">{lowStockProducts.length} rótulos baixos</p>
            </div>
            <ArrowRight className="w-3.5 h-3.5 ml-1 shrink-0 text-[#D4AF37]" />
          </div>
        )}
      </div>

      {/* METRICS GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4" id="metrics-grid">
        
        {/* Total Produtos */}
        <div 
          onClick={() => onNavigateToTab('Produtos')}
          className="bg-[#1E1E1E] p-5 rounded-xl border border-white/5 hover:border-[#D4AF37]/20 transition-all duration-300 hover:scale-[1.01] cursor-pointer group flex flex-col justify-between h-32"
          id="stat-total-products"
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Total Produtos</p>
            <Wine className="w-3.5 h-3.5 text-gray-500 group-hover:text-[#D4AF37] transition-colors" />
          </div>
          <div>
            <p className="text-3xl font-serif text-white">{totalProducts}</p>
            <div className="mt-1 text-[10px] text-[#D4AF37]">+ Rótulo ativo no catálogo</div>
          </div>
        </div>

        {/* Clientes Cadastrados */}
        <div 
          onClick={() => onNavigateToTab('Clientes')}
          className="bg-[#1E1E1E] p-5 rounded-xl border border-white/5 hover:border-[#D4AF37]/20 transition-all duration-300 hover:scale-[1.01] cursor-pointer group flex flex-col justify-between h-32"
          id="stat-total-clients"
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium font-sans">Clientes</p>
            <Users className="w-3.5 h-3.5 text-gray-500 group-hover:text-[#D4AF37] transition-colors" />
          </div>
          <div>
            <p className="text-3xl font-serif text-white">{totalClients}</p>
            <div className="mt-1 text-[10px] text-green-500">Membros de fidelidade</div>
          </div>
        </div>

        {/* Cupons Utilizados */}
        <div 
          onClick={() => onNavigateToTab('Cupons')}
          className="bg-[#1E1E1E] p-5 rounded-xl border border-white/5 hover:border-[#D4AF37]/20 transition-all duration-300 hover:scale-[1.01] cursor-pointer group flex flex-col justify-between h-32"
          id="stat-coupons-used"
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium font-sans">Cupons Ativos</p>
            <Ticket className="w-3.5 h-3.5 text-gray-500 group-hover:text-[#D4AF37] transition-colors" />
          </div>
          <div>
            <p className="text-3xl font-serif text-white">{couponsUsed}</p>
            <div className="mt-1 text-[10px] text-gray-400">Taxa de conversão 84%</div>
          </div>
        </div>

        {/* Vendas do Mês */}
        <div 
          onClick={() => onNavigateToTab('Relatórios')}
          className="bg-[#7B112C] p-5 rounded-xl border border-[#D4AF37]/30 hover:border-[#D4AF37]/50 transition-all duration-300 hover:scale-[1.02] cursor-pointer group shadow flex flex-col justify-between h-32"
          id="stat-monthly-sales"
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-wider text-white/60 font-medium font-sans">Vendas Mês</p>
            <TrendingUp className="w-3.5 h-3.5 text-white/50 group-hover:text-[#D4AF37] transition-colors" />
          </div>
          <div>
            <p className="text-2xl font-serif text-white">{formatCurrency(monthlySalesValue)}</p>
            <div className="mt-1 text-[10px] text-[#D4AF37]">Meta: 85% atingida</div>
          </div>
        </div>

        {/* Produto mais vendido */}
        <div 
          onClick={() => onNavigateToTab('Relatórios')}
          className="bg-[#1E1E1E] p-5 rounded-xl border border-white/5 hover:border-[#D4AF37]/20 transition-all duration-300 hover:scale-[1.01] cursor-pointer group flex flex-col justify-between h-32"
          id="stat-top-selling"
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium font-sans">Best Seller</p>
            <Sparkles className="w-3.5 h-3.5 text-gray-500 group-hover:text-[#D4AF37] transition-colors" />
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-medium text-white truncate leading-none mb-1" title={topSoldProductName}>
              {topSoldProductName}
            </p>
            <p className="text-[9px] text-gray-400 font-mono">
              {topSoldProductCount} garrafas vendidas
            </p>
          </div>
        </div>
      </div>

      {/* CHARTS GRAPHICS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="dashboard-charts-layout">
        
        {/* CHART 1: Vendas por Mês (Spline Area) */}
        <div className="bg-[#1E1E1E] border border-white/5 rounded-xl p-6 lg:col-span-8 flex flex-col justify-between" id="chart-sales-by-month">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-serif italic text-white flex items-center gap-2">
                Faturamento Mensal <span className="text-[10px] uppercase font-mono tracking-widest py-0.5 px-2 bg-[#7B112C]/20 text-[#D4AF37] border border-[#7B112C]/40 rounded">2026</span>
              </h2>
              <p className="text-xs text-gray-400 mt-1">Total apurado em vendas diretas e faturamento por mês.</p>
            </div>
            <div className="flex items-center gap-3 font-mono text-xs">
              <span className="flex items-center gap-1.5 text-gray-400">
                <span className="inline-block w-2 h-2 rounded-full bg-[#D4AF37]"></span> Faturamento
              </span>
            </div>
          </div>

          {/* SVG Chart Core */}
          <div className="relative h-60 w-full mt-2" id="sales-svg-chart-container">
            <svg viewBox="0 0 600 240" className="w-full h-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.3"></stop>
                  <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.0"></stop>
                </linearGradient>
              </defs>
              
              {/* Grid Lines */}
              <line x1="50" y1="30" x2="570" y2="30" stroke="#222" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="50" y1="80" x2="570" y2="80" stroke="#222" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="50" y1="130" x2="570" y2="130" stroke="#222" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="50" y1="180" x2="570" y2="180" stroke="#222" strokeWidth="1" strokeDasharray="3 3" />
              
              {/* Left axis guide lines label */}
              <text x="15" y="34" fill="#666" fontSize="10" className="font-mono">R$ 3k</text>
              <text x="15" y="84" fill="#666" fontSize="10" className="font-mono">R$ 2k</text>
              <text x="15" y="134" fill="#666" fontSize="10" className="font-mono">R$ 1k</text>
              <text x="25" y="184" fill="#666" fontSize="10" className="font-mono">R$ 0</text>

              {/* Area filled polygon */}
              {/* Coordinates scaled dynamically: 
                  Y: 180 is near zero, 30 is ~R$ 3000 max. Scale = (180 - 30) / 3000 = 0.05
                  X coordinates: Jan(80), Feb(170), Mar(260), Apr(350), May(440), Jun(530)
              */}
              <polygon
                points={`
                  80,180
                  80,${180 - (monthlySalesData[0].value * 0.05)}
                  170,${180 - (monthlySalesData[1].value * 0.05)}
                  260,${180 - (monthlySalesData[2].value * 0.05)}
                  350,${180 - (monthlySalesData[3].value * 0.05)}
                  440,${180 - (monthlySalesData[4].value * 0.05)}
                  530,${180 - (monthlySalesData[5].value * 0.05)}
                  530,180
                `}
                fill="url(#salesGrad)"
              />

              {/* Path stroke */}
              <polyline
                fill="none"
                stroke="#D4AF37"
                strokeWidth="3.5"
                points={`
                  80,${180 - (monthlySalesData[0].value * 0.05)}
                  170,${180 - (monthlySalesData[1].value * 0.05)}
                  260,${180 - (monthlySalesData[2].value * 0.05)}
                  350,${180 - (monthlySalesData[3].value * 0.05)}
                  440,${180 - (monthlySalesData[4].value * 0.05)}
                  530,${180 - (monthlySalesData[5].value * 0.05)}
                `}
              />

              {/* Interaction circles on the points */}
              {monthlySalesData.map((d, idx) => {
                const xVal = 80 + idx * 90;
                const yVal = 180 - (d.value * 0.05);
                return (
                  <g key={idx} className="cursor-pointer group/node">
                    <circle 
                      cx={xVal}
                      cy={yVal}
                      r="6"
                      fill="#121212"
                      stroke="#D4AF37"
                      strokeWidth="2.5"
                    />
                    {/* Hover hotspot */}
                    <circle
                      cx={xVal}
                      cy={yVal}
                      r="20"
                      fill="transparent"
                      onMouseEnter={(e) => {
                        const bounds = e.currentTarget.getBoundingClientRect();
                        setActiveTooltip({
                          x: bounds.left - 50,
                          y: bounds.top - 80,
                          month: d.month,
                          value: formatCurrency(d.value)
                        });
                      }}
                      onMouseLeave={() => setActiveTooltip(null)}
                    />
                  </g>
                );
              })}

              {/* X Axis bottom labels */}
              <text x="80" y="215" fill="#aaa" fontSize="11" textAnchor="middle" className="font-semibold font-mono">Jan</text>
              <text x="170" y="215" fill="#aaa" fontSize="11" textAnchor="middle" className="font-semibold font-mono">Fev</text>
              <text x="260" y="215" fill="#aaa" fontSize="11" textAnchor="middle" className="font-semibold font-mono">Mar</text>
              <text x="350" y="215" fill="#aaa" fontSize="11" textAnchor="middle" className="font-semibold font-mono">Abr</text>
              <text x="440" y="215" fill="#aaa" fontSize="11" textAnchor="middle" className="font-semibold font-mono">Mai</text>
              <text x="530" y="215" fill="#aaa" fontSize="11" textAnchor="middle" className="font-semibold font-mono">Jun</text>
              
              {/* Outer bottom timeline bar */}
              <line x1="50" y1="190" x2="570" y2="190" stroke="#333" strokeWidth="1" />
            </svg>
            
            {/* Custom Interactive Floating Tooltip */}
            <AnimatePresence>
              {activeTooltip && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{ position: 'fixed', left: activeTooltip.x, top: activeTooltip.y }}
                  className="z-50 bg-black/95 text-white border border-gold-500/30 rounded-lg p-2.5 shadow-2xl text-xs pointer-events-none"
                >
                  <p className="font-bold text-gold-400 font-mono">{activeTooltip.month}</p>
                  <p className="font-mono mt-0.5">{activeTooltip.value}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* CHART 2: Clientes Novos / Categorias mais compradas (Bar Chart) */}
        <div className="bg-[#1E1E1E] border border-white/5 rounded-xl p-6 lg:col-span-4 flex flex-col justify-between" id="chart-new-clients">
          <div>
            <h2 className="text-lg font-serif italic text-white flex items-center gap-2">
              Clientes Novos <span className="text-[10px] uppercase font-mono tracking-widest py-0.5 px-2 bg-[#7B112C]/20 text-[#D4AF37] border border-[#7B112C]/40 rounded">Inscrições</span>
            </h2>
            <p className="text-xs text-gray-400 mt-1">Total acumulado de novos clientes fidelizados mensalmente.</p>
          </div>

          {/* SVG Bar Chart for clients registered */}
          <div className="relative h-60 w-full mt-4" id="clients-new-svg-chart">
            <svg viewBox="0 0 250 180" className="w-full h-full" preserveAspectRatio="none">
              {/* Grid Lines */}
              <line x1="30" y1="20" x2="230" y2="20" stroke="#222" strokeWidth="1" strokeDasharray="2 2" />
              <line x1="30" y1="70" x2="230" y2="70" stroke="#222" strokeWidth="1" strokeDasharray="2 2" />
              <line x1="30" y1="120" x2="230" y2="120" stroke="#222" strokeWidth="1" strokeDasharray="2 2" />
              
              {/* Left axis guide label */}
              <text x="10" y="24" fill="#555" fontSize="9" className="font-mono">8</text>
              <text x="10" y="74" fill="#555" fontSize="9" className="font-mono">4</text>
              <text x="10" y="124" fill="#555" fontSize="9" className="font-mono">0</text>

              {/* Bar render: Jan(45), Feb(75), Mar(105), Apr(135), May(165), Jun(195)
                  Y Scale: Height calculation 
              */}
              {monthlyNewClientsData.map((d, index) => {
                const xVal = 40 + index * 30;
                // Scale value: max value is 8. y is 120 (near zero), so height is d.count * 12
                const barHeight = d.count * 11;
                const yVal = 120 - barHeight;

                return (
                  <g key={index} className="cursor-pointer group">
                    <rect
                      x={xVal - 8}
                      y={yVal}
                      width="16"
                      height={barHeight}
                      rx="3"
                      fill={index === 5 ? "#7B112C" : "#4A2F35"} // Highlights June bordô
                      stroke={index === 5 ? "#D4AF37" : "transparent"}
                      strokeWidth="1"
                      className="transition-all duration-300 hover:fill-bordo-500"
                      onMouseEnter={(e) => {
                        const bounds = e.currentTarget.getBoundingClientRect();
                        setActiveClientTooltip({
                          x: bounds.left - 40,
                          y: bounds.top - 60,
                          month: d.month,
                          count: d.count
                        });
                      }}
                      onMouseLeave={() => setActiveClientTooltip(null)}
                    />
                  </g>
                );
              })}

              {/* Bottom line */}
              <line x1="30" y1="120" x2="230" y2="120" stroke="#333" strokeWidth="1" />

              {/* Bottom labels */}
              {monthlyNewClientsData.map((d, idx) => (
                <text key={idx} x={40 + idx * 30} y="138" fill="#888" fontSize="10" textAnchor="middle" className="font-semibold font-mono">
                  {d.month}
                </text>
              ))}
            </svg>

            {/* Custom Interactive Floating Client Tooltip */}
            <AnimatePresence>
              {activeClientTooltip && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{ position: 'fixed', left: activeClientTooltip.x, top: activeClientTooltip.y }}
                  className="z-50 bg-black/95 text-white border border-bordo-500/40 rounded-lg p-2 shadow-2xl text-xs pointer-events-none"
                >
                  <p className="font-bold text-bordo-400 font-mono">{activeClientTooltip.month}</p>
                  <p className="font-mono mt-0.5">+{activeClientTooltip.count} clientes</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>

      {/* DETAILED DOUBLE PANELS: PROMOÇÕES ATIVAS & CLIENTES RECENTES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="dashboard-tables-layout">
        
        {/* SEÇÃO Promoções Ativas */}
        <div className="bg-[#1E1E1E] border border-white/5 rounded-xl p-6 flex flex-col justify-between" id="section-active-promotions">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-serif italic text-white flex items-center gap-2">
                <Percent className="w-4 h-4 text-[#D4AF37]" />
                Promoções Ativas
              </h2>
              <button 
                onClick={() => onNavigateToTab('Promoções')}
                className="text-xs text-[#D4AF37] uppercase tracking-wider font-semibold hover:underline flex items-center gap-1"
              >
                Gerenciar Campanhas <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            
            {activePromoList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 bg-black/10 rounded-lg border border-dashed border-white/5">
                <Wine className="w-8 h-8 text-gray-700 mb-2" />
                <p className="text-sm text-gray-500">Nenhuma promoção ativa no momento.</p>
                <button 
                  onClick={onCreatePromotionClick}
                  className="mt-3 text-xs bg-[#7B112C] text-white font-serif italic font-bold px-4 py-2 rounded border border-[#D4AF37]/35 hover:bg-[#921435] transition"
                >
                  Criar Primeiro Desconto
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {activePromoList.map((promo) => (
                  <div 
                    key={promo.id} 
                    className="flex justify-between items-center p-3.5 bg-[#121212] border border-white/5 hover:border-[#D4AF37]/30 rounded-lg transition duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-[#7B112C]/20 border border-[#7B112C]/40 rounded text-[#D4AF37] font-mono font-bold text-xs">
                        -{promo.discountPercentage}%
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white tracking-tight leading-snug">
                          {promo.productName}
                        </h4>
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{promo.description}</p>
                      </div>
                    </div>
                    
                    <div className="text-right shrink-0">
                      <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded text-[10px] uppercase font-mono font-bold bg-[#7B112C]/10 text-[#D4AF37] border border-[#D4AF37]/20">
                        Ativa até {new Date(promo.endDate + 'T00:00:00').toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'})}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-white/5 flex justify-between items-center text-xs text-gray-500">
            <span>Estas ofertas são aplicadas diretamente no catálogo.</span>
            <span className="font-mono text-[10px]">Atualizado 2026</span>
          </div>
        </div>

        {/* SEÇÃO Clientes Recentes */}
        <div className="bg-[#1E1E1E] border border-white/5 rounded-xl p-6 flex flex-col justify-between" id="section-recent-clients">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-serif italic text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-[#D4AF37]" />
                Clientes Recentes
              </h2>
              <button 
                onClick={() => onNavigateToTab('Clientes')}
                className="text-xs text-[#D4AF37] uppercase tracking-wider font-semibold hover:underline flex items-center gap-1"
              >
                Ver todos <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-3">
              {recentClients.map((client) => {
                const preferenceInitials = client.favoriteCategory.split(' ').map(n=>n[0]).join('');
                return (
                  <div 
                    key={client.id}
                    className="flex justify-between items-center p-3 bg-[#121212] border border-white/5 hover:border-[#D4AF37]/30 rounded-lg transition duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7B112C] to-[#D4AF37] flex items-center justify-center text-white font-bold text-sm tracking-tighter">
                        {client.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white tracking-tight">{client.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-gray-400 flex items-center gap-0.5"><Phone className="w-3 h-3 text-[#D4AF37]" /> {client.phone}</span>
                          <span className="text-[10px] text-gray-500">•</span>
                          <span className="text-[10px] font-semibold text-[#D4AF37] font-mono select-none px-1 py-0.2 bg-[#7B112C]/10 rounded">
                            {client.favoriteCategory}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono font-bold text-white block">{formatCurrency(client.totalSpent)}</span>
                      <span className="text-[10px] text-gray-500 mt-0.5 block">{client.ordersCount} compras</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-white/5 text-xs text-gray-500 flex justify-between items-center">
            <span>Fidelize clientes para enviar ofertas no WhatsApp.</span>
            <button 
              onClick={() => onNavigateToTab('Clientes')}
              className="text-xs text-[#D4AF37] hover:underline flex items-center gap-0.5 font-medium"
            >
              Fidelizar Cliente +
            </button>
          </div>
        </div>

      </div>

      {/* FLOAT BOTÃO "+ Nova Promoção" */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onCreatePromotionClick}
        className="fixed bottom-6 right-6 z-40 bg-[#D4AF37] text-[#121212] px-6 py-4 rounded-full shadow-2xl flex items-center gap-2 hover:bg-[#c49e2e] transition-all font-serif italic text-xs font-bold uppercase tracking-widest border border-[#D4AF37]/50"
        id="floating-add-promotion-btn"
        title="Criar Nova Promoção Ativa"
      >
        <Plus className="w-4 h-4 text-[#121212] stroke-[3]" />
        <span>Nova Promoção</span>
      </motion.button>

    </div>
  );
}
