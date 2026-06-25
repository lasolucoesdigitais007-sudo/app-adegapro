/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product, Client, Coupon, Promotion, Campaign, Sale, CellarConfig } from '../types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Brunello di Montalcino DOCG 2018',
    category: 'Vinhos',
    brand: 'Castello Banfi',
    description: 'Vinho Tinto Seco encorpado.',
    costPrice: 420.00,
    salePrice: 689.90,
    stock: 14,
    minStock: 5,
    status: 'active',
    barcode: '7891234567891',
    image: 'https://images.unsplash.com/photo-1585553616435-2dc0a54e271d?auto=format&fit=crop&q=80&w=600',
    sku: 'VIN-RED-BRU-018'
  },
  {
    id: 'prod-2',
    name: 'Cabernet Sauvignon Reserva Especial',
    category: 'Vinhos',
    brand: 'Casillero del Diablo',
    description: 'Vinho Tinto Seco chileno famoso mundialmente.',
    costPrice: 42.00,
    salePrice: 79.90,
    stock: 45,
    minStock: 10,
    status: 'active',
    barcode: '7891234567892',
    image: 'https://images.unsplash.com/photo-1563514251147-7b8971fcebc9?auto=format&fit=crop&q=80&w=600',
    sku: 'VIN-RED-CAB-021'
  },
  {
    id: 'prod-3',
    name: 'Alvarinho Granit Monção e Melgaço',
    category: 'Vinhos',
    brand: 'Soalheiro',
    description: 'Vinho Branco Seco com mineralidade elegante.',
    costPrice: 110.00,
    salePrice: 189.00,
    stock: 8,
    minStock: 4,
    status: 'active',
    barcode: '7891234567893',
    sku: 'VIN-WHT-ALV-022'
  },
  {
    id: 'prod-4',
    name: 'Champagne Veuve Clicquot Brut',
    category: 'Vinhos',
    brand: 'Veuve Clicquot',
    costPrice: 310.00,
    salePrice: 539.90,
    stock: 18,
    minStock: 3,
    status: 'active',
    barcode: '7891234567894',
    sku: 'ESP-FRA-VEU-001'
  },
  {
    id: 'prod-5',
    name: 'Espumante Chandon Passion Rosé Demi-Sec',
    category: 'Vinhos',
    brand: 'Chandon Brasil',
    costPrice: 65.00,
    salePrice: 109.90,
    stock: 32,
    minStock: 8,
    status: 'active',
    sku: 'ESP-BRA-CHA-PAS'
  },
  {
    id: 'prod-6',
    name: 'Cerveja Baden Baden IPA Maracujá 600ml',
    category: 'Cerveja',
    brand: 'Baden Baden',
    costPrice: 11.50,
    salePrice: 19.90,
    stock: 120,
    minStock: 15,
    status: 'active',
    sku: 'CER-IPA-BAD-MAR'
  },
  {
    id: 'prod-7',
    name: 'Cerveja Colorado Indica Imperial IPA 600ml',
    category: 'Cerveja',
    brand: 'Colorado',
    costPrice: 10.80,
    salePrice: 18.50,
    stock: 4, // Low stock!
    minStock: 10,
    status: 'active',
    sku: 'CER-IPA-COL-IND'
  },
  {
    id: 'prod-8',
    name: 'Whisky Johnnie Walker Black Label 12 Anos',
    category: 'Whisky',
    brand: 'Diageo',
    costPrice: 115.00,
    salePrice: 189.90,
    stock: 22,
    minStock: 5,
    status: 'active',
    sku: 'DES-WHI-JWB-12Y'
  },
  {
    id: 'prod-9',
    name: 'Gin Hendrick’s Premium Escocês 750ml',
    category: 'Gin',
    brand: 'William Grant & Sons',
    costPrice: 160.00,
    salePrice: 269.00,
    stock: 0, // Out of stock
    minStock: 5,
    status: 'out_of_stock',
    sku: 'DES-GIN-HEN-750'
  }
];

export const INITIAL_CLIENTS: Client[] = [
  {
    id: 'cli-1',
    name: 'Carlos Eduardo Silva',
    email: 'carlos.eduardo@gmail.com',
    phone: '(11) 98122-4455',
    whatsapp: '(11) 98122-4455',
    city: 'São Paulo',
    favoriteCategory: 'Vinhos',
    totalSpent: 1249.80,
    ordersCount: 4,
    registrationDate: '2026-02-12',
    lastPurchaseDate: '2026-06-12',
    status: 'vip',
    notes: 'Prefere vinhos encorpados da uva Malbec ou Cabernet.',
    loyaltyPoints: 1249,
    loyaltyTotalEarned: 1249,
    loyaltyTotalRedeemed: 0
  },
  {
    id: 'cli-2',
    name: 'Mariana Santos Oliveira',
    email: 'mari.santos@outlook.com',
    phone: '(21) 97321-1199',
    whatsapp: '(21) 97321-1199',
    city: 'Rio de Janeiro',
    favoriteCategory: 'Vinhos',
    totalSpent: 2159.60,
    ordersCount: 5,
    registrationDate: '2026-01-15',
    lastPurchaseDate: '2026-06-18',
    status: 'vip',
    notes: 'Comprou Veuve Clicquot para aniversário.',
    loyaltyPoints: 1159,
    loyaltyTotalEarned: 2159,
    loyaltyTotalRedeemed: 1000
  },
  {
    id: 'cli-3',
    name: 'Thiago Ramos Medeiros',
    email: 'thiago.medeiros@hotmail.com',
    phone: '(11) 99876-0044',
    whatsapp: '(11) 99876-0044',
    city: 'Osasco',
    favoriteCategory: 'Cerveja',
    totalSpent: 428.40,
    ordersCount: 8,
    registrationDate: '2026-03-20',
    lastPurchaseDate: '2026-06-15',
    status: 'recorrente',
    notes: 'Assinante do clube de cervejas regional.',
    loyaltyPoints: 428,
    loyaltyTotalEarned: 428,
    loyaltyTotalRedeemed: 0
  },
  {
    id: 'cli-4',
    name: 'Fernanda Costa Souza',
    email: 'fernanda.costa@yahoo.com',
    phone: '(31) 98455-8833',
    whatsapp: '(31) 98455-8833',
    city: 'Belo Horizonte',
    favoriteCategory: 'Vinhos',
    totalSpent: 5756.00,
    ordersCount: 15,
    registrationDate: '2025-04-02',
    lastPurchaseDate: '2026-05-30',
    status: 'recorrente',
    notes: 'Gosta de vinhos com leveza e frescor, uvas Alvarinho e Sauvignon Blanc.',
    loyaltyPoints: 2756,
    loyaltyTotalEarned: 5756,
    loyaltyTotalRedeemed: 3000
  },
  {
    id: 'cli-5',
    name: 'Juliana Dias Ribeiro',
    email: 'juliana.ribeiro@gmail.com',
    phone: '(11) 97411-2020',
    whatsapp: '(11) 97411-2020',
    city: 'São Paulo',
    favoriteCategory: 'Gin',
    totalSpent: 12538.00,
    ordersCount: 22,
    registrationDate: '2024-06-18',
    lastPurchaseDate: '2026-06-20',
    status: 'novo',
    notes: 'Foco em Coquetelaria. Compra Gin Hendrick’s e licores.',
    loyaltyPoints: 8538,
    loyaltyTotalEarned: 12538,
    loyaltyTotalRedeemed: 4000
  }
];

export const INITIAL_COUPONS: Coupon[] = [
  {
    id: 'coup-1',
    code: 'BEMVINDO10',
    discountType: 'percentage',
    discountValue: 10,
    minOrderValue: 0,
    expiryDate: '2026-12-31',
    active: true,
    usageLimit: 100,
    usageCount: 42,
    type: 'primeira_compra'
  },
  {
    id: 'coup-2',
    code: 'VIP15',
    discountType: 'percentage',
    discountValue: 15,
    minOrderValue: 0,
    expiryDate: '2026-12-31',
    active: true,
    usageLimit: 50,
    usageCount: 18,
    type: 'vip'
  },
  {
    id: 'coup-3',
    code: 'NIVER20',
    discountType: 'percentage',
    discountValue: 20,
    minOrderValue: 0,
    expiryDate: '2026-07-31',
    active: true,
    usageLimit: 30,
    usageCount: 12,
    type: 'aniversariante'
  },
  {
    id: 'coup-4',
    code: 'ESPECIAL8',
    discountType: 'percentage',
    discountValue: 8,
    minOrderValue: 0,
    expiryDate: '2026-06-25',
    active: true,
    usageLimit: 200,
    usageCount: 156,
    type: 'promocao_especial'
  }
];

export const INITIAL_PROMOTIONS: Promotion[] = [
  {
    id: 'promo-1',
    name: 'Especial Dia dos Namorados',
    productId: 'prod-5',
    productName: 'Espumante Chandon Passion Rosé Demi-Sec',
    discountPercentage: 15,
    description: 'Especial Dia dos Namorados & Festas. Celebre com quem você ama.',
    startDate: '2026-06-01',
    endDate: '2026-06-30',
    active: true,
    views: 450,
    clicks: 128,
    couponsUsed: 35
  },
  {
    id: 'promo-2',
    name: 'Festival de Inverno',
    productId: 'prod-2',
    productName: 'Cabernet Sauvignon Reserva Especial',
    discountPercentage: 10,
    description: 'Festival de Vinhos de Inverno. Aqueça suas noites.',
    startDate: '2026-06-15',
    endDate: '2026-07-15',
    active: true,
    views: 890,
    clicks: 340,
    couponsUsed: 80
  }
];

export const INITIAL_CAMPAIGNS: Campaign[] = [
  {
    id: 'camp-1',
    title: 'Festival de Tintos de Inverno 🍷',
    targetAudience: 'all',
    channel: 'email',
    message: 'Olá {cliente}, preparamos uma seleção formidável de vinhos tintos encorpados com até 15% OFF para este inverno.',
    status: 'sent',
    sentCount: 520,
    deliveredCount: 508,
    clickedCount: 204,
    sentDate: '2026-06-10 14:30'
  },
  {
    id: 'camp-2',
    title: 'Oferta Especial: Chandon 🎉',
    targetAudience: 'vip',
    channel: 'whatsapp',
    message: 'Olá, {cliente}! Chandon Passion Demi-Sec está com desconto especial esta semana! Garanta o seu.',
    status: 'draft',
    sentCount: 0,
    deliveredCount: 0,
    clickedCount: 0
  },
  {
    id: 'camp-3',
    title: 'Feliz Aniversário! 🎁',
    targetAudience: 'birthdays',
    channel: 'sms',
    message: 'Fala {cliente}, parabéns! Temos um presente especial para o seu dia. Clica no link e veja!',
    status: 'sent',
    sentCount: 34,
    deliveredCount: 33,
    clickedCount: 15,
    sentDate: '2026-06-18 10:15'
  }
];

export const INITIAL_SALES: Sale[] = [
  // Jan 2026
  { id: 'sale-1', date: '2026-01-10', productId: 'prod-1', productName: 'Brunello di Montalcino DOCG 2018', category: 'Vinho Tinto', quantity: 1, unitPrice: 689.90, discountAmount: 0, total: 689.90, clientName: 'Carlos Eduardo Silva' },
  { id: 'sale-2', date: '2026-01-20', productId: 'prod-4', productName: 'Champagne Veuve Clicquot Brut', category: 'Espumante', quantity: 2, unitPrice: 539.90, discountAmount: 50.00, total: 1029.80, clientName: 'Mariana Santos Oliveira' },
  { id: 'sale-3', date: '2026-01-25', productId: 'prod-6', productName: 'Cerveja Baden Baden IPA Maracujá 600ml', category: 'Cerveja', quantity: 10, unitPrice: 19.90, discountAmount: 0, total: 199.00 },
  
  // Feb 2026
  { id: 'sale-4', date: '2026-02-05', productId: 'prod-5', productName: 'Espumante Chandon Passion Rosé Demi-Sec', category: 'Espumante', quantity: 4, unitPrice: 109.90, discountAmount: 43.96, total: 395.64 },
  { id: 'sale-5', date: '2026-02-14', productId: 'prod-8', productName: 'Whisky Johnnie Walker Black Label 12 Anos', category: 'Destilado', quantity: 2, unitPrice: 189.90, discountAmount: 0, total: 379.80 },
  { id: 'sale-6', date: '2026-02-22', productId: 'prod-3', productName: 'Alvarinho Granit Monção e Melgaço', category: 'Vinho Branco', quantity: 2, unitPrice: 189.00, discountAmount: 20.00, total: 358.00, clientName: 'Fernanda Costa Souza' },

  // Mar 2026
  { id: 'sale-7', date: '2026-03-08', productId: 'prod-2', productName: 'Cabernet Sauvignon Reserva Especial', category: 'Vinho Tinto', quantity: 6, unitPrice: 79.90, discountAmount: 0, total: 479.40 },
  { id: 'sale-8', date: '2026-03-12', productId: 'prod-6', productName: 'Cerveja Baden Baden IPA Maracujá 600ml', category: 'Cerveja', quantity: 12, unitPrice: 19.90, discountAmount: 19.90, total: 218.90, clientName: 'Thiago Ramos Medeiros' },
  { id: 'sale-9', date: '2026-03-25', productId: 'prod-1', productName: 'Brunello di Montalcino DOCG 2018', category: 'Vinho Tinto', quantity: 2, unitPrice: 689.90, discountAmount: 137.98, total: 1241.82 },

  // Apr 2026
  { id: 'sale-10', date: '2026-04-10', productId: 'prod-4', productName: 'Champagne Veuve Clicquot Brut', category: 'Espumante', quantity: 1, unitPrice: 539.90, discountAmount: 0, total: 539.90 },
  { id: 'sale-11', date: '2026-04-20', productId: 'prod-3', productName: 'Alvarinho Granit Monção e Melgaço', category: 'Vinho Branco', quantity: 3, unitPrice: 189.00, discountAmount: 0, total: 567.00 },
  
  // May 2026
  { id: 'sale-12', date: '2026-05-02', productId: 'prod-8', productName: 'Whisky Johnnie Walker Black Label 12 Anos', category: 'Destilado', quantity: 1, unitPrice: 189.90, discountAmount: 0, total: 189.90 },
  { id: 'sale-13', date: '2026-05-15', productId: 'prod-2', productName: 'Cabernet Sauvignon Reserva Especial', category: 'Vinho Tinto', quantity: 3, unitPrice: 79.90, discountAmount: 0, total: 239.70 },
  { id: 'sale-14', date: '2026-05-28', productId: 'prod-5', productName: 'Espumante Chandon Passion Rosé Demi-Sec', category: 'Espumante', quantity: 6, unitPrice: 109.90, discountAmount: 65.94, total: 593.46, clientName: 'Mariana Santos Oliveira' },

  // Jun 2026 (Mês Atual)
  { id: 'sale-15', date: '2026-06-02', productId: 'prod-6', productName: 'Cerveja Baden Baden IPA Maracujá 600ml', category: 'Cerveja', quantity: 24, unitPrice: 19.90, discountAmount: 47.76, total: 429.84, clientName: 'Thiago Ramos Medeiros' },
  { id: 'sale-16', date: '2026-06-08', productId: 'prod-8', productName: 'Whisky Johnnie Walker Black Label 12 Anos', category: 'Destilado', quantity: 3, unitPrice: 189.90, discountAmount: 50.00, total: 519.70, clientName: 'Juliana Dias Ribeiro' },
  { id: 'sale-17', date: '2026-06-12', productId: 'prod-1', productName: 'Brunello di Montalcino DOCG 2018', category: 'Vinho Tinto', quantity: 1, unitPrice: 689.90, discountAmount: 68.99, total: 620.91, clientName: 'Carlos Eduardo Silva' },
  { id: 'sale-18', date: '2026-06-15', productId: 'prod-5', productName: 'Espumante Chandon Passion Rosé Demi-Sec', category: 'Espumante', quantity: 2, unitPrice: 109.90, discountAmount: 15.00, total: 204.80, clientName: 'Mariana Santos Oliveira' },
  { id: 'sale-19', date: '2026-06-18', productId: 'prod-2', productName: 'Cabernet Sauvignon Reserva Especial', category: 'Vinho Tinto', quantity: 5, unitPrice: 79.90, discountAmount: 39.95, total: 359.55 },
  { id: 'sale-20', date: '2026-06-19', productId: 'prod-4', productName: 'Champagne Veuve Clicquot Brut', category: 'Espumante', quantity: 1, unitPrice: 539.90, discountAmount: 0, total: 539.90, clientName: 'Mariana Santos Oliveira' }
];

export const DEFAULT_CONFIG: CellarConfig = {
  name: 'Minha Nova Adega',
  cnpj: '',
  phone: '',
  address: '',
  email: '',
  currency: 'R$',
  whatsappTemplate: 'Olá {cliente}! Tudo bem? Veja as novidades e ofertas na *{adega}*: {mensagem} 🍷 Clique aqui para fazer seu pedido pelo WhatsApp!',
  deliveryTaxa: 0.00,
  deliveryRaio: 0,
  deliveryTempo: '',
  acceptedPayments: ['pix', 'cartao_credito', 'cartao_debito', 'dinheiro'],
  pixKey: ''
};
