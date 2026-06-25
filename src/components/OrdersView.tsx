import React, { useState } from 'react';
import { Order } from '../types';
import { 
  ShoppingBag, Search, CheckCircle, Clock, Truck, XCircle, ChevronRight, MapPin
} from 'lucide-react';
import { PedidosService } from '../services';

interface OrdersViewProps {
  orders: Order[];
}

export default function OrdersView({ orders }: OrdersViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const sortedOrders = [...orders].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  const filteredOrders = sortedOrders.filter(o => 
    (o.id || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
    (o.clientName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusInfo = (status: string) => {
    switch(status) {
      case 'recebido': return { label: 'Recebido', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30', icon: Clock };
      case 'preparando': return { label: 'Em Separação', color: 'text-indigo-400', bg: 'bg-indigo-400/10', border: 'border-indigo-400/30', icon: ShoppingBag };
      case 'saiu_entrega': return { label: 'Saiu para Entrega', color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/30', icon: Truck };
      case 'entregue': return { label: 'Entregue', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: CheckCircle };
      case 'cancelado': return { label: 'Cancelado', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/30', icon: XCircle };
      default: return { label: 'Desconhecido', color: 'text-gray-500', bg: 'bg-gray-500/10', border: 'border-gray-500/30', icon: Clock };
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: Order['status']) => {
    try {
      await PedidosService.update(id, { status: newStatus });
    } catch(err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-3xl font-serif italic text-white flex items-center gap-3">
             <ShoppingBag className="w-8 h-8 text-[#D4AF37]" />
             Pedidos Delivery
          </h1>
          <p className="text-gray-500 text-xs w-full uppercase tracking-widest mt-1">Gerencie a expedição e entrega</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text"
              placeholder="Buscar pedido ou cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#1E1E1E] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white text-sm focus:outline-none focus:border-[#D4AF37]/50"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredOrders.length === 0 ? (
          <div className="p-8 text-center text-gray-500 border border-white/5 rounded-xl bg-[#1E1E1E]">Nenhum pedido encontrado.</div>
        ) : (
          filteredOrders.map(order => {
            const Info = getStatusInfo(order.status);
            const Ico = Info.icon;
            
            return (
              <div key={order.id} className="bg-[#1E1E1E] border border-white/5 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-[#D4AF37]/30 transition-colors">
                <div className="flex-1 space-y-4">
                   <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl border ${Info.bg} ${Info.border} ${Info.color}`}>
                        <Ico className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                           <p className="text-lg font-bold text-white">#{(order.id || '').slice(-6).toUpperCase()}</p>
                           <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded font-bold ${Info.bg} ${Info.color} ${Info.border} border`}>
                             {Info.label}
                           </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{new Date(order.createdAt).toLocaleString('pt-BR')}</p>
                      </div>
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-4 p-4 bg-[#121212] rounded-xl border border-white/5">
                      <div>
                        <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-1">Cliente</p>
                        <p className="text-white font-medium">{order.clientName}</p>
                        <p className="text-gray-400">{order.clientPhone}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-1">Entrega</p>
                        <p className="text-white font-medium flex items-start gap-1">
                          <MapPin className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{order.deliveryAddress}</span>
                        </p>
                      </div>
                   </div>
                   
                   <div className="p-4 bg-[#121212] rounded-xl border border-white/5">
                      <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest mb-3">Itens do Pedido</p>
                      <div className="space-y-2">
                        {(order.items || []).map((item, idx) => (
                           <div key={idx} className="flex justify-between items-center text-xs">
                             <div className="flex items-center gap-2">
                                <span className="text-gray-500 font-mono">{item.quantity}x</span>
                                <span className="text-gray-300">{item.name}</span>
                             </div>
                             <span className="text-gray-400 font-mono">
                                R$ {item.price.toFixed(2)}
                             </span>
                           </div>
                        ))}
                      </div>
                      <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center">
                         <span className="text-xs text-gray-500 font-bold uppercase tracking-widest">Total</span>
                         <span className="text-lg font-mono text-[#D4AF37] font-bold">R$ {order.total.toFixed(2)}</span>
                      </div>
                   </div>
                </div>

                <div className="shrink-0 flex flex-col gap-2 min-w-[200px]">
                  <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-1 text-center">Ações</p>
                  
                  {order.status === 'recebido' && (
                    <button onClick={() => handleUpdateStatus(order.id, 'preparando')} className="w-full bg-indigo-500/20 hover:bg-indigo-500/40 text-indigo-300 border border-indigo-500/30 text-xs font-bold uppercase py-3 rounded-lg transition-colors">
                      Iniciar Separação
                    </button>
                  )}
                  {order.status === 'preparando' && (
                    <button onClick={() => handleUpdateStatus(order.id, 'saiu_entrega')} className="w-full bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 border border-blue-500/30 text-xs font-bold uppercase py-3 rounded-lg transition-colors">
                      Saiu Para Entrega
                    </button>
                  )}
                  {order.status === 'saiu_entrega' && (
                    <button onClick={() => handleUpdateStatus(order.id, 'entregue')} className="w-full bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase py-3 rounded-lg transition-colors">
                      Marcar como Entregue
                    </button>
                  )}
                  {order.status !== 'cancelado' && order.status !== 'entregue' && (
                    <button onClick={() => { if(confirm('Cancelar pedido?')) handleUpdateStatus(order.id, 'cancelado') }} className="w-full mt-2 text-red-500 text-[10px] uppercase font-bold py-2 hover:bg-red-500/10 rounded-lg transition-colors">
                      Cancelar Pedido
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
