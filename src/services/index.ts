import { FirebaseService } from './FirebaseService';
import { Product, Client, Promotion, Coupon, Campaign, Order, Favorite } from '../types';

export interface Usuario {
  id: string;
  email: string;
  role: string;
  profileId?: string; // If role=cliente, maybe point to clients ID
  createdAt: string;
}

export const UsuariosService = new FirebaseService<Usuario>('usuarios');
export const ProdutosService = new FirebaseService<Product>('produtos');
export const ClientesService = new FirebaseService<Client>('clientes');
export const PromocoesService = new FirebaseService<Promotion>('promocoes');
export const CuponsService = new FirebaseService<Coupon>('cupons');
export const CampanhasService = new FirebaseService<Campaign>('campanhas');
export const PedidosService = new FirebaseService<Order>('pedidos');
export const FavoritosService = new FirebaseService<Favorite>('favoritos');
