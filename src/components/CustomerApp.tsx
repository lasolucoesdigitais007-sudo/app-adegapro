import React, { useState, useEffect } from 'react';
import { Product, CellarConfig, Order, OrderItem, Client, Coupon } from '../types';
import { 
  Search, ShoppingCart, Star, Heart, X, Plus, Minus, CreditCard, Wallet, QrCode, MapPin, CheckCircle, Smartphone, Truck, ShieldCheck, Tag, Wine, LogOut, User, Sparkles, Clock, Shield, Phone, Mail, ArrowRight, Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ProdutosService, PedidosService, ClientesService } from '../services';
import { collection, onSnapshot, doc, query, where, getDocs, setDoc } from 'firebase/firestore';
import { DEFAULT_CONFIG } from '../data/initialData';
import { useAuth } from '../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '../config/firebase';
import { Navigate } from 'react-router-dom';
import Login from './Login';

const BANNER_URLS = [
  "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=2070&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1563223771-47eb0e6a4b11?q=80&w=2070&auto=format&fit=crop",
];

const CATEGORIES = [
  "Todos", "Vinhos", "Whisky", "Gin", "Vodka", "Cervejas", "Energéticos", "Refrigerantes", "Petiscos"
];

interface CustomerAppProps {
  config: CellarConfig;
}

export default function CustomerApp({ config }: CustomerAppProps) {
  const { user, loading, logOut, signInWithGoogle, role: authRole, empresaId: adminEmpresaId } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [userOrders, setUserOrders] = useState<Order[]>([]);

  const [adegasList, setAdegasList] = useState<CellarConfig[]>([]);
  const [activeEmpresaId, setActiveEmpresaId] = useState<string>('');
  const [currentConfig, setCurrentConfig] = useState<CellarConfig | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [searchQuery, setSearchQuery] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<{product: Product, quantity: number}[]>([]);
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'address' | 'payment' | 'success'>('cart');
  const [couponsList, setCouponsList] = useState<Coupon[]>([]);

  const [isAdegaSelected, setIsAdegaSelected] = useState<boolean>(() => {
    return !!sessionStorage.getItem('adega_selected_id');
  });
  const [adegaSearchQuery, setAdegaSearchQuery] = useState('');

  const [userCoords, setUserCoords] = useState<{lat: number, lng: number} | null>(null);
  const [geolocating, setGeolocating] = useState(false);

  const getAdegaCoordinates = (adega: CellarConfig) => {
    const hash = adega.empresaId ? adega.empresaId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 0;
    const baseLat = -23.5505; // São Paulo center as standard baseline coordinate
    const baseLng = -46.6333;
    const latOffset = ((hash % 100) - 50) / 1000;
    const lngOffset = (((hash * 17) % 100) - 50) / 1000;
    return { lat: baseLat + latOffset, lng: baseLng + lngOffset };
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      alert("Seu navegador não suporta geolocalização.");
      return;
    }
    setGeolocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserCoords({ lat: latitude, lng: longitude });
        
        const sorted = [...adegasList].map(adega => {
          const adegaCoords = getAdegaCoordinates(adega);
          const distance = calculateDistance(latitude, longitude, adegaCoords.lat, adegaCoords.lng);
          return {
            ...adega,
            distance
          };
        }).sort((a, b) => a.distance - b.distance);
        
        setGeolocating(false);
        if (sorted.length > 0) {
          setActiveEmpresaId(sorted[0].empresaId || '');
          setCurrentConfig(sorted[0]);
          alert(`Excelente! Encontramos as adegas em sua região. A mais próxima é "${sorted[0].name}" a ~${sorted[0].distance.toFixed(1)} km.`);
        }
      },
      (error) => {
        console.error(error);
        setGeolocating(false);
        alert("Não foi possível obter sua localização. Por favor, verifique se a permissão de geolocalização está ativa no seu navegador.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Load customer specific orders if authenticated
  useEffect(() => {
    if (!user) {
      setUserOrders([]);
      return;
    }
    const q = query(
      collection(db, 'pedidos'),
      where('clientId', '==', user.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      setUserOrders(snap.docs.map(d => ({ id: d.id, items: [], ...d.data() } as Order)));
    }, (error) => {
      console.error("Error loading customer orders: ", error);
      handleFirestoreError(error, OperationType.LIST, 'pedidos');
    });
    return () => unsub();
  }, [user]);

  // Checkout Form
  const [checkoutData, setCheckoutData] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    method: 'pix' as 'pix' | 'cartao_credito' | 'cartao_debito' | 'mercado_pago'
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    address: '',
    city: ''
  });

  // Pre-fill user data in checkout when logged in & load client profile from Firestore
  useEffect(() => {
    if (!user) {
      setCheckoutData(prev => ({ ...prev, name: '', phone: '', address: '', city: '' }));
      return;
    }

    setCheckoutData(prev => ({
      ...prev,
      name: user.displayName || prev.name,
    }));

    // Fetch from Firestore collection 'clientes_perfis'
    const unsub = onSnapshot(doc(db, 'clientes_perfis', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCheckoutData(prev => ({
          ...prev,
          name: data.name || prev.name || user.displayName || '',
          phone: data.phone || prev.phone,
          address: data.address || prev.address,
          city: data.city || prev.city,
        }));
      }
    }, (error) => {
      console.error("Erro ao escutar dados do perfil do cliente:", error);
      handleFirestoreError(error, OperationType.GET, `clientes_perfis/${user.uid}`);
    });

    return () => unsub();
  }, [user]);

  // Sync profileForm state with checkoutData state
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: checkoutData.name || user.displayName || '',
        phone: checkoutData.phone || '',
        address: checkoutData.address || '',
        city: checkoutData.city || ''
      });
    }
  }, [user, checkoutData.name, checkoutData.phone, checkoutData.address, checkoutData.city]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    setProfileMessage(null);
    try {
      await setDoc(doc(db, 'clientes_perfis', user.uid), {
        name: profileForm.name,
        phone: profileForm.phone,
        address: profileForm.address,
        city: profileForm.city,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setCheckoutData(prev => ({
        ...prev,
        name: profileForm.name,
        phone: profileForm.phone,
        address: profileForm.address,
        city: profileForm.city
      }));

      setProfileMessage({ type: 'success', text: 'Configurações de perfil salvas com sucesso!' });
      
      // Clear message after 4s
      setTimeout(() => {
        setProfileMessage(null);
      }, 4000);
    } catch (err) {
      console.error(err);
      setProfileMessage({ type: 'error', text: 'Erro ao salvar as configurações.' });
      handleFirestoreError(err, OperationType.WRITE, `clientes_perfis/${user.uid}`);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleDetectProfileAddress = () => {
    if (!navigator.geolocation) {
      alert("Seu navegador não suporta geolocalização.");
      return;
    }
    setSavingProfile(true);
    setProfileMessage({ type: 'success', text: 'Obtendo sua localização pelo GPS...' });
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`, {
            headers: {
              'Accept-Language': 'pt-BR'
            }
          });
          if (response.ok) {
            const data = await response.json();
            if (data && data.address) {
              const addr = data.address;
              const street = addr.road || addr.street || addr.pedestrian || '';
              const number = addr.house_number || '';
              const neighborhood = addr.suburb || addr.neighbourhood || addr.city_district || '';
              const city = addr.city || addr.town || addr.village || addr.municipality || '';
              const state = addr.state || addr.state_code || '';

              let formattedAddress = '';
              if (street) {
                formattedAddress += street;
                if (number) formattedAddress += `, ${number}`;
                if (neighborhood) formattedAddress += ` - ${neighborhood}`;
              } else {
                formattedAddress = data.display_name || `Lat: ${latitude}, Lng: ${longitude}`;
              }

              const formattedCityState = city && state ? `${city} - ${state}` : city || state || '';

              setProfileForm(prev => ({
                ...prev,
                address: formattedAddress,
                city: formattedCityState
              }));
              
              setProfileMessage({ type: 'success', text: `Endereço localizado com sucesso! Coordenadas: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}` });
            } else {
              setProfileForm(prev => ({
                ...prev,
                address: `GPS: Lat ${latitude.toFixed(6)}, Lng ${longitude.toFixed(6)}`
              }));
              setProfileMessage({ type: 'success', text: `Localização obtida: Lat ${latitude.toFixed(4)}, Lng ${longitude.toFixed(4)}` });
            }
          } else {
            setProfileForm(prev => ({
              ...prev,
              address: `GPS: Lat ${latitude.toFixed(6)}, Lng ${longitude.toFixed(6)}`
            }));
            setProfileMessage({ type: 'success', text: `Localização obtida: Lat ${latitude.toFixed(4)}, Lng ${longitude.toFixed(4)}` });
          }
        } catch (err) {
          console.error("Erro ao converter coordenadas para endereço:", err);
          setProfileForm(prev => ({
            ...prev,
            address: `Coordenadas: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
          }));
          setProfileMessage({ type: 'success', text: `Coordenadas obtidas: Lat ${latitude.toFixed(4)}, Lng ${longitude.toFixed(4)}` });
        } finally {
          setSavingProfile(false);
        }
      },
      (error) => {
        console.error(error);
        setSavingProfile(false);
        setProfileMessage({ type: 'error', text: 'Permissão de geolocalização negada ou sinal indisponível.' });
        alert("Não foi possível obter sua localização. Por favor, verifique se a permissão de geolocalização está ativa no seu navegador.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  // Coupon support
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any | null>(null);
  const [couponError, setCouponError] = useState('');

  const handleApplyCoupon = async () => {
    setCouponError('');
    if (!couponCode) return;
    try {
      const q = query(
        collection(db, 'cupons'), 
        where('empresaId', '==', activeEmpresaId), 
        where('code', '==', couponCode.toUpperCase().trim())
      );
      const snap = await getDocs(q);
      if (snap.empty) {
        setCouponError('Cupom inválido ou expirado.');
        setAppliedCoupon(null);
      } else {
        const couponData = snap.docs[0].data();
        if (!couponData.active) {
          setCouponError('Este cupom está inativo.');
          setAppliedCoupon(null);
        } else {
          setAppliedCoupon({ id: snap.docs[0].id, ...couponData });
        }
      }
    } catch (e) {
      setCouponError('Erro ao validar o cupom.');
    }
  };

  const getDiscountAmount = () => {
    if (!appliedCoupon) return 0;
    const subtotal = getSubtotal();
    if (subtotal < appliedCoupon.minOrderValue) {
      return 0; // Under minimum
    }
    if (appliedCoupon.discountType === 'percentage') {
      return (subtotal * appliedCoupon.discountValue) / 100;
    } else {
      return Math.min(subtotal, appliedCoupon.discountValue);
    }
  };

  // Load all available multi-tenant configurations
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'configuracoes'), (snap) => {
      const list = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as CellarConfig))
        .filter(c => c.empresaId && !['imperial', 'executive', 'vip', 'default', 'empresa_default'].includes(c.empresaId));
      if (list.length > 0) {
        setAdegasList(list);
        
        let startEmpresa = activeEmpresaId;
        if (!startEmpresa) {
          const savedId = sessionStorage.getItem('adega_selected_id');
          if (authRole === 'admin' && adminEmpresaId) {
            startEmpresa = adminEmpresaId;
          } else if (savedId && list.some(a => a.empresaId === savedId)) {
            startEmpresa = savedId;
          } else {
            startEmpresa = list[0].empresaId;
          }
          setActiveEmpresaId(startEmpresa);
        }

        const hasActive = list.find(a => a.empresaId === startEmpresa);
        if (hasActive) {
          setCurrentConfig(hasActive);
        } else {
          setActiveEmpresaId(list[0].empresaId);
          setCurrentConfig(list[0]);
        }
      } else {
        setAdegasList([]);
        setCurrentConfig(null);
      }
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'configuracoes'));

    return () => unsub();
  }, [activeEmpresaId, authRole, adminEmpresaId]);

  useEffect(() => {
    let orderUnsub: any = null;
    if (placedOrder && checkoutStep === 'success') {
       orderUnsub = onSnapshot(doc(db, 'pedidos', placedOrder.id), (snap) => {
         if(snap.exists()) {
           setPlacedOrder(snap.data() as Order);
         }
       }, (error) => handleFirestoreError(error, OperationType.GET, `pedidos/${placedOrder.id}`));
    }
    return () => {
      if(orderUnsub) orderUnsub();
    };
  }, [placedOrder?.id, checkoutStep]);

  useEffect(() => {
    const q = query(collection(db, 'produtos'), where('empresaId', '==', activeEmpresaId));
    const unsub = onSnapshot(q, (snap) => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'produtos'));

    // Reset applied coupon when winery changes
    setAppliedCoupon(null);
    setCouponCode('');

    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          console.log('FCM Notification permission granted.');
        }
      });
    }

    return () => unsub();
  }, [activeEmpresaId]);

  useEffect(() => {
    const q = query(
      collection(db, 'cupons'), 
      where('empresaId', '==', activeEmpresaId),
      where('active', '==', true)
    );
    const unsub = onSnapshot(q, (snap) => {
      setCouponsList(snap.docs.map(d => ({ id: d.id, ...d.data() } as Coupon)));
    }, (error) => {
      console.error("Error loading coupons: ", error);
    });

    return () => unsub();
  }, [activeEmpresaId]);

  const filteredProducts = products.filter(p => {
    if (activeCategory !== "Todos" && p.category !== activeCategory) return false;
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const addToCart = (product: Product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
    setCartOpen(true);
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCartItems(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQ = item.quantity + delta;
          if (newQ <= 0) return null;
          return { ...item, quantity: newQ };
        }
        return item;
      }).filter(Boolean) as any;
    });
  };

  const getSubtotal = () => cartItems.reduce((acc, curr) => acc + (curr.product.salePrice * curr.quantity), 0);
  const getTotal = () => {
    const discount = getDiscountAmount();
    return Math.max(0, getSubtotal() - discount + (currentConfig?.deliveryTaxa || 0));
  };

  const handleCheckout = async () => {
    if (!checkoutData.name || !checkoutData.phone || !checkoutData.address || !checkoutData.city) {
      alert("Preencha todos os dados de entrega.");
      return;
    }

    try {
      const orderItems: OrderItem[] = cartItems.map(c => ({
        productId: c.product.id,
        name: c.product.name,
        price: c.product.salePrice,
        quantity: c.quantity,
        image: c.product.image
      }));

      const newOrder: Omit<Order, 'id'> = {
        empresaId: activeEmpresaId,
        clientId: user ? user.uid : 'convidado-' + Date.now(),
        clientName: checkoutData.name,
        clientPhone: checkoutData.phone,
        items: orderItems,
        subtotal: getSubtotal(),
        discount: getDiscountAmount(),
        deliveryFee: currentConfig?.deliveryTaxa || 0,
        total: getTotal(),
        status: 'recebido',
        paymentMethod: checkoutData.method,
        deliveryAddress: `${checkoutData.address}, ${checkoutData.city}`,
        createdAt: new Date().toISOString()
      };

      const docRef = await PedidosService.create(newOrder);

      // Save client lead to CRM & Campaigns database collection automatically
      const clientLead: Omit<Client, 'id'> = {
        empresaId: activeEmpresaId,
        name: checkoutData.name,
        email: '',
        phone: checkoutData.phone,
        whatsapp: checkoutData.phone,
        city: checkoutData.city,
        favoriteCategory: 'Todos',
        totalSpent: getTotal(),
        ordersCount: 1,
        registrationDate: new Date().toISOString(),
        status: 'novo'
      };
      
      await ClientesService.create(clientLead);

      setPlacedOrder(docRef);
      setCheckoutStep('success');
      setCartItems([]);
      
    } catch(err) {
      console.error(err);
      alert("Erro ao finalizar pedido.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <Wine className="w-10 h-10 text-[#D4AF37] animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (authRole === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  if (adegasList.length === 0) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(123,17,44,0.15)_0%,transparent_65%)] pointer-events-none" />
        <div className="max-w-md bg-[#121212]/95 border border-[#D4AF37]/20 rounded-2xl p-8 shadow-2xl relative z-10 backdrop-blur-md">
          <div className="w-16 h-16 bg-[#7B112C] rounded-full flex items-center justify-center border-2 border-[#D4AF37] mb-6 mx-auto shadow-[0_0_20px_rgba(212,175,55,0.25)]">
            <Wine className="w-8 h-8 text-[#D4AF37]" />
          </div>
          <h1 className="text-2xl font-serif italic text-white mb-3">Seja Bem-vindo ao AdegaPro</h1>
          <p className="text-[#D4AF37] text-[10px] uppercase tracking-widest font-bold mb-4">Catálogo Premium & Delivery</p>
          <p className="text-gray-400 text-xs leading-relaxed mb-6">
            Nenhuma adega foi cadastrada no banco de dados até o momento. Se você é o proprietário, acesse o painel de administrador para configurar seu estabelecimento e cadastrar seus produtos.
          </p>
          <button 
            onClick={async () => {
              await logOut();
            }}
            className="w-full bg-[#7B112C] hover:bg-[#921435] border border-[#D4AF37]/30 text-white font-bold tracking-wide text-xs py-3.5 rounded-xl transition duration-150 shadow-lg flex items-center justify-center gap-2 cursor-pointer uppercase"
          >
            Ir para Login Administrador
          </button>
        </div>
      </div>
    );
  }

  // If we should show the Selector Screen
  const bypassSelection = authRole === 'admin';
  const showChooser = !isAdegaSelected && !bypassSelection;

  if (showChooser) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white font-sans flex flex-col justify-between py-10 px-4 md:px-8 relative overflow-hidden" id="adega-selector-root">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#7B112C]/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-2xl mx-auto w-full z-10 flex-grow flex flex-col justify-center">
          {/* Header branding */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#7B112C]/20 border border-[#D4AF37]/40 mb-4 shadow-xl">
              <Star className="w-7 h-7 text-[#D4AF37] fill-[#D4AF37]/20" />
            </div>
            <h1 className="text-3xl md:text-4xl font-serif italic text-white leading-tight">
              Selecione uma Adega
            </h1>
            <p className="text-xs text-gray-400 mt-2 font-sans tracking-wide uppercase">
              Para ver produtos disponíveis e realizar seu pedido
            </p>
          </div>

          {/* Quick GPS search card */}
          <div className="bg-[#121212]/90 border border-[#D4AF37]/20 rounded-2xl p-5 mb-6 flex flex-col items-center justify-between gap-4 shadow-2xl relative">
            <div className="w-full flex items-center gap-3">
              <div className="w-10 h-10 bg-[#7B112C]/20 border border-[#D4AF37]/20 rounded-xl flex items-center justify-center text-[#D4AF37]">
                <MapPin className="w-5 h-5 animate-pulse" />
              </div>
              <div className="text-left flex-1">
                <h4 className="text-sm font-bold text-white">Trazer Adegas Próximas de Mim</h4>
                <p className="text-[11px] text-gray-400 mt-0.5">Clique para usar sua localização GPS e listar as mais perto primeiro.</p>
              </div>
              <button
                onClick={handleDetectLocation}
                disabled={geolocating}
                className="uppercase tracking-widest text-[10px] font-bold bg-[#D4AF37] hover:bg-[#ebd074] text-black px-4 py-2.5 rounded-xl transition duration-150 flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(212,175,55,0.2)] disabled:opacity-50 cursor-pointer"
              >
                {geolocating ? (
                  <>
                    <span className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    <span>Calculando...</span>
                  </>
                ) : (
                  <>
                    <MapPin className="w-3 h-3" />
                    <span>Usar Localização</span>
                  </>
                )}
              </button>
            </div>
            {userCoords && (
              <div className="w-full text-center border-t border-white/5 pt-2 text-[10px] text-[#D4AF37] font-mono leading-none tracking-wider uppercase">
                🏁 Latitude: {userCoords.lat.toFixed(4)} | Longitude: {userCoords.lng.toFixed(4)}
              </div>
            )}
          </div>

          {/* Search bar for filter */}
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-550" />
            </div>
            <input
              type="text"
              className="w-full bg-[#18181b] border border-white/10 text-white rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-[#D4AF37]/50 shadow-md"
              placeholder="Digite o nome da adega para buscar..."
              value={adegaSearchQuery}
              onChange={(e) => setAdegaSearchQuery(e.target.value)}
            />
          </div>

          {/* list container */}
          <div className="space-y-3.5 max-h-[400px] overflow-y-auto pr-1">
            {adegasList.length === 0 ? (
              <div className="p-8 text-center bg-white/5 border border-white/5 rounded-2xl text-gray-500 text-xs">
                Nenhuma adega cadastrada no sistema. Cadastre novas pelo Painel Administrativo.
              </div>
            ) : (
              adegasList
                .filter(adega => {
                  if (!adegaSearchQuery) return true;
                  return adega.name.toLowerCase().includes(adegaSearchQuery.toLowerCase());
                })
                .map(adega => {
                  const coords = getAdegaCoordinates(adega);
                  const distanceVal = userCoords ? calculateDistance(userCoords.lat, userCoords.lng, coords.lat, coords.lng) : null;
                  
                  return (
                    <div 
                      key={adega.empresaId} 
                      className="p-5 rounded-2xl bg-[#121212] border border-white/5 hover:border-[#D4AF37]/30 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl"
                    >
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <h3 className="font-serif italic text-[#D4AF37] text-lg font-bold font-serif">
                            {adega.name}
                          </h3>
                          {distanceVal !== null && (
                            <span className="text-[10px] text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded font-bold font-mono">
                              ⭐ {distanceVal.toFixed(1)} km
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-1.5 flex items-start gap-1">
                          <MapPin className="w-3.5 h-3.5 shrink-0 text-gray-500 mt-0.5" />
                          <span>{adega.address || 'Endereço Comercial não cadastrado.'}</span>
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          setActiveEmpresaId(adega.empresaId || '');
                          setCurrentConfig(adega);
                          sessionStorage.setItem('adega_selected_id', adega.empresaId || '');
                          setIsAdegaSelected(true);
                        }}
                        className="w-full sm:w-auto bg-[#7B112C] hover:bg-[#921435] border border-[#D4AF37]/30 text-white text-xs uppercase tracking-wider font-bold py-3 px-5 rounded-xl transition duration-150 shadow-md inline-flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>Entrar na Adega</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
            )}
          </div>
        </div>

        {/* Footer actions - always have a clear Sair/Logout option as requested! */}
        <div className="max-w-xl mx-auto w-full text-center mt-8 z-10">
          <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-500 font-sans">
              Logado como <strong className="text-gray-300 font-semibold">{user?.displayName || user?.email || 'Membro do Clube'}</strong>
            </p>
            <button 
              onClick={async () => {
                await logOut();
              }}
              className="px-4 py-2 bg-red-950/40 border border-red-500/20 rounded-xl hover:bg-red-900/40 text-red-500 hover:text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sair / Fazer Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans relative pb-24 lg:pb-0">
      {/* Admin Preview Top Banner */}
      {authRole === 'admin' && (
        <div className="bg-gradient-to-r from-[#7B112C] to-[#5a0c20] text-[#D4AF37] text-xs font-semibold py-2.5 px-6 flex flex-col sm:flex-row items-center justify-between gap-2 border-b border-[#D4AF37]/30 select-none">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#D4AF37]" />
            <span>Você está no **Modo de Visualização** da sua adega: <strong className="text-white">{currentConfig?.name || 'Carregando...'}</strong></span>
          </div>
          <a 
            href="/admin" 
            className="bg-[#D4AF37] hover:bg-[#c2a032] text-black font-bold uppercase tracking-widest text-[9px] px-3.5 py-1.5 rounded transition-all shadow-md"
          >
            Voltar para Painel de Controle
          </a>
        </div>
      )}
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#121212]/95 backdrop-blur-md border-b border-white/5 py-3 px-4 md:px-8 shadow-lg flex flex-col gap-3" id="customer-main-header">
         {/* Line 1: Logo & Compact Icons */}
         <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7B112C] to-black flex items-center justify-center border border-[#D4AF37]/30">
                <Star className="w-4.5 h-4.5 text-[#D4AF37] fill-[#D4AF37]" />
              </div>
              <h1 className="text-lg md:text-2xl font-serif italic text-white font-bold leading-none tracking-tight">
                {currentConfig?.name || 'Adega Delivery'}
              </h1>
            </div>
            
            {/* Actions: Compact elegant icons only to avoid horizontal clutter */}
            <div className="flex items-center gap-2">
              {user ? (
                <button 
                  onClick={() => setShowProfileDrawer(true)} 
                  className="w-9 h-9 rounded-xl bg-[#7B112C]/20 hover:bg-[#7B112C]/40 text-[#D4AF37] border border-[#D4AF37]/20 flex items-center justify-center transition-all cursor-pointer"
                  title="Configurações e Perfil"
                >
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || ''} className="w-5 h-5 rounded-full border border-[#D4AF37]" referrerPolicy="no-referrer" />
                  ) : (
                    <User className="w-4.5 h-4.5" />
                  )}
                </button>
              ) : (
                <button 
                  onClick={() => setShowLoginModal(true)} 
                  className="w-9 h-9 rounded-xl bg-white/5 hover:bg-[#7B112C]/30 text-gray-300 border border-white/10 flex items-center justify-center transition-all cursor-pointer"
                  title="Entrar"
                >
                  <User className="w-4.5 h-4.5" />
                </button>
              )}

              <button 
                onClick={() => setCartOpen(true)}
                className="w-9 h-9 rounded-xl bg-[#1E1E1E] hover:bg-white/10 text-white border border-white/10 flex items-center justify-center relative transition-all cursor-pointer"
                title="Carrinho"
              >
                <ShoppingCart className="w-4.5 h-4.5" />
                {cartItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#D4AF37] text-black text-[9px] w-4.5 h-4.5 flex items-center justify-center rounded-full font-bold shadow-md animate-bounce">
                    {cartItems.length}
                  </span>
                )}
              </button>

              <button 
                onClick={async () => {
                  await logOut();
                }}
                className="w-9 h-9 rounded-xl bg-red-950/30 hover:bg-red-900/40 text-red-400 hover:text-white border border-red-500/20 flex items-center justify-center transition-all cursor-pointer"
                title="Sair"
              >
                <LogOut className="w-4.5 h-4.5" />
              </button>
            </div>
         </div>

         {/* Line 2: Delivery Address Row */}
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-white/5 pt-2 w-full text-xs text-gray-400">
           <div className="flex items-center gap-2 cursor-pointer hover:text-white py-1 flex-1 min-w-0" onClick={() => setShowProfileDrawer(true)}>
             <MapPin className="w-4 h-4 text-[#7B112C] shrink-0" />
             <div className="truncate leading-tight">
               <span className="text-gray-500">Entregar em: </span>
               <strong className="text-white hover:underline truncate">{checkoutData.address || 'Definir endereço de entrega'}</strong>
               {checkoutData.city ? <span className="text-gray-400 text-[11px]">, {checkoutData.city}</span> : ''}
             </div>
           </div>
           
           <button 
             onClick={handleDetectLocation}
             disabled={geolocating}
             className="text-[10px] text-[#D4AF37] hover:text-white font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer bg-[#7B112C]/20 hover:bg-[#7B112C]/40 px-3 py-1.5 rounded-lg border border-[#D4AF37]/20 disabled:opacity-50 shrink-0 self-start sm:self-auto w-full sm:w-auto"
             title="Dectetar localização atual por GPS"
           >
             {geolocating ? 'Localizando...' : '🧭 Usar Meu GPS'}
           </button>
         </div>

         {/* Line 3: Adega Selection Row (Only shows if multiple adegas exist) */}
         {adegasList.length > 1 && (
           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-white/5 pt-2 w-full">
             <div className="flex items-center gap-2 text-xs text-gray-300 w-full sm:w-auto">
               <span className="text-[#D4AF37] font-mono font-bold text-[9px] uppercase tracking-wider bg-[#D4AF37]/10 px-1.5 py-0.5 rounded border border-[#D4AF37]/20 shrink-0">Adega Ativa</span>
               <select
                 value={activeEmpresaId}
                 onChange={(e) => {
                   const selectedVal = e.target.value;
                   setActiveEmpresaId(selectedVal);
                   const matching = adegasList.find(a => a.empresaId === selectedVal);
                   if (matching) {
                     setCurrentConfig(matching);
                     sessionStorage.setItem('adega_selected_id', selectedVal);
                   }
                 }}
                 className="bg-[#1E1E1E] text-white text-xs font-bold py-1 px-2 rounded-lg border border-white/10 focus:outline-none focus:border-[#D4AF37] cursor-pointer max-w-full flex-1 sm:flex-none"
               >
                 {adegasList.map(adega => {
                   const coords = getAdegaCoordinates(adega);
                   const distanceVal = userCoords ? calculateDistance(userCoords.lat, userCoords.lng, coords.lat, coords.lng) : null;
                   return (
                     <option key={adega.empresaId} value={adega.empresaId} className="bg-[#121212] text-white">
                       {adega.name} {distanceVal !== null ? `(${distanceVal.toFixed(1)} km)` : ''}
                     </option>
                   );
                 })}
               </select>
             </div>
             
             <button 
               onClick={() => {
                 sessionStorage.removeItem('adega_selected_id');
                 setIsAdegaSelected(false);
               }}
               className="text-[10px] text-gray-300 hover:text-[#D4AF37] hover:border-[#D4AF37]/40 font-bold uppercase tracking-wider bg-[#1E1E1E] border border-white/5 rounded-lg px-3 py-1.5 transition-all flex items-center justify-center gap-1 cursor-pointer w-full sm:w-auto"
               title="Mudar estabelecimento ativo"
             >
               Trocar de Adega 🔄
             </button>
           </div>
         )}
      </header>

      {/* Main Content: Organized in vertical flow with consistent 16px (gap-4 / space-y-4) spacing */}
      <main className="max-w-4xl mx-auto px-4 py-4 space-y-4">
        
        {/* Banner Section - Height strictly reduced to 180px for a clean, compact delivery look */}
        <div className="w-full overflow-hidden rounded-2xl relative h-[180px] shadow-xl border border-white/5">
           <img src={BANNER_URLS[0]} alt="Promoção da Semana" className="w-full h-full object-cover" />
           <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent flex flex-col justify-end p-5 text-left">
              <span className="text-[#D4AF37] font-extrabold uppercase tracking-widest text-[8px] bg-[#7B112C] px-2 py-0.5 rounded self-start mb-1.5 border border-[#D4AF37]/20">
                Especial da Semana
              </span>
              <h2 className="text-xl md:text-3xl font-serif italic text-white drop-shadow-md leading-tight font-bold">
                Descontos da Semana
              </h2>
              <p className="text-gray-300 text-xs mt-0.5 drop-shadow">
                Aproveite frete reduzido e vinhos exclusivos para o seu inverno
              </p>
           </div>
        </div>

        {/* Search Section - 100% mobile-friendly width */}
        <div className="w-full">
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="h-4.5 w-4.5 text-gray-400" />
            </div>
            <input
              type="text"
              className="w-full bg-[#121212] border border-white/10 text-white rounded-2xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:border-[#D4AF37]/50 placeholder-gray-500 shadow-md font-sans"
              placeholder="Pesquise sua bebida ou petisco..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Geolocation sorting card (rendered only if location is not detected yet, in elegant and clean mode) */}
        {!userCoords && (
          <div className="bg-[#121212] border border-[#7B112C]/20 rounded-2xl p-4 flex flex-col gap-3 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#7B112C]/20 border border-[#D4AF37]/20 rounded-xl flex items-center justify-center text-[#D4AF37] shrink-0">
                <MapPin className="w-4.5 h-4.5" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <h4 className="text-xs font-bold text-white">Adegas perto de você</h4>
                <p className="text-[11px] text-gray-400 leading-tight">Ordene o catálogo pelas adegas comerciais mais próximas da sua região.</p>
              </div>
            </div>
            
            <button
              onClick={handleDetectLocation}
              disabled={geolocating}
              className="w-full uppercase tracking-wider text-[10px] font-bold bg-[#7B112C] text-white py-2.5 rounded-xl transition duration-150 flex items-center justify-center gap-1.5 border border-[#D4AF37]/35 cursor-pointer disabled:opacity-50"
            >
              {geolocating ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Calculando...</span>
                </>
              ) : (
                <>
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Ativar Localização</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Categories Carousel - clean, non-obtrusive, easily scrollable on mobile */}
        <div className="w-full">
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">Categorias</p>
          <div className="flex overflow-x-auto custom-scrollbar gap-2 pb-2 -mx-1 px-1">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all border ${
                  activeCategory === cat 
                    ? 'bg-[#D4AF37] text-black border-[#D4AF37] shadow-[0_2px_8px_rgba(212,175,55,0.25)]' 
                    : 'bg-[#121212] text-gray-400 border-white/5 hover:border-white/20'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Products Section */}
        <div className="w-full">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-serif text-white italic font-bold">
              {activeCategory === "Todos" ? "Destaques do Catálogo" : activeCategory}
            </h3>
            <span className="text-[10px] text-gray-500 tracking-wider font-mono">
              {filteredProducts.length} itens encontrados
            </span>
          </div>
          
          {/* Menu Grid - 2 columns on mobile to follow Zé Delivery/iFood standard without horizontal compression */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5">
            {filteredProducts.map(product => {
              const isPromo = product.costPrice < product.salePrice && product.status === 'destaque';
              return (
                <div 
                  key={product.id} 
                  className="bg-[#121212] border border-white/5 rounded-2xl overflow-hidden hover:border-[#D4AF37]/35 transition-all flex flex-col justify-between shadow-lg relative group"
                >
                  {/* Image container */}
                  <div className="relative h-36 bg-gradient-to-b from-[#18181b] to-[#0d0d0d] flex items-center justify-center p-3">
                     {product.image ? (
                       <img src={product.image} alt={product.name} className="max-h-full max-w-full object-contain drop-shadow-lg group-hover:scale-105 transition-transform duration-300" />
                     ) : (
                       <div className="text-gray-600"><Wine className="w-10 h-10 opacity-30" /></div>
                     )}
                     
                     {isPromo && (
                       <span className="absolute top-2 left-2 bg-[#7B112C] text-white text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border border-[#D4AF37]/20">
                         Destaque
                       </span>
                     )}
                  </div>

                  {/* Info details */}
                  <div className="p-3 flex-1 flex flex-col justify-between gap-1.5">
                     <div className="text-left">
                       <span className="text-[8px] text-[#D4AF37] uppercase tracking-wider font-bold block mb-0.5">{product.category}</span>
                       <h4 className="text-xs font-bold text-gray-200 line-clamp-2 leading-tight min-h-[32px]">{product.name}</h4>
                       <p className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">{product.description || 'Fila do estoque premium'}</p>
                     </div>

                     {/* Price & Action row */}
                     <div className="mt-1 flex items-center justify-between border-t border-white/5 pt-2">
                       <div className="text-left">
                         <span className="text-[8px] text-gray-500 line-through block leading-none">
                           {isPromo ? `R$ ${(product.salePrice * 1.15).toFixed(2)}` : ''}
                         </span>
                         <span className="text-sm font-mono font-bold text-[#D4AF37]">
                           R$ {product.salePrice.toFixed(2)}
                         </span>
                       </div>
                       
                       <button 
                          onClick={() => addToCart(product)}
                          className="bg-[#7B112C] hover:bg-[#a1183a] text-white p-1.5 rounded-lg border border-[#D4AF37]/30 hover:border-[#D4AF37] transition-all flex items-center justify-center"
                          title="Adicionar ao carrinho"
                       >
                          <Plus className="w-4 h-4" />
                       </button>
                     </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="p-12 text-center text-gray-500 bg-[#121212] border border-white/5 rounded-2xl mt-4">
              <Wine className="w-10 h-10 mx-auto opacity-20 mb-3" />
              <p className="text-xs font-sans">Nenhum produto encontrado nesta categoria de bebidas.</p>
            </div>
          )}
        </div>
      </main>

      {/* FOOTER SECTION: WINERY ADDRESS & CONTACTS */}
      <footer className="border-t border-white/5 bg-[#0e0e0e] py-12 mt-16 text-xs text-gray-400">
        <div className="max-w-6xl mx-auto px-4 md:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Winery Identity */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Wine className="w-5 h-5 text-[#D4AF37]" />
              <span className="font-serif italic text-lg text-white font-bold tracking-tight">
                {currentConfig?.name || 'Adega Delivery'}
              </span>
            </div>
            <p className="text-gray-500 leading-relaxed max-w-sm">
              Sua adega premium e clube VIP integrados. Oferecemos as melhores safras, bebidas selecionadas e atendimento ágil direto no seu endereço.
            </p>
          </div>

          {/* Winery Details & Contacts */}
          <div className="space-y-4">
            <h4 className="text-[#D4AF37] font-bold uppercase tracking-widest text-[11px]">Contatos & Atendimento</h4>
            <ul className="space-y-3 font-sans">
              {currentConfig?.phone && (
                <li className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-300 font-mono">{currentConfig.phone}</span>
                </li>
              )}
              {currentConfig?.email && (
                <li className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-300">{currentConfig.email}</span>
                </li>
              )}
              {currentConfig?.cnpj && (
                <li className="flex items-center gap-2.5">
                  <span className="text-[10px] font-bold text-gray-500 bg-white/5 px-1.5 py-0.5 rounded font-mono">CNPJ</span>
                  <span className="text-gray-350 font-mono">{currentConfig.cnpj}</span>
                </li>
              )}
            </ul>
          </div>

          {/* Location & Address */}
          <div className="space-y-4">
            <h4 className="text-[#D4AF37] font-bold uppercase tracking-widest text-[11px]">Localização</h4>
            <ul className="space-y-3 leading-relaxed">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                <span className="text-gray-300">
                  {currentConfig?.address || 'Endereço Comercial da Adega não cadastrado.'}
                </span>
              </li>
              <li className="text-[10px] text-gray-500">
                Fidelidade & Praticidade: Acumule pontos e aproveite descontos exclusivos sendo um cliente habitual!
              </li>
            </ul>
          </div>

        </div>

        {/* Brand Copyright */}
        <div className="max-w-6xl mx-auto px-4 md:px-8 border-t border-white/5 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-gray-500">
          <p>© {new Date().getFullYear()} {currentConfig?.name || 'Adega Delivery'}. Todos os direitos reservados.</p>
          <div className="flex gap-4">
            <span className="uppercase tracking-widest font-mono text-[9px]">AdegaPro Web App</span>
          </div>
        </div>
      </footer>

      {/* Cart Sidebar */}
      <AnimatePresence>
        {cartOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setCartOpen(false)}
            />
            
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-[#121212] h-full shadow-2xl flex flex-col border-l border-white/10"
            >
              {/* Cart Header */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-[#0a0a0a]">
                 <h2 className="text-xl font-serif italic text-white flex items-center gap-2">
                   <ShoppingCart className="w-5 h-5 text-[#D4AF37]" />
                   Seu Carrinho
                 </h2>
                 <button onClick={() => setCartOpen(false)} className="text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/5">
                   <X className="w-5 h-5" />
                 </button>
              </div>

              {checkoutStep === 'cart' && (
                <>
                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {cartItems.length === 0 ? (
                      <div className="text-center text-gray-500 mt-10">
                        <ShoppingCart className="w-12 h-12 mx-auto opacity-20 mb-4" />
                        <p>Seu carrinho está vazio.</p>
                      </div>
                    ) : (
                      cartItems.map(item => (
                        <div key={item.product.id} className="flex gap-4 items-center bg-[#1E1E1E] p-3 rounded-xl border border-white/5">
                           <div className="w-16 h-16 bg-white/5 rounded-lg p-2 flex items-center justify-center shrink-0">
                             {item.product.image ? (
                               <img src={item.product.image} alt={item.product.name} className="max-h-full object-contain" />
                             ) : (
                               <Wine className="w-6 h-6 text-gray-600" />
                             )}
                           </div>
                           <div className="flex-1">
                             <p className="text-xs font-bold text-gray-200 line-clamp-1">{item.product.name}</p>
                             <p className="text-xs text-[#D4AF37] font-mono mt-1">R$ {(item.product.salePrice * item.quantity).toFixed(2)}</p>
                           </div>
                           <div className="flex items-center gap-3 bg-[#0a0a0a] rounded-lg px-2 py-1">
                              <button onClick={() => updateQuantity(item.product.id, -1)} className="text-gray-400 hover:text-white p-1"><Minus className="w-3 h-3" /></button>
                              <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.product.id, 1)} className="text-[#D4AF37] p-1"><Plus className="w-3 h-3" /></button>
                           </div>
                        </div>
                      ))
                    )}
                  </div>

                  {cartItems.length > 0 && (
                    <div className="p-6 bg-[#0a0a0a] border-t border-white/5 space-y-4">
                       {/* Coupon Block */}
                       <div className="bg-[#1E1E1E] p-3 rounded-xl border border-white/5 space-y-2">
                         <div className="flex justify-between items-center text-xs">
                           <span className="text-gray-400 font-bold flex items-center gap-1.5"><Tag className="w-3.5 h-3.5 text-[#D4AF37]" /> Cupom de Desconto</span>
                           {appliedCoupon && (
                             <span className="text-emerald-400 font-bold">Aplicado!</span>
                           )}
                         </div>
                         <div className="flex gap-2">
                           <input
                             type="text"
                             placeholder="Ex: VINHO10"
                             className="flex-1 bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white uppercase focus:outline-none focus:border-[#D4AF37]"
                             value={couponCode}
                             onChange={(e) => setCouponCode(e.target.value)}
                             disabled={!!appliedCoupon}
                           />
                           {appliedCoupon ? (
                             <button
                               onClick={() => {
                                 setAppliedCoupon(null);
                                 setCouponCode('');
                               }}
                               className="bg-red-500/10 text-red-400 hover:bg-red-500/20 text-[10px] font-bold uppercase px-3 py-1.5 rounded-lg border border-red-500/20 transition-all"
                             >
                               Remover
                             </button>
                           ) : (
                             <button
                               onClick={handleApplyCoupon}
                               className="bg-[#D4AF37] text-black hover:bg-[#ebd074] text-[10px] font-bold uppercase px-4 py-1.5 rounded-lg transition-all"
                             >
                               Aplicar
                             </button>
                           )}
                         </div>
                         {couponError && (
                           <p className="text-[10px] text-red-500">{couponError}</p>
                         )}
                         {appliedCoupon && (
                           <p className="text-[10px] text-emerald-400">
                             Desconto de {appliedCoupon.discountType === 'percentage' ? `${appliedCoupon.discountValue}%` : `R$ ${appliedCoupon.discountValue.toFixed(2)}`}
                           </p>
                         )}
                       </div>

                       <div className="flex justify-between items-center text-xs text-gray-400">
                         <span>Subtotal</span>
                         <span className="font-mono">R$ {getSubtotal().toFixed(2)}</span>
                       </div>
                       {appliedCoupon && getDiscountAmount() > 0 && (
                         <div className="flex justify-between items-center text-xs text-emerald-400">
                           <span>Desconto do Cupom</span>
                           <span className="font-mono">- R$ {getDiscountAmount().toFixed(2)}</span>
                         </div>
                       )}
                       <div className="flex justify-between items-center text-xs text-gray-400">
                         <span>Taxa de Entrega</span>
                         <span className="font-mono">R$ {currentConfig?.deliveryTaxa?.toFixed(2) || '15.00'}</span>
                       </div>
                       <div className="h-px bg-white/10 my-2"></div>
                       <div className="flex justify-between items-center pb-2">
                         <span className="font-bold text-white uppercase text-xs tracking-wider">Total</span>
                         <span className="font-mono text-xl font-bold text-[#D4AF37]">R$ {getTotal().toFixed(2)}</span>
                       </div>
                       <button 
                         onClick={() => setCheckoutStep('address')}
                         className="w-full bg-[#D4AF37] text-black font-bold uppercase tracking-widest text-xs py-4 rounded-xl hover:bg-[#ebd074] transition-all"
                       >
                         Continuar para Entrega
                       </button>
                    </div>
                  )}
                </>
              )}

              {checkoutStep === 'address' && (
                <div className="flex-1 overflow-y-auto p-6 flex flex-col">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-6 flex items-center gap-2"><Truck className="w-4 h-4"/> Dados de Entrega</h3>
                  
                  <div className="space-y-4 flex-1">
                    <div>
                      <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Nome Completo</label>
                      <input 
                        type="text" 
                        value={checkoutData.name} onChange={e => setCheckoutData({...checkoutData, name: e.target.value})}
                        className="w-full bg-[#1E1E1E] mt-1 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#D4AF37]/50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">WhatsApp</label>
                      <input 
                        type="text" 
                        value={checkoutData.phone} onChange={e => setCheckoutData({...checkoutData, phone: e.target.value})}
                        className="w-full bg-[#1E1E1E] mt-1 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#D4AF37]/50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Cidade</label>
                      <input 
                        type="text" 
                        placeholder="Ex: São Paulo"
                        value={checkoutData.city} onChange={e => setCheckoutData({...checkoutData, city: e.target.value})}
                        className="w-full bg-[#1E1E1E] mt-1 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:border-[#D4AF37]/50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Endereço Completo</label>
                      <textarea 
                        rows={3}
                        value={checkoutData.address} onChange={e => setCheckoutData({...checkoutData, address: e.target.value})}
                        placeholder="Rua, Número, Bairro, Referência..."
                        className="w-full bg-[#1E1E1E] mt-1 border border-[#636c74]/20 rounded-xl px-4 py-3 text-white text-sm focus:border-[#D4AF37]/50 focus:outline-none resize-none"
                      />
                    </div>
                  </div>

                  <div className="pt-6 mt-6 border-t border-white/5 space-y-3">
                    <button onClick={() => setCheckoutStep('cart')} className="w-full bg-transparent border border-white/10 text-white font-bold uppercase tracking-widest text-xs py-4 rounded-xl hover:bg-white/5 transition-all">
                      Voltar ao Carrinho
                    </button>
                    <button 
                      onClick={() => {
                        const available = currentConfig?.acceptedPayments || ['pix', 'cartao_credito', 'cartao_debito', 'dinheiro'];
                        const methodToSet = available.includes(checkoutData.method) ? checkoutData.method : (available[0] || 'pix');
                        setCheckoutData({ ...checkoutData, method: methodToSet });
                        setCheckoutStep('payment');
                      }} 
                      className="w-full bg-[#D4AF37] text-black font-bold uppercase tracking-widest text-xs py-4 rounded-xl hover:bg-[#ebd074] transition-all"
                    >
                      Ir para Pagamento
                    </button>
                  </div>
                </div>
              )}

              {checkoutStep === 'payment' && (
                <div className="flex-1 overflow-y-auto p-6 flex flex-col">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-6 flex items-center gap-2"><CreditCard className="w-4 h-4"/> Método de Pagamento</h3>
                  
                  <div className="space-y-3 flex-1">
                     {(!currentConfig?.acceptedPayments || currentConfig.acceptedPayments.includes('pix')) && (
                       <label className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${checkoutData.method === 'pix' ? 'bg-[#D4AF37]/10 border-[#D4AF37]' : 'bg-[#1E1E1E] border-white/5'}`}>
                         <input type="radio" name="payment" checked={checkoutData.method === 'pix'} onChange={() => setCheckoutData({...checkoutData, method: 'pix'})} className="hidden" />
                         <QrCode className={`w-6 h-6 ${checkoutData.method === 'pix' ? 'text-[#D4AF37]' : 'text-gray-400'}`} />
                         <div>
                           <p className="font-bold text-white text-sm">Pix</p>
                           <p className="text-[10px] text-[#D4AF37]">Pague para liberar o envio imediato</p>
                         </div>
                       </label>
                     )}

                     {(!currentConfig?.acceptedPayments || currentConfig.acceptedPayments.includes('cartao_credito')) && (
                       <label className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${checkoutData.method === 'cartao_credito' ? 'bg-[#D4AF37]/10 border-[#D4AF37]' : 'bg-[#1E1E1E] border-white/5'}`}>
                         <input type="radio" name="payment" checked={checkoutData.method === 'cartao_credito'} onChange={() => setCheckoutData({...checkoutData, method: 'cartao_credito'})} className="hidden" />
                         <CreditCard className={`w-6 h-6 ${checkoutData.method === 'cartao_credito' ? 'text-[#D4AF37]' : 'text-gray-400'}`} />
                         <div>
                           <p className="font-bold text-white text-sm">Cartão de Crédito</p>
                           <p className="text-[10px] text-gray-500">Pague na Entrega (Maquininha)</p>
                         </div>
                       </label>
                     )}

                     {(!currentConfig?.acceptedPayments || currentConfig.acceptedPayments.includes('cartao_debito')) && (
                       <label className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${checkoutData.method === 'cartao_debito' ? 'bg-[#D4AF37]/10 border-[#D4AF37]' : 'bg-[#1E1E1E] border-white/5'}`}>
                         <input type="radio" name="payment" checked={checkoutData.method === 'cartao_debito'} onChange={() => setCheckoutData({...checkoutData, method: 'cartao_debito'})} className="hidden" />
                         <CreditCard className={`w-6 h-6 ${checkoutData.method === 'cartao_debito' ? 'text-[#D4AF37]' : 'text-gray-400'}`} />
                         <div>
                           <p className="font-bold text-white text-sm">Cartão de Débito</p>
                           <p className="text-[10px] text-gray-500">Pague na Entrega (Maquininha)</p>
                         </div>
                       </label>
                     )}

                     {(!currentConfig?.acceptedPayments || currentConfig.acceptedPayments.includes('dinheiro')) && (
                       <label className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-colors ${checkoutData.method === 'dinheiro' ? 'bg-[#D4AF37]/10 border-[#D4AF37]' : 'bg-[#1E1E1E] border-white/5'}`}>
                         <input type="radio" name="payment" checked={checkoutData.method === 'dinheiro'} onChange={() => setCheckoutData({...checkoutData, method: 'dinheiro'})} className="hidden" />
                         <Wallet className={`w-6 h-6 ${checkoutData.method === 'dinheiro' ? 'text-[#D4AF37]' : 'text-gray-400'}`} />
                         <div>
                           <p className="font-bold text-white text-sm">Dinheiro</p>
                           <p className="text-[10px] text-gray-500">Pague em dinheiro físico na entrega</p>
                         </div>
                       </label>
                     )}
                  </div>

                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex gap-3 text-emerald-400 text-xs mb-6 mt-4">
                    <ShieldCheck className="w-5 h-5 shrink-0" />
                    <p>Ambiente seguro. Pagamentos selecionados e processados diretamente com a adega parceira.</p>
                  </div>

                  <div className="pt-6 border-t border-white/5 space-y-3">
                    <button onClick={() => setCheckoutStep('address')} className="w-full bg-transparent border border-white/10 text-white font-bold uppercase tracking-widest text-xs py-4 rounded-xl hover:bg-white/5 transition-all">
                      Voltar
                    </button>
                    <button onClick={handleCheckout} className="w-full bg-[#D4AF37] text-black font-bold uppercase tracking-widest text-xs py-4 rounded-xl hover:bg-[#ebd074] transition-all">
                      Finalizar Pedido • R$ {getTotal().toFixed(2)}
                    </button>
                  </div>
                </div>
              )}

              {checkoutStep === 'success' && placedOrder && (
                <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center text-center space-y-4">
                   <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/30">
                      <CheckCircle className="w-10 h-10 text-emerald-400" />
                   </div>
                   <h2 className="text-2xl font-serif text-white italic mt-4">Pedido Confirmado!</h2>
                   <p className="text-sm text-gray-400">Seu pedido <strong className="text-[#D4AF37]">#{(placedOrder.id || '').slice(-6).toUpperCase()}</strong> foi recebido pela adega e está sendo preparado.</p>

                   {placedOrder.paymentMethod === 'pix' && (
                      <div className="w-full bg-[#1A0A0E] border border-[#D4AF37]/30 rounded-2xl p-5 text-left max-w-sm mt-4">
                         <p className="text-xs uppercase tracking-wider text-[#D4AF37] font-bold mb-2 font-sans">Realizar Pagamento via Pix:</p>
                         <p className="text-[10px] text-gray-400 mb-3 leading-relaxed">
                           Para confirmar seu pedido, transfira o total de <strong className="text-white">R$ {placedOrder.total.toFixed(2)}</strong> diretamente para a chave Pix da adega abaixo:
                         </p>
                         
                         <div className="bg-[#0c0c0c] p-3 rounded-xl border border-white/5 font-mono text-[11px] text-white flex items-center justify-between gap-2 overflow-hidden mb-3">
                            <span className="truncate select-all">{currentConfig?.pixKey || currentConfig?.cnpj || 'Chave Pix da Adega'}</span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(currentConfig?.pixKey || currentConfig?.cnpj || '');
                                alert('Chave Pix copiada para a área de transferência!');
                              }}
                              className="text-[10px] bg-[#D4AF37] hover:bg-[#ebd074] text-black font-bold uppercase px-3 py-1.5 rounded-lg transition-all shrink-0 cursor-pointer"
                            >
                              Copiar Chave
                            </button>
                         </div>
                         
                         <p className="text-[10px] text-gray-500 italic text-center font-serif">
                           A adega iniciará a preparação de seu pedido assim que o Pix for aprovado.
                         </p>
                      </div>
                   )}
                   
                   <div className="w-full bg-[#1E1E1E] border border-white/10 rounded-xl p-6 mt-6 max-w-sm">
                      <div className="flex items-center justify-center gap-3 text-[#D4AF37] mb-4">
                         <Smartphone className="w-5 h-5" />
                         <span className="font-bold text-xs uppercase tracking-widest">Acompanhe seu pedido</span>
                      </div>
                      <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-[#D4AF37] before:via-white/10 before:to-transparent">
                          <div className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group `}>
                              <div className="flex items-center justify-center w-4 h-4 rounded-full bg-[#D4AF37] border-4 border-[#121212] z-10 shrink-0 mx-4 shadow-[0_0_10px_#D4AF37]"></div>
                              <div className="w-full font-bold text-xs text-white">Recebido</div>
                          </div>
                          <div className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group ${['preparando', 'saiu_entrega', 'entregue'].includes(placedOrder.status) ? '' : 'opacity-30'}`}>
                              <div className={`flex items-center justify-center w-4 h-4 rounded-full border-4 border-[#121212] z-10 shrink-0 mx-4 ${['preparando', 'saiu_entrega', 'entregue'].includes(placedOrder.status) ? 'bg-[#D4AF37] shadow-[0_0_10px_#D4AF37]' : 'bg-gray-600'}`}></div>
                              <div className={`w-full font-bold text-xs ${['preparando', 'saiu_entrega', 'entregue'].includes(placedOrder.status) ? 'text-white' : 'text-gray-500'}`}>Preparando</div>
                          </div>
                          <div className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group ${['saiu_entrega', 'entregue'].includes(placedOrder.status) ? '' : 'opacity-30'}`}>
                              <div className={`flex items-center justify-center w-4 h-4 rounded-full border-4 border-[#121212] z-10 shrink-0 mx-4 ${['saiu_entrega', 'entregue'].includes(placedOrder.status) ? 'bg-[#D4AF37] shadow-[0_0_10px_#D4AF37]' : 'bg-gray-600'}`}></div>
                              <div className={`w-full font-bold text-xs ${['saiu_entrega', 'entregue'].includes(placedOrder.status) ? 'text-white' : 'text-gray-500'}`}>Saiu p/ Entrega</div>
                          </div>
                          <div className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group ${['entregue'].includes(placedOrder.status) ? '' : 'opacity-30'}`}>
                              <div className={`flex items-center justify-center w-4 h-4 rounded-full border-4 border-[#121212] z-10 shrink-0 mx-4 ${['entregue'].includes(placedOrder.status) ? 'bg-emerald-500 shadow-[0_0_10px_#10B981]' : 'bg-gray-600'}`}></div>
                              <div className={`w-full font-bold text-xs ${['entregue'].includes(placedOrder.status) ? 'text-emerald-400' : 'text-gray-500'}`}>Entregue</div>
                          </div>
                      </div>
                   </div>

                   <button 
                     onClick={() => {
                       setCartOpen(false);
                       setTimeout(() => setCheckoutStep('cart'), 500);
                     }}
                     className="mt-8 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold uppercase tracking-widest text-xs px-8 py-3 rounded-xl transition-all"
                   >
                     Continuar Comprando
                   </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* VIP CLIENT LOGIN MODAL */}
      <AnimatePresence>
        {showLoginModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLoginModal(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-sm"
            />
            
            {/* Modal Body */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-[#121212] border border-[#D4AF37]/20 rounded-2xl p-8 w-full max-w-sm relative z-10 text-center shadow-2xl"
            >
              <button 
                onClick={() => setShowLoginModal(false)}
                className="absolute top-4 right-4 p-1.5 hover:bg-white/5 rounded-full text-gray-500 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-14 h-14 bg-[#7B112C] rounded-full flex items-center justify-center border border-[#D4AF37] mx-auto mb-4 mt-2">
                <User className="w-6 h-6 text-[#D4AF37]" />
              </div>
              <h2 className="text-2xl font-serif text-white italic mb-1">Clube de Vantagens</h2>
              <p className="text-[10px] uppercase tracking-widest text-[#D4AF37] mb-4 font-bold">Acesso Cliente</p>
              
              <p className="text-gray-400 text-xs leading-relaxed mb-6">
                Entre com sua Conta Google para resgatar cupons promocionais automáticos, gerenciar seus pedidos em tempo real e acumular pontos de fidelidade resgatáveis!
              </p>

              <button
                type="button"
                onClick={async () => {
                  try {
                    await signInWithGoogle('cliente');
                    setShowLoginModal(false);
                  } catch (e) {
                    console.error("Error signing in: ", e);
                  }
                }}
                className="w-full bg-[#1E1E1E] hover:bg-white/5 border border-white/10 text-white font-bold tracking-wide text-xs py-3.5 rounded-xl flex items-center justify-center gap-2.5 transition-all shadow-md uppercase cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.65 1.58 14.99 1 12 1 7.39 1 3.4 3.65 1.44 7.5L5 10.26C5.83 7.21 8.65 5.04 12 5.04z" />
                  <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.43 3.59l3.77 2.92c2.2-2.03 3.49-5.04 3.49-8.66z" />
                  <path fill="#FBBC05" d="M5 13.74c-.21-.63-.33-1.3-.33-2s.12-1.37.33-2L1.44 6.98C.52 8.84 0 10.87 0 13c0 2.13.52 4.16 1.44 6.02l3.56-2.76-1-.52z" />
                  <path fill="#34A853" d="M12 23c3.24 0 5.97-1.08 7.96-2.91l-3.77-2.92c-1.07.72-2.45 1.15-4.19 1.15-3.35 0-6.17-2.17-7-5.22L1.44 15.82C3.4 19.67 7.39 22 12 23z" />
                </svg>
                <span>Conectar com Google</span>
              </button>

              <div className="mt-8 pt-4 border-t border-white/5 flex flex-col items-center">
                <span className="text-[10px] text-gray-500 font-semibold mb-2">Dono de adega ou estabelecimento?</span>
                <a 
                  href="/admin" 
                  className="text-[10px] text-[#D4AF37] hover:underline uppercase tracking-wider font-bold"
                >
                  Entrar no Painel Administrativo ➜
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* VIP REWARDS & ORDERS PROFILE DRAWER */}
      <AnimatePresence>
        {showProfileDrawer && user && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowProfileDrawer(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-xs"
            />

            {/* Slide-out Drawer */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-md bg-[#121212] border-l border-white/5 h-full relative z-10 flex flex-col shadow-2xl"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || ''} className="w-10 h-10 rounded-full border-2 border-[#D4AF37]" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#7B112C] text-[#D4AF37] flex items-center justify-center border border-[#D4AF37]/50 font-bold">
                      {user.displayName?.slice(0, 1) || 'C'}
                    </div>
                  )}
                  <div>
                    <h3 className="font-serif italic text-white text-lg">{user.displayName || 'Cliente'}</h3>
                    <span className="text-[9px] uppercase tracking-wider text-[#D4AF37] font-semibold">Membro do Clube de Vantagens</span>
                  </div>
                </div>
                <button 
                  onClick={() => setShowProfileDrawer(false)}
                  className="p-1 px-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-gray-400 hover:text-white text-xs font-bold transition"
                >
                  Fechar
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* LOYALTY CARD SECTION */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-[#7B112C]/40 to-[#4a0a19]/20 border border-[#D4AF37]/30 shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 opacity-10">
                    <Wine className="w-24 h-24 text-[#D4AF37]" />
                  </div>
                  
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-[9px] font-bold text-[#D4AF37] bg-[#7B112C] px-2 py-0.5 rounded uppercase tracking-wider">Premium Member</span>
                      <p className="text-2xl font-mono text-white font-bold mt-2">
                        {Math.floor(
                          userOrders
                            .filter(o => o.status === 'entregue')
                            .reduce((acc, curr) => acc + curr.total, 0) / 10
                        )} <span className="text-xs text-gray-300 font-sans">Pts</span>
                      </p>
                      <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wide">Pontos de Cashback acumulados</p>
                    </div>
                  </div>

                  <div className="w-full bg-white/5 rounded-full h-1.5 mt-6 mb-2">
                    <div 
                      className="bg-[#D4AF37] h-1.5 rounded-full" 
                      style={{ 
                        width: `${Math.min(100, (userOrders.filter(o => o.status === 'entregue').reduce((acc, curr) => acc + curr.total, 0) % 100))}%` 
                      }} 
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-[#D4AF37] font-bold uppercase tracking-wide">
                    <span>Nível Sommelier</span>
                    <span>Progresso p/ Próxima Garrafa Cortesia</span>
                  </div>
                </div>

                {/* ACTIVE SPECIAL BENEFITS / COUPONS */}
                <div>
                  <h4 className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-3.5 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-[#D4AF37]" /> Seus Cupons do Clube
                  </h4>
                  <div className="space-y-2.5">
                    {couponsList.length === 0 ? (
                      <div className="p-4 rounded-xl border border-white/5 text-center text-xs text-gray-500">
                        Nenhum cupom ativo no momento para esta adega. Cadastre novos cupons no painel do dono!
                      </div>
                    ) : (
                      couponsList.map(coupon => (
                        <div key={coupon.id} className="p-4 rounded-xl bg-white/5 border border-[#D4AF37]/20 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold font-mono text-[#D4AF37] uppercase tracking-wider">{coupon.code}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              {coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `R$ ${coupon.discountValue.toFixed(2)} de desconto`}
                            </p>
                            <p className="text-[9px] text-gray-500">Mín: R$ {coupon.minOrderValue.toFixed(2)}</p>
                          </div>
                          <button 
                            onClick={() => {
                              setCouponCode(coupon.code);
                              alert(`Cupom ${coupon.code} selecionado! Abra o carrinho e aplique-o na finalização.`);
                            }}
                            className="text-[10px] hover:bg-[#D4AF37] hover:text-black border border-[#D4AF37]/50 px-2.5 py-1 rounded transition text-[#D4AF37] uppercase tracking-wider font-bold cursor-pointer font-sans"
                          >
                            Usar
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* MY ORDERS TRACKING (REAL-TIME) */}
                <div>
                  <h4 className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-3.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#D4AF37]" /> Acompanhamento de Pedidos ({userOrders.length})
                  </h4>
                  {userOrders.length === 0 ? (
                    <div className="p-8 text-center bg-white/2 border border-white/5 rounded-2xl text-gray-500 text-xs">
                      Nenhum pedido efetuado ainda. Comece a comprar para acumular recompensas!
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {userOrders.map(order => (
                        <div key={order.id} className="p-4 rounded-xl bg-white/3 border border-white/5 hover:border-white/10 transition-colors">
                          <div className="flex justify-between items-start mb-2.5">
                            <div>
                              <p className="text-xs font-bold text-white mb-0.5">Pedido #{(order.id || '').slice(-6).toUpperCase()}</p>
                              <p className="text-[10px] text-gray-500">{new Date(order.createdAt).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                            <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                              order.status === 'entregue' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                              order.status === 'cancelado' ? 'bg-red-500/10 text-red-400 border border-red-500/30' :
                              order.status === 'saiu_entrega' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30 animate-pulse' :
                              'bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 animate-pulse'
                            }`}>
                              {order.status === 'recebido' ? 'Recebido' :
                               order.status === 'preparando' ? 'Preparando' :
                               order.status === 'saiu_entrega' ? 'A Caminho' :
                               order.status === 'entregue' ? 'Entregue' : 'Cancelado'}
                            </span>
                          </div>

                          {/* List short summary items */}
                          <div className="border-t border-white/5 pt-2 mt-2 text-[11px] text-gray-400 space-y-1.5">
                            {(order.items || []).slice(0, 2).map((it, idx) => (
                              <p key={idx} className="flex justify-between">
                                <span>{it.quantity}x {it.name}</span>
                                <span>R$ {(it.price * it.quantity).toFixed(2)}</span>
                              </p>
                            ))}
                            {(order.items || []).length > 2 && (
                              <p className="text-[9px] text-[#D4AF37] tracking-wide">+ {(order.items || []).length - 2} mais itens</p>
                            )}
                          </div>

                          <div className="flex justify-between items-center text-xs mt-3 pt-2.5 border-t border-white/5 font-bold text-white">
                            <span>TOTAL</span>
                            <span className="text-[#D4AF37]">R$ {order.total.toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* MY PROFILE SETTINGS FORM */}
                <div className="border-t border-white/5 pt-6" id="my-profile-settings-form-block">
                  <h4 className="text-xs uppercase tracking-widest font-bold text-gray-400 mb-3.5 flex items-center gap-1.5">
                    <Settings className="w-3.5 h-3.5 text-[#D4AF37]" /> Configurações do Perfil (Meu Endereço)
                  </h4>
                  
                  <form onSubmit={handleSaveProfile} className="space-y-4 bg-white/2 p-4 rounded-2xl border border-white/5">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">Seu Nome</label>
                      <input 
                        type="text" 
                        value={profileForm.name} 
                        onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                        required
                        className="w-full bg-[#1e1e1e] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]" 
                        placeholder="Ex: João Silva"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">WhatsApp / Telefone</label>
                      <input 
                        type="text" 
                        value={profileForm.phone} 
                        onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                        required
                        className="w-full bg-[#1e1e1e] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]" 
                        placeholder="Ex: (11) 99999-9999"
                      />
                    </div>

                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 mb-1.5">
                        <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400">Endereço de Entrega (Rua, Número, Bairro)</label>
                        <button
                          type="button"
                          id="btn-localizar-endereco-perfil"
                          onClick={handleDetectProfileAddress}
                          disabled={savingProfile}
                          className="self-start text-[9px] text-[#D4AF37] hover:text-black hover:bg-[#D4AF37] transition-all font-bold uppercase tracking-widest flex items-center gap-1.5 bg-[#D4AF37]/10 border border-[#D4AF37]/35 rounded px-2.5 py-1 disabled:opacity-50 cursor-pointer"
                        >
                          📍 Localizar meu endereço
                        </button>
                      </div>
                      <input 
                        type="text" 
                        value={profileForm.address} 
                        onChange={e => setProfileForm({ ...profileForm, address: e.target.value })}
                        required
                        className="w-full bg-[#1e1e1e] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]" 
                        placeholder="Ex: Av. Paulista, 1000 - Bela Vista"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1">Cidade / Estado</label>
                      <input 
                        type="text" 
                        value={profileForm.city} 
                        onChange={e => setProfileForm({ ...profileForm, city: e.target.value })}
                        required
                        className="w-full bg-[#1e1e1e] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]" 
                        placeholder="Ex: São Paulo - SP"
                      />
                    </div>

                    {profileMessage && (
                      <div className={`p-3 rounded-lg text-xs font-semibold ${
                        profileMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-sans' : 'bg-red-500/10 text-red-400 border border-red-500/30 font-sans'
                      }`}>
                        {profileMessage.text}
                      </div>
                    )}

                    <button 
                      type="submit" 
                      disabled={savingProfile}
                      className="w-full bg-[#D4AF37] hover:bg-[#c2a032] text-black font-bold uppercase tracking-widest text-xs py-2.5 rounded-xl transition duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {savingProfile ? 'Salvando...' : 'Salvar Configurações'}
                    </button>
                  </form>
                </div>

              </div>

              {/* Drawer Footer */}
              <div className="p-6 border-t border-white/5 bg-[#0e0e0e] flex items-center justify-between">
                <button 
                  onClick={async () => {
                    await logOut();
                    setShowProfileDrawer(false);
                  }}
                  className="flex items-center gap-2 text-xs text-red-400 hover:text-red-300 uppercase tracking-widest font-bold transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Sair da Conta
                </button>
                <span className="text-[9px] text-gray-500 font-mono tracking-widest">ADEGAPRO VIP V1</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
