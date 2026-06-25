/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sale, Product, Client } from '../types';
import { 
  TrendingUp, 
  Plus, 
  Printer, 
  ShoppingBag, 
  Coins, 
  Percent, 
  FileText, 
  Sparkles, 
  Search,
  Calendar,
  Wine,
  UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ReportsViewProps {
  sales: Sale[];
  products: Product[];
  clients: Client[];
  onAddSale: (sale: Omit<Sale, 'id'>) => void;
  adegaConfig: { name: string; phone: string; address: string };
}

export default function ReportsView({
  sales,
  products,
  clients,
  onAddSale,
  adegaConfig
}: ReportsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddSaleForm, setShowAddSaleForm] = useState(false);

  // Simulated additions states
  const [prodId, setProdId] = useState('');
  const [qty, setQty] = useState('1');
  const [selectedClientName, setSelectedClientName] = useState('');
  const [discountVal, setDiscountVal] = useState('0');

  // Basic KPI Math
  const totalVolumeSales = sales.length;
  const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
  const totalDiscountsGiven = sales.reduce((sum, s) => sum + (s.discountAmount || 0), 0);
  const avgTicket = totalVolumeSales > 0 ? totalRevenue / totalVolumeSales : 0;

  // Profit Margins Calculations:
  // For each sale, look up the product to calculate costPrice or assume 60% of sale price if not found
  const totalCost = sales.reduce((sum, s) => {
    const originalProd = products.find(p => p.id === s.productId);
    const itemCost = originalProd ? originalProd.costPrice : (s.unitPrice * 0.6);
    return sum + (itemCost * s.quantity);
  }, 0);

  const totalProfit = totalRevenue - totalCost;
  const averageProfitMarginPercentage = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  // Category breakdown share calculations
  const categorySalesMap: { [cat: string]: number } = {};
  sales.forEach(s => {
    categorySalesMap[s.category] = (categorySalesMap[s.category] || 0) + s.total;
  });

  const categoryShareData = Object.entries(categorySalesMap)
    .map(([category, value]) => ({ category, value }))
    .sort((a,b) => b.value - a.value);

  const handleCreateSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodId || !qty) return;

    const originalProduct = products.find(p => p.id === prodId);
    if (!originalProduct) return;

    const saleQty = parseInt(qty) || 1;
    const saleDiscount = parseFloat(discountVal) || 0;
    const itemUnitPrice = originalProduct.salePrice;
    
    const subtotal = itemUnitPrice * saleQty;
    const totalWithDiscount = Math.max(0, subtotal - saleDiscount);

    // Date
    const todayStr = '2026-06-20';

    onAddSale({
      date: todayStr,
      productId: prodId,
      productName: originalProduct.name,
      category: originalProduct.category,
      quantity: saleQty,
      unitPrice: itemUnitPrice,
      discountAmount: saleDiscount,
      total: totalWithDiscount,
      clientName: selectedClientName || undefined
    });

    // Reset fields
    setProdId('');
    setQty('1');
    setSelectedClientName('');
    setDiscountVal('0');
    setShowAddSaleForm(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  // Search filtered sales
  const filteredSales = sales.filter(s => {
    const matchesProductname = s.productName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClient = s.clientName ? s.clientName.toLowerCase().includes(searchTerm.toLowerCase()) : false;
    const matchesCategory = s.category.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesProductname || matchesClient || matchesCategory;
  }).reverse(); // Latest sales first!

  return (
    <div className="space-y-6" id="reports-view-root">
      
      {/* HEADER BAR AND PDF PRINT REPORT */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-bordo-500" />
            Movimentações & Relatórios
          </h1>
          <p className="text-xs text-gray-400 mt-1 pb-1">
            Audite transações financeiras, analise lucros de estoque de vinhos e simule lançamentos.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* Printable Report preview */}
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 bg-black hover:bg-dark-hover border border-dark-border text-gray-300 font-semibold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer"
            id="print-report-btn"
          >
            <Printer className="w-4 h-4 text-gold-500" /> Imprimir Relatório
          </button>

          {/* Quick simulator sale */}
          <button
            onClick={() => setShowAddSaleForm(!showAddSaleForm)}
            className="flex items-center justify-center gap-2 bg-bordo-800 hover:bg-bordo-750 text-white font-medium text-xs px-4 py-2.5 rounded-xl transition duration-150 shadow-md"
            id="btn-trigger-add-sale"
          >
            {showAddSaleForm ? 'Fechar Lançador' : (
              <>
                <Plus className="w-4 h-4" /> Lançar Venda Balcão
              </>
            )}
          </button>
        </div>
      </div>

      {/* FORM: EMULATOR ADD NEW LEADER VENDAS */}
      <AnimatePresence>
        {showAddSaleForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-dark-card border border-dark-border rounded-2xl p-5"
            id="sales-manual-form-container"
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-gold-500 animate-pulse" />
              <h3 className="text-sm font-serif font-bold text-white">Registrar Nova Compra Realizada (Balcão / WhatsApp)</h3>
            </div>

            <form onSubmit={handleCreateSale} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                
                {/* Product to purchase */}
                <div className="md:col-span-5 flex flex-col gap-1">
                  <label className="text-xs text-gray-400 font-semibold uppercase">Selecionar Bebida <span className="text-bordo-500">*</span></label>
                  <select
                    required
                    value={prodId}
                    onChange={(e) => setProdId(e.target.value)}
                    className="input-premium w-full font-semibold"
                  >
                    <option value="">-- Escolha um rótulo do estoque --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id} disabled={p.stock === 0}>
                        {p.name} (R$ {p.salePrice.toFixed(2)}) {p.stock === 0 ? ' - [SEM ESTOQUE!]' : ` - [Estoque: ${p.stock}]`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantity */}
                <div className="md:col-span-2 flex flex-col gap-1">
                  <label className="text-xs text-gray-400 font-semibold uppercase font-sans">Garrafas / Qtd <span className="text-bordo-500">*</span></label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                    className="input-premium font-mono text-white font-bold"
                  />
                </div>

                {/* Client link optional */}
                <div className="md:col-span-3 flex flex-col gap-1">
                  <label className="text-xs text-gray-400 font-semibold uppercase">Vincular Cliente (Opcional)</label>
                  <select
                    value={selectedClientName}
                    onChange={(e) => setSelectedClientName(e.target.value)}
                    className="input-premium"
                  >
                    <option value="">Consumidor Geral (Sem Nome)</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Manual discount */}
                <div className="md:col-span-2 flex flex-col gap-1">
                  <label className="text-xs text-gray-400 font-semibold uppercase font-sans">Desconto Extra (R$)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={discountVal}
                    onChange={(e) => setDiscountVal(e.target.value)}
                    className="input-premium font-mono"
                  />
                </div>

              </div>

              {/* LIVE TOTAL REVIEW ESTIMATE */}
              {prodId && (
                <div className="bg-emerald-950/20 border border-emerald-900 p-3.5 rounded-xl flex items-center justify-between text-xs text-gray-300">
                  <span className="font-semibold text-white">Preço Final da Transação Estimado:</span>
                  <span className="font-mono text-emerald-400 font-bold text-sm">
                    {(() => {
                      const originalProd = products.find(p=>p.id === prodId);
                      if (!originalProd) return 'R$ 0,00';
                      const sQty = parseInt(qty) || 1;
                      const sDisc = parseFloat(discountVal) || 0;
                      return formatCurrency(Math.max(0, originalProd.salePrice * sQty - sDisc));
                    })()}
                  </span>
                </div>
              )}

              {/* Form buttons */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddSaleForm(false)}
                  className="px-4 py-2 border border-dark-border text-xs text-gray-400 rounded-lg hover:text-white transition"
                >
                  Regressar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg transition font-medium"
                >
                  Faturar Venda
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RENDER INVOICE REPORT KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id="report-kpi-summary">
        
        {/* Receita Faturamento total */}
        <div className="bg-dark-card border border-dark-border p-4 rounded-xl flex items-center gap-3">
          <div className="p-3 bg-bordo-950 rounded-lg text-bordo-400">
            <TrendingUp className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold font-sans">Receita Faturada</p>
            <p className="text-base font-mono text-white font-bold">{formatCurrency(totalRevenue)}</p>
          </div>
        </div>

        {/* Lucratividade Real */}
        <div className="bg-dark-card border border-dark-border p-4 rounded-xl flex items-center gap-3">
          <div className="p-3 bg-emerald-950 rounded-lg text-emerald-400">
            <Coins className="w-5 h-5 text-emerald-450" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold font-sans">Lucro Líquido</p>
            <p className="text-base font-mono text-emerald-400 font-bold">
              {formatCurrency(totalProfit)} 
              <span className="text-[10px] text-emerald-500 font-semibold ml-1">({averageProfitMarginPercentage.toFixed(0)}%)</span>
            </p>
          </div>
        </div>

        {/* Ticket Médio */}
        <div className="bg-dark-card border border-dark-border p-4 rounded-xl flex items-center gap-3">
          <div className="p-3 bg-indigo-950 rounded-lg text-indigo-400">
            <ShoppingBag className="w-5 h-5 text-indigo-455" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold font-sans">Ticket Médio Geral</p>
            <p className="text-base font-mono text-white font-bold">{formatCurrency(avgTicket)}</p>
          </div>
        </div>

        {/* Descontos Concedidos */}
        <div className="bg-dark-card border border-dark-border p-4 rounded-xl flex items-center gap-3">
          <div className="p-3 bg-amber-950 rounded-lg text-amber-500">
            <Percent className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold font-sans">Descontos Reais</p>
            <p className="text-base font-mono text-amber-500 font-bold">{formatCurrency(totalDiscountsGiven)}</p>
          </div>
        </div>

      </div>

      {/* RENDER CATEGORY SHARES DEMAND & HISTORY TRANSACTION LIST */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="report-details-layout">
        
        {/* Category Breakdown list with progress indicators (Manual Bar charts) */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-5 lg:col-span-4 flex flex-col justify-between" id="report-share-demand">
          <div>
            <h3 className="text-base font-serif font-bold text-white flex items-center gap-2">
              <Wine className="w-5 h-5 text-gold-500" />
              Demanda por Categoria
            </h3>
            <p className="text-xs text-gray-400 mt-1">Soma faturada por tipo de produto nas vendas da adega.</p>
          </div>

          <div className="space-y-4 mt-6">
            {categoryShareData.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-6">Registros inativos.</p>
            ) : (
              categoryShareData.map((share, index) => {
                const percentShare = totalRevenue > 0 ? (share.value / totalRevenue) * 100 : 0;
                
                // Color choices by index
                const barColors = [
                  'bg-bordo-800', 
                  'bg-gold-550', 
                  'bg-indigo-600', 
                  'bg-emerald-600', 
                  'bg-purple-650'
                ];
                
                return (
                  <div key={share.category} className="space-y-1 text-xs">
                    <div className="flex justify-between font-medium">
                      <span className="text-gray-300 font-semibold">{share.category}</span>
                      <span className="font-mono text-gray-400 font-bold">
                        {formatCurrency(share.value)} <strong className="text-white ml-1">({percentShare.toFixed(0)}%)</strong>
                      </span>
                    </div>
                    <div className="w-full bg-dark-border h-2 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${percentShare}%` }}
                        className={`h-full rounded-full ${barColors[index % barColors.length]}`}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="border-t border-dark-border/40 text-[10px] text-gray-500 pt-3 mt-4 text-center">
            Mapeamento dinâmico alimentado pelo volume de estoque escoado.
          </div>
        </div>

        {/* Sales ledger list with live search filters */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-5 lg:col-span-8 flex flex-col justify-between" id="report-history-ledger">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-serif font-bold text-white flex items-center gap-2">
                  Histórico de Auditoria de Vendas
                </h3>
                <p className="text-xs text-gray-400">Listagem de faturamento consolidado por lote de garrafa.</p>
              </div>

              {/* Ledger search field */}
              <div className="relative w-full sm:w-60">
                <Search className="absolute left-3 top-2 w-3.5 h-3.5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Filtre por bebida ou cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-premium pl-8 py-1.5 text-xs w-full"
                />
              </div>
            </div>

            {/* Sales table layout list */}
            {filteredSales.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-6">Nenhum lançamento corresponde.</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1" id="sales-scroller-panel">
                {filteredSales.map((sale) => (
                  <div 
                    key={sale.id}
                    className="flex justify-between items-center p-3 bg-black/25 border border-dark-border hover:border-bordo-950/60 transition rounded-xl text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-dark-border rounded-lg text-gray-400 shrink-0 font-bold text-center">
                        <Wine className="w-4 h-4 text-bordo-500" />
                      </div>

                      <div>
                        <h4 className="font-semibold text-white tracking-tight text-xs leading-snug">{sale.productName}</h4>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[11px] text-gray-500 font-mono">
                          <span className="bg-dark-border text-gray-400 px-1 py-0.2 rounded font-sans">{sale.category}</span>
                          <span>•</span>
                          <span>Qtd: {sale.quantity}x</span>
                          <span>•</span>
                          <span>Unitário: R$ {sale.unitPrice.toFixed(2)}</span>
                          {sale.clientName && (
                            <>
                              <span>•</span>
                              <span className="text-gold-500 flex items-center gap-0.5"><UserCheck className="w-3 h-3" /> {sale.clientName}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right font-mono self-center shrink-0">
                      <span className="font-bold text-white block">R$ {sale.total.toFixed(2)}</span>
                      <span className="text-[10px] text-gray-500 block">{new Date(sale.date + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-dark-border/40 text-[10px] text-gray-500 pt-3 mt-4 flex justify-between uppercase font-mono">
            <span>AdegaPro Relatório Faturamento</span>
            <span>Estabilidade de Caixa Garantida</span>
          </div>

        </div>

      </div>

    </div>
  );
}
