/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Product } from '../types';
import { 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  Filter, 
  Package, 
  Image as ImageIcon,
  ArrowRight,
  RefreshCw,
  X,
  BadgeAlert,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProductsViewProps {
  products: Product[];
  onAddProduct: (prod: Omit<Product, 'id'>) => void;
  onEditProduct: (id: string, prod: Partial<Product>) => void;
  onDeleteProduct: (id: string) => void;
  onClearAllProducts?: () => void;
}

const ALL_CATEGORIES = ['Vinhos', 'Whisky', 'Gin', 'Vodka', 'Cerveja', 'Energéticos', 'Refrigerantes', 'Snacks'];

export default function ProductsView({
  products,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onClearAllProducts
}: ProductsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Registration / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Vinhos');
  const [brand, setBrand] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [stock, setStock] = useState('');
  const [barcode, setBarcode] = useState('');

  const resetForm = () => {
    setName('');
    setCategory('Vinhos');
    setBrand('');
    setDescription('');
    setImage('');
    setCostPrice('');
    setSalePrice('');
    setStock('');
    setBarcode('');
    setEditingId(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (prod: Product) => {
    setEditingId(prod.id);
    setName(prod.name);
    setCategory(prod.category);
    setBrand(prod.brand || '');
    setDescription(prod.description || '');
    setImage(prod.image || '');
    setCostPrice(prod.costPrice.toString());
    setSalePrice(prod.salePrice.toString());
    setStock(prod.stock.toString());
    setBarcode(prod.barcode || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !salePrice || !stock) return;

    const parsedCost = parseFloat(costPrice) || 0;
    const parsedSale = parseFloat(salePrice) || 0;
    const parsedStock = parseInt(stock) || 0;

    const data: Omit<Product, 'id'> = {
      name,
      category,
      brand: brand || undefined,
      description: description || undefined,
      image: image || undefined,
      costPrice: parsedCost,
      salePrice: parsedSale,
      stock: parsedStock,
      minStock: 5, // default
      status: parsedStock === 0 ? 'out_of_stock' : 'active',
      barcode: barcode || undefined,
      sku: barcode || undefined // Fallback sku for older dependencies
    };

    if (editingId) {
      onEditProduct(editingId, data);
    } else {
      onAddProduct(data);
    }

    setIsModalOpen(false);
    resetForm();
  };

  // Derived arrays
  const filteredProducts = products.filter(p => {
    const matchesSearch = (p.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                          (p.brand?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 lg:space-y-8" id="products-view-root">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl lg:text-4xl font-serif italic text-white mb-2 leading-tight flex items-center gap-3">
            Catálogo
          </h1>
          <p className="text-gray-500 text-xs uppercase tracking-[0.2em] font-sans">
            AdegaPro • Gestão de Rótulos & Produtos
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
          {products.length > 0 && onClearAllProducts && (
            <button
              onClick={() => {
                if (confirm('Aviso: Isso excluirá PERMANENTEMENTE todos os seus produtos. Deseja continuar?')) {
                  onClearAllProducts();
                }
              }}
              className="flex items-center gap-2 bg-transparent hover:bg-red-950/20 text-red-400 hover:text-red-350 px-5 py-3 rounded transition-all font-serif italic font-bold uppercase tracking-widest text-xs border border-red-950/50 justify-center w-full sm:w-auto"
            >
              <Trash2 className="w-4 h-4" />
              Limpar Catálogo
            </button>
          )}

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-[#D4AF37] text-[#121212] px-6 py-3 rounded hover:bg-[#c49e2e] transition-all font-serif italic font-bold uppercase tracking-widest text-xs border border-[#D4AF37]/50 shadow-lg justify-center w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Cadastrar Produto
          </button>
        </div>
      </div>

      {/* TOOLBAR: SEARCH & FILTERS */}
      <div className="flex flex-col md:flex-row gap-4 justify-between bg-[#1E1E1E] border border-white/5 p-4 rounded-xl">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por nome ou marca..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-premium pl-10 w-full bg-[#121212] rounded-lg border-white/10"
          />
        </div>

        <div className="flex overflow-x-auto gap-2 pb-2 md:pb-0 hide-scrollbar items-center">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors uppercase tracking-wider ${
              selectedCategory === 'all' 
                ? 'bg-[#7B112C] text-white border border-[#D4AF37]/30' 
                : 'bg-[#121212] text-gray-400 border border-white/5 hover:border-[#D4AF37]/30'
            }`}
          >
            Todos
          </button>
          {ALL_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors uppercase tracking-wider ${
                selectedCategory === cat
                  ? 'bg-[#7B112C] text-white border border-[#D4AF37]/30' 
                  : 'bg-[#121212] text-gray-400 border border-white/5 hover:border-[#D4AF37]/30'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* PRODUCTS DISPLAY - MODERNCARD GRID */}
      {filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-[#1E1E1E] rounded-xl border border-white/5">
          <Package className="w-12 h-12 text-white/20 mb-4" />
          <p className="text-gray-400 font-medium">Nenhum produto encontrado nesta categoria.</p>
          <button onClick={handleOpenAdd} className="mt-4 text-xs text-[#D4AF37] font-semibold hover:underline">
            Adicionar o primeiro produto
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map(p => (
            <div 
              key={p.id} 
              className="bg-[#1E1E1E] border border-white/5 rounded-xl overflow-hidden hover:border-[#D4AF37]/30 transition-all duration-300 flex flex-col group"
            >
              <div className="relative h-48 bg-[#0a0a0a] flex items-center justify-center overflow-hidden">
                {p.image ? (
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500 group-hover:scale-105" />
                ) : (
                  <ImageIcon className="w-10 h-10 text-white/10" />
                )}
                
                {/* Category Badge */}
                <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded border border-white/10">
                  <span className="text-[9px] uppercase tracking-widest text-[#D4AF37] font-bold">{p.category}</span>
                </div>

                {/* Stock Badge */}
                {p.stock === 0 ? (
                  <div className="absolute top-3 right-3 px-2 py-1 bg-red-900/80 backdrop-blur-md rounded border border-red-500/30">
                    <span className="text-[9px] uppercase tracking-widest text-red-200 font-bold">Esgotado</span>
                  </div>
                ) : p.stock <= p.minStock ? (
                  <div className="absolute top-3 right-3 px-2 py-1 bg-amber-900/80 backdrop-blur-md rounded border border-amber-500/30 flex items-center gap-1">
                    <BadgeAlert className="w-3 h-3 text-amber-300" />
                    <span className="text-[9px] font-mono text-amber-200 font-bold">{p.stock} UN</span>
                  </div>
                ) : null}
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <div className="mb-auto">
                  {p.brand && <p className="text-[10px] text-gray-500 tracking-wider uppercase mb-1">{p.brand}</p>}
                  <h3 className="text-white font-medium leading-tight mb-2 line-clamp-2" title={p.name}>{p.name}</h3>
                </div>
                
                <div className="mt-4 flex items-end justify-between border-t border-white/5 pt-4">
                  <div>
                    <p className="text-[10px] uppercase text-gray-500 tracking-wider">Valor Unitário</p>
                    <p className="text-lg font-serif italic text-white flex items-center gap-1 mt-0.5">
                      <span className="text-sm font-sans text-[#D4AF37]">R$</span>
                      {p.salePrice.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase text-gray-500 tracking-wider">Estoque</p>
                    <p className={`text-base font-mono font-bold mt-0.5 ${p.stock === 0 ? 'text-red-400' : 'text-gray-300'}`}>
                      {p.stock} <span className="text-xs text-gray-600 font-sans">un</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex border-t border-white/5 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity bg-[#0a0a0a]/50">
                <button 
                  onClick={() => handleOpenEdit(p)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 hover:bg-white/5 transition-colors text-xs text-gray-400 hover:text-white uppercase tracking-wider font-semibold"
                >
                  <Edit className="w-3.5 h-3.5" /> Editar
                </button>
                <div className="w-px bg-white/5"></div>
                <button 
                  onClick={() => {
                    if (confirm(`Excluir o produto "${p.name}"?`)) onDeleteProduct(p.id);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-3 hover:bg-red-950/30 transition-colors text-xs text-gray-400 hover:text-red-400 uppercase tracking-wider font-semibold"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Excluir
                </button>
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
                  <h2 className="text-xl md:text-2xl font-serif italic text-white">{editingId ? 'Editar Produto' : 'Cadastrar Produto'}</h2>
                  <p className="text-[9px] md:text-[10px] uppercase tracking-widest text-[#D4AF37] mt-1">Preencha as informações do rótulo</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 bg-black/20 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 md:p-6 overflow-y-auto min-h-0 flex-1">
                <form onSubmit={handleSave} className="space-y-6">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* COL 1 */}
                    <div className="space-y-4">
                      {/* Name */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Nome <span className="text-red-400">*</span></label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Ex: Johnnie Walker Black Label"
                          className="input-premium w-full"
                        />
                      </div>

                      {/* Category & Brand row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Categoria <span className="text-red-400">*</span></label>
                          <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="input-premium w-full bg-black text-white"
                          >
                            {ALL_CATEGORIES.map((cat) => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Marca</label>
                          <input
                            type="text"
                            value={brand}
                            onChange={(e) => setBrand(e.target.value)}
                            placeholder="Ex: Diageo"
                            className="input-premium w-full"
                          />
                        </div>
                      </div>

                      {/* Description */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Descrição</label>
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Descreva o produto..."
                          className="input-premium w-full h-24 resize-none"
                        />
                      </div>

                      {/* Image URL */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">URL da Foto</label>
                        <input
                          type="url"
                          value={image}
                          onChange={(e) => setImage(e.target.value)}
                          placeholder="https://..."
                          className="input-premium w-full"
                        />
                      </div>
                    </div>

                    {/* COL 2 */}
                    <div className="space-y-4">
                      
                      {/* Pricing */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Preço de Custo</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-mono focus-within:text-[#D4AF37]">R$</span>
                            <input
                              type="number"
                              step="0.01"
                              value={costPrice}
                              onChange={(e) => setCostPrice(e.target.value)}
                              placeholder="0.00"
                              className="input-premium pl-10 w-full"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-wider">Preço de Venda <span className="text-red-400">*</span></label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-mono focus-within:text-[#D4AF37]">R$</span>
                            <input
                              type="number"
                              step="0.01"
                              required
                              value={salePrice}
                              onChange={(e) => setSalePrice(e.target.value)}
                              placeholder="0.00"
                              className="input-premium pl-10 w-full"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Stock */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Estoque Atual <span className="text-red-400">*</span></label>
                        <input
                          type="number"
                          required
                          value={stock}
                          onChange={(e) => setStock(e.target.value)}
                          placeholder="Quantidade em UN"
                          className="input-premium w-full font-mono text-lg"
                        />
                      </div>

                      {/* Barcode */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Código de Barras</label>
                        <input
                          type="text"
                          value={barcode}
                          onChange={(e) => setBarcode(e.target.value)}
                          placeholder="EAN / GTIN"
                          className="input-premium w-full font-mono"
                        />
                      </div>

                      <div className="rounded bg-[#1E1E1E] border border-white/5 p-4 flex flex-col justify-center mt-2">
                         <p className="text-[9px] uppercase tracking-wider text-gray-500 flex items-center gap-1"><AlertCircle className="w-3 h-3 text-[#D4AF37]" /> Dica de Cadastro</p>
                         <p className="text-xs text-gray-400 mt-1">Produtos com estoque zerado receberão o selo de esgotado no catálogo e listarão alerta no dashboard.</p>
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
                      {editingId ? 'Salvar Edição' : 'Concluir Cadastro'}
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
