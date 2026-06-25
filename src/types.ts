/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Product {
  id: string;
  empresaId?: string;
  name: string;
  category: string; // "Vinhos" | "Whisky" | "Gin" | "Vodka" | "Cerveja" | "Energéticos" | "Refrigerantes" | "Snacks"
  brand?: string; // Marca
  description?: string; // Descrição
  costPrice: number;
  salePrice: number;
  stock: number;
  minStock: number; // For low stock alerts
  image?: string; // Foto
  barcode?: string; // Código de barras
  status: 'active' | 'out_of_stock' | 'draft';
  sku?: string;
}

export interface Client {
  id: string;
  empresaId?: string;
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  birthday?: string;
  city: string;
  favoriteCategory: string;
  totalSpent: number;
  ordersCount: number;
  registrationDate: string;
  lastPurchaseDate?: string;
  status: 'novo' | 'recorrente' | 'vip';
  notes?: string;
  loyaltyPoints?: number;
  loyaltyTotalEarned?: number;
  loyaltyTotalRedeemed?: number;
}

export interface Coupon {
  id: string;
  empresaId?: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderValue: number;
  expiryDate: string;
  active: boolean;
  usageLimit: number;
  usageCount: number;
  type: 'primeira_compra' | 'vip' | 'aniversariante' | 'promocao_especial';
}

export interface Promotion {
  id: string;
  empresaId?: string;
  name: string;
  productId: string;
  productName: string; // can be useful or we can fetch from products
  discountPercentage: number;
  description: string;
  startDate: string;
  endDate: string;
  active: boolean;
  views: number;
  clicks: number;
  couponsUsed: number;
}

export interface Campaign {
  id: string;
  empresaId?: string;
  title: string;
  targetAudience: 'all' | 'vip' | 'birthdays' | 'inactive';
  channel: 'whatsapp' | 'email' | 'sms';
  message: string;
  promotionId?: string;
  status: 'draft' | 'sending' | 'sent';
  sentCount: number;
  deliveredCount: number;
  clickedCount: number;
  sentDate?: string;
}

export interface Sale {
  id: string;
  empresaId?: string;
  date: string; // YYYY-MM-DD
  productId: string;
  productName: string;
  category: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  total: number;
  clientName?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface Order {
  id: string;
  empresaId?: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  status: 'recebido' | 'preparando' | 'saiu_entrega' | 'entregue' | 'cancelado';
  paymentMethod: 'pix' | 'cartao_credito' | 'cartao_debito' | 'mercado_pago' | 'dinheiro';
  deliveryAddress: string;
  createdAt: string;
}

export interface DeliverySettings {
  taxa: number; // in BRL
  raio: number; // in kM
  tempoEstimado: string; // Ex: '30-45'
}

export interface Favorite {
  id: string;
  empresaId?: string;
  clientId: string;
  productId: string;
}

export interface CellarConfig {
  id?: string; // matches tenant id
  empresaId?: string;
  name: string;
  cnpj: string;
  phone: string;
  address: string;
  email: string;
  currency: string;
  whatsappTemplate: string;
  deliveryTaxa: number;
  deliveryRaio: number;
  deliveryTempo: string;
  acceptedPayments?: string[];
  pixKey?: string;
  ownerUid?: string;
}
